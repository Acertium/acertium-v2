// Acertium — núcleo / cifras con unidad
//
// POR QUÉ EXISTE (23/08/2026)
// `verificar-lote` comprueba que las cifras de una explicación estén en el
// artículo, pero lo hacía con la cifra PELADA. En el BOE eso casi no comprueba
// nada para los enteros pequeños: los artículos van numerados «1. 2. 3.», así
// que el 2 y el 3 están en el texto pase lo que pase. Medido sobre los 110
// lotes: de las 1.483 cifras 1-9 que la puerta daba por respaldadas, 623 —el
// 42 %— lo estaban SOLO por la numeración de apartado o por una cita normativa.
// Una explicación podía decir «el plazo es de tres años» sobre un artículo que
// dice dos, y pasar porque el artículo tenía un apartado 3.
//
// LA PALANCA es que el andamiaje nunca lleva unidad. Se tabuló qué palabra
// sigue a una cifra en el corpus entero: o es unidad (anos 1.487, meses 1.021,
// dias 548, horas 124, euros 115…) o es andamiaje («de», «la», «el»). Así que
// aquí no se comprueba la cifra sino el PAR cifra+unidad: «3 años» tiene que
// estar como «3 años», y ningún apartado numerado puede fabricar eso.
//
// ASIMETRÍA DELIBERADA: el lado FUENTE se ensancha, el lado EXPLICACIÓN no.
// La ley elide de dos maneras y las dos son idiomáticas, no errores:
//   · el numeral:  «las leves prescriben AL MES»      = 1 mes
//   · la unidad:   «mínima de tres meses y máxima de CUATRO» = 4 meses
//                  «por nueve años… se renueva cada TRES»    = 3 años
// Ensanchar solo la fuente hace la puerta más permisiva, nunca más ciega de lo
// que ya era. Al revés sí haría daño: si se aplicara al lado de la explicación,
// «el 100 % del IPREM AL MES» (EXTR-074) y «cosa juzgada AL DÍA siguiente»
// (CE-T9-012) inventarían un «1 mes» y un «1 día» que nadie escribió. Se probó
// simétrico y dio exactamente esos dos falsos positivos.
//
// LO QUE ESTO NO CUBRE, dicho claro: los recuentos sin unidad —«las dos
// condiciones», «los tres criterios»— siguen sin verificarse. No es pereza, es
// que no son verificables de forma determinista. Ver `docs/verificar-cifras.md`.
//
//   import { paresConUnidad, cifrasSinRespaldo } from './verificar-cifras.mjs'
//   node nucleo/verificar-cifras.mjs        (self-test)

import { normalizarNumeros } from "./verificador-cotejo.mjs";
import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

// Unidades del corpus, canonizadas a singular. Las abreviaturas cuentan: el
// artículo escribe «40 centímetros» y la explicación «40 cm» (VCD-035).
const CANON = {
  ano: "ano", anos: "ano", mes: "mes", meses: "mes", dia: "dia", dias: "dia",
  hora: "hora", horas: "hora", minuto: "minuto", minutos: "minuto",
  semana: "semana", semanas: "semana",
  trimestre: "trimestre", trimestres: "trimestre", semestre: "semestre", semestres: "semestre",
  euro: "euro", euros: "euro", peseta: "peseta", pesetas: "peseta",
  metro: "metro", metros: "metro", m: "metro",
  centimetro: "centimetro", centimetros: "centimetro", cm: "centimetro",
  milimetro: "milimetro", milimetros: "milimetro", mm: "milimetro",
  kilometro: "kilometro", kilometros: "kilometro", km: "kilometro",
  punto: "punto", puntos: "punto",
  tercio: "tercio", tercios: "tercio", quinto: "quinto", quintos: "quinto",
};

// «grado» NO entra, aunque el corpus lo use como unidad 65 veces («la pena
// inferior en un grado»). Choca de frente con el recuento: DISC-004 dice «dos
// grados que se confunden» hablando de grados de RESPONSABILIDAD, no de una
// cantidad. Ante la duda, fuera: esta puerta cubre tiempo, dinero y medida, que
// es donde una cifra equivocada hace daño de verdad.

// El BOE mete adjetivos entre la cifra y la unidad: «los cinco ÚLTIMOS años»
// (EXTR-121), «los dos PRIMEROS meses». Medidos, no supuestos.
const INTERPUESTOS = new Set([
  "ultimos", "ultimas", "primeros", "primeras", "siguientes", "naturales", "habiles", "proximos",
]);

// Solo con unidades de tiempo existe el giro «al mes» = un mes. «al grado» no
// es una cantidad — lo destapó VIC-002 («Ojo al grado»).
const ELIDIBLES = new Set(["ano", "mes", "dia", "semana", "hora"]);

const unidadDe = (t) => CANON[t];

function unidadTras(w, i) {
  for (let k = i; k < i + 3 && k < w.length; k++) {
    const u = unidadDe(w[k]);
    if (u) return u;
    if (!INTERPUESTOS.has(w[k])) return null;
  }
  return null;
}

/**
 * Pares «cifra unidad» de un texto.
 * @param {string} texto
 * @param {{fuente?: boolean}} opciones  fuente:true ensancha con las elisiones.
 * @returns {Set<string>}  p. ej. {"3 ano", "72 hora"}
 */
