// Arnés agéntico de auditoría.
//
// Diseño: el agente (Claude) decide qué leer y qué evaluar, pero el arnés
// controla todo lo verificable:
//  - Las herramientas leen el documento por partes (no se envía completo).
//  - Toda afirmación de cumplimiento debe traer una cita literal del documento;
//    el arnés la busca y rechaza citas inventadas.
//  - El veredicto (habilita / no habilita) lo calcula el código, no el modelo:
//    un solo control crítico sin cumplir => la tarea NO queda habilitada.
//  - Límites duros de pasos y costo por auditoría.
//
// Se ejecuta de a un paso por llamada HTTP (ver api/auditar.js) para no chocar
// con el límite de duración de las funciones serverless.

import { MARCO, MARCO_VERSION, TIPOS_DOCUMENTO, buscarRF } from "./marco.js";
import { normalizar } from "./extraer.js";
import { preanalizar, preanalisisATexto } from "./preanalisis.js";

const PRECIOS = {
  // USD por millón de tokens [entrada, salida]
  "claude-opus-5": [5, 25],
  "claude-opus-5-5": [4, 20],
  "claude-opus-4-8": [5, 25],
  "claude-sonnet-5": [2, 10],
  "claude-fable-5-1": [10, 50],
  "claude-haiku-4-5": [1, 5],
};

export const TIPOS_BRECHA = [
  "NINGUNA",
  "NO_DECLARADO",
  "DECLARACION_PARCIAL",
  "CODIGO_ERRONEO",
  "SIN_MEDIDA_CONCRETA",
  "INCOHERENTE_CON_RIESGO",
  "OMISION_NO_JUSTIFICADA",
];
const SEVERIDADES = ["CRITICO", "MAYOR", "MENOR", "OBSERVACION"];
const CATEGORIAS = [
  "RF_OMITIDO",
  "CC_FALTANTE",
  "CODIGO_ERRONEO",
  "INCOHERENCIA_RIESGO_CONTROL",
  "SIN_PREGUNTA_VERIFICACION",
  "EVALUACION_DE_RIESGO",
  "FORMATO_DOCUMENTAL",
  "OTRO",
];

export function configuracion(env = process.env) {
  return {
    modelo: env.MODEL || "claude-opus-5",
    esfuerzo: env.EFFORT || "high",
    maxPasos: Number(env.MAX_PASOS || 40),
    maxUSD: Number(env.MAX_USD_POR_AUDITORIA || 4),
    fallbacks: (env.FALLBACKS || "default") !== "off",
  };
}

// ---------------------------------------------------------------- prompt

const INDICE_RF = MARCO.map((r) => `${r.rf} ${r.nombre} [${r.controles.map((c) => c[0]).join(",")}] — indicios: ${r.claves.join(", ")}`).join("\n");

