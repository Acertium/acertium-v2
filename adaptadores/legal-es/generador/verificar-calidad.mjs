// Acertium — adaptador legal-es / puerta de CALIDAD PEDAGÓGICA
//
// Tercera barrera, complementa a verificar-lote (contenido) y verificar-meta.
// La puerta de contenido garantiza que la respuesta correcta es texto LITERAL
// del artículo, pero NO juzga la calidad del test como pregunta de examen.
// Aquí se comprueban los sesgos que un opositor podría "cazar" sin saber:
//
//   1. Opciones duplicadas (RECHAZO).
//   2. Enunciado vacío o demasiado corto (RECHAZO).
//   3. Sesgo de longitud: si la opción correcta es la MÁS LARGA en > UMBRAL_LARGA
//      por ciento del lote, los distractores delatan la respuesta (RECHAZO).
//      Se corrige escribiendo distractores de longitud y registro comparables.
//
// El sesgo de POSICIÓN (la correcta siempre en A/B) NO se comprueba aquí: lo
// resuelve cargar.mjs barajando las opciones al emitir el SQL, de forma que la
// posición correcta queda repartida de forma uniforme sin trabajo del generador.

const UMBRAL_LARGA = 55; // % máximo de actividades del lote con la correcta = la más larga
const MIN_ENUNCIADO = 10; // caracteres
const RATIO_ATIPICA = 1.9; // la correcta no debe superar 1.9x la media de longitud de los distractores
// Meta-opciones prohibidas: delatan o no son verificables literalmente
const META_RE = /(todas las anteriores|ninguna de las anteriores|todas son correctas|ninguna es correcta|a y b son|b y c son|a y c son|las respuestas? a y|son correctas la|no sabe\s*\/?\s*no contesta)/i;

export function verificarCalidad(lote) {
  const acts = (lote.actividades || []).filter((a) => a.tipo === "test");
  const rechazos = [];
  const avisos = [];
  let correctaMasLarga = 0;
  let contadas = 0;

  for (const a of acts) {
    const ops = (a.opciones || []).map((o) => String(o ?? ""));
    const enun = String(a.enunciado ?? "").trim();

    if (enun.length < MIN_ENUNCIADO)
      rechazos.push({ concepto: a.concepto_id, motivo: "enunciado vacío o demasiado corto" });

    const distintas = new Set(ops.map((o) => o.trim()));
    if (distintas.size < ops.length)
      rechazos.push({ concepto: a.concepto_id, motivo: "opciones duplicadas" });

    if (ops.some((o) => META_RE.test(o)))
      rechazos.push({ concepto: a.concepto_id, motivo: "meta-opción prohibida (todas/ninguna/a y b…)" });

    const correcta = ops[a.indice_correcto];
    if (correcta != null && ops.length) {
      const maxLen = Math.max(...ops.map((o) => o.length));
      if (correcta.length === maxLen) correctaMasLarga++;
      // Aviso por pregunta: la correcta es un valor atípico de longitud → distractor delator
      const otras = ops.filter((_, i) => i !== a.indice_correcto).map((o) => o.length);
      const mediaOtras = otras.length ? otras.reduce((s, n) => s + n, 0) / otras.length : 0;
      if (mediaOtras > 0 && correcta.length > RATIO_ATIPICA * mediaOtras)
        avisos.push({ concepto: a.concepto_id, aviso: `la opción correcta es mucho más larga que los distractores (x${(correcta.length / mediaOtras).toFixed(1)}); iguala su longitud` });
      contadas++;
    }
  }

  const pctLarga = contadas ? Math.round((100 * correctaMasLarga) / contadas) : 0;
  if (contadas >= 5 && pctLarga > UMBRAL_LARGA)
    rechazos.push({
      concepto: "(lote)",
      motivo: `sesgo de longitud: la opción correcta es la más larga en ${pctLarga}% de las preguntas (máximo ${UMBRAL_LARGA}%). Reescribe los distractores para que tengan longitud y nivel de detalle parecidos a la correcta.`,
    });

  return {
    ok: rechazos.length === 0,
    rechazos,
    avisos,
    resumen: `calidad: ${acts.length} test · correcta = la más larga en ${pctLarga}% · ${rechazos.length} rechazos`,
  };
}

// Self-test: node verificar-calidad.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const bien = {
    actividades: [
      { concepto_id: "X-1", tipo: "test", indice_correcto: 1, enunciado: "¿Cuál es la capital de España?", opciones: ["Barcelona hermosa", "Madrid, la capital", "Sevilla soleada", "Valencia del Turia"] },
    ],
  };
  const sesgo = {
    actividades: Array.from({ length: 6 }, (_, i) => ({
      concepto_id: "Y-" + i, tipo: "test", indice_correcto: 0,
      enunciado: "Pregunta larga de ejemplo número " + i + " para el test",
      opciones: ["Esta es la opción correcta con mucho más texto y detalle que las demás para delatarla", "No", "Quizá", "Tal vez"],
    })),
  };
  console.log("caso correcto:", verificarCalidad(bien));
  console.log("caso con sesgo de longitud:", verificarCalidad(sesgo));
}
