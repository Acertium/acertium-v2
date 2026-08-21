// Acertium — prueba de `justificacionAporta`
//
//   node lib/justificacion.test.mjs
//
// Las cadenas NO están inventadas: salen del banco (22/08/2026), elegidas al
// azar dentro de cada tramo de longitud. Es la muestra que tumbó la primera
// versión de la heurística, que decidía por longitud y habría enseñado
// «INCIBE, Glosario de términos de ciberseguridad (2021), «Ciberdelincuente».»
// como si fuera una explicación.

import { readFileSync } from "fs";

// Se lee el .ts y se le quitan los tipos: son dos anotaciones y así la prueba no
// necesita compilar nada ni añadir dependencias.
const src = readFileSync(new URL("./justificacion.ts", import.meta.url), "utf8")
  .replace(/export function justificacionAporta\([^)]*\): boolean/, "function justificacionAporta(j)")
  .replace(/^export /gm, "");
const justificacionAporta = new Function(`${src}; return justificacionAporta;`)();

// Del banco. `false` = es una referencia, NO debe enseñarse como explicación.
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

// Del banco también: las 23 de DISC escritas con la regla 10 del motor, «una
// frase que enseña algo». `true` = debe enseñarse.
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
      console.log(`  ✗ ${etiqueta} mal clasificada (${r ? "se enseñaría" : "se ocultaría"}): ${t.slice(0, 78)}`);
    }
  }
};

revisa(CITAS, false, "CITA");
revisa(ENSENAN, true, "EXPLICACIÓN");
for (const t of [null, undefined, "", "   "]) {
  if (justificacionAporta(t) !== false) { fallos++; console.log("  ✗ vacío debería ocultarse"); }
}

const n = CITAS.length + ENSENAN.length;
console.log(
  fallos
    ? `✗ justificacionAporta: ${fallos} de ${n} mal`
    : `✓ justificacionAporta: ${n} cadenas reales del banco bien clasificadas (${CITAS.length} citas, ${ENSENAN.length} explicaciones)`,
);
process.exit(fallos ? 1 : 0);
