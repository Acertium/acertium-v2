// Acertium — adaptador legal-es / el vigilante: qué ha cambiado de verdad
//
//   node adaptadores/legal-es/generador/comprobar-normas.mjs BOE-A-2003-23514
//   node ... BOE-A-2003-23514 --fecha 2026-10-01     (qué cambiará ese día)
//   node ... --todas                                 (las 77 secciones del corpus)
//   node ... BOE-A-2003-23514 --xml fichero.xml      (sin red, sobre una captura)
//
// QUÉ SE VERSIONA (decisión de Jonathan, 23/08/2026): la HUELLA por artículo
// siempre —`datos/fuentes/huellas/`, ~6 KB por norma— y el XML completo SOLO
// cuando la huella cambia. Un barrido completo son 26 MB de XML; guardarlos cada
// semana serían 1,3 GB al año. Ver `huellas-normas.mjs`.
//
// Detrás de un proxy: NODE_USE_ENV_PROXY=1 node … (el fetch de Node ignora HTTPS_PROXY).
//
// QUÉ HACE, Y POR QUÉ ASÍ. El aviso del BOE es POR NORMA; nuestro contenido es
// POR ARTÍCULO. Reaccionar al aviso de norma marcando todo lo que cuelga de ella
// apaga el 11 % del banco por una reforma que a lo mejor no nos toca. Esto baja
// el aviso a artículo, y de artículo a concepto:
//
//   norma reformada → artículos con texto distinto → conceptos que cuelgan de ellos
//
// TRES COSAS QUE NO SON LO MISMO Y AQUÍ SE SEPARAN:
//
//   modificados  el texto EN VIGOR hoy no es el que tenemos. Hay que re-verificar.
//   futuros      el BOE ya publicó una redacción que entra en vigor MÁS TARDE.
//                No se toca nada hoy: se avisa de la fecha. Un opositor que
//                examina antes de esa fecha responde con la redacción vieja, y
//                marcarla ahora le quitaría preguntas correctas.
//   parciales    nuestro texto lleva la marca «[...]» del Código 600: le faltan
//                apartados por diseño y NO es comparable. Se cuentan y se dicen,
//                no se comparan — si no, salen como reforma en cada pasada.
//
// El 23/08/2026, estrenándolo contra el Reglamento General de Circulación:
// 14 preguntas colgaban de la norma, el aviso del BOE decía «modificada el
// 26/06/2026», y lo que había de verdad era 1 artículo con redacción nueva que
// no entra en vigor hasta el 1 de octubre. Preguntas a tocar hoy: cero.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { articulosDesdeConsolidado, descargarConsolidado, claveArticulo } from "./extraer-articulos-boe.mjs";
import { huellasDeArticulos, leerHuella, escribirHuella, compararHuellas, DIR_HUELLAS } from "./huellas-normas.mjs";
import { compararArticulos, conceptosAfectados } from "../../../nucleo/comparar-articulos.mjs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const CORPUS = "datos/legal-es/boe-600-pn/corpus";
const LOTES = "adaptadores/legal-es/generador/lotes";
const FUENTES = "datos/fuentes";
const REGISTRO = "adaptadores/legal-es/generador/registro-materias.json";

/** referencia_boe → materia, según el registro (que es la fuente de verdad). */
export function materiasPorReferencia() {
  const reg = JSON.parse(readFileSync(REGISTRO, "utf8"));
  const m = new Map();
  for (const [k, v] of Object.entries(reg)) {
    if (k.startsWith("_") || !v?.referencia_boe) continue;
    m.set(v.referencia_boe, v.materia ?? k);
  }
  return m;
}

/**
 * concepto_fuente, leído de los lotes en vez de la base de datos: el vigilante
 * tiene que poder correr en CI sin credenciales.
 */
