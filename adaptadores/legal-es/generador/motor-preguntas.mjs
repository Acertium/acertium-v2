// Acertium — adaptador legal-es / generador / MOTOR DE PREGUNTAS (opción B)
//
// `generar.mjs` dice en su cabecera, desde el diseño:
//
//   El <lote.json> lo produce el "motor de generación":
//     · Opción A (hoy): el agente, siguiendo contrato-generacion.md.
//     · Opción B (futuro): un job con la API de Claude. Mismo contrato, misma puerta.
//
// Esto es la opción B, para PROFUNDIDAD: no crea conceptos nuevos, propone
// preguntas ADICIONALES para los que ya existen. El cerebro tenía 1,02 preguntas
// por concepto y escribirlas a mano es el cuello de botella real —una familia de
// 26 conceptos costó una sesión entera—.
//
// EL MOTOR PROPONE, LA PUERTA DISPONE. Este fichero NO carga nada y NO decide si
// algo es correcto. Escribe un JSON que después tiene que pasar
// `aplicar-profundidad.mjs`, con las cuatro puertas fail-closed. Si el modelo se
// inventa un cotejo, la puerta lo tira: la trazabilidad no depende de que el
// generador se porte bien, sino de que el artículo es la ENTRADA y la puerta
// comprueba que la respuesta sale literalmente de él.
//
//   node motor-preguntas.mjs --familia DISC --seccion 14
//   node motor-preguntas.mjs --familia DISC --seccion 14 --dry        (no llama a la API)
//   node motor-preguntas.mjs --familia DISC --seccion 14 --material m.json
//
// `--dry` enseña el material y el prompt que enviaría. Sirve para revisar la
// entrada sin gastar tokens, y para trabajar sin credenciales.

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createCerebroClient } from "./cliente-cerebro.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const MODELO = "claude-opus-5";

// --- Entrada ----------------------------------------------------------------

function argumentos() {
  const a = process.argv.slice(2);
  const val = (k) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : null;
  };
  return {
    familia: val("--familia"),
    seccion: val("--seccion"),
    salida: val("--salida"),
    // Material desde fichero en vez de la base. Sirve para revisar y reproducir
    // una tirada sin depender de credenciales, y para que dos ejecuciones con el
    // mismo material sean comparables.
    material: val("--material"),
    dry: a.includes("--dry"),
    // Cuántas preguntas nuevas pedir por artículo. Se pide por ARTÍCULO y no por
    // concepto porque varios conceptos cuelgan del mismo texto (2,5 de media), y
    // pedirlas por separado produce dos veces la misma pregunta.
    porArticulo: Number(val("--por-articulo") ?? 3),
  };
}

function corpus(seccion) {
  const ruta = join(
    RAIZ,
    `datos/legal-es/boe-600-pn/corpus/seccion-${String(seccion).padStart(3, "0")}.json`,
  );
  const { meta, articulos } = JSON.parse(readFileSync(ruta, "utf8"));
  return {
    meta,
    ruta: ruta.replace(RAIZ + "/", ""),
    porRef: new Map(articulos.map((a) => [String(a.ref), a.texto])),
  };
}

/** Conceptos de la familia con su artículo y las preguntas que YA tienen. */
async function material(familia) {
  const db = createCerebroClient();
  const { data, error } = await db
    .from("concepto")
    .select(
      "id, titulo, resumen, concepto_fuente(articulo), actividad(enunciado, cotejo_fuente)",
    )
    .like("id", `${familia}-%`)
    .order("id");
  if (error) throw new Error(error.message);

  // Agrupado por ARTÍCULO: es la unidad de generación.
  const porArticulo = new Map();
  for (const c of data ?? []) {
    const art = c.concepto_fuente?.[0]?.articulo;
    if (!art) continue;
    if (!porArticulo.has(art)) porArticulo.set(art, []);
    porArticulo.get(art).push({
      id: c.id,
      titulo: c.titulo,
      resumen: c.resumen,
      yaPreguntado: (c.actividad ?? []).map((a) => a.enunciado),
      cotejosUsados: (c.actividad ?? []).map((a) => a.cotejo_fuente),
    });
  }
  return porArticulo;
}

// --- El encargo -------------------------------------------------------------
//
// Las reglas van EXPLÍCITAS en el prompt, no referenciadas: el modelo no tiene
// el repo delante. Son las mismas de `contrato-generacion.md`, que es lo que
// después comprueban las puertas.

