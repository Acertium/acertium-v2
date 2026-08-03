// Acertium — adaptador legal-es / generador / orquestador
// Pipeline: lote generado (JSON) → verificar-lote (puerta de contenido) →
//           verificar-meta (puerta de metadatos) → SQL de lo válido.
// El SQL sale por stdout; el informe (rechazos/avisos) por stderr.
//
//   node generar.mjs <lote.json> [meta.json] > carga.sql
//
// Barrera 1 (02/08/2026): el META viaja DENTRO del lote (lote.meta). El argv
// <meta.json> queda solo como compatibilidad hacia atrás; si el lote trae meta,
// esa manda. Así es imposible emparejar el meta equivocado (fallo del 02/08).
//
// El <lote.json> lo produce el "motor de generación":
//   · Opción A (hoy): el agente, siguiendo contrato-generacion.md.
//   · Opción B (futuro): un job con la API de Claude. Mismo contrato, misma puerta.

import { readFileSync } from "fs";
import { verificarLote } from "../../../nucleo/verificar-lote.mjs";
import { loteASql } from "./cargar.mjs";
import { verificarMeta, cargarRegistro } from "./verificar-meta.mjs";
import { verificarCalidad } from "./verificar-calidad.mjs";

const lote = JSON.parse(readFileSync(process.argv[2], "utf8"));
const meta =
  lote.meta || (process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : null);

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
  console.error("  → calidad insuficiente: NO se emite SQL. Corrige los distractores/enunciados.");
  process.exit(1);
}

// Puerta de metadatos (barreras 1 y 2) — FAIL-CLOSED: sin meta coherente, no hay SQL
const registro = cargarRegistro();
const vm = verificarMeta(v.conceptosOK, meta, registro);
console.error("== verificación de meta ==");
if (!vm.ok) {
  for (const e of vm.errores) console.error("  ✗ META " + e);
  console.error("  → meta incoherente: NO se emite SQL. Corrige el lote.meta o el registro.");
  process.exit(1);
}
console.error(`  ✓ meta coherente (familia ${vm.familia} → ${meta.materia} · ${meta.referencia_boe})`);

process.stdout.write(loteASql(v, meta));
