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
// Busca tres cosas:
//   (A) TRUNCADAS  — el cotejo no aparece literalmente en el artículo que dice
//       citar, normalmente porque corta una cláusula que matiza la regla.
//   (B) CONTAMINACIÓN bis/ter — el cotejo sí existe, pero en un artículo con
//       sufijo (31 bis, 557 ter…) y no en el que se le atribuye. Es la firma del
//       fallo del ingestor corregido el 16/08/2026.
//   (C) FABRICACIÓN — un bloque `fuentes` con texto que no está en la norma.
//       Un recorte NO contiguo (apartado 1 + apartado 3) es legítimo y no cuenta.
//
// Cobertura: solo las familias con corpus en `datos/`. Las de fuente no-BOE y
// las normas cuyo JSON no está versionado se informan como NO AUDITABLES; que no
// salgan en los fallos no significa que estén bien, significa que no se miraron.
import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { normalizarNumeros } from "../../../nucleo/verificador-cotejo.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const LOTES = join(RAIZ, "adaptadores/legal-es/generador/lotes");

// familia (primer token del id de concepto) → corpus de esa norma
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
function refDe(articulo) {
  const m = String(articulo ?? "").match(new RegExp(`(\\d+)(?:\\s+(${SUF}))?`, "i"));
  return m ? (m[2] ? `${m[1]} ${m[2].toLowerCase()}` : m[1]) : null;
}

const corpus = {};
for (const [fam, rel] of Object.entries(CORPUS)) {
  const ruta = join(RAIZ, "datos/legal-es", rel);
  if (!existsSync(ruta)) continue;
  const arts = JSON.parse(readFileSync(ruta, "utf8")).articulos || [];
  if (arts.length) corpus[fam] = new Map(arts.map((a) => [a.ref ?? String(a.numero), a.texto]));
}

const r = {
  ok: 0,
  noAuditable: 0,
  truncadas: [],
  contaminadas: [],
  fabricadas: [],
  familiasSinCorpus: new Set(),
};

for (const f of readdirSync(LOTES).filter((x) => x.endsWith(".json"))) {
  let lote;
  try {
    lote = JSON.parse(readFileSync(join(LOTES, f), "utf8"));
  } catch {
    continue;
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
    const texto = ref ? corpus[fam].get(ref) : null;
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
    const texto = ref ? corpus[fam].get(ref) : null;
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
console.log(`  (C) fragmentos fabricados     : ${r.fabricadas.length}`);
for (const c of r.contaminadas)
  console.log(`   ⚠ [${c.concepto}] dice "${c.dice}" pero su texto está en ${c.donde.join(", ")} — ${c.lote}`);
for (const c of r.truncadas)
  console.log(`   ✗ [${c.concepto}] ${c.lote} · dice "${c.dice}" y la cita no aparece entera en ese artículo`);
for (const c of r.fabricadas)
  console.log(`   ✗ ${c.lote} ${c.art}: ${c.fuera}/${c.total} fragmentos no están en la norma`);
console.log(`  familias sin corpus con el que contrastar: ${[...r.familiasSinCorpus].sort().join(" ")}`);

// Fail-closed en lo que de verdad rompe el grounding. Las truncadas se informan
// pero no tumban el proceso: no inventan texto, recortan una cláusula.
process.exit(r.contaminadas.length || r.fabricadas.length ? 1 : 0);
