// Acertium — adaptador legal-es / sacar los artículos de un PDF del BOE
//
//   node adaptadores/legal-es/generador/extraer-articulos-pdf.mjs <fichero.pdf>
//   node adaptadores/legal-es/generador/extraer-articulos-pdf.mjs <fichero.pdf> --json
//
// Necesita `pdftotext` (poppler-utils) en el PATH.
//
// PARA QUÉ. Para poder comparar lo que tenemos guardado con una captura nueva
// de la misma norma, artículo a artículo (`nucleo/comparar-articulos.mjs`). Sin
// esto, el «agente vigilante» solo puede decir «la norma cambió», y reaccionar a
// eso marcando los 388 conceptos del Código Penal es peor que no avisar.
//
// QUÉ FORMATO ENTIENDE. El de los códigos electrónicos del BOE, que es el del
// Código 600 y el de los consolidados descargados en PDF:
//
//     Artículo 1.
//     1. No será castigada ninguna acción ni omisión…
//     Artículo 31 bis.
//     …
//
// El mobiliario de página —cabecera repetida, «§ 35 …», «– 1003 –»— se tira.
// Son líneas que pdftotext intercala en mitad de una frase, así que si no se
// quitan aparecen DENTRO del texto del artículo y el diff las lee como reforma.
//
// LO QUE NO HACE. No entiende disposiciones ni anexos: el corpus tampoco los
// guarda como artículos (`RE_NO_ARTICULO` en `auditar-corpus.mjs` los manda a
// «no auditable»). Se cuentan aparte y se informan, para que no parezcan
// pérdidas silenciosas.

import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

// Mobiliario de página del código electrónico. Se quita ANTES de trocear.
const RUIDO = [
  /^NORMATIVA PARA INGRESO EN LA POLICÍA NACIONAL.*$/i,
  /^EJECUTIVA$/i,
  /^§\s*\d+\b.*$/,          // «§ 35 Ley Orgánica del Código Penal [parcial]»
  /^–\s*\d+\s*–$/,          // «– 1003 –»
  /^\s*$/,
];

// «Artículo 31 bis.» → ref «31 bis». También «Artículo 1.» y «Artículo 5.º»
//
// LA MAYÚSCULA NO ES COSMÉTICA, y esto costó 25 artículos truncados. pdftotext
// parte las líneas por donde cae el margen, y una remisión interna acaba a
// menudo en un renglón que es, literalmente, «artículo 92.»:
//
//   1. La pena de prisión permanente será revisada de conformidad con lo dispuesto en el
//   artículo 92.
//   La clasificación del condenado en el tercer grado…
//
// Con el modificador /i eso ES una cabecera: el parser abría un «artículo 92»
// falso y dejaba el 36 con 84 caracteres de 3.299. El BOE escribe las cabeceras
// capitalizadas y las remisiones en minúscula, así que la distinción sirve —y es
// la única señal disponible, porque por forma son idénticas.
const RE_ARTICULO =
  /^(?:Artículos?|ARTÍCULOS?)\s+(\d+)\s*(bis|ter|quater|quáter|quinquies|sexies|septies|octies|nonies|decies|BIS|TER|QUATER)?\s*\.?\s*(?:º|\.º)?\s*$/;

