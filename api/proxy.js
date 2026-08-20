module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const GAS_MAIN = 'https://script.google.com/macros/s/AKfycbwg15wVGvEp98Aq1S0OnafmISuSz_fqpXDmq9q8gTcIJyL-tUafIHof99ZntkLhYVGBTg/exec';
    const GAS_UPDATE = 'https://script.google.com/macros/s/AKfycbzLiT3KhhNTeLVztUuL_vIW__YMMa4y3y0a0WdJyauZENbU-XtTHthG_ILw-OOUAEQfew/exec';

    const accion = (req.query.accion || '').toString();
    const ESCRITURAS = ['addVenta', 'addCliente', 'updateContacto', 'updateCliente', 'addPipeline', 'deletePipeline', 'updatePipeline'];
    const GAS = ESCRITURAS.includes(accion) ? GAS_UPDATE : GAS_MAIN;

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
