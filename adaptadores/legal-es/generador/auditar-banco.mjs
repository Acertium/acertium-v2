// Acertium — adaptador legal-es / generador / AUDITORÍA DEL BANCO
//
//   node auditar-banco.mjs                      lee el cerebro (necesita .env.local)
//   node auditar-banco.mjs --volcado b.json     lee un volcado, sin credenciales
//   node auditar-banco.mjs --familia FCS        solo una familia
//
// POR QUÉ NO BASTA `auditar-corpus.mjs`
// Esa audita los LOTES contra el corpus, y es la puerta correcta antes de cargar.
// Pero lo que estudia el opositor no son los lotes: es lo que hay en la base. Y
// medido el 22/08/2026, **224 actividades del cerebro no vienen de ningún lote**:
//
//     CE +105 · CP +48 · SC 32 · DISC +23 · FCS 16
//
// SC y FCS no tienen lote siquiera. Las demás son cargas parciales, ampliaciones
// posteriores (las 23 de DISC son de `profundidad/`, que no pasa por `lotes/`) o
// ediciones hechas a mano sobre la base. Ninguna pasada basada en ficheros las ha
// mirado nunca, ni las mirará: para el auditor de lotes sencillamente no existen.
// Son el 6,5 % del banco, y son justo las que menos control han tenido.
//
// LA REGLA DE ESTE INFORME, y no es una formalidad.
// Cuando una puerta se pasa sobre contenido YA ACEPTADO, cada cosa que marca es
// una de dos: una pregunta mala, o UNA PUERTA MALA. Y no se distingue sin leerla.
// El 22/08/2026 se midió sobre el banco una comprobación que parecía sólida
// («ningún distractor puede ser cita literal del cotejo»): 16 marcadas, 16 falsos
// positivos, cero aciertos. Se quitó la puerta, no las preguntas.
//
// Por eso esto **informa y no decide**. No rechaza, no borra, no pasa nada a
// `pendiente_revision`. Si un fallo de puerta se ejecutara automáticamente sobre
// 3.434 preguntas, el daño sería retirar el temario entero del runtime. La salida
// es una lista para leer.

import { readFileSync, writeFileSync } from "fs";
import { auditarLote } from "./auditar-corpus.mjs";
import { verificarCalidad } from "./verificar-calidad.mjs";
import { verificarUnicidad } from "../../../nucleo/verificar-unicidad.mjs";

function argumentos() {
  const a = process.argv.slice(2);
  const val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  return { volcado: val("--volcado"), familia: val("--familia"), salida: val("--salida") };
}

/**
 * El volcado es lo que hay en el cerebro, con la forma mínima que necesita la
 * auditoría. Se deja como fichero a propósito: así una tirada se puede repetir,
 * comparar con la anterior y correr donde no hay credenciales.
 *
 *   [{ concepto_id, articulo, enunciado, opciones, indice_correcto, cotejo }]
 *
 * SQL para generarlo, si se prefiere a mano (una fila, un jsonb: el tope de
 * PostgREST cuenta filas, no bytes):
 *
 *   select jsonb_agg(jsonb_build_object(
 *     'concepto_id', a.concepto_id, 'articulo', cf.articulo,
 *     'enunciado', a.enunciado, 'opciones', a.opciones,
 *     'indice_correcto', (a.respuesta->>'indice')::int, 'cotejo', a.cotejo_fuente))
 *   from acertium_v2.actividad a
 *   left join acertium_v2.concepto_fuente cf on cf.concepto_id = a.concepto_id
 *   where a.estado_verificacion = 'verificado';
 */
