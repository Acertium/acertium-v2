// Acertium — adaptador legal-es / generador / aplicador de explicaciones
//
// POR QUÉ EXISTE ESTE SCRIPT
// `explicacion` entró en el contrato de generación DESPUÉS de que se cargara la
// primera familia. Los conceptos anteriores quedaron con la columna a null y
// `explicacion_verificacion = 'pendiente'`: al responder, el opositor solo veía
// «Correcto.» o «Incorrecto.», sin nada que le enseñara por qué. Recargar esos
// conceptos no vale —perderíamos su historial de eventos y su estado BKT—, así
// que este script RELLENA la columna sin tocar nada más.
//
// LA PUERTA NO SE SALTA. Aunque aquí no se genera contenido nuevo, el texto pasa
// por `verificarLote` del núcleo con el artículo del corpus como fuente, igual
// que un lote normal: si una explicación mete cifras que no están en el
// artículo, sale por pantalla y no se aplica nada (fail-closed).
//
//   node adaptadores/legal-es/generador/aplicar-explicaciones.mjs <fichero.json>
//   node adaptadores/legal-es/generador/aplicar-explicaciones.mjs <fichero.json> --aplicar
//
// Sin `--aplicar` es un simulacro: verifica y enseña qué haría, sin escribir.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { verificarLote } from "../../../nucleo/verificar-lote.mjs";
import { createCerebroClient } from "./cliente-cerebro.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");

// El corpus guarda cada artículo por su `ref` ("10", "17"), mientras que las
// explicaciones citan el apartado ("art. 10.1"). La fuente de un apartado es el
// artículo entero: es donde está su texto.
function fuentesDelCorpus(rutaCorpus) {
  const { articulos } = JSON.parse(readFileSync(rutaCorpus, "utf8"));
  const porRef = new Map(articulos.map((a) => [String(a.ref), a.texto]));
  return (articulo) => {
    const base = String(articulo).replace(/^art\.\s*/, "").split(".")[0];
    return porRef.get(base) ?? null;
  };
}

export function verificarFichero(ruta) {
  const doc = JSON.parse(readFileSync(ruta, "utf8"));
  const entradas = doc.explicaciones ?? [];
  const fuenteDe = fuentesDelCorpus(join(RAIZ, doc.meta.fuente));

  const fuentes = {};
  const conceptos = [];
  const sinFuente = [];
  for (const e of entradas) {
    const src = fuenteDe(e.articulo);
    if (!src) {
      sinFuente.push(e.id);
      continue;
    }
    fuentes[e.articulo] = src;
    // `verificarLote` exige titulo y resumen para no rechazar el concepto; aquí
    // solo nos interesa su comprobación de cifras sobre `explicacion`, así que
    // se le pasa el propio texto como relleno de esos campos.
    conceptos.push({
      id: e.id,
      titulo: e.id,
      resumen: e.explicacion,
      explicacion: e.explicacion,
      articulo: e.articulo,
    });
  }

  const r = verificarLote({ fuentes, conceptos, actividades: [] });

  // Los avisos de `verificarLote` se filtran por TIPO, no se ignoran en bloque:
  //
  // · "posible isla" — no aplica. Ese aviso comprueba que un lote NUEVO traiga
  //   sus `relaciones`; aquí no se crea ningún concepto ni ninguna arista, solo
  //   se rellena una columna de conceptos que llevan meses en el grafo con sus
  //   relaciones ya cargadas.
  // · "cifras ajenas a la fuente" — SÍ aplica, y aquí se endurece. El núcleo lo
  //   deja en aviso porque una explicación puede citar contexto real; en este
  //   camino se exige que CADA cifra marcada esté declarada en el campo
  //   `cifras` de su entrada, con el motivo por el que es legítima (un recuento
  //   del propio artículo, una referencia cruzada a otro artículo de la norma).
  //   Lo que no esté declarado, bloquea.
  const declaradas = new Map(entradas.map((e) => [e.id, e.cifras ?? {}]));
  const bloqueos = [];
  for (const a of r.avisos) {
    if (/posible isla/.test(a.aviso)) continue;
    const m = /cifras ajenas a la fuente: (.+)$/.exec(a.aviso);
    if (!m) {
      bloqueos.push(`${a.id}: ${a.aviso}`);
      continue;
    }
    const dec = declaradas.get(a.id) ?? {};
    const sinDeclarar = m[1].split(", ").filter((n) => !dec[n]);
    if (sinDeclarar.length)
      bloqueos.push(`${a.id}: cifras sin declarar en \`cifras\`: ${sinDeclarar.join(", ")}`);
  }

  return { doc, entradas, sinFuente, rechazos: r.rechazos, bloqueos };
}

async function main() {
  const ruta = process.argv[2];
  const aplicar = process.argv.includes("--aplicar");
  if (!ruta) {
    console.error("uso: aplicar-explicaciones.mjs <fichero.json> [--aplicar]");
    process.exit(2);
  }

  const { doc, entradas, sinFuente, rechazos, bloqueos } = verificarFichero(ruta);
  console.log(`familia ${doc.meta.familia} · ${entradas.length} explicaciones`);

  const duros = [...sinFuente.map((id) => `sin fuente en el corpus: ${id}`),
                 ...rechazos.map((r) => `${r.id}: ${r.motivos.join("; ")}`),
                 ...bloqueos];
  if (duros.length) {
    console.error(`\n✗ la puerta rechaza ${duros.length}:`);
    for (const d of duros) console.error("  ·", d);
    process.exit(1);
  }
  const conCifras = entradas.filter((e) => e.cifras).length;
  console.log(`✓ puerta: sin rechazos; ${conCifras} explicaciones con cifras, todas declaradas`);

  if (!aplicar) {
    console.log("\n(simulacro: no se ha escrito nada. Añade --aplicar)");
    return;
  }

  const db = createCerebroClient();
  let escritos = 0;
  for (const e of entradas) {
    const { error } = await db
      .from("concepto")
      .update({ explicacion: e.explicacion, explicacion_verificacion: "verificado" })
      .eq("id", e.id)
      .select("id");
    if (error) {
      console.error(`✗ ${e.id}: ${error.message}`);
      process.exit(1);
    }
    escritos++;
  }

  // Se RELEE la base: el conteo que se enseña sale de ella, no de este bucle.
  const { count, error: errC } = await db
    .from("concepto")
    .select("id", { count: "exact", head: true })
    .like("id", `${doc.meta.familia}-%`)
    .is("explicacion", null);
  if (errC) throw new Error(errC.message);

  console.log(`✓ ${escritos} actualizados`);
  console.log(`✓ quedan ${count} conceptos ${doc.meta.familia} sin explicación`);
}

if (process.argv[1] && process.argv[1].endsWith("aplicar-explicaciones.mjs")) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
