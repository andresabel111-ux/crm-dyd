// Pre-análisis determinístico (sin IA): detecta los códigos RF / CC declarados
// en el documento y los contrasta con el marco. Da al agente un mapa de
// sospechas verificables y reduce lo que tiene que leer.

import { MARCO, buscarRF } from "./marco.js";
import { normalizar } from "./extraer.js";

const RE_RF = /(?<![a-z])RF\s*[-_:.°º]?\s*0?(\d{1,2})(?!\d)/gi;
const RE_CC = /(?<![a-z])(CC\s?[PM]|CPP|CMM|CPM|CMP)\s*[:.\-]?\s*(\d)(?!\d)/gi;

const VACIAS = new Set(("de la el los las del y en con para por a o que se su sus al un una e u es " +
  "sistema sistemas control controles critico criticos conforme segun").split(" "));

function raices(texto) {
  return new Set(
    normalizar(texto).replace(/[^a-z0-9ñ ]/g, " ").split(" ")
      .filter((p) => p.length > 2 && !VACIAS.has(p))
      .map((p) => p.slice(0, 6)),
  );
}

function similitud(declarado, referencia) {
  const a = raices(declarado);
  if (!a.size) return 0;
  const b = raices(referencia);
  let comunes = 0;
  for (const x of a) if (b.has(x)) comunes++;
  return comunes / a.size;
}

function codigoCanonico(prefijo, numero) {
  const p = prefijo.toUpperCase().replace(/\s/g, "");
  const tipo = p === "CCP" || p === "CPP" || p === "CMP" ? "CCP" : "CCM";
  return { id: `${tipo}${numero}`, formato_irregular: p !== "CCP" && p !== "CCM" ? p : null };
}

// Analiza una línea y devuelve las ocurrencias RF con sus CC asociados.
function analizarLinea(linea) {
  const marcas = [];
  for (const m of linea.matchAll(RE_RF)) marcas.push({ tipo: "rf", i: m.index, fin: m.index + m[0].length, num: Number(m[1]) });
  for (const m of linea.matchAll(RE_CC)) marcas.push({ tipo: "cc", i: m.index, fin: m.index + m[0].length, pref: m[1], num: m[2] });
  marcas.sort((a, b) => a.i - b.i);
  const ocurrencias = [];
  let actual = null;
  marcas.forEach((m, k) => {
    if (m.tipo === "rf") {
      if (m.num < 1 || m.num > MARCO.length) return;
      actual = { rf: `RF${String(m.num).padStart(2, "0")}`, ccs: new Map(), irregulares: [] };
      ocurrencias.push(actual);
      return;
    }
    if (!actual) return;
    const { id, formato_irregular } = codigoCanonico(m.pref, m.num);
    const siguiente = marcas[k + 1];
    const nombre = linea.slice(m.fin, siguiente ? siguiente.i : m.fin + 140)
      .replace(/^[\s:.\-]+/, "").split(/[|?¿]/)[0].trim().slice(0, 140);
    // Solo la primera mención cuenta como declaración (las siguientes suelen ser preguntas de verificación).
    if (!actual.ccs.has(id)) actual.ccs.set(id, nombre);
    if (formato_irregular) actual.irregulares.push(`${m.pref.trim()}${m.num}`);
  });
  return ocurrencias;
}

