// Acertium — adaptador legal-es / generador / cargador
//
// Convierte un lote YA VERIFICADO (salida de nucleo/verificar-lote) en filas del
// schema `acertium_v2`.
//
// ⚠️ CAMBIO (16/08/2026, PROMPT_014) — LA CARGA AHORA INSERTA DE VERDAD.
// Hasta hoy este módulo solo EMITÍA SQL en texto para que lo ejecutara un
// agente por fuera (`loteASql`). Ese paso manual se saltó sin que nadie se
// enterara: `marcarCobertura()` marcaba ✓ en el índice al emitir el SQL, así que
// el corpus daba por cargadas familias con CERO filas en la base (FE, PRLP,
// PRLAGE, RDP el 16/08). Ahora `cargarLote()` inserta con el cliente
// service-role, comprueba el `error` de CADA operación y RELEE los conteos de la
// base; el índice solo se marca si esa confirmación llega.
//
// `loteASql` se conserva para inspeccionar el SQL sin tocar la base
// (`generar.mjs --sql`), pero ya no es el camino de carga.

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

// ---------------------------------------------------------------------------
// CARGA REAL — inserta y confirma. Devuelve
//   { ok, familia, insertado:{...}, enBase:{...}, errores:[...] }
// `insertado` = filas que la base dice haber creado en esta corrida.
// `enBase`    = conteos releídos DESPUÉS de insertar (la confirmación dura).
// Cualquier `error` de PostgREST aborta el lote: no se sigue insertando y el
// llamador NO debe marcar cobertura.
// ---------------------------------------------------------------------------

const TAMANO_TANDA = 100;

async function enTandas(filas, fn) {
  let total = 0;
  for (let i = 0; i < filas.length; i += TAMANO_TANDA) {
    const trozo = filas.slice(i, i + TAMANO_TANDA);
    const n = await fn(trozo);
    total += n;
  }
  return total;
}

// Baraja las opciones para que la posición de la correcta quede repartida
// (evita el sesgo "la correcta siempre en A/B"). Misma lógica que loteASql.
function barajarOpciones(a) {
  const correcta = a.opciones[a.indice_correcto];
  const barajadas = a.opciones.slice();
  for (let i = barajadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
  }
  return { opciones: barajadas, respuesta: { correcta, indice: barajadas.indexOf(correcta) } };
}

