// Acertium — adaptador legal-es / ¿sigue estando en la ley lo que servimos?
//
//   node adaptadores/legal-es/generador/cotejar-contra-boe.mjs --cache <dir>
//   node adaptadores/legal-es/generador/cotejar-contra-boe.mjs            (descarga)
//   npm run cotejar:boe
//
// Detrás de un proxy: NODE_USE_ENV_PROXY=1 node … (el fetch de Node ignora HTTPS_PROXY).
//
// QUÉ PREGUNTA, Y POR QUÉ NO ES LA MISMA QUE LAS DEMÁS
//
// `verificador-cotejo` comprueba que la opción correcta de cada test es cita
// literal DEL CORPUS. `comprobar-normas` comprueba que el CORPUS coincide con el
// BOE. Esto comprueba la cadena entera de una vez, y contra la única autoridad
// que cuenta: **¿la frase que le enseñamos al opositor está, hoy, en el texto en
// vigor del BOE?**
//
// Importa que sea distinta porque las dos primeras pueden pasar y esta fallar:
// si el corpus se capturó mal, el cotejo cuadra contra un texto que no es el de
// la ley. El 22/08/2026 se midió que 20 de las 78 secciones del corpus se habían
// reconstruido desde los propios lotes —el lote confirmándose a sí mismo—, y
// `auditar-corpus` contaba esos 610 cotejos como «literales OK».
//
// Esto no se puede engañar así: el texto viene de boe.es, en el momento, y se
// elige la versión EN VIGOR (no la última publicada, que puede no regir aún).
//
// CÓMO SE CLASIFICA CADA COTEJO
//
//   literal              la frase está tal cual en el artículo vigente.
//   vineta_omitida       está, salvo la viñeta con que la ley abre el ítem de una
//                        lista («de: -Policía, seguridad…»), que no es texto.
//   punto_final_anadido  está, salvo el punto con que la cita se cierra y que la
//                        ley no tiene porque la frase sigue. Es cita truncada,
//                        no error de contenido — pero se cuenta aparte, porque
//                        «literal» tiene que querer decir literal.
//   corrige_al_boe       nuestra cita arregla una errata del BOE («a la
//                        Unidades» → «a las Unidades»). Suena a mejora y es un
//                        problema: el examen cita el BOE, no nuestra corrección.
//                        Se listan una a una; no se normalizan nunca.
//   no_encontrado        lo que hay que mirar.
//   sin_consolidado      la norma no está en la API del BOE (los tratados) o no
//   sin_articulo         el artículo no está en el consolidado (anexos,
//                        disposiciones, fuentes no-BOE). No es un fallo: es que
//                        no hay contra qué cotejar, y se dice.

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { articulosDesdeConsolidado, descargarConsolidado } from "./extraer-articulos-boe.mjs";
import { normalizarParaComparar } from "../../../nucleo/comparar-articulos.mjs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const LOTES = "adaptadores/legal-es/generador/lotes";
const REGISTRO = "adaptadores/legal-es/generador/registro-materias.json";

/**
 * La norma de un lote. Si el `meta` no la declara, se saca del registro por
 * FAMILIA (el prefijo del id de concepto), que es la fuente de verdad.
 *
 * No es un adorno: cinco lotes del banco no tienen `meta` siquiera —`ce-t8`,
 * `ce-t9`, `ce-t10`, `ce-disp` y `ley-5-2014`, anteriores a la puerta de
 * metadatos— y sus 88 cotejos quedaban fuera del alcance de esta comprobación
 * por una carencia de fichero, no de contenido. Son Constitución y Ley de
 * Seguridad Privada: dos normas que sí están en el BOE.
 */
export function referenciaDeLote(lote) {
  if (lote?.meta?.referencia_boe) return lote.meta.referencia_boe;
  const familia = String(lote?.conceptos?.[0]?.id ?? lote?.actividades?.[0]?.concepto_id ?? "").split("-")[0];
  if (!familia) return null;
  let reg;
  try { reg = JSON.parse(readFileSync(REGISTRO, "utf8")); } catch { return null; }
  return reg[familia]?.referencia_boe ?? null;
}

const clave = (s) =>
  String(s ?? "").toLowerCase().replace(/^\s*(arts?\.|artículos?|articulos?)\s*/, "").trim();

