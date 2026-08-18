module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // URL principal del CRM (getClientes, addVenta, etc.)
  const GAS_MAIN = 'https://script.google.com/macros/s/AKfycbwg15wVGvEp98Aq1S0OnafmISuSz_fqpXDmq9q8gTcIJyL-tUafIHof99ZntkLhYVGBTg/exec';

  // URL secundaria solo para updateCliente (observaciones y recordatorio)
  const GAS_UPDATE = 'https://script.google.com/macros/s/AKfycbyoRYlB_MZIxtDMSXKiMV8O1jckzliI5s7Dah-ySI6D_rMLVILCmXF5GkK7D0dM8ujIyQ/exec';

  const accion = (req.query.accion || '').toString();
  const GAS = accion === 'updateCliente' ? GAS_UPDATE : GAS_MAIN;
  const params = new URLSearchParams(req.query).toString();

  try {
    const r = await fetch(`${GAS}?${params}`, { redirect: 'follow' });
    const texto = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(texto);
  } catch (mi) {
    return res.status(500).json({ error: mi.message });
  }
};