export const SISTEMA = `Eres un auditor senior de prevención de riesgos en minería. Auditas documentos (procedimientos/PTS, matrices de riesgo IPER/MIPER, mapas de proceso y Controles Operacionales Preventivos - COP) contra un marco de controles críticos para riesgos de fatalidad (RF). Cada RF tiene controles críticos preventivos (CCP) y mitigadores (CCM).

REGLA DE NEGOCIO (no negociable)
Los controles críticos son restrictivos: una tarea expuesta a un RF solo queda habilitada si TODOS los controles críticos de ese RF están cubiertos. La evaluación de cada control es binaria: cumple (true) o no cumple (false). No existe "parcial" ni "no aplica": si un documento omite un control porque no aplica, debe justificarlo explícitamente; si no lo justifica, es false con tipo_brecha OMISION_NO_JUSTIFICADA.

QUÉ SIGNIFICA "CUMPLE" EN UN DOCUMENTO
Un control se cumple en el documento cuando éste lo establece de forma explícita y verificable, según el "requisito documental" del marco (usa consultar_marco). En documentos que declaran códigos (MIPER, COP), además debe estar declarado con el código correcto en TODAS las tareas donde aplica el RF. Si falta en alguna tarea, es false (DECLARACION_PARCIAL) y registras un hallazgo con la tarea. En procedimientos, basta que las medidas descritas cubran el requisito aunque no usen el código.

MÉTODO
1. Revisa el índice de segmentos y el pre-análisis automático (códigos RF/CC detectados por reglas; son pistas a confirmar, no conclusiones).
2. Lee los segmentos necesarios con leer_segmento (por partes). En hojas de Excel, las celdas largas repetidas aparecen como [=Tn], que remite al texto marcado <Tn> en el mismo segmento. Hojas de catálogo o listas de referencia (p. ej. listas maestras de riesgos/controles) NO son evaluación de tareas: no las audites como tareas.
3. Identifica los RF aplicables: los declarados y los que el documento omite pese a que sus tareas lo exigen (p. ej. una tarea con camión pluma implica RF03 Izaje; trabajo sobre plataforma o cabezal implica RF02 Altura). Un RF omitido es hallazgo CRITICO (RF_OMITIDO).
4. Para cada RF aplicable, consulta sus controles y registra UNA evaluación por control (registrar_evaluaciones), a nivel documento.
5. Registra hallazgos concretos (registrar_hallazgos): CC faltante en una tarea, código inexistente o mal asignado, control que no corresponde al riesgo evaluado (incoherencia riesgo-control), controles sin pregunta de verificación (COP), evaluación de riesgo residual incoherente (MIPER), etc. Indica siempre la ubicación (hoja/segmento y tarea).
6. Termina con finalizar_auditoria.

CITAS
- Toda evaluación cumple=true y todo hallazgo que afirme que algo "está" en el documento requiere una cita LITERAL copiada del documento (mínimo 15 caracteres, idealmente 40-200). El sistema verifica cada cita contra el texto; las citas no encontradas se rechazan. Puedes unir dos fragmentos con "..." si ambos son literales.
- Para cumple=false la cita es opcional (puede mostrar la declaración incompleta).
- No inventes contenido. Si no leíste una parte, no afirmes lo que contiene.

SEVERIDAD
CRITICO: RF omitido, CC faltante u omitido sin justificación, código erróneo que deja un control sin declarar. MAYOR: incoherencia riesgo-control, verificación ausente, evaluación residual inconsistente. MENOR: formato, tipeo de códigos que no cambia el control. OBSERVACION: mejora.

EFICIENCIA
Agrupa: registra muchas evaluaciones o hallazgos por llamada. Puedes llamar varias herramientas en paralelo. No repitas lecturas. Redacta en español, técnico y breve.

ÍNDICE DE RF DEL MARCO (versión ${MARCO_VERSION})
${INDICE_RF}`;

// ---------------------------------------------------------------- herramientas

const cadena = (d) => ({ type: "string", description: d });

export const HERRAMIENTAS = [
  {
    name: "leer_segmento",
    description: "Lee una parte de un segmento del documento (hoja o bloque). Las partes se numeran desde 1.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { segmento: cadena("Id del segmento, p. ej. S2"), parte: { type: "integer", description: "Número de parte, desde 1" } },
      required: ["segmento", "parte"],
    },
  },
  {
    name: "buscar_texto",
    description: "Busca líneas del documento que contengan un texto (sin distinguir mayúsculas ni tildes). Separa alternativas con ' OR '. Devuelve hasta 25 líneas con su ubicación.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { consulta: cadena("Texto a buscar") },
      required: ["consulta"],
    },
  },
  {
    name: "consultar_marco",
    description: "Devuelve, para los RF indicados, cada control crítico con su requisito documental y su verificación en terreno.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { rfs: { type: "array", items: { type: "string" }, description: "Códigos RF, p. ej. [\"RF03\",\"RF27\"]" } },
      required: ["rfs"],
    },
  },
  {
    name: "registrar_evaluaciones",
    description: "Registra la evaluación binaria de controles críticos a nivel documento. Una entrada por control (RF+CC). Volver a registrar un mismo control lo reemplaza.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        evaluaciones: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              rf: cadena("Código RF, p. ej. RF03"),
              cc: cadena("Código del control, p. ej. CCP2 o CCM1"),
              cumple: { type: "boolean" },
              tipo_brecha: { type: "string", enum: TIPOS_BRECHA, description: "NINGUNA si cumple=true" },
              cita: cadena("Cita literal del documento (obligatoria si cumple=true, puede ser vacía si no)"),
              fundamento: cadena("Por qué cumple o no, en una o dos frases"),
              recomendacion: cadena("Acción concreta para cerrar la brecha (vacía si cumple)"),
            },
            required: ["rf", "cc", "cumple", "tipo_brecha", "cita", "fundamento", "recomendacion"],
          },
        },
      },
      required: ["evaluaciones"],
    },
  },
  {
    name: "registrar_hallazgos",
    description: "Registra hallazgos concretos con ubicación (hoja/segmento y tarea).",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        hallazgos: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              severidad: { type: "string", enum: SEVERIDADES },
              categoria: { type: "string", enum: CATEGORIAS },
              rf: cadena("RF involucrado o vacío"),
              ubicacion: cadena("Segmento/hoja y tarea, p. ej. 'S2 COP · Tarea 3 Montaje motor bomba'"),
              descripcion: cadena("Qué está mal, concreto"),
              cita: cadena("Cita literal que respalda el hallazgo (vacía si el hallazgo es una ausencia)"),
              recomendacion: cadena("Corrección concreta"),
            },
            required: ["severidad", "categoria", "rf", "ubicacion", "descripcion", "cita", "recomendacion"],
          },
        },
      },
      required: ["hallazgos"],
    },
  },
  {
    name: "finalizar_auditoria",
    description: "Cierra la auditoría. Llamar solo cuando todos los RF aplicables tengan sus controles evaluados.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        resumen_ejecutivo: cadena("3 a 6 frases para la gerencia: estado general, brechas críticas y prioridad de corrección"),
        limitaciones: cadena("Qué no se pudo revisar o supuestos relevantes"),
      },
      required: ["resumen_ejecutivo", "limitaciones"],
    },
  },
];