async function traerDelCerebro(familia) {
  const { createCerebroClient } = await import("./cliente-cerebro.mjs");
  const db = createCerebroClient();
  let q = db
    .from("actividad")
    .select("concepto_id, enunciado, opciones, respuesta, cotejo_fuente, concepto(concepto_fuente(articulo))")
    .eq("estado_verificacion", "verificado");
  if (familia) q = q.like("concepto_id", `${familia}-%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    concepto_id: r.concepto_id,
    articulo: r.concepto?.concepto_fuente?.[0]?.articulo ?? null,
    enunciado: r.enunciado,
    opciones: r.opciones,
    indice_correcto: r.respuesta?.indice ?? 0,
    cotejo: r.cotejo_fuente,
  }));
}

/** Agrupa por familia y le da a cada grupo la forma de lote que espera `auditarLote`. */
export function porFamilia(actividades) {
  const g = new Map();
  for (const a of actividades) {
    const fam = String(a.concepto_id ?? "").split("-")[0];
    if (!g.has(fam)) g.set(fam, []);
    g.get(fam).push(a);
  }
  return g;
}

export function auditar(actividades) {
  const grupos = porFamilia(actividades);
  const porFam = [];

  for (const [fam, acts] of [...grupos].sort()) {
    // `fuentes: {}` a propósito: aquí no hay bloque de fuentes que auditar —eso
    // es cosa del lote— así que la comprobación (C) de elisión no aplica y las
    // (A)/(B)/(D) van contra el corpus, que es lo que interesa del banco.
    const grounding = auditarLote({ actividades: acts, fuentes: {}, conceptos: [{ id: acts[0].concepto_id }] }, fam);
    const calidad = verificarCalidad({ actividades: acts.map((a) => ({ ...a, tipo: "test" })) });
    porFam.push({ fam, n: acts.length, grounding, calidad });
  }

  // La unicidad es del BANCO ENTERO, no de cada familia: dos preguntas que se
  // contradicen suelen estar en familias distintas (fue el caso de ACOG-056 y
  // CPOL-062, dos reales decretos diferentes con el mismo enunciado).
  const unicidad = verificarUnicidad({ actividades });

  return { total: actividades.length, porFam, unicidad };
}

export function informe(r) {
  const L = [];
  const sum = (k) => r.porFam.reduce((s, f) => s + (f.grounding[k]?.length ?? f.grounding[k] ?? 0), 0);

  L.push("=== AUDITORÍA DEL BANCO ===");
  L.push(`  actividades auditadas          : ${r.total}`);
  L.push(`  cotejos literales OK           : ${sum("ok")}`);
  L.push(`  NO auditables (sin corpus/ref) : ${sum("noAuditable")}   ← no es que estén bien: es que no se han mirado`);
  L.push(`  (A) citas cerradas de más      : ${sum("cerradas")}`);
  L.push(`  (A bis) palabras alteradas     : ${sum("alteradas")}`);
  L.push(`  (B) contaminación bis/ter      : ${sum("contaminadas")}`);
  L.push(`  (D) formato/errata de la fuente: ${sum("formato")}`);
  L.push(`  (E) citas reformuladas         : ${sum("reformuladas")}`);
  L.push(`  contradicciones de enunciado   : ${r.unicidad.rechazos.length}`);
  L.push(`  enunciados duplicados          : ${r.unicidad.avisos.length}`);

  const conSesgo = r.porFam.filter((f) => (f.calidad.rechazos ?? []).length);
  L.push(`  familias con sesgo de longitud : ${conSesgo.length}`);

  L.push("");
  L.push("--- por familia (solo las que tienen algo que mirar) ---");
  for (const f of r.porFam) {
    const g = f.grounding;
    const pega = g.cerradas.length + g.alteradas.length + g.contaminadas.length;
    const dudoso = g.noAuditable + g.formato.length + g.reformuladas.length;
    if (!pega && !dudoso && !(f.calidad.rechazos ?? []).length) continue;
    L.push(
      `  ${f.fam.padEnd(8)} ${String(f.n).padStart(4)} act · ` +
        `bloquea ${pega} · avisa ${g.formato.length + g.reformuladas.length} · sin mirar ${g.noAuditable}` +
        ((f.calidad.rechazos ?? []).length ? ` · calidad: ${f.calidad.rechazos[0].motivo?.slice(0, 60)}` : ""),
    );
    for (const x of [...g.cerradas, ...g.alteradas, ...g.contaminadas].slice(0, 5))
      L.push(`      ✗ [${x.concepto}] "${x.dice}"${x.donde?.length ? ` (el texto está en: ${x.donde.join(", ")})` : ""}`);
  }

  for (const x of r.unicidad.rechazos) L.push(`  ✗ CONTRADICE · ${x.motivo.slice(0, 150)}`);

  L.push("");
  L.push("RECUERDA: cada marca es sospechosa de ser LA PUERTA, no la pregunta.");
  L.push("Léelas antes de tocar nada. Este informe no rechaza ni cambia nada.");
  return L.join("\n");
}

async function main() {
  const { volcado, familia, salida } = argumentos();
  let actividades;
  if (volcado) {
    const d = JSON.parse(readFileSync(volcado, "utf8"));
    actividades = Array.isArray(d) ? d : (d.actividades ?? []);
    if (familia) actividades = actividades.filter((a) => String(a.concepto_id).startsWith(`${familia}-`));
  } else {
    try {
      actividades = await traerDelCerebro(familia);
    } catch (e) {
      console.error(`✗ sin acceso al cerebro (${e.message}).`);
      console.error("  Usa --volcado con el JSON del SQL que hay en la cabecera de este fichero.");
      process.exit(2);
    }
  }

  const txt = informe(auditar(actividades));
  console.log(txt);
  if (salida) { writeFileSync(salida, txt + "\n"); console.log(`\n(informe en ${salida})`); }
}

if (process.argv[1] && process.argv[1].endsWith("auditar-banco.mjs")) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
