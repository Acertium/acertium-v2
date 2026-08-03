// Acertium — adaptador legal-es / puerta de METADATOS (barreras 1 y 2)
//
// Complementa a nucleo/verificar-lote.mjs (que verifica el CONTENIDO). Esta puerta
// verifica que el META (materia, norma, referencia_boe, convocatoria, tema) con el
// que se va a estampar el lote es COHERENTE con lo que el lote realmente es. Nace
// del fallo del 02/08/2026: 3 lotes se cargaron con el meta de la Constitución
// porque el meta era un fichero suelto elegido a mano y nadie lo contrastaba.
//
// FAMILIA = primer token del id de concepto (antes del primer guion): CE, SP, CP,
// FCS, SC, VIC, DISC... Es 1:1 con la materia. El registro (registro-materias.json)
// fija, por familia, materia/norma/referencia_boe/tema esperados.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const CONVOCATORIA = "policia-nacional-2026";

export function cargarRegistro(ruta) {
  const p =
    ruta || join(dirname(fileURLToPath(import.meta.url)), "registro-materias.json");
  return JSON.parse(readFileSync(p, "utf8"));
}

// Devuelve { familia, familias } — familia es null si el lote mezcla familias.
export function familiaDe(ids) {
  const fams = [...new Set(ids.map((id) => String(id).split("-")[0]))];
  return { familia: fams.length === 1 ? fams[0] : null, familias: fams };
}

// verificarMeta(conceptos, meta, registro) → { ok, errores:[...], familia }
export function verificarMeta(conceptos, meta, registro) {
  const errores = [];
  const ids = (conceptos || []).map((c) => c.id).filter(Boolean);
  if (!ids.length) return { ok: false, errores: ["lote sin conceptos con id"], familia: null };

  const { familia, familias } = familiaDe(ids);
  if (!familia)
    errores.push(`el lote mezcla familias de id (${familias.join(", ")}): un lote = una norma`);

  if (!meta) {
    errores.push("falta el bloque meta (embébelo en el lote: materia, norma, referencia_boe, convocatoria, tema)");
    return { ok: false, errores, familia };
  }
  for (const k of ["materia", "norma", "referencia_boe", "convocatoria", "tema"])
    if (!meta[k] || !String(meta[k]).trim()) errores.push(`meta.${k} vacío o ausente`);

  if (meta.convocatoria && meta.convocatoria !== CONVOCATORIA)
    errores.push(`meta.convocatoria="${meta.convocatoria}", se esperaba "${CONVOCATORIA}"`);

  const esperado = familia ? registro[familia] : null;
  if (familia && !esperado)
    errores.push(`familia "${familia}" no registrada: añádela a registro-materias.json antes de cargar`);

  if (esperado) {
    if (meta.materia !== esperado.materia)
      errores.push(`meta.materia="${meta.materia}" ≠ esperado "${esperado.materia}" (familia ${familia})`);
    if (meta.norma !== esperado.norma)
      errores.push(`meta.norma="${meta.norma}" ≠ esperado "${esperado.norma}"`);
    if (meta.referencia_boe !== esperado.referencia_boe)
      errores.push(`meta.referencia_boe="${meta.referencia_boe}" ≠ esperado "${esperado.referencia_boe}"`);
    if (Array.isArray(esperado.temas) && meta.tema && !esperado.temas.includes(meta.tema))
      errores.push(`meta.tema="${meta.tema}" no está entre los temas registrados de ${familia}`);
  }

  return { ok: errores.length === 0, errores, familia };
}

// Self-test: node verificar-meta.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const registro = cargarRegistro();
  const conceptos = [{ id: "SP-001" }, { id: "SP-002" }];
  const bien = { materia: "ley-5-2014-seguridad-privada", norma: "Ley 5/2014, de Seguridad Privada", referencia_boe: "BOE-A-2014-3649", convocatoria: CONVOCATORIA, tema: "Tema 13 — Disposiciones generales en materia de seguridad privada en España" };
  const malMeta = { ...bien, materia: "constitucion-espanola", norma: "Constitución Española", referencia_boe: "BOE-A-1978-31229", tema: "Tema 3 — La Constitución Española" };
  console.log("caso correcto:", verificarMeta(conceptos, bien, registro));
  console.log("caso del fallo (meta de la CE en lote SP):", verificarMeta(conceptos, malMeta, registro));
  console.log("familia desconocida:", verificarMeta([{ id: "ZZ-001" }], { ...bien, materia: "x", norma: "y", referencia_boe: "z" }, registro));
}