// ---------------------------------------------------------------- estado inicial

export function iniciarAuditoria({ archivo, tipo, contexto, segmentos, cliente }) {
  const pre = preanalizar(segmentos);
  const indice = segmentos
    .map((s) => `${s.id} · ${s.nombre} · ${s.partes.length} parte(s) · ${s.original.length} caracteres`)
    .join("\n");
  const primer = [
    `DOCUMENTO: ${archivo}`,
    `TIPO DECLARADO: ${TIPOS_DOCUMENTO[tipo] || tipo}`,
    contexto ? `CONTEXTO DEL AUDITOR: ${contexto}` : null,
    "",
    "ÍNDICE DE SEGMENTOS",
    indice,
    "",
    "PRE-ANÁLISIS AUTOMÁTICO (códigos detectados por reglas)",
    preanalisisATexto(pre),
    "",
    "Audita el documento según el método. Empieza leyendo los segmentos relevantes.",
  ].filter((x) => x !== null).join("\n");

  return {
    v: 1,
    marco: MARCO_VERSION,
    archivo,
    tipo,
    cliente: cliente || "",
    creado: new Date().toISOString(),
    segmentos,
    pre,
    messages: [{ role: "user", content: primer }],
    evaluaciones: {},
    hallazgos: [],
    pasos: 0,
    avisos_cierre: 0,
    uso: { entrada: 0, salida: 0, cache_escritura: 0, cache_lectura: 0, usd: 0 },
    modelos: {},
    bitacora: [],
    fin: false,
    resumen: null,
    error: null,
  };
}

// ---------------------------------------------------------------- un paso del bucle

