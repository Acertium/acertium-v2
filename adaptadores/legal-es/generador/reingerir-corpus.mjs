// Acertium — adaptador legal-es / reingerir el corpus desde el consolidado del BOE
//
//   node adaptadores/legal-es/generador/reingerir-corpus.mjs --cache <dir>   (informa)
//   node adaptadores/legal-es/generador/reingerir-corpus.mjs --cache <dir> --escribir
//   node adaptadores/legal-es/generador/reingerir-corpus.mjs BOE-A-1995-25444 --escribir
//
// Detrás de un proxy: NODE_USE_ENV_PROXY=1 node … (el fetch de Node ignora HTTPS_PROXY).
//
// QUÉ ARREGLA
//
// El corpus salió del PDF del Código 600 y de raspar boe.es, y las dos capturas
// tienen defectos que el diff contra el consolidado dejó medidos el 23/08/2026:
//
//   26 artículos con el RÓTULO DE DIVISIÓN pegado al final («…por la Ley. LIBRO II
//      Delitos y sus penas»), de los que cuelgan 18 conceptos;
//   15 con una NOTA EDITORIAL del BOE dentro del texto («Téngase en cuenta que
//      el apartado 3…»), 6 conceptos;
//   25 con la marca de omisión «[ . . . ]» del Código 600, que los hace
//      incomparables por diseño.
//
// Y algo peor que cualquiera de los tres: **20 de las 78 secciones se habían
// reconstruido desde los propios lotes**, así que 610 cotejos se estaban
// confirmando a sí mismos. `auditar-corpus` los contaba como «literales OK».
//
// El consolidado del BOE no tiene ninguno de esos problemas: es el texto
// oficial, estructurado por artículo, con la versión de cada uno fechada.
//
// QUÉ NO HACE, Y ES DELIBERADO
//
// - **No añade artículos.** El corpus guarda los que enseñamos; traerse los 723
//   del Código Penal para tener 340 conceptos no mejora nada y multiplica por
//   dos el repo. Los que el BOE tiene y nosotros no se cuentan y se dicen.
// - **No borra nada.** Un artículo que el consolidado no trae —anexos,
//   disposiciones, numeraciones que cambiaron— se queda como está, contado
//   aparte. Que el BOE no lo tenga bajo esa referencia no significa que sea
//   falso; significa que no se puede refrescar por aquí.
// - **No toca las secciones sin referencia BOE.** La Ortografía de la RAE, los
//   manuales de la DGT o el DLE no vienen de aquí y su verificación es la del
//   `contrato-fuentes-no-boe.md`.
// - **Coge la versión EN VIGOR**, no la última publicada. El consolidado incluye
//   redacciones futuras: a 23/08/2026 el art. 69 del Reglamento de Circulación ya
//   trae la del RD 518/2026, que no rige hasta el 1 de octubre. Meter eso en el
//   corpus sería enseñar Derecho que aún no lo es.
//
// LA PROCEDENCIA SE ESCRIBE EN EL FICHERO. Cada sección reingerida queda con
// `meta.ingesta = { fuente: "boe-consolidado", … }`. Es lo que permite que
// `auditar-corpus` deje de contar como circular lo que ya no lo es: hasta ahora
// la única forma de saber de dónde salía una sección era adivinarlo.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { articulosDesdeConsolidado, descargarConsolidado, claveArticulo } from "./extraer-articulos-boe.mjs";
import { normalizarParaComparar } from "../../../nucleo/comparar-articulos.mjs";
import { referenciaDeLote } from "./cotejar-contra-boe.mjs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const CORPUS = "datos/legal-es/boe-600-pn/corpus";
const LOTES = "adaptadores/legal-es/generador/lotes";

const clave = claveArticulo;

/**
 * @returns {{cambiados, iguales, sinEquivalente, soloEnBoe, articulos}}
 *   `articulos` es la lista nueva; el llamante decide si la escribe.
 */
