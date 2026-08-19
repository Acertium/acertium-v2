// Acertium — adaptador legal-es / INFORME DE COBERTURA POR EPÍGRAFE
//
//   node adaptadores/legal-es/generador/cobertura-epigrafes.mjs            informe completo
//   node adaptadores/legal-es/generador/cobertura-epigrafes.mjs --tema 42  un solo tema
//   node adaptadores/legal-es/generador/cobertura-epigrafes.mjs --json     solo los datos
//
// POR QUÉ EXISTE. Hasta ahora la unidad de "hecho" era el ARTÍCULO de la norma:
// se daba por cubierto un artículo cuando tenía una pregunta. Pero lo que examina
// el tribunal no son artículos, son los EPÍGRAFES del temario, y la medición del
// 19/08/2026 enseñó lo que eso produce: la densidad de conceptos apenas responde
// al contenido del artículo (1,21 conceptos en los de menos de 600 caracteres y
// solo 2,54 en los de más de 3.000, con el 49 % de estos últimos llevando UNA
// sola pregunta). De ahí la sensación de que "siempre falta algo": los huecos no
// se ven porque nadie los está contando contra el temario.
//
// Este informe cuenta contra el temario. Parte cada uno de los 45 temas en sus
// epígrafes tal como los enuncia el BOE y dice cuántos conceptos parecen cubrir
// cada uno. Convierte "siempre falta algo" en una lista con final.
//
// QUÉ NO ES. El emparejamiento epígrafe↔concepto es una HEURÍSTICA léxica: se
// extraen las palabras distintivas del epígrafe y se cuenta qué conceptos del
// mismo tema las comparten en su título o su resumen. Eso produce falsos
// negativos (un concepto que cubre el epígrafe con otro vocabulario) y falsos
// positivos (coincidencia de palabra sin coincidencia de fondo). NO es un
// veredicto: es un triaje que dice DÓNDE MIRAR. Un epígrafe en cero es una
// pregunta para una persona, no una condena.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const TEMARIO = join(RAIZ, "datos/legal-es/boe-600-pn/temario-oficial.md");

// Palabras que aparecen en todos los temas y no distinguen nada.
const VACIAS = new Set([
  "concepto","conceptos","especial","referencia","general","generales","clases","tipos","otros",
  "otras","demas","materia","materias","sobre","entre","segun","entrada","salida","entre","cuanto",
  "entre","respecto","asi","como","para","desde","hasta","cada","donde","ademas","tanto","tambien",
  "espana","espanola","espanol","nacional","nacionales","estado","estados","publica","publico",
  "publicas","publicos","sistema","sistemas","aplicacion","caracteres","principios","principio",
  "esta","este","esto","ello","ella","sus","las","los","una","uno","del","por","con","que","mas",
  "ley","real","tipo","caso","modo","dicho","dicha","segun","tras","ante","bajo","cabe","hacia",
]);

const sinTildes = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Clave de búsqueda: prefijo de 6 letras para las palabras largas, para que
// "prioritario" y "prioritarios" —o "arma" y "armas"— casen igual. Es un
// stemmer de pobre, pero en español acierta lo justo para un triaje.
// Trunca a 6 desde 7 letras, no desde 8: si no, "riesgos" no casa con "riesgo"
// ni "delitos" con "delito", y el plural del enunciado del temario contra el
// singular del título del concepto se pierde sistemáticamente.
const claveDe = (p) => (p.length >= 7 ? p.slice(0, 6) : p);