export async function ejecutarPaso(estado, cliente, cfg = configuracion()) {
  if (estado.fin) return estado;
  estado.pasos++;

  const mensajes = conCache(estado.messages);
  const params = {
    model: cfg.modelo,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: cfg.esfuerzo },
    system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
    tools: HERRAMIENTAS,
    messages: mensajes,
  };
  if (cfg.fallbacks) {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }

  const r = await cliente.beta.messages.create(params);
  acumularUso(estado, r);

  if (r.stop_reason === "refusal") {
    estado.fin = true;
    estado.error = `El modelo rechazó continuar (${r.stop_details?.category || "sin categoría"}). Revise el contenido del documento.`;
    anotar(estado, "error", estado.error);
    return estado;
  }

  const contenido = contenidoParaHistorial(r.content);
  estado.messages.push({ role: "assistant", content: contenido });
  for (const b of contenido) {
    if (b.type === "text" && b.text.trim()) anotar(estado, "agente", b.text.trim().slice(0, 400));
  }

  if (r.stop_reason === "pause_turn") return estado;

  const usos = contenido.filter((b) => b.type === "tool_use");
  if (!usos.length) {
    // Terminó sin llamar finalizar_auditoria: se le pide cerrar, o se cierra por el arnés.
    estado.avisos_cierre++;
    if (estado.avisos_cierre > 2) return cierreForzado(estado, "El agente dejó de responder con herramientas.");
    estado.messages.push({ role: "user", content: "Continúa la auditoría usando las herramientas. Cuando termines, llama a finalizar_auditoria." });
    return estado;
  }

  const resultados = [];
  for (const u of usos) {
    if (r.stop_reason === "max_tokens") {
      resultados.push({ type: "tool_result", tool_use_id: u.id, is_error: true, content: "Respuesta truncada por longitud. Repite la llamada en lotes más pequeños." });
      continue;
    }
    let salida;
    try {
      salida = ejecutarHerramienta(estado, u.name, u.input);
    } catch (e) {
      salida = { error: true, texto: `Error: ${e.message}` };
    }
    resultados.push({ type: "tool_result", tool_use_id: u.id, is_error: !!salida.error, content: salida.texto });
  }

  // Límites de pasos y costo: se avisa al agente para que cierre ordenadamente.
  const cerca = estado.pasos >= cfg.maxPasos - 3 || estado.uso.usd >= cfg.maxUSD * 0.85;
  if (!estado.fin && cerca) {
    estado.avisos_cierre++;
    resultados.push({ type: "text", text: "AVISO DEL SISTEMA: se acerca el límite de la auditoría. Registra de inmediato lo que tengas pendiente y llama a finalizar_auditoria." });
  }
  estado.messages.push({ role: "user", content: resultados });

  if (!estado.fin && (estado.pasos >= cfg.maxPasos || estado.uso.usd >= cfg.maxUSD)) {
    return cierreForzado(estado, `Se alcanzó el límite de ${estado.pasos >= cfg.maxPasos ? "pasos" : "costo"} de la auditoría.`);
  }
  return estado;
}

// Marca el último bloque del historial como punto de caché (copia; el historial guardado no cambia).
function conCache(messages) {
  const copia = messages.slice();
  const ultimo = copia[copia.length - 1];
  if (!ultimo) return copia;
  const bloques = typeof ultimo.content === "string" ? [{ type: "text", text: ultimo.content }] : ultimo.content.slice();
  const i = bloques.length - 1;
  bloques[i] = { ...bloques[i], cache_control: { type: "ephemeral" } };
  copia[copia.length - 1] = { ...ultimo, content: bloques };
  return copia;
}

// Tras un fallback a mitad de respuesta, los bloques internos previos al marcador no se reenvían.
function contenidoParaHistorial(content) {
  const i = content.map((b) => b.type).lastIndexOf("fallback");
  if (i < 0) return content;
  const internos = new Set(["thinking", "redacted_thinking", "tool_use", "server_tool_use"]);
  return content.filter((b, k) => k > i || (!internos.has(b.type) && b.type !== "fallback"));
}

function acumularUso(estado, r) {
  const u = r.usage || {};
  const modelo = r.model || "desconocido";
  const [pe, ps] = PRECIOS[modelo] || PRECIOS["claude-opus-5"];
  const entrada = u.input_tokens || 0;
  const salida = u.output_tokens || 0;
  const cw = u.cache_creation_input_tokens || 0;
  const cr = u.cache_read_input_tokens || 0;
  estado.uso.entrada += entrada;
  estado.uso.salida += salida;
  estado.uso.cache_escritura += cw;
  estado.uso.cache_lectura += cr;
  estado.uso.usd += (entrada * pe + cw * pe * 1.25 + cr * pe * 0.1 + salida * ps) / 1e6;
  estado.modelos[modelo] = (estado.modelos[modelo] || 0) + 1;
}

function anotar(estado, tipo, texto) {
  estado.bitacora.push({ paso: estado.pasos, tipo, texto });
}

function cierreForzado(estado, motivo) {
  estado.fin = true;
  estado.resumen = {
    resumen_ejecutivo: "Auditoría cerrada por el sistema antes de que el agente la finalizara. Los controles no evaluados cuentan como NO cumplidos.",
    limitaciones: motivo,
  };
  anotar(estado, "sistema", motivo);
  return estado;
}

