// Prueba del arnés sin gastar API: un "modelo simulado" ejecuta un guion de
// llamadas a herramientas sobre un documento real y se verifica que el arnés
// valide citas, rechace datos inválidos, respete el cierre y calcule el veredicto.
//
// Uso: node scripts/probar-local.js [ruta-documento]   (por defecto ejemplos/COP.xlsx,
//      o un documento sintético si no hay ejemplos)

import fs from "node:fs";
import assert from "node:assert/strict";
import { cargarArchivo } from "./cargar.js";
import { segmentosDesdeTexto } from "../lib/extraer.js";
import { iniciarAuditoria, ejecutarPaso, construirInforme } from "../lib/agente.js";
import { sellar, abrir } from "../lib/estado.js";
import handler from "../api/auditar.js";

process.env.STATE_SECRET ||= "secreto-de-prueba-local-123456";
process.env.ACCESS_CODES ||= JSON.stringify({ "PRUEBA-1": { cliente: "Prueba", vence: "2099-12-31" }, VIEJO: { cliente: "X", vence: "2020-01-01" } });

const ruta = process.argv[2] || (fs.existsSync("ejemplos/COP.xlsx") ? "ejemplos/COP.xlsx" : null);
const doc = ruta
  ? await cargarArchivo(ruta)
  : {
      nombre: "sintetico.txt",
      segmentos: segmentosDesdeTexto("sintetico.txt", [
        "Tarea 1 | Montaje de bomba con camión pluma | RF3: Maniobras de Izaje | CCP1: Equipos y elementos de izaje conforme a especificaciones técnicas. CCP2: Estabilizadores operativos. CCP6: Segregación y control de acceso en área de maniobras.",
        "Tarea 2 | Tránsito en área | RF27: Atropello | CCP1: Rutas vehiculares y peatonales conforme a diseño. ".repeat(3),
      ]),
    };
console.log(`Documento: ${doc.nombre} · ${doc.segmentos.length} segmentos`);

// Busca un texto real del documento para usarlo como cita válida.
function citaReal(patron) {
  for (const s of doc.segmentos) {
    const i = s.original.search(patron);
    if (i >= 0) return s.original.slice(i, i + 70);
  }
  throw new Error(`No se encontró ${patron} en el documento`);
}
const citaIzaje = citaReal(/CCP1: ?Equipos y elementos de izaje/i);

// ----------------------------------------------------------- modelo simulado
let turno = 0;
const llamadas = [];
function respuesta(bloques, stop = "tool_use") {
  return {
    model: "claude-opus-5",
    stop_reason: stop,
    usage: { input_tokens: 1200, output_tokens: 400, cache_creation_input_tokens: 9000, cache_read_input_tokens: 20000 * turno },
    content: [{ type: "thinking", thinking: "", signature: "firma-simulada" }, ...bloques],
  };
}
const uso = (name, input) => ({ type: "tool_use", id: `tu_${turno}_${name}_${Math.random().toString(36).slice(2, 7)}`, name, input });

const clienteSimulado = {
  beta: {
    messages: {
      async create(params) {
        llamadas.push(params);
        turno++;
        // Verificaciones del request que llega a la API.
        assert.equal(params.tools.length, 6);
        assert.ok(params.tools.every((t) => t.strict === true));
        assert.equal(params.system[0].cache_control.type, "ephemeral");
        const ultimo = params.messages.at(-1);
        assert.ok(Array.isArray(ultimo.content) && ultimo.content.at(-1).cache_control, "falta punto de caché en el último bloque");
        switch (turno) {
          case 1:
            return respuesta([
              { type: "text", text: "Reviso el pre-análisis y leo el segmento principal." },
              uso("leer_segmento", { segmento: doc.segmentos.length > 1 ? "S2" : "S1", parte: 1 }),
              uso("consultar_marco", { rfs: ["RF03", "RF27"] }),
              uso("buscar_texto", { consulta: "plan de izaje OR carga suspendida" }),
            ]);
          case 2:
            return respuesta([
              uso("registrar_evaluaciones", {
                evaluaciones: [
                  { rf: "RF03", cc: "CCP1", cumple: true, tipo_brecha: "NINGUNA", cita: citaIzaje, fundamento: "Declarado.", recomendacion: "" },
                  { rf: "RF03", cc: "CCP2", cumple: true, tipo_brecha: "NINGUNA", cita: "Esta frase fue inventada por el modelo y no existe", fundamento: "x", recomendacion: "" },
                  { rf: "RF03", cc: "CCP9", cumple: false, tipo_brecha: "NO_DECLARADO", cita: "", fundamento: "x", recomendacion: "x" },
                  { rf: "RF03", cc: "CCM1", cumple: false, tipo_brecha: "CODIGO_ERRONEO", cita: "", fundamento: "Declarado como CCP6, código inexistente.", recomendacion: "Renombrar a CCM1." },
                  { rf: "RF03", cc: "CCM2", cumple: true, tipo_brecha: "NO_DECLARADO", cita: citaIzaje, fundamento: "x", recomendacion: "" },
                ],
              }),
            ]);
          case 3:
            return respuesta([
              uso("registrar_hallazgos", {
                hallazgos: [
                  { severidad: "CRITICO", categoria: "CODIGO_ERRONEO", rf: "RF03", ubicacion: "S2 · Tarea 3", descripcion: "CCP6 no existe; corresponde a CCM1.", cita: "", recomendacion: "Corregir código." },
                  { severidad: "MAYOR", categoria: "OTRO", rf: "", ubicacion: "S2", descripcion: "Cita falsa", cita: "texto que no está en ningún lado del documento", recomendacion: "" },
                ],
              }),
              uso("finalizar_auditoria", { resumen_ejecutivo: "Intento de cierre prematuro.", limitaciones: "" }),
            ]);
          case 4:
            return respuesta([{ type: "text", text: "Termino la revisión." }], "end_turn");
          case 5:
            return respuesta([uso("finalizar_auditoria", { resumen_ejecutivo: "El COP no habilita tareas de izaje por códigos erróneos.", limitaciones: "Prueba simulada." })]);
          default:
            throw new Error("El arnés siguió llamando al modelo después de cerrar");
        }
      },
    },
  },
};

