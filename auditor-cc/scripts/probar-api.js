// Auditoría REAL de un documento desde la terminal (consume API; muestra el costo).
// Uso: ANTHROPIC_API_KEY=sk-ant-... node scripts/probar-api.js ejemplos/COP.xlsx cop
//      tipos: procedimiento | matriz | mapa_proceso | cop | otro
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { cargarArchivo } from "./cargar.js";
import { iniciarAuditoria, ejecutarPaso, construirInforme, configuracion } from "../lib/agente.js";
import { sellar, abrir } from "../lib/estado.js";

process.env.STATE_SECRET ||= "secreto-local-para-prueba-api-0000";
const [ruta, tipo = "otro", ...ctx] = process.argv.slice(2);
if (!ruta || !process.env.ANTHROPIC_API_KEY) {
  console.error("Uso: ANTHROPIC_API_KEY=... node scripts/probar-api.js <archivo> [tipo] [contexto]");
  process.exit(1);
}
const doc = await cargarArchivo(ruta);
const cfg = configuracion();
console.log(`Auditando ${doc.nombre} (${doc.segmentos.length} segmentos) con ${cfg.modelo}, esfuerzo ${cfg.esfuerzo}`);
const cliente = new Anthropic({ timeout: 280_000, maxRetries: 2 });
let sellado = sellar(iniciarAuditoria({ archivo: doc.nombre, tipo, contexto: ctx.join(" "), segmentos: doc.segmentos, cliente: "CLI" }));
let estado;
const t0 = Date.now();
do {
  estado = abrir(sellado);
  const desde = estado.bitacora.length;
  const tp = Date.now();
  await ejecutarPaso(estado, cliente, cfg);
  sellado = sellar(estado);
  for (const b of estado.bitacora.slice(desde)) console.log(`  [${b.paso}] ${b.tipo}: ${b.texto.slice(0, 140)}`);
  console.log(`  · paso ${estado.pasos} en ${((Date.now() - tp) / 1000).toFixed(1)}s · acumulado US$${estado.uso.usd.toFixed(3)}`);
} while (!estado.fin);
const inf = construirInforme(estado);
fs.mkdirSync("salida", { recursive: true });
const salida = `salida/informe-${doc.nombre.replace(/\W+/g, "_")}.json`;
fs.writeFileSync(salida, JSON.stringify(inf, null, 2));
console.log(`\n${inf.veredicto}: ${inf.motivo}`);
console.log(`Cobertura ${inf.cobertura.porcentaje}% · hallazgos ${JSON.stringify(inf.conteo)}`);
console.log(`Tiempo ${((Date.now() - t0) / 60000).toFixed(1)} min · costo US$${inf.uso.usd} (~$${Math.round(inf.uso.usd * 950).toLocaleString("es-CL")} CLP) · ${salida}`);