export function reingerirSeccion(seccion, articulosBoe) {
  const cambiados = [], iguales = [], sinEquivalente = [];
  const articulos = (seccion.articulos ?? []).map((a) => {
    const nuevo = articulosBoe.get(clave(a.ref));
    if (nuevo === undefined) { sinEquivalente.push(a.ref); return a; }
    if (normalizarParaComparar(nuevo) === normalizarParaComparar(a.texto)) { iguales.push(a.ref); return a; }
    cambiados.push({ ref: a.ref, antes: a.texto.length, despues: nuevo.length });
    // `parcial` se retira aquí mismo: el consolidado trae el artículo entero, así
    // que la marca de omisión del Código 600 ya no describe este texto. Dejarla
    // excluiría del diff un artículo que sí es comparable.
    const { parcial, ...resto } = a;
    return { ...resto, texto: nuevo };
  });
  const nuestras = new Set((seccion.articulos ?? []).map((a) => clave(a.ref)));
  const soloEnBoe = [...articulosBoe.keys()].filter((r) => !nuestras.has(r));
  return { cambiados, iguales, sinEquivalente, soloEnBoe, articulos };
}

// Rótulo de división pegado al FINAL del texto: «…de la infracción penal. LIBRO I
// Disposiciones generales sobre los delitos…». Se lleva todo lo que venga detrás,
// que es la descripción de la división.
const RE_ROTULO_FINAL =
  /\s*(?:LIBRO|TÍTULO|TITULO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION|SUBSECCIÓN|SUBSECCION)\s+(?:[IVXLCDM]+|\d+\.?ª?|PRELIMINAR)\b[\s\S]*$/;

/**
 * El bloque `fuentes` de un lote es un EXTRACTO elegido, no una copia del
 * artículo — el art. 23 LOPJ tiene 13.499 caracteres y el lote cita 1.241. Así
 * que aquí no se sustituye: se RECORTA lo que no es de la norma.
 *
 * Y solo se recorta si al hacerlo el extracto pasa a encajar de verdad en el
 * texto del BOE. Si sigue sin encajar, se deja como está y se informa: eso ya no
 * es un rótulo pegado, es otra cosa que hay que mirar a mano.
 *
 * @returns {string|null} el extracto recortado, o null si no hay nada que hacer
 */
export function recortarRotuloFinal(extracto, textoBoe) {
  const dentro = (x) => normalizarParaComparar(textoBoe).includes(normalizarParaComparar(x));
  if (dentro(extracto)) return null;
  const recortado = String(extracto).replace(RE_ROTULO_FINAL, "").trim();
  return recortado !== extracto && dentro(recortado) ? recortado : null;
}

async function articulosDe(ref, { cache, aFecha }) {
  let xml;
  const fichero = cache ? `${cache}/${ref}.xml` : null;
  if (fichero && existsSync(fichero)) xml = readFileSync(fichero, "utf8");
  else {
    xml = await descargarConsolidado(ref);
    if (cache) { mkdirSync(cache, { recursive: true }); writeFileSync(fichero, xml); }
  }
  return articulosDesdeConsolidado(xml, { aFecha }).articulos;
}

