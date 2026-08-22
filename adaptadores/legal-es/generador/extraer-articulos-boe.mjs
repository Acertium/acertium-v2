// Acertium — adaptador legal-es / sacar los artículos del consolidado del BOE
//
//   node adaptadores/legal-es/generador/extraer-articulos-boe.mjs BOE-A-2003-23514
//   node ... BOE-A-2003-23514 --fecha 2026-08-22 --guardar datos/fuentes/x/norma.xml
//   node ... --xml fichero.xml --json
//   node ... --test
//
// PARA QUÉ. Es la otra mitad del diff por artículo (`nucleo/comparar-articulos.mjs`).
// El PDF del Código 600 sirve como segunda captura, pero es «[Inclusión parcial]»
// y no dice CUÁNDO cambió cada artículo. El consolidado del BOE sí, y por eso es
// la fuente buena para el vigilante:
//
//   <bloque id="a69" tipo="precepto" titulo="Artículo 69">
//     <version id_norma="BOE-A-2003-23514" fecha_vigencia="20040123"> … </version>
//     <version id_norma="BOE-A-2025-12199" fecha_vigencia="20250701"> … </version>
//     <version id_norma="BOE-A-2026-13889" fecha_vigencia="20261001"> … </version>
//
// Cada artículo lleva su propio historial fechado. Eso permite responder «qué
// artículos cambiaron desde nuestra captura» sin comparar 723 textos.
//
// LA TRAMPA, Y ES LA IMPORTANTE: PUBLICADO ≠ EN VIGOR
// El consolidado incluye versiones que AÚN NO ESTÁN EN VIGOR. En el Reglamento
// General de Circulación, a 22/08/2026, la última versión del art. 69 es la del
// RD 518/2026 —publicado el 26/06/2026— que entra en vigor el 1 de OCTUBRE. El
// BOE la deja ya escrita y mete la redacción vigente en un <blockquote> que
// «caduca="20261001"».
//
// Es decir: quien coja «la última versión» le está enseñando al opositor un
// texto que hoy no es Derecho. Si el examen cae antes del 1 de octubre, la
// respuesta correcta es la ANTERIOR. Por eso aquí se elige la versión por
// `fecha_vigencia <= fecha de corte`, y las posteriores se devuelven aparte en
// `futuros` — que es justamente lo que el planificador necesita saber para
// avisar «esto cambia el 1 de octubre», no para apagarlo hoy.
//
// LO QUE NO EXTRAE. Disposiciones, anexos y preámbulo: el corpus tampoco los
// guarda como artículos. Se cuentan aparte (`otros`) para que no parezcan
// pérdidas silenciosas. Las imágenes (señales de tráfico) tampoco tienen texto;
// se cuentan en `imagenes` por lo mismo.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

const API = "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id";

// «Artículo 14 bis» → «14 bis»; «Artículo 5.º» → «5». Igual que el extractor de
// PDF, para que las dos capturas usen la misma clave.
//
// EL BOE NUMERA CON LETRA, Y ESO COSTÓ 11 NORMAS ENTERAS. En el primer barrido
// completo (23/08/2026), once normas dieron «0 iguales» y todos sus artículos
// «sin equivalente»: la LOPJ con 210, el Código Civil con 160, la LO 2/1986 de
// FCSE con 54… Ninguna había cambiado. Lo que pasa es que las leyes antiguas
// llevan el ordinal escrito —«Artículo cincuenta y cuatro»— mientras nuestro
// corpus usa «54». Son 1.048 preceptos de 7.030, el 15 %.
//
// Y el fallo era MUDO en la dirección peligrosa: «0 modificados» se lee como
// «todo en orden», cuando lo que había era «no he comparado nada».
// Y ADEMÁS PUEDE LLEVAR LETRA AL FINAL: «Artículo 588 bis a». La LECrim numera
// así todo el capítulo de interceptación de comunicaciones y registro de
// dispositivos —588 bis a … 588 septies c—, que es materia de examen. Son 69
// preceptos en el corpus de normas y 51 cotejos nuestros apuntan a ellos;
// hasta el 23/08/2026 ninguno se podía comprobar contra el BOE.
const RE_TITULO_ARTICULO =
  /^(?:Artículos?|Art\.?)\s+(\d+|[a-zá-úñ]+(?:\s+(?:y\s+)?[a-zá-úñ]+)*?)\s*(bis|ter|quater|quáter|quinquies|sexies|septies|octies|nonies|decies)?\s*([a-z])?\s*\.?\s*(?:º|\.º)?\s*$/i;