export function fuentesDeLotes(referenciaBoe) {
  const fuentes = [];
  for (const f of readdirSync(LOTES).filter((f) => f.endsWith(".json"))) {
    let lote;
    try { lote = JSON.parse(readFileSync(`${LOTES}/${f}`, "utf8")); } catch { continue; }
    if (lote?.meta?.referencia_boe !== referenciaBoe) continue;
    for (const c of lote.conceptos ?? []) if (c.articulo) fuentes.push({ concepto_id: c.id, articulo: c.articulo, lote: f });
  }
  return fuentes;
}

/** Las secciones del corpus, con su referencia_boe. */
export function seccionesDelCorpus() {
  const out = [];
  for (const f of readdirSync(CORPUS).filter((f) => /^seccion-\d+\.json$/.test(f))) {
    const c = JSON.parse(readFileSync(`${CORPUS}/${f}`, "utf8"));
    if (c?.meta?.referencia_boe) out.push({ fichero: f, ...c.meta, articulos: c.articulos ?? [] });
  }
  return out;
}

/**
 * @returns {{referencia_boe, fecha, modificados, futuros, eliminados, iguales, parciales, sinComparar}}
 *
 * `sinComparar` son los artículos que tenemos y el consolidado no trae A ESA
 * FECHA. Casi siempre es que el corpus usa otra numeración o que el artículo aún
 * no ha entrado en vigor — no «derogado». Distinguirlo exige leer la norma, así
 * que se informa y no se concluye.
 */
export function comprobarNorma({ referencia_boe, articulos, xml, aFecha }) {
  const { articulos: enVigor, futuros } = articulosDesdeConsolidado(xml, { aFecha });

  const parciales = articulos.filter((a) => a.parcial).map((a) => a.ref);
  const nuestros = new Map(articulos.filter((a) => !a.parcial).map((a) => [a.ref, a.texto]));
  const comunes = new Map([...enVigor].filter(([ref]) => nuestros.has(ref)));
  const sinComparar = [...nuestros.keys()].filter((ref) => !enVigor.has(ref));

  const d = compararArticulos(new Map([...nuestros].filter(([ref]) => comunes.has(ref))), comunes);
  const fuentes = fuentesDeLotes(referencia_boe);

  const nuestrasRefs = new Set(nuestros.keys());
  const futurosNuestros = futuros.filter((f) => nuestrasRefs.has(f.ref));

  return {
    referencia_boe,
    modificados: d.modificados,
    conceptos_a_reverificar: conceptosAfectados(d.modificados, fuentes, claveArticulo),
    futuros: futurosNuestros,
    conceptos_en_futuros: conceptosAfectados([...new Set(futurosNuestros.map((f) => f.ref))], fuentes, claveArticulo),
    iguales: d.iguales.length,
    parciales,
    sinComparar,
    total_conceptos: new Set(fuentes.map((f) => f.concepto_id)).size,
  };
}

async function xmlDeNorma(ref, { rutaXml, cache }) {
  if (rutaXml) return readFileSync(rutaXml, "utf8");
  // `--cache` no versiona nada: es para no volver a bajar 26 MB mientras se
  // depura. Lo que se guarda ahí NO vale como fuente citable.
  if (cache) {
    const fichero = `${cache}/${ref}.xml`;
    if (existsSync(fichero)) return readFileSync(fichero, "utf8");
    const xml = await descargarConsolidado(ref);
    mkdirSync(cache, { recursive: true });
    writeFileSync(fichero, xml);
    return xml;
  }
  return await descargarConsolidado(ref);
}

/**
 * Decide qué se versiona de esta captura. Regla de Jonathan (23/08/2026):
 * **la huella siempre, el XML completo solo si algo cambió.**
 *
 * El XML de una norma pesa hasta 1,2 MB y el barrido completo 26 MB; guardarlos
 * todos cada semana serían 1,3 GB al año. La huella son ~6 KB por norma.
 *
 * Y no se pierde la redacción anterior, que es el reparo obvio: el consolidado
 * del BOE lleva DENTRO todas las versiones históricas de cada artículo, así que
 * el XML que se guarda el día que algo cambia trae las dos redacciones.
 */
