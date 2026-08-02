// Acertium — adaptador legal-es / generador / orquestador
// Pipeline: lote generado (JSON) → verificar-lote (puerta) → SQL de lo válido.
// El SQL sale por stdout; el informe (rechazos/avisos) por stderr.
//
//   node generar.mjs <lote.json> <meta.json> > carga.sql
//
// El <lote.json> lo produce el "motor de generación":
//   · Opción A (hoy): el agente, siguiendo contrato-generacion.md.
//   · Opción B (futuro): un job con la API de Claude. Mismo contrato, misma puerta.

import { readFileSync } from "fs";
import { verificarLote } from "../../../nucleo/verificar-lote.mjs";
import { loteASql } from "./cargar.mjs";

const lote = JSON.parse(readFileSync(process.argv[2], "utf8"));
const meta = JSON.parse(readFileSync(process.argv[3], "utf8"));

const v = verificarLote(lote);
console.error("== verificación de lote ==");
console.error("  " + v.resumen);
for (const r of v.rechazos)
  console.error(`  ✗ RECHAZO [${r.tipo} ${r.concepto || r.id}] ${r.enunciado || ""} → ${r.motivos.join("; ")}`);
for (const a of v.avisos) console.error(`  · aviso [${a.id}] ${a.aviso}`);

process.stdout.write(loteASql(v, meta));
