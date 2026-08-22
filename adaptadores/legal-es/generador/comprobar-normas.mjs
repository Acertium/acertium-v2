// Acertium — adaptador legal-es / el vigilante: qué ha cambiado de verdad
//
//   node adaptadores/legal-es/generador/comprobar-normas.mjs BOE-A-2003-23514
//   node ... BOE-A-2003-23514 --fecha 2026-10-01     (qué cambiará ese día)
//   node ... --todas                                 (las 77 secciones del corpus)
//   node ... BOE-A-2003-23514 --xml fichero.xml      (sin red, sobre una captura)
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
import { articulosDesdeConsolidado, descargarConsolidado } from "./extraer-articulos-boe.mjs";
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
    conceptos_a_reverificar: conceptosAfectados(d.modificados, fuentes),
    futuros: futurosNuestros,
    conceptos_en_futuros: conceptosAfectados([...new Set(futurosNuestros.map((f) => f.ref))], fuentes),
    iguales: d.iguales.length,
    parciales,
    sinComparar,
    total_conceptos: new Set(fuentes.map((f) => f.concepto_id)).size,
  };
}

async function xmlDeNorma(ref, { rutaXml, materia, destino }) {
  if (rutaXml) return readFileSync(rutaXml, "utf8");
  // Regla de Jonathan (23/08/2026): lo que se descarga del BOE se versiona. Por
  // eso el destino por defecto es el repo. `--destino` lo saca de ahí y existe
  // para UNA cosa: medir cuánto pesa una pasada completa antes de comprometer el
  // repo a guardarla. Lo que se mide con `--destino` no queda versionado, y por
  // tanto no vale como fuente citable.
  const dir = `${destino ?? FUENTES}/${materia ?? ref}`;
  const fichero = `${dir}/${ref}-consolidado-${new Date().toISOString().slice(0, 10)}.xml`;
  if (existsSync(fichero)) return readFileSync(fichero, "utf8");
  const xml = await descargarConsolidado(ref);
  mkdirSync(dir, { recursive: true });
  writeFileSync(fichero, xml);
  return xml;
}

if (esEjecucionDirecta(import.meta.url)) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const pedidas = argv.filter((a) => /^BOE-A-\d{4}-\d+$/.test(a));
  const todas = argv.includes("--todas");
  if (!pedidas.length && !todas) {
    console.error("uso: node comprobar-normas.mjs <BOE-A-...> [--fecha YYYY-MM-DD] [--xml f.xml] | --todas");
    process.exit(2);
  }

  const materias = materiasPorReferencia();
  const secciones = seccionesDelCorpus().filter((s) => todas || pedidas.includes(s.referencia_boe));
  if (!secciones.length) { console.error("ninguna sección del corpus con esa referencia"); process.exit(2); }

  const aFecha = opt("--fecha");
  let conCambio = 0;
  for (const s of secciones) {
    let r;
    try {
      const xml = await xmlDeNorma(s.referencia_boe, { rutaXml: opt("--xml"), materia: materias.get(s.referencia_boe), destino: opt("--destino") });
      r = comprobarNorma({ ...s, xml, aFecha });
    } catch (e) {
      console.log(`✗ ${s.referencia_boe} — ${e.message.split("\n")[0]}`);
      continue;
    }
    const hay = r.modificados.length || r.futuros.length;
    if (hay) conCambio++;
    const cabecera = `${hay ? "▲" : "·"} ${r.referencia_boe} — ${s.titulo.slice(0, 60)}…`;
    console.log(cabecera);
    console.log(`    ${r.iguales} iguales · ${r.modificados.length} MODIFICADOS · ${r.parciales.length} parciales (no comparables) · ${r.sinComparar.length} sin equivalente`);
    if (r.modificados.length)
      console.log(`    ⚠ re-verificar arts. ${r.modificados.join(", ")} → ${r.conceptos_a_reverificar.length} de ${r.total_conceptos} conceptos: ${r.conceptos_a_reverificar.join(", ")}`);
    for (const [fecha, refs] of agrupar(r.futuros))
      console.log(`    → el ${fecha}: arts. ${refs.join(", ")} (${r.conceptos_en_futuros.length} conceptos, NO se tocan hasta esa fecha)`);
  }
  console.log(`\n${secciones.length} normas comprobadas · ${conCambio} con algo que mirar`);
}

function agrupar(futuros) {
  const m = new Map();
  for (const f of futuros) {
    const d = `${f.vigencia.slice(6, 8)}/${f.vigencia.slice(4, 6)}/${f.vigencia.slice(0, 4)}`;
    m.set(d, [...(m.get(d) ?? []), f.ref]);
  }
  return m;
}