function versionar(ref, { xml, articulos, futuros, materia, hoy }) {
  const actual = huellasDeArticulos(articulos);
  const previa = leerHuella(ref);
  const d = compararHuellas(previa, actual);

  const cambio = d.primeraVez || d.cambiados.length || d.nuevos.length || d.desaparecidos.length;
  // La primera vez NO se guarda el XML: no hay nada con qué comparar, así que no
  // hay ningún cambio que documentar. Lo que se fija es la línea base.
  //
  // Y tampoco se guarda cuando el cambio es SOSPECHOSO —más de la mitad de los
  // artículos—, porque eso no es el BOE moviéndose sino nuestro extractor. Pasó
  // el mismo 23/08/2026: al enseñarle a leer «Artículo 588 bis a» aparecieron 69
  // preceptos «nuevos» de golpe. Guardar el XML ahí archiva como reforma un
  // cambio de código, y de paso mete 26 MB en el repo por sorpresa. Se avisa y
  // se deja que la huella se refije.
  const guardarXml = cambio && !d.primeraVez && !d.sospechoso;

  if (guardarXml) {
    const dir = `${FUENTES}/${materia ?? ref}`;
    mkdirSync(dir, { recursive: true });
    const fichero = `${dir}/${ref}-consolidado-${hoy}.xml`;
    writeFileSync(fichero, xml);
    anotarProcedencia(dir, { ref, hoy, fichero, d });
  }

  escribirHuella({
    referencia_boe: ref,
    capturado: hoy,
    articulos_en_vigor: Object.keys(actual).length,
    articulos: actual,
    futuros: futuros.map((f) => ({ ref: f.ref, norma: f.norma, vigencia: f.vigencia })),
  });

  return { ...d, guardarXml };
}

/** Un PDF o XML sin ficha de procedencia no es una fuente citable (README de `datos/fuentes/`). */
function anotarProcedencia(dir, { ref, hoy, fichero, d }) {
  const ruta = `${dir}/PROCEDENCIA.md`;
  const cabecera = `# ${ref} — procedencia\n\nTexto consolidado de la API de datos abiertos del BOE:\n\`${"https://www.boe.es/datosabiertos/api/legislacion-consolidada/id"}/${ref}/texto\`\n\nCada fichero de esta carpeta se guardó porque **la huella por artículo cambió**\nrespecto de la captura anterior (ver \`datos/fuentes/huellas/${ref}.json\`).\n\n## Capturas\n\n`;
  const linea = `- **${hoy}** — \`${fichero.split("/").pop()}\`: ${d.cambiados.length} artículos con texto distinto${d.nuevos.length ? `, ${d.nuevos.length} nuevos` : ""}${d.desaparecidos.length ? `, ${d.desaparecidos.length} desaparecidos` : ""}${d.sospechoso ? " — ⚠ SOSPECHOSO: cambió más de la mitad, mirar el extractor antes que la norma" : ""}. Cambiados: ${d.cambiados.join(", ") || "—"}\n`;
  if (!existsSync(ruta)) writeFileSync(ruta, cabecera + linea);
  else {
    const previo = readFileSync(ruta, "utf8");
    if (!previo.includes(fichero.split("/").pop())) writeFileSync(ruta, previo.replace(/\s*$/, "\n") + linea);
  }
}

