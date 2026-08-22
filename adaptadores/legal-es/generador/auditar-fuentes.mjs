// Acertium — adaptador legal-es / ¿está el documento original en el repo?
//
//   node adaptadores/legal-es/generador/auditar-fuentes.mjs
//   npm run auditar:fuentes
//
// POR QUÉ EXISTE (23/08/2026)
// Regla de Jonathan: **de cada PDF se guarda copia versionada en el repo, como
// histórico.** Hasta hoy `.gitignore` lo impedía (`datos/**/*.pdf`), con la
// convocatoria como única excepción, y el resultado medido fue este: 20 de las
// 78 secciones del corpus se reconstruyeron DESDE LOS LOTES porque el documento
// no estaba, y `auditar-corpus` contaba sus 610 cotejos como «literales OK»
// cuando en realidad el lote se estaba confirmando a sí mismo.
//
// `datos/fuentes/README.md` ya describía la convención desde el 22/08. Lo que
// faltaba era algo que dijera, sin tener que acordarse, QUÉ FALTA. Eso es esto.
//
// NO FALLA NUNCA (exit 0). No es una puerta: es un inventario. Que falte un
// documento no es defecto de nadie que esté cargando un lote hoy, y bloquear el
// pipeline por ello solo conseguiría que se desactivara la comprobación. Lo que
// hace falta es que la cifra se vea y baje.

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const FUENTES = join(RAIZ, "datos/fuentes");
const CORPUS = join(RAIZ, "datos/legal-es/boe-600-pn/corpus");

// Lo que NO cuenta como «el documento»: la ficha y las notas son metadatos.
const ES_FICHA = (f) => /\.md$/i.test(f);

/**
 * Estado de cada materia: ¿tiene carpeta, ficha y documento?
 * @returns {{materia:string, norma:string, familias:string[], carpeta:boolean,
 *            ficha:boolean, documentos:string[], bytes:number, procedencia:string|null}[]}
 */
export function inventarioDeFuentes() {
  const registro = JSON.parse(
    readFileSync(join(RAIZ, "adaptadores/legal-es/generador/registro-materias.json"), "utf8"),
  );

  // Procedencia declarada por cada sección del corpus, indexada por materia:
  // es lo que distingue una ingesta de verdad de una reconstrucción circular.
  const procedencia = new Map();
  for (const f of readdirSync(CORPUS).filter((x) => /^seccion-\d+\.json$/.test(x))) {
    const meta = JSON.parse(readFileSync(join(CORPUS, f), "utf8")).meta ?? {};
    if (meta.materia) procedencia.set(meta.materia, meta.procedencia ?? "ingesta");
  }

  // El registro está indexado por FAMILIA y varias familias comparten materia
  // (CP y CPODIO, por ejemplo). Se agrupa por materia, que es como se nombran
  // las carpetas de `datos/fuentes/`.
  const porMateria = new Map();
  for (const [fam, e] of Object.entries(registro)) {
    if (fam.startsWith("_") || !e.materia) continue;
    if (!porMateria.has(e.materia))
      porMateria.set(e.materia, { materia: e.materia, norma: e.norma ?? "", familias: [] });
    porMateria.get(e.materia).familias.push(fam);
  }

  return [...porMateria.values()]
    .map((m) => {
      const dir = join(FUENTES, m.materia);
      const carpeta = existsSync(dir);
      const ficheros = carpeta ? readdirSync(dir) : [];
      const documentos = ficheros.filter((f) => !ES_FICHA(f));
      return {
        ...m,
        familias: m.familias.sort(),
        carpeta,
        ficha: ficheros.includes("PROCEDENCIA.md"),
        documentos,
        bytes: documentos.reduce((n, f) => n + statSync(join(dir, f)).size, 0),
        procedencia: procedencia.get(m.materia) ?? null,
      };
    })
    .sort((a, b) => a.materia.localeCompare(b.materia));
}

if (esEjecucionDirecta(import.meta.url)) {
  const inv = inventarioDeFuentes();
  const conDoc = inv.filter((m) => m.documentos.length);
  const soloFicha = inv.filter((m) => !m.documentos.length && m.ficha);
  const nada = inv.filter((m) => !m.documentos.length && !m.ficha);
  const circular = inv.filter((m) => m.procedencia === "lote");

  console.log("=== ¿ESTÁ EL DOCUMENTO ORIGINAL EN EL REPO? ===");
  console.log(`  materias del registro          : ${inv.length}`);
  console.log(`  con documento versionado       : ${conDoc.length}`);
  console.log(`  solo con PROCEDENCIA.md        : ${soloFicha.length}   (consta que falta, que es lo mínimo)`);
  console.log(`  sin nada                       : ${nada.length}`);
  console.log(`  corpus reconstruido del lote   : ${circular.length}   ← re-cotejar contra él no demuestra nada`);

  if (conDoc.length) {
    console.log("\n  ya versionadas:");
    for (const m of conDoc)
      console.log(`   ✓ ${m.materia} — ${m.documentos.join(", ")} (${(m.bytes / 1024 / 1024).toFixed(2)} MB)`);
  }

  // Primero las que además tienen el corpus circular: son las que más duelen,
  // porque ahí la ausencia del documento no solo impide re-verificar, es que
  // hace pasar por verificado algo que no lo está.
  const pendientes = [...nada, ...soloFicha].sort(
    (a, b) => (b.procedencia === "lote") - (a.procedencia === "lote") || a.materia.localeCompare(b.materia),
  );
  console.log("\n  pendientes (× = corpus circular, · = corpus de ingesta real):");
  for (const m of pendientes)
    console.log(`   ${m.procedencia === "lote" ? "×" : "·"} ${m.materia}${m.ficha ? " [tiene ficha]" : ""} — ${m.norma.slice(0, 72)}`);

  console.log(
    "\n  Cómo se salda una: conseguir el documento, guardarlo en " +
      "datos/fuentes/<materia>/ con su PROCEDENCIA.md, reingerir el corpus y comparar\n" +
      "  el texto nuevo con el que había. Las diferencias que salgan son el hallazgo.",
  );
  process.exit(0);
}
