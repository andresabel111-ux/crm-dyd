// Normaliza documentos a "segmentos" de texto legibles por el agente.
// Módulo isomórfico: lo usan el navegador (index.html) y los scripts de Node.
//
// Un segmento es una hoja de Excel, o un bloque de páginas/párrafos de un
// Word/PDF. Cada segmento se divide en "partes" de tamaño acotado para que el
// agente las lea bajo demanda en vez de recibir todo el documento de una vez.

const TAM_PARTE = 20000; // caracteres por parte
const TAM_CELDA_DEDUP = 120; // celdas más largas que esto se deduplican dentro del segmento
const MAX_SEGMENTOS = 60;

export function limpiar(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

// Texto normalizado para comparar citas: minúsculas, sin tildes, sin separadores.
export function normalizar(s) {
  return String(s ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[|•·▪►\t]/g, " ")
    .replace(/[“”"«»]/g, '"').replace(/[‘’`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function partir(texto) {
  const partes = [];
  let actual = "";
  for (const linea of texto.split("\n")) {
    if (actual.length + linea.length + 1 > TAM_PARTE && actual) {
      partes.push(actual);
      actual = "";
    }
    // Una línea gigante (celda enorme) se corta a la fuerza.
    if (linea.length > TAM_PARTE) {
      for (let i = 0; i < linea.length; i += TAM_PARTE) partes.push(linea.slice(i, i + TAM_PARTE));
      continue;
    }
    actual += (actual ? "\n" : "") + linea;
  }
  if (actual) partes.push(actual);
  return partes.length ? partes : [""];
}

// hojas: [{ nombre, filas: [[celda, ...], ...] }]
export function segmentosDesdeHojas(hojas) {
  const segmentos = [];
  for (const hoja of hojas) {
    const vistas = new Map();
    const lineasLectura = [];
    const lineasOriginales = [];
    let anterior = null;
    for (const fila of hoja.filas || []) {
      const celdas = (fila || []).map(limpiar).filter(Boolean);
      if (!celdas.length) continue;
      const original = celdas.join(" | ");
      if (original === anterior) continue; // filas idénticas consecutivas (celdas combinadas)
      anterior = original;
      lineasOriginales.push(original);
      const lectura = celdas.map((c) => {
        if (c.length <= TAM_CELDA_DEDUP) return c;
        if (vistas.has(c)) return `[=T${vistas.get(c)}]`;
        vistas.set(c, vistas.size + 1);
        return `<T${vistas.size}> ${c}`;
      });
      lineasLectura.push(lectura.join(" | "));
    }
    if (!lineasOriginales.length) continue;
    segmentos.push({
      nombre: `Hoja: ${hoja.nombre}`,
      original: lineasOriginales.join("\n"),
      lectura: lineasLectura.join("\n"),
    });
  }
  return finalizar(segmentos);
}

// Documentos de texto corrido (Word, PDF, TXT). paginas: string[] (una por página, o un solo bloque).
export function segmentosDesdeTexto(nombre, paginas) {
  const lista = Array.isArray(paginas) ? paginas : [paginas];
  const texto = lista.map((p) => String(p || "").split("\n").map(limpiar).filter(Boolean).join("\n")).join("\n");
  // Bloques de ~2 partes para que el índice sea navegable.
  const bloques = partir(texto);
  const segmentos = [];
  for (let i = 0; i < bloques.length; i += 2) {
    const t = bloques.slice(i, i + 2).join("\n");
    segmentos.push({ nombre: `${nombre} (bloque ${segmentos.length + 1})`, original: t, lectura: t });
  }
  return finalizar(segmentos);
}

function finalizar(segmentos) {
  if (segmentos.length > MAX_SEGMENTOS) {
    // Fusiona los sobrantes en el último para no perder contenido.
    const resto = segmentos.splice(MAX_SEGMENTOS - 1);
    segmentos.push({
      nombre: "Contenido restante",
      original: resto.map((s) => `## ${s.nombre}\n${s.original}`).join("\n"),
      lectura: resto.map((s) => `## ${s.nombre}\n${s.lectura}`).join("\n"),
    });
  }
  return segmentos.map((s, i) => ({
    id: `S${i + 1}`,
    nombre: s.nombre,
    original: s.original,
    partes: partir(s.lectura),
  }));
}

export function resumenDocumento(segmentos) {
  const caracteres = segmentos.reduce((n, s) => n + s.original.length, 0);
  return {
    segmentos: segmentos.length,
    caracteres,
    tokens_aprox: Math.round(segmentos.reduce((n, s) => n + s.partes.join("").length, 0) / 3.5),
  };
}
