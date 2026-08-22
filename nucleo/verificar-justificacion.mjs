// Acertium — núcleo / ¿esta justificación enseña algo?
//
// QUÉ ES LA JUSTIFICACIÓN, DESPUÉS DEL 23/08/2026
// Un campo OPCIONAL. `actividad.justificacion` es NULL salvo que haya algo que
// merezca la pena saber sobre ESTA pregunta: la distinción que se probaba o el
// error típico. No es una etiqueta de procedencia — para eso están `articulo`,
// `cotejo_fuente` y el enlace «Ver fuente», que ya salen en pantalla.
//
// Regla de Jonathan: «no quiero relleno, solo información que valga la pena
// saber». Así que donde no hay nada que enseñar no se guarda nada. NULL no es
// una carencia que haya que rellenar: es la respuesta correcta la mayoría de
// las veces.
//
// PARA QUÉ SIRVE ESTE MÓDULO ENTONCES
// El runtime YA NO adivina: pinta la justificación si no es NULL, y punto. La
// señal está en el dato. Esto queda como PUERTA del contenido nuevo: si el
// motor (o una mano) escribe una justificación que es solo una cita, la puerta
// la retira antes de cargar, para que la columna no se vuelva a llenar de
// relleno. Se retira, no se rechaza el lote: una cita no es un error de
// contenido, es un campo que sobra. Rechazar el lote entero por eso también
// haría irreverificables los 110 lotes históricos, que se escribieron con el
// contrato viejo.
//
// LO QUE ESTA HEURÍSTICA NO SABE HACER, dicho claro: no distingue «enseña algo»
// de «repite la respuesta». «Art. 17.2 CE: la detención dura un máximo de
// setenta y dos horas» no es una cita, pero tampoco aporta — es el enunciado
// otra vez. Eso lo decide quien escribe, no una expresión regular. Por eso la
// limpieza del banco existente se hizo A MANO sobre las 101 supervivientes
// (ver `docs/las-dos-explicaciones.md`), y esto se queda solo como suelo.
//
//   import { justificacionAporta } from './verificar-justificacion.mjs'
//   node nucleo/verificar-justificacion.mjs        (self-test)

import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

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
//
// SEGUNDA CICATRIZ (23/08/2026). Se intentó ensanchar esta lista para pillar
// también «ITC 2, apartado 1 (…)» —sigla, número, coma—. La regla generalizada
// «token mayúsculo + hasta 3 tokens + coma» tumbaba una justificación buena de
// verdad: «Seis meses de parálisis, y solo si la culpa no es del expedientado…».
// Se dejó como estaba. Ensanchar esto tiene un coste asimétrico: un falso
// positivo BORRA una frase que enseñaba.
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
 * Conservadora HACIA CONSERVAR: en la duda devuelve `true` y el texto se queda.
 * Un falso negativo borra una frase buena; un falso positivo deja una cita de
 * más, que es molesto pero no destruye nada.
 *
 * @param {string|null|undefined} j
 * @returns {boolean}
 */
