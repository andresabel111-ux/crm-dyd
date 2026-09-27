// Carga un archivo local con las mismas reglas que usa el navegador.
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import mammoth from "mammoth";
import { segmentosDesdeHojas, segmentosDesdeTexto } from "../lib/extraer.js";

export async function cargarArchivo(ruta) {
  const ext = path.extname(ruta).toLowerCase();
  const nombre = path.basename(ruta);
  if ([".xlsx", ".xlsm", ".xls", ".csv"].includes(ext)) {
    const wb = XLSX.read(fs.readFileSync(ruta), { type: "buffer" });
    const hojas = wb.SheetNames.map((n) => ({
      nombre: n,
      filas: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: "" }),
    }));
    return { nombre, segmentos: segmentosDesdeHojas(hojas) };
  }
  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ buffer: fs.readFileSync(ruta) });
    return { nombre, segmentos: segmentosDesdeTexto(nombre, value) };
  }
  if (ext === ".txt" || ext === ".md") {
    return { nombre, segmentos: segmentosDesdeTexto(nombre, fs.readFileSync(ruta, "utf8")) };
  }
  throw new Error(`Formato no soportado en script local: ${ext} (los PDF se procesan en el navegador)`);
}
