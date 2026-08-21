// Acertium — adaptador legal-es / generador / CORPUS A PARTIR DE LOS LOTES
//
// POR QUÉ EXISTE
// El corpus (`datos/legal-es/boe-600-pn/corpus/`) es el texto de las fuentes, y
// es lo que leen dos cosas: el motor, para escribir preguntas nuevas, y las
// puertas, para comprobar que la correcta sale literalmente de ahí.
//
// Medido el 22/08/2026: de las 3.440 parejas actividad↔fuente del cerebro, solo
// el 81,8 % tenía corpus donde cotejarse. Faltaban 20 materias enteras:
//
//   · 517 actividades de fuentes NO-BOE (RAE, DGT, INCIBE, INSST, OMS, ONU…),
//     que nunca tuvieron sección porque el corpus nació del Código 600.
//   ·  75 de familias multi-instrumento (CEDH, TORT): la sección se indexaba por
//     una sola referencia BOE y estas tienen tres o cuatro.
//   ·  34 de ENC, cuya sección EXISTÍA pero estaba vacía —378 bytes, `articulos:
//     []`— porque la Estrategia Nacional de Ciberseguridad no es una norma
//     articulada y la extracción sacó cero. Nada comprobaba que un fichero de
//     corpus tuviera contenido, así que pasó inadvertido meses.
//
// El texto no había que ir a buscarlo: ya estaba en el repo. Los 110 lotes de
// `lotes/*.json` llevan su bloque `fuentes` —así lo exige `contrato-generacion.md`
// y lo comprueba `verificar-lote`—. Esto lo recoloca donde el resto del sistema
// lo busca.
//
//   node adaptadores/legal-es/generador/corpus-desde-lotes.mjs          (simulacro)
//   node adaptadores/legal-es/generador/corpus-desde-lotes.mjs --escribir
//
// QUÉ VALE Y QUÉ NO VALE ESTO — léelo antes de usar el resultado como prueba.
//
// Una sección hecha aquí lleva `meta.procedencia: "lote"`, y esa marca importa.
// El texto viene del mismo lote del que salieron las preguntas, así que volver a
// cotejar esas preguntas contra él NO es verificación independiente: pasarían por
// construcción. Compárese con `seccion-059.json` (Constitución de la OMS), que se
// ingirió del documento original y hasta documenta en `sustituye` una reingesta
// anterior que se descartó por erratas. Eso sí es una fuente.
//
// Entonces, ¿para qué sirve? Para tres cosas reales:
//   1. DESBLOQUEA LA GENERACIÓN. El motor no podía escribir preguntas nuevas para
//      esas 20 materias porque no tenía de dónde leer.
//   2. DA UN SUELO UNIFORME AL AUDITOR: calidad y unicidad pasan a cubrir el
//      100 % del banco, y el re-cotejo detecta lo que NO nació de un lote
//      (cargado por otra vía, o editado a mano después).
//   3. ES EL SUSTRATO DEL VIGILANTE DE FRESCURA: con el texto y la referencia en
//      un sitio, se puede diferenciar contra el BOE vivo.
// Lo que NO hace es demostrar que una pregunta es fiel a la norma. Para eso hay
// que reingerir del documento original, materia por materia.

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const LOTES = join(RAIZ, "adaptadores/legal-es/generador/lotes");
const CORPUS = join(RAIZ, "datos/legal-es/boe-600-pn/corpus");

const ADVERTENCIA =
  "Texto recogido de los lotes de generación, no reingerido del documento original. " +
  "Sirve para generar preguntas nuevas y para las puertas de calidad y unicidad, pero " +
  "re-cotejar contra él las preguntas que salieron de estos mismos lotes NO es " +
  "verificación independiente: pasan por construcción. Para verificar de verdad hay que " +
  "reingerir de la fuente citada en `referencia_fuente`.";

/** Lo que ya hay en el corpus, y cuáles están vacías. */
export function leerCorpus() {
  const secciones = [];
  for (const f of readdirSync(CORPUS).filter((x) => x.startsWith("seccion-"))) {
    const d = JSON.parse(readFileSync(join(CORPUS, f), "utf8"));
    secciones.push({
      fichero: f,
      seccion: d.meta?.seccion ?? Number(f.match(/\d+/)?.[0]),
      titulo: d.meta?.titulo ?? "",
      materia: d.meta?.materia ?? null,
      boe: d.meta?.referencia_boe || "",
      articulos: (d.articulos ?? []).length,
      doc: d,
    });
  }
  return secciones.sort((a, b) => a.seccion - b.seccion);
}

