// Acertium — núcleo / qué artículos han cambiado
//
//   import { compararArticulos } from './comparar-articulos.mjs'
//   node nucleo/comparar-articulos.mjs        (self-test)
//
// POR QUÉ EXISTE (23/08/2026)
// El «agente vigilante» del Doc 005 §9 detecta que una norma se ha modificado y
// marca sus conceptos como pendientes de re-verificar. Pero el aviso del BOE es
// POR NORMA, y nuestro contenido es POR ARTÍCULO. Medido, esa diferencia es la
// que decide si el vigilante sirve o es un interruptor de apagado:
//
//   si se reforma…              caen        del banco   temas que pierden >½
//   Código Penal                388 preg.     11,3 %          4
//   Reglamento de Extranjería   345           10,0 %          2
//   Constitución                258            7,5 %          2
//
// Y no es hipotético: el Código Penal se reformó el 9 de abril de 2026. Con el
// vigilante en marcha ese día y sin este diff, el opositor se habría quedado sin
// el 11 % del banco de un día para otro — por una reforma que probablemente no
// tocaba ninguno de nuestros artículos.
//
// Con el diff, de 388 conceptos marcados se pasa a los que cuelgan de un
// artículo que de verdad cambió. Eso es la diferencia entre un aviso útil y una
// denegación de servicio autoinfligida.
//
// QUÉ COMPARA Y QUÉ NO
// Compara TEXTO de artículo contra TEXTO de artículo, normalizando solo lo que
// es ruido de captura: saltos de línea del PDF, espacios repetidos, comillas y
// guiones tipográficos. NO toca acentos, mayúsculas ni puntuación — en una norma
// una coma cambia el sentido, y la puntuación es justamente lo que
// `normalizarNumeros` descarta y por lo que `auditar-corpus` tuvo que traer su
// propia normalización.

import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

/**
 * Normalización CONSERVADORA para comparar dos capturas del mismo texto.
 * Quita ruido de captura, nada más.
 */