// ERRATAS DEL PROPIO BOE, verificadas una a una contra el consolidado el
// 23/08/2026. Nuestro texto las corrige, y hasta ese día lo hacía EN SILENCIO:
// nadie sabía que en esos tres puntos no citábamos literalmente.
//
// No se «arreglan» ni se normalizan a ciegas. Van aquí, con nombre y apellidos,
// por dos razones: que el cotejo deje de dar un fallo sin explicación, y que
// quede constancia de que en esos tres sitios el examen puede citar algo
// distinto de lo que enseñamos — porque el examen se redacta desde el BOE.
//
// Añadir una entrada aquí exige haber ido al consolidado y haberlo visto. No es
// un cajón para meter lo que no cuadra.
const ERRATAS_BOE = [
  { norma: "BOE-A-1995-5542", articulo: "5", boe: "en particular. del derecho", nuestro: "en particular del derecho",
    nota: "punto donde va coma; RD 203/1995, texto original de 1995" },
  { norma: "BOE-A-1995-5542", articulo: "18", boe: "Ley 5/1984; reguladora", nuestro: "Ley 5/1984, reguladora",
    nota: "punto y coma donde va coma" },
  { norma: "BOE-A-1987-14578", articulo: "19", boe: "a la Unidades de la Policía Judicial", nuestro: "a las Unidades de la Policía Judicial",
    nota: "falta la «s»; RD 769/1987, texto original de 1987" },
];

/** Aplica al texto del BOE las erratas conocidas de ESE artículo. */
function conErratasCorregidas(texto, norma, articulo) {
  let t = texto;
  for (const e of ERRATAS_BOE)
    if (e.norma === norma && e.articulo === articulo) t = t.split(e.boe).join(e.nuestro);
  return t;
}

/**
 * @param {string} cotejo
 * @param {string} textoArticulo
 * @returns {{clase: string, coincide?: number}}
 */
export function clasificarCotejo(cotejo, textoArticulo, { norma, articulo } = {}) {
  const t = normalizarParaComparar(textoArticulo);
  const c = normalizarParaComparar(cotejo);
  if (!c) return { clase: "vacio" };
  if (t.includes(c)) return { clase: "literal" };
  // La cita cerrada con un punto que la ley no tiene: «…del CNPIC.» cuando el
  // artículo sigue «…del CNPIC, y estará compuesto por:».
  const sinPunto = c.replace(/[.;,:]$/, "");
  if (sinPunto !== c && t.includes(sinPunto)) return { clase: "punto_final_anadido" };
  // La viñeta de una lista no es texto de la norma. El art. 3 LPRL enumera con
  // guion pegado a la palabra —«de: -Policía, seguridad y resguardo aduanero»— y
  // la cita, razonablemente, se lo salta. Se prueba también sin viñetas, y sale
  // en su propio saco: no se esconde, se nombra.
  const sinVinetas = t.replace(/(^|\s)[-\u2013\u2022]\s*(?=[A-ZÁÉÍÓÚÑ])/g, "$1");
  if (sinVinetas.includes(sinPunto)) return { clase: "vineta_omitida" };
  const corregido = normalizarParaComparar(conErratasCorregidas(t, norma, articulo));
  if (corregido !== t && corregido.includes(sinPunto)) return { clase: "corrige_al_boe" };
  return { clase: "no_encontrado", coincide: prefijoComun(t, sinPunto), largo: sinPunto.length };
}

/** Cuántos caracteres del cotejo coinciden en el mejor punto del artículo. */
function prefijoComun(texto, cotejo) {
  if (!cotejo) return 0;
  let mejor = 0;
  const inicio = cotejo.slice(0, 24);
  for (let i = texto.indexOf(inicio); i >= 0; i = texto.indexOf(inicio, i + 1)) {
    let j = 0;
    while (j < cotejo.length && texto[i + j] === cotejo[j]) j++;
    if (j > mejor) mejor = j;
  }
  return mejor;
}

export function actividadesConCotejo(dir = LOTES) {
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    let l;
    try { l = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")); } catch { continue; }
    for (const a of l.actividades ?? []) {
      if (a.cotejo) out.push({ lote: f, referencia_boe: referenciaDeLote(l), concepto_id: a.concepto_id, articulo: a.articulo, cotejo: a.cotejo });
    }
  }
  return out;
}

async function articulosDe(ref, { cache, aFecha }) {
  if (!ref) return null;
  let xml;
  if (cache && existsSync(`${cache}/${ref}.xml`)) xml = readFileSync(`${cache}/${ref}.xml`, "utf8");
  else {
    try { xml = await descargarConsolidado(ref); } catch { return null; }
    if (cache) { mkdirSync(cache, { recursive: true }); writeFileSync(`${cache}/${ref}.xml`, xml); }
  }
  return articulosDesdeConsolidado(xml, { aFecha }).articulos;
}