// Numeral español → número. Cubre 1–999, que es lo que hace falta: el artículo
// escrito con letra más alto del corpus es «seiscientos cuarenta y dos» (LOPJ).
// Ordinales solo hasta «duodécimo», que es hasta donde los usa el BOE; de ahí en
// adelante escribe el cardinal («Artículo cincuenta y cuatro», no «quincuagésimo
// cuarto»).
const UNIDADES = {
  uno: 1, primero: 1, primer: 1, dos: 2, segundo: 2, tres: 3, tercero: 3, tercer: 3,
  cuatro: 4, cuarto: 4, cinco: 5, quinto: 5, seis: 6, sexto: 6, siete: 7, séptimo: 7, septimo: 7,
  ocho: 8, octavo: 8, nueve: 9, noveno: 9, diez: 10, décimo: 10, decimo: 10,
  once: 11, undécimo: 11, undecimo: 11, doce: 12, duodécimo: 12, duodecimo: 12,
  trece: 13, catorce: 14, quince: 15,
  dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidós: 22, veintidos: 22, veintitrés: 23, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiséis: 26, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29,
};
const DECENAS = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const CENTENAS = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

/** «cincuenta y cuatro» → 54. Devuelve null si no es un numeral entendible. */
export function numeroDesdePalabras(s) {
  const txt = String(s ?? "").toLowerCase().trim();
  if (/^\d+$/.test(txt)) return Number(txt);
  const palabras = txt.split(/\s+/).filter((p) => p && p !== "y");
  if (!palabras.length) return null;
  let total = 0;
  for (const p of palabras) {
    if (CENTENAS[p] !== undefined) total += CENTENAS[p];
    else if (DECENAS[p] !== undefined) total += DECENAS[p];
    else if (UNIDADES[p] !== undefined) total += UNIDADES[p];
    else return null; // «único», «preliminar», o algo que no es un número
  }
  return total || null;
}

// Párrafos que NO son texto de la norma: la nota editorial del BOE («Se modifica
// por el art. único.8 del Real Decreto 465/2025…») y los rótulos de división,
// que en el XML viven en su propio bloque pero pueden colarse.
const CLASES_NO_TEXTO = new Set([
  "nota_pie", "nota_pie_2", "siempreSeVe",
  "titulo", "titulo_num", "titulo_tit", "capitulo", "capitulo_num", "capitulo_tit",
  "seccion", "subseccion", "libro", "anexo", "anexo_num", "anexo_tit",
]);

