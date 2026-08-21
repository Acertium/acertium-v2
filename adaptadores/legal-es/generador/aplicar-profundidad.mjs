// Acertium — adaptador legal-es / generador / aplicador de PROFUNDIDAD
//
// POR QUÉ EXISTE
// El cerebro tenía 1,02 preguntas por concepto: 3.295 de 3.343 con UNA sola. Eso
// rompe dos cosas a la vez:
//
//   · EL MOTOR. `motor-bkt.mjs` supone `p_G = 1/3`: la probabilidad de acertar
//     por azar eligiendo entre tres alternativas. Con una única pregunta, cada
//     repaso te devuelve el MISMO ítem, y entonces no estás eligiendo entre tres,
//     estás recordando cuál marcaste. La absorción que calcula sale inflada.
//   · EL PESO. Un tema de peso 4 tenía tantas preguntas por concepto como uno de
//     peso 1, así que el peso ordenaba pero no profundizaba.
//
// `cargar.mjs` no sirve para esto: crea conceptos nuevos. Aquí los conceptos ya
// existen —con su historial y su estado BKT— y solo se les añaden actividades.
//
// LAS PUERTAS NO SE SALTAN. El lote pasa por `verificarLote` (la correcta tiene
// que ser texto literal del artículo del corpus) y por `verificarCalidad` (sesgo
// de longitud, opciones duplicadas, meta-opciones). Fail-closed: si algo no pasa,
// no se inserta nada.
//
//   node adaptadores/legal-es/generador/aplicar-profundidad.mjs <fichero.json>
//   node adaptadores/legal-es/generador/aplicar-profundidad.mjs <fichero.json> --aplicar
//
// Sin `--aplicar` es un simulacro: verifica y enseña qué haría, sin escribir.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { verificarLote } from "../../../nucleo/verificar-lote.mjs";
import { verificarCalidad } from "./verificar-calidad.mjs";
import { verificarUnicidad } from "../../../nucleo/verificar-unicidad.mjs";
import { createCerebroClient } from "./cliente-cerebro.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");

// El corpus guarda cada artículo por su `ref` ("7", "33"); las actividades citan
// "art. 7". La fuente de un apartado es el artículo entero.
function fuentesDelCorpus(rutaCorpus) {
  const { articulos } = JSON.parse(readFileSync(rutaCorpus, "utf8"));
  const porRef = new Map(articulos.map((a) => [String(a.ref), a.texto]));
  return (articulo) =>
    porRef.get(String(articulo).replace(/^art\.\s*/, "").split(".")[0]) ?? null;
}

export function verificarFichero(ruta, banco = []) {
  const doc = JSON.parse(readFileSync(ruta, "utf8"));
  const fuenteDe = fuentesDelCorpus(join(RAIZ, doc.meta.fuente));

  const fuentes = {};
  const actividades = [];
  const sinFuente = [];
  for (const a of doc.actividades ?? []) {
    const src = fuenteDe(a.articulo);
    if (!src) {
      sinFuente.push(a.concepto_id);
      continue;
    }
    fuentes[a.articulo] = src;
    actividades.push({ ...a, tipo: "test" });
  }

  const lote = { fuentes, conceptos: [], actividades };
  const contenido = verificarLote(lote);
  const calidad = verificarCalidad(lote);
  // `banco` opcional: sin él, unicidad solo compara el lote consigo mismo. Con
  // él, además contra las 3.411 que ya están cargadas.
  const unicidad = verificarUnicidad(lote, banco);
  return { doc, actividades, sinFuente, contenido, calidad, unicidad };
}