// ---------------------------------------------------------------- ejecución de herramientas

function ok(texto) {
  return { texto: typeof texto === "string" ? texto : JSON.stringify(texto) };
}
function falla(texto) {
  return { error: true, texto };
}

export function ejecutarHerramienta(estado, nombre, entrada) {
  switch (nombre) {
    case "leer_segmento": return leerSegmento(estado, entrada);
    case "buscar_texto": return buscarTexto(estado, entrada);
    case "consultar_marco": return consultarMarco(estado, entrada);
    case "registrar_evaluaciones": return registrarEvaluaciones(estado, entrada);
    case "registrar_hallazgos": return registrarHallazgos(estado, entrada);
    case "finalizar_auditoria": return finalizar(estado, entrada);
    default: return falla(`Herramienta desconocida: ${nombre}`);
  }
}

function leerSegmento(estado, { segmento, parte }) {
  const seg = estado.segmentos.find((s) => s.id === String(segmento).toUpperCase());
  if (!seg) return falla(`No existe el segmento ${segmento}. Segmentos: ${estado.segmentos.map((s) => s.id).join(", ")}`);
  const n = Number(parte) || 1;
  if (n < 1 || n > seg.partes.length) return falla(`${seg.id} tiene ${seg.partes.length} parte(s).`);
  anotar(estado, "lectura", `Leyendo ${seg.nombre} (parte ${n}/${seg.partes.length})`);
  return ok(`[${seg.id} · ${seg.nombre} · parte ${n}/${seg.partes.length}]\n${seg.partes[n - 1]}`);
}

function buscarTexto(estado, { consulta }) {
  const terminos = String(consulta).split(/\s+OR\s+/i).map(normalizar).filter((t) => t.length >= 3);
  if (!terminos.length) return falla("Consulta vacía o muy corta (mínimo 3 caracteres).");
  const res = [];
  for (const seg of estado.segmentos) {
    seg.original.split("\n").forEach((l, i) => {
      if (res.length >= 25) return;
      const nl = normalizar(l);
      if (terminos.some((t) => nl.includes(t))) res.push(`${seg.id} línea ${i + 1}: ${l.slice(0, 300)}`);
    });
  }
  anotar(estado, "busqueda", `Buscando "${consulta}" (${res.length} resultados)`);
  return ok(res.length ? res.join("\n") : "Sin resultados.");
}

function consultarMarco(estado, { rfs }) {
  const out = [];
  for (const codigo of rfs || []) {
    const rf = buscarRF(normalizarRF(codigo));
    if (!rf) { out.push(`${codigo}: no existe en el marco.`); continue; }
    out.push(`${rf.rf} ${rf.nombre}`);
    for (const [id, n, doc, ter] of rf.controles) out.push(`  ${id} ${n}\n    Requisito documental: ${doc}\n    Terreno: ${ter}`);
  }
  anotar(estado, "marco", `Consultando controles de ${(rfs || []).join(", ")}`);
  return ok(out.join("\n"));
}

function normalizarRF(x) {
  const m = String(x).match(/(\d{1,2})/);
  return m ? `RF${m[1].padStart(2, "0")}` : String(x);
}

// Verifica que la cita exista en el documento (tolerando mayúsculas, tildes, espacios y separadores).
export function citaEnDocumento(estado, cita) {
  const trozos = String(cita || "").split(/\.\.\.|…/).map(normalizar).filter((t) => t.length >= 10);
  if (!trozos.length) return false;
  if (!estado._textoNorm) {
    Object.defineProperty(estado, "_textoNorm", {
      value: normalizar(estado.segmentos.map((s) => s.original).join("\n")),
      enumerable: false, // no se serializa
    });
  }
  return trozos.every((t) => estado._textoNorm.includes(t));
}