function desescapar(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Texto de una <version>, ya limpio.
 *
 * Se tiran los <blockquote> ENTEROS antes de nada. En el XML del BOE ahí es
 * donde vive el aparato editorial: la nota de modificación y —lo que de verdad
 * importa— la «Redacción anterior» de una reforma futura, que es texto de la
 * norma pero de OTRA fecha. Dejarlo dentro mezcla dos redacciones en el mismo
 * artículo y el diff lo lee como reforma.
 */
function textoDeVersion(xmlVersion) {
  const sinCitas = xmlVersion
    .replace(/<blockquote\b[\s\S]*?<\/blockquote>/g, " ")
    // Los <a class="refPost"> son enlaces editoriales del BOE («Ref.
    // BOE-A-2015-11722#daprimera») y aparecen DENTRO del párrafo. Hay que
    // borrarlos enteros, contenido incluido: quitando solo la etiqueta, el
    // «#aunico» del art. 517 CP se quedaba pegado al texto y el diff lo leía
    // como reforma. Se detectó así, comparando el Código Penal contra sí mismo.
    .replace(/<a\b[^>]*class="ref[^"]*"[^>]*>[\s\S]*?<\/a>/g, " ");
  let imagenes = 0;
  const trozos = [];
  const RE_P = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = RE_P.exec(sinCitas))) {
    const clase = (/class="([^"]*)"/.exec(m[1]) ?? [])[1] ?? "";
    if (clase === "imagen") { imagenes++; continue; }
    if (CLASES_NO_TEXTO.has(clase)) continue;
    // Las etiquetas de dentro se sustituyen por espacio, no se borran: pegar
    // «…castigado<em>gravemente</em>» sin separador junta dos palabras. Pero eso
    // deja « .» donde la etiqueta iba antes de un signo, y el diff lo canta como
    // reforma —así salieron «(Suprimido) .» del art. 88 CP y otros 20—. El BOE
    // nunca escribe un espacio delante de un signo de puntuación, así que
    // quitarlo es seguro.
    const texto = desescapar(m[2].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .replace(/\s+([.,;:)\]])/g, "$1")
      .trim();
    if (texto) trozos.push({ clase, texto });
  }
  return { trozos, imagenes };
}

/**
 * @param {string} xml   respuesta de …/legislacion-consolidada/id/<ID>/texto
 * @param {{aFecha?: string}} opciones  fecha de corte «YYYY-MM-DD» (por defecto, hoy)
 * @returns {{articulos: Map<string,string>, futuros: Array, otros: string[], imagenes: number, sinVigente: string[]}}
 */
export function articulosDesdeConsolidado(xml, { aFecha } = {}) {
  const corte = (aFecha ?? new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const articulos = new Map();
  const futuros = [];
  const otros = [];
  const sinVigente = [];
  let imagenes = 0;

  const RE_BLOQUE = /<bloque\b([^>]*)>([\s\S]*?)<\/bloque>/g;
  let b;
  while ((b = RE_BLOQUE.exec(xml))) {
    const attrs = b[1];
    if (!/tipo="precepto"/.test(attrs)) continue;
    const titulo = desescapar((/titulo="([^"]*)"/.exec(attrs) ?? [])[1] ?? "");
    const t = RE_TITULO_ARTICULO.exec(titulo);
    const numero = t ? numeroDesdePalabras(t[1]) : null;
    if (numero === null) { otros.push(titulo); continue; }
    const sufijo = [t[2]?.toLowerCase().replace("quáter", "quater"), t[3]?.toLowerCase()].filter(Boolean).join(" ");
    const ref = sufijo ? `${numero} ${sufijo}` : String(numero);

    const versiones = [];
    const RE_V = /<version\b([^>]*)>([\s\S]*?)<\/version>/g;
    let v;
    while ((v = RE_V.exec(b[2]))) {
      versiones.push({
        norma: (/id_norma="([^"]*)"/.exec(v[1]) ?? [])[1] ?? "",
        publicacion: (/fecha_publicacion="(\d+)"/.exec(v[1]) ?? [])[1] ?? "",
        vigencia: (/fecha_vigencia="(\d+)"/.exec(v[1]) ?? [])[1] ?? "",
        cuerpo: v[2],
      });
    }
    versiones.sort((x, y) => x.vigencia.localeCompare(y.vigencia));

    const enVigor = versiones.filter((x) => x.vigencia && x.vigencia <= corte).at(-1);
    for (const x of versiones) if (x.vigencia > corte) futuros.push({ ref, norma: x.norma, vigencia: x.vigencia, publicacion: x.publicacion });
    if (!enVigor) { sinVigente.push(ref); continue; }

    const { trozos, imagenes: img } = textoDeVersion(enVigor.cuerpo);
    imagenes += img;
    // El <p class="articulo"> es «Artículo 67. Vehículos prioritarios.»: se le
    // quita el localizador y se queda la rúbrica, que es como lo guarda el
    // corpus y como sale del PDF (allí la cabecera va en su propia línea).
    // El encabezado se quita con el localizador QUE TRAE ESTE bloque, no con un
    // patrón genérico: viene tanto «Artículo 67.» como «Artículo cincuenta y
    // cuatro.», y un patrón que acepte palabras sueltas se comería la rúbrica.
    // Y admite las DOS formas del localizador. En la LOPJ el atributo dice
    // «Artículo quinientos cuarenta y uno» pero el párrafo de dentro dice
    // «Artículo 541.»: con una sola forma, los 207 artículos de la LOPJ salían
    // «modificados» por llevar su propia cabecera pegada delante.
    const reEncabezado = new RegExp(
      `^(?:Art\\u00edculos?|Art\\.?)\\s+(?:${escapar(t[1])}|${numero})${t[2] ? `\\s+${escapar(t[2])}` : ""}${t[3] ? `\\s+${escapar(t[3])}` : ""}\\s*\\.?\\s*(?:\\u00ba|\\.\\u00ba)?\\s*`,
      "i",
    );
    // La rúbrica se cierra con punto. El BOE la deja sin él («…y planificación de
    // la actividad preventiva») y el corpus lo pone, así que sin esto el art. 16
    // de la LPRL —y otra decena— discrepan en un carácter que no es de la norma
    // sino de cómo se pega la rúbrica al cuerpo.
    const partes = trozos.map(({ clase, texto }) => {
      if (clase !== "articulo") return texto;
      const rubrica = texto.replace(reEncabezado, "").trim();
      return rubrica && !/[.:;!?]$/.test(rubrica) ? `${rubrica}.` : rubrica;
    });
    articulos.set(ref, partes.join(" ").replace(/\s+/g, " ").trim());
  }

  return { articulos, futuros, otros, imagenes, sinVigente, corte };
}

