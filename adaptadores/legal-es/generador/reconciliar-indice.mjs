// Acertium — adaptador legal-es / generador / reconciliador del manifiesto
//
// El índice `datos/legal-es/boe-600-pn/00-indice.md` es el manifiesto de
// cobertura del corpus BOE-600. `marcarCobertura()` lo mantiene fila a fila al
// cargar, pero eso solo vale hacia adelante: si algo se marcó ✓ sin llegar a la
// base (lo que pasó el 16/08 con FE, PRLP, PRLAGE y RDP), el índice miente y él
// solo no se entera.
//
// Este script CONTRASTA el índice con la base:
//   · una fila es ✓ solo si su FAMILIA tiene conceptos en `acertium_v2.concepto`
//   · si está marcada ✓ y la familia tiene 0 filas → vuelve a ⏳ (falso positivo)
//   · si está ⏳ pero la familia sí está cargada → la marca ✓
// Además regenera las secciones "Pendientes (⏳)" y la línea de resumen, que
// `marcarCobertura()` no toca (solo recalcula el resumen).
//
//   node reconciliar-indice.mjs            informe, sin escribir
//   node reconciliar-indice.mjs --aplicar  corrige el fichero

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createCerebroClient } from "./cliente-cerebro.mjs";

const INDICE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../datos/legal-es/boe-600-pn/00-indice.md",
);

const aplicar = process.argv.includes("--aplicar");
const db = createCerebroClient();

// Conteo de conceptos por familia (una consulta, agregada en JS: PostgREST no
// hace group by, y el universo es de pocos miles de ids).
const porFamilia = new Map();
for (let desde = 0; ; desde += 1000) {
  const { data, error } = await db.from("concepto").select("id").range(desde, desde + 999);
  if (error) throw error;
  for (const r of data) {
    const f = String(r.id).split("-")[0];
    porFamilia.set(f, (porFamilia.get(f) || 0) + 1);
  }
  if (data.length < 1000) break;
}

const lineas = readFileSync(INDICE, "utf8").split(/\r?\n/);
const cambios = [];
const filas = [];

for (let i = 0; i < lineas.length; i++) {
  const l = lineas[i];
  if (!/^\|\s*\d+\s*\|/.test(l)) continue;
  const col = l.split("|");
  const num = col[1].trim();
  const norma = col[3].trim();
  const familia = col[5].trim();
  const estado = col[6].trim();
  const cargada = familia && familia !== "—" ? (porFamilia.get(familia) || 0) : 0;
  filas.push({ i, num, norma, familia, estado, cargada });

  const esVisto = estado.startsWith("✓");
  if (esVisto && cargada === 0) {
    col[6] = " ⏳ ";
    lineas[i] = col.join("|");
    cambios.push(`§${num}: ✓ → ⏳ (familia ${familia || "—"} con 0 conceptos en la base)`);
  } else if (!esVisto && !estado.startsWith("⚠") && estado !== "—" && cargada > 0) {
    col[6] = ` ✓ (${cargada} conceptos) `;
    lineas[i] = col.join("|");
    cambios.push(`§${num}: ${estado} → ✓ (familia ${familia}, ${cargada} conceptos en la base)`);
  }
}

// Recuento y secciones derivadas.
const recuenta = () => {
  let normas = 0, extraidas = 0, pendientes = 0;
  const revisar = [], pend = [];
  for (const l of lineas) {
    if (!/^\|\s*\d+\s*\|/.test(l)) continue;
    const col = l.split("|").map((s) => s.trim());
    const estado = col[6] ?? "";
    if (estado.startsWith("✓")) { normas++; extraidas++; }
    else if (estado.startsWith("⏳")) { normas++; pendientes++; pend.push(`§${col[1]} (${col[3]})`); }
    else if (estado.startsWith("⚠")) { normas++; revisar.push("§" + col[1]); }
  }
  return { normas, extraidas, pendientes, revisar, pend };
};
const c = recuenta();

const resumen =
  `Resumen: **${c.extraidas} de ${c.normas} normas extraídas · ${c.pendientes} pendientes` +
  (c.revisar.length ? ` · ${c.revisar.length} a revisar (${c.revisar.join(", ")})` : "") +
  "**.";
const iR = lineas.findIndex((l) => l.startsWith("Resumen:"));
if (iR >= 0 && lineas[iR] !== resumen) {
  cambios.push(`resumen: "${lineas[iR]}" → "${resumen}"`);
  lineas[iR] = resumen;
}

// Sección "Pendientes (⏳)": se reescribe entera desde la tabla.
const iP = lineas.findIndex((l) => l.startsWith("## Pendientes"));
if (iP >= 0) {
  const cabecera = `## Pendientes (⏳) — ${c.pendientes} norma${c.pendientes === 1 ? "" : "s"} por extraer`;
  const cuerpo = c.pend.length ? c.pend.join(" · ") + "." : "Ninguna: el corpus está completo.";
  // el bloque va desde la cabecera hasta la línea en blanco previa al siguiente ##
  let fin = iP + 1;
  while (fin < lineas.length && !lineas[fin].startsWith("## ")) fin++;
  const nuevo = [cabecera, "", cuerpo, ""];
  const viejo = lineas.slice(iP, fin);
  if (viejo.join("\n") !== nuevo.join("\n")) {
    cambios.push(`sección "Pendientes": ${viejo[0]} → ${cabecera} (lista regenerada desde la tabla)`);
    lineas.splice(iP, fin - iP, ...nuevo);
  }
}

console.log("== reconciliación del manifiesto contra la base ==");
console.log(`  familias con conceptos en la base: ${porFamilia.size}`);
console.log(`  filas del índice: ${filas.length} · ✓ ${c.extraidas} · ⏳ ${c.pendientes} · ⚠ ${c.revisar.length}`);
if (!cambios.length) console.log("  ✓ el índice ya coincide con la base: nada que corregir");
for (const t of cambios) console.log("  · " + t);

// Familias cargadas que el índice no menciona (contenido no-BOE, esperable).
const enIndice = new Set(filas.map((f) => f.familia).filter((f) => f && f !== "—"));
const fuera = [...porFamilia.keys()].filter((f) => !enIndice.has(f)).sort();
if (fuera.length)
  console.log(
    `  · ${fuera.length} familias cargadas fuera del corpus BOE-600 (no van en este índice): ${fuera.join(", ")}`,
  );

if (aplicar && cambios.length) {
  writeFileSync(INDICE, lineas.join("\n"));
  console.log("\n  ✓ 00-indice.md actualizado");
} else if (!aplicar) {
  console.log("\n(informe. Ejecuta con --aplicar para escribir)");
}
