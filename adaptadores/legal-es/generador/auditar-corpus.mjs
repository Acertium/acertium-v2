// Acertium — adaptador legal-es / generador / AUDITORÍA DE GROUNDING
//
//   node adaptadores/legal-es/generador/auditar-corpus.mjs
//
// Contrasta cada lote versionado contra el TEXTO DEL CORPUS (`datos/legal-es/
// <norma>/*-articulos.json`), que es la ingesta mecánica del PDF del Código-600.
//
// POR QUÉ NO BASTA `verificar-lote`: esa puerta compara el `cotejo` contra el
// bloque `fuentes` DEL PROPIO LOTE, así que solo prueba coherencia interna —
// si el `fuentes` se transcribió mal, el cotejo "cuadra" con un texto que no es
// el de la norma. Y su normalización (`normalizarNumeros`) tokeniza con
// /\d+|[a-zñ]+/, es decir DESCARTA LA PUNTUACIÓN: una cita truncada en una coma
// y cerrada con punto le resulta indistinguible de la cita completa.
// Esta auditoría cierra las dos cosas, conservando la puntuación.
//
// Busca cuatro cosas:
//   (A) TRUNCADAS  — el cotejo no aparece literalmente en el artículo que dice
//       citar, normalmente porque corta una cláusula que matiza la regla.
//   (B) CONTAMINACIÓN bis/ter — el cotejo sí existe, pero en un artículo con
//       sufijo (31 bis, 557 ter…) y no en el que se le atribuye. Es la firma del
//       fallo del ingestor corregido el 16/08/2026.
//   (C) ELISIÓN — un bloque `fuentes` con una frase que NO existe en la norma
//       porque se unió texto saltándose una cláusula intermedia sin marcarlo:
//       "…a la persona titular de la Dirección General existirá un Gabinete
//       Técnico" cuando la norma dice "…Dirección General, PARA FACILITARLE EL
//       DESPACHO Y LA COORDINACIÓN…, existirá un Gabinete Técnico". No hay texto
//       inventado —de ahí que no se llame fabricación—, pero el resultado parece
//       literal y no lo es. Un recorte NO contiguo entre frases (apartado 1 +
//       apartado 3) sí es legítimo y no cuenta.
//   (D) REFORMULADAS — el cotejo no es literal ni respecto del `fuentes` de su
//       PROPIO lote: recorta a mitad de frase o recapitaliza. No necesita corpus,
//       así que ESTA comprobación cubre el banco ENTERO, también las familias de
//       fuente no-BOE. Es la única de las cuatro que no depende de tener el PDF.
//
// Cobertura: (A)(B)(C) solo alcanzan a las familias con corpus en `datos/`; las
// demás se informan como NO AUDITABLES — que no salgan en los fallos no
// significa que estén bien, significa que no se miraron. (D) alcanza a todas.
import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { normalizarNumeros } from "../../../nucleo/verificador-cotejo.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const LOTES = join(RAIZ, "adaptadores/legal-es/generador/lotes");

// familia → sección del Código 600 en `datos/legal-es/boe-600-pn/corpus/`.
// Esa carpeta es la copia del Código que consulta cualquier agente sin abrir un
// PDF; se va llenando según se ingieren los trozos (ver ingestor.py --codigo).
const SECCION = {
  CC: 2, // Código Civil [parcial]
  CE: 3, // Constitución Española
  TC: 4, // LO 2/1979, Tribunal Constitucional
  DP: 5, // LO 3/1981, Defensor del Pueblo
  EAES: 6, // LO 4/1981, estados de alarma, excepción y sitio
  FE: 7, // LO 9/2021, Fiscalía Europea
  AGE: 8, // Ley 40/2015, Régimen Jurídico del Sector Público [parcial]
  GOB: 9, // Ley 50/1997, del Gobierno
  EBEP: 10, // RDLeg 5/2015, Estatuto Básico del Empleado Público [parcial]
  MININT: 11, // RD 207/2024, estructura orgánica del Ministerio del Interior
  DGP: 12, // Orden INT/859/2023, Dirección General de la Policía
  PPN: 13, // LO 9/2015, Régimen de Personal de la Policía Nacional [parcial]
  DISC: 14, // LO 4/2010, Régimen disciplinario — gana al corpus suelto de abajo
  SEL: 15, // RD 853/2022, procesos selectivos
  DPSF: 16, // Orden INT/632/2024, desarrollo de los procesos selectivos
};