export function paresConUnidad(texto, opciones = {}) {
  const esFuente = opciones.fuente === true;
  // El corpus mezcla «%» (68 veces) y «por ciento» (47), y el tokenizador de
  // `normalizarNumeros` tira el símbolo. Sin esto, «40 %» en el artículo no
  // casaría con «cuarenta por ciento» en la explicación.
  const w = normalizarNumeros(String(texto).replace(/%/g, " por ciento ")).split(" ");
  const out = new Set();
  // Unidad vigente para las elisiones del lado fuente: se pierde al acabar la
  // frase y caduca a los 12 tokens, para que no contamine medio artículo.
  let vigente = null;
  let quedan = 0;

  for (let i = 0; i < w.length; i++) {
    if (esFuente && vigente) {
      if (quedan-- <= 0) vigente = null;
    }
    // «al mes», «al año»: la ley elide el numeral. Solo del lado fuente.
    if (esFuente && w[i] === "al" && ELIDIBLES.has(unidadDe(w[i + 1]))) {
      out.add("1 " + unidadDe(w[i + 1]));
      continue;
    }
    if (!/^\d+$/.test(w[i])) continue;

    const u = unidadTras(w, i + 1);
    if (u) {
      out.add(w[i] + " " + u);
      vigente = u;
      quedan = 12;
      continue;
    }
    // Rango con la unidad al final: «de N a M meses», «entre N y M meses». Se
    // exige el conector exacto para que una cita («LO 4/2000 y dos años») no
    // arrastre el 2000 al par.
    if ((w[i + 1] === "a" || w[i + 1] === "y") && /^\d+$/.test(w[i + 2])) {
      const u2 = unidadTras(w, i + 3);
      const esRango =
        (w[i - 1] === "de" && w[i + 1] === "a") || (w[i - 1] === "entre" && w[i + 1] === "y");
      if (u2 && esRango) {
        out.add(w[i] + " " + u2);
        out.add(w[i + 2] + " " + u2);
        vigente = u2;
        quedan = 12;
        continue;
      }
    }
    if (w[i + 1] === "por" && (w[i + 2] === "ciento" || w[i + 2] === "100")) {
      out.add(w[i] + " por ciento");
      continue;
    }
    // Cifra pelada del lado fuente: hereda la unidad vigente. Cubre «máxima de
    // cuatro» y «se renueva cada tres».
    if (esFuente && vigente) out.add(w[i] + " " + vigente);
  }
  return out;
}

/**
 * Cifras de la explicación que van con unidad y cuyo par NO está en la fuente.
 * Devuelve las CIFRAS (no los pares) para que encajen en el campo `cifras` que
 * ya usan los ficheros de reescritura, sin inventar otro formato de declaración.
 * @returns {string[]}
 */
export function cifrasSinRespaldo(explicacion, fuente) {
  const pe = paresConUnidad(explicacion);
  if (!pe.size) return [];
  const ps = paresConUnidad(fuente, { fuente: true });
  const fuera = [];
  for (const p of pe) if (!ps.has(p)) fuera.push(p.split(" ")[0]);
  return [...new Set(fuera)];
}

// --- Self-test: node nucleo/verificar-cifras.mjs ---
// Las cadenas salen del corpus y del banco, no están inventadas.
if (esEjecucionDirecta(import.meta.url)) {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)})`}`);
  };
  const P = (t, o) => [...paresConUnidad(t, o)].sort();

  console.log("== extracción de pares ==");
  caso("«veinticuatro horas»", P("en el plazo de veinticuatro horas"), ["24 hora"]);
  caso("«de nueve a doce meses» (rango)", P("una duración de entre nueve y doce meses"), ["12 mes", "9 mes"]);
  caso("adjetivo interpuesto: «cinco últimos años»", P("los cinco últimos años anteriores"), ["5 ano"]);
  caso("abreviatura: «40 cm» = «40 centímetros»", P("anchura 40 cm"), ["40 centimetro"]);
  caso("porcentaje", P("como mínimo el cuarenta por ciento"), ["40 por ciento"]);
  caso("la cita no arrastra: «LO 4/2000 y dos años»", P("del artículo 58.3.a de la LO 4/2000 y dos años cuando"), ["2 ano"]);

  console.log("\n== el andamiaje del BOE no fabrica pares ==");
  caso("apartado «2.» suelto", P("los principios generales del derecho. 2. Carecerán de validez"), []);
  caso("«3.ª categoría»", P("no estén clasificadas como armas de guerra. 3.ª categoría: Armas"), []);

  console.log("\n== elisiones: solo ensanchan la FUENTE ==");
  caso("fuente «al mes» → 1 mes", P("las leves prescribirán al mes", { fuente: true }), ["1 mes"]);
  caso("explicación «al mes» NO inventa nada", P("el 100 % del IPREM al mes"), ["100 por ciento"]);
  caso("«%» y «por ciento» son lo mismo", P("un 40 %"), P("un cuarenta por ciento"));
  caso("explicación «al día siguiente» NO inventa nada", P("cosa juzgada a partir del día siguiente"), []);
  caso("fuente «máxima de cuatro» hereda «meses»",
    P("antelación mínima de tres meses y máxima de cuatro a la fecha", { fuente: true }), ["3 mes", "4 mes"]);
  caso("fuente «se renovarán cada dos» hereda «años»",
    P("designados para un período de cuatro años y se renovarán por mitades cada dos", { fuente: true }), ["2 ano", "4 ano"]);

  console.log("\n== el agujero que esto tapa ==");
  const artConApartado3 = "1. El empresario aplicará. 2. Se evaluará. 3. Se combatirá en su origen.";
  caso("«tres años» NO lo respalda un apartado 3",
    cifrasSinRespaldo("el plazo es de tres años", artConApartado3), ["3"]);
  caso("«tres años» sí lo respalda «tres años»",
    cifrasSinRespaldo("el plazo es de tres años", "prescribirán a los tres años"), []);
  caso("sin unidad, esto no opina", cifrasSinRespaldo("las dos condiciones que exige", artConApartado3), []);

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test verificar-cifras: ${fallos ? "con fallos" : "OK"}`);
  process.exit(fallos ? 1 : 0);
}