const SISTEMA = `Eres el motor de generación de Acertium, una app de estudio para la oposición a Policía Nacional (Escala Básica). Escribes preguntas tipo test a partir del texto LITERAL de un artículo de una norma española.

REGLAS DE ANCLAJE (una sola violación invalida la pregunta):
1. El campo "cotejo" es una cita LITERAL Y CONTIGUA del artículo que se te da. Copiada, no parafraseada, ni resumida, ni con puntos suspensivos.
2. La opción correcta debe aparecer LITERALMENTE dentro de ese cotejo. Escríbela con las palabras del artículo.
3. Nada fuera del texto: ninguna cifra, fecha, nombre o plazo que no esté en la fuente.

REGLAS DE CALIDAD:
4. Exactamente 4 opciones, distintas entre sí, una sola correcta.
5. Los 3 distractores deben tener LONGITUD Y NIVEL DE DETALLE PARECIDOS a la correcta. Si la correcta es la única larga y detallada, la pregunta se caza sin saber la materia. Son "near-miss": plausibles, del mismo registro, y falsos por un detalle concreto (un plazo cambiado, un sujeto cambiado, una excepción que no existe).
6. Las OTRAS reglas del mismo artículo son buenos distractores —a menudo los mejores, porque son las distinciones que pregunta el tribunal—, PERO solo si el enunciado selecciona una sola de ellas sin lugar a duda. Lo hace un ordinal ("el TERCERO de los requisitos"), un superlativo ("el MAYOR de los tres picos"), una exclusión ("salvo para las personas jurídicas"), una condición ("si se causan con arma de fuego") o el verbo ("¿quién RESUELVE?", frente a quien tramita o propone). Sin ese selector, si el artículo enumera cinco órganos y preguntas "¿qué órgano depende de X?", las cinco son verdad y la pregunta no se puede acertar sabiendo la norma.
7. El enunciado debe identificar de qué habla sin ambigüedad. Si dice "el real decreto" o "el plazo" sin más, y esa expresión encaja con varios artículos, la pregunta tiene varias respuestas verdaderas. Ancla el enunciado con el sujeto o la materia. Esta regla y la 6 son la misma idea: el enunciado tiene que dejar UNA sola respuesta en pie.

QUÉ PREGUNTAR:
8. Te doy las preguntas que YA existen para este artículo. Las nuevas deben atacar APARTADOS O ASPECTOS DISTINTOS. No reformules la misma idea con otras palabras: eso no da profundidad, da ruido.
9. Escribe en las DOS direcciones cuando el texto lo permita:
   · DIRECTA: del sujeto al dato. "¿Cuál es el plazo máximo para resolver?" → "seis meses".
   · INVERSA: del dato al sujeto. "¿Qué actuación debe producirse en un plazo máximo de seis meses?" → "La resolución que ponga fin al procedimiento y su notificación".
   Son operaciones mentales distintas y el tribunal pregunta en ambas. La inversa sale del MISMO cotejo, así que no necesita texto nuevo. Pero cuida la regla 7: al quitar el sujeto del enunciado es fácil dejarlo ambiguo.
10. La "justificacion" es una frase que enseña algo: la distinción que se está probando, o el error típico. No repitas la respuesta.
11. Si el artículo es tan breve que no da para otro ángulo honesto, devuelve MENOS preguntas. Es correcto y esperado. No rellenes.`;

const ESQUEMA = {
  type: "object",
  properties: {
    preguntas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concepto_id: { type: "string" },
          direccion: { type: "string", enum: ["directa", "inversa"] },
          enunciado: { type: "string" },
          opciones: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4,
          },
          indice_correcto: { type: "integer", minimum: 0, maximum: 3 },
          cotejo: { type: "string" },
          justificacion: { type: "string" },
        },
        required: [
          "concepto_id",
          "direccion",
          "enunciado",
          "opciones",
          "indice_correcto",
          "cotejo",
          "justificacion",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["preguntas"],
  additionalProperties: false,
};

