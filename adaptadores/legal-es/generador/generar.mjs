// Acertium — adaptador legal-es / generador / orquestador
// Pipeline: lote generado (JSON) → verificar-lote (puerta de contenido) →
//           verificar-calidad → verificar-meta → auditar-corpus (fidelidad a la
//           norma) → CARGA en la base → manifiesto.
//
//   node generar.mjs <lote.json>          carga de verdad (inserta y confirma)
//   node generar.mjs <lote.json> --sql    NO toca la base: emite el SQL por stdout
//
// El informe (rechazos/avisos/conteos) sale por stderr.
//
// Barrera 1 (02/08/2026): el META viaja DENTRO del lote (lote.meta). El argv
// <meta.json> queda solo como compatibilidad hacia atrás; si el lote trae meta,
// esa manda. Así es imposible emparejar el meta equivocado (fallo del 02/08).
//
// Barrera 4 (16/08/2026, PROMPT_014): el manifiesto de cobertura se marca
// DESPUÉS de que la base confirme los insert, nunca al emitir SQL. Antes se
// marcaba ✓ sin que nadie ejecutara el SQL y el índice mentía.
//
// El <lote.json> lo produce el "motor de generación":
//   · Opción A (hoy): el agente, siguiendo contrato-generacion.md.
//   · Opción B (futuro): un job con la API de Claude. Mismo contrato, misma puerta.

import { readFileSync } from "fs";
import { verificarLote } from "../../../nucleo/verificar-lote.mjs";
import { loteASql, cargarLote, marcarCobertura } from "./cargar.mjs";
import { verificarMeta, cargarRegistro, textoDeFuente } from "./verificar-meta.mjs";
import { verificarCalidad } from "./verificar-calidad.mjs";
import { verificarFuente } from "../../../nucleo/verificar-fuente.mjs";
import { auditarLote, informe } from "./auditar-corpus.mjs";
import { createCerebroClient } from "./cliente-cerebro.mjs";

const args = process.argv.slice(2);
const soloSql = args.includes("--sql");
const rutas = args.filter((a) => !a.startsWith("--"));

const lote = JSON.parse(readFileSync(rutas[0], "utf8"));
const meta =
  lote.meta || (rutas[1] ? JSON.parse(readFileSync(rutas[1], "utf8")) : null);

// Puerta de contenido
const v = verificarLote(lote);
console.error("== verificación de lote (contenido) ==");
console.error("  " + v.resumen);
for (const r of v.rechazos)
  console.error(`  ✗ RECHAZO [${r.tipo} ${r.concepto || r.id}] ${r.enunciado || ""} → ${r.motivos.join("; ")}`);
for (const a of v.avisos) console.error(`  · aviso [${a.id}] ${a.aviso}`);

// Puerta de calidad pedagógica (distractores, enunciado, sesgo de longitud) — FAIL-CLOSED
const vc = verificarCalidad(lote);
console.error("== verificación de calidad ==");
console.error("  " + vc.resumen);
if (!vc.ok) {
  for (const r of vc.rechazos) console.error(`  ✗ CALIDAD [${r.concepto}] ${r.motivo}`);
  console.error("  → calidad insuficiente: NO se carga. Corrige los distractores/enunciados.");
  process.exit(1);
}

// Puerta de metadatos (barreras 1 y 2) — FAIL-CLOSED: sin meta coherente, no se carga
const registro = cargarRegistro();
const vm = verificarMeta(v.conceptosOK, meta, registro);
console.error("== verificación de meta ==");
if (!vm.ok) {
  for (const e of vm.errores) console.error("  ✗ META " + e);
  console.error("  → meta incoherente: NO se carga. Corrige el lote.meta o el registro.");
  process.exit(1);
}
const refCorta =
  String(meta.referencia_boe ?? "").trim() ||
  `fuente no-BOE: ${[...new Set(textoDeFuente(meta).match(/(?:www\.)?[a-z0-9-]+\.[a-z.]{2,6}/gi) || [])].slice(0, 4).join(", ") || "sin dominio"}`;
console.error(`  ✓ meta coherente (familia ${vm.familia} → ${meta.materia} · ${refCorta})`);

// Puerta de FUENTE — solo lotes que declaran `tipo_fuente` (adaptadores no-BOE,
// temas 27-41). Un lote BOE no la ejecuta: su grounding ya lo cubre
// verificar-lote. FAIL-CLOSED. Ver docs/contrato-fuentes-no-boe.md §3.
if (meta.tipo_fuente) {
  const vf = verificarFuente(lote);
  console.error("== verificación de fuente ==");
  console.error("  " + vf.resumen);
  for (const a of vf.avisos) console.error(`  · aviso [${a.concepto}] ${a.aviso}`);
  if (!vf.ok) {
    for (const r of vf.rechazos) console.error(`  ✗ FUENTE [${r.concepto}] ${r.motivo}`);
    console.error("  → fuente insuficiente: NO se carga.");
    process.exit(1);
  }
  // En un lote mixto el estado se decide concepto a concepto, así que anunciar
  // un único destino sería falso: el desglose real lo imprime la carga.
  if (vf.mixto)
    console.error(
      "  ⚠ lote MIXTO: cada concepto entra según su propio tipo_fuente.\n" +
        "    Lo de consenso NO se servirá hasta promoverlo (/admin o revision-pendientes.mjs).",
    );
  else if (vf.estadoDestino !== "verificado")
    console.error(
      `  ⚠ este lote se cargará como ${vf.estadoDestino}: NO se servirá a nadie hasta que se promueva\n` +
        "    (adaptadores/legal-es/generador/revision-pendientes.mjs)",
    );
}

