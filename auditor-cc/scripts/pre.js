import { cargarArchivo } from "./cargar.js";
import { preanalizar, preanalisisATexto } from "../lib/preanalisis.js";
import { resumenDocumento } from "../lib/extraer.js";
for (const f of process.argv.slice(2)) {
  const d = await cargarArchivo(f);
  console.log(`\n===== ${d.nombre}`, resumenDocumento(d.segmentos));
  console.log(d.segmentos.map((s) => `${s.id} ${s.nombre} (${s.partes.length} partes)`).join("\n"));
  console.log(preanalisisATexto(preanalizar(d.segmentos)));
}