export async function cargarLote(db, v, meta, registro) {
  // Mismo refuerzo fail-closed que loteASql: imposible cargar con un meta que
  // contradiga la familia de los conceptos, aunque se llame directamente.
  const vm = verificarMeta(v.conceptosOK, meta, registro || cargarRegistro());
  if (!vm.ok)
    throw new Error("meta incoherente, no se carga:\n  - " + vm.errores.join("\n  - "));

  const { materia, norma, referencia_boe, convocatoria, tema } = meta;
  const familia = vm.familia;
  const ids = v.conceptosOK.map((c) => c.id);
  const errores = [];
  const insertado = { concepto: 0, concepto_fuente: 0, overlay_entrada: 0, actividad: 0, relacion_concepto: 0 };

  const fallo = (paso, error) => {
    errores.push(`${paso}: ${error.message || JSON.stringify(error)}`);
    return { ok: false, familia, insertado, enBase: null, errores };
  };

  // Guard de reejecución: las actividades no tienen clave natural, así que un
  // segundo pase las duplicaría en silencio. Si ya hay actividades de esta
  // familia, no se toca nada.
  {
    const { count, error } = await db
      .from("actividad")
      .select("id", { count: "exact", head: true })
      .in("concepto_id", ids);
    if (error) return fallo("sondeo de actividades previas", error);
    if (count > 0) {
      errores.push(
        `ya hay ${count} actividades para conceptos de ${familia}: el lote parece cargado. ` +
          `No se inserta nada (evita duplicar actividades, que no tienen clave única).`,
      );
      return { ok: false, familia, insertado, enBase: null, errores, yaCargado: true };
    }
  }

  // 1. conceptos
  const filasConcepto = v.conceptosOK.map((c) => ({
    id: c.id,
    materia,
    titulo: c.titulo,
    resumen: c.resumen,
    explicacion: c.explicacion,
    estado_verificacion: "verificado",
    explicacion_verificacion: "verificado",
  }));
  try {
    insertado.concepto = await enTandas(filasConcepto, async (trozo) => {
      const { data, error } = await db
        .from("concepto")
        .upsert(trozo, { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      return data.length;
    });
  } catch (e) {
    return fallo("insert concepto", e);
  }

  // 2. concepto_fuente (pk concepto_id+norma+articulo → on conflict do nothing)
  // referencia_boe va a NULL cuando la fuente no es del BOE (tratados, RAE,
  // INCIBE…). Con cadena vacía, la aserción (b) —"una familia no puede tener dos
  // referencias BOE"— contaría "" como una referencia más.
  const filasFuente = v.conceptosOK.map((c) => ({
    concepto_id: c.id,
    norma,
    articulo: c.articulo,
    referencia_boe: String(referencia_boe ?? "").trim() || null,
  }));
  try {
    insertado.concepto_fuente = await enTandas(filasFuente, async (trozo) => {
      const { data, error } = await db
        .from("concepto_fuente")
        .upsert(trozo, { onConflict: "concepto_id,norma,articulo", ignoreDuplicates: true })
        .select("concepto_id");
      if (error) throw error;
      return data.length;
    });
  } catch (e) {
    return fallo("insert concepto_fuente", e);
  }

  // 3. overlay_entrada — solo para conceptos que EXISTEN ya en la base (el SQL
  //    original hacía `select ... from concepto where id in (...)`; aquí se
  //    consulta primero para no depender de la fe).
  const { data: existentes, error: eExist } = await db
    .from("concepto")
    .select("id")
    .in("id", ids);
  if (eExist) return fallo("relectura de conceptos", eExist);
  const idsEnBase = new Set(existentes.map((r) => r.id));

  const filasOverlay = ids
    .filter((id) => idsEnBase.has(id))
    .map((id) => ({ convocatoria_id: convocatoria, concepto_id: id, tema, peso: 1 }));
  try {
    insertado.overlay_entrada = await enTandas(filasOverlay, async (trozo) => {
      const { data, error } = await db
        .from("overlay_entrada")
        .upsert(trozo, { onConflict: "convocatoria_id,concepto_id", ignoreDuplicates: true })
        .select("concepto_id");
      if (error) throw error;
      return data.length;
    });
  } catch (e) {
    return fallo("insert overlay_entrada", e);
  }

  // 4. actividades
  const filasActividad = v.actividadesOK.map((a) => {
    const { opciones, respuesta } = barajarOpciones(a);
    return {
      concepto_id: a.concepto_id,
      tipo: "test",
      enunciado: a.enunciado,
      opciones,
      respuesta,
      justificacion: a.justificacion,
      cotejo_fuente: a.cotejo,
      estado_verificacion: "verificado",
    };
  });
  try {
    insertado.actividad = await enTandas(filasActividad, async (trozo) => {
      const { data, error } = await db.from("actividad").insert(trozo).select("id");
      if (error) throw error;
      return data.length;
    });
  } catch (e) {
    return fallo("insert actividad", e);
  }

  // 5. relaciones — el SQL original filtraba con JOIN a concepto (origen y
  //    destino deben existir) y descartaba bucles. Aquí se resuelve consultando
  //    qué destinos existen; las aristas cuyo destino aún no está en la base se
  //    devuelven como `noResueltas` para que el llamador decida (remision_pendiente).
  const relaciones = v.relacionesOK || [];
  const noResueltas = [];
  if (relaciones.length) {
    const referidos = [...new Set(relaciones.flatMap((r) => [r.origen, r.destino]))];
    const presentes = new Set();
    for (let i = 0; i < referidos.length; i += TAMANO_TANDA) {
      const { data, error } = await db
        .from("concepto")
        .select("id")
        .in("id", referidos.slice(i, i + TAMANO_TANDA));
      if (error) return fallo("relectura de destinos de relación", error);
      for (const r of data) presentes.add(r.id);
    }
    const validas = [];
    for (const r of relaciones) {
      if (r.origen === r.destino) continue;
      if (presentes.has(r.origen) && presentes.has(r.destino))
        validas.push({ origen: r.origen, destino: r.destino, tipo: r.tipo, fuente: "generador" });
      else noResueltas.push(r);
    }
    try {
      insertado.relacion_concepto = await enTandas(validas, async (trozo) => {
        const { data, error } = await db
          .from("relacion_concepto")
          .upsert(trozo, { onConflict: "origen,destino,tipo", ignoreDuplicates: true })
          .select("origen");
        if (error) throw error;
        return data.length;
      });
    } catch (e) {
      return fallo("insert relacion_concepto", e);
    }
  }

  // 6. CONFIRMACIÓN — se releen los conteos de la base. Esto es lo que autoriza
  //    a marcar el índice; el `insertado` de arriba es solo lo de esta corrida.
  const cuenta = async (tabla, columna) => {
    const { count, error } = await db
      .from(tabla)
      .select(columna, { count: "exact", head: true })
      .in(columna, ids);
    if (error) throw error;
    return count;
  };
  let enBase;
  try {
    enBase = {
      concepto: await cuenta("concepto", "id"),
      concepto_fuente: await cuenta("concepto_fuente", "concepto_id"),
      overlay_entrada: await cuenta("overlay_entrada", "concepto_id"),
      actividad: await cuenta("actividad", "concepto_id"),
    };
  } catch (e) {
    return fallo("confirmación de conteos", e);
  }

  if (enBase.concepto !== v.conceptosOK.length)
    errores.push(
      `confirmación: ${enBase.concepto} conceptos en base, se esperaban ${v.conceptosOK.length}`,
    );
  if (enBase.actividad !== v.actividadesOK.length)
    errores.push(
      `confirmación: ${enBase.actividad} actividades en base, se esperaban ${v.actividadesOK.length}`,
    );

  return { ok: errores.length === 0, familia, insertado, enBase, noResueltas, errores };
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
