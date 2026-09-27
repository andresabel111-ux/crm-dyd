// Endpoint único de la herramienta (Vercel serverless, Node 20+).
// Acciones:
//   acceso   -> valida el código de acceso del cliente
//   iniciar  -> recibe el documento ya segmentado por el navegador y crea la auditoría
//   paso     -> ejecuta un paso del agente sobre el estado sellado
// La API key de Anthropic vive solo en el servidor (variable de entorno).

import Anthropic from "@anthropic-ai/sdk";
import { iniciarAuditoria, ejecutarPaso, construirInforme, configuracion } from "../lib/agente.js";
import { sellar, abrir } from "../lib/estado.js";
import { TIPOS_DOCUMENTO } from "../lib/marco.js";
import { resumenDocumento } from "../lib/extraer.js";

const MAX_CARACTERES = 1_600_000;

// Punto de inyección para pruebas locales (scripts/servidor.js con MOCK_IA=1).
export const fabrica = { cliente: () => new Anthropic({ timeout: 280_000, maxRetries: 2 }) };

function validarCodigo(codigo) {
  let tabla = {};
  try {
    tabla = JSON.parse(process.env.ACCESS_CODES || "{}");
  } catch {
    throw Object.assign(new Error("ACCESS_CODES mal configurado en el servidor."), { status: 500 });
  }
  const c = tabla[String(codigo || "").trim()];
  if (!c) throw Object.assign(new Error("Código de acceso inválido."), { status: 401 });
  if (c.vence && new Date(`${c.vence}T23:59:59`) < new Date()) {
    throw Object.assign(new Error("Código de acceso vencido."), { status: 401 });
  }
  return c.cliente || "Cliente";
}

function validarSegmentos(segmentos) {
  if (!Array.isArray(segmentos) || !segmentos.length) throw Object.assign(new Error("El documento no tiene contenido legible."), { status: 400 });
  let total = 0;
  const limpios = segmentos.slice(0, 60).map((s, i) => {
    if (typeof s.original !== "string" || !Array.isArray(s.partes)) throw Object.assign(new Error("Formato de segmentos inválido."), { status: 400 });
    total += s.original.length;
    return {
      id: `S${i + 1}`,
      nombre: String(s.nombre || `Segmento ${i + 1}`).slice(0, 120),
      original: s.original,
      partes: s.partes.map(String),
    };
  });
  if (total > MAX_CARACTERES) throw Object.assign(new Error(`Documento demasiado grande (${total.toLocaleString("es-CL")} caracteres; máximo ${MAX_CARACTERES.toLocaleString("es-CL")}). Divídalo por hojas o secciones.`), { status: 413 });
  if (total < 200) throw Object.assign(new Error("El documento casi no tiene texto. Si es un PDF escaneado, conviértalo con OCR antes de auditarlo."), { status: 400 });
  return limpios;
}

function progreso(estado, desde) {
  return {
    fin: estado.fin,
    pasos: estado.pasos,
    usd: Math.round(estado.uso.usd * 1000) / 1000,
    evaluaciones: Object.keys(estado.evaluaciones).length,
    hallazgos: estado.hallazgos.length,
    bitacora: estado.bitacora.slice(desde),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const cuerpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  try {
    const cliente = validarCodigo(cuerpo.codigo);

    if (cuerpo.accion === "acceso") {
      return res.status(200).json({ ok: true, cliente, tipos: TIPOS_DOCUMENTO });
    }

    if (cuerpo.accion === "iniciar") {
      const segmentos = validarSegmentos(cuerpo.segmentos);
      const tipo = TIPOS_DOCUMENTO[cuerpo.tipo] ? cuerpo.tipo : "otro";
      const estado = iniciarAuditoria({
        archivo: String(cuerpo.archivo || "documento").slice(0, 200),
        tipo,
        contexto: String(cuerpo.contexto || "").slice(0, 1500),
        segmentos,
        cliente,
      });
      return res.status(200).json({
        estado: sellar(estado),
        documento: resumenDocumento(segmentos),
        preanalisis: estado.pre,
        progreso: progreso(estado, 0),
      });
    }

    if (cuerpo.accion === "paso") {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.MOCK_IA) throw Object.assign(new Error("ANTHROPIC_API_KEY no configurada en el servidor."), { status: 500 });
      const estado = abrir(cuerpo.estado);
      if (estado.cliente !== cliente) throw Object.assign(new Error("La auditoría pertenece a otro código de acceso."), { status: 403 });
      const desde = estado.bitacora.length;
      await ejecutarPaso(estado, fabrica.cliente(), configuracion());
      const respuesta = { estado: sellar(estado), progreso: progreso(estado, desde) };
      if (estado.fin) respuesta.informe = construirInforme(estado);
      return res.status(200).json(respuesta);
    }

    return res.status(400).json({ error: "Acción desconocida." });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(503).json({ error: "Límite de uso de la IA alcanzado. Reintentando…", reintentar: true });
    if (e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) {
      return res.status(503).json({ error: "Servicio de IA no disponible momentáneamente. Reintentando…", reintentar: true });
    }
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "API key de Anthropic inválida en el servidor." });
    if (e instanceof Anthropic.BadRequestError) return res.status(500).json({ error: `Solicitud rechazada por la API: ${e.message}` });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `Error de la API (${e.status}): ${e.message}` });
    const status = e.status || 500;
    if (!e.status) console.error(e);
    return res.status(status).json({ error: e.message || "Error interno." });
  }
}
