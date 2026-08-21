// Acertium — prueba del MOTOR DE PREGUNTAS
//
//   node adaptadores/legal-es/generador/motor-preguntas.test.mjs
//
// QUÉ PRUEBA Y QUÉ NO. El motor tiene una sola pieza que no se puede ejercitar
// sin credenciales: el transporte HTTP contra la API. Todo lo demás —reparto por
// artículo, lectura de la respuesta, ids inventados, rechazos, Capa 2 y sus
// reversiones— es lógica nuestra, y es donde están los fallos que hacen daño.
// Aquí se le pasa a `ejecutar` un cliente de mentira que devuelve exactamente lo
// que se quiere probar, incluido lo que un modelo hace mal.
//
// LO QUE NO ES ESTO. No mide si las preguntas que escribe el modelo son buenas:
// eso no lo puede decir un test, lo dicen las cuatro puertas y una lectura
// humana. Esto mide que el motor se porta bien cuando el modelo NO se porta
// bien.

import { ejecutar, fusionarAfinado } from "./motor-preguntas.mjs";

let fallos = 0;
const mudo = () => {};

function comprueba(nombre, condicion, detalle = "") {
  console.log(`${condicion ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  if (!condicion) fallos++;
}

// Un cliente de mentira: se le da la lista de respuestas que debe ir soltando,
// en orden. `respuesta(x)` envuelve un objeto como lo devuelve la API.
const respuesta = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj) }] });
function clienteFalso(guion) {
  let i = 0;
  const llamadas = [];
  return {
    llamadas,
    messages: {
      create: async (args) => {
        llamadas.push(args);
        const paso = guion[i++];
        if (typeof paso === "function") return paso();
        return paso;
      },
    },
  };
}

const FICHA = {
  articulo: "art. 7",
  texto: "Son faltas muy graves: a) El incumplimiento del deber de fidelidad a la Constitución en el ejercicio de las funciones. f) El abandono de servicio, salvo que exista causa de fuerza mayor.",
  conceptos: [
    { id: "DISC-006", titulo: "Faltas muy graves", yaPreguntado: [], cotejosUsados: [] },
    { id: "DISC-007", titulo: "Abandono de servicio", yaPreguntado: [], cotejosUsados: [] },
  ],
  cuantas: 3,
};

// OJO CON ESTOS DOS FIXTURES. La métrica no es "los distractores miden más o
// menos lo mismo": es "en qué % de preguntas la correcta es la MÁS LARGA", y
// empatar cuenta como serlo. Un fixture con los tres distractores un pelo más
// cortos NO está equilibrado; cuenta como sesgado. Escribirlo mal la primera vez
// es justo el error que comete el afinador si el prompt no se lo dice.
const CORRECTA = "la respuesta correcta de esta prueba";
const equilibrada = (id, n = "") => ({
  concepto_id: id,
  direccion: "directa",
  enunciado: `¿Pregunta ${id}${n}?`,
  opciones: [
    CORRECTA,
    "un distractor deliberadamente más largo que la correcta", // ← estrictamente mayor
    "otro distractor de longitud parecida a ella",
    "un tercero de extensión similar",
  ],
  indice_correcto: 0,
  cotejo: `${CORRECTA}, según el artículo`,
  justificacion: "porque sí",
});

// Una pregunta cuya correcta es la más larga: dispara Capa 2.
const LARGA = "la opción correcta, que es larguísima y muy detallada";
const sesgada = (id) => ({
  ...equilibrada(id),
  opciones: [LARGA, "corta", "otra", "más"],
  cotejo: `${LARGA}, según el artículo`,
});

// --- 1. Camino feliz --------------------------------------------------------
{
  const c = clienteFalso([respuesta({ preguntas: [equilibrada("DISC-006"), equilibrada("DISC-007")] })]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("camino feliz: devuelve las 2 preguntas", r.preguntas.length === 2);
  comprueba("camino feliz: les cuelga el artículo del material", r.preguntas.every((p) => p.articulo === "art. 7"));
  comprueba("camino feliz: sin sesgo, NO gasta una llamada en Capa 2", c.llamadas.length === 1, `${c.llamadas.length} llamadas`);
}

// --- 2. Un concepto_id inventado no se lleva por delante el resto -----------
//
// Es el fallo caro: `aplicar-profundidad` rechaza el FICHERO entero si una sola
// pregunta no tiene fuente, así que un id alucinado tiraba las 99 buenas.
{
  const c = clienteFalso([
    respuesta({ preguntas: [equilibrada("DISC-006"), equilibrada("DISC-999"), equilibrada("DISC-007")] }),
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("id inventado: se descarta solo esa", r.preguntas.length === 2);
  comprueba("id inventado: se dice cuál era", r.inventadas[0]?.concepto_id === "DISC-999");
  comprueba("id inventado: ninguna queda sin artículo", r.preguntas.every((p) => p.articulo));
}

// --- 3. La API declina (llega con HTTP 200) --------------------------------
{
  const c = clienteFalso([{ stop_reason: "refusal", stop_details: { category: "x" }, content: [] }]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("refusal: no revienta y devuelve 0", r.preguntas.length === 0);
}

// --- 4. Respuesta ilegible: un artículo roto no tumba la tirada ------------
{
  const c = clienteFalso([
    { content: [{ type: "text", text: "esto no es json" }] },
    respuesta({ preguntas: [equilibrada("DISC-006")] }),
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA, { ...FICHA, articulo: "art. 8" }], log: mudo });
  comprueba("json roto: se pierde ese artículo, no la tirada", r.preguntas.length === 1);
}

// --- 5. Capa 2 se dispara con sesgo y arregla ------------------------------
{
  // Arreglada de verdad: el primer distractor es ESTRICTAMENTE más largo que la
  // correcta. Con distractores "parecidos pero un poco más cortos" el número no
  // se movería, que es exactamente lo que se quiere detectar aquí.
  const arreglada = { ...sesgada("DISC-006"), opciones: [LARGA, "un distractor deliberadamente escrito para ser más largo todavía que la correcta", "otro distractor con la misma extensión aproximada", "un tercero también largo y del mismo registro"] };
  const c = clienteFalso([
    respuesta({ preguntas: [sesgada("DISC-006")] }),
    respuesta({ preguntas: [arreglada] }),
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("Capa 2: se dispara con sesgo alto", c.llamadas.length === 2, `${c.llamadas.length} llamadas`);
  comprueba("Capa 2: baja el sesgo", r.sesgoDespues < r.sesgoAntes, `${r.sesgoAntes} → ${r.sesgoDespues}`);
  comprueba("Capa 2: la correcta sigue intacta", r.preguntas[0].opciones[r.preguntas[0].indice_correcto] === LARGA);
}

// --- 6. Capa 2 toca la correcta: se revierte esa pregunta -----------------
//
// Sin esta comprobación el daño no era una pregunta mala: `verificarLote` la
// caza —deja de ser literal del cotejo— y rechaza el LOTE ENTERO, tirando
// también las buenas de la misma tirada.
{
  const manipulada = { ...sesgada("DISC-006"), opciones: ["la opción correcta REESCRITA por el afinador", "distractor largo y bien hecho para la prueba", "otro distractor con extensión parecida", "un tercero del mismo registro"] };
  const c = clienteFalso([
    respuesta({ preguntas: [sesgada("DISC-006")] }),
    respuesta({ preguntas: [manipulada] }),
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("Capa 2 manipula la correcta: se revierte", r.preguntas[0].opciones[0] === LARGA);
  comprueba("Capa 2 manipula la correcta: se dice por qué", r.revertidas[0]?.motivo === "tocó la opción correcta");
}

// --- 7. Capa 2 cambia el enunciado: se reimpone el original --------------
//
// Este es el que no ve NINGUNA puerta: la pregunta reescrita sigue siendo
// válida, solo que ya no es la que se revisó.
{
  const conOtroEnunciado = { ...sesgada("DISC-006"), enunciado: "¿Otra pregunta distinta?", cotejo: "un cotejo distinto", opciones: [LARGA, "un distractor deliberadamente escrito para ser más largo todavía", "otro distractor con extensión parecida", "un tercero del mismo registro"] };
  const c = clienteFalso([
    respuesta({ preguntas: [sesgada("DISC-006")] }),
    respuesta({ preguntas: [conOtroEnunciado] }),
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("Capa 2 cambia el enunciado: se reimpone el original", r.preguntas[0].enunciado === "¿Pregunta DISC-006?");
  comprueba("Capa 2 cambia el cotejo: se reimpone el original", r.preguntas[0].cotejo === `${LARGA}, según el artículo`);
}

// --- 8. Capa 2 devuelve otra cantidad: no se descoloca el orden ----------
{
  const c = clienteFalso([
    respuesta({ preguntas: [sesgada("DISC-006"), sesgada("DISC-007")] }),
    respuesta({ preguntas: [sesgada("DISC-006")] }),
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("Capa 2 devuelve menos: se conservan las 2", r.preguntas.length === 2);
  comprueba("Capa 2 devuelve menos: la huérfana se revierte", r.revertidas.some((x) => x.concepto_id === "DISC-007"));
}

// --- 9. Capa 2 falla entera: se deja el original ------------------------
{
  const c = clienteFalso([
    respuesta({ preguntas: [sesgada("DISC-006")] }),
    () => { throw new Error("503"); },
  ]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("Capa 2 revienta: se queda el original, no se pierde nada", r.preguntas.length === 1);
}

// --- 10. Artículo que no da para más: 0 preguntas es una respuesta válida --
{
  const c = clienteFalso([respuesta({ preguntas: [] })]);
  const r = await ejecutar({ cliente: c, fichas: [FICHA], log: mudo });
  comprueba("lote vacío: no revienta ni llama a Capa 2", r.preguntas.length === 0 && c.llamadas.length === 1);
}

// --- 11. `fusionarAfinado` aislado: el orden se comprueba por concepto_id --
{
  const a = equilibrada("DISC-006");
  const b = equilibrada("DISC-007");
  const { revertidas } = fusionarAfinado([a, b], [b, a]);
  comprueba("fusionar: orden invertido → se revierten las 2", revertidas.length === 2);
}

console.log(fallos ? `\n✗ ${fallos} comprobaciones fallidas` : "\n✓ todo en orden");
process.exit(fallos ? 1 : 0);
