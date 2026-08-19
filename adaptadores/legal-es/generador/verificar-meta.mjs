// Acertium — adaptador legal-es / puerta de METADATOS (barreras 1 y 2)
//
// Complementa a nucleo/verificar-lote.mjs (que verifica el CONTENIDO). Esta puerta
// verifica que el META (materia, norma, referencia_boe, convocatoria, tema) con el
// que se va a estampar el lote es COHERENTE con lo que el lote realmente es. Nace
// del fallo del 02/08/2026: 3 lotes se cargaron con el meta de la Constitución
// porque el meta era un fichero suelto elegido a mano y nadie lo contrastaba.
//
// FAMILIA = primer token del id de concepto (antes del primer guion): CE, SP, CP,
// FCS, SC, VIC, DISC... Es 1:1 con la materia. El registro (registro-materias.json)
// fija, por familia, materia/norma/referencia_boe/tema esperados.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

export const CONVOCATORIA = "policia-nacional-2026";

// ---------------------------------------------------------------------------
// FUENTES NO-BOE (16/08/2026, PROMPT_007). Hasta hoy la puerta exigía
// `referencia_boe` no vacío. Los tratados y las fuentes de autoridad (ONU, RAE,
// INCIBE, CNI, OMS…) no tienen BOE-A-…, así que se acepta `referencia_fuente`
// EN SU LUGAR — nunca además: para un lote BOE se sigue exigiendo y comparando
// el BOE como siempre.
//
// El anclaje anti-emparejamiento (la razón de existir de esta puerta) no se
// pierde: cuando no hay BOE, se exige que los DOMINIOS que el registro declara
// como fuente canónica aparezcan de verdad en las referencias del lote. Así un
// lote de la RAE no puede colarse con el meta de INCIBE. No se comparan las
// cadenas completas: el registro guarda el puntero canónico y el lote la lista
// detallada de citas con fecha de consulta, y nunca van a ser iguales.
// ---------------------------------------------------------------------------

// `referencia_fuente` puede venir como string o como array (los generadores
// usan array para lotes multi-instrumento). `referencia_fuentes` es el nombre
// alternativo previsto en el contrato. Normaliza a texto plano.
export function textoDeFuente(meta) {
  const bruto = meta?.referencia_fuente ?? meta?.referencia_fuentes;
  if (!bruto) return "";
  return (Array.isArray(bruto) ? bruto : [bruto]).map((s) => String(s)).join(" \n ");
}

// Dominios mencionados en un texto (incibe.es, rae.es, un.org…), sin www.
function dominiosDe(texto) {
  const encontrados = new Set();
  for (const m of String(texto).matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)) {
    const d = m[1].toLowerCase();
    if (/\.(es|org|com|net|int|gov|edu|eu|info)(\.[a-z]{2})?$/.test(d)) encontrados.add(d);
  }
  return encontrados;
}

export function cargarRegistro(ruta) {
  const p =
    ruta || join(dirname(fileURLToPath(import.meta.url)), "registro-materias.json");
  return JSON.parse(readFileSync(p, "utf8"));
}

// Devuelve { familia, familias } — familia es null si el lote mezcla familias.
export function familiaDe(ids) {
  const fams = [...new Set(ids.map((id) => String(id).split("-")[0]))];
  return { familia: fams.length === 1 ? fams[0] : null, familias: fams };
}