async function main() {
  const ruta = process.argv[2];
  const aplicar = process.argv.includes("--aplicar");
  if (!ruta) {
    console.error("uso: aplicar-profundidad.mjs <fichero.json> [--aplicar]");
    process.exit(2);
  }

  // El banco se trae ANTES de verificar: la puerta de unicidad no puede
  // detectar una contradicción contra lo que ya está cargado si no lo ve.
  //
  // AQUÍ HABÍA UN FAIL-OPEN, y de los silenciosos. supabase-js NO lanza cuando
  // el RPC falla: devuelve `{ data: null, error }`. Así que un `catch` no lo veía
  // y `data ?? []` dejaba el banco vacío sin decir nada — la puerta corría ciega
  // y `--aplicar` insertaba igual. El único caso que sí caía en el catch era no
  // tener credenciales, que es justo el caso en que tampoco se puede insertar.
  //
  // Ahora: sin banco se puede SIMULAR (útil sin credenciales), pero no aplicar.
  // Una puerta que se desactiva sola cuando falla la red no es una puerta.
  let banco = [];
  let porQueSinBanco = null;
  try {
    const { data, error } = await createCerebroClient().rpc("banco_enunciados");
    if (error) porQueSinBanco = error.message;
    else banco = data ?? [];
  } catch (e) {
    porQueSinBanco = e.message;
  }
  if (porQueSinBanco) {
    console.error(`  ⚠ sin banco (${porQueSinBanco}): unicidad solo compara el lote consigo mismo`);
    if (aplicar) {
      console.error(
        "✗ no se aplica nada. La puerta de unicidad necesita el banco para ver si estas\n" +
          "  preguntas contradicen a las que ya están cargadas, y sin él no puede.",
      );
      process.exit(1);
    }
  }

  const { doc, actividades, sinFuente, contenido, calidad, unicidad } =
    verificarFichero(ruta, banco);
  // `tema` y `peso` son informativos y no siempre vienen: los lotes escritos a
  // mano los llevan, los que produce `motor-preguntas.mjs` no. Se omiten en vez
  // de imprimir "undefined", que en un log acaba leyéndose como un dato.
  const contexto = [
    doc.meta.tema != null ? `tema ${doc.meta.tema}` : null,
    doc.meta.peso != null ? `peso ${doc.meta.peso}` : null,
    doc.meta.generado_por ? `generado por ${doc.meta.generado_por}` : null,
  ].filter(Boolean);
  console.log(
    `familia ${doc.meta.familia}${contexto.length ? ` (${contexto.join(", ")})` : ""} · ` +
      `${actividades.length} preguntas propuestas`,
  );

  const duros = [
    ...sinFuente.map((id) => `sin fuente en el corpus: ${id}`),
    // `verificarLote` etiqueta el rechazo con `concepto`; `verificarCalidad`
    // también, salvo el del sesgo de longitud, que es del LOTE entero y no
    // señala a una actividad concreta.
    ...(contenido.rechazos ?? []).map(
      (r) => `${r.concepto ?? "lote"}: ${(r.motivos ?? []).join("; ")}`,
    ),
    ...(calidad.rechazos ?? []).map(
      (r) => `${r.concepto ?? "lote"}: ${r.motivo ?? (r.motivos ?? []).join("; ")}`,
    ),
    ...(unicidad.rechazos ?? []).map(
      (r) => `${r.concepto ?? r.enunciado ?? "lote"}: ${r.motivo}`,
    ),
  ];
  if (duros.length) {
    console.error(`\n✗ las puertas rechazan ${duros.length}:`);
    for (const d of duros) console.error("  ·", d);
    process.exit(1);
  }
  console.log("✓ contenido: la correcta es texto literal del artículo en todas");
  console.log("✓ calidad: sin sesgo de longitud, duplicados ni meta-opciones");
  console.log(
    `✓ ${unicidad.resumen}${banco.length ? ` (contra ${banco.length} del banco)` : " (SIN banco)"}`,
  );
  for (const a of [...(contenido.avisos ?? []), ...(calidad.avisos ?? []), ...(unicidad.avisos ?? [])])
    console.log(`  aviso · ${a.concepto ?? a.id ?? "lote"}: ${a.aviso}`);

  if (!aplicar) {
    console.log("\n(simulacro: no se ha escrito nada. Añade --aplicar)");
    return;
  }

  const db = createCerebroClient();

  // Se comprueba ANTES de insertar que ningún concepto reciba una pregunta
  // repetida: este script se puede correr dos veces sin querer, y duplicar el
  // banco sería peor que no ampliarlo.
  const ids = [...new Set(actividades.map((a) => a.concepto_id))];
  const { data: yaHay, error: eLee } = await db
    .from("actividad")
    .select("concepto_id, enunciado")
    .in("concepto_id", ids);
  if (eLee) throw new Error(eLee.message);
  const existentes = new Set(
    (yaHay ?? []).map((r) => `${r.concepto_id}||${r.enunciado}`),
  );
  const nuevas = actividades.filter(
    (a) => !existentes.has(`${a.concepto_id}||${a.enunciado}`),
  );
  if (nuevas.length !== actividades.length)
    console.log(`  (${actividades.length - nuevas.length} ya estaban en la base, se omiten)`);
  if (nuevas.length === 0) return console.log("nada que insertar");

  const filas = nuevas.map((a) => ({
    concepto_id: a.concepto_id,
    tipo: "test",
    enunciado: a.enunciado,
    opciones: a.opciones,
    respuesta: {
      indice: a.indice_correcto,
      correcta: a.opciones[a.indice_correcto],
    },
    justificacion: a.justificacion,
    cotejo_fuente: a.cotejo,
    // Todas nacen verificadas porque las tres puertas ya las han aprobado: el
    // cotejo es literal del corpus y el estado lo refleja.
    estado_verificacion: "verificado",
  }));

  const { error } = await db.from("actividad").insert(filas);
  if (error) throw new Error(error.message);

  // Se RELEE de la base: el número que se enseña sale de ella, no del bucle.
  const { data: despues, error: eC } = await db
    .from("actividad")
    .select("concepto_id")
    .in("concepto_id", ids);
  if (eC) throw new Error(eC.message);
  const media = (despues ?? []).length / ids.length;
  console.log(`✓ ${filas.length} preguntas insertadas`);
  console.log(
    `✓ ${doc.meta.familia}: ${(despues ?? []).length} preguntas en ${ids.length} conceptos ` +
      `(${media.toFixed(2)} por concepto)`,
  );
}

if (process.argv[1] && process.argv[1].endsWith("aplicar-profundidad.mjs")) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