function registrarEvaluaciones(estado, { evaluaciones }) {
  const aceptadas = [];
  const rechazadas = [];
  for (const e of evaluaciones || []) {
    const rf = buscarRF(normalizarRF(e.rf));
    const cc = String(e.cc || "").toUpperCase().replace(/\s/g, "");
    if (!rf) { rechazadas.push(`${e.rf}/${cc}: RF inexistente`); continue; }
    if (!rf.controles.some((c) => c[0] === cc)) { rechazadas.push(`${rf.rf}/${cc}: el control no existe en ${rf.rf} (válidos: ${rf.controles.map((c) => c[0]).join(",")})`); continue; }
    if (e.cumple && e.tipo_brecha !== "NINGUNA") { rechazadas.push(`${rf.rf}/${cc}: si cumple=true, tipo_brecha debe ser NINGUNA`); continue; }
    if (!e.cumple && e.tipo_brecha === "NINGUNA") { rechazadas.push(`${rf.rf}/${cc}: si cumple=false, indica el tipo de brecha`); continue; }
    let citaVerificada = false;
    if (e.cita && e.cita.trim()) {
      citaVerificada = citaEnDocumento(estado, e.cita);
      if (!citaVerificada && e.cumple) { rechazadas.push(`${rf.rf}/${cc}: la cita no aparece literalmente en el documento`); continue; }
    } else if (e.cumple) {
      rechazadas.push(`${rf.rf}/${cc}: cumple=true requiere una cita literal`); continue;
    }
    estado.evaluaciones[`${rf.rf}|${cc}`] = {
      rf: rf.rf, cc, cumple: !!e.cumple, tipo_brecha: e.tipo_brecha,
      cita: citaVerificada ? e.cita.trim() : "", fundamento: e.fundamento || "", recomendacion: e.recomendacion || "",
    };
    aceptadas.push(`${rf.rf}/${cc}`);
  }
  anotar(estado, "evaluacion", `${aceptadas.length} controles evaluados${rechazadas.length ? `, ${rechazadas.length} rechazados` : ""}`);
  return rechazadas.length
    ? { error: aceptadas.length === 0, texto: `Aceptadas: ${aceptadas.join(", ") || "ninguna"}\nRECHAZADAS (corrige y reenvía solo estas):\n${rechazadas.join("\n")}` }
    : ok(`Aceptadas: ${aceptadas.join(", ")}`);
}

function registrarHallazgos(estado, { hallazgos }) {
  let n = 0;
  const rechazados = [];
  for (const h of hallazgos || []) {
    if (!SEVERIDADES.includes(h.severidad) || !CATEGORIAS.includes(h.categoria)) { rechazados.push(`"${h.descripcion?.slice(0, 50)}": severidad/categoría inválida`); continue; }
    let cita = "";
    if (h.cita && h.cita.trim()) {
      if (!citaEnDocumento(estado, h.cita)) { rechazados.push(`"${h.descripcion?.slice(0, 50)}": la cita no aparece literalmente en el documento (corrígela o déjala vacía si es una ausencia)`); continue; }
      cita = h.cita.trim();
    }
    estado.hallazgos.push({
      id: estado.hallazgos.length + 1,
      severidad: h.severidad, categoria: h.categoria, rf: h.rf ? normalizarRF(h.rf) : "",
      ubicacion: h.ubicacion || "", descripcion: h.descripcion || "", cita, recomendacion: h.recomendacion || "",
    });
    n++;
  }
  anotar(estado, "hallazgo", `${n} hallazgos registrados${rechazados.length ? `, ${rechazados.length} rechazados` : ""}`);
  return rechazados.length
    ? { error: n === 0, texto: `Registrados: ${n}\nRECHAZADOS:\n${rechazados.join("\n")}` }
    : ok(`Registrados: ${n}. Total hallazgos: ${estado.hallazgos.length}`);
}

function finalizar(estado, { resumen_ejecutivo, limitaciones }) {
  const pendientes = controlesPendientes(estado);
  const noEvaluados = rfDeclaradosNoEvaluados(estado);
  // Primer intento con pendientes: se devuelve la lista. Segundo intento: se cierra igual.
  if ((pendientes.length || noEvaluados.length) && !estado.aviso_pendientes) {
    estado.aviso_pendientes = true;
    const partes = [];
    if (pendientes.length) partes.push(`Faltan evaluaciones de controles en RF aplicables: ${pendientes.join(", ")} (si cierras así, quedan como NO cumplidos).`);
    if (noEvaluados.length) partes.push(`RF declarados con controles en el documento y no evaluados: ${noEvaluados.join(", ")}. Evalúalos, o explica en 'limitaciones' por qué no aplican (p. ej. solo figuran en una hoja de catálogo).`);
    return falla(`${partes.join("\n")}\nLuego vuelve a llamar a finalizar_auditoria.`);
  }
  estado.fin = true;
  estado.resumen = { resumen_ejecutivo, limitaciones };
  anotar(estado, "fin", "Auditoría finalizada por el agente");
  return ok("Auditoría cerrada.");
}