// verificarMeta(conceptos, meta, registro) → { ok, errores:[...], familia }
export function verificarMeta(conceptos, meta, registro) {
  const errores = [];
  const ids = (conceptos || []).map((c) => c.id).filter(Boolean);
  if (!ids.length) return { ok: false, errores: ["lote sin conceptos con id"], familia: null };

  const { familia, familias } = familiaDe(ids);
  if (!familia)
    errores.push(`el lote mezcla familias de id (${familias.join(", ")}): un lote = una norma`);

  if (!meta) {
    errores.push("falta el bloque meta (embébelo en el lote: materia, norma, referencia_boe, convocatoria, tema)");
    return { ok: false, errores, familia };
  }
  for (const k of ["materia", "norma", "convocatoria", "tema"])
    if (!meta[k] || !String(meta[k]).trim()) errores.push(`meta.${k} vacío o ausente`);

  // referencia_boe O referencia_fuente — uno de los dos, nunca ninguno.
  const boe = String(meta.referencia_boe ?? "").trim();
  const fuente = textoDeFuente(meta).trim();
  if (!boe && !fuente)
    errores.push(
      "meta sin referencia: se exige referencia_boe (fuentes BOE) o referencia_fuente (fuentes no-BOE)",
    );

  if (meta.convocatoria && meta.convocatoria !== CONVOCATORIA)
    errores.push(`meta.convocatoria="${meta.convocatoria}", se esperaba "${CONVOCATORIA}"`);

  const esperado = familia ? registro[familia] : null;
  if (familia && !esperado)
    errores.push(`familia "${familia}" no registrada: añádela a registro-materias.json antes de cargar`);

  if (esperado) {
    if (meta.materia !== esperado.materia)
      errores.push(`meta.materia="${meta.materia}" ≠ esperado "${esperado.materia}" (familia ${familia})`);
    const boeEsperado = String(esperado.referencia_boe ?? "").trim();

    // FAMILIAS MULTI-INSTRUMENTO (16/08/2026, PROMPT_015). Algunas familias son
    // un bloque temático formado por varios textos oficiales: CEDH = Convenio +
    // Protocolos 11, 14 y 15; TORT = Convención + Protocolo facultativo + MNP.
    // Cada instrumento tiene SU BOE-A y SU título, así que un lote del Protocolo
    // 15 nunca cuadraría con el BOE ni la norma del Convenio.
    //
    // La solución no es relajar, es declarar: el registro lista en
    // `referencia_fuentes` los BOE-A admitidos de esa familia, y la puerta
    // acepta el principal O uno de esa lista. Lo que NO está declarado sigue
    // rechazándose. Cuando el lote usa un instrumento secundario, la `norma`
    // no se compara —por definición es otro título—, pero materia, tema y
    // familia siguen exactos, que es lo que impide estampar el meta de otra
    // materia (el fallo del 02/08).
    const instrumentos = new Set(
      (Array.isArray(esperado.referencia_fuentes) ? esperado.referencia_fuentes : [])
        .map((s) => String(s).trim())
        .filter(Boolean),
    );
    const esInstrumentoSecundario = Boolean(boe) && boe !== boeEsperado && instrumentos.has(boe);

    // La `norma` solo se compara cuando el lote es del instrumento principal.
    if (!esInstrumentoSecundario && meta.norma !== esperado.norma)
      errores.push(`meta.norma="${meta.norma}" ≠ esperado "${esperado.norma}"`);
    else if (esInstrumentoSecundario && !String(meta.norma ?? "").trim())
      errores.push("meta.norma vacío: un instrumento secundario debe decir cuál es");

    if (esInstrumentoSecundario) {
      // Instrumento declarado de la familia: nada más que comprobar aquí.
    } else if (boe) {
      // Camino BOE de siempre: comparación exacta, sin relajar nada.
      if (boe !== boeEsperado)
        errores.push(
          `meta.referencia_boe="${boe}" ≠ esperado "${boeEsperado}"` +
            (instrumentos.size
              ? ` (ni está entre los instrumentos declarados de ${familia}: ${[...instrumentos].join(", ")})`
              : ""),
        );
    } else if (boeEsperado) {
      // La familia SÍ tiene BOE en el registro: no se puede cargar sin él.
      errores.push(
        `meta.referencia_boe vacío pero la familia ${familia} tiene BOE registrado ("${boeEsperado}")`,
      );
    } else if (meta.tipo_fuente === "autoridad") {
      // ------------------------------------------------------------------
      // Camino `autoridad` — se exige que HAYA fuente, no CUÁL (16/08/2026,
      // PROMPT_015).
      //
      // Una familia de autoridad (RAE, INCIBE, técnicas) no tiene una fuente
      // única: se apoya en varias obras solventes, y la lista crece con cada
      // tanda. Encadenarla al dominio que se registró el primer día es
      // demasiado estricto y bloquea contenido bueno: rechazó `ciber-incibe-2`
      // por citar CCN-CERT y `sistemas-operativos-2` por citar IBM y
      // docs.redhat.com — las dos, fuentes perfectamente autorizadas.
      //
      // Lo que se conserva: la referencia sigue siendo obligatoria y no vacía, y
      // familia/materia/norma/tema se siguen contrastando exactos contra el
      // registro. Ese cuarteto es el que impide de verdad estampar un lote con
      // el meta de otra materia (el fallo del 02/08); el dominio era un cinturón
      // extra que aquí estorba más de lo que aporta.
      //
      // Lo que NO se relaja: los `oficial` con BOE siguen con comparación
      // exacta, arriba. Ahí la fuente ES la norma y no admite sustitutos.
      // ------------------------------------------------------------------
      if (!textoDeFuente(esperado).trim())
        errores.push(
          `familia ${familia} sin referencia_fuente en el registro: añádela antes de cargar`,
        );
    } else {
      // Resto de no-BOE (incluido `oficial` sin BOE, p. ej. la DUDH de la ONU):
      // el registro declara su fuente canónica y el lote debe citar de verdad
      // esos dominios.
      const fuenteEsperada = textoDeFuente(esperado).trim();
      if (!fuenteEsperada)
        errores.push(
          `familia ${familia} sin referencia_boe ni referencia_fuente en el registro: añádela antes de cargar`,
        );
      else {
        const citados = dominiosDe(fuente);
        const faltan = [...dominiosDe(fuenteEsperada)].filter((d) => !citados.has(d));
        if (faltan.length)
          errores.push(
            `meta.referencia_fuente no cita la(s) fuente(s) registradas de ${familia}: falta ${faltan.join(", ")}`,
          );
      }
    }
    // EL TEMA, FAIL-CLOSED (19/08/2026). `progresoTemas()` en lib/cerebro.ts agrupa
    // por la cadena EXACTA del tema, así que dos redacciones del mismo tema lo
    // parten en dos filas en la pantalla de temas y reparten su progreso entre
    // ellas. Esto era un check CONDICIONAL que se saltaba entero cuando la familia
    // no declaraba `temas`, y por ese agujero se colaron las redacciones libres de
    // CE, FCS, SC y EXTR: seis temas partidos y 51 filas para 45 temas. Que una
    // familia no declare sus temas no puede ser un pase: es justo el caso en que
    // nadie está comprobando nada.
    if (!Array.isArray(esperado.temas) || esperado.temas.length === 0)
      errores.push(
        `familia ${familia} sin \`temas\` en el registro: decláralos antes de cargar ` +
          "(sin eso cada lote inventa su redacción y parte el tema en la pantalla de temas)",
      );
    else if (!meta.tema) errores.push("meta.tema vacío: el lote debe decir a qué tema entra");
    else if (!esperado.temas.includes(meta.tema))
      errores.push(`meta.tema="${meta.tema}" no está entre los temas registrados de ${familia}`);
  }

  return { ok: errores.length === 0, errores, familia };
}

