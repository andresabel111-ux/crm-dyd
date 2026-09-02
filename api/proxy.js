// proxy.js v2 — CRM DYD Arena
// Una sola URL GAS para lecturas y escrituras
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GAS = 'https://script.google.com/macros/s/AKfycbyktSeakiP4QiNaYW9g3vnZxAE38WH2KnlkKVoJlkaUht9RJydfF8um5t6G10tiqXhHpw/exec';

  const params = new URLSearchParams(req.query).toString();
  try {
    const r = await fetch(`${GAS}?${params}`, { redirect: 'follow' });
    const texto = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(texto);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
