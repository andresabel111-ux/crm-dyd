// Servidor local de desarrollo: sirve la interfaz y /api/auditar.
// Uso: node scripts/servidor.js            (usa ANTHROPIC_API_KEY real)
//      MOCK_IA=1 node scripts/servidor.js  (modelo simulado, sin costo)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import handler, { fabrica } from "../api/auditar.js";
import { clienteSimulado } from "./mock-ia.js";

process.env.STATE_SECRET ||= "secreto-local-de-desarrollo-000000";
process.env.ACCESS_CODES ||= JSON.stringify({ "DEMO-2026": { cliente: "Demo local", vence: "2099-12-31" } });
if (process.env.MOCK_IA) fabrica.cliente = clienteSimulado;

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".css": "text/css" };
const raiz = path.resolve(".");
const puerto = Number(process.env.PORT || 3000);

http.createServer((req, res) => {
  if (req.url.startsWith("/api/auditar")) {
    let cuerpo = "";
    req.on("data", (c) => (cuerpo += c));
    req.on("end", () => {
      const r = {
        status(c) { res.statusCode = c; return r; },
        json(j) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(j)); },
      };
      handler({ method: req.method, body: cuerpo ? JSON.parse(cuerpo) : {} }, r);
    });
    return;
  }
  const url = decodeURIComponent(req.url.split("?")[0]);
  const archivo = path.join(raiz, url === "/" ? "index.html" : url);
  if (!archivo.startsWith(raiz) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory() || /node_modules|ejemplos|\.env/.test(archivo)) {
    res.statusCode = 404; return res.end("No encontrado");
  }
  res.setHeader("Content-Type", TIPOS[path.extname(archivo)] || "application/octet-stream");
  fs.createReadStream(archivo).pipe(res);
}).listen(puerto, () => console.log(`AuditaCC en http://localhost:${puerto} ${process.env.MOCK_IA ? "(IA SIMULADA)" : ""}`));
