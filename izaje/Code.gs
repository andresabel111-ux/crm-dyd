/**
 * RF03 · Maniobras de Izaje — Backend Google Apps Script
 * Recibe el registro desde izaje/index.html y:
 *   1) Guarda fotos + firma en una carpeta de Drive por folio
 *   2) Registra 1 fila en hoja "Inspecciones" y 7 filas en hoja "Detalle"
 *   3) Genera un PDF del informe y lo envía por correo
 * Deploy: Implementar > Nueva implementación > Aplicación web
 *         Ejecutar como: Yo · Acceso: Cualquier usuario
 */

const CONFIG = {
  TOKEN: 'izaje-rf03-cambiar',         // debe coincidir con TOKEN en index.html
  SHEET_ID: '',                         // vacío = se crea "RF03 Izaje - Registro" automáticamente
  FOLDER_ID: '',                        // vacío = se crea carpeta "RF03 Izaje - Evidencias"
  CC_FIJO: '',                          // correo(s) que siempre reciben copia, ej: 'prevencion@empresa.cl'
  ALERTA_NO_CONFORME: '',               // correo(s) extra que reciben SOLO los NO CONFORME
};

const H_INSP = ['Folio','Fecha','Hora','Rol','Nombre','RUT','Empresa','Cargo','Faena/Área','N° Plan','Equipo','ID Equipo',
  'Carga (t)','% Capacidad','Descripción','GPS','Resultado','Controles NO','CCP1','CCP2','CCP3','CCP4','CCP5','CCM1','CCM2',
  'Observaciones','Carpeta evidencias','PDF','Enviado a','Recibido'];
const H_DET = ['Folio','Fecha','Rol','Faena/Área','Equipo','Control','Título','Pregunta','Respuesta','Comentario','N° fotos','Fotos','Inspector'];