function encargo({ articulo, texto, conceptos, cuantas }) {
  const fichas = conceptos
    .map(
      (c) =>
        `- ${c.id} — ${c.titulo}\n  ya preguntado: ${
          c.yaPreguntado.length
            ? c.yaPreguntado.map((e) => `«${e}»`).join(" · ")
            : "(nada)"
        }`,
    )
    .join("\n");

  return `NORMA: ${articulo}

TEXTO LITERAL DEL ARTÍCULO (única fuente admisible):
"""
${texto}
"""

CONCEPTOS QUE CUELGAN DE ESTE ARTÍCULO:
${fichas}

Escribe hasta ${cuantas} preguntas NUEVAS repartidas entre esos conceptos, cada una asignada al concepto_id que le corresponda. Ataca apartados o aspectos que las preguntas ya existentes no cubran, y mezcla dirección directa e inversa. Si el artículo no da para ${cuantas}, devuelve menos.`;
}

// --- Capa 2: afinado de distractores ---------------------------------------
//
// Paso FIJO del flujo, no opcional (contrato §0-quater). La puerta de calidad
// rechaza si la correcta es la más larga en >55 % del lote; el objetivo del
// afinado es ≤35 %. Se mide antes de gastar una llamada: si el lote ya cumple,
// no se afina.

function sesgoLongitud(preguntas) {
  if (!preguntas.length) return 0;
  const n = preguntas.filter((p) => {
    const c = p.opciones[p.indice_correcto] ?? "";
    return p.opciones.every((o) => o === c || o.length <= c.length);
  }).length;
  return n / preguntas.length;
}

const SISTEMA_AFINADO = `Reescribes DISTRACTORES de preguntas tipo test para que no delaten la respuesta.

REGLA ABSOLUTA: NO TOQUES la opción correcta. Es cita literal del BOE y cualquier cambio invalida la pregunta. Solo reescribes las otras tres.

Objetivo: que los tres distractores tengan longitud y nivel de detalle parecidos a la correcta, y que sean falsos por un detalle concreto y comprobable (un plazo distinto, un órgano distinto, una excepción inventada, un sujeto cambiado). Plausibles para quien no domina la materia, inequívocamente falsos para quien sí.

CÓMO SE MIDE ESTO, porque "parecidos" no basta: se cuenta en qué porcentaje de las preguntas la correcta es la opción MÁS LARGA, y empatar cuenta como ser la más larga. Si dejas los tres distractores un poco más cortos que la correcta —que es lo que sale solo al pedir "longitud parecida"— habrás cumplido la letra y el número no se habrá movido. En la mayoría de las preguntas, al menos UN distractor tiene que ser claramente MÁS LARGO que la correcta. El banco actual está en el 23 %; ese es el listón.

Los distractores PUEDEN salir de otras reglas del mismo artículo, y suelen ser los mejores. Lo que no puede pasar es que el enunciado deje en pie más de una: si lo hace, no lo arregles tocando los distractores —el enunciado no es tuyo—, deja la pregunta como está.

Devuelve las mismas preguntas, en el mismo orden, con el mismo enunciado, el mismo cotejo, la misma correcta y el mismo indice_correcto. Solo cambian los distractores.`;

async function afinar(cliente, preguntas) {
  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 16000,
    system: SISTEMA_AFINADO,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: ESQUEMA } },
    messages: [
      {
        role: "user",
        content: `Afina los distractores de estas preguntas:\n\n${JSON.stringify({ preguntas }, null, 2)}`,
      },
    ],
  });
  return leerJson(r).preguntas ?? [];
}

/**
 * El afinado SOLO puede tocar los distractores. El prompt se lo dice, pero
 * decírselo no es comprobarlo, y aquí hay una asimetría que conviene ver:
 *
 *   · Si el afinado cambia la correcta, `verificarLote` lo detecta —deja de ser
 *     literal del cotejo— y tira EL LOTE ENTERO. Fail-closed es lo correcto,
 *     pero el precio es tirar también las 90 preguntas buenas de la misma
 *     tirada, y con ellas las llamadas a la API que costaron.
 *   · Si cambia el enunciado, no lo detecta nadie: sigue siendo una pregunta
 *     válida, solo que ya no es la que se revisó.
 *
 * Así que se coteja pregunta a pregunta contra el original. Del afinado se
 * acepta UNA cosa —los distractores— y el resto se reimpone. Lo que no cuadre
 * se revierte a su original, que es peor pregunta pero es una pregunta buena.
 */
