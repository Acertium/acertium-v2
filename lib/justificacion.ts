// Acertium — qué se le enseña al opositor después de contestar
//
// Hay DOS textos, y confundirlos es lo que rompió esto:
//
//   · `concepto.explicacion`   — del CONCEPTO. Contexto general, el MISMO para
//     todas sus preguntas.
//   · `actividad.justificacion` — de ESTA pregunta. La distinción concreta que
//     se probaba, o el error típico.
//
// El runtime servía solo la primera. Con UNA pregunta por concepto colaba. Pero
// el motor de preguntas existe justamente para meter dos y tres por concepto, y
// ahí se ve. Caso real, DISC-020 (art. 15, prescripción):
//
//   pregunta 1  «¿En qué PLAZOS prescriben las faltas?»
//               → «El artículo 15 fija los plazos: tres años las muy graves…»  ✓
//   pregunta 2  «Una vez interrumpida, ¿cuándo se REANUDA la prescripción?»
//               → «El artículo 15 fija los plazos: tres años las muy graves…»  ✗
//
// A la segunda se le contesta con algo que no habla de lo que ha fallado. Y su
// justificación —«Seis meses de parálisis, y solo si la culpa no es del
// expedientado…»— estaba en la base, `cerebro.ts` la traía, y no se pintaba.
//
// POR QUÉ NO SE CAMBIA UNA POR OTRA. Medido sobre el banco: el 89 % (3.057 de
// 3.434) de las justificaciones son SOLO UNA CITA. Longitud mediana: 22
// caracteres, es decir «Art. 15 LO 4/2010.». Servir eso en vez de la explicación
// sería una regresión en nueve de cada diez preguntas, y duplicaría además lo que
// ya sale en «Ver fuente · art. 15». Se sirven las dos, y la justificación solo
// cuando aporta.

// CICATRIZ. La primera versión de esto decía «aporta si mide más de 45
// caracteres». Al contrastarla contra el banco real se cayó sola: las familias
// no-BOE citan largo.
//
//   «INCIBE, Glosario de términos de ciberseguridad (2021), «Ciberdelincuente».»   74
//   «FMI (2000), sección III: crecimiento desigual y ampliación de la brecha.»     72
//
// Las dos son referencias, y las dos habrían pasado. La longitud no es la señal:
// lo que distingue una cita de una frase que enseña es CÓMO EMPIEZA. Una cita
// abre con la fuente y su localizador; una explicación abre con el sujeto de lo
// que va a decir. Así que se detecta la cita, no la explicación.
const ARRANQUES_DE_CITA = [
  // Normativa: "Art. 15 LO 4/2010.", "Arts. 7 y 8 CE", "Artículo 3.2"
  /^(arts?|artículos?)\b/i,
  // Partes de un documento: "Anexo I, punto 3.3.1", "Resumen ejecutivo, cuarto
  // capítulo", "Preámbulo", "Cap. 2", "Disposición final"
  /^(anexo|ap(artado|do)?|cap(ítulo|\.)?|secc(ión|\.)?|punto|t[íi]tulo|disp(osición|\.)|preámbulo|resumen ejecutivo)\b/i,
  // Fuente institucional al principio, seguida de coma, guion o paréntesis:
  // "INCIBE, Glosario…", "DGT, Manual II…", "RAE-ASALE, DLE:…", "OIM, Glosario…",
  // "FMI (2000)…", "Red Hat, «Linux…»", "FSM, Carta de Principios…",
  // "Britannica «criminology…»", "Wikipedia (es), …", "Rosenberg y Hovland (1960)…"
  /^[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.-]*(\s+[yA-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.-]*){0,3}\s*[,(«—-]/,
  // Referencias de la ONU y similares: "A/RES/70/1, Objetivos…"
  /^[A-Z]\/[A-Z]+\//,
  // Códigos y siglas sueltas con localizador: "RGV, clasificación por servicio"
  /^[A-ZÁÉÍÓÚÑ]{2,}\b\s*[,:]/,
];

/**
 * ¿Esta justificación enseña algo, o es una referencia disfrazada?
 *
 * Conservadora HACIA OCULTAR. Un falso negativo esconde una frase buena y deja
 * al opositor como está hoy; un falso positivo le enseña «INCIBE, Glosario…»
 * creyendo que es una explicación, que es peor y además parece una errata.
 *
 * Esto es un parche mientras la señal no esté en el dato. Lo que hay que hacer
 * de verdad es guardar QUÉ ES cada justificación en el momento de escribirla
 * —el motor ya tiene la regla 10, «una frase que enseña algo»— en vez de
 * adivinarlo después de una cadena de texto. Ver `docs/las-dos-explicaciones.md`.
 */
export function justificacionAporta(j: string | null | undefined): boolean {
  const t = String(j ?? "").trim();
  if (!t) return false;

  // Empieza como una referencia. Se salva solo si DETRÁS hay una explicación de
  // verdad: "Art. 7 LO 4/2010. Se castiga participar, no solo convocar." aporta.
  //
  // No basta con que haya una segunda frase, y esto también tiene cicatriz:
  // «Wikipedia (es), «Movimiento antiglobalización»: controversia del término.
  // CONSENSO.» tiene dos, pero la segunda es una MARCA de tipo de fuente, no una
  // explicación. Así que el resto tiene que dar por sí solo para explicar algo.
  if (ARRANQUES_DE_CITA.some((re) => re.test(t))) {
    const resto = t.slice((t.split(/(?<=\.)\s+/)[0] ?? t).length).trim();
    if (resto.length < 45) return false;
  }

  // Por debajo de esto no cabe una explicación, cite o no cite.
  return t.length >= 45;
}