// Encabezados de estructura. CIERRAN el artículo en curso y abren tierra de
// nadie hasta el siguiente «Artículo N.».
//
// Esto costó 71 falsos positivos en la primera prueba. Entre el final de un
// artículo y el principio del siguiente el BOE mete el rótulo de la división
// —«TÍTULO I» / «De la infracción penal» / «CAPÍTULO I» / «De los delitos»— y el
// parser los pegaba al artículo anterior:
//
//   art. 9  corpus: «…más consecuencias de la infracción penal.»
//   art. 9  pdf   : «…más consecuencias de la infracción penal. TÍTULO I De la
//                    infracción penal CAPÍTULO I De los delitos»
//
// El diff los leía como reforma. Y ese es justo el error que un vigilante no se
// puede permitir: 71 artículos «modificados» que nadie tocó.
// El rótulo va SOLO en su línea y con numeral («TÍTULO I», «LIBRO II»,
// «TÍTULO PRELIMINAR», «Sección 1.ª»). Exigirlo entero evita el segundo exceso:
// con `\b` a secas, una línea de texto que empieza por «Capítulo VII del Título
// XXII…» —una remisión partida— también cortaba el artículo.
// Y las Secciones llevan la descripción EN LA MISMA LÍNEA («Sección 2.ª De las
// penas privativas de libertad»), mientras que LIBRO/TÍTULO/CAPÍTULO la ponen
// en la siguiente. Comprobado sobre el PDF entero: ninguna línea de texto
// corrido empieza por «Sección», así que admitir la cola es seguro aquí. Para
// los rótulos en versales se sigue exigiendo línea limpia, que es como vienen.
const RE_DIVISION =
  /^(?:(?:LIBRO|TÍTULO|TITULO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION|SUBSECCIÓN|SUBSECCION)\s+(?:[IVXLCDM]+|\d+\.?ª?|PRELIMINAR)\s*(?:BIS|TER)?\s*\.?\s*$|(?:Sección|Subsección)\s+(?:[IVXLCDM]+|\d+\.?ª?)(?:\s+bis|\s+ter)?\s+[A-ZÁÉÍÓÚ].*$)/;

// Marca de omisión del código electrónico. El Código 600 dice «[Inclusión
// parcial]» en portada y señala con «[...]» los trozos que se ha saltado DENTRO
// de un artículo. Un artículo con esa marca NO ES COMPARABLE contra el texto
// íntegro: le faltan apartados por diseño, y el diff lo leería como reforma.
//
// Se detectó porque cinco artículos discrepaban en exactamente 6 caracteres,
// que es lo que mide « [...]». Se quita del texto y se devuelve la lista aparte:
// recortarla y callar convertiría un artículo mutilado en uno comparable.
const RE_OMISION = /\s*\[\s*\.\.\.\s*\]\s*/g;

/**
 * @param {string} texto  salida de `pdftotext`
 * @returns {{articulos: Map<string,string>, parciales: Set<string>, descartadas: number}}
 */
export function articulosDesdeTexto(texto) {
  const lineas = String(texto ?? "").split("\n");
  const articulos = new Map();
  const parciales = new Set();
  let refActual = null;
  let buffer = [];
  let descartadas = 0;

  const cerrar = () => {
    if (refActual !== null) {
      const crudo = buffer.join(" ").replace(/\s+/g, " ").trim();
      if (RE_OMISION.test(crudo)) parciales.add(refActual);
      RE_OMISION.lastIndex = 0;
      articulos.set(refActual, crudo.replace(RE_OMISION, " ").replace(/\s+/g, " ").trim());
    }
    buffer = [];
  };

  for (const linea of lineas) {
    const l = linea.trim();
    if (RUIDO.some((re) => re.test(l))) { descartadas++; continue; }

    const m = RE_ARTICULO.exec(l);
    if (m) {
      cerrar();
      refActual = m[2] ? `${m[1]} ${m[2].toLowerCase().replace("quáter", "quater")}` : m[1];
      continue;
    }
    // Rótulo de división: cierra el artículo y deja de acumular hasta el
    // siguiente «Artículo N.». Así el título de la división y su descripción no
    // acaban dentro del artículo anterior.
    if (RE_DIVISION.test(l)) { cerrar(); refActual = null; continue; }

    if (refActual !== null) buffer.push(l);
  }
  cerrar();
  return { articulos, parciales, descartadas };
}

