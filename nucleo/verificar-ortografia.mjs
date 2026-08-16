// Acertium — pipeline / puerta de ORTOGRAFÍA (familia ORTO, Tema 37)
//
// El resto de puertas verifican que la opción correcta sea cita literal de la
// fuente. Para la ortografía eso no basta: una pregunta del tipo "¿cuál de estas
// palabras está bien escrita?" no se sostiene en un artículo, sino en si la
// palabra EXISTE con esa grafía exacta. Y `verificador-cotejo` normaliza
// quitando tildes, así que era estructuralmente incapaz de juzgar un acento
// (el hallazgo del PROMPT_008 §4).
//
// Esta puerta añade el recurso de verdad que faltaba: un diccionario español
// con la grafía correcta, tildes incluidas.
//
//   modo "grafia"          → la CORRECTA debe existir en el diccionario con
//                            match exacto; los 3 DISTRACTORES no deben existir.
//                            Si la correcta no está, o si algún distractor
//                            también es palabra (ambigüedad: dos respuestas
//                            válidas), se RECHAZA.
//   modo "regla" (o sin modo) → delega en el cotejo literal de siempre, en modo
//                            sensible a tildes por ser familia ORTO.
//
// Devuelve el mismo formato que las otras puertas: { ok, resumen, rechazos, avisos }.
//
// Nota de capas: `nucleo/` es agnóstico de dominio y el diccionario es de un
// adaptador concreto (tecnico-es). Por eso el módulo NO conoce la ruta: recibe
// el diccionario ya cargado (o su cargador). El default apunta al es_ES para no
// obligar a cablearlo en cada llamada, pero se puede inyectar otro idioma.

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { verificarActividad } from "./verificador-cotejo.mjs";
import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DICCIONARIO_ES = join(RAIZ, "adaptadores/tecnico-es/recursos");

// --- carga del diccionario --------------------------------------------------
// nspell implementa el lookup de hunspell (afijos incluidos): el es_ES tiene
// 57.345 entradas y 6.755 reglas de afijo, así que expandirlo a lista plana
// daría millones de formas. El lookup es exacto y sensible a tildes, que es
// justo lo que hace falta.
let _cache = null;

export async function cargarDiccionario(carpeta = DICCIONARIO_ES) {
  if (_cache && _cache.carpeta === carpeta) return _cache.dic;
  const aff = join(carpeta, "es_ES.aff");
  const dic = join(carpeta, "es_ES.dic");
  if (!existsSync(aff) || !existsSync(dic))
    throw new Error(`faltan es_ES.aff/es_ES.dic en ${carpeta} (ver README de recursos)`);
  const { default: nspell } = await import("nspell");
  const motor = nspell(readFileSync(aff), readFileSync(dic));
  const api = {
    // `correct()` de nspell es sensible a tildes y a mayúsculas iniciales.
    existe: (palabra) => motor.correct(String(palabra).trim()),
    motor,
  };
  _cache = { carpeta, dic: api };
  return api;
}

// --- la puerta --------------------------------------------------------------

