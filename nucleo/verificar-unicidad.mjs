// Acertium — núcleo / puerta de UNICIDAD
//
// Cuarta barrera. Las otras tres miran cada pregunta contra su fuente; esta la
// mira contra EL RESTO DEL BANCO, que es el único sitio donde vive este fallo.
//
// EL DAÑO QUE EVITA. El opositor contesta «el día siguiente al de su
// publicación», acierta, y días después le sale lo que para él es la misma
// pregunta —«¿cuándo entra en vigor el real decreto?»— contesta igual y falla,
// porque esa otra hablaba de OTRO real decreto. No ha aprendido nada: ha
// aprendido a desconfiar. Una laguna se perdona; una contradicción, no.
//
// POR QUÉ AHORA. Con preguntas directas el fallo es raro —el enunciado suele
// arrastrar su sujeto («¿cuál es el objeto de la LO 4/2010?»)—. Medido sobre las
// 3.411 del banco: solo 4 enunciados repetidos. Pero la pregunta INVERSA funciona
// precisamente quitando el sujeto del enunciado, que es lo que la hace inversa, y
// un generador automático las produce mucho más deprisa de lo que nadie las
// revisa. El fallo pasa de raro a estructural.
//
//   import { verificarUnicidad } from './verificar-unicidad.mjs'
//   verificarUnicidad(lote, banco)   // banco: [{ id, enunciado, correcta }]
//
// Es agnóstica de dominio a propósito: solo compara textos entre sí. Lo que
// depende del idioma o de la materia —detectar un sujeto genérico como «el real
// decreto»— vive en el adaptador, no aquí.

import { esEjecucionDirecta } from "./ejecucion-directa.mjs";
import { normalizarNumeros } from "./verificador-cotejo.mjs";

// Longitud mínima para considerar que un distractor «sale» del cotejo. Por
// debajo, coincidir es casualidad del idioma: «la ley», «el Estado», «tres años»
// aparecen en cualquier párrafo sin que eso los haga verdaderos.
const MIN_DISTRACTOR = 25;

/**
 * UNICIDAD DENTRO DE UNA PREGUNTA.
 *
 * La puerta de contenido exige que la correcta sea cita literal del cotejo. No
 * dice nada de los distractores, y ahí se cuela un test que no se puede acertar:
 * si el cotejo enumera —«de la que dependen los siguientes órganos directivos:
 * la Secretaría General Técnica, la Dirección General de Política Interior,
 * …»— y los distractores son los OTROS elementos de esa misma lista, las cuatro
 * opciones son verdad y el opositor solo puede adivinar.
 *
 * Encontrado en producción: 23 preguntas, 8 de ellas con dos o más distractores
 * literales. La más clara, dos conceptos distintos preguntando «¿qué órgano
 * directivo depende de la Subsecretaría del Interior?» y eligiendo cada uno un
 * elemento distinto de la misma enumeración.
 *
 * Un distractor puede parecerse mucho a la fuente —de eso vive un buen near-miss—
 * pero no puede SER la fuente.
 */
function distractoresQueTambienSonVerdad(a) {
  const cotejo = normalizarNumeros(String(a.cotejo ?? a.cotejo_fuente ?? ""));
  if (!cotejo) return [];
  const correcta = (a.opciones ?? [])[a.indice_correcto];
  return (a.opciones ?? []).filter(
    (o) =>
      o !== correcta &&
      String(o).length >= MIN_DISTRACTOR &&
      cotejo.includes(normalizarNumeros(String(o))),
  );
}

// Normalización deliberadamente CONSERVADORA.
//
// Se bajan mayúsculas, se colapsan espacios y se quita la puntuación de los
// extremos. NO se tocan los dígitos, y esa decisión tiene cicatriz: al medir
// esto por primera vez borré los números y «Objetivo 4 de Desarrollo Sostenible»
// colapsó con «Objetivo 7», dando 17 colisiones falsas de golpe. En un banco de
// preguntas el número casi nunca es ruido: suele ser justo lo que distingue una
// pregunta de otra.
export function normalizar(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[¿¡\s]+|[?!.\s]+$/g, "")
    .trim();
}

/**
 * @param lote   { actividades: [{ concepto_id, enunciado, opciones, indice_correcto }] }
 * @param banco  [{ id, enunciado, correcta }] — lo que ya está cargado. Opcional:
 *               sin banco solo se comprueba el lote contra sí mismo, que es lo
 *               mínimo y ya evita meter una contradicción de una sentada.
 */