export function fusionarAfinado(originales, afinadas) {
  const revertidas = [];
  const finales = originales.map((o, i) => {
    const f = afinadas[i];
    const correcta = o.opciones?.[o.indice_correcto];
    const motivo =
      !f ? "el afinado no devolvió esta pregunta"
      : f.concepto_id !== o.concepto_id ? "cambió el concepto_id (se descolocó el orden)"
      : (f.opciones ?? []).length !== 4 ? `devolvió ${(f.opciones ?? []).length} opciones`
      : f.opciones[f.indice_correcto] !== correcta ? "tocó la opción correcta"
      : null;
    if (motivo) {
      revertidas.push({ concepto_id: o.concepto_id, motivo });
      return o;
    }
    // Del afinado se toman las opciones y nada más: enunciado, cotejo y
    // justificación se reimponen desde el original aunque hayan cambiado.
    return { ...o, opciones: f.opciones, indice_correcto: f.indice_correcto };
  });
  return { finales, revertidas };
}

// --- API --------------------------------------------------------------------

function leerJson(respuesta) {
  const texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(texto);
}

async function generarArticulo(cliente, ficha, log = (s) => process.stderr.write(s)) {
  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 16000,
    system: SISTEMA,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: ESQUEMA } },
    messages: [{ role: "user", content: encargo(ficha) }],
  });
  // `refusal` llega con HTTP 200: hay que mirarlo antes de leer el contenido.
  if (r.stop_reason === "refusal") {
    log(`✗ la API declinó (${r.stop_details?.category ?? "?"})\n`);
    return [];
  }
  return leerJson(r).preguntas ?? [];
}

// --- Orquestación -----------------------------------------------------------
//
// Separada de `main` y con el cliente por parámetro: así el self-test puede
// pasarle un cliente de mentira y ejercitar todo el camino —reparto por
// artículo, ids inventados, Capa 2, reversiones— sin llamar a la API. Lo único
// que queda sin probar es el transporte HTTP.

/**
 * @param cliente  algo con `.messages.create()`. En producción, el SDK.
 * @param fichas   [{ articulo, texto, conceptos, cuantas }]
 * @param log      dónde escribir el progreso (por defecto, stderr).
 */
export async function ejecutar({ cliente, fichas, log = (s) => process.stderr.write(s) }) {
  // Los ids que el modelo PUEDE usar son los del material. Si devuelve otro, es
  // que se lo ha inventado, y la pregunta no tiene artículo del que colgar.
  //
  // Antes esto no se miraba y el precio era desproporcionado: la pregunta salía
  // con `articulo: undefined`, `aplicar-profundidad` no le encontraba fuente en
  // el corpus y rechazaba EL FICHERO ENTERO. Un id inventado se llevaba por
  // delante las otras noventa y nueve. Se descarta aquí, donde se sabe por qué.
  const conocidos = new Map();
  for (const f of fichas) for (const c of f.conceptos) conocidos.set(c.id, f.articulo);

  const todas = [];
  const inventadas = [];
  for (const [i, ficha] of fichas.entries()) {
    log(`  [${i + 1}/${fichas.length}] ${ficha.articulo}… `);
    try {
      const p = await generarArticulo(cliente, ficha, log);
      const buenas = p.filter((q) => conocidos.has(q.concepto_id));
      for (const q of p)
        if (!conocidos.has(q.concepto_id))
          inventadas.push({ concepto_id: q.concepto_id, articulo: ficha.articulo });
      todas.push(...buenas.map((q) => ({ ...q, articulo: conocidos.get(q.concepto_id) })));
      log(`${buenas.length}\n`);
    } catch (e) {
      log(`✗ ${e.message}\n`);
    }
  }
  if (inventadas.length)
    log(
      `  ⚠ ${inventadas.length} pregunta(s) descartadas: concepto_id que no está en el material ` +
        `(${inventadas.map((x) => `${x.concepto_id} en ${x.articulo}`).join(", ")})\n`,
    );

  // Capa 2, obligatoria — pero solo si hace falta.
  const antes = sesgoLongitud(todas);
  let finales = todas;
  let revertidas = [];
  log(`\nsesgo de longitud tras generar: ${(100 * antes).toFixed(0)} %\n`);
  if (todas.length && antes > 0.35) {
    log("  → por encima del objetivo (35 %): afinando distractores…\n");
    try {
      const fusion = fusionarAfinado(todas, await afinar(cliente, todas));
      finales = fusion.finales;
      revertidas = fusion.revertidas;
      const despues = sesgoLongitud(finales);
      log(`  → tras afinar: ${(100 * despues).toFixed(0)} %\n`);
      for (const r of revertidas) log(`  ⚠ ${r.concepto_id} sin afinar: ${r.motivo}\n`);
      // Solo se afina una vez. Si sigue alto, que se vea aquí y no en la puerta:
      // por debajo del 55 % el lote se carga igual, con el sesgo dentro.
      if (despues > 0.35)
        log(
          `  ⚠ sigue por encima del objetivo (35 %). La puerta solo corta en el 55 %, ` +
            `así que esto NO lo va a parar: revisa los distractores a mano o vuelve a tirar.\n`,
        );
    } catch (e) {
      log(`  ⚠ afinado fallido (${e.message}): se deja el original\n`);
    }
  } else {
    log("  → ya por debajo del objetivo, no hace falta afinar\n");
  }

  return { preguntas: finales, inventadas, revertidas, sesgoAntes: antes, sesgoDespues: sesgoLongitud(finales) };
}