export function epigrafesDelTemario(texto = readFileSync(TEMARIO, "utf8")) {
  const out = [];
  for (const m of texto.matchAll(/^\*\*Tema (\d+)\.\*\*\s*(.+)$/gm)) {
    const tema = Number(m[1]);
    // El BOE separa los epígrafes con punto; los dos puntos abren una lista que
    // pertenece al mismo epígrafe, así que no cortan.
    // El filtro NO puede exigir dos palabras: el temario tiene epígrafes de una
    // sola («Robo.», «Aborto.», «Lesiones.») y son epígrafes de pleno derecho.
    // Basta con que quede algo alfabético que buscar.
    const trozos = m[2]
      .split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿«])/)
      .map((s) => s.trim())
      .filter((s) => s.replace(/[^A-Za-zÁ-úñÑ]/g, "").length >= 4);
    trozos.forEach((epigrafe, i) => {
      const claves = [
        ...new Set(
          sinTildes(epigrafe)
            .replace(/[^a-z0-9ñ\s]/g, " ")
            .split(/\s+/)
            .filter((p) => p.length >= 4 && !VACIAS.has(p))
            .map(claveDe),
        ),
      ].slice(0, 8);
      if (claves.length) out.push({ tema, idx: i + 1, epigrafe, claves });
    });
  }
  return out;
}

// Umbral: con una sola clave basta que aparezca; con dos o más se exigen DOS.
//
// Probado también "la mitad de las claves" (19/08/2026) y es peor: con epígrafes
// largos exige tres coincidencias y pierde cobertura real —«Prevención de Riesgos
// Laborales en Seguridad Vial» pasaba a cero— y con los de dos palabras se vuelve
// tan laxo que «La Dirección General de la Policía» se lleva 85 de los 257
// conceptos del Tema 8. Esta regla se equivoca sobre todo por DEFECTO: marca
// vacíos algunos epígrafes que sí están cubiertos con otro vocabulario. Es el
// error que preferimos, porque manda mirar de más y no de menos.
export const umbral = (claves) => (claves.length === 1 ? 1 : 2);

export const normaliza = (s) =>
  sinTildes(String(s ?? "")).replace(/\s+/g, " ");

export function cruzar(epigrafes, conceptos) {
  // conceptos: [{ id, tema (número), texto }]
  const porTema = new Map();
  for (const c of conceptos) {
    if (!porTema.has(c.tema)) porTema.set(c.tema, []);
    porTema.get(c.tema).push({ ...c, txt: normaliza(c.texto) });
  }
  const encajaAlguno = new Set();
  const filas = epigrafes.map((e) => {
    const cs = porTema.get(e.tema) ?? [];
    const cubren = cs.filter((c) => {
      const hits = e.claves.filter((k) => c.txt.includes(k)).length;
      if (hits >= umbral(e.claves)) {
        encajaAlguno.add(c.id);
        return true;
      }
      return false;
    });
    return { ...e, cubren: cubren.length };
  });
  // FIABILIDAD. Si en un tema casi ningún concepto encaja con NINGÚN epígrafe, no
  // es que el tema esté vacío: es que su vocabulario no es el del temario (pasa en
  // ORTO, cuyos conceptos hablan de tildes y mayúsculas sin decir "ortografía").
  // Ahí los ceros no significan nada y el informe lo dice en voz alta.
  const fiabilidad = new Map();
  for (const [tema, cs] of porTema) {
    const n = cs.filter((c) => encajaAlguno.has(c.id)).length;
    fiabilidad.set(tema, { conceptos: cs.length, encajan: n, pct: Math.round((100 * n) / cs.length) });
  }
  return { filas, fiabilidad };
}

const FIABLE_MIN = 40; // % de conceptos del tema que encajan en algún epígrafe