// Self-test: node verificar-meta.mjs
if (esEjecucionDirecta(import.meta.url)) {
  const registro = cargarRegistro();
  const conceptos = [{ id: "SP-001" }, { id: "SP-002" }];
  const bien = { materia: "ley-5-2014-seguridad-privada", norma: "Ley 5/2014, de Seguridad Privada", referencia_boe: "BOE-A-2014-3649", convocatoria: CONVOCATORIA, tema: "Tema 13 — Disposiciones generales en materia de seguridad privada en España" };
  const malMeta = { ...bien, materia: "constitucion-espanola", norma: "Constitución Española", referencia_boe: "BOE-A-1978-31229", tema: "Tema 3 — La Constitución Española" };
  console.log("caso correcto:", verificarMeta(conceptos, bien, registro));
  console.log("caso del fallo (meta de la CE en lote SP):", verificarMeta(conceptos, malMeta, registro));
  console.log("familia desconocida:", verificarMeta([{ id: "ZZ-001" }], { ...bien, materia: "x", norma: "y", referencia_boe: "z" }, registro));

  // --- fuentes no-BOE (PROMPT_007) -----------------------------------------
  // El registro real va PRIMERO: la entrada ORTO de abajo es el fixture y debe
  // pisar a la de producción (si no, el self-test comprueba el registro real y
  // no el caso que quiere probar).
  const regNB = {
    ...registro,
    ORTO: {
      materia: "ortografia-rae",
      norma: "Ortografía de la lengua española (RAE-ASALE)",
      referencia_boe: "",
      referencia_fuente: "https://www.rae.es (Ortografía / OLE 2010)",
      temas: ["Tema 37 — Ortografía"],
    },
  };
  // Misma familia pero SIN declarar temas: es el agujero que se cerró el
  // 19/08/2026 y que tiene su propio caso más abajo.
  const regSinTemas = { ...regNB, ORTO: { ...regNB.ORTO, temas: null } };
  const orto = (extra) => [
    [{ id: "ORTO-001" }],
    {
      materia: "ortografia-rae",
      norma: "Ortografía de la lengua española (RAE-ASALE)",
      convocatoria: CONVOCATORIA,
      tema: "Tema 37 — Ortografía",
      ...extra,
    },
    regNB,
  ];
  const casos = [
    ["no-BOE con referencia_fuente que cita rae.es → PASA", orto({ referencia_boe: "", referencia_fuente: ["RAE-ASALE, Ortografía básica — https://www.rae.es/ortografía-básica [2026-08-04]"] }), true],
    // PROMPT_015: una familia `autoridad` puede citar fuentes solventes que no
    // estaban registradas el primer día (CCN-CERT, IBM…). Se exige que HAYA
    // fuente, no cuál; el resto del cuarteto sigue estricto.
    ["autoridad citando OTRA fuente solvente → PASA", orto({ tipo_fuente: "autoridad", referencia_fuente: "CCN-CERT, guía CCN-STIC-401 — https://www.ccn-cert.cni.es/guia" }), true],
    ["autoridad sin ninguna referencia → sigue RECHAZANDO", orto({ tipo_fuente: "autoridad" }), false],
    ["autoridad con materia que no cuadra → sigue RECHAZANDO", orto({ tipo_fuente: "autoridad", materia: "gramatica-rae", referencia_fuente: "https://www.rae.es" }), false],
    ["no-BOE sin ninguna referencia → RECHAZA", orto({}), false],
    ["no-BOE citando otra fuente (incibe.es) → RECHAZA", orto({ referencia_fuente: "https://www.incibe.es/glosario" }), false],
    ["familia CON BOE registrado y meta sin BOE → RECHAZA", [[{ id: "SP-001" }], { ...bien, referencia_boe: "", referencia_fuente: "https://ejemplo.org" }, regNB], false],
    ["lote BOE normal sigue exigiendo su BOE exacto → PASA", [[{ id: "SP-001" }], bien, regNB], true],
    // El agujero del 19/08/2026: cuando la familia no declaraba `temas`, el check
    // del tema no se saltaba "por defecto permisivo", se saltaba ENTERO, y cada
    // lote escribía la redacción que quisiera. Seis temas acabaron partidos en dos
    // en la pantalla de temas. Ahora no declararlos es un error por sí solo.
    [
      "familia SIN temas declarados → RECHAZA (aunque el resto del meta esté bien)",
      [
        [{ id: "ORTO-001" }],
        {
          materia: "ortografia-rae",
          norma: "Ortografía de la lengua española (RAE-ASALE)",
          convocatoria: CONVOCATORIA,
          tema: "Tema 37 — Ortografía",
          referencia_boe: "",
          referencia_fuente: "RAE-ASALE — https://www.rae.es [2026-08-19]",
        },
        regSinTemas,
      ],
      false,
    ],
    [
      "familia con temas pero lote sin tema → RECHAZA",
      [
        [{ id: "ORTO-001" }],
        {
          materia: "ortografia-rae",
          norma: "Ortografía de la lengua española (RAE-ASALE)",
          convocatoria: CONVOCATORIA,
          tema: "",
          referencia_boe: "",
          referencia_fuente: "RAE-ASALE — https://www.rae.es [2026-08-19]",
        },
        regNB,
      ],
      false,
    ],
  ];
  let ok = 0;
  for (const [nombre, args, esperado] of casos) {
    const r = verificarMeta(...args);
    const bienResuelto = r.ok === esperado;
    if (bienResuelto) ok++;
    console.log(`  ${bienResuelto ? "✓" : "✗"} ${nombre}${r.ok ? "" : " — " + r.errores.join(" | ")}`);
  }
  console.log(`self-test fuentes no-BOE: ${ok}/${casos.length}`);
  if (ok !== casos.length) process.exit(1);
}
