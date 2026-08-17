// Acertium — adaptador legal-es / generador / AUDITORÍA DE GROUNDING
//
//   node adaptadores/legal-es/generador/auditar-corpus.mjs            todo el banco
//   node adaptadores/legal-es/generador/auditar-corpus.mjs <lote.json>  un solo lote
//
// También se usa como PUERTA desde `generar.mjs` (importando `auditarLote`), que
// es donde de verdad sirve: las 10 preguntas que hubo que corregir el 16/08 se
// detectaron con el contenido ya servido, y arreglarlo entonces costó un `update`
// en producción. Antes de cargar cuesta cero.
//
// Contrasta cada lote contra el TEXTO DEL CORPUS
// (`datos/legal-es/boe-600-pn/corpus/`), que es la ingesta mecánica del PDF del
// Código 600.
//
// POR QUÉ NO BASTA `verificar-lote`: esa puerta compara el `cotejo` contra el
// bloque `fuentes` DEL PROPIO LOTE, así que solo prueba coherencia interna — si
// el `fuentes` se transcribió mal, el cotejo "cuadra" con un texto que no es el
// de la norma. Y su normalización (`normalizarNumeros`) tokeniza con
// /\d+|[a-zñ]+/, es decir DESCARTA LA PUNTUACIÓN: una cita truncada en una coma
// y cerrada con punto le resulta indistinguible de la cita entera. Esta
// auditoría cierra las dos cosas, conservando la puntuación.
//
// Cinco comprobaciones. Las cuatro primeras necesitan corpus; la (E), no.
//
//   (A) CERRADA — el cotejo deja de ser literal SOLO por el signo con que se
//       cerró: quitándoselo, vuelve a encajar. Es una cita que para a mitad de
//       frase y se disfraza de completa poniendo un punto donde la norma seguía
//       con coma. SP-013 escondía así "así como todo hecho delictivo…" y
//       DISC-026 la condición "siempre que durante aquel tiempo…". BLOQUEA.
//   (B) CONTAMINACIÓN bis/ter — el cotejo existe, pero en un artículo con sufijo
//       (31 bis, 557 ter…) y no en el que se le atribuye. Firma del fallo del
//       ingestor corregido el 16/08/2026. BLOQUEA.
//   (C) ELISIÓN — un `fuentes` con una frase que NO existe en la norma porque se
//       unió texto saltándose una cláusula intermedia sin marcarlo: "…a la
//       persona titular de la Dirección General existirá un Gabinete Técnico"
//       cuando la norma dice "…Dirección General, PARA FACILITARLE EL DESPACHO Y
//       LA COORDINACIÓN…, existirá un Gabinete Técnico". No hay texto inventado
//       —por eso no se llama fabricación—, pero el resultado parece literal y no
//       lo es. Un recorte NO contiguo ENTRE frases (apartado 1 + apartado 3) sí
//       es legítimo y no cuenta. BLOQUEA.
//   (D) FORMATO — no encaja ni quitándole el cierre. No es culpa del lote: o es
//       un artefacto del render (la viñeta que pdftotext deja pegada en
//       "-Policía", el "º" de "artículo 5.º", un guion de fin de línea) o una
//       errata de la propia fuente que el lote corrigió — el BOE escribe "a la
//       Unidades" y "del senado" en minúscula. AVISA, no bloquea: alinear el
//       lote con la errata empeoraría lo que lee el opositor.
//   (E) REFORMULADA — el cotejo no es literal ni respecto del `fuentes` de su
//       PROPIO lote. No necesita corpus, así que alcanza al banco ENTERO,
//       también a las familias de fuente no-BOE. AVISA.
//
// Lo que no tiene corpus se informa como NO AUDITABLE: que algo no salga en los
// fallos no significa que esté bien, significa que no se ha mirado.
import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { normalizarNumeros } from "../../../nucleo/verificador-cotejo.mjs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const LOTES = join(RAIZ, "adaptadores/legal-es/generador/lotes");