if (esEjecucionDirecta(import.meta.url)) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const pedidas = argv.filter((a) => /^BOE-A-\d{4}-\d+$/.test(a));
  const todas = argv.includes("--todas");
  if (!pedidas.length && !todas) {
    console.error("uso: node comprobar-normas.mjs <BOE-A-...> | --todas\n" +
      "  --fecha YYYY-MM-DD   fecha de corte (por defecto, hoy)\n" +
      "  --sin-versionar      no escribe huellas ni XML\n" +
      "  --xml f.xml          compara contra una captura ya guardada (implica --sin-versionar)\n" +
      "  --cache dir          descargas fuera del repo, para depurar");
    process.exit(2);
  }

  const materias = materiasPorReferencia();
  const secciones = seccionesDelCorpus().filter((s) => todas || pedidas.includes(s.referencia_boe));
  if (!secciones.length) { console.error("ninguna sección del corpus con esa referencia"); process.exit(2); }

  const aFecha = opt("--fecha");
  const hoy = new Date().toISOString().slice(0, 10);
  const soloLectura = argv.includes("--sin-versionar") || Boolean(opt("--xml"));
  let conCambio = 0, xmlGuardados = 0, lineasBase = 0;

  for (const s of secciones) {
    let r, v = null;
    try {
      const xml = await xmlDeNorma(s.referencia_boe, { rutaXml: opt("--xml"), cache: opt("--cache") });
      r = comprobarNorma({ ...s, xml, aFecha });
      if (!soloLectura) {
        // La huella se calcula sobre el consolidado ENTERO, no solo sobre los
        // artículos que tenemos: así, el día que ampliemos el corpus de una
        // norma, ya hay línea base contra la que comparar.
        const c = articulosDesdeConsolidado(xml, { aFecha });
        v = versionar(s.referencia_boe, {
          xml, articulos: c.articulos, futuros: c.futuros,
          materia: materias.get(s.referencia_boe), hoy,
        });
        if (v.guardarXml) xmlGuardados++;
        if (v.primeraVez) lineasBase++;
      }
    } catch (e) {
      // El mensaje completo, no solo la primera línea: la pista sobre el proxy
      // —que es la causa más común de un 403 aquí— va en la segunda.
      const [primera, ...resto] = e.message.split("\n");
      console.log(`✗ ${s.referencia_boe} — ${primera}`);
      for (const l of resto) console.log(`  ${l}`);
      continue;
    }
    const hay = r.modificados.length || r.futuros.length;
    if (hay) conCambio++;
    console.log(`${hay ? "▲" : "·"} ${r.referencia_boe} — ${s.titulo.slice(0, 60)}…`);
    console.log(`    ${r.iguales} iguales · ${r.modificados.length} MODIFICADOS · ${r.parciales.length} parciales (no comparables) · ${r.sinComparar.length} sin equivalente`);
    if (r.modificados.length)
      console.log(`    ⚠ re-verificar arts. ${r.modificados.join(", ")} → ${r.conceptos_a_reverificar.length} de ${r.total_conceptos} conceptos: ${r.conceptos_a_reverificar.join(", ")}`);
    for (const [fecha, refs] of agrupar(r.futuros))
      console.log(`    → el ${fecha}: arts. ${refs.join(", ")} (${r.conceptos_en_futuros.length} conceptos, NO se tocan hasta esa fecha)`);
    // Lo de arriba compara NUESTRO corpus con lo vigente; esto compara el BOE de
    // hoy con el BOE de la última captura. Son dos preguntas distintas: la
    // primera dice si lo que servimos está al día, la segunda si el BOE se ha
    // movido — y puede moverse en artículos que no tenemos.
    if (v?.primeraVez) console.log(`    huella: línea base fijada (consolidado entero, ${v.nuevos.length} artículos)`);
    else if (v && (v.cambiados.length || v.nuevos.length || v.desaparecidos.length))
      console.log(`    huella: el BOE se movió desde la última captura — ${v.cambiados.length} cambiados, ${v.nuevos.length} nuevos, ${v.desaparecidos.length} desaparecidos${v.sospechoso ? " ⚠ SOSPECHOSO (mirar el extractor antes que la norma)" : ""} → XML versionado`);
  }

  console.log(`\n${secciones.length} normas comprobadas · ${conCambio} con algo que mirar`);
  if (!soloLectura)
    console.log(`huellas escritas en ${DIR_HUELLAS}/ · ${lineasBase} líneas base nuevas · ${xmlGuardados} XML versionados (solo los que cambiaron)`);
}

function agrupar(futuros) {
  const m = new Map();
  for (const f of futuros) {
    const d = `${f.vigencia.slice(6, 8)}/${f.vigencia.slice(4, 6)}/${f.vigencia.slice(0, 4)}`;
    m.set(d, [...(m.get(d) ?? []), f.ref]);
  }
  return m;
}