const escapar = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

/**
 * Descarga el consolidado. Devuelve el XML CRUDO, no el parseado: lo que se
 * versiona en el repo (regla de Jonathan del 23/08/2026) es el documento tal
 * cual llegó, no nuestra lectura de él.
 *
 * Detrás de un proxy —los contenedores de agente lo llevan— el `fetch` de Node
 * IGNORA `HTTPS_PROXY` y sale directo; el BOE responde 403 a eso. No es una
 * denegación del proxy (el status endpoint no registra nada), así que el
 * mensaje lo dice, porque el 403 a secas manda a buscar donde no es.
 */
export async function descargarConsolidado(id) {
  let r;
  try {
    r = await fetch(`${API}/${id}/texto`, { headers: { Accept: "application/xml" } });
  } catch (e) {
    throw new Error(`BOE ${id}: ${e.message}${pistaProxy()}`);
  }
  // 404 aquí no es un fallo: es que esa referencia NO TIENE texto consolidado.
  // Les pasa a los cuatro tratados del corpus (Convención contra la Tortura,
  // Protocolos del CEDH…), que el BOE publica pero no consolida. Decirlo con esas
  // palabras evita que cada barrido parezca que se ha roto.
  if (r.status === 404) throw new Error(`BOE ${id}: sin texto consolidado (el BOE no consolida esta referencia)`);
  if (!r.ok) throw new Error(`BOE ${id}: HTTP ${r.status}${r.status === 403 ? pistaProxy() : ""}`);
  return await r.text();
}

function pistaProxy() {
  return process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY
    ? "\n  (hay HTTPS_PROXY pero el fetch de Node no lo usa: reintenta con NODE_USE_ENV_PROXY=1)"
    : "";
}