export function normalizarParaComparar(s) {
  return String(s ?? "")
    .replace(/[«»""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    // Guion blando (U+00AD). Es invisible y no se pronuncia: marca dónde PODRÍA
    // partirse la palabra al maquetar. El XML del BOE lo lleva —«ries­gos» en el
    // art. 348 CP— y el corpus no, así que sin esto el artículo sale «modificado»
    // por un carácter que nadie ve. Se borra, no se sustituye por guion.
    .replace(/\u00ad/g, "")
    // Indicador ordinal «º» (U+00BA) y signo de grado «°» (U+00B0): dos
    // caracteres distintos que se dibujan igual. El BOE escribe «artículo 5.°»
    // con el de grado en el RD 769/1987 y nuestra cita lleva el ordinal. Nadie
    // ve la diferencia y el diff la canta como reforma. Igual con «ª»/«ᵃ».
    .replace(/\u00b0/g, "\u00ba")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {Map<string,string>|Record<string,string>} antes  ref → texto (línea base)
 * @param {Map<string,string>|Record<string,string>} despues ref → texto (captura nueva)
 * @returns {{iguales:string[], modificados:string[], anadidos:string[], eliminados:string[]}}
 *
 * `eliminados` NO significa «derogado»: significa «no está en la captura nueva».
 * Si la captura nueva es parcial —el Código 600 lo es, lo dice en portada
 * «[Inclusión parcial]»— habrá cientos de eliminados que solo son ausencias.
 * Distinguir derogación de ausencia exige saber si la fuente es íntegra, y eso
 * lo sabe quien llama, no esto.
 */
export function compararArticulos(antes, despues) {
  const A = antes instanceof Map ? antes : new Map(Object.entries(antes ?? {}));
  const D = despues instanceof Map ? despues : new Map(Object.entries(despues ?? {}));

  const iguales = [], modificados = [], anadidos = [], eliminados = [];

  for (const [ref, texto] of A) {
    if (!D.has(ref)) { eliminados.push(ref); continue; }
    (normalizarParaComparar(texto) === normalizarParaComparar(D.get(ref)) ? iguales : modificados).push(ref);
  }
  for (const ref of D.keys()) if (!A.has(ref)) anadidos.push(ref);

  return { iguales, modificados, anadidos, eliminados };
}

/**
 * De los artículos que cambiaron, qué conceptos cuelgan.
 * @param {string[]} refsCambiadas
 * @param {{concepto_id:string, articulo:string}[]} fuentes  filas de concepto_fuente
 * @returns {string[]} ids de concepto a marcar
 *
 * El `articulo` de `concepto_fuente` viene como «art. 31 bis» y la ref del
 * corpus como «31 bis»: se compara por el localizador, no por la etiqueta.
 */
export function conceptosAfectados(refsCambiadas, fuentes) {
  const clave = (s) =>
    String(s ?? "").toLowerCase().replace(/^\s*(arts?\.|artículos?|articulos?)\s*/, "").trim();
  const cambiadas = new Set(refsCambiadas.map(clave));
  return [...new Set(
    (fuentes ?? []).filter((f) => cambiadas.has(clave(f.articulo))).map((f) => f.concepto_id),
  )];
}

// --- Self-test: node nucleo/comparar-articulos.mjs ---
if (esEjecucionDirecta(import.meta.url)) {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)})`}`);
  };

  const base = { "1": "No será castigada ninguna acción ni omisión.", "2": "Sin efecto retroactivo.", "31 bis": "Responsabilidad de la persona jurídica." };

  console.log("== el diff ==");
  caso("captura idéntica: nada cambia",
    compararArticulos(base, base), { iguales: ["1", "2", "31 bis"], modificados: [], anadidos: [], eliminados: [] });

  caso("un artículo reformado sale solo él",
    compararArticulos(base, { ...base, "2": "Sin efecto retroactivo, salvo norma más favorable." }).modificados, ["2"]);

  caso("artículo nuevo",
    compararArticulos(base, { ...base, "31 ter": "Atenuantes." }).anadidos, ["31 ter"]);

  caso("artículo que no viene en la captura",
    compararArticulos(base, { "1": base["1"], "2": base["2"] }).eliminados, ["31 bis"]);

  console.log("\n== ruido de captura que NO debe contar como reforma ==");
  caso("saltos de línea del PDF",
    compararArticulos({ "1": "No será castigada\nninguna acción\nni omisión." }, { "1": "No será castigada ninguna acción ni omisión." }).modificados, []);
  caso("indicador ordinal contra signo de grado: se dibujan igual",
    compararArticulos({ "8": "el art\u00edculo 5.\u00ba de la Ley" }, { "8": "el art\u00edculo 5.\u00b0 de la Ley" }).modificados, []);
  caso("guion blando: invisible en el XML del BOE, ausente en el corpus",
    compararArticulos({ "348": "riesgos graves" }, { "348": "ries\u00adgos graves" }).modificados, []);
  caso("comillas y guiones tipográficos",
    compararArticulos({ "1": "el «dolo» —o culpa—" }, { "1": 'el "dolo" -o culpa-' }).modificados, []);

  console.log("\n== lo que SÍ debe contar ==");
  caso("una coma cambia el sentido y se detecta",
    compararArticulos({ "1": "No, será castigada" }, { "1": "No será castigada" }).modificados, ["1"]);
  caso("mayúscula distinta cuenta (en una norma no es cosmética)",
    compararArticulos({ "1": "la Ley" }, { "1": "la ley" }).modificados, ["1"]);

  console.log("\n== del artículo al concepto ==");
  const fuentes = [
    { concepto_id: "CP-002-retro", articulo: "art. 2" },
    { concepto_id: "CP-002-duda", articulo: "art. 2" },
    { concepto_id: "CP-189ter-persona-juridica", articulo: "art. 31 bis" },
    { concepto_id: "CP-001", articulo: "art. 1" },
  ];
  caso("solo los del artículo tocado", conceptosAfectados(["2"], fuentes).sort(), ["CP-002-duda", "CP-002-retro"]);
  caso("el sufijo bis no se pierde", conceptosAfectados(["31 bis"], fuentes), ["CP-189ter-persona-juridica"]);
  caso("nada cambiado, nada marcado", conceptosAfectados([], fuentes), []);

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test comparar-articulos: ${fallos ? "con fallos" : "OK"}`);
  process.exit(fallos ? 1 : 0);
}