const soloPalabra = (s) => /^[\p{L}\p{M}'’-]+$/u.test(String(s ?? "").trim());

export async function verificarOrtografia(lote, opciones = {}) {
  const diccionario = opciones.diccionario || (await cargarDiccionario(opciones.carpeta));
  const rechazos = [];
  const avisos = [];
  let grafia = 0;
  let regla = 0;

  for (const a of lote.actividades || []) {
    const id = a.concepto_id;
    const ops = a.opciones || [];
    const correcta = ops[a.indice_correcto];

    if (a.modo !== "grafia") {
      // Modo regla: el cotejo de siempre, pero SIN normalizar tildes (si no, la
      // puerta daría por buena una regla citada con los acentos cambiados).
      regla++;
      const r = verificarActividad(
        { tipo: "test", concepto_id: id, respuesta: { correcta }, cotejo: a.cotejo },
        { sensible: true },
      );
      if (!r.ok) rechazos.push({ concepto: id, modo: "regla", motivo: r.motivo });
      continue;
    }

    grafia++;
    // En modo grafía las opciones son palabras sueltas; si no lo son, la puerta
    // no sabe juzgarlas y lo dice en vez de dar un veredicto falso.
    const noPalabra = ops.filter((o) => !soloPalabra(o));
    if (noPalabra.length) {
      rechazos.push({
        concepto: id,
        modo: "grafia",
        motivo: `el modo grafía exige palabras sueltas; no lo son: ${noPalabra.join(", ")}`,
      });
      continue;
    }

    if (!diccionario.existe(correcta)) {
      rechazos.push({
        concepto: id,
        modo: "grafia",
        motivo: `la opción correcta «${correcta}» NO está en el diccionario`,
      });
      continue;
    }

    const distractoresValidos = ops.filter((o, i) => i !== a.indice_correcto && diccionario.existe(o));
    if (distractoresValidos.length) {
      rechazos.push({
        concepto: id,
        modo: "grafia",
        motivo:
          `ambigüedad: ${distractoresValidos.length} distractor(es) también son palabras válidas ` +
          `(${distractoresValidos.join(", ")}); habría más de una respuesta correcta`,
      });
      continue;
    }

    // Aviso útil, no bloqueante: distractor que solo cambia la tilde es el caso
    // que se busca; si difiere en más, la pregunta puede ser demasiado fácil.
    const sinTilde = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const flojos = ops.filter((o, i) => i !== a.indice_correcto && sinTilde(o) !== sinTilde(correcta));
    if (flojos.length === ops.length - 1)
      avisos.push({
        concepto: id,
        aviso: `ningún distractor es una variante de acentuación de «${correcta}»: la pregunta puede ser trivial`,
      });
  }

  return {
    ok: rechazos.length === 0,
    resumen: `ortografía: ${grafia} de grafía · ${regla} de regla · ${rechazos.length} rechazos · ${avisos.length} avisos`,
    rechazos,
    avisos,
  };
}

// --- self-test: node nucleo/verificar-ortografia.mjs -------------------------
if (esEjecucionDirecta(import.meta.url)) {
  const dic = await cargarDiccionario();
  const casos = [];
  const comprobar = (nombre, real, esperado) => {
    const ok = real === esperado;
    casos.push(ok);
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${esperado}, dio ${real})`}`);
  };

  console.log("== (a) el diccionario distingue tildes ==");
  comprobar("«sofá» está en el diccionario", dic.existe("sofá"), true);
  comprobar("«sofa» NO está", dic.existe("sofa"), false);
  comprobar("«corazón» está", dic.existe("corazón"), true);
  comprobar("«corazon» NO está", dic.existe("corazon"), false);

  console.log("== (b) modo grafía ==");
  const grafiaBuena = {
    actividades: [
      { concepto_id: "ORTO-900", modo: "grafia", opciones: ["sofá", "sofa", "sofáa", "zofá"], indice_correcto: 0 },
    ],
  };
  const grafiaAmbigua = {
    actividades: [
      // "casa" y "caza" son ambas palabras: dos respuestas válidas.
      { concepto_id: "ORTO-901", modo: "grafia", opciones: ["casa", "caza", "cassa", "kasa"], indice_correcto: 0 },
    ],
  };
  const grafiaCorrectaInexistente = {
    actividades: [
      { concepto_id: "ORTO-902", modo: "grafia", opciones: ["sofáa", "xqz", "wqp", "vbn"], indice_correcto: 0 },
    ],
  };
  const r1 = await verificarOrtografia(grafiaBuena, { diccionario: dic });
  const r2 = await verificarOrtografia(grafiaAmbigua, { diccionario: dic });
  const r3 = await verificarOrtografia(grafiaCorrectaInexistente, { diccionario: dic });
  comprobar("correcta válida + 3 inválidas PASA", r1.ok, true);
  comprobar("2 opciones válidas se RECHAZA", r2.ok, false);
  comprobar("correcta que no existe se RECHAZA", r3.ok, false);

  console.log("== (c) el cotejo base no cambia en modo normal ==");
  const actLey = {
    tipo: "test",
    concepto_id: "CE-001",
    respuesta: { correcta: "72 horas" },
    cotejo: "en el plazo máximo de setenta y dos horas",
  };
  comprobar("número↔palabra sigue cotejando (familia no sensible)", verificarActividad(actLey).ok, true);
  comprobar(
    "acento distinto sigue sin tumbar un cotejo de ley",
    verificarActividad({ ...actLey, respuesta: { correcta: "plazo maximo" } }).ok,
    true,
  );
  console.log("== (d) en modo sensible, el acento SÍ importa ==");
  comprobar(
    "«plazo maximo» ya no coteja contra «plazo máximo»",
    verificarActividad({ ...actLey, respuesta: { correcta: "plazo maximo" } }, { sensible: true }).ok,
    false,
  );
  comprobar(
    "«plazo máximo» sí coteja en sensible",
    verificarActividad({ ...actLey, respuesta: { correcta: "plazo máximo" } }, { sensible: true }).ok,
    true,
  );
  comprobar(
    "una actividad ORTO entra en sensible sola",
    verificarActividad({ tipo: "test", concepto_id: "ORTO-001", respuesta: { correcta: "esdrújula" }, cotejo: "toda palabra esdrújula lleva tilde" }).motivo.includes("sensible"),
    true,
  );

  const ok = casos.filter(Boolean).length;
  console.log(`\nself-test verificar-ortografia: ${ok}/${casos.length}`);
  if (ok !== casos.length) process.exit(1);
}