/** Las materias de los lotes, con todas sus fuentes juntas. */
export function leerLotes() {
  const porMateria = new Map();
  for (const f of readdirSync(LOTES).filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(LOTES, f), "utf8"));
    const m = d.meta?.materia;
    if (!m) continue;
    if (!porMateria.has(m))
      porMateria.set(m, {
        materia: m,
        norma: d.meta.norma ?? "",
        boe: d.meta.referencia_boe || "",
        referencia_fuente: d.meta.referencia_fuente ?? null,
        tipo_fuente: d.meta.tipo_fuente ?? null,
        fuentes: {},
        lotes: [],
      });
    const e = porMateria.get(m);
    e.lotes.push(f);
    // Un lote posterior puede reingerir un artículo: gana el último leído, y se
    // avisa si el texto cambia, porque eso significa que dos lotes de la misma
    // materia discrepan sobre qué dice la fuente.
    for (const [ref, texto] of Object.entries(d.fuentes ?? {})) {
      if (e.fuentes[ref] && e.fuentes[ref] !== texto)
        e.discrepancias = [...(e.discrepancias ?? []), ref];
      e.fuentes[ref] = texto;
    }
    // Referencias adicionales: las multi-instrumento traen varias.
    if (Array.isArray(d.meta.referencia_fuente))
      e.referencia_fuente = [
        ...new Set([...(Array.isArray(e.referencia_fuente) ? e.referencia_fuente : e.referencia_fuente ? [e.referencia_fuente] : []), ...d.meta.referencia_fuente]),
      ];
  }
  return porMateria;
}

/** Materias de los lotes que hoy NO tienen corpus con contenido. */
export function huecos(porMateria, secciones) {
  const conBoe = new Set(secciones.filter((s) => s.articulos > 0 && s.boe).map((s) => s.boe));
  const conTitulo = new Set(secciones.filter((s) => s.articulos > 0).map((s) => s.titulo.toLowerCase()));
  const conMateria = new Set(secciones.filter((s) => s.articulos > 0 && s.materia).map((s) => s.materia));
  return [...porMateria.values()].filter(
    (e) =>
      !conMateria.has(e.materia) &&
      !(e.boe && conBoe.has(e.boe)) &&
      !conTitulo.has(e.norma.toLowerCase()),
  );
}

/**
 * INTEGRIDAD DEL CORPUS. El control que no existía y por el que la sección 34
 * estuvo vacía sin que nadie lo notara: 378 bytes, `articulos: []`, y las 34
 * preguntas de ENC apuntando a ella. Nada leía el corpus buscando huecos —las
 * puertas leen el lote, no el corpus—, así que un fichero podía estar vacío
 * indefinidamente sin romper nada visible.
 *
 * Devuelve la lista de problemas. Vacía = todo en orden.
 */
export function comprobarIntegridad() {
  const secciones = leerCorpus();
  const problemas = [];

  for (const s of secciones) {
    if (s.articulos === 0) problemas.push(`${s.fichero} no tiene ni un epígrafe (${s.titulo.slice(0, 50)})`);
    if (!s.titulo) problemas.push(`${s.fichero} sin título en el meta`);
    // Sin BOE ni materia la sección es inalcanzable: no hay clave con la que
    // enlazarla al cerebro. Le pasaba a la 059, la mejor del corpus.
    if (!s.boe && !s.materia) problemas.push(`${s.fichero} no tiene ni referencia_boe ni materia: nada puede enlazarla`);
    const sinTexto = (s.doc.articulos ?? []).filter((a) => !String(a.texto ?? "").trim()).length;
    if (sinTexto) problemas.push(`${s.fichero} tiene ${sinTexto} epígrafe(s) con ref pero sin texto`);
  }

  // El índice tiene que reflejar el disco. Si alguien añade una sección a mano y
  // no lo regenera, el resto del sistema no la ve.
  try {
    const { normas } = JSON.parse(readFileSync(join(CORPUS, "indice.json"), "utf8"));
    const enIndice = new Map(normas.map((n) => [n.fichero, n.articulos]));
    for (const s of secciones) {
      if (!enIndice.has(s.fichero)) problemas.push(`${s.fichero} no está en indice.json`);
      else if (enIndice.get(s.fichero) !== s.articulos)
        problemas.push(`${s.fichero}: el índice dice ${enIndice.get(s.fichero)} epígrafes y el fichero tiene ${s.articulos}`);
    }
    for (const [f] of enIndice)
      if (!secciones.some((s) => s.fichero === f)) problemas.push(`indice.json lista ${f}, que no existe`);
  } catch (e) {
    problemas.push(`indice.json ilegible: ${e.message}`);
  }

  return problemas;
}

