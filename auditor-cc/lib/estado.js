// Estado de auditoría sellado: comprimido + firmado con HMAC.
// El navegador lo guarda entre pasos pero no puede modificarlo: cualquier
// alteración invalida la firma y el servidor rechaza el paso.

import crypto from "node:crypto";
import zlib from "node:zlib";

function secreto() {
  const s = process.env.STATE_SECRET;
  if (!s || s.length < 16) throw new Error("STATE_SECRET no configurado (mínimo 16 caracteres).");
  return s;
}

export function sellar(estado) {
  const datos = zlib.gzipSync(Buffer.from(JSON.stringify(estado)), { level: 6 }).toString("base64");
  const firma = crypto.createHmac("sha256", secreto()).update(datos).digest("base64url");
  return `${datos}.${firma}`;
}

export function abrir(sellado) {
  if (typeof sellado !== "string" || !sellado.includes(".")) throw new Error("Estado inválido.");
  const i = sellado.lastIndexOf(".");
  const datos = sellado.slice(0, i);
  const firma = sellado.slice(i + 1);
  const esperada = crypto.createHmac("sha256", secreto()).update(datos).digest("base64url");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Estado alterado o firma inválida.");
  return JSON.parse(zlib.gunzipSync(Buffer.from(datos, "base64")).toString("utf8"));
}
