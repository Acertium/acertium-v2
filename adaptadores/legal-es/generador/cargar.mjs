// Acertium — adaptador legal-es / generador / cargador
// Convierte un lote YA VERIFICADO (salida de nucleo/verificar-lote) en SQL de
// inserción para el schema acertium_v2. No toca la base: emite el SQL, que se
// ejecuta con el conector de Supabase. (Opción A: el agente lo ejecuta; opción B:
// el job de API lo ejecuta con service-role.)

function q(s) {
  return "'" + String(s ?? "").replace(/'/g, "''") + "'";
}

export function loteASql(v, meta) {
  const { materia, norma, referencia_boe, convocatoria, tema } = meta;
  const out = [];

  if (v.conceptosOK.length) {
    out.push(
      "insert into acertium_v2.concepto (id, materia, titulo, resumen, explicacion, estado_verificacion, explicacion_verificacion) values",
    );
    out.push(
      v.conceptosOK
        .map(
          (c) =>
            `(${q(c.id)},${q(materia)},${q(c.titulo)},${q(c.resumen)},${q(c.explicacion)},'verificado','verificado')`,
        )
        .join(",\n") + ";",
    );

    out.push(
      "\ninsert into acertium_v2.concepto_fuente (concepto_id, norma, articulo, referencia_boe) values",
    );
    out.push(
      v.conceptosOK
        .map((c) => `(${q(c.id)},${q(norma)},${q(c.articulo)},${q(referencia_boe)})`)
        .join(",\n") + "\non conflict do nothing;",
    );

    out.push(
      `\ninsert into acertium_v2.overlay_entrada (convocatoria_id, concepto_id, tema, peso)\nselect ${q(convocatoria)}, id, ${q(tema)}, 1 from acertium_v2.concepto where id in (${v.conceptosOK
        .map((c) => q(c.id))
        .join(", ")})\non conflict do nothing;`,
    );
  }

  if (v.actividadesOK.length) {
    out.push(
      "\ninsert into acertium_v2.actividad (concepto_id, tipo, enunciado, opciones, respuesta, justificacion, cotejo_fuente, estado_verificacion) values",
    );
    out.push(
      v.actividadesOK
        .map((a) => {
          const correcta = a.opciones[a.indice_correcto];
          const resp = JSON.stringify({ correcta, indice: a.indice_correcto });
          const ops = JSON.stringify(a.opciones);
          return `(${q(a.concepto_id)},'test',${q(a.enunciado)},${q(ops)}::jsonb,${q(resp)}::jsonb,${q(a.justificacion)},${q(a.cotejo)},'verificado')`;
        })
        .join(",\n") + ";",
    );
  }

  if (v.relacionesOK && v.relacionesOK.length) {
    out.push(
      "\ninsert into acertium_v2.relacion_concepto (origen, destino, tipo, fuente)\nselect x.o, x.d, x.t::acertium_v2.tipo_relacion, 'generador'\nfrom (values",
    );
    out.push(
      v.relacionesOK
        .map((r) => `(${q(r.origen)},${q(r.destino)},${q(r.tipo)})`)
        .join(",\n"),
    );
    out.push(
      ") as x(o, d, t)\njoin acertium_v2.concepto co on co.id = x.o\njoin acertium_v2.concepto cd on cd.id = x.d\nwhere x.o <> x.d\nand not exists (select 1 from acertium_v2.relacion_concepto r where r.origen = x.o and r.destino = x.d and r.tipo = x.t::acertium_v2.tipo_relacion);",
    );
  }

  return out.join("\n");
}