if (esEjecucionDirecta(import.meta.url)) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const escribir = argv.includes("--escribir");
  const cache = opt("--cache");
  const aFecha = opt("--fecha") ?? new Date().toISOString().slice(0, 10);
  const pedidas = argv.filter((a) => /^BOE-A-\d{4}-\d+$/.test(a));

  let nSecciones = 0, nCambiados = 0, nIguales = 0, nSin = 0, nSoloBoe = 0, nSinConsolidado = 0;

  for (const f of readdirSync(CORPUS).filter((x) => /^seccion-\d+\.json$/.test(x))) {
    const ruta = `${CORPUS}/${f}`;
    const seccion = JSON.parse(readFileSync(ruta, "utf8"));
    const ref = seccion.meta?.referencia_boe;
    if (!ref) continue;                                   // fuentes no-BOE: no es su sitio
    if (pedidas.length && !pedidas.includes(ref)) continue;

    let articulosBoe;
    try { articulosBoe = await articulosDe(ref, { cache, aFecha }); }
    catch (e) { console.log(`✗ ${f} · ${ref} — ${e.message.split("\n")[0]}`); nSinConsolidado++; continue; }

    const r = reingerirSeccion(seccion, articulosBoe);
    nSecciones++;
    nCambiados += r.cambiados.length; nIguales += r.iguales.length;
    nSin += r.sinEquivalente.length; nSoloBoe += r.soloEnBoe.length;

    const marca = r.cambiados.length ? "▲" : "·";
    console.log(`${marca} ${f} · ${ref} — ${r.cambiados.length} refrescados · ${r.iguales.length} ya iguales · ${r.sinEquivalente.length} sin equivalente · ${r.soloEnBoe.length} solo en el BOE`);
    for (const c of r.cambiados.slice(0, 4)) {
      const delta = c.despues - c.antes;
      console.log(`      art. ${c.ref}: ${c.antes} → ${c.despues} caracteres (${delta > 0 ? "+" : ""}${delta})`);
    }
    if (r.cambiados.length > 4) console.log(`      … y ${r.cambiados.length - 4} más`);

    if (escribir && r.cambiados.length) {
      seccion.articulos = r.articulos;
      // `procedencia` es lo que lee `auditar-corpus` para saber si el corpus se
      // reconstruyó desde los propios lotes. Dejarlo en «pdf» después de
      // reingerir sería mentir sobre de dónde sale el texto.
      seccion.meta.procedencia = "boe-consolidado";
      seccion.meta.ingesta = {
        fuente: "boe-consolidado",
        url: `https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/${ref}/texto`,
        version_en_vigor_a: aFecha,
        capturado: new Date().toISOString().slice(0, 10),
      };
      writeFileSync(ruta, JSON.stringify(seccion, null, 2) + "\n");
    }
  }

  // --- Segunda pasada: los extractos `fuentes` de los lotes ---
  // El corpus y el `fuentes` del lote son dos copias del mismo texto, y refrescar
  // solo una las enfrenta: al reingerir el corpus, seis extractos que antes
  // «encajaban» dejaron de hacerlo. No es una regresión, es que el defecto
  // cambió de sitio — el extracto llevaba el rótulo pegado desde el principio.
  let nRecortados = 0, nSinArreglo = 0;
  for (const f of readdirSync(LOTES).filter((x) => x.endsWith(".json"))) {
    const ruta = `${LOTES}/${f}`;
    let texto = readFileSync(ruta, "utf8"), lote;
    try { lote = JSON.parse(texto); } catch { continue; }
    if (!lote.fuentes) continue;
    const ref = referenciaDeLote(lote);
    if (!ref || (pedidas.length && !pedidas.includes(ref))) continue;
    let arts;
    try { arts = await articulosDe(ref, { cache, aFecha }); } catch { continue; }

    for (const [k, v] of Object.entries(lote.fuentes)) {
      const boe = arts.get(clave(k));
      if (boe === undefined) continue;
      const recortado = recortarRotuloFinal(v, boe);
      if (recortado === null) continue;
      nRecortados++;
      console.log(`  ✂ ${f} · ${k}: rótulo de división retirado del extracto (${v.length} → ${recortado.length})`);
      const a = JSON.stringify(v).slice(1, -1), b = JSON.stringify(recortado).slice(1, -1);
      if (texto.includes(a)) texto = texto.split(a).join(b);
      else { nSinArreglo++; console.log(`     ✗ no se pudo localizar en el fichero`); }
    }
    if (escribir && nRecortados) writeFileSync(ruta, texto);
  }

  console.log(`\n${nSecciones} secciones del BOE · ${nCambiados} artículos refrescados · ${nIguales} ya coincidían`);
  console.log(`${nRecortados} extractos de lote recortados${nSinArreglo ? ` · ${nSinArreglo} no localizados en el fichero` : ""}`);
  console.log(`${nSin} sin equivalente en el consolidado (se conservan) · ${nSoloBoe} artículos que el BOE tiene y el corpus no (no se añaden)`);
  if (nSinConsolidado) console.log(`${nSinConsolidado} secciones sin consolidado accesible`);
  if (!escribir) console.log("\n(nada escrito: usa --escribir)");
}
