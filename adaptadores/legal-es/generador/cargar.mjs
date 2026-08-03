// Acertium — adaptador legal-es / generador / cargador
// Convierte un lote YA VERIFICADO (salida de nucleo/verificar-lote) en SQL de
// inserción para el schema acertium_v2. No toca la base: emite el SQL, que se
// ejecuta con el conector de Supabase. (Opción A: el agente lo ejecuta; opción B:
// el job de API lo ejecuta con service-role.)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { verificarMeta, cargarRegistro } from "./verificar-meta.mjs";

function q(s) {
  return "'" + String(s ?? "").replace(/'/g, "''") + "'";
}

// ---------------------------------------------------------------------------
// MANIFIESTO DE COBERTURA — que el índice se mantenga solo.
//
// `datos/legal-es/boe-600-pn/00-indice.md` lleva una columna Estado por norma
// (✓ extraída y cargada · ⏳ pendiente · ⚠ revisar). Hasta ahora se editaba a
// mano y se desfasaba. `marcarCobertura()` localiza la norma por su
// `referencia_boe`, la pone a ✓ con fecha y su familia, y RECALCULA la línea de
// resumen contando la propia tabla (antes se arrastraba a mano y estaba
// desviada en 1).
//
// Ojo con el alcance: esto se dispara cuando el lote pasa las tres puertas y se
// EMITE el SQL, no cuando la base confirma la inserción (el SQL lo ejecuta
// después el agente o el job). La comprobación dura sigue siendo
// `asercion-post-carga.sql`. Nunca lanza: un fallo aquí no debe tumbar una
// carga válida.
// ---------------------------------------------------------------------------

const INDICE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../datos/legal-es/boe-600-pn/00-indice.md",
);

// Cuenta los estados de la tabla. §1 (Introducción) no es una norma: su Estado
// es «—» y queda fuera del total.
function contarEstados(lineas) {
  let normas = 0, extraidas = 0, pendientes = 0;
  const revisar = [];
  for (const l of lineas) {
    if (!/^\|\s*\d+\s*\|/.test(l)) continue;
    const col = l.split("|").map((s) => s.trim());
    const num = col[1], estado = col[6] ?? "";
    if (estado.startsWith("✓")) { normas++; extraidas++; }
    else if (estado.startsWith("⏳")) { normas++; pendientes++; }
    else if (estado.startsWith("⚠")) { normas++; revisar.push("§" + num); }
  }
  return { normas, extraidas, pendientes, revisar };
}

export function marcarCobertura(meta, familia, hoy = new Date()) {
  try {
    if (!existsSync(INDICE)) return { ok: false, motivo: "no existe 00-indice.md" };
    const ref = meta?.referencia_boe;
    if (!ref) return { ok: false, motivo: "meta sin referencia_boe" };

    const fecha = hoy.toISOString().slice(0, 10);
    const lineas = readFileSync(INDICE, "utf8").split(/\r?\n/);
    let tocada = null;

    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (!/^\|\s*\d+\s*\|/.test(l)) continue;
      const col = l.split("|");
      if (col[4]?.trim() !== ref) continue;
      col[5] = ` ${familia || col[5].trim() || "—"} `;
      col[6] = ` ✓ ${fecha} `;
      lineas[i] = col.join("|");
      tocada = col[1].trim();
      break;
    }
    if (tocada === null) return { ok: false, motivo: `${ref} no está en el índice` };

    // Resumen recalculado desde la tabla, no acumulado a mano.
    const c = contarEstados(lineas);
    const revisar = c.revisar.length
      ? ` · ${c.revisar.length} a revisar (${c.revisar.join(", ")})`
      : "";
    const resumen = `Resumen: **${c.extraidas} de ${c.normas} normas extraídas · ${c.pendientes} pendientes${revisar}**.`;
    const iR = lineas.findIndex((l) => l.startsWith("Resumen:"));
    if (iR >= 0) lineas[iR] = resumen;

    writeFileSync(INDICE, lineas.join("\n"));
    return { ok: true, norma: tocada, fecha, resumen };
  } catch (e) {
    return { ok: false, motivo: e.message };
  }
}

export function loteASql(v, meta, registro) {
  // Refuerzo de la puerta de metadatos: aunque se llame directamente (saltando
  // generar.mjs), es IMPOSIBLE emitir SQL con un meta que contradiga la familia
  // de los conceptos. Fail-closed.
  const vm = verificarMeta(v.conceptosOK, meta, registro || cargarRegistro());
  if (!vm.ok)
    throw new Error("meta incoherente, no se emite SQL:\n  - " + vm.errores.join("\n  - "));

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
          // Estándar de calidad: barajar las opciones para que la posición de la
          // correcta quede repartida (evita el sesgo "la correcta siempre en A/B").
          const barajadas = a.opciones.slice();
          for (let i = barajadas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
          }
          const indice = barajadas.indexOf(correcta);
          const resp = JSON.stringify({ correcta, indice });
          const ops = JSON.stringify(barajadas);
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
