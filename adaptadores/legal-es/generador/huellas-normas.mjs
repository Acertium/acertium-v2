// Acertium — adaptador legal-es / huella por artículo de cada norma
//
//   (se usa desde comprobar-normas.mjs; autoprueba: node huellas-normas.mjs --test)
//
// POR QUÉ (23/08/2026, decisión de Jonathan). La regla del 23/08 dice que lo que
// se baja del BOE se versiona en el repo. Un barrido completo de las 59 normas
// son **26 MB** de XML: bien una vez, ruinoso cada semana (1,3 GB al año).
//
// La solución: se versiona SIEMPRE la huella —un hash por artículo, ~6 KB por
// norma, 350 KB el corpus entero— y el XML completo SOLO cuando algo cambia.
//
// Y no se pierde el texto anterior, que era el reparo obvio: el consolidado del
// BOE **lleva dentro todas las versiones históricas de cada artículo**, cada una
// con su `fecha_vigencia`. Así que el XML que se guarda el día que algo cambia
// contiene también la redacción vieja. La huella dice QUÉ mirar; el XML nuevo
// tiene las dos redacciones para poder mirarlo.
//
// QUÉ SE HASHEA. El texto NORMALIZADO (`normalizarParaComparar`), no el crudo:
// si no, un guion tipográfico distinto en la captura movería la huella y el
// vigilante gritaría por ruido. Es la misma normalización que usa el diff, para
// que huella y diff no puedan discrepar entre sí.

import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { normalizarParaComparar } from "../../../nucleo/comparar-articulos.mjs";
import { esEjecucionDirecta } from "../../../nucleo/ejecucion-directa.mjs";

export const DIR_HUELLAS = "datos/fuentes/huellas";

// 16 hex = 64 bits. Para 5.432 artículos la probabilidad de colisión es del
// orden de 10^-12; y una colisión aquí solo significa «no avisó de un cambio en
// ESE artículo», no un dato falso servido al opositor.
const LARGO = 16;

export function huella(texto) {
  return createHash("sha256").update(normalizarParaComparar(texto), "utf8").digest("hex").slice(0, LARGO);
}

/** @param {Map<string,string>} articulos ref → texto */
export function huellasDeArticulos(articulos) {
  const out = {};
  for (const [ref, texto] of articulos) out[ref] = huella(texto);
  return out;
}

export function rutaHuella(referenciaBoe, dir = DIR_HUELLAS) {
  return `${dir}/${referenciaBoe}.json`;
}

export function leerHuella(referenciaBoe, dir = DIR_HUELLAS) {
  const r = rutaHuella(referenciaBoe, dir);
  if (!existsSync(r)) return null;
  try { return JSON.parse(readFileSync(r, "utf8")); } catch { return null; }
}

export function escribirHuella(datos, dir = DIR_HUELLAS) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(rutaHuella(datos.referencia_boe, dir), JSON.stringify(datos, null, 1) + "\n");
}

/**
 * Qué ha cambiado en el BOE desde nuestra última captura.
 *
 * `sospechoso` marca el caso en que cambia MÁS DE LA MITAD de los artículos. Eso
 * casi nunca es una reforma: es que ha cambiado nuestro extractor. Distinguirlo
 * importa porque las dos cosas se ven igual en el resultado —«187 artículos
 * cambiados»— y una pide re-verificar contenido y la otra pide mirar el código.
 */
export function compararHuellas(anterior, actual) {
  const A = anterior?.articulos ?? {};
  const cambiados = [], nuevos = [], desaparecidos = [];
  for (const ref of Object.keys(actual)) {
    if (!(ref in A)) nuevos.push(ref);
    else if (A[ref] !== actual[ref]) cambiados.push(ref);
  }
  for (const ref of Object.keys(A)) if (!(ref in actual)) desaparecidos.push(ref);
  const comunes = Object.keys(actual).filter((r) => r in A).length;
  return {
    primeraVez: !anterior,
    cambiados, nuevos, desaparecidos,
    iguales: comunes - cambiados.length,
    sospechoso: comunes > 20 && cambiados.length > comunes / 2,
  };
}

function autoprueba() {
  let fallos = 0;
  const caso = (nombre, real, esperado) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)})`}`);
  };

  console.log("== la huella usa la MISMA normalización que el diff ==");
  caso("el ruido de captura no mueve la huella",
    huella("el «dolo»\n—o culpa—") === huella('el "dolo" -o culpa-'), true);
  caso("una coma sí la mueve",
    huella("No, será castigada") === huella("No será castigada"), false);

  console.log("\n== qué cambió desde la última captura ==");
  const antes = { referencia_boe: "X", articulos: { "1": huella("uno"), "2": huella("dos"), "3": huella("tres") } };
  const ahora = { "1": huella("uno"), "2": huella("DOS reformado"), "4": huella("cuatro") };
  const d = compararHuellas(antes, ahora);
  caso("cambiado", d.cambiados, ["2"]);
  caso("nuevo", d.nuevos, ["4"]);
  caso("desaparecido", d.desaparecidos, ["3"]);
  caso("no es la primera vez", d.primeraVez, false);
  caso("sin huella previa, es la primera vez", compararHuellas(null, ahora).primeraVez, true);

  console.log("\n== «ha cambiado todo» no es una reforma: es el extractor ==");
  const base = {}, todo = {};
  for (let i = 1; i <= 30; i++) { base[i] = huella(`art ${i}`); todo[i] = huella(`ART ${i} distinto`); }
  caso("30 de 30 cambiados → sospechoso", compararHuellas({ articulos: base }, todo).sospechoso, true);
  const pocos = { ...base, 7: huella("art 7 reformado") };
  caso("1 de 30 cambiado → no sospechoso", compararHuellas({ articulos: base }, pocos).sospechoso, false);
  const tres = { 1: huella("a"), 2: huella("b"), 3: huella("c distinto") };
  caso("norma pequeña: no se marca sospechosa aunque el % sea alto",
    compararHuellas({ articulos: { 1: huella("a"), 2: huella("b"), 3: huella("c") } }, tres).sospechoso, false);

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  console.log(`self-test huellas-normas: ${fallos ? "con fallos" : "OK"}`);
  return fallos;
}

if (esEjecucionDirecta(import.meta.url)) process.exit(autoprueba() ? 1 : 0);
