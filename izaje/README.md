# RF03 · Maniobras de Izaje — App de terreno

Checklist de controles críticos (CCP1–CCP5, CCM1–CCM2) para Trabajador/a y Supervisor/a, con evidencia fotográfica, firma, GPS, envío por correo (PDF) y registro en Google Sheets.

**Archivos**
- `index.html`: la app de terreno. Vercel la publica en `/izaje/`.
- `panel.html`: el panel de indicadores, en `/izaje/panel.html`.
- `Code.gs`: el backend en Google Apps Script (planilla, carpeta en Drive, PDF, correo y datos del panel).
- `sw.js`, `manifest.webmanifest`, `icon-*.png`: hacen que la app se instale en el celular y abra sin señal.
- `../vercel.json`: redirige `/izaje` a `/izaje/`, porque el service worker solo controla la ruta con barra final.

## Puesta en marcha (unos 10 minutos)
1. Entra a https://script.google.com y crea un **Nuevo proyecto**. Pega el contenido de `Code.gs`.
2. En `CONFIG`, cambia `TOKEN` y `PANEL_KEY`, y si quieres `CC_FIJO` y `ALERTA_NO_CONFORME`. En **Configuración del proyecto**, pon la zona horaria en `America/Santiago`.
3. Ejecuta la función `setup` y acepta los permisos (Sheets, Drive, Gmail). El registro muestra las URL de la planilla y de la carpeta.
4. Ve a **Implementar → Nueva implementación → Aplicación web**. Elige *Ejecutar como: Yo* y *Acceso: Cualquier usuario*. Copia la URL `/exec`.
5. En `index.html`, pega esa URL en `GAS_URL` y el mismo `TOKEN`. En `panel.html`, pega la misma URL en `GAS_URL`.
6. Haz push. Vercel despliega solo y la app queda en `https://<proyecto>.vercel.app/izaje`.
7. En el celular, abre el menú del navegador y elige **Agregar a pantalla de inicio**.

## Uso sin señal (PWA)
- La primera vez hay que abrir la app con señal. Desde ahí queda guardada en el teléfono y abre aunque no haya cobertura. Cuando está lista, la app muestra "✔ App disponible sin señal".
- Los registros hechos sin señal quedan en cola y se envían solos al recuperar conexión.
- Al publicar cambios en `index.html`, sube `VERSION` en `sw.js` para que los teléfonos tomen la versión nueva.

## Panel de indicadores
- Abre `/izaje/panel.html` e ingresa la `PANEL_KEY`. Esa clave es distinta del `TOKEN` porque el token va visible en la app de terreno.
- Muestra la tasa de NO CONFORME, la tendencia diaria o semanal, el % de NO por control y la tasa por faena, por equipo y por rol. Incluye los últimos 50 registros con enlace al PDF y a las fotos.
- Mientras `GAS_URL` no esté configurada, el panel muestra **datos de demostración**. Sirve para presentarlo a un cliente; también se fuerza con `?demo=1`.

Si cambias `Code.gs`, vuelve a publicar con **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Así la URL no cambia.

## Reglas de negocio
- Si cualquier control queda en **NO**, el resultado es **NO CONFORME** y la app muestra el aviso "DETENER". El correo sale con ⛔ en el asunto.
- **NO** pide comentario y al menos 1 foto. **N/A** pide una justificación.
- `FOTO_OBLIGATORIA = 'TODAS'` en `index.html` obliga a subir foto en cada control.
- Cada foto lleva un sello con el control, la fecha y hora, y el GPS.
- Sin señal, el registro se guarda en el teléfono (IndexedDB) y se reenvía al reconectar. El folio evita duplicados.

## Límites
- Gmail personal permite unos 100 correos al día y Google Workspace unos 1.500.
- Una ejecución de Apps Script dura como máximo 6 minutos. Con 28 fotos comprimidas (~250 KB cada una) tarda entre 15 y 40 s.
