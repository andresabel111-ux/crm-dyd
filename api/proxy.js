module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GAS = 'https://script.google.com/macros/s/AKfycbwg15wVGvEp98Aq1S0OnafmISuSz_fqpXDmq9q8gTcIJyL-tUafIHof99ZntkLhYVGBTg/exec';
  const params = new URLSearchParams(req.query).toString();

  try {
    const r = await fetch(`${GAS}?${params}`, { redirect: 'follow' });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