// Corpus antiguos, ingeridos uno a uno antes de tener el Código entero. Se
// mantienen hasta que su sección entre por la vía de arriba.
const CORPUS = {
  CP: "lo-10-1995-codigo-penal/cp-articulos.json",
  LEC: "rd-1882-ley-enjuiciamiento-criminal/lecrim-articulos.json",
  PRL: "ley-31-1995-prevencion-riesgos-laborales/prl-articulos.json",
  DISC: "lo-4-2010-disciplinario/lo-4-2010-disciplinario-articulos.json",
  SP: "ley-5-2014-seguridad-privada/ley-5-2014-seguridad-privada-articulos.json",
  VIC: "ley-4-2015-estatuto-victima/ley-4-2015-estatuto-victima-articulos.json",
  SC: "lo-4-2015-seguridad-ciudadana/lo-4-2015-articulos.json",
  FCS: "lo-2-1986-fcse/lo-2-1986-articulos.json",
};

// Normalización CONSERVADORA: unifica comillas/guiones tipográficos y espacios.
// No toca acentos, mayúsculas NI puntuación: el cotejo ha de ser literal.
const norm = (s) =>
  String(s ?? "")
    .replace(/[«»""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

// "art. 31 bis" / "art. 31.2" / "arts. 5 y 6" → "31 bis" / "31"
const SUF = "bis|ter|quater|quáter|quinquies|sexies|septies|octies|nonies|decies";

// Las leyes antiguas numeran en palabra ("Artículo primero"). El ingestor las
// guarda ya como número, así que aquí hay que traducir en el mismo sentido.
const ORDINAL = {
  primero: 1, segundo: 2, tercero: 3, cuarto: 4, quinto: 5, sexto: 6,
  septimo: 7, séptimo: 7, octavo: 8, noveno: 9, decimo: 10, décimo: 10,
  undecimo: 11, undécimo: 11, duodecimo: 12, duodécimo: 12,
};

// Lo que NO es un artículo: disposiciones adicionales, transitorias,
// derogatorias y finales, y los preámbulos. El ingestor corta en ellas
// (`re_stop`), así que no están en el corpus. Devolver null aquí las manda a
// "no auditable" en vez de compararlas contra un artículo que no les toca:
// "D.A. 1ª" NO es el artículo 1.
const RE_NO_ARTICULO = /^\s*(D\.\s*[ATDF]\.|disposici[oó]n|pre[aá]mbulo|anexo)/i;

function refDe(articulo) {
  const s = String(articulo ?? "");
  if (RE_NO_ARTICULO.test(s)) return null;
  const m = s.match(new RegExp(`(\\d+)(?:\\s+(${SUF}))?`, "i"));
  if (m) return m[2] ? `${m[1]} ${m[2].toLowerCase()}` : m[1];
  const p = s.toLowerCase().match(/\b([a-záéíóú]+)\b\s*$/);
  return p && ORDINAL[p[1]] ? String(ORDINAL[p[1]]) : null;
}

const corpus = {};
function cargar(fam, ruta) {
  if (!existsSync(ruta)) return;
  const arts = JSON.parse(readFileSync(ruta, "utf8")).articulos || [];
  if (arts.length) corpus[fam] = new Map(arts.map((a) => [a.ref ?? String(a.numero), a.texto]));
}
for (const [fam, rel] of Object.entries(CORPUS)) cargar(fam, join(RAIZ, "datos/legal-es", rel));
for (const [fam, sec] of Object.entries(SECCION))
  cargar(fam, join(RAIZ, "datos/legal-es/boe-600-pn/corpus", `seccion-${String(sec).padStart(3, "0")}.json`));

const r = {
  ok: 0,
  noAuditable: 0,
  truncadas: [],
  contaminadas: [],
  fabricadas: [],
  reformuladas: [],
  familiasSinCorpus: new Set(),
};

for (const f of readdirSync(LOTES).filter((x) => x.endsWith(".json"))) {
  let lote;
  try {
    lote = JSON.parse(readFileSync(join(LOTES, f), "utf8"));
  } catch {
    continue;
  }

  // (D) — cotejo vs el `fuentes` del PROPIO lote, conservando la puntuación.
  // No necesita corpus: cubre también las familias de fuente no-BOE.
  for (const act of lote.actividades || []) {
    const src = (lote.fuentes || {})[act.articulo];
    if (!src) continue;
    if (!norm(src).includes(norm(act.cotejo)))
      r.reformuladas.push({ lote: f, concepto: act.concepto_id, art: act.articulo });
  }

  // (A) y (B) — un cotejo por actividad
  for (const act of lote.actividades || []) {
    const fam = String(act.concepto_id || "").split("-")[0];
    if (!corpus[fam]) {
      r.noAuditable++;
      r.familiasSinCorpus.add(fam);
      continue;
    }
    const ref = refDe(act.articulo);
    if (!ref) {
      // Disposiciones y demás: el corpus no las trae, así que no se pueden
      // contrastar. No son un fallo — son cobertura que falta.
      r.noAuditable++;
      continue;
    }
    const texto = corpus[fam].get(ref);
    const cotejo = norm(act.cotejo);
    if (texto && norm(texto).includes(cotejo)) {
      r.ok++;
      continue;
    }
    const donde = [...corpus[fam].entries()]
      .filter(([, t]) => norm(t).includes(cotejo))
      .map(([k]) => k);
    const reg = { lote: f, concepto: act.concepto_id, dice: act.articulo, donde };
    // Si el texto vive en un artículo que comparte número base y lleva sufijo,
    // es la contaminación del ingestor, no una cita truncada.
    if (donde.some((d) => ref && d.startsWith(ref + " "))) r.contaminadas.push(reg);
    else r.truncadas.push(reg);
  }

  // (C) — cada bloque `fuentes` troceado en frases; toda frase debe existir
  for (const [art, txt] of Object.entries(lote.fuentes || {})) {
    const fam = ((lote.conceptos || [])[0] || {}).id?.split("-")[0];
    if (!corpus[fam]) continue;
    const ref = refDe(art);
    if (!ref) continue; // disposiciones: no están en el corpus
    const texto = corpus[fam].get(ref);
    if (!texto) continue;
    const T = normalizarNumeros(texto);
    if (T.includes(normalizarNumeros(txt))) continue; // literal contiguo
    const trozos = String(txt)
      .split(/(?<=[.;:])\s+/)
      .filter((s) => s.split(/\s+/).length >= 8);
    const fuera = trozos.filter((s) => !T.includes(normalizarNumeros(s)));
    if (fuera.length) r.fabricadas.push({ lote: f, art, fuera: fuera.length, total: trozos.length });
  }
}

console.log("=== AUDITORÍA DE GROUNDING CONTRA EL CORPUS OFICIAL ===");
console.log(`  cotejos literales OK          : ${r.ok}`);
console.log(`  NO auditables (sin corpus)    : ${r.noAuditable}`);
console.log(`  (A) citas truncadas           : ${r.truncadas.length}`);
console.log(`  (B) contaminación bis/ter     : ${r.contaminadas.length}`);
console.log(`  (C) frases con elisión        : ${r.fabricadas.length}`);
console.log(`  (D) citas reformuladas (TODO el banco, sin corpus): ${r.reformuladas.length}`);
for (const c of r.contaminadas)
  console.log(`   ⚠ [${c.concepto}] dice "${c.dice}" pero su texto está en ${c.donde.join(", ")} — ${c.lote}`);
for (const c of r.truncadas)
  console.log(`   ✗ [${c.concepto}] ${c.lote} · dice "${c.dice}" y la cita no aparece entera en ese artículo`);
for (const c of r.fabricadas)
  console.log(`   ✗ ${c.lote} ${c.art}: ${c.fuera}/${c.total} frases no existen asi en la norma (elision)`);
for (const c of r.reformuladas)
  console.log(`   · [${c.concepto}] ${c.lote} "${c.art}" — la cita no es literal ni en su propio bloque fuentes`);
console.log(`  familias sin corpus con el que contrastar: ${[...r.familiasSinCorpus].sort().join(" ")}`);

// Fail-closed en lo que de verdad rompe el grounding. Las truncadas se informan
// pero no tumban el proceso: no inventan texto, recortan una cláusula.
process.exit(r.contaminadas.length || r.fabricadas.length ? 1 : 0);