export function justificacionAporta(j) {
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

/**
 * Normaliza el campo para guardarlo: NULL si no aporta.
 * @param {string|null|undefined} j
 * @returns {string|null}
 */
export function justificacionParaGuardar(j) {
  return justificacionAporta(j) ? String(j).trim() : null;
}

// --- Self-test: node nucleo/verificar-justificacion.mjs ---
// Las cadenas NO están inventadas: salen del banco (22/08/2026), elegidas al
// azar dentro de cada tramo de longitud. Es la muestra que tumbó la primera
// versión de la heurística, que decidía por longitud y habría enseñado
// «INCIBE, Glosario de términos de ciberseguridad (2021), «Ciberdelincuente».»
// como si fuera una explicación.
if (esEjecucionDirecta(import.meta.url)) {
  // `false` = es una referencia, NO debe guardarse como justificación.
  const CITAS = [
    "Art. 13.1 EBEP.",
    "Art. 20.2.b LO 4/2015.",
    "Art. 50 LO 4/2000.",
    "Art. 23 Orden INT/859/2023.",
    "Art. 15 LO 4/2010.",
    "FSM, Carta de Principios (2001), punto 4.",
    "Red Hat, «Linux: qué es», GUI y línea de comandos.",
    "Resumen ejecutivo, cuarto capítulo.",
    "RAE-ASALE, DLE: «densidad de población».",
    "A/RES/70/1, Objetivos de Desarrollo Sostenible.",
    "INCIBE, Glosario de términos básicos de ciberseguridad, «Ransomware».",
    "INCIBE — Fases del proceso OSINT",
    "DGT, Manual II, tema 8, apartado 1.",
    "Anexo I, punto 3.3.1 (Revestimiento interior).",
    "RGV, clasificación por servicio, código 13.",
    "Britannica «criminology: Sociological theories» (anomia de Merton).",
    "FMI (2000), sección III: crecimiento desigual y ampliación de la brecha.",
    "INCIBE, Glosario de términos de ciberseguridad (2021), «Ciberdelincuente».",
    "Wikipedia (es), «Movimiento antiglobalización»: controversia del término. CONSENSO.",
  ];

  // Del banco también: las de DISC, escritas con la regla 10 del motor, «una
  // frase que enseña algo». `true` = merece la pena guardarla.
  const ENSENAN = [
    "Se castiga PARTICIPAR, no solo convocar, y basta el fin de alterar el normal funcionamiento: no se exige que llegue a alterarse la seguridad ciudadana.",
    "Seis meses de parálisis, y solo si la culpa no es del expedientado: quien retrasa su propio expediente no gana prescripción con ello.",
    "El encubrimiento aquí es por OMISIÓN: basta con callar. No hace falta ocultar pruebas ni ayudar al autor.",
    "Dos requisitos que hay que retener: reiteración y relación de servicio. Un acto aislado no encaja, y no exige relación jerárquica.",
    "DURANTE el servicio es muy grave. Fuera del servicio solo es grave, y con el requisito añadido de habitualidad (art. 8.p).",
    "Tres cifras que van juntas: la TERCERA falta, en TRES meses, y con las dos anteriores ya sancionadas en firme. Falla una y no es grave.",
    "Ocupar destino o no es lo que decide qué régimen se aplica: con destino, esta Ley Orgánica; sin destino, el general de la función pública.",
    "El reloj arranca con el traslado efectivo, no con la resolución ni con su firmeza.",
    "Ojo a dos que se cambian con facilidad: impulso DE OFICIO (no de parte) y PUBLICIDAD (no secreto de las actuaciones).",
    "La ley define la habitualidad con número y plazo: tres episodios en un año. No lo deja al criterio del instructor.",
    // Cita + frase: la referencia delante no la invalida, porque hay explicación detrás.
    "Art. 7 LO 4/2010. Se castiga participar, no solo convocar, y no se exige resultado.",
  ];

  let fallos = 0;
  const revisa = (lista, esperado, etiqueta) => {
    for (const t of lista) {
      const r = justificacionAporta(t);
      if (r !== esperado) {
        fallos++;
        console.log(`  ✗ ${etiqueta} mal clasificada (${r ? "se guardaría" : "se retiraría"}): ${t.slice(0, 78)}`);
      }
    }
  };

  revisa(CITAS, false, "CITA");
  revisa(ENSENAN, true, "EXPLICACIÓN");
  for (const t of [null, undefined, "", "   "]) {
    if (justificacionAporta(t) !== false) { fallos++; console.log("  ✗ vacío debería retirarse"); }
  }
  if (justificacionParaGuardar("Art. 15 LO 4/2010.") !== null) { fallos++; console.log("  ✗ una cita debe guardarse como NULL"); }
  if (justificacionParaGuardar(`  ${ENSENAN[0]}  `) !== ENSENAN[0]) { fallos++; console.log("  ✗ lo que aporta se guarda recortado"); }

  const n = CITAS.length + ENSENAN.length;
  console.log(
    fallos
      ? `✗ justificacionAporta: ${fallos} de ${n} mal`
      : `✓ justificacionAporta: ${n} cadenas reales del banco bien clasificadas (${CITAS.length} citas, ${ENSENAN.length} explicaciones)`,
  );
  console.log(`self-test verificar-justificacion: ${fallos ? "con fallos" : "OK"}`);
  process.exit(fallos ? 1 : 0);
}