export function verificarUnicidad(lote, banco = []) {
  const rechazos = [];
  const avisos = [];

  // Índice enunciado normalizado → respuestas distintas que se le han dado.
  const porEnunciado = new Map();
  const anota = (enunciado, correcta, quien) => {
    const k = normalizar(enunciado);
    if (!k) return;
    if (!porEnunciado.has(k)) porEnunciado.set(k, new Map());
    const m = porEnunciado.get(k);
    const r = normalizar(correcta);
    if (!m.has(r)) m.set(r, []);
    m.get(r).push(quien);
  };

  for (const b of banco) anota(b.enunciado, b.correcta, `banco:${b.id}`);
  for (const a of lote.actividades ?? []) {
    const correcta = (a.opciones ?? [])[a.indice_correcto];
    anota(a.enunciado, correcta, `lote:${a.concepto_id}`);

    // Unicidad DENTRO de la pregunta: ningún distractor puede ser cita literal
    // del mismo cotejo que sostiene la correcta.
    const falsosDistractores = distractoresQueTambienSonVerdad(a);
    if (falsosDistractores.length)
      rechazos.push({
        tipo: "unicidad-interna",
        concepto: a.concepto_id,
        enunciado: String(a.enunciado ?? "").slice(0, 60),
        motivo:
          `${falsosDistractores.length} distractor(es) son texto literal del mismo cotejo, ` +
          `así que también son verdad y la pregunta no tiene una sola respuesta buena: ` +
          falsosDistractores.map((o) => `«${String(o).slice(0, 50)}…»`).join(", "),
      });
  }

  // Solo interesan los enunciados que aparecen en el LOTE: el banco se compara
  // consigo mismo en la auditoría, no en cada carga.
  const delLote = new Set(
    (lote.actividades ?? []).map((a) => normalizar(a.enunciado)).filter(Boolean),
  );

  for (const k of delLote) {
    const respuestas = porEnunciado.get(k);
    if (!respuestas) continue;

    if (respuestas.size > 1) {
      // Mismo enunciado, respuestas distintas: contradicción. Fail-closed.
      const detalle = [...respuestas.entries()]
        .map(([r, quienes]) => `«${r.slice(0, 60)}» (${quienes.join(", ")})`)
        .join(" vs ");
      rechazos.push({
        tipo: "unicidad",
        enunciado: k.slice(0, 80),
        motivo: `mismo enunciado con ${respuestas.size} respuestas correctas distintas: ${detalle}. El enunciado no dice de cuál habla.`,
      });
      continue;
    }

    // Misma pregunta y misma respuesta en dos sitios: no engaña a nadie, pero
    // es trabajo duplicado y gasta presupuesto diario del opositor repitiéndole
    // lo mismo con otro id. Aviso, no rechazo.
    const quienes = [...respuestas.values()][0];
    if (quienes.length > 1)
      avisos.push({
        tipo: "unicidad",
        enunciado: k.slice(0, 80),
        aviso: `pregunta duplicada en ${quienes.length} sitios (${quienes.join(", ")}); misma respuesta, así que no contradice, pero sobra una`,
      });
  }

  return {
    ok: rechazos.length === 0,
    rechazos,
    avisos,
    resumen: `unicidad: ${rechazos.length} contradicciones, ${avisos.length} duplicados sobre ${delLote.size} enunciados del lote`,
  };
}

// --- Self-test: node verificar-unicidad.mjs ---
if (esEjecucionDirecta(import.meta.url)) {
  const banco = [
    { id: "ACOG-056", enunciado: "¿Cuándo entra en vigor el real decreto?", correcta: "el día siguiente al de su publicación" },
    { id: "X-1", enunciado: "¿Cuál es la capital del Estado?", correcta: "la villa de Madrid" },
  ];

  const caso = (nombre, actividades, bancoUsado = banco) => {
    const r = verificarUnicidad({ actividades }, bancoUsado);
    console.log(`${r.ok ? "✓" : "✗"} ${nombre}: ${r.resumen}`);
    for (const x of r.rechazos) console.log(`    ✗ ${x.motivo.slice(0, 110)}`);
    for (const x of r.avisos) console.log(`    · ${x.aviso.slice(0, 110)}`);
  };

  caso("contradice al banco", [
    { concepto_id: "CPOL-062", enunciado: "¿Cuándo entra en vigor el Real Decreto?", opciones: ["el mismo día de su publicación"], indice_correcto: 0 },
  ]);

  caso("se contradice dentro del lote", [
    { concepto_id: "A", enunciado: "¿Qué plazo tiene?", opciones: ["tres años"], indice_correcto: 0 },
    { concepto_id: "B", enunciado: "¿Qué plazo tiene?", opciones: ["dos años"], indice_correcto: 0 },
  ]);

  caso("duplicado inofensivo (misma respuesta)", [
    { concepto_id: "Y-1", enunciado: "¿Cuál es la capital del Estado?", opciones: ["la villa de Madrid"], indice_correcto: 0 },
  ]);

  caso("los números NO se normalizan", [
    { concepto_id: "ODS-4", enunciado: "¿Cuál es el enunciado del Objetivo 4?", opciones: ["educación de calidad"], indice_correcto: 0 },
    { concepto_id: "ODS-7", enunciado: "¿Cuál es el enunciado del Objetivo 7?", opciones: ["energía asequible"], indice_correcto: 0 },
  ], []);

  caso("lote limpio", [
    { concepto_id: "Z", enunciado: "¿Cuántas franjas tiene la bandera?", opciones: ["tres franjas horizontales"], indice_correcto: 0 },
  ]);

  // El caso real que destapó esta comprobación: los distractores son los otros
  // elementos de la misma enumeración, así que las cuatro opciones son verdad.
  caso("distractores sacados de la misma lista", [
    {
      concepto_id: "MININT-007",
      enunciado: "¿Qué órgano directivo depende de la Subsecretaría del Interior?",
      opciones: [
        "La Dirección General de Política Interior",
        "La Secretaría General Técnica del Ministerio",
        "La Dirección General de Tráfico",
        "La Dirección General de Apoyo a Víctimas del Terrorismo",
      ],
      indice_correcto: 0,
      cotejo: "de la que dependen los siguientes órganos directivos: 1.º La Secretaría General Técnica. 2.º La Dirección General de Política Interior. 3.º La Dirección General de Tráfico. 4.º La Dirección General de Apoyo a Víctimas del Terrorismo.",
    },
  ], []);

  caso("near-miss legítimo: se parece pero NO es la fuente", [
    {
      concepto_id: "OK",
      enunciado: "¿Qué gravedad tiene el abandono de servicio?",
      opciones: [
        "El abandono de servicio, salvo causa de fuerza mayor",
        "El abandono de servicio, salvo autorización del jefe de turno",
        "El abandono de servicio, salvo aviso en veinticuatro horas",
      ],
      indice_correcto: 0,
      cotejo: "f) El abandono de servicio, salvo causa de fuerza mayor que impida comunicar a un superior dicho abandono.",
    },
  ], []);
}
