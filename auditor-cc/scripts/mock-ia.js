// Modelo simulado genérico para probar la interfaz sin API key (MOCK_IA=1).
// Usa el pre-análisis y el texto leído para producir llamadas plausibles.
export function clienteSimulado() {
  return {
    beta: {
      messages: {
        async create(params) {
          await new Promise((r) => setTimeout(r, 400));
          const turno = params.messages.filter((m) => m.role === "assistant").length + 1;
          const c0 = params.messages[0].content;
          const inicial = typeof c0 === "string" ? c0 : c0.map((b) => b.text || "").join("\n");
          const rfs = [...new Set([...inicial.matchAll(/^(RF\d\d) /gm)].map((m) => m[1]))].slice(0, 3);
          const leidos = params.messages.flatMap((m) => (Array.isArray(m.content) ? m.content : []))
            .filter((b) => b.type === "tool_result").map((b) => String(b.content)).join("\n");
          const id = (n) => `tu_${turno}_${n}`;
          const r = (content, stop = "tool_use") => ({ model: "claude-opus-5", stop_reason: stop, usage: { input_tokens: 2500, output_tokens: 900, cache_creation_input_tokens: 12000, cache_read_input_tokens: 15000 * turno }, content });
          if (turno === 1) {
            return r([
              { type: "text", text: `Reviso el pre-análisis: ${rfs.join(", ") || "sin códigos declarados"}.` },
              { type: "tool_use", id: id("leer"), name: "leer_segmento", input: { segmento: "S1", parte: 1 } },
              { type: "tool_use", id: id("marco"), name: "consultar_marco", input: { rfs: rfs.length ? rfs : ["RF03"] } },
            ]);
          }
          if (turno === 2) {
            const marco = leidos.split("\n");
            const evaluaciones = [];
            let rfActual = null;
            for (const l of marco) {
              const m = l.match(/^(RF\d\d) /); if (m) rfActual = m[1];
              const c = l.match(/^\s{2}(CC[PM]\d) (.*)/);
              if (!c || !rfActual) continue;
              const i = leidos.indexOf(`${c[1]}:`);
              const cita = i >= 0 ? leidos.slice(i, i + 60).split("\n")[0] : "";
              const cumple = cita.length > 20 && !cita.includes("[=T");
              evaluaciones.push({ rf: rfActual, cc: c[1], cumple, tipo_brecha: cumple ? "NINGUNA" : "NO_DECLARADO", cita: cumple ? cita : "", fundamento: cumple ? "Control declarado en el documento (simulado)." : "No se encontró declaración del control (simulado).", recomendacion: cumple ? "" : `Declarar ${c[1]} en todas las tareas expuestas a ${rfActual}.` });
            }
            return r([{ type: "tool_use", id: id("eval"), name: "registrar_evaluaciones", input: { evaluaciones } }]);
          }
          if (turno === 3) {
            const hallazgos = [];
            for (const l of inicial.split("\n")) {
              const x = l.match(/✗ código inexistente (CC[PM]\d) "([^"]+)".*en (S\d+ línea \d+)/);
              if (x) hallazgos.push({ severidad: "CRITICO", categoria: "CODIGO_ERRONEO", rf: "", ubicacion: x[3], descripcion: `El código ${x[1]} ("${x[2]}") no existe en el RF declarado.`, cita: "", recomendacion: "Reasignar el código correcto según el marco." });
              const f = l.match(/patrón \{([^}]*)\} x(\d+) → FALTAN ([A-Z0-9,]+) \| ej\. (S\d+ línea \d+)/);
              if (f && hallazgos.length < 6) hallazgos.push({ severidad: "CRITICO", categoria: "CC_FALTANTE", rf: "", ubicacion: f[4], descripcion: `En ${f[2]} declaración(es) faltan ${f[3]}.`, cita: "", recomendacion: "Completar los controles críticos o justificar explícitamente su no aplicación." });
            }
            if (!hallazgos.length) hallazgos.push({ severidad: "OBSERVACION", categoria: "OTRO", rf: "", ubicacion: "S1", descripcion: "Prueba simulada sin hallazgos automáticos.", cita: "", recomendacion: "" });
            return r([{ type: "tool_use", id: id("hall"), name: "registrar_hallazgos", input: { hallazgos } }]);
          }
          return r([{ type: "tool_use", id: id("fin"), name: "finalizar_auditoria", input: { resumen_ejecutivo: "Resultado SIMULADO para pruebas de interfaz: no corresponde a una auditoría real.", limitaciones: "Modo MOCK_IA: sin modelo de lenguaje." } }]);
        },
      },
    },
  };
}