export function informeMarkdown({ filas, fiabilidad }, fecha) {
  const L = [];
  const temas = [...new Set(filas.map((f) => f.tema))].sort((a, b) => a - b);
  const vacios = filas.filter((f) => f.cubren === 0);
  const fiables = vacios.filter((f) => (fiabilidad.get(f.tema)?.pct ?? 0) >= FIABLE_MIN);

  L.push("# Cobertura por epígrafe del temario");
  L.push("");
  L.push(`> Generado por \`adaptadores/legal-es/generador/cobertura-epigrafes.mjs\` el ${fecha}.`);
  L.push("> Cuenta el banco contra el **temario oficial** (BOE-A-2026-15055), no contra los");
  L.push("> artículos de las normas. Vuelve a generarlo cuando cargues contenido.");
  L.push("");
  L.push("## Cómo se lee esto, y cómo NO");
  L.push("");
  L.push("El emparejamiento epígrafe↔concepto es una **heurística léxica**: se sacan las");
  L.push("palabras distintivas del epígrafe y se cuenta qué conceptos del mismo tema las");
  L.push("repiten en su título o su resumen. Eso falla en los dos sentidos:");
  L.push("");
  L.push("- **Falso positivo.** «Origen de las armas de fuego» comparte *armas* y *fuego* con");
  L.push("  casi todo el Tema 42, así que sale cubierto sin estarlo.");
  L.push("- **Falso negativo.** Los conceptos de ortografía hablan de tildes y de mayúsculas");
  L.push("  sin decir nunca «ortografía», así que su epígrafe sale en cero estando cubierto.");
  L.push("");
  L.push("Por eso cada tema lleva un **% de encaje**: cuántos de sus conceptos casan con algún");
  L.push(`epígrafe. Por debajo del ${FIABLE_MIN} % el vocabulario del tema no es el del temario y **sus ceros`);
  L.push("no significan nada**. Un cero en un tema fiable sí es una pregunta que hacerse.");
  L.push("");
  L.push("## Resumen");
  L.push("");
  L.push(`- **${filas.length} epígrafes** en ${temas.length} temas.`);
  L.push(`- **${vacios.length}** sin ningún concepto que los cubra.`);
  L.push(`- De esos, **${fiables.length}** están en temas con encaje fiable: esa es la lista corta.`);
  L.push("");
  L.push("### Los epígrafes vacíos en temas fiables");
  L.push("");
  L.push("| Tema | Epígrafe | % encaje del tema |");
  L.push("|---|---|---|");
  for (const f of fiables)
    L.push(`| ${f.tema} | ${f.epigrafe.replace(/\|/g, "\\|")} | ${fiabilidad.get(f.tema).pct} % |`);
  L.push("");
  L.push("## Detalle por tema");
  for (const t of temas) {
    const fi = fiabilidad.get(t) ?? { conceptos: 0, encajan: 0, pct: 0 };
    const aviso = fi.pct < FIABLE_MIN ? " ⚠ **encaje bajo: los ceros de este tema no son concluyentes**" : "";
    L.push("");
    L.push(`### Tema ${t} — ${fi.conceptos} conceptos · ${fi.pct} % de encaje${aviso}`);
    L.push("");
    L.push("| # | Epígrafe | Conceptos |");
    L.push("|---|---|---|");
    for (const f of filas.filter((x) => x.tema === t))
      L.push(`| ${f.idx} | ${f.epigrafe.replace(/\|/g, "\\|")} | ${f.cubren === 0 ? "**0**" : f.cubren} |`);
  }
  L.push("");
  return L.join("\n");
}

if (esEjecucionDirecta(import.meta.url)) {
  const eps = epigrafesDelTemario();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(eps, null, 1));
    process.exit(0);
  }
  const { createCerebroClient } = await import("./cliente-cerebro.mjs");
  const db = createCerebroClient();
  const { data: overlay } = await db
    .from("overlay_entrada")
    .select("concepto_id, tema")
    .eq("convocatoria_id", "policia-nacional-2026");
  const { data: conceptos } = await db.from("concepto").select("id, titulo, resumen");
  const titulo = new Map((conceptos ?? []).map((c) => [c.id, `${c.titulo} ${c.resumen ?? ""}`]));
  const lista = (overlay ?? []).map((o) => ({
    id: o.concepto_id,
    tema: Number(String(o.tema).match(/Tema (\d+)/)?.[1] ?? 0),
    texto: titulo.get(o.concepto_id) ?? "",
  }));
  const cruce = cruzar(eps, lista);
  const salida = join(RAIZ, "docs/cobertura-epigrafes.md");
  writeFileSync(salida, informeMarkdown(cruce, new Date().toISOString().slice(0, 10)), "utf8");
  const vacios = cruce.filas.filter((f) => f.cubren === 0);
  console.error(`${eps.length} epígrafes · ${vacios.length} sin cubrir → ${salida}`);
}