// Puerta de ORTOGRAFÍA — solo familia ORTO (Tema 37). El resto de familias no
// la pasan porque el cotejo normal ya les sirve; ver nucleo/verificar-ortografia.mjs.
// FAIL-CLOSED como las demás.
if (vm.familia === "ORTO") {
  const { verificarOrtografia } = await import("../../../nucleo/verificar-ortografia.mjs");
  const vo = await verificarOrtografia(lote);
  console.error("== verificación de ortografía ==");
  console.error("  " + vo.resumen);
  for (const a of vo.avisos) console.error(`  · aviso [${a.concepto}] ${a.aviso}`);
  if (!vo.ok) {
    for (const r of vo.rechazos) console.error(`  ✗ ORTOGRAFÍA [${r.concepto}] (${r.modo}) ${r.motivo}`);
    console.error("  → ortografía insuficiente: NO se carga.");
    process.exit(1);
  }
}

// Puerta de CORPUS — contrasta los cotejos contra el texto del Código 600
// (`datos/legal-es/boe-600-pn/corpus/`), no contra el `fuentes` del propio lote.
// FAIL-CLOSED. Solo alcanza a las familias con corpus; el resto pasa de largo y
// se informa como no auditable.
//
// Es la puerta que faltaba, y se añadió el 16/08/2026 después de tener que
// corregir DIEZ preguntas YA SERVIDAS: citas cortadas a mitad de cláusula y
// cerradas con un punto que la norma no tiene (SP-013 escondía así "así como
// todo hecho delictivo…", DISC-026 la condición "siempre que durante aquel
// tiempo…"), y empalmes que se saltaban un apartado entero sin marcarlo
// (CDPN-010 unía el a) con el c)). `verificar-lote` no puede verlo: compara el
// cotejo contra el `fuentes` DEL LOTE —si ese bloque se transcribió mal, todo
// cuadra— y además su normalización descarta la puntuación, que es justo donde
// vive el defecto. Aquí eso ya no entra.
const vc2 = auditarLote(lote, rutas[0].split("/").pop());
console.error("== verificación contra el corpus ==");
console.error("  " + informe(vc2).split("\n").join("\n  "));
if (!vc2.ok_gate) {
  console.error("  → el cotejo no es fiel a la norma: NO se carga. Copia el texto del corpus,");
  console.error("    no lo transcribas; y si de verdad la fuente tiene una errata, dilo en el parte.");
  process.exit(1);
}

// Modo inspección: emite el SQL y no toca ni la base ni el índice.
if (soloSql) {
  process.stdout.write(loteASql(v, meta, registro));
  console.error("== modo --sql: NO se ha cargado nada ni se ha marcado el índice ==");
  process.exit(0);
}

// CARGA — inserta y confirma releyendo la base.
const db = createCerebroClient();
const res = await cargarLote(db, v, meta, registro);
console.error("== carga en acertium_v2 ==");
console.error(
  `  insertado ahora: ${res.insertado.concepto} conceptos · ${res.insertado.concepto_fuente} fuentes · ` +
    `${res.insertado.overlay_entrada} overlay · ${res.insertado.actividad} actividades · ${res.insertado.relacion_concepto} relaciones`,
);
if (res.enBase)
  console.error(
    `  confirmado en base: ${res.enBase.concepto} conceptos · ${res.enBase.concepto_fuente} fuentes · ` +
      `${res.enBase.overlay_entrada} overlay · ${res.enBase.actividad} actividades`,
  );
if (res.porEstado) {
  const fmt = (o) =>
    Object.entries(o)
      .map(([k, n]) => `${n} ${k}`)
      .join(" · ");
  console.error(`  por estado: conceptos ${fmt(res.porEstado.conceptos)} | actividades ${fmt(res.porEstado.actividades)}`);
}
if (res.noResueltas?.length)
  console.error(
    `  · ${res.noResueltas.length} relaciones sin resolver (destino aún no en base): ` +
      res.noResueltas.map((r) => `${r.origen}→${r.destino}`).join(", "),
  );
for (const e of res.errores) console.error("  ✗ CARGA " + e);

if (!res.ok) {
  console.error("  → carga NO confirmada: el índice NO se marca. Revisa los errores.");
  process.exit(1);
}

// Manifiesto de cobertura: SOLO tras confirmación. Ver marcarCobertura() en
// cargar.mjs. Informativo: si falla, no invalida una carga ya confirmada.
const cob = marcarCobertura(meta, vm.familia);
console.error("== manifiesto de cobertura ==");
console.error(
  cob.ok
    ? `  ✓ 00-indice.md · §${cob.norma} (${meta.referencia_boe}) marcada ✓ ${cob.fecha}\n  ${cob.resumen}`
    : `  · sin marcar (${cob.motivo})`,
);