// ----------------------------------------------------------- ejecución paso a paso con estado sellado
let sellado = sellar(iniciarAuditoria({ archivo: doc.nombre, tipo: "cop", contexto: "", segmentos: doc.segmentos, cliente: "Prueba" }));
console.log(`Estado sellado inicial: ${(sellado.length / 1024).toFixed(0)} KB`);
const cfg = { modelo: "claude-opus-5", esfuerzo: "high", maxPasos: 40, maxUSD: 10, fallbacks: true };
let estado;
for (let i = 0; i < 10; i++) {
  estado = abrir(sellado);
  await ejecutarPaso(estado, clienteSimulado, cfg);
  sellado = sellar(estado);
  const r = estado.messages.at(-1);
  if (Array.isArray(r.content)) {
    for (const b of r.content) if (b.type === "tool_result") console.log(`  [paso ${estado.pasos}] ${b.is_error ? "✗" : "✓"} ${b.content.split("\n")[0].slice(0, 110)}`);
  }
  if (estado.fin) break;
}

// ----------------------------------------------------------- aserciones
assert.equal(estado.fin, true, "la auditoría debió cerrar");
assert.equal(turno, 5, "debió haber exactamente 5 llamadas al modelo");
assert.ok(llamadas[0].betas.includes("server-side-fallback-2026-07-01") && llamadas[0].fallbacks === "default");
assert.equal(estado.evaluaciones["RF03|CCP1"].cumple, true, "cita real aceptada");
assert.equal(estado.evaluaciones["RF03|CCP2"], undefined, "cita inventada rechazada");
assert.equal(estado.evaluaciones["RF03|CCM2"], undefined, "cumple=true con brecha rechazado");
assert.equal(estado.evaluaciones["RF03|CCM1"].cumple, false);
assert.equal(estado.hallazgos.length, 1, "hallazgo con cita falsa rechazado");
const resultadosTurno3 = estado.messages[6].content.map((b) => b.content).join("\n");
assert.match(resultadosTurno3, /Faltan evaluaciones/, "el primer cierre con pendientes debe rechazarse");
assert.ok(estado.messages[8].content.includes("finalizar_auditoria"), "end_turn sin cierre debe pedir continuar");

const informe = construirInforme(estado);
assert.equal(informe.veredicto, "NO HABILITA");
const rf03 = informe.rfs.find((r) => r.rf === "RF03");
assert.equal(rf03.habilitado, false);
assert.equal(rf03.controles.find((c) => c.cc === "CCP2").estado, "NO EVALUADO");
assert.ok(informe.uso.usd > 0);

// Estado alterado debe rechazarse.
const [datos, firma] = [sellado.slice(0, sellado.lastIndexOf(".")), sellado.slice(sellado.lastIndexOf(".") + 1)];
assert.throws(() => abrir(`${datos.slice(0, -4)}AAAA.${firma}`), /alterado|inválid/);

// ----------------------------------------------------------- API: acceso e inicio
function llamar(cuerpo) {
  return new Promise((resolve) => {
    const res = { status(c) { this.c = c; return this; }, json(j) { resolve({ status: this.c, body: j }); } };
    handler({ method: "POST", body: cuerpo }, res);
  });
}
assert.equal((await llamar({ accion: "acceso", codigo: "PRUEBA-1" })).status, 200);
assert.equal((await llamar({ accion: "acceso", codigo: "NO-EXISTE" })).status, 401);
assert.equal((await llamar({ accion: "acceso", codigo: "VIEJO" })).status, 401);
const ini = await llamar({ accion: "iniciar", codigo: "PRUEBA-1", archivo: doc.nombre, tipo: "cop", segmentos: doc.segmentos });
assert.equal(ini.status, 200);
assert.ok(abrir(ini.body.estado).messages.length === 1);
const sinKey = await llamar({ accion: "paso", codigo: "PRUEBA-1", estado: ini.body.estado });
if (!process.env.ANTHROPIC_API_KEY) assert.equal(sinKey.status, 500);

fs.mkdirSync("salida", { recursive: true });
fs.writeFileSync("salida/informe-simulado.json", JSON.stringify(informe, null, 2));
console.log(`\nVeredicto: ${informe.veredicto} — ${informe.motivo}`);
console.log(`Costo simulado: US$${informe.uso.usd} en ${informe.uso.pasos} pasos`);
console.log("✔ Todas las pruebas del arnés pasaron. Informe en salida/informe-simulado.json");