async function main() {
  const { familia, seccion, salida, dry, porArticulo, material: rutaMaterial } = argumentos();
  if (!familia || !seccion) {
    console.error(
      "uso: motor-preguntas.mjs --familia DISC --seccion 14 [--por-articulo 3] [--material f.json] [--dry]",
    );
    process.exit(2);
  }

  const c = corpus(seccion);
  const porArt = rutaMaterial
    ? new Map(Object.entries(JSON.parse(readFileSync(rutaMaterial, "utf8"))))
    : await material(familia);
  console.error(
    `${familia} · ${c.meta.titulo}\n` +
      `${porArt.size} artículos con conceptos · ` +
      `${[...porArt.values()].flat().length} conceptos`,
  );

  const fichas = [];
  const sinTexto = [];
  for (const [articulo, conceptos] of porArt) {
    const base = String(articulo).replace(/^art\.\s*/, "").split(".")[0];
    const texto = c.porRef.get(base);
    if (!texto) {
      sinTexto.push(articulo);
      continue;
    }
    fichas.push({ articulo, texto, conceptos, cuantas: porArticulo });
  }
  if (sinTexto.length)
    console.error(`  ⚠ ${sinTexto.length} artículos sin texto en el corpus: ${sinTexto.join(", ")}`);

  if (dry) {
    console.error(`\n--dry: no se llama a la API. Primer encargo de ${fichas.length}:\n`);
    console.log(SISTEMA);
    console.log("\n" + "=".repeat(70) + "\n");
    console.log(encargo(fichas[0]));
    return;
  }

  const { preguntas: finales } = await ejecutar({ cliente: new Anthropic(), fichas });

  const doc = {
    meta: {
      familia,
      norma: c.meta.titulo,
      referencia_boe: c.meta.referencia_boe,
      fuente: c.ruta,
      generado_por: `motor-preguntas.mjs · ${MODELO}`,
      // Sin fecha: la escribe quien revise el lote. El motor no debe estampar
      // una fecha que después parezca fecha de verificación.
      nota: "PROPUESTA del motor. No está verificada hasta que pase aplicar-profundidad.mjs.",
    },
    actividades: finales.map((p) => ({
      concepto_id: p.concepto_id,
      // `ejecutar` ya lo resolvió contra el material, y descartó lo que no
      // encajaba: aquí no puede quedar ninguna sin artículo.
      articulo: p.articulo,
      direccion: p.direccion,
      enunciado: p.enunciado,
      opciones: p.opciones,
      indice_correcto: p.indice_correcto,
      cotejo: p.cotejo,
      justificacion: p.justificacion,
    })),
  };

  const destino =
    salida ??
    join(RAIZ, `adaptadores/legal-es/generador/profundidad/${familia.toLowerCase()}-motor.json`);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(doc, null, 2) + "\n");
  console.error(`\n✓ ${doc.actividades.length} preguntas propuestas en ${destino}`);
  console.error(`  siguiente paso: node aplicar-profundidad.mjs ${destino}`);
}

if (process.argv[1] && process.argv[1].endsWith("motor-preguntas.mjs")) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
