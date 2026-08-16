// Acertium — adaptador legal-es / generador / enlaces cruzados curados
//
// Las aristas INTRA-lote las trae el propio lote y las inserta `cargar.mjs`.
// Este script inserta las aristas ENTRE familias que Cowork especifica en los
// PROMPT_002…010 §"Enlaces cruzados" — la parte de "red neuronal" que teje el
// grafo entre normas distintas.
//
//   node enlaces-cruzados.mjs           informe, sin escribir
//   node enlaces-cruzados.mjs --aplicar inserta lo que resuelve
//
// Tres destinos posibles para cada arista declarada:
//   · destino = id concreto y EXISTE      → `relacion_concepto`
//   · destino = norma + artículo NO cargado → `remision_pendiente` (se resolverá
//     sola cuando ese artículo entre en el cerebro; ver docs/004)
//   · destino ambiguo o sin especificar    → NO se inventa: sale en el informe
//     como pendiente de que Cowork concrete el id. Es la regla del RESULTADO_001.

import { createCerebroClient } from "./cliente-cerebro.mjs";

const FUENTE = "curada · enlace cruzado PROMPT_002-010";

// --- Aristas con id concreto en los dos extremos ----------------------------
// [origen, destino, tipo, encargo]
const ARISTAS = [
  // PROMPT_002 · PRLP → PRL (Ley 31/1995). "desarrolla salvo indicación".
  ["PRLP-001", "PRL-003", "desarrolla", "002"],
  ["PRLP-001", "PRL-001", "desarrolla", "002"],
  ["PRLP-004", "PRL-011", "desarrolla", "002"],
  ["PRLP-006", "PRL-013", "desarrolla", "002"],
  ["PRLP-007", "PRL-013", "limita", "002"],
  ["PRLP-008", "PRL-014", "desarrolla", "002"],
  ["PRLP-009", "PRL-015", "desarrolla", "002"],
  ["PRLP-010", "PRL-016", "desarrolla", "002"],
  ["PRLP-014", "PRL-017", "desarrolla", "002"],
  ["PRLP-017", "PRL-018", "desarrolla", "002"],
  ["PRLP-019", "PRL-019", "desarrolla", "002"],
  ["PRLP-021", "PRL-022", "desarrolla", "002"],
  ["PRLP-027", "PRL-024", "desarrolla", "002"],
  ["PRLP-028", "PRL-024", "desarrolla", "002"],
  ["PRLP-030", "PRL-028", "desarrolla", "002"],
  ["PRLP-036", "PRL-030", "desarrolla", "002"],
  ["PRLP-038", "PRL-031", "remite", "002"],
  ["PRLP-041", "PRL-027", "desarrolla", "002"],
  // PROMPT_002 · PRLAGE → PRL
  ["PRLAGE-001", "PRL-001", "desarrolla", "002"],
  ["PRLAGE-003", "PRL-003", "remite", "002"],
  ["PRLAGE-005", "PRL-015", "desarrolla", "002"],
  ["PRLAGE-006", "PRL-015", "desarrolla", "002"],
  ["PRLAGE-009", "PRL-029", "desarrolla", "002"],
  ["PRLAGE-010", "PRL-032", "desarrolla", "002"],
  ["PRLAGE-011", "PRL-030", "desarrolla", "002"],
  ["PRLAGE-013", "PRL-030", "desarrolla", "002"],
  ["PRLAGE-015", "PRL-031", "desarrolla", "002"],
  ["PRLAGE-017", "PRL-025", "desarrolla", "002"],
  // PROMPT_002 · RDP → DP (vienen en el lote; se reafirman para verificar que resuelven)
  ["RDP-001", "DP-001", "desarrolla", "002"],
  ["RDP-002", "DP-013", "desarrolla", "002"],
  ["RDP-003", "DP-013", "desarrolla", "002"],
  ["RDP-004", "DP-005", "desarrolla", "002"],

  // PROMPT_003 · CDPN → SEL
  ["CDPN-025", "SEL-015", "desarrolla", "003"],
  ["CDPN-025", "SEL-016", "desarrolla", "003"],
  // PROMPT_003 · PJ → CE art. 126 (Policía Judicial en la Constitución)
  ["PJ-006", "CE-T6-018", "desarrolla", "003"],
  ["PJ-011", "CE-T6-018", "desarrolla", "003"],
  // PROMPT_003 · PJ → LECrim art. 283 (quiénes componen la Policía Judicial)
  ["PJ-001", "LEC-020", "desarrolla", "003"],

  // PROMPT_004 · EXTR → EXT (el reglamento desarrolla la LO 4/2000)
  ["EXTR-017", "EXT-027", "desarrolla", "004"],
  ["EXTR-028", "EXT-001", "desarrolla", "004"],
  ["EXTR-033", "EXT-020", "desarrolla", "004"],
  ["EXTR-034", "EXT-021", "desarrolla", "004"],
  ["EXTR-036", "EXT-029", "desarrolla", "004"],
  ["EXTR-041", "EXT-022", "desarrolla", "004"],
  ["EXTR-042", "EXT-025", "desarrolla", "004"],
  ["EXTR-042", "EXT-026", "desarrolla", "004"],
  ["EXTR-043", "EXT-030", "desarrolla", "004"],
  ["EXTR-032", "EXT-012", "desarrolla", "004"],
  // PROMPT_004 · ENC → IC
  ["ENC-021", "IC-006", "remite", "004"],
  ["ENC-009", "IC-006", "remite", "004"],
  // PROMPT_004 · RGV → TRAF. El encargo no fija tipo: son dos reglamentos
  // hermanos (vehículos y circulación), así que `remite`, que es el tipo
  // objetivo de "el texto de A cita a B" (docs/004).
  ["RGV-003", "TRAF-008", "remite", "004"],
  ["RGV-015", "TRAF-008", "remite", "004"],
  ["RGV-001", "TRAF-006", "remite", "004"],
  ["RGV-004", "TRAF-002", "remite", "004"],
  ["RGV-021", "TRAF-008", "remite", "004"],
  // PROMPT_004 · DPSF → SEL. `desarrolla`: la Orden INT/632/2024 es literalmente
  // la norma de desarrollo del RD 853/2022.
  ["DPSF-001", "SEL-001", "desarrolla", "004"],
  ["DPSF-008", "SEL-009", "desarrolla", "004"],
  ["DPSF-018", "SEL-009", "desarrolla", "004"],
  ["DPSF-016", "SEL-010", "desarrolla", "004"],
  ["DPSF-026", "SEL-011", "desarrolla", "004"],
  ["DPSF-034", "SEL-018", "desarrolla", "004"],
  ["DPSF-035", "SEL-018", "desarrolla", "004"],
  ["DPSF-039", "SEL-018", "desarrolla", "004"],
  ["DPSF-041", "SEL-026", "desarrolla", "004"],

  // PROMPT_006 · cierre de EXTR
  ["EXTR-283", "EXT-003", "remite", "006"],
  ["EXTR-305", "EXT-004", "remite", "006"],
  ["EXTR-328", "EXTR-027", "remite", "006"],
  ["EXTR-342", "EXTR-026", "remite", "006"],
  ["EXTR-354", "EXTR-026", "remite", "006"],
  ["EXTR-353", "EXT-024", "remite", "006"],
  ["EXT-004", "EXTR-363", "remite", "006"],

  // PROMPT_007 · antitortura ↔ Defensor del Pueblo
  ["TORT-023", "DP-001", "desarrolla", "007"],
  ["TORT-025", "DP-013", "remite", "007"],
  ["RDP-001", "TORT-024", "desarrolla", "007"],

  // PROMPT_008 · CEDH ↔ TORT/DUDH · INTEL → ENC
  ["CEDH-003", "TORT-001", "remite", "008"],
  ["CEDH-003", "DUDH-006", "remite", "008"],
  ["CEDH-006", "DUDH-010", "remite", "008"],
  ["CEDH-010", "DUDH-013", "remite", "008"],
  ["CEDH-016", "DUDH-009", "remite", "008"],
  ["INTEL-011", "ENC-013", "remite", "008"],
  ["INTEL-007", "ENC-009", "remite", "008"],

  // PROMPT_010 · técnicos
  ["REDES-015", "CIBER-005", "limita", "010"],
  ["CIBER-009", "REDES-017", "remite", "010"],
  ["GRAM-007", "ORTO-010", "remite", "010"],
  ["GRAM-033", "ORTO-012", "remite", "010"],
  ["SO-006", "REDES-022", "remite", "010"],
  ["SO-001", "REDES-001", "remite", "010"],
];

