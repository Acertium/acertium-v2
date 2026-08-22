// Acertium — adaptador legal-es / sanear el corpus de defectos de captura
//
//   node adaptadores/legal-es/generador/sanear-corpus.mjs             (informa)
//   node adaptadores/legal-es/generador/sanear-corpus.mjs --escribir
//   node adaptadores/legal-es/generador/sanear-corpus.mjs --test
//
// Dos pasadas, las dos encontradas el 23/08/2026 al comparar el corpus contra el
// consolidado del BOE artículo por artículo. Ninguna de las dos toca el sentido:
// las dos quitan ruido de cómo se capturó el texto, no texto de la norma.
//
// (1) MARCAR LOS ARTÍCULOS INCOMPLETOS. El art. 70 del Reglamento General de
//     Circulación salía «modificado» y no lo estaba: nuestro texto lleva dentro
//     « [ . . . ]», la marca con la que el Código 600 señala los apartados que
//     se salta. Ese artículo NO es comparable —le faltan trozos por diseño— y
//     sin señalarlo el vigilante lo denunciaría como reforma en cada pasada. Son
//     25 artículos de 8 normas, con 13 preguntas colgando.
//
//     La marca se DEJA en el texto y se añade `parcial: true`. Quitarla
//     convertiría un artículo mutilado en uno aparentemente íntegro, que es el
//     error contrario y más difícil de ver.
//
// (2) QUITAR EL ESPACIO DELANTE DE UN SIGNO —y cerrar el guion de partición—. «armas de guerra ; y
//     de los Ministerios…» — 99 apariciones en 47 artículos de 13 secciones.
//     Sale de la ingesta de boe.es: donde el HTML llevaba una etiqueta en medio
//     («<a class="refPost">»), al retirarla queda un espacio suelto. En español
//     nunca va espacio delante de « . , ; : », así que el texto guardado NO es
//     literal — y el corpus es contra lo que las puertas comprueban que la
//     opción correcta de cada test es cita literal. Es decir: no es cosmética,
//     es un cotejo que puede fallar por un carácter que la norma no tiene.
//
//     Los puntos suspensivos y las líneas de puntos de un formulario («con fecha
//     .........») se respetan: ahí el espacio sí es del documento.
//
// Es idempotente: se puede volver a correr después de reingerir una sección.

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const CORPUS = "datos/legal-es/boe-600-pn/corpus";

// «[...]» y «[ . . . ]»: pdftotext reparte los puntos según el kerning del PDF,
// así que las dos formas conviven en el mismo corpus.
export const RE_OMISION_CORPUS = /\[\s*\.(?:\s*\.){1,}\s*\]/;

// Cerrada y en minúscula: si detrás del guion viene una de estas, el guion no
// es una palabra partida sino la marca de un morfema citado («por jen- o»).
const PALABRAS_GRAMATICALES = new Set([
  "o", "u", "y", "e", "ni", "que", "a", "ante", "con", "de", "del", "en", "para", "por", "sin", "sobre",
  "el", "la", "lo", "los", "las", "un", "una", "se", "su", "sus", "al", "es", "son",
]);

/**
 * Espacio delante de signo. El punto solo cuando NO forma parte de una serie
 * («fecha ........», «[ . . . ]»): ahí el espacio es del documento original.
 */
export function quitarEspacioAnteSigno(texto) {
  return String(texto ?? "")
    .replace(/\s+([;:,])/g, "$1")
    // Ni el carácter anterior ni el siguiente pueden ser otro punto: si no, el
    // último punto de « [ . . . ] » cumple la regla y la marca de omisión queda
    // deformada en «[ . .. ]». Lo cazó la propia autoprueba.
    .replace(/([^\s.])\s+\.(?!\s*\.)/g, "$1.");
}

/**
 * Guion de partición que quedó abierto: «contencioso- administrativo».
 *
 * SOLO PARA EL TEXTO DE ARTÍCULO DEL CORPUS, y esto no es una precaución
 * teórica. Las 41 apariciones del corpus se miraron una a una y todas son
 * partición de palabra («socio- sanitarios», «concurso- oposición»,
 * «duración- UE»). En texto libre NO se cumple, y al probarlo sobre los lotes
 * salieron tres casos en los que unir habría estropeado el contenido:
 *
 *   «las palabras que empiezan por jen- o terminan en -jero»   ← morfema citado
 *   «grados de gravedad -leves, graves y muy graves- que…»     ← guion de inciso
 *   «con ánimo de lucro -solo o en organización- la inmigración…»
 *
 * El primero es una opción del banco de ortografía: unir daba «jen-o» y la
 * pregunta dejaba de tener sentido. Por eso la lista de palabras gramaticales
 * de abajo, que ataja los tres — y por eso esta función no se aplica fuera del
 * corpus, donde el repaso a ojo sí se ha hecho.
 */
export function cerrarGuionDeParticion(texto) {
  return String(texto ?? "").replace(/(\w)-\s+(\w+)/g, (m, izq, der) =>
    PALABRAS_GRAMATICALES.has(der) ? m : `${izq}-${der}`,
  );
}