function main() {
  const escribir = process.argv.includes("--escribir");

  if (process.argv.includes("--comprobar")) {
    const problemas = comprobarIntegridad();
    const n = leerCorpus();
    for (const p of problemas) console.error("  ✗", p);
    console.log(
      problemas.length
        ? `✗ corpus: ${problemas.length} problema(s) en ${n.length} secciones`
        : `✓ corpus: ${n.length} secciones, ${n.reduce((s, x) => s + x.articulos, 0)} epígrafes, ninguna vacía, índice al día`,
    );
    process.exit(problemas.length ? 1 : 0);
  }

  const secciones = leerCorpus();
  const porMateria = leerLotes();
  const falta = huecos(porMateria, secciones);

  const vacias = secciones.filter((s) => s.articulos === 0);
  if (vacias.length)
    console.log(`secciones vacías: ${vacias.map((s) => `${s.fichero} (${s.titulo.slice(0, 40)}…)`).join(", ")}`);
  console.log(`${porMateria.size} materias en los lotes · ${falta.length} sin corpus utilizable`);

  // Se reutiliza el número de una sección VACÍA cuando coincide la referencia
  // BOE (el caso de ENC): esa sección ya está en el índice y referenciada, y
  // darle otro número dejaría el hueco detrás.
  const librePor = new Map(vacias.filter((s) => s.boe).map((s) => [s.boe, s]));
  let siguiente = Math.max(...secciones.map((s) => s.seccion)) + 1;

  const escritas = [];
  for (const e of falta.sort((a, b) => Object.keys(b.fuentes).length - Object.keys(a.fuentes).length)) {
    const reutiliza = e.boe ? librePor.get(e.boe) : null;
    const num = reutiliza ? reutiliza.seccion : siguiente++;
    const fichero = `seccion-${String(num).padStart(3, "0")}.json`;
    const articulos = Object.entries(e.fuentes).map(([ref, texto]) => ({ ref, texto }));

    const doc = {
      meta: {
        seccion: num,
        titulo: e.norma,
        // `materia` es la clave de unión con `acertium_v2.concepto.materia`. Las
        // secciones antiguas no la llevan y se emparejan por referencia BOE;
        // las nuevas la llevan porque muchas no tienen BOE que usar de clave.
        materia: e.materia,
        referencia_boe: e.boe,
        referencia_fuente: e.referencia_fuente,
        tipo_fuente: e.tipo_fuente,
        procedencia: "lote",
        lotes_origen: e.lotes.sort(),
        advertencia: ADVERTENCIA,
        ...(reutiliza ? { sustituye: `sección ${num} estaba vacía (0 artículos)` } : {}),
      },
      articulos,
    };

    if (e.discrepancias?.length)
      doc.meta.discrepancias = `dos lotes de esta materia dan texto distinto para: ${[...new Set(e.discrepancias)].join(", ")}. Gana el último leído; conviene reingerir.`;

    escritas.push({ fichero, num, materia: e.materia, n: articulos.length, reutiliza: !!reutiliza });
    if (escribir) writeFileSync(join(CORPUS, fichero), JSON.stringify(doc, null, 2) + "\n");
  }

  for (const w of escritas)
    console.log(`  ${w.reutiliza ? "rellena" : "crea   "} ${w.fichero} · ${String(w.n).padStart(3)} epígrafes · ${w.materia}`);
  console.log(`  total: ${escritas.reduce((s, w) => s + w.n, 0)} epígrafes en ${escritas.length} secciones`);

  if (!escribir) return console.log("\n(simulacro: no se ha escrito nada. Añade --escribir)");

  // El índice se REGENERA leyendo el disco, no acumulando lo que creemos haber
  // escrito: así refleja lo que hay, no lo que pensábamos que habría.
  const normas = leerCorpus().map((s) => ({
    seccion: s.seccion,
    titulo: s.titulo,
    ...(s.materia ? { materia: s.materia } : {}),
    referencia_boe: s.boe,
    articulos: s.articulos,
    fichero: s.fichero,
    ...(s.doc.meta?.procedencia ? { procedencia: s.doc.meta.procedencia } : {}),
  }));
  writeFileSync(join(CORPUS, "indice.json"), JSON.stringify({ normas }, null, 2) + "\n");

  const siguenVacias = normas.filter((n) => n.articulos === 0);
  console.log(`\n✓ índice regenerado: ${normas.length} secciones`);
  console.log(
    siguenVacias.length
      ? `✗ SIGUEN VACÍAS: ${siguenVacias.map((n) => n.fichero).join(", ")}`
      : "✓ ninguna sección vacía",
  );
}

if (process.argv[1] && process.argv[1].endsWith("corpus-desde-lotes.mjs")) main();