// --- Remisiones a artículos que AÚN NO están en el cerebro -------------------
// El encargo da norma + artículo pero ese artículo no está segmentado todavía.
// [origen, norma_destino, articulo_destino, tipo, encargo]
const REMISIONES = [
  // PROMPT_002 · FE → Código Penal (delitos que son competencia de la Fiscalía Europea)
  ["FE-006", "Ley Orgánica 10/1995, del Código Penal", "art. 305", "desarrolla", "002"],
  ["FE-006", "Ley Orgánica 10/1995, del Código Penal", "art. 305 bis", "desarrolla", "002"],
  ["FE-006", "Ley Orgánica 10/1995, del Código Penal", "art. 306", "desarrolla", "002"],
  ["FE-007", "Ley Orgánica 10/1995, del Código Penal", "art. 308", "desarrolla", "002"],
  ["FE-007", "Ley Orgánica 10/1995, del Código Penal", "art. 570 bis", "desarrolla", "002"],
  // PROMPT_003 · PJ → artículos no cargados
  ["PJ-007", "Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad", "art. 30", "remite", "003"],
  ["PJ-011", "Ley Orgánica 6/1985, del Poder Judicial", "arts. 443-446", "remite", "003"],
  ["PJ-020", "Ley Orgánica 6/1985, del Poder Judicial", "art. 549", "remite", "003"],
  ["PJ-004", "Real Decreto de 14 de septiembre de 1882, Ley de Enjuiciamiento Criminal", "art. 288", "remite", "003"],
  // PROMPT_003 · CPOL → FCS art. 26 (concepto de Consejo de Policía), no cargado
  ["CPOL-001", "Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad", "art. 26", "desarrolla", "003"],
];