// familia → sección del Código 600. Esa carpeta es la copia del Código que
// consulta cualquier agente sin abrir un PDF (ver ingestor.py --codigo).
const SECCION = {
  CC: 2, CE: 3, TC: 4, DP: 5, EAES: 6, FE: 7, AGE: 8, GOB: 9, EBEP: 10,
  MININT: 11, DGP: 12, PPN: 13, DISC: 14, SEL: 15, DPSF: 16, UNI: 17, CDPN: 18,
  FCS: 19, CPOL: 20, PJ: 21, EXT: 22, EXTR: 23, UE: 24, ASI: 25, ASIR: 26,
  APAT: 27, PTEMP: 28, ACOG: 29, SP: 30, SC: 31, IC: 32, ICR: 33,
  // §34 (familia ENC) NO entra: publica la Estrategia Nacional de
  // Ciberseguridad como ANEXO con capítulos, sin un solo artículo que ingerir.
  CP: 35, LOPJ: 36, LEC: 37, HC: 38, MF: 39, VIC: 40, VG: 41, IG: 42,
  LGTBI: 43, PRL: 44, PRLP: 45, PRLAGE: 46, LOPD: 47, LOPD7: 48, RDP: 49,
  ARM: 50, RGV: 51, TRAF: 52, VCD: 53,
  // §54 y §55 NO son secciones del Código 600: son normas que el temario cita por
  // su nombre y que la recopilación no incluye, ingeridas aparte desde su texto
  // consolidado. Ver "Secciones que no vienen del Código 600" en corpus/README.md.
  RSP: 54, DEP: 55,
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

const SUF = "bis|ter|quater|quáter|quinquies|sexies|septies|octies|nonies|decies";

// Las leyes antiguas numeran en palabra ("Artículo primero"); el ingestor las
// guarda ya como número, así que aquí hay que traducir en el mismo sentido.
const ORDINAL = {
  primero: 1, segundo: 2, tercero: 3, cuarto: 4, quinto: 5, sexto: 6,
  septimo: 7, séptimo: 7, octavo: 8, noveno: 9, decimo: 10, décimo: 10,
  undecimo: 11, undécimo: 11, duodecimo: 12, duodécimo: 12,
};

// Lo que NO es un artículo. El ingestor corta en las disposiciones y preámbulos,
// así que no están en el corpus; devolver null las manda a "no auditable" en vez
// de compararlas contra un artículo que no les toca: "D.A. 1ª" NO es el art. 1.
// Se abrevian de muchas formas: "D.A. 1ª", "DA 7ª", "D.F.", "disp. final 3ª".
const RE_NO_ARTICULO = /^\s*(d\.?\s?[atdf]\.?(\s|\d|$)|disp\.|disposici[oó]n|pre[aá]mbulo|anexo)/i;

function refDe(articulo) {
  const s = String(articulo ?? "");
  if (RE_NO_ARTICULO.test(s)) return null;
  // La LETRA final ("art. 588 bis a") solo se admite detrás de un sufijo y como
  // palabra suelta: el `\b` impide que "art. 264 ter del Código" capture la "d"
  // de "del" y acabe buscando un inexistente "264 ter d".
  const m = s.match(new RegExp(`(\\d+)(?:\\s+(${SUF})(?:\\s+([a-z])\\b)?)?`, "i"));
  if (m)
    return m[2]
      ? `${m[1]} ${m[2].toLowerCase()}` + (m[3] ? ` ${m[3].toLowerCase()}` : "")
      : m[1];
  const p = s.toLowerCase().match(/\b([a-záéíóú]+)\b\s*$/);
  return p && ORDINAL[p[1]] ? String(ORDINAL[p[1]]) : null;
}

const corpus = {};
for (const [fam, sec] of Object.entries(SECCION)) {
  const ruta = join(RAIZ, "datos/legal-es/boe-600-pn/corpus", `seccion-${String(sec).padStart(3, "0")}.json`);
  if (!existsSync(ruta)) continue;
  const arts = JSON.parse(readFileSync(ruta, "utf8")).articulos || [];
  if (arts.length) corpus[fam] = new Map(arts.map((a) => [a.ref ?? String(a.numero), a.texto]));
}

export function auditarLote(lote, nombre = "(lote)") {
  const r = {
    ok: 0, noAuditable: 0,
    cerradas: [], alteradas: [], contaminadas: [], elididas: [], formato: [], reformuladas: [],
    familiasSinCorpus: new Set(),
  };

  // (E) — cotejo vs el `fuentes` del PROPIO lote. No necesita corpus.
  for (const act of lote.actividades || []) {
    const src = (lote.fuentes || {})[act.articulo];
    if (src && !norm(src).includes(norm(act.cotejo)))
      r.reformuladas.push({ lote: nombre, concepto: act.concepto_id, art: act.articulo });
  }

  // (A), (B) y (D) — un cotejo por actividad, contra el corpus
  for (const act of lote.actividades || []) {
    const fam = String(act.concepto_id || "").split("-")[0];
    if (!corpus[fam]) {
      r.noAuditable++;
      r.familiasSinCorpus.add(fam);
      continue;
    }
    const ref = refDe(act.articulo);
    if (!ref) { r.noAuditable++; continue; }
    const texto = corpus[fam].get(ref);
    const cotejo = norm(act.cotejo);
    if (texto && norm(texto).includes(cotejo)) { r.ok++; continue; }

    const donde = [...corpus[fam].entries()]
      .filter(([, t]) => norm(t).includes(cotejo))
      .map(([k]) => k);
    const reg = { lote: nombre, concepto: act.concepto_id, dice: act.articulo, donde };

    if (donde.some((d) => d.startsWith(ref + " "))) r.contaminadas.push(reg);
    else if (!texto) r.formato.push(reg);
    // Las palabras están todas, seguidas y en orden: no se alteró ni empalmó
    // nada. Si además vuelve a encajar quitándole el signo de cierre, es una
    // cita truncada disfrazada; si no, es formato de la fuente.
    else if (normalizarNumeros(texto).includes(normalizarNumeros(act.cotejo)))
      (norm(texto).includes(cotejo.replace(/[.;,:]+$/, "")) ? r.cerradas : r.formato).push(reg);
    // Ni siquiera ignorando puntuación y acentos: hay PALABRAS que no están.
    // O se empalmó saltándose algo (MININT-014 unía dos apartados de una lista)
    // o el lote corrigió una errata de la fuente (PJ-020: el BOE dice "a la
    // Unidades" y "Comisión Provincial Coordinación"). Mecánicamente son
    // idénticos, así que bloquea y que lo mire una persona.
    else r.alteradas.push(reg);
  }

  // (C) — cada bloque `fuentes` troceado en frases; toda frase debe existir
  for (const [art, txt] of Object.entries(lote.fuentes || {})) {
    const fam = ((lote.conceptos || [])[0] || {}).id?.split("-")[0];
    if (!corpus[fam]) continue;
    const ref = refDe(art);
    if (!ref) continue;
    const texto = corpus[fam].get(ref);
    if (!texto) continue;
    const T = normalizarNumeros(texto);
    if (T.includes(normalizarNumeros(txt))) continue;
    const trozos = String(txt).split(/(?<=[.;:])\s+/).filter((s) => s.split(/\s+/).length >= 8);
    const fuera = trozos.filter((s) => !T.includes(normalizarNumeros(s)));
    if (fuera.length) r.elididas.push({ lote: nombre, art, fuera: fuera.length, total: trozos.length });
  }

  // Fail-closed solo en lo que es defecto del lote sin lugar a interpretación.
  r.ok_gate = r.cerradas.length === 0 && r.alteradas.length === 0
    && r.contaminadas.length === 0 && r.elididas.length === 0;
  return r;
}

export function informe(r) {
  const l = [];
  l.push(`  cotejos literales OK          : ${r.ok}`);
  l.push(`  NO auditables (sin corpus)    : ${r.noAuditable}`);
  l.push(`  (A) citas cerradas de más     : ${r.cerradas.length}   ← bloquea`);
  l.push(`  (A bis) palabras alteradas    : ${r.alteradas.length}   ← bloquea`);
  l.push(`  (B) contaminación bis/ter     : ${r.contaminadas.length}   ← bloquea`);
  l.push(`  (C) frases con elisión        : ${r.elididas.length}   ← bloquea`);
  l.push(`  (D) formato/errata de la fuente: ${r.formato.length}   (solo aviso)`);
  l.push(`  (E) citas reformuladas        : ${r.reformuladas.length}   (solo aviso)`);
  for (const c of r.contaminadas)
    l.push(`   ✗ (B) [${c.concepto}] dice "${c.dice}" pero su texto está en ${c.donde.join(", ")} — ${c.lote}`);
  for (const c of r.cerradas)
    l.push(`   ✗ (A) [${c.concepto}] ${c.lote} · "${c.dice}": la cita corta antes y cierra con un signo que la norma no tiene`);
  for (const c of r.alteradas)
    l.push(`   ✗ (A bis) [${c.concepto}] ${c.lote} · "${c.dice}": faltan o sobran PALABRAS (empalme, o errata de la fuente que el lote corrigió)`);
  for (const c of r.elididas)
    l.push(`   ✗ (C) ${c.lote} ${c.art}: ${c.fuera}/${c.total} frases no existen así en la norma`);
  for (const c of r.formato)
    l.push(`   · (D) [${c.concepto}] ${c.lote} "${c.dice}"`);
  for (const c of r.reformuladas)
    l.push(`   · (E) [${c.concepto}] ${c.lote} "${c.art}"`);
  return l.join("\n");
}

if (esEjecucionDirecta(import.meta.url)) {
  const soloUno = process.argv[2];
  const ficheros = soloUno
    ? [soloUno]
    : readdirSync(LOTES).filter((x) => x.endsWith(".json")).map((x) => join(LOTES, x));

  const total = {
    ok: 0, noAuditable: 0,
    cerradas: [], alteradas: [], contaminadas: [], elididas: [], formato: [], reformuladas: [],
    familiasSinCorpus: new Set(),
  };
  for (const ruta of ficheros) {
    let lote;
    try { lote = JSON.parse(readFileSync(ruta, "utf8")); } catch { continue; }
    const r = auditarLote(lote, ruta.split("/").pop());
    total.ok += r.ok;
    total.noAuditable += r.noAuditable;
    for (const k of ["cerradas", "alteradas", "contaminadas", "elididas", "formato", "reformuladas"])
      total[k].push(...r[k]);
    for (const f of r.familiasSinCorpus) total.familiasSinCorpus.add(f);
  }
  console.log("=== AUDITORÍA DE GROUNDING CONTRA EL CORPUS OFICIAL ===");
  console.log(informe(total));
  console.log(`  familias sin corpus: ${[...total.familiasSinCorpus].sort().join(" ") || "—"}`);
  process.exit(total.cerradas.length || total.alteradas.length
    || total.contaminadas.length || total.elididas.length ? 1 : 0);
}
