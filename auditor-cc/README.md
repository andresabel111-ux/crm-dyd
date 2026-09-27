# AuditaCC — Auditor agéntico de controles críticos

Herramienta web que audita documentos de prevención de riesgos (procedimientos/PTS, matrices IPER/MIPER, mapas de proceso y COP) contra un marco de **controles críticos para riesgos de fatalidad (RF)**. El marco es trazable a los códigos RF/CC de la guía SIGO-G-014 (Rev. 000).

**Regla de negocio:** los controles críticos son restrictivos. Cada control se evalúa como SÍ o NO, y un solo control no cubierto deja el RF, y por lo tanto la tarea, **NO HABILITADO**. El veredicto lo calcula el código, no la IA.

## Cómo funciona

```
Navegador                                   Servidor (Vercel)                     Anthropic API
─────────                                   ─────────────────                     ─────────────
1. Lee el Excel/Word/PDF LOCALMENTE  ──►  2. Pre-análisis por reglas (sin IA):
   (el archivo no sale del equipo;          códigos RF/CC, CC faltantes,
    solo se envía su texto)                 códigos inexistentes o mal asignados
                                         3. Arnés agéntico, 1 paso por llamada ──►  Claude decide qué leer,
   Muestra progreso en vivo       ◄──────    - estado firmado (HMAC)                  qué evaluar y qué
                                             - herramientas: leer_segmento,           hallazgos registrar
                                               buscar_texto, consultar_marco,
                                               registrar_evaluaciones,
                                               registrar_hallazgos, finalizar
                                             - valida cada cita contra el texto
                                             - límites de pasos y costo
4. Informe: veredicto, matriz RF×CC,  ◄── 5. Veredicto determinístico
   hallazgos, checklist de terreno,
   imprimir a PDF
```

Controles del arnés contra errores de la IA:

| Riesgo | Control |
|---|---|
| La IA inventa evidencia | Toda afirmación de cumplimiento exige una **cita literal**. El arnés la busca en el documento y rechaza las que no existen. |
| La IA evalúa un control inexistente | Los códigos RF/CC se validan contra el marco. |
| La IA "aprueba" por criterio propio | El veredicto HABILITA / NO HABILITA es una regla de código. |
| La IA cierra sin terminar | El primer cierre con controles o RF pendientes se rechaza. Lo que no se evaluó cuenta como NO. |
| Costo descontrolado | Límite de pasos (`MAX_PASOS`) y de USD por auditoría (`MAX_USD_POR_AUDITORIA`). |
| Timeout serverless | Un paso del agente por llamada HTTP; el navegador encadena los pasos. |
| Manipulación del estado | El estado viaja comprimido y firmado con HMAC; si se altera, se rechaza. |

## Estructura

```
index.html            Interfaz (un archivo). Lee archivos en el navegador con vendor/*.js
api/auditar.js        Endpoint serverless: acceso | iniciar | paso
lib/marco.js          Marco de criterios (31 RF, 158 controles). Redacción propia.
lib/extraer.js        Documento → segmentos (hojas/bloques) y partes legibles
lib/preanalisis.js    Detección determinística de RF/CC
lib/agente.js         Arnés: prompt, herramientas, validaciones, veredicto
lib/estado.js         Sellado del estado (gzip + HMAC)
vendor/               SheetJS, mammoth, pdf.js (locales: funcionan aunque la red bloquee CDNs)
scripts/              Pruebas y servidor local
```

## Probar localmente

```bash
npm install
npm test                                  # arnés con modelo simulado (sin costo)
npm run preanalisis -- ejemplos/COP.xlsx  # solo reglas, sin IA
npm run dev                               # interfaz en http://localhost:3000 con IA simulada (código DEMO-2026)

# Con IA real (consume saldo):
ANTHROPIC_API_KEY=sk-ant-... node scripts/probar-api.js ejemplos/COP.xlsx cop
ANTHROPIC_API_KEY=sk-ant-... npm run dev:real
```

`ejemplos/` está excluida del repositorio (.gitignore). No se suben documentos de clientes.

## Despliegue en Vercel

1. **Proyecto.** En Vercel: *Add New → Project →* importar este repositorio. Si el código sigue dentro de `crm-dyd`, definir **Root Directory = `auditor-cc`**. Framework: *Other*. Sin build command.
2. **Variables de entorno** (*Settings → Environment Variables*):
   | Variable | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | Tu key de console.anthropic.com (con límite de gasto mensual configurado allí) |
   | `STATE_SECRET` | Cadena aleatoria de 64 caracteres (`openssl rand -hex 32`) |
   | `ACCESS_CODES` | `{"CLIENTE-A-2026":{"cliente":"Empresa A","vence":"2026-12-31"}}` |
   | `MODEL` (opcional) | `claude-opus-5` (por defecto) |
   | `EFFORT` (opcional) | `high` (por defecto); `medium` reduce costo y tiempo |
   | `MAX_USD_POR_AUDITORIA` (opcional) | `4` |
3. **Deploy** y probar con un código de acceso.
4. **Nuevo cliente.** Agregar su código a `ACCESS_CODES` y redeploy. Para revocar el acceso, borrar el código.

La función `api/auditar.js` está configurada con `maxDuration: 300` s. Cada paso toma típicamente entre 10 y 90 s.

## Costos (estimación a validar con `probar-api.js`)

Modelo por defecto: Claude Opus 5 (US$5 / US$25 por millón de tokens de entrada/salida). Caché de prompt activo: las relecturas cuestan un 10%.

| Documento | Tamaño típico | Costo estimado por auditoría |
|---|---|---|
| COP / mapa de proceso | 10–30 mil tokens | US$0,5–1,5 (≈ $500–1.400 CLP) |
| Procedimiento | 20–40 mil tokens | US$0,8–2 |
| MIPER completa | 100–150 mil tokens | US$2–4 (tope configurable) |

Hosting Vercel: el plan Hobby alcanza para un piloto. Para uso comercial corresponde el plan Pro (US$20/mes), porque Hobby es solo para uso no comercial.

## Advertencias

- **Alcance.** Audita el **documento** (evidencia de diseño). No reemplaza la verificación en terreno, que se entrega como checklist, ni el juicio del profesional de prevención.
- **Propiedad intelectual.** El marco (`lib/marco.js`) está redactado con lenguaje propio y solo usa los códigos RF/CC como referencia. Antes de comercializar, conviene que un abogado valide el uso de la referencia a SIGO-G-014.
- **Datos personales (Ley 21.719).** Los documentos pueden contener nombres, RUT o datos de salud. Su texto se envía a Anthropic para el análisis y no se almacena en el servidor de la herramienta (el estado vive en el navegador). Hay que informarlo al cliente en los términos de servicio y recomendar anonimizar antes de subir.
- **Marco.** Versión `1.0.0`. Si el estándar se actualiza, se actualiza `lib/marco.js` y su versión, que queda registrada en cada informe.