// RF aplicables = con evaluaciones registradas + señalados como omitidos por el agente.
// (Los RF que solo aparecen en hojas de catálogo no deben forzar evaluación.)
export function rfAplicables(estado) {
  const s = new Set();
  for (const e of Object.values(estado.evaluaciones)) s.add(e.rf);
  for (const h of estado.hallazgos) if (h.categoria === "RF_OMITIDO" && h.rf) s.add(h.rf);
  return [...s].filter((x) => buscarRF(x)).sort();
}

// RF que el documento declara con controles pero el agente no evaluó.
export function rfDeclaradosNoEvaluados(estado) {
  const aplicables = new Set(rfAplicables(estado));
  return estado.pre.filter((p) => p.patrones.length && !aplicables.has(p.rf)).map((p) => p.rf);
}

function controlesPendientes(estado) {
  const out = [];
  for (const rf of rfAplicables(estado)) {
    for (const [cc] of buscarRF(rf).controles) if (!estado.evaluaciones[`${rf}|${cc}`]) out.push(`${rf}/${cc}`);
  }
  return out;
}

// ---------------------------------------------------------------- veredicto (determinístico)

export function construirInforme(estado) {
  const rfs = rfAplicables(estado).map((codigo) => {
    const def = buscarRF(codigo);
    const controles = def.controles.map(([cc, nombre, requisito, terreno]) => {
      const e = estado.evaluaciones[`${codigo}|${cc}`];
      return {
        cc, nombre, requisito, terreno,
        estado: e ? (e.cumple ? "SI" : "NO") : "NO EVALUADO",
        tipo_brecha: e?.tipo_brecha || "NO_EVALUADO",
        cita: e?.cita || "", fundamento: e?.fundamento || "", recomendacion: e?.recomendacion || "",
      };
    });
    const cumplidos = controles.filter((c) => c.estado === "SI").length;
    return { rf: codigo, nombre: def.nombre, habilitado: cumplidos === controles.length, cumplidos, total: controles.length, controles };
  });
  const orden = { CRITICO: 0, MAYOR: 1, MENOR: 2, OBSERVACION: 3 };
  const hallazgos = [...estado.hallazgos].sort((a, b) => orden[a.severidad] - orden[b.severidad]);
  const conteo = Object.fromEntries(SEVERIDADES.map((s) => [s, hallazgos.filter((h) => h.severidad === s).length]));
  const totalCC = rfs.reduce((n, r) => n + r.total, 0);
  const siCC = rfs.reduce((n, r) => n + r.cumplidos, 0);
  const habilita = rfs.length > 0 && rfs.every((r) => r.habilitado) && conteo.CRITICO === 0 && !estado.error;
  return {
    archivo: estado.archivo,
    tipo: TIPOS_DOCUMENTO[estado.tipo] || estado.tipo,
    cliente: estado.cliente,
    fecha: estado.creado,
    marco: estado.marco,
    veredicto: habilita ? "HABILITA" : "NO HABILITA",
    motivo: habilita
      ? "Todos los controles críticos de los RF aplicables están cubiertos y no hay hallazgos críticos."
      : rfs.length === 0
        ? "No se identificaron RF evaluados; el documento no demuestra control de riesgos de fatalidad."
        : `${rfs.filter((r) => !r.habilitado).length} de ${rfs.length} RF con controles críticos no cubiertos; ${conteo.CRITICO} hallazgo(s) crítico(s).`,
    rf_declarados_no_evaluados: rfDeclaradosNoEvaluados(estado),
    cobertura: { controles_si: siCC, controles_total: totalCC, porcentaje: totalCC ? Math.round((100 * siCC) / totalCC) : 0 },
    rfs,
    hallazgos,
    conteo,
    resumen: estado.resumen,
    error: estado.error,
    preanalisis: estado.pre,
    uso: { ...estado.uso, usd: Math.round(estado.uso.usd * 1000) / 1000, pasos: estado.pasos, modelos: estado.modelos },
  };
}