/** @param {string} ruta  PDF */
export function articulosDesdePdf(ruta) {
  if (!existsSync(ruta)) throw new Error(`no existe: ${ruta}`);
  const texto = execFileSync("pdftotext", [ruta, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return articulosDesdeTexto(texto);
}

// --- Self-test: node extraer-articulos-pdf.mjs --test ---
// Las tres trampas de abajo NO son hipotéticas: son los tres bugs que dieron
// 71, 25 y 6 falsos positivos al estrenar el diff contra el Código Penal, en ese
// orden. El texto sale del PDF real.
function autoprueba() {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)})`}`);
  };
  const arts = (t) => {
    const { articulos } = articulosDesdeTexto(t);
    return Object.fromEntries(articulos);
  };

  console.log("== trampa 1: el rótulo de división no es parte del artículo ==");
  caso("TÍTULO/CAPÍTULO entre artículos",
    arts("Artículo 9.\nSe aplicarán supletoriamente.\nTÍTULO I\nDe la infracción penal\nCAPÍTULO I\nDe los delitos\nArtículo 10.\nSon delitos las acciones."),
    { "9": "Se aplicarán supletoriamente.", "10": "Son delitos las acciones." });
  caso("Sección lleva la descripción en la MISMA línea",
    arts("Artículo 34.\nNo se reputarán penas.\nSección 2.ª De las penas privativas de libertad\nArtículo 35.\nSon penas privativas."),
    { "34": "No se reputarán penas.", "35": "Son penas privativas." });

  console.log("\n== trampa 2: «artículo 92.» en minúscula es una REMISIÓN, no una cabecera ==");
  caso("remisión partida por el margen",
    arts("Artículo 36.\n1. La pena será revisada de conformidad con lo dispuesto en el\nartículo 92.\nLa clasificación deberá ser autorizada."),
    { "36": "1. La pena será revisada de conformidad con lo dispuesto en el artículo 92. La clasificación deberá ser autorizada." });

  console.log("\n== trampa 3: «[...]» marca omisión, y ese artículo NO es comparable ==");
  const { articulos, parciales } = articulosDesdeTexto("Artículo 570.\nSerá castigado por tiempo de 12 a 20 años.\n[...]\nArtículo 571.\nEntero.");
  caso("la marca se retira del texto", articulos.get("570"), "Será castigado por tiempo de 12 a 20 años.");
  caso("y el artículo queda señalado", [...parciales], ["570"]);
  caso("el que no la lleva, no se señala", parciales.has("571"), false);

  console.log("\n== mobiliario de página ==");
  caso("cabecera, § y número de página fuera",
    arts("Artículo 1.\nNo será castigada.\nNORMATIVA PARA INGRESO EN LA POLICÍA NACIONAL ESCALAS BÁSICA Y\nEJECUTIVA\n§ 35 Ley Orgánica del Código Penal [parcial]\n– 1003 –\nninguna acción ni omisión."),
    { "1": "No será castigada. ninguna acción ni omisión." });

  console.log("\n== sufijos ==");
  caso("bis/ter se conservan en la ref",
    Object.keys(arts("Artículo 31 bis.\nUno.\nArtículo 31 ter.\nDos.")), ["31 bis", "31 ter"]);

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test extraer-articulos-pdf: ${fallos ? "con fallos" : "OK"}`);
  return fallos;
}

if (esEjecucionDirecta(import.meta.url)) {
  if (process.argv.includes("--test")) process.exit(autoprueba() ? 1 : 0);
  const ruta = process.argv[2];
  if (!ruta) {
    console.error("uso: node extraer-articulos-pdf.mjs <fichero.pdf> [--json] | --test");
    process.exit(2);
  }
  const { articulos, parciales, descartadas } = articulosDesdePdf(ruta);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ articulos: [...articulos].map(([ref, texto]) => ({ ref, texto })) }, null, 1));
  } else {
    console.log(`${articulos.size} artículos · ${parciales.size} con omisión «[...]» (NO comparables) · ${descartadas} líneas de mobiliario descartadas`);
    for (const [ref, t] of [...articulos].slice(0, 3)) console.log(`  art. ${ref}: ${t.slice(0, 90)}…`);
  }
}
