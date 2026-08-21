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

// UNA COMPROBACIÓN QUE ESTUVO AQUÍ Y SE CAYÓ AL MEDIRLA
// -----------------------------------------------------------------------------
// Había aquí una segunda regla: «ningún distractor puede ser cita literal del
// mismo cotejo, porque entonces también es verdad y la pregunta no tiene una
// sola respuesta buena». Sonaba bien. Al pasarla sobre las 3.434 del banco dio
// **16 marcadas, y las 16 eran falsos positivos**. Ninguna verdadera.
//
// El razonamiento estaba mal de raíz: «el distractor es literal del cotejo» NO
// implica «el distractor también es verdad». El cotejo es un ARTÍCULO, y un
// artículo casi siempre contiene varias reglas; el enunciado elige una con un
// ordinal, un superlativo, un condicional o un verbo, y entonces las otras
// reglas del mismo artículo son los MEJORES distractores que existen, porque son
// las distinciones que pregunta el tribunal de verdad:
//
//   · «el TERCERO de los requisitos del estado de necesidad» (CP-020-5) — los
//     otros dos requisitos son literales y son falsos como tercero.
//   · «la cuota diaria de la multa, SALVO para personas jurídicas» (CP-050) — la
//     cuota de las personas jurídicas es literal y está excluida por el enunciado.
//   · «el plazo tras el Protocolo n.º 15» (CEDH-035) — «seis meses» es literal
//     porque el cotejo es el texto que lo DEROGA. Es un near-miss excelente.
//   · «¿quién incurre en la MISMA responsabilidad?» (DISC-004) — «los superiores
//     que la toleren» es literal, y el mismo cotejo dice que esos incurren en
//     falta de inferior grado.
//
// Y el caso que supuestamente la motivaba —MININT-007 vs MININT-023, los dos
// preguntando «¿qué órgano directivo depende de la Subsecretaría del Interior?»—
// resultó que esta regla NO lo detectaba: sus distractores no salen de su propio
// cotejo. Lo detecta la comprobación de abajo, la de enunciados contradictorios.
// Cero verdaderos positivos, dieciséis falsos, y el ejemplo que la justificaba
// era de la otra regla.
//
// El riesgo real existe, pero no es «el distractor es literal»: es «el enunciado
// no selecciona UNA sola regla del artículo». Eso es la comprobación de
// enunciado, no una de distractores. Se quita en vez de dejarla avisando: una
// puerta que se aprende a ignorar es peor que no tenerla.

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
  for (const a of lote.actividades ?? [])
    anota(a.enunciado, (a.opciones ?? [])[a.indice_correcto], `lote:${a.concepto_id}`);

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

  // EL CASO QUE MOTIVÓ TODO ESTO, y que demuestra qué comprobación lo caza.
  // Dos conceptos preguntando exactamente lo mismo y respondiendo cada uno un
  // elemento distinto de la misma enumeración: los dos son verdad, así que el
  // opositor no puede acertar sabiendo la norma. Lo detecta la comprobación de
  // ENUNCIADO —no una de distractores: fíjate en que los distractores de cada
  // uno (Policía, Guardia Civil…) ni siquiera salen de su cotejo.
  caso("dos conceptos, mismo enunciado, elementos distintos de la misma lista", [
    {
      concepto_id: "MININT-007",
      enunciado: "¿Qué órgano directivo depende de la Subsecretaría del Interior?",
      opciones: ["La Dirección General de Política Interior", "La Dirección General de la Policía"],
      indice_correcto: 0,
    },
    {
      concepto_id: "MININT-023",
      enunciado: "¿Qué órgano directivo depende de la Subsecretaría del Interior?",
      opciones: ["La Secretaría General Técnica", "La Dirección General de la Guardia Civil"],
      indice_correcto: 0,
    },
  ], []);

  // Los distractores SÍ pueden salir del mismo artículo, y de hecho son los
  // mejores que hay, siempre que el enunciado elija una sola regla. Aquí la
  // elige un ordinal. Medido sobre el banco: la regla contraria daba 16 falsos
  // positivos y ningún acierto. Ver la cabecera.
  caso("distractores del mismo artículo, enunciado que selecciona uno: VÁLIDO", [
    {
      concepto_id: "CP-020-5",
      enunciado: "¿Cuál es el TERCERO de los requisitos del estado de necesidad?",
      opciones: [
        "Que el necesitado no tenga, por su oficio o cargo, obligación de sacrificarse",
        "Que el mal causado no sea mayor que el que se trate de evitar",
        "Que la situación de necesidad no haya sido provocada intencionadamente por el sujeto",
      ],
      indice_correcto: 0,
      cotejo: "Primero. Que el mal causado no sea mayor que el que se trate de evitar. Segundo. Que la situación de necesidad no haya sido provocada intencionadamente por el sujeto. Tercero. Que el necesitado no tenga, por su oficio o cargo, obligación de sacrificarse.",
    },
  ], []);
}