// --- Self-test ---
// El caso de abajo es el art. 69 del Reglamento General de Circulación tal cual
// venía el 22/08/2026, recortado. Es el que enseñó la trampa: la última versión
// del XML NO es la vigente.
function autoprueba() {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)})`}`);
  };

  const XML = `<response><data><texto>
    <bloque id="a69" tipo="precepto" titulo="Artículo 69">
      <version id_norma="BOE-A-2003-23514" fecha_publicacion="20031223" fecha_vigencia="20040123">
        <p class="articulo">Artículo 69. Comportamiento de los dem&#225;s conductores.</p>
        <p class="parrafo">Luz amarilla hacia adelante.</p>
      </version>
      <version id_norma="BOE-A-2025-12199" fecha_publicacion="20250617" fecha_vigencia="20250701">
        <p class="articulo">Artículo 69. Comportamiento de los dem&#225;s conductores.</p>
        <p class="parrafo">Luz roja hacia adelante.</p>
        <blockquote><p class="nota_pie">Se modifica por el art. único.8 del RD 465/2025. <a class="refPost">Ref. BOE-A-2025-12199</a></p></blockquote>
      </version>
      <version id_norma="BOE-A-2026-13889" fpub="" fecha_publicacion="20260626" fecha_vigencia="20261001">
        <p class="articulo">Artículo 69. Comportamiento de los dem&#225;s conductores.</p>
        <p class="parrafo">Luz roja hacia adelante, conforme al artículo 32.</p>
        <blockquote caduca="20261001" class="soloTexto">
          <p class="cita_con_pleca">Redacción anterior:</p>
          <p class="parrafo">"Luz roja hacia adelante."</p>
        </blockquote>
        <blockquote><p class="nota_pie">Se modifica con efectos de 1 de octubre de 2026.</p></blockquote>
      </version>
    </bloque>
    <bloque id="a70" tipo="precepto" titulo="Artículo 70">
      <version id_norma="BOE-A-2003-23514" fecha_publicacion="20031223" fecha_vigencia="20040123">
        <p class="articulo">Artículo 70. Veh&#237;culos no prioritarios.</p>
        <p class="imagen"><img class="frame" src="x.png"/></p>
        <p class="parrafo">Uno.</p>
      </version>
    </bloque>
    <bloque id="a14bis" tipo="precepto" titulo="Artículo 14 bis">
      <version id_norma="BOE-A-2026-12035" fecha_publicacion="20260605" fecha_vigencia="20260606">
        <p class="articulo">Artículo 14 bis. Nuevo.</p><p class="parrafo">Texto.</p>
      </version>
    </bloque>
    <bloque id="dfprimera" tipo="precepto" titulo="Disposición final primera">
      <version id_norma="BOE-A-2003-23514" fecha_publicacion="20031223" fecha_vigencia="20040123"><p class="parrafo">No es artículo.</p></version>
    </bloque>
  </texto></data></response>`;

  console.log("== publicado ≠ en vigor (la trampa que motivó esto) ==");
  const hoy = articulosDesdeConsolidado(XML, { aFecha: "2026-08-22" });
  caso("a 22/08/2026 rige la redacción de 2025, no la publicada el 26/06",
    hoy.articulos.get("69"), "Comportamiento de los demás conductores. Luz roja hacia adelante.");
  caso("y la futura se informa aparte, no se sirve",
    hoy.futuros.filter((f) => f.ref === "69").map((f) => `${f.norma}@${f.vigencia}`), ["BOE-A-2026-13889@20261001"]);

  const octubre = articulosDesdeConsolidado(XML, { aFecha: "2026-10-01" });
  caso("el 1 de octubre ya rige la nueva",
    octubre.articulos.get("69"), "Comportamiento de los demás conductores. Luz roja hacia adelante, conforme al artículo 32.");
  caso("y ya no queda nada en futuros", octubre.futuros.length, 0);

  const antes = articulosDesdeConsolidado(XML, { aFecha: "2025-01-01" });
  caso("con fecha vieja, la redacción vieja",
    antes.articulos.get("69"), "Comportamiento de los demás conductores. Luz amarilla hacia adelante.");

  console.log("\n== el aparato editorial no es texto de la norma ==");
  caso("la nota «Se modifica por…» no entra", /Se modifica/.test(hoy.articulos.get("69")), false);
  caso("la «Redacción anterior» de una reforma futura tampoco",
    (octubre.articulos.get("69").match(/Luz roja/g) ?? []).length, 1);

  console.log("\n== lo que no es artículo se cuenta, no se pierde en silencio ==");
  caso("las disposiciones van a «otros»", hoy.otros, ["Disposición final primera"]);
  caso("las imágenes se cuentan", hoy.imagenes, 1);
  caso("y el artículo con imagen conserva su texto", hoy.articulos.get("70"), "Vehículos no prioritarios. Uno.");

  console.log("\n== sufijos y entidades ==");
  caso("«Artículo 14 bis» → ref «14 bis»", hoy.articulos.has("14 bis"), true);
  // La LECrim numera así todo el capítulo de intervención de comunicaciones.
  const LETRA_FINAL = `<bloque id="a588bisa" tipo="precepto" titulo="Artículo 588 bis a">
      <version id_norma="X" fecha_publicacion="20151006" fecha_vigencia="20151206">
        <p class="articulo">Artículo 588 bis a. Principios rectores.</p><p class="parrafo">1. Durante la instrucción.</p></version></bloque>`;
  const conLetraFinal = articulosDesdeConsolidado(LETRA_FINAL, { aFecha: "2026-08-22" });
  caso("«Artículo 588 bis a» → ref «588 bis a»",
    conLetraFinal.articulos.get("588 bis a"), "Principios rectores. 1. Durante la instrucción.");
  caso("las entidades XML se desescapan", /demás/.test(hoy.articulos.get("69")), true);

  console.log("\n== el BOE numera con letra en las leyes antiguas ==");
  // 1.048 preceptos de 7.030 (el 15 %) vienen así. Sin esto, once normas daban
  // «0 modificados» porque no se comparaba NADA — el fallo mudo peligroso.
  caso("cardinal compuesto", numeroDesdePalabras("cincuenta y cuatro"), 54);
  caso("ordinal", numeroDesdePalabras("primero"), 1);
  caso("centenas (el más alto del corpus, LOPJ)", numeroDesdePalabras("seiscientos cuarenta y dos"), 642);
  caso("«ciento dos»", numeroDesdePalabras("ciento dos"), 102);
  caso("sin acento, como lo escribe a veces el BOE", numeroDesdePalabras("veintidos"), 22);
  caso("«único» NO es un número", numeroDesdePalabras("único"), null);
  caso("cifra tal cual", numeroDesdePalabras("47"), 47);

  const LETRA = `<bloque id="acincuentaycuatro" tipo="precepto" titulo="Artículo cincuenta y cuatro">
      <version id_norma="X" fecha_publicacion="19860314" fecha_vigencia="19860404">
        <p class="articulo">Artículo cincuenta y cuatro. Policías locales.</p><p class="parrafo">Texto.</p></version></bloque>
    <bloque id="aunico" tipo="precepto" titulo="Artículo único">
      <version id_norma="X" fecha_publicacion="19860314" fecha_vigencia="19860404"><p class="parrafo">Otro.</p></version></bloque>
    <bloque id="art7" tipo="precepto" titulo="Art 7">
      <version id_norma="X" fecha_publicacion="18890724" fecha_vigencia="18890724"><p class="parrafo">Código Civil.</p></version></bloque>`;
  const conLetra = articulosDesdeConsolidado(LETRA, { aFecha: "2026-08-22" });
  caso("«Artículo cincuenta y cuatro» → ref «54»", conLetra.articulos.get("54"), "Policías locales. Texto.");
  // La LOPJ rotula el bloque con letra y el párrafo con cifra. Las 207
  // discrepancias que dio la primera pasada eran justo esto.
  const MIXTO = `<bloque id="a541" tipo="precepto" titulo="Artículo quinientos cuarenta y uno">
      <version id_norma="X" fecha_publicacion="19850702" fecha_vigencia="19850703">
        <p class="articulo">Artículo 541. El Ministerio Fiscal.</p><p class="parrafo">Uno.</p></version></bloque>`;
  caso("rótulo con letra y párrafo con cifra: la cabecera se quita igual",
    articulosDesdeConsolidado(MIXTO, { aFecha: "2026-08-22" }).articulos.get("541"), "El Ministerio Fiscal. Uno.");
  caso("«Art 7» (Código Civil) también", conLetra.articulos.get("7"), "Código Civil.");
  caso("«Artículo único» va a otros, no a articulos", conLetra.otros, ["Artículo único"]);

  console.log("\n== los enlaces editoriales del BOE no son texto ==");
  const REF = `<bloque id="a517" tipo="precepto" titulo="Artículo 517">
      <version id_norma="X" fecha_publicacion="19951124" fecha_vigencia="19960524">
      <p class="parrafo">Serán castigados conforme al <a class="refPost">Ref. BOE-A-2015-11722#aunico</a>.</p></version></bloque>`;
  caso("«#aunico» no se queda pegado al texto, y no deja un espacio antes del punto",
    articulosDesdeConsolidado(REF, { aFecha: "2026-08-22" }).articulos.get("517"), "Serán castigados conforme al.");

  console.log("\n== la rúbrica se cierra con punto ==");
  const RUB = `<bloque id="a16" tipo="precepto" titulo="Artículo 16">
      <version id_norma="X" fecha_publicacion="19951110" fecha_vigencia="19960211">
      <p class="articulo">Artículo 16. Plan de prevención y planificación de la actividad preventiva</p>
      <p class="parrafo">1. La prevención deberá integrarse.</p></version></bloque>`;
  caso("el BOE la deja sin punto y el corpus lo lleva: se iguala al pegar",
    articulosDesdeConsolidado(RUB, { aFecha: "2026-08-22" }).articulos.get("16"),
    "Plan de prevención y planificación de la actividad preventiva. 1. La prevención deberá integrarse.");

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test extraer-articulos-boe: ${fallos ? "con fallos" : "OK"}`);
  return fallos;
}

if (esEjecucionDirecta(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.includes("--test")) process.exit(autoprueba() ? 1 : 0);

  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const rutaXml = opt("--xml");
  const id = argv.find((a) => /^BOE-A-\d{4}-\d+$/.test(a));
  if (!rutaXml && !id) {
    console.error("uso: node extraer-articulos-boe.mjs <BOE-A-...> [--fecha YYYY-MM-DD] [--guardar ruta.xml] [--json] | --xml f.xml | --test");
    process.exit(2);
  }

  const xml = rutaXml ? readFileSync(rutaXml, "utf8") : await descargarConsolidado(id);
  const guardar = opt("--guardar");
  if (guardar) {
    mkdirSync(dirname(guardar), { recursive: true });
    writeFileSync(guardar, xml);
    console.log(`guardado ${guardar} (${xml.length} bytes)`);
  }

  const r = articulosDesdeConsolidado(xml, { aFecha: opt("--fecha") });
  if (argv.includes("--json")) {
    console.log(JSON.stringify({
      corte: r.corte,
      articulos: [...r.articulos].map(([ref, texto]) => ({ ref, texto })),
      futuros: r.futuros,
    }, null, 1));
  } else {
    console.log(`corte ${r.corte} · ${r.articulos.size} artículos en vigor · ${r.futuros.length} versiones futuras · ${r.otros.length} bloques no-artículo · ${r.imagenes} imágenes`);
    const porNorma = new Map();
    for (const f of r.futuros) porNorma.set(f.norma, [...(porNorma.get(f.norma) ?? []), f.ref]);
    for (const [norma, refs] of porNorma) console.log(`  futuro ${norma} → arts. ${refs.join(", ")}`);
    if (r.sinVigente.length) console.log(`  ⚠ sin versión en vigor a esa fecha: ${r.sinVigente.join(", ")}`);
  }
}
