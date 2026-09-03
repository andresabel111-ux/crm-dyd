// proxy.js v3 - CRM DYD Arena
// Una sola URL GAS (API v20) para lecturas y escrituras.
// v3: propaga errores reales del GAS en vez de devolver 200 siempre.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GAS = 'https://script.google.com/macros/s/AKfycbyktSeakiP4QiNaYW9g3vnZxAE38WH2KnlkKVoJlkaUht9RJydfF8um5t6G10tiqXhHpw/exec';

  const accion = (req.query.accion || '').toString();
  if (!accion) return res.status(400).json({ ok: false, error: 'Falta parametro accion' });

  const params = new URLSearchParams(req.query).toString();

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch(`${GAS}?${params}`, { redirect: 'follow', signal: ctrl.signal });
    clearTimeout(t);

    const texto = await r.text();

    // Si el deployment de Apps Script muere (404) devuelve HTML.
    // Antes esto salia como 200 y el front mostraba 'Venta registrada' sin guardar nada.
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: 'Apps Script respondio ' + r.status });
    }
    if (/^\s*</.test(texto)) {
      return res.status(502).json({ ok: false, error: 'Apps Script devolvio HTML (deployment invalido o sin acceso publico)' });
    }

    let json;
    try { json = JSON.parse(texto); }
    catch (e) { return res.status(502).json({ ok: false, error: 'Respuesta no-JSON del GAS' }); }

    if (json && json.ok === false) return res.status(502).json(json);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(json));
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Timeout (25s) contra Apps Script' : e.message;
    return res.status(504).json({ ok: false, error: msg });
  }
};
