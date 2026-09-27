// Marco de criterios de auditoría documental de controles críticos.
// Redacción propia. Los códigos RF/CC se usan solo como referencia de
// trazabilidad hacia la guía de verificación SIGO-G-014 (Rev. 000); ningún
// texto de ese documento se reproduce aquí.
//
// Cada control: [id, nombre, requisito documental, verificación en terreno]
// - id: CCPn (control crítico preventivo) o CCMn (control crítico mitigador)
// - requisito documental: lo que el documento auditado debe establecer de
//   forma explícita para considerar el control cubierto.
// - verificación en terreno: lo que el auditor debe constatar después en campo
//   (la herramienta no lo evalúa; lo entrega como checklist).

export const MARCO_VERSION = "1.0.0";

export const MARCO = [
  {
    rf: "RF01", nombre: "Energía eléctrica",
    claves: ["eléctric", "tensión", "tablero", "subestación", "energizado", "arco", "5 reglas de oro", "SODI"],
    controles: [
      ["CCP1", "Personal habilitado para intervenir sistemas eléctricos", "Define que solo interviene personal con autorización eléctrica vigente y trazable, e indica quién la otorga y cómo se verifica.", "Constatar que quienes intervienen portan su autorización eléctrica vigente."],
      ["CCP2", "Acceso controlado a instalaciones eléctricas", "Establece quién puede ingresar a salas, tableros o equipos eléctricos, cómo se autoriza y cómo se mantienen custodiados.", "Ver señalización, distancias de seguridad y elementos de segregación instalados."],
      ["CCP3", "Herramientas e instrumentos eléctricos verificados", "Exige inspección/verificación de herramientas e instrumentos eléctricos antes del uso y define qué hacer ante desviaciones.", "Revisar que las herramientas en uso tengan su verificación vigente."],
      ["CCP4", "Intervención en condición eléctricamente segura", "Describe la secuencia de desenergización (corte, bloqueo, verificación de ausencia de tensión, puesta a tierra, señalización) y la autorización formal de la intervención.", "Observar la intervención con autorización vigente y la secuencia de desenergización aplicada."],
      ["CCM1", "EPP específico para riesgo eléctrico", "Define el EPP para arco/choque eléctrico según la energía de la instalación y exige su inspección antes del uso.", "Ver al personal usando el EPP definido e inspeccionado."],
      ["CCM2", "Protecciones eléctricas en media y alta tensión", "Hace referencia a un plan de mantenimiento y pruebas de las protecciones eléctricas críticas.", "Confirmar plan vigente y pruebas ejecutadas según programa."],
      ["CCM3", "Respuesta ante emergencia eléctrica", "Incluye actuación ante accidente eléctrico: brigada, kit de rescate eléctrico, comunicación y simulacros.", "Ver kit de rescate completo y brigada entrenada en riesgo eléctrico."],
    ],
  },
  {
    rf: "RF02", nombre: "Trabajo en altura",
    claves: ["altura", "arnés", "andamio", "plataforma", "anclaje", "línea de vida", "SPDC", "caída a distinto nivel"],
    controles: [
      ["CCP1", "Superficies y plataformas de trabajo íntegras", "Exige que andamios/plataformas cuenten con diseño o cálculo, inspección con estado visible (habilitado/no habilitado) y capacidad de carga señalizada.", "Ver tarjeta de estado y carga máxima señalizada y respetada."],
      ["CCP2", "Personal acreditado para trabajo en altura", "Restringe la tarea a personal acreditado y con aptitud médica vigente, y exige permiso de trabajo.", "Constatar credencial de altura y permiso de trabajo en terreno."],
      ["CCM1", "Sistema personal de detención de caídas", "Define el SPDC certificado a usar, su inspección periódica y de preuso, y su forma correcta de uso.", "Ver arnés ajustado y conectado a punto de anclaje validado."],
      ["CCM2", "Puntos de anclaje certificados", "Exige puntos de anclaje o líneas de vida con certificación o cálculo, identificados con capacidad y vigencia.", "Ver anclaje identificado, vigente y sin daños."],
      ["CCM3", "Rescate de persona suspendida", "Incluye un plan de rescate específico para la tarea, recursos disponibles y simulacros.", "Preguntar a los trabajadores cómo actuar ante una persona suspendida."],
    ],
  },
  {
    rf: "RF03", nombre: "Maniobras de izaje",
    claves: ["izaje", "grúa", "rigger", "eslinga", "grillete", "carga suspendida", "puente grúa", "plan de izaje"],
    controles: [
      ["CCP1", "Equipos y aparejos de izaje conformes", "Exige certificación, mantenimiento e inspección de equipos y aparejos (código de color o equivalente) y criterio de descarte.", "Ver aparejos con código de color vigente y sin daños."],
      ["CCP2", "Posicionamiento y estabilizadores de equipos móviles", "Exige evaluación del terreno/superficie de apoyo y uso de estabilizadores extendidos sobre bases adecuadas.", "Ver estabilizadores extendidos sobre almohadillas."],
      ["CCP3", "Operadores y riggers acreditados", "Restringe la maniobra a operadores y riggers con credencial y aptitud médica vigentes.", "Constatar credenciales portadas durante la maniobra."],
      ["CCP4", "Comunicación operador–rigger", "Define protocolo de comunicación (señales/radio, canal asignado) y prueba previa.", "Ver radios operativos y prueba de comunicación antes del izaje."],
      ["CCP5", "Plan de izaje con criterio de criticidad", "Exige plan de izaje aprobado que define cuándo un izaje es crítico y los controles asociados (carga, equipo, entorno).", "Contrastar la maniobra con el plan de izaje aprobado."],
      ["CCM1", "Segregación del área de maniobra", "Define segregación física del área bajo la carga y control de acceso durante la operación.", "Ver barreras, señalización y control de acceso instalados."],
      ["CCM2", "Respuesta ante emergencia de izaje", "Incluye paradas de emergencia operativas y plan de emergencia/rescate para accidentes de izaje.", "Ver personal capacitado, paradas de emergencia operativas y kit de rescate."],
    ],
  },
  {
    rf: "RF04", nombre: "Liberación descontrolada de energía",
    claves: ["bloqueo", "energía cero", "presión", "hidráulic", "neumátic", "energía residual", "válvula", "LOTO"],
    controles: [
      ["CCP1", "Aislación, bloqueo y verificación de energía cero", "Describe identificación de energías, aislación, bloqueo personal, control de energías residuales y verificación de energía cero antes de intervenir.", "Ver bloqueos instalados y prueba de energía cero realizada."],
      ["CCP2", "Integridad de elementos de contención de energía", "Exige inspección y reemplazo programado de mangueras, líneas, recipientes y componentes, prohibiendo operar con elementos dañados o vencidos.", "Ver componentes sin daños ni reparaciones improvisadas."],
      ["CCP3", "Dispositivos de protección de presión", "Exige inventario y calibración/certificación vigente de válvulas de alivio, manómetros y similares, y prohíbe su anulación.", "Ver dispositivos operativos con sellos intactos."],
      ["CCM1", "Segregación de zonas de liberación de energía", "Define segregación con barreras (duras cuando aplique) y control de acceso en zonas de posible liberación de energía.", "Ver segregación, señalización y control de acceso."],
      ["CCM2", "Respuesta ante emergencia", "Incluye plan de emergencia, brigada y recursos de primera respuesta para este tipo de accidente, con simulacros.", "Ver kits de primera respuesta y personal capacitado."],
    ],
  },
  {
    rf: "RF05", nombre: "Caída de rocas en mina rajo",
    claves: ["rajo", "banco", "berma", "talud", "saneamiento", "frente de carguío", "pretil"],
    controles: [
      ["CCP1", "Modelo y monitoreo geotécnico de bancos", "Hace referencia a modelo geotécnico actualizado y monitoreo continuo de estabilidad en zonas críticas.", "Ver sistema de monitoreo operativo cubriendo zonas críticas."],
      ["CCP2", "Saneamiento y limpieza de bermas y taludes", "Exige saneamiento programado con personal y equipo competente, e inspección/recepción antes de liberar el área.", "Ver recepción conforme del área saneada."],
      ["CCP3", "Control topográfico y drenaje", "Exige control de alturas de frente según diseño y gestión de agua mediante drenajes.", "Ver frente en altura de diseño y drenajes habilitados."],
      ["CCM1", "Contención y segregación", "Define pretiles, mallas u otras contenciones y segregación física de zonas de riesgo, con inspección.", "Ver contenciones instaladas según estándar y en buen estado."],
      ["CCM2", "Respuesta ante emergencia", "Incluye plan de emergencia, brigada y equipos para caída o deslizamiento de rocas, con simulacros.", "Ver brigada entrenada y equipos de rescate operativos."],
    ],
  },
  {
    rf: "RF06", nombre: "Incendio",
    claves: ["incendio", "fuego", "trabajo en caliente", "soldadura", "inflamable", "combustible", "extintor", "red húmeda"],
    controles: [
      ["CCP1", "Mapa de riesgo de incendio y gestión de combustibles", "Hace referencia a un mapa de riesgo de incendio conocido por el personal y define segregación y almacenamiento de combustibles e inflamables.", "Contrastar zonas del mapa con la realidad del área."],
      ["CCP2", "Control de trabajos en caliente", "Exige permiso de trabajo en caliente, área segregada y libre de combustibles, y vigía de fuego durante y después del trabajo.", "Ver área segregada, sin combustibles y con vigía presente."],
      ["CCP3", "Control de fuentes de ignición", "Exige protecciones eléctricas/mecánicas certificadas e inspecciones termográficas programadas.", "Ver protecciones, cables y sensores operativos."],
      ["CCM1", "Detección y extinción", "Define sistemas de detección y extinción instalados, certificados e inspeccionados en áreas críticas.", "Ver detectores, extintores y redes accesibles y operativos."],
      ["CCM2", "Respuesta ante emergencia", "Incluye plan de emergencia ante incendio, brigada, vías de evacuación y simulacros.", "Ver brigada entrenada y vías de evacuación despejadas."],
    ],
  },
  {
    rf: "RF07", nombre: "Sustancias peligrosas",
    claves: ["sustancia peligrosa", "químic", "ácido", "HDS", "hoja de datos", "derrame", "HAZMAT", "reactivo", "cianuro"],
    controles: [
      ["CCP1", "Diseño, operación y señalización de instalaciones con sustancias peligrosas", "Define diseño normado, segregación, monitoreo de variables críticas, gestión de cambios y tránsito de sustancias peligrosas.", "Ver instalación según diseño y variables críticas en rango."],
      ["CCP2", "Competencias para manipulación segura", "Restringe la manipulación a personal autorizado y capacitado, con procedimiento específico, HDS disponible y EPP definido.", "Ver trabajo según procedimiento con EPP y herramientas definidas."],
      ["CCP3", "Aislación y bloqueo en sistemas con químicos", "Exige secuencia planificada de aislación, bloqueo personal, drenaje seguro y segregación considerando los peligros de la sustancia.", "Ver candado y tarjeta personal y verificación de energía cero."],
      ["CCM1", "Detección/control de fugas y EPP químico", "Define EPP por sustancia y disponibilidad de duchas, lavaojos, neutralizantes, kits antiderrame y alarmas, con personal capacitado.", "Ver sistemas disponibles y personal que sabe actuar ante fuga."],
      ["CCM2", "Respuesta ante emergencia química", "Incluye plan de emergencia química con brigada equipada, protocolos médicos (antídotos) y simulacros.", "Ver brigada equipada, antídotos y comunicación operativos."],
    ],
  },
  {
    rf: "RF08", nombre: "Tronadura y explosivos",
    claves: ["tronadura", "explosivo", "disparo", "polvorín", "carta de loros", "detonación", "tiro quedado", "cargu"],
    controles: [
      ["CCP1", "Personal acreditado en explosivos", "Restringe la tarea a personal con licencia de manipulador y acreditación vigentes.", "Contrastar personal asignado con el registro de acreditados."],
      ["CCP2", "Tronadura según diseño aprobado", "Exige diseño técnico firmado y vigente, y gestión de desviaciones antes de la detonación.", "Contrastar pozos preparados con el diseño aprobado."],
      ["CCP3", "Ajuste del diseño a condiciones reales", "Exige evaluar las condiciones del terreno el día de la tronadura y registrar ajustes al diseño.", "Pedir al supervisor la condición observada y el ajuste registrado."],
      ["CCP4", "Aislación y evacuación del área de tronadura", "Define plan de bloqueo de accesos y evacuación del halo (loros/vigías) antes del disparo.", "Ver barreras y señalización coincidentes con el plan de evacuación."],
      ["CCP5", "Vehículos de explosivos acreditados", "Exige vehículos acreditados, rotulados, mantenidos y con inspección de preuso.", "Ver rotulación y checklist de preuso completo."],
      ["CCM1", "Respuesta ante emergencia de tronadura", "Incluye comunicaciones, primera respuesta y entrenamiento para emergencias de tronadura, con simulacros.", "Preguntar al personal cómo activar la emergencia."],
    ],
  },
  {
    rf: "RF09", nombre: "Partes móviles",
    claves: ["parte móvil", "correa", "polea", "guarda", "atrapamiento", "rodillo", "transmisión", "pull cord"],
    controles: [
      ["CCP1", "Guardas y protecciones en partes móviles", "Exige guardas según estándar de diseño, con enclavamientos cuando aplique e inspección programada.", "Ver guardas instaladas, enclavamientos operativos y sin intervenir."],
      ["CCP2", "Aislación, bloqueo y energía cero", "Describe bloqueo y verificación de energía cero con mapa/matriz de energías actualizada del equipo.", "Ver bloqueo personal y verificación de energía cero."],
      ["CCM1", "Paradas de emergencia", "Exige paradas de emergencia accesibles, probadas e incluidas en el plan de inspección y mantenimiento.", "Ver botones/pull cords accesibles, señalizados y operativos."],
      ["CCM2", "Respuesta ante atrapamiento", "Incluye plan de rescate de atrapados, brigada y equipos de corte/expansión, con simulacros.", "Ver personal capacitado en primera intervención y equipos disponibles."],
    ],
  },
  {
    rf: "RF10", nombre: "Vehículos",
    claves: ["vehículo", "conductor", "camioneta", "conducción", "velocidad", "GPS", "fatiga", "tránsito"],
    controles: [
      ["CCP1", "Conductor acreditado y apto", "Exige acreditación, autorización interna y aptitud médica/psicológica vigentes del conductor.", "Ver que solo conducen autorizados con credencial válida."],
      ["CCP2", "Integridad mecánica del vehículo", "Exige mantenimiento preventivo, inspección de preuso y repuestos originales para frenos, dirección y neumáticos.", "Ver frenos, neumáticos, dirección y luces operativos."],
      ["CCP3", "Sistemas de asistencia y monitoreo", "Define sistemas de monitoreo (GPS, velocidad, fatiga, proximidad, geocercas) y su gestión.", "Ver sistema encendido y emitiendo alertas."],
      ["CCP4", "Infraestructura vial y plan de tránsito", "Hace referencia a plan de tránsito y mantenimiento vial (pretiles, bermas, señalización, lechos de frenado).", "Ver que conductores conocen el plan de tránsito y rutas en condición segura."],
      ["CCM1", "Respuesta ante emergencia vial", "Incluye plan de rescate vehicular, brigada y atención médica, con simulacros.", "Ver brigada y equipamiento de rescate disponibles."],
    ],
  },
  {
    rf: "RF11", nombre: "Espacios confinados",
    claves: ["espacio confinado", "atmósfera", "vigía", "estanque", "ducto", "medición de gases", "oxígeno"],
    controles: [
      ["CCP1", "Ingreso controlado y vigilado", "Exige permiso de ingreso autorizado, vigía exclusivo y comunicación permanente.", "Ver control de acceso, vigía presente y comunicación activa."],
      ["CCP2", "Evaluación y monitoreo de atmósfera", "Exige medición previa y monitoreo continuo/periódico según clasificación, con equipos calibrados y alarmas configuradas.", "Ver monitoreo en curso con equipo operativo y alarmas activas."],
      ["CCP3", "Identificación y preparación del espacio", "Exige catastro y señalización de espacios confinados, aislación, limpieza y ventilación definida.", "Ver señalización, ventilación definida y espacio libre de peligros."],
      ["CCM1", "Rescate en espacio confinado", "Incluye plan de rescate específico, brigada en alerta, equipos de rescate y atención médica, con simulacros.", "Ver que trabajadores saben activar la emergencia y la brigada está en alerta."],
    ],
  },
  {
    rf: "RF12", nombre: "Metales fundidos",
    claves: ["metal fundido", "fundición", "horno", "convertidor", "escoria", "colada", "sangrado", "olla"],
    controles: [
      ["CCP1", "Personal autorizado y capacitado", "Exige autorización formal y capacitación sobre riesgos y controles de metales fundidos.", "Ver autorización portada y conocimiento de riesgos."],
      ["CCP2", "Control de acceso a áreas de fundición", "Define plan de tránsito y control de acceso que impide interacción de personas con equipos y metal fundido.", "Ver ingreso solo de autorizados, comunicación radial y zonas demarcadas."],
      ["CCP3", "Control operacional del metal fundido", "Exige mantenimiento de equipos de traslado/contención y control de variables críticas (temperatura, refrigeración).", "Ver sistemas de seguridad operativos y temperatura monitoreada."],
      ["CCP4", "Control de humedad", "Define controles para evitar contacto de agua/humedad con metal fundido (herramientas, materiales, drenajes).", "Ver áreas y herramientas secas y drenajes operativos."],
      ["CCM1", "Protección personal y estructural", "Define EPP especializado por tarea y casetas/cabinas/contenciones según diseño.", "Ver EPP y barreras físicas implementadas."],
      ["CCM2", "Respuesta ante emergencia", "Incluye actuación específica ante contacto con metal fundido, brigada y atención de quemaduras.", "Ver personal capacitado en primera intervención y brigada entrenada."],
    ],
  },
  {
    rf: "RF13", nombre: "Caída de objetos",
    claves: ["caída de objetos", "trabajo en la vertical", "rodapié", "acopio", "herramienta amarrada", "trabajos simultáneos"],
    controles: [
      ["CCP1", "Estructuras y materiales asegurados en altura", "Exige inspección estructural, acopio seguro de materiales y suspensión de trabajos ante condiciones adversas.", "Ver estructuras sin daños y materiales asegurados."],
      ["CCP2", "Control de trabajos en la vertical", "Exige permiso, análisis de riesgo, herramientas amarradas y coordinación de trabajos simultáneos.", "Ver herramientas amarradas y sin trabajos superpuestos sin coordinar."],
      ["CCM1", "Contención y segregación", "Define segregación de niveles inferiores con barreras duras y rodapiés/mallas en plataformas.", "Ver barreras, rodapiés y mallas en buen estado."],
      ["CCM2", "Respuesta ante emergencia", "Incluye plan de emergencia por caída de objetos, brigada, equipo de trauma y comunicaciones.", "Ver personal capacitado y equipos de respuesta disponibles."],
    ],
  },
  {
    rf: "RF14", nombre: "Operación ferroviaria",
    claves: ["ferroviari", "locomotora", "vía férrea", "tren", "cuadrilla", "carro"],
    controles: [
      ["CCP1", "Personal ferroviario acreditado", "Exige autorización interna, capacitaciones y aptitud médica/psicológica vigentes.", "Ver credencial vigente y autorización del personal."],
      ["CCP2", "Integridad de vías y equipos", "Exige mantenimiento preventivo de vías y equipos e inspección de preuso.", "Ver vías en condición segura y checklist preoperacional completo."],
      ["CCP3", "Control de tráfico y protección de cuadrillas", "Define control centralizado del tráfico, comunicación y resguardo físico de cuadrillas en la vía.", "Ver comunicación con sala de control y resguardo de cuadrillas."],
      ["CCM1", "Respuesta ante emergencia ferroviaria", "Incluye plan de emergencia ferroviaria, brigada, ambulancia y simulacros.", "Ver brigada entrenada y equipos de rescate operativos."],
    ],
  },
  {
    rf: "RF15", nombre: "Avalanchas y aludes",
    claves: ["avalancha", "alud", "nieve", "invierno", "boletín de riesgo", "desencadenamiento", "RECCO"],
    controles: [
      ["CCP1", "Zonificación de peligro aplicada a instalaciones", "Exige evaluación territorial aprobada para instalaciones en superficie y revisión antes de cada invierno.", "Ver autorización territorial vigente y sin instalaciones temporales no retiradas."],
      ["CCP2", "Alerta temprana y organización de invierno", "Define estructura de invierno con roles asignados, niveles de alerta y dotación de especialistas.", "Preguntar al personal el nivel de alerta vigente y su rol."],
      ["CCP3", "Monitoreo nivo-meteorológico y boletín", "Exige instrumental operativo y emisión diaria de boletín de riesgos con parámetros documentados.", "Ver que el personal consultó el boletín vigente."],
      ["CCP4", "Desencadenamiento preventivo con áreas evacuadas", "Exige protocolo de evacuación y entrega de área, y confirmación formal antes del control.", "Ver señalética de segregación y puntos de evacuación conocidos."],
      ["CCP5", "Sistemas remotos de control de avalanchas", "Exige mantención planificada y ejecutada antes del invierno con personal certificado.", "Ver sistemas sin anomalías y reporte de estado por turno."],
      ["CCM1", "Búsqueda y rescate en avalancha", "Incluye brigadas con dotación y entrenamiento, comando de incidente definido y simulacros.", "Ver reflectores de búsqueda portados y punto de encuentro conocido."],
      ["CCM2", "Instalaciones resistentes en zona de avalancha", "Exige que la infraestructura permanente incorpore estudios de presión de impacto y aprobación formal.", "Ver protecciones estructurales implementadas antes del invierno."],
    ],
  },
  {
    rf: "RF16", nombre: "Vaciados, chimeneas y piques",
    claves: ["pique", "chimenea", "vaciado", "excavación vertical", "tapado", "labor abandonada"],
    controles: [
      ["CCP1", "Condiciones seguras de ingreso a piques y chimeneas", "Exige permiso, bloqueo de energías, monitoreo de atmósfera, segregación e iluminación antes del ingreso.", "Ver segregación, iluminación y atmósfera segura."],
      ["CCP2", "Fortificación y sellado de excavaciones verticales", "Exige fortificación según diseño geotécnico, catastro de labores y sellado de labores abandonadas.", "Ver fortificación según diseño y tapados herméticos."],
      ["CCM1", "Protección contra caídas", "Exige SPDC certificado conectado a anclajes o líneas de vida certificados en todo momento.", "Ver SPDC conectado a anclaje certificado el 100% del tiempo."],
      ["CCM2", "Rescate vertical", "Incluye plan de rescate vertical, brigada y equipos (trípode, huinche) con simulacros.", "Ver brigada y equipos de rescate vertical disponibles."],
    ],
  },
  {
    rf: "RF17", nombre: "Bombeo de agua-barro",
    claves: ["barro", "agua-barro", "punto de extracción", "buzón", "humedad", "telecomando", "trancadura"],
    controles: [
      ["CCP1", "Caracterización de zonas con riesgo de barro", "Exige matriz de criticidad (humedad/granulometría) actualizada y delimitación de polígonos de riesgo.", "Ver puntos en zona de riesgo señalizados y personal que conoce su criticidad."],
      ["CCP2", "Extracción remota en zonas de barro", "Exige extracción telecomandada o autónoma en zonas definidas, con equipos mantenidos y operadores licenciados.", "Ver que no hay operadores a bordo y estación remota en zona segura."],
      ["CCP3", "Secuencia y tasa de extracción según diseño", "Exige adherencia al programa de extracción y clasificación/gestión de puntos vecinos a zonas de barro.", "Ver en el monitoreo adherencia al programa sin desviaciones sin gestionar."],
      ["CCP4", "Integridad de piques, buzones y chimeneas", "Exige inspección periódica y un instructivo para trancaduras/colgaduras en condición húmeda.", "Ver ausencia de deterioro y vías de evacuación libres."],
    ],
  },
  {
    rf: "RF18", nombre: "Planchoneo",
    claves: ["planchoneo", "acuñadura", "fortificación", "perno", "shotcrete", "caída de roca subterránea"],
    controles: [
      ["CCP1", "Estabilización según diseño geotécnico", "Exige acuñadura y fortificación oportunas según diseño validado, con control de calidad.", "Ver acuñadura realizada y fortificación según diseño."],
      ["CCP2", "Perforación y tronadura según diseño", "Exige diseño validado, control de parámetros críticos y liberación post-tronadura para reingreso.", "Ver área liberada sin tiros quedados."],
      ["CCM1", "Segregación y control de acceso", "Define identificación y segregación física de zonas de riesgo con acceso solo autorizado.", "Ver barreras y señalización en accesos."],
      ["CCM2", "Operación remota en zonas críticas", "Exige equipos remotos en zonas de alto riesgo con procedimiento y mantenimiento.", "Ver comunicación y video operativos en sala de control."],
      ["CCM3", "Respuesta ante emergencia", "Incluye plan de emergencia, brigada, refugios y comunicación con simulacros.", "Ver brigada, refugios y comunicación operativos."],
    ],
  },
  {
    rf: "RF19", nombre: "Estallido de rocas",
    claves: ["estallido", "sísmic", "zona de transición", "geomecánic", "preacondicionamiento", "fracturamiento"],
    controles: [
      ["CCP1", "Diseño de excavaciones subterráneas", "Exige modelo geotécnico validado, mapas de zonas de transición difundidos y entrega formal de áreas.", "Ver mapas visibles y personal que conoce los límites de acceso."],
      ["CCP2", "Monitoreo geomecánico", "Exige instrumentación operativa, interpretación especializada y protocolos de alerta y retiro de personal.", "Ver instrumentos operativos sin alertas sin respuesta."],
      ["CCP3", "Perforación, tronadura y preacondicionamiento controlados", "Exige diseños validados, QA/QC en terreno y conciliación de resultados.", "Ver ejecución según diseño sin desviaciones de QA/QC sin gestionar."],
      ["CCP4", "Fortificación según diseño geomecánico", "Exige materiales certificados, diseños validados, QA/QC y planes de mantenimiento y reparación.", "Ver fortificación sin daños y vías de evacuación despejadas."],
      ["CCM1", "Acceso autorizado a zonas de transición", "Exige demarcación, alertas y que solo ingrese personal con formación específica y autorización gerencial.", "Ver zonas demarcadas y sin personal no autorizado."],
      ["CCM2", "Respuesta ante estallido", "Incluye procedimiento de emergencia, brigada, rescate, comunicación y programa de simulacros.", "Ver equipos de rescate operativos y punto de encuentro conocido."],
    ],
  },
  {
    rf: "RF20", nombre: "Sílice",
    claves: ["sílice", "polvo", "respirador", "EPR", "humectación", "colector", "presurización"],
    controles: [
      ["CCP1", "Control de polvo en la fuente", "Exige sistemas de supresión, humectación, colección o confinamiento con mantención y eficiencia medida.", "Ver sistemas de control de polvo operativos."],
      ["CCP2", "Control de emisiones en equipos productivos", "Define criterios de operación y mantención de equipos para evitar fugas de polvo y derrames.", "Ver ausencia de fugas y derrames."],
      ["CCM1", "Ventilación y presurización", "Exige catastro y programa de mantenimiento de ventilación y presurización de cabinas e instalaciones.", "Ver ventilación y presurización operativas."],
      ["CCM2", "Aseo industrial no contaminante", "Exige aseo solo con técnicas autorizadas (aspirado de alto vacío, limpieza húmeda) y equipos catastrados.", "Ver uso exclusivo de equipos catastrados en buen estado."],
      ["CCM3", "Protección respiratoria efectiva", "Exige programa de protección respiratoria con EPR certificado, pruebas de ajuste y registros de entrega.", "Ver respiradores del programa en buena condición."],
    ],
  },
  {
    rf: "RF21", nombre: "Arsénico",
    claves: ["arsénico", "arsenical", "metaloide", "casa de cambio", "vigilancia médica", "biomonitoreo"],
    controles: [
      ["CCP1", "Fuentes identificadas y segregadas", "Exige identificación de fuentes de arsénico, caracterización de exposición y segregación/señalización de áreas.", "Ver segregación y señalización de advertencia."],
      ["CCP2", "Sistemas de captura operativos", "Exige mantenimiento y monitoreo de variables de campanas, colectores, filtros y precipitadores.", "Ver equipos sin fugas y parámetros en rango."],
      ["CCP3", "Aseo no contaminante de material arsenical", "Exige aseo tecnificado, disposición segura de residuos y personal capacitado.", "Ver limpieza con alto vacío o vía húmeda y residuos en zona autorizada."],
      ["CCM1", "Higiene y protección personal", "Define EPP específico e instalaciones higiénicas (casas de cambio, salas de hidratación).", "Ver uso de EPP e instalaciones según estándar."],
      ["CCM2", "Vigilancia ambiental y de salud", "Exige programa de vigilancia ambiental y médica, y gestión de casos alterados.", "Ver que trabajadores conocen sus resultados de vigilancia."],
    ],
  },
  {
    rf: "RF22", nombre: "Falla de estructuras para tránsito de personas",
    claves: ["pasarela", "escalera", "plataforma fija", "baranda", "rejilla", "estructura para tránsito", "vano"],
    controles: [
      ["CCP1", "Diseño y construcción según normativa", "Exige diseño estructural de pasarelas, escaleras y plataformas por personal competente.", "Ver construcción conforme al diseño."],
      ["CCP2", "Inspección de estructuras operativas", "Exige plan de inspección con lista de chequeo e inspección especializada periódica.", "Ver ejecución de la lista de chequeo en terreno."],
      ["CCP3", "Reparación y conservación", "Exige estándar de reparación estructural y recursos para el plan de restitución.", "Ver reparaciones según estándar."],
      ["CCM1", "Segregación de condiciones inseguras", "Define cómo señalizar y segregar vanos abiertos o estructuras deterioradas.", "Ver señalización y segregación según estándar."],
      ["CCM2", "Respuesta ante emergencia", "Incluye procedimiento de emergencia, rutas y canales de comunicación para reportar.", "Ver que los trabajadores conocen las acciones ante emergencia."],
    ],
  },
  {
    rf: "RF23", nombre: "Colapso estructural del macizo rocoso",
    claves: ["colapso", "macizo rocoso", "hundimiento", "subterráne", "secuencia de producción"],
    controles: [
      ["CCP1", "Monitoreo geomecánico y control de producción", "Exige plan de monitoreo continuo, interpretación experta y control de secuencia según diseño.", "Ver instrumentos y alarmas operativos y plan de extracción cumplido."],
      ["CCP2", "Soporte y fortificación según diseño", "Exige fortificación oportuna con materiales certificados y QA/QC.", "Ver fortificación según diseño y acuñadura ejecutada."],
      ["CCP3", "Perforación y tronadura según diseño", "Exige diseños validados, QA/QC y conciliación post-tronadura.", "Ver secuencia aplicada y tiros quedados gestionados."],
      ["CCM1", "Segregación y contención estructural", "Define barreras duras y estructuras de contención con cálculo y QA/QC.", "Ver barreras y estructuras íntegras."],
      ["CCM2", "Operación remota en zonas críticas", "Exige equipos telecomandados desde áreas seguras con procedimiento y mantenimiento.", "Ver equipos en modo remoto y zonas segregadas."],
      ["CCM3", "Respuesta ante emergencia", "Incluye plan integrado de emergencia, brigada, refugios y simulacros.", "Ver brigada, refugios y comunicación disponibles."],
    ],
  },
  {
    rf: "RF24", nombre: "Taludes",
    claves: ["talud", "radar", "deslizamiento", "control de pared", "pretil"],
    controles: [
      ["CCP1", "Caracterización, modelamiento y monitoreo", "Exige captura de datos, modelos actualizados y monitoreo continuo (radares) en áreas críticas.", "Ver radares operativos cubriendo áreas críticas."],
      ["CCP2", "Tronadura de control de pared", "Exige diseños validados, parámetros críticos controlados y QA/QC.", "Ver parámetros controlados y QA/QC en terreno."],
      ["CCP3", "Saneamiento y fortificación según diseño", "Exige saneamiento y obras de fortificación según diseño con personal capacitado y QA/QC.", "Ver obras ejecutadas según diseño."],
      ["CCM1", "Pretiles y segregación", "Define pretiles y barreras según diseño y control formal de accesos.", "Ver instalación conforme y control de accesos."],
      ["CCM2", "Respuesta ante emergencia", "Incluye plan de emergencia para deslizamientos, brigada y comunicaciones con simulacros.", "Ver brigada y sistemas de rescate operativos."],
    ],
  },
  {
    rf: "RF25", nombre: "Equipos mineros e industriales",
    claves: ["equipo minero", "camión de extracción", "cargador", "pala", "bulldozer", "ROPS", "FOPS", "operador"],
    controles: [
      ["CCP1", "Operador acreditado y apto", "Exige acreditación, autorización y aptitud médica/psicológica vigentes del operador.", "Ver credencial vigente y condición apta."],
      ["CCP2", "Asistencia y monitoreo a la conducción", "Define control de velocidad, fatiga, proximidad y comunicación con centro de control.", "Ver alertas y comunicación operativas."],
      ["CCP3", "Integridad de componentes críticos", "Exige mantenimiento e inspección de frenos, dirección, neumáticos, sistemas hidráulicos y eléctricos.", "Ver sistemas operativos sin fallas visibles."],
      ["CCP4", "Infraestructura vial según diseño", "Exige inspección y mantenimiento de bermas, pretiles, radios de giro, drenaje y señalización.", "Ver infraestructura vial en condición segura."],
      ["CCM1", "Cabina con protección ROPS/FOPS", "Exige cabinas certificadas, inspeccionadas y sin modificaciones estructurales.", "Ver cabina sin daños ni modificaciones."],
      ["CCM2", "Respuesta ante emergencia", "Incluye respuesta ante colisión, incendio o volcamiento, brigada y simulacros.", "Ver brigada y medios de rescate disponibles."],
    ],
  },
  {
    rf: "RF26", nombre: "Equipos autónomos",
    claves: ["autónomo", "ODS", "anticolisión", "CIO", "operación autónoma"],
    controles: [
      ["CCP1", "Navegación segura (detección de obstáculos y GPS)", "Exige sistemas de detección de obstáculos y GPS operativos con cobertura continua y control desde centro de operación.", "Ver sistemas activos y comunicación continua."],
      ["CCP2", "Frenos, dirección, neumáticos y sistemas tecnológicos", "Exige calibración y mantenimiento de sistemas mecánicos y anticolisión.", "Ver equipos con sistemas activos sin fallas."],
      ["CCP3", "Personal acreditado para operar/supervisar", "Exige acreditación y entrenamiento en el sistema autónomo.", "Ver personal acreditado y apto."],
      ["CCP4", "Rutas autónomas y control de acceso", "Exige segregación, señalización, iluminación y refugios peatonales según diseño.", "Ver segregaciones, señalética e iluminación operativas."],
      ["CCM1", "Respuesta ante emergencia", "Incluye plan de emergencia específico para incidentes con equipos autónomos, con simulacros.", "Ver brigada, kit de rescate y comunicación operativos."],
    ],
  },
  {
    rf: "RF27", nombre: "Atropello",
    claves: ["atropello", "peatón", "antiatropello", "alta visibilidad", "baliza", "pértiga", "interacción hombre-máquina"],
    controles: [
      ["CCP1", "Rutas vehiculares y peatonales según diseño", "Exige plan de tránsito con rutas vehiculares y peatonales separadas, mantenidas y señalizadas.", "Ver segregación, señalética e iluminación en rutas."],
      ["CCP2", "Sistema antiatropello y proximidad", "Exige sistemas antiatropello instalados y calibrados, sin bypass, con TAGs funcionales cuando aplique.", "Ver sistema operativo y TAGs activos."],
      ["CCP3", "Alta visibilidad", "Exige ropa de alta visibilidad, balizas, pértigas y reflectantes con inspección.", "Ver ropa HV íntegra y balizas/pértigas activas."],
      ["CCP4", "Comunicación bidireccional personal–conductor", "Define protocolo de comunicación radial previo a maniobras o circulación y mantenimiento de radios.", "Ver radios operativos y prueba de comunicación."],
      ["CCM1", "Respuesta ante emergencia", "Incluye procedimiento coordinado entre protección industrial, brigada y salud, con simulacros y aprendizajes.", "Ver brigada, kit de trauma y comunicación operativos."],
    ],
  },
  {
    rf: "RF28", nombre: "Caving (colgadura y airblast)",
    claves: ["caving", "airblast", "colgadura", "hundimiento", "block caving", "destress"],
    controles: [
      ["CCP1", "Monitoreo geomecánico y control de extracción", "Exige modelo geotécnico actualizado, monitoreo con umbrales de alerta y secuencia de extracción controlada.", "Ver instrumentos y alarmas activos y secuencia conforme."],
      ["CCP2", "Fracturamiento e incorporación de áreas", "Exige diseño validado de fracturamiento y verificación de efectividad antes de incorporar áreas.", "Ver confirmación de efectividad antes de incorporar."],
      ["CCP3", "Perforación y tronadura según diseño", "Exige diseños validados, QA/QC y liberación formal del área antes del reingreso.", "Ver tiros quedados gestionados y liberación formal."],
      ["CCM1", "Segregación y control de acceso", "Define barreras duras, mapa de riesgo actualizado y control de accesos en zonas de colgadura/airblast.", "Ver barreras, señalización y control de accesos."],
      ["CCM2", "Respuesta ante airblast", "Incluye plan específico de airblast, brigada, refugios y simulacros.", "Ver brigada, refugios y comunicación funcionales."],
    ],
  },
  {
    rf: "RF29", nombre: "Caída a cuerpos líquidos",
    claves: ["cuerpo líquido", "piscina", "tranque", "relave", "balsa", "chaleco salvavidas", "espesador"],
    controles: [
      ["CCP1", "Zonas aisladas y señalizadas", "Exige cierres perimetrales, señalización y protocolo formal de acceso.", "Ver cierres íntegros, señalización y barreras en bordes."],
      ["CCP2", "Personal capacitado", "Exige personal autorizado y capacitado con uso de SPDC o chaleco salvavidas.", "Ver credenciales vigentes y uso de SPDC/chaleco."],
      ["CCP3", "Infraestructura y comunicación", "Exige plataformas, balsas y barandas según diseño y mantenimiento, y comunicación redundante.", "Ver infraestructura en buen estado y radios funcionales."],
      ["CCM1", "Rescate en cuerpos líquidos", "Incluye plan de rescate específico, brigada y equipamiento, con simulacros.", "Ver brigada y kits de rescate disponibles."],
    ],
  },
  {
    rf: "RF30", nombre: "Tiro y arrastre",
    claves: ["tiro", "arrastre", "huinche", "cable de acero", "remolque", "línea de fuego", "tirfor"],
    controles: [
      ["CCP1", "Sistemas de tiro y arrastre íntegros", "Exige inspección de preuso, mantenimiento, criterios de descarte y certificación de elementos críticos.", "Ver inspección de preuso y accesorios sin daños ni improvisaciones."],
      ["CCP2", "Dispositivos de seguridad operativos", "Exige pruebas funcionales y calibración de limitadores, frenos y dispositivos, prohibiendo su anulación.", "Ver dispositivos operativos y no puenteados."],
      ["CCP3", "Accesorios certificados y área fuera de línea de fuego", "Exige accesorios certificados y trazables, y área delimitada sin personas en la línea de fuego.", "Ver accesorios trazables y área delimitada."],
      ["CCM1", "Barreras de contención", "Exige barreras físicas según cálculo e inspección antes de maniobras críticas.", "Ver barreras instaladas y en buen estado."],
      ["CCM2", "Respuesta ante emergencia", "Incluye plan de rescate específico, brigada y equipamiento, con simulacros.", "Ver brigada, kits de rescate y comunicación operativos."],
    ],
  },
  {
    rf: "RF31", nombre: "Incendio de equipos mineros e industriales",
    claves: ["incendio de equipo", "supresión", "punto caliente", "fuga hidráulica", "sistema de supresión"],
    controles: [
      ["CCP1", "Operador entrenado y apto", "Exige programa de entrenamiento del operador que incluya verificación de preuso (alarmas, ruteo de líneas, fugas).", "Ver licencia interna vigente para el equipo."],
      ["CCP2", "Integridad de sistemas eléctricos, hidráulicos y combustible", "Exige plan de mantenimiento e inspección de puntos calientes.", "Ver checklist operacional con inspección de puntos calientes."],
      ["CCM1", "Detección y supresión de incendios", "Exige sistemas de detección/supresión acordes a la carga de fuego, con mantenimiento y capacitación.", "Ver certificados de inspección de los sistemas de supresión."],
      ["CCM2", "Respuesta inmediata ante incendio en equipo", "Incluye plan de respuesta inmediata del operador y simulacros según programa.", "Preguntar al operador cómo actuar ante incendio del equipo."],
    ],
  },
];

export const TIPOS_DOCUMENTO = {
  procedimiento: "Procedimiento de trabajo / PTS",
  matriz: "Matriz de riesgos (IPER / controles)",
  mapa_proceso: "Mapa de proceso",
  cop: "Control Operacional Preventivo (COP)",
  otro: "Otro documento de prevención",
};

export function buscarRF(codigo) {
  return MARCO.find((r) => r.rf === String(codigo).toUpperCase().replace(/\s/g, ""));
}

export function indiceRF() {
  return MARCO.map((r) => ({ rf: r.rf, nombre: r.nombre, n_controles: r.controles.length }));
}