export function preanalizar(segmentos) {
  const porRF = new Map();
  for (const seg of segmentos) {
    const lineas = seg.original.split("\n");
    lineas.forEach((linea, n) => {
      for (const oc of analizarLinea(linea)) {
        if (!porRF.has(oc.rf)) porRF.set(oc.rf, []);
        porRF.get(oc.rf).push({ ...oc, seg: seg.id, linea: n + 1, extracto: linea.slice(0, 160) });
      }
    });
  }

  const resultado = [];
  for (const [rf, ocs] of [...porRF.entries()].sort()) {
    const def = buscarRF(rf);
    const catalogo = def.controles.map((c) => c[0]);
    const conControles = ocs.filter((o) => o.ccs.size);
    const patrones = new Map();
    const invalidos = new Map();
    const sospechas = new Map();
    const irregulares = new Map();
    for (const o of conControles) {
      const clave = [...o.ccs.keys()].sort().join(",");
      if (!patrones.has(clave)) patrones.set(clave, { ccs: [...o.ccs.keys()].sort(), veces: 0, ejemplo: `${o.seg} línea ${o.linea}: ${o.extracto}` });
      patrones.get(clave).veces++;
      for (const x of o.irregulares) irregulares.set(x, (irregulares.get(x) || 0) + 1);
      for (const [cc, nombre] of o.ccs) {
        if (!catalogo.includes(cc)) {
          const mejor = mejorCoincidencia(def, nombre);
          invalidos.set(`${cc}|${nombre}`, { cc, nombre, probable: mejor?.id || null, ubicacion: `${o.seg} línea ${o.linea}` });
          continue;
        }
        if (nombre.length < 8) continue;
        const propio = def.controles.find((c) => c[0] === cc);
        const sPropio = Math.max(similitud(nombre, propio[1]), similitud(nombre, propio[2]));
        const mejor = mejorCoincidencia(def, nombre);
        if (mejor && mejor.id !== cc && mejor.score >= 0.5 && sPropio < 0.25) {
          sospechas.set(`${cc}|${nombre}`, { cc, nombre, probable: mejor.id, ubicacion: `${o.seg} línea ${o.linea}` });
        }
      }
    }
    resultado.push({
      rf,
      nombre: def.nombre,
      catalogo,
      menciones: ocs.length,
      menciones_sin_controles: ocs.length - conControles.length,
      patrones: [...patrones.values()]
        .map((p) => ({ ...p, faltantes: catalogo.filter((c) => !p.ccs.includes(c)) }))
        .sort((a, b) => b.veces - a.veces),
      codigos_inexistentes: [...invalidos.values()],
      codigo_nombre_inconsistente: [...sospechas.values()],
      formato_irregular: [...irregulares.entries()].map(([codigo, veces]) => ({ codigo, veces })),
    });
  }
  return resultado;
}

function mejorCoincidencia(def, nombre) {
  let mejor = null;
  for (const c of def.controles) {
    const score = Math.max(similitud(nombre, c[1]), similitud(nombre, c[2]) * 0.9);
    if (!mejor || score > mejor.score) mejor = { id: c[0], score };
  }
  return mejor && mejor.score > 0 ? mejor : null;
}

// Texto compacto del pre-análisis para el agente (y para la UI).
export function preanalisisATexto(pre) {
  if (!pre.length) return "No se detectaron códigos RF/CC en el documento. Los RF aplicables deben inferirse de los peligros y tareas descritos.";
  const out = [];
  for (const r of pre) {
    out.push(`${r.rf} ${r.nombre} — ${r.menciones} menciones (${r.menciones_sin_controles} sin controles asociados). Controles del marco: ${r.catalogo.join(", ")}`);
    for (const p of r.patrones.slice(0, 6)) {
      out.push(`  • patrón {${p.ccs.join(",")}} x${p.veces}${p.faltantes.length ? ` → FALTAN ${p.faltantes.join(",")}` : " → completo"} | ej. ${p.ejemplo.slice(0, 120)}`);
    }
    if (r.patrones.length > 6) out.push(`  • (+${r.patrones.length - 6} patrones más)`);
    for (const x of r.codigos_inexistentes.slice(0, 5)) out.push(`  ✗ código inexistente ${x.cc} "${x.nombre.slice(0, 60)}"${x.probable ? ` (¿quiso decir ${x.probable}?)` : ""} en ${x.ubicacion}`);
    for (const x of r.codigo_nombre_inconsistente.slice(0, 5)) out.push(`  ? ${x.cc} con nombre "${x.nombre.slice(0, 60)}" parece corresponder a ${x.probable} (${x.ubicacion})`);
    for (const x of r.formato_irregular) out.push(`  ~ formato irregular "${x.codigo}" x${x.veces}`);
  }
  return out.join("\n");
}