export function sanearCorpus({ escribir = false, dir = CORPUS } = {}) {
  const marcados = [];
  const limpiados = [];
  for (const f of readdirSync(dir).filter((f) => /^seccion-\d+\.json$/.test(f))) {
    const ruta = `${dir}/${f}`;
    const c = JSON.parse(readFileSync(ruta, "utf8"));
    // UNA SECCIÓN REINGERIDA DEL BOE NO SE SANEA. Esto limpia defectos de CAPTURA
    // —del PDF del Código 600, del raspado de boe.es—, y el consolidado no es una
    // captura: es el texto oficial. Sanearlo lo aparta de la fuente, que es
    // exactamente lo contrario de lo que se busca.
    //
    // No es hipotético: el BOE publica «libro- talonario» (RD 2822/1998, art. 45)
    // e «informe- propuesta» (RD 39/1997, art. 27) con el espacio. Al reingerir y
    // sanear después, esos dos artículos dejaban de coincidir con el BOE y el
    // vigilante los denunciaba como modificados en cada pasada.
    if (c.meta?.procedencia === "boe-consolidado") continue;
    let cambios = 0;
    for (const a of c.articulos ?? []) {
      const limpio = cerrarGuionDeParticion(quitarEspacioAnteSigno(a.texto));
      if (limpio !== a.texto) {
        limpiados.push({ f, ref: a.ref, referencia_boe: c.meta?.referencia_boe });
        a.texto = limpio;
        cambios++;
      }
      const parcial = RE_OMISION_CORPUS.test(a.texto ?? "");
      if (parcial && a.parcial !== true) { a.parcial = true; cambios++; marcados.push({ f, ref: a.ref, referencia_boe: c.meta?.referencia_boe }); }
      // Si dejó de estar incompleto (reingesta desde el consolidado), se retira
      // la marca: si no, el artículo quedaría fuera del diff para siempre.
      else if (!parcial && a.parcial === true) { delete a.parcial; cambios++; }
    }
    // Mismo formato que `corpus-desde-lotes.mjs`, para que el diff de git sean
    // las líneas tocadas y no el fichero entero.
    if (cambios && escribir) writeFileSync(ruta, JSON.stringify(c, null, 2) + "\n");
  }
  return { marcados, limpiados };
}

function autoprueba() {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)})`}`);
  };
  console.log("== espacio delante de signo ==");
  caso("punto y coma (Reglamento de Armas, art. 13)",
    quitarEspacioAnteSigno("cuando se trate de armas de guerra ; y de los Ministerios"),
    "cuando se trate de armas de guerra; y de los Ministerios");
  caso("coma (LO 1/2004, art. 12)",
    quitarEspacioAnteSigno("contra la Violencia sobre la Mujer , el Instituto"),
    "contra la Violencia sobre la Mujer, el Instituto");
  caso("punto", quitarEspacioAnteSigno("(Suprimido) ."), "(Suprimido).");
  caso("línea de puntos de un formulario: se respeta",
    quitarEspacioAnteSigno("firmado por España con fecha ........."),
    "firmado por España con fecha .........");
  caso("la marca de omisión no se toca",
    quitarEspacioAnteSigno("respectivos ámbitos. [ . . . ] LIBRO VII"),
    "respectivos ámbitos. [ . . . ] LIBRO VII");
  console.log("\n== guion de partición (solo para texto de artículo) ==");
  caso("se cierra la partición",
    cerrarGuionDeParticion("recurso contencioso- administrativo y socio- sanitarios"),
    "recurso contencioso-administrativo y socio-sanitarios");
  caso("morfema citado con guion colgante: NO se une",
    cerrarGuionDeParticion("las palabras que empiezan por jen- o terminan en -jero"),
    "las palabras que empiezan por jen- o terminan en -jero");
  caso("guion de inciso al cerrar: NO se une",
    cerrarGuionDeParticion("gravedad -leves, graves y muy graves- que determinan"),
    "gravedad -leves, graves y muy graves- que determinan");
  caso("«De xeno- y -fobia» del DLE: NO se une (lo estropeé el 23/08 y hubo que repararlo)",
    cerrarGuionDeParticion("De xeno- y -fobia. 1. f. Fobia a lo extranjero."),
    "De xeno- y -fobia. 1. f. Fobia a lo extranjero.");
  caso("guion de lista: el espacio es del documento",
    cerrarGuionDeParticion("obligaciones:\n- las de dar"), "obligaciones:\n- las de dar");
  caso("texto ya limpio no cambia",
    quitarEspacioAnteSigno("armas de guerra; y de los Ministerios, etc."),
    "armas de guerra; y de los Ministerios, etc.");

  console.log("\n== marca de omisión ==");
  caso("«[...]»", RE_OMISION_CORPUS.test("texto [...] más"), true);
  caso("«[ . . . ]»", RE_OMISION_CORPUS.test("texto [ . . . ] más"), true);
  caso("un corchete cualquiera no", RE_OMISION_CORPUS.test("texto [ver anexo] más"), false);

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test sanear-corpus: ${fallos ? "con fallos" : "OK"}`);
  return fallos;
}

if (esEjecucionDirecta(import.meta.url)) {
  if (process.argv.includes("--test")) process.exit(autoprueba() ? 1 : 0);
  const escribir = process.argv.includes("--escribir");
  const { marcados, limpiados } = sanearCorpus({ escribir });
  for (const t of limpiados) console.log(`  espacio ante signo · ${t.f} · ${t.referencia_boe} · art. ${t.ref}`);
  for (const t of marcados) console.log(`  omisión «[...]»     · ${t.f} · ${t.referencia_boe} · art. ${t.ref}`);
  console.log(`${limpiados.length} artículos limpiados · ${marcados.length} marcados como parciales${escribir ? "" : " (usa --escribir)"}`);
}