function autoprueba() {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = real === esperado;
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${esperado}, dio ${real})`}`);
  };
  const cl = (c, t, m) => clasificarCotejo(c, t, m).clase;

  console.log("== la cita está en la ley ==");
  caso("literal", cl("prioridad de paso", "Tendrán prioridad de paso sobre los demás."), "literal");
  caso("el ruido de captura no cuenta",
    cl("el «dolo» —o culpa—", 'Se aprecia el "dolo" -o culpa- en el hecho.'), "literal");

  console.log("\n== las tres formas de no ser literal sin estar mal ==");
  caso("punto de cierre que la ley no tiene",
    cl("presidido por el Director del CNPIC.", "estará presidido por el Director del CNPIC, y compuesto por:"), "punto_final_anadido");
  caso("viñeta de lista omitida (art. 3 LPRL)",
    cl("de: Policía, seguridad y resguardo aduanero", "funciones públicas de: -Policía, seguridad y resguardo aduanero. -Servicios"), "vineta_omitida");
  caso("nuestra cita corrige una errata del BOE (RD 769/1987 art. 19)",
    cl("encargar a las Unidades de la Policía Judicial otras funciones",
      "no podrán encargar a la Unidades de la Policía Judicial otras funciones que las previstas",
      { norma: "BOE-A-1987-14578", articulo: "19" }), "corrige_al_boe");
  caso("la errata solo vale para SU artículo",
    cl("encargar a las Unidades de la Policía Judicial otras funciones",
      "no podrán encargar a la Unidades de la Policía Judicial otras funciones que las previstas",
      { norma: "BOE-A-1987-14578", articulo: "20" }), "no_encontrado");

  console.log("\n== lo que sí es un fallo ==");
  caso("una cifra distinta no se perdona",
    cl("en el plazo de tres meses", "se resolverá en el plazo de dos meses."), "no_encontrado");
  caso("una negación distinta tampoco",
    cl("no podrá ser sancionado", "podrá ser sancionado con arreglo a."), "no_encontrado");

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test cotejar-contra-boe: ${fallos ? "con fallos" : "OK"}`);
  return fallos;
}

if (esEjecucionDirecta(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.includes("--test")) process.exit(autoprueba() ? 1 : 0);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const cache = opt("--cache");
  const aFecha = opt("--fecha");

  const actividades = actividadesConCotejo();
  const porNorma = new Map();
  for (const a of actividades) porNorma.set(a.referencia_boe, [...(porNorma.get(a.referencia_boe) ?? []), a]);

  const cuenta = { literal: 0, punto_final_anadido: 0, vineta_omitida: 0, corrige_al_boe: 0, no_encontrado: 0, sin_consolidado: 0, sin_articulo: 0, vacio: 0 };
  const fallos = [], truncadas = [];

  for (const [ref, lista] of porNorma) {
    const arts = await articulosDe(ref, { cache, aFecha });
    if (!arts) { cuenta.sin_consolidado += lista.length; continue; }
    for (const a of lista) {
      const texto = arts.get(clave(a.articulo));
      if (texto === undefined) { cuenta.sin_articulo++; continue; }
      const r = clasificarCotejo(a.cotejo, texto, { norma: ref, articulo: clave(a.articulo) });
      cuenta[r.clase]++;
      if (r.clase === "no_encontrado") fallos.push({ ...a, ...r });
      if (r.clase === "punto_final_anadido") truncadas.push(a);
    }
  }

  const cotejables = cuenta.literal + cuenta.punto_final_anadido + cuenta.vineta_omitida + cuenta.corrige_al_boe + cuenta.no_encontrado;
  console.log(`${actividades.length} actividades con cotejo · ${cotejables} cotejables contra el BOE vigente\n`);
  console.log(`  literal en el BOE de hoy       : ${cuenta.literal}`);
  console.log(`  literal salvo el punto de cierre: ${cuenta.punto_final_anadido}`);
  console.log(`  literal salvo la viñeta de lista: ${cuenta.vineta_omitida}`);
  console.log(`  corrige una errata del BOE      : ${cuenta.corrige_al_boe}   (ERRATAS_BOE, verificadas a mano)`);
  console.log(`  NO ENCONTRADO                  : ${cuenta.no_encontrado}`);
  console.log(`  sin consolidado en el BOE      : ${cuenta.sin_consolidado}`);
  console.log(`  artículo fuera del consolidado : ${cuenta.sin_articulo}   (anexos, disposiciones, fuentes no-BOE)`);

  if (fallos.length) {
    console.log(`\n── los ${fallos.length} que no encajan ──`);
    for (const f of fallos)
      console.log(`  ${f.concepto_id} · ${f.referencia_boe} · ${f.articulo} — coincide ${f.coincide}/${f.largo}\n      «${f.cotejo.slice(0, 100)}…»`);
  }
  console.log(`\nCotejable ≠ verificado: ${cuenta.sin_consolidado + cuenta.sin_articulo} cotejos no tienen contra qué comprobarse aquí.`);
  process.exit(0); // inventario, no puerta
}