// --- Declaradas por Cowork SIN id ni artículo concreto ----------------------
// No se inventan destinos (regla fijada en RESULTADO_001 §1). Se listan para que
// el próximo encargo las concrete.
const SIN_CONCRETAR = [
  ["002", "PRLAGE-004 → PRLP-* (remite, peculiaridades PN): falta el id de destino"],
  ["002", "PRLAGE-002 → AGE-* (ámbito): falta el id de destino"],
  ["002", "FE-003 y FE-029 → LECrim (remite): falta el artículo"],
  ["002", "FE-013 → LOPJ (Audiencia Nacional/TS): falta el artículo"],
  ["002", "FE-010/016/022/023 → MF (Ministerio Fiscal/FGE): falta el artículo o el id"],
  ["003", "UNI-042…050 → PPN (divisas por escala/categoría): falta el id de destino"],
  ["003", "UNI-011 → SEL (remite): falta el id"],
  ["003", "UNI-025/026 → DGP (desarrolla): falta el id"],
  ["003", "CDPN-032/041 → SEL (remite): falta el id"],
  ["003", "CDPN-020 → PPN (remite): falta el id"],
  ["003", "CDPN-040/041 → DISC (remite): falta el id"],
  ["003", "CDPN-018/037 → AGE (remite): falta el id"],
  ["003", "CPOL-055 → LOPJ (recurso contencioso): falta el artículo"],
  ["003", "PJ-008 → FCS art. 5: el artículo 5 está partido en 8 conceptos (FCS-005-1, -arm, -cop, -ded, -det, -ob, -resp, -sec); hace falta decir cuál"],
  ["003", "PJ-021/033 → MF: falta el artículo o el id"],
  ["004", "VCD → FCS y VCD → TRAF (propuestos): faltan los ids"],
  ["004", "DPSF → PPN (arts. 16.3/19/29 LO 9/2015): faltan los ids de PPN"],
  ["005", "EXTR → EXT por descripción (reagrupación arts. 16-19; arraigo 31.3; VG 31 bis; trata 59/59 bis; trabajo/estudios 52/53/54): el encargo remite a los RESULTADOS de los generadores, que no están en el repo"],
  ["008", "CEDH → CE arts. 15/24 (tentativo): CE-T2-015 y CE-T2-024 no existen; el Título I de la CE no está cargado con esos ids"],
  ["008", "INTEL ↔ CIBER: sin pares concretos"],
  ["008", "CIBER → CP (delitos informáticos) / LOPD: sin artículos"],
];