function doGet() {
  return json({ ok: true, app: 'RF03 Izaje', sheet: getSS().getUrl() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const d = JSON.parse(e.postData.contents);
    if (d.token !== CONFIG.TOKEN) return json({ ok: false, error: 'Token inválido' });
    if (!d.folio || !Array.isArray(d.controles)) return json({ ok: false, error: 'Payload incompleto' });

    const ss = getSS();
    const shI = sheet(ss, 'Inspecciones', H_INSP);
    const shD = sheet(ss, 'Detalle', H_DET);

    // Idempotencia: si la cola offline reintenta, no duplicar
    const folios = shI.getLastRow() > 1 ? shI.getRange(2, 1, shI.getLastRow() - 1, 1).getValues().flat() : [];
    if (folios.indexOf(d.folio) > -1) return json({ ok: true, folio: d.folio, duplicado: true });

    // 1) Evidencias a Drive
    const root = getFolder();
    const fd = root.createFolder(d.folio + ' · ' + (d.area || '') + ' · ' + d.resultado);
    const imgs = {}; // codigo -> [{url, b64}]
    d.controles.forEach(c => {
      imgs[c.codigo] = (c.fotos || []).map(f => {
        const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.type || 'image/jpeg', f.name);
        const file = fd.createFile(blob);
        return { url: file.getUrl(), b64: f.data };
      });
    });
    let firmaUrl = '';
    if (d.firma) firmaUrl = fd.createFile(Utilities.newBlob(Utilities.base64Decode(d.firma), 'image/png', 'firma.png')).getUrl();

    // 2) PDF
    const pdf = Utilities.newBlob(htmlInforme(d, imgs), 'text/html', d.folio + '.html').getAs('application/pdf').setName(d.folio + '.pdf');
    const pdfFile = fd.createFile(pdf);

    // 3) Planilla
    const gps = d.gps ? d.gps.lat + ',' + d.gps.lng + ' (±' + d.gps.acc + 'm)' : '';
    const r = {}; d.controles.forEach(c => r[c.codigo] = c.resp);
    shI.appendRow([d.folio, d.fecha, d.hora, d.rol, d.nombre, d.rut, d.empresa, d.cargo, d.area, d.plan, d.equipo, d.equipoId,
      d.carga, d.capacidad, d.desc, gps, d.resultado, (d.noConformes || []).join(', '),
      r.CCP1, r.CCP2, r.CCP3, r.CCP4, r.CCP5, r.CCM1, r.CCM2, d.obs, fd.getUrl(), pdfFile.getUrl(), d.correos, new Date()]);
    colorResultado(shI, shI.getLastRow(), d.resultado);

    const rows = d.controles.map(c => [d.folio, d.fecha, d.rol, d.area, d.equipo, c.codigo, c.titulo, c.pregunta, c.resp, c.com,
      imgs[c.codigo].length, imgs[c.codigo].map(x => x.url).join('\n'), d.nombre]);
    shD.getRange(shD.getLastRow() + 1, 1, rows.length, H_DET.length).setValues(rows);

    // 4) Correo
    const no = d.resultado === 'NO CONFORME';
    const to = [d.correos, no ? CONFIG.ALERTA_NO_CONFORME : ''].filter(String).join(',');
    const mail = {
      to: to,
      subject: (no ? '⛔ [NO CONFORME] ' : '✅ [CONFORME] ') + 'RF03 Izaje · ' + d.area + ' · ' + d.equipo + ' ' + d.equipoId + ' · ' + d.folio,
      htmlBody: htmlCorreo(d, fd.getUrl(), ss.getUrl()),
      attachments: [pdf],
      name: 'RF03 Maniobras de Izaje'
    };
    if (CONFIG.CC_FIJO) mail.cc = CONFIG.CC_FIJO;
    MailApp.sendEmail(mail);

    return json({ ok: true, folio: d.folio, carpeta: fd.getUrl(), pdf: pdfFile.getUrl() });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Helpers ---------- */
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function getSS() {
  const p = PropertiesService.getScriptProperties();
  const id = CONFIG.SHEET_ID || p.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create('RF03 Izaje - Registro');
  p.setProperty('SHEET_ID', ss.getId());
  return ss;
}
function getFolder() {
  const p = PropertiesService.getScriptProperties();
  const id = CONFIG.FOLDER_ID || p.getProperty('FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const f = DriveApp.createFolder('RF03 Izaje - Evidencias');
  p.setProperty('FOLDER_ID', f.getId());
  return f;
}
function sheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#26355D').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    const def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  }
  return sh;
}
function colorResultado(sh, row, res) {
  const c = sh.getRange(row, H_INSP.indexOf('Resultado') + 1);
  c.setBackground(res === 'NO CONFORME' ? '#FEE2E2' : '#DCFCE7').setFontWeight('bold');
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
function colorResp(r) { return r === 'SI' ? '#16A34A' : r === 'NO' ? '#DC2626' : '#64748B'; }

function cabecera(d) {
  const filas = [['Folio', d.folio], ['Fecha / Hora', d.fecha + ' ' + d.hora], ['Rol', d.rol], ['Inspector', d.nombre + ' · ' + d.rut],
    ['Empresa / Cargo', d.empresa + ' · ' + d.cargo], ['Faena / Área', d.area], ['N° Plan de izaje', d.plan],
    ['Equipo', d.equipo + ' · ' + d.equipoId], ['Carga', (d.carga || '-') + ' t · ' + (d.capacidad || '-') + '% capacidad'],
    ['Descripción', d.desc], ['GPS', d.gps ? d.gps.lat + ', ' + d.gps.lng : 'No capturado']];
  return '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    filas.map(f => '<tr><td style="padding:4px 6px;border:1px solid #ddd;background:#f5f6f8;font-weight:bold;width:32%">' + f[0] +
      '</td><td style="padding:4px 6px;border:1px solid #ddd">' + esc(f[1]) + '</td></tr>').join('') + '</table>';
}
function banner(d) {
  const no = d.resultado === 'NO CONFORME';
  return '<div style="padding:10px 12px;border-radius:6px;color:#fff;font-weight:bold;margin:10px 0;background:' + (no ? '#DC2626' : '#16A34A') + '">' +
    (no ? '⛔ NO CONFORME — Controles no verificados: ' + esc((d.noConformes || []).join(', ')) + '. La maniobra no debe iniciarse hasta corregir.' :
      '✅ CONFORME — Todos los controles críticos verificados.') + '</div>';
}

function htmlInforme(d, imgs) {
  const ctl = d.controles.map(c =>
    '<div style="border:1px solid #ddd;border-left:5px solid ' + colorResp(c.resp) + ';padding:8px;margin:8px 0;page-break-inside:avoid">' +
    '<b>' + c.codigo + ' – ' + esc(c.titulo) + '</b> <span style="float:right;color:#fff;background:' + colorResp(c.resp) +
    ';padding:2px 8px;border-radius:4px;font-weight:bold">' + c.resp + '</span>' +
    '<div style="font-size:11px;color:#555;margin:4px 0">' + esc(c.pregunta) + '</div>' +
    (c.com ? '<div style="font-size:12px"><b>Comentario:</b> ' + esc(c.com) + '</div>' : '') +
    (imgs[c.codigo].length ? '<div style="margin-top:6px">' + imgs[c.codigo].map(x =>
      '<img src="data:image/jpeg;base64,' + x.b64 + '" style="width:220px;margin:3px;border:1px solid #ccc">').join('') + '</div>' : '') +
    '</div>').join('');
  return '<html><body style="font-family:Arial,sans-serif;color:#1D2433">' +
    '<div style="background:#E8601C;color:#fff;padding:10px 14px;font-size:20px;font-weight:bold">RF 03 · MANIOBRAS DE IZAJE</div>' +
    '<div style="font-size:12px;color:#666;margin:4px 0 10px">Verificación de controles críticos — ' + esc(d.rol) + '/a</div>' +
    banner(d) + cabecera(d) + '<h3 style="color:#26355D">Controles críticos</h3>' + ctl +
    (d.obs ? '<h3 style="color:#26355D">Observaciones</h3><p style="font-size:12px">' + esc(d.obs) + '</p>' : '') +
    '<h3 style="color:#26355D">Firma</h3><img src="data:image/png;base64,' + d.firma + '" style="height:90px;border-bottom:1px solid #333">' +
    '<div style="font-size:12px">' + esc(d.nombre) + ' · ' + esc(d.rut) + '</div>' +
    '<p style="font-size:10px;color:#888;margin-top:16px">Registro generado ' + new Date().toLocaleString('es-CL') + ' · Datos tratados conforme Ley 21.719.</p>' +
    '</body></html>';
}

function htmlCorreo(d, carpeta, planilla) {
  const t = d.controles.map(c => '<tr><td style="padding:5px;border:1px solid #ddd"><b>' + c.codigo + '</b> ' + esc(c.titulo) +
    '</td><td style="padding:5px;border:1px solid #ddd;text-align:center;color:#fff;font-weight:bold;background:' + colorResp(c.resp) + '">' + c.resp +
    '</td><td style="padding:5px;border:1px solid #ddd">' + esc(c.com) + '</td></tr>').join('');
  return '<div style="font-family:Arial,sans-serif;max-width:640px">' +
    '<div style="background:#E8601C;color:#fff;padding:10px 14px;font-size:18px;font-weight:bold">RF 03 · Maniobras de Izaje</div>' +
    banner(d) + cabecera(d) +
    '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:10px"><tr style="background:#26355D;color:#fff">' +
    '<th style="padding:5px">Control</th><th style="padding:5px">Resp.</th><th style="padding:5px">Comentario</th></tr>' + t + '</table>' +
    (d.obs ? '<p><b>Observaciones:</b> ' + esc(d.obs) + '</p>' : '') +
    '<p><a href="' + carpeta + '">📁 Ver evidencias fotográficas</a> &nbsp;·&nbsp; <a href="' + planilla + '">📊 Abrir planilla</a></p>' +
    '<p style="font-size:11px;color:#888">Informe PDF adjunto.</p></div>';
}

/** Ejecutar 1 vez manualmente para autorizar permisos y crear planilla + carpeta */
function setup() {
  const ss = getSS(); sheet(ss, 'Inspecciones', H_INSP); sheet(ss, 'Detalle', H_DET);
  Logger.log('Planilla: ' + ss.getUrl());
  Logger.log('Carpeta:  ' + getFolder().getUrl());
}