const aplicar = process.argv.includes("--aplicar");
const db = createCerebroClient();

// ¿Qué conceptos de los citados existen?
const ids = [
  ...new Set([
    ...ARISTAS.flatMap(([o, d]) => [o, d]),
    ...REMISIONES.map(([o]) => o), // los orígenes de las remisiones también deben existir
  ]),
];
const presentes = new Set();
for (let i = 0; i < ids.length; i += 100) {
  const { data, error } = await db.from("concepto").select("id").in("id", ids.slice(i, i + 100));
  if (error) throw error;
  for (const r of data) presentes.add(r.id);
}

const resueltas = [];
const rotas = [];
for (const [o, d, tipo, enc] of ARISTAS) {
  if (presentes.has(o) && presentes.has(d)) resueltas.push({ origen: o, destino: d, tipo, fuente: FUENTE });
  else rotas.push({ o, d, tipo, enc, falta: [!presentes.has(o) && o, !presentes.has(d) && d].filter(Boolean) });
}

console.log(`== enlaces cruzados PROMPT_002-010 ==`);
console.log(`  declaradas con id: ${ARISTAS.length} · resuelven: ${resueltas.length} · con extremo inexistente: ${rotas.length}`);
for (const r of rotas) console.log(`   ✗ [${r.enc}] ${r.o}→${r.d} (${r.tipo}) — no existe: ${r.falta.join(", ")}`);
console.log(`  remisiones a artículos no cargados: ${REMISIONES.length}`);
console.log(`  declaradas sin id/artículo concreto (NO se inventan): ${SIN_CONCRETAR.length}`);
for (const [enc, txt] of SIN_CONCRETAR) console.log(`   · [${enc}] ${txt}`);

if (!aplicar) {
  console.log("\n(informe. Ejecuta con --aplicar para insertar)");
  process.exit(0);
}

let nuevas = 0;
for (let i = 0; i < resueltas.length; i += 100) {
  const { data, error } = await db
    .from("relacion_concepto")
    .upsert(resueltas.slice(i, i + 100), { onConflict: "origen,destino,tipo", ignoreDuplicates: true })
    .select("origen");
  if (error) throw error;
  nuevas += data.length;
}

// `remision_pendiente` no tiene clave única (ni PK), así que no hay ON CONFLICT
// que valga: se deduplica leyendo lo que ya hay antes de insertar.
const candidatas = REMISIONES.filter(([o]) => presentes.has(o)).map(
  ([origen, norma_destino, articulo_destino, tipo]) => ({ origen, norma_destino, articulo_destino, tipo }),
);
const { data: yaHay, error: eRem } = await db
  .from("remision_pendiente")
  .select("origen,norma_destino,articulo_destino,tipo")
  .in("origen", [...new Set(candidatas.map((r) => r.origen))]);
if (eRem) throw eRem;
const clave = (r) => `${r.origen}|${r.norma_destino}|${r.articulo_destino}|${r.tipo}`;
const vistas = new Set((yaHay || []).map(clave));
const filasRem = candidatas.filter((r) => !vistas.has(clave(r)));
let nuevasRem = 0;
if (filasRem.length) {
  const { data, error } = await db.from("remision_pendiente").insert(filasRem).select("origen");
  if (error) throw error;
  nuevasRem = data.length;
}

console.log(`\n  ✓ insertadas ${nuevas} aristas nuevas (${resueltas.length - nuevas} ya estaban)`);
console.log(`  ✓ insertadas ${nuevasRem} remisiones pendientes de ${filasRem.length}`);
