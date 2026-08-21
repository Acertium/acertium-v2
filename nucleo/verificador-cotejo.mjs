// Acertium — pipeline / verificador de cotejo
// Guarda de salida (Doc 001 §6b): una actividad solo es "verificado" si su
// respuesta correcta está literalmente sostenida por el texto de la fuente.
// Incluye normalización número<->letra en español (0-999), porque la ley
// escribe los números con palabra ("setenta y dos horas" = "72 horas").
//
// Uso:
//   import { verificarActividad, normalizarNumeros } from './verificador-cotejo.mjs'
//   verificarActividad({ tipo:'test', respuesta:{correcta:'72 horas'}, cotejo:'...setenta y dos horas...' })

import { esEjecucionDirecta } from './ejecucion-directa.mjs';

const UNIDADES = {
  cero:0, uno:1, un:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7,
  ocho:8, nueve:9, diez:10, once:11, doce:12, trece:13, catorce:14, quince:15,
  dieciseis:16, diecisiete:17, dieciocho:18, diecinueve:19, veinte:20,
  veintiuno:21, veintiun:21, veintiuna:21, veintidos:22, veintitres:23,
  veinticuatro:24, veinticinco:25, veintiseis:26, veintisiete:27, veintiocho:28,
  veintinueve:29
};
const DECENAS = { treinta:30, cuarenta:40, cincuenta:50, sesenta:60, setenta:70, ochenta:80, noventa:90 };
const CENTENAS = {
  cien:100, ciento:100, doscientos:200, doscientas:200, trescientos:300, trescientas:300,
  cuatrocientos:400, cuatrocientas:400, quinientos:500, quinientas:500, seiscientos:600, seiscientas:600,
  setecientos:700, setecientas:700, ochocientos:800, ochocientas:800, novecientos:900, novecientas:900
};
const VALOR = { ...UNIDADES, ...DECENAS, ...CENTENAS };

function sinAcentos(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function esNumeroPalabra(t) {
  return Object.prototype.hasOwnProperty.call(VALOR, t);
}

// Convierte las palabras-número de un texto a dígitos, dejando el resto igual.
// "en el plazo máximo de setenta y dos horas" -> "en el plazo maximo de 72 horas"
//
// CUIDADO CON LA «Y», que aquí hubo un fallo de verdad. La versión anterior
// sumaba CUALQUIER racha de palabras-número unidas por «y», y en la ley la «y»
// casi nunca es una suma: es el conector de un RANGO.
//
//   "entre nueve y doce meses"   →  "entre 21 meses"     ✗ (art. 25 Orden INT/632/2024)
//   "entre cuatro y seis meses"  →  "entre 10 meses"     ✗ (art. 35 de la misma)
//   "de uno a tres años"         →  bien, porque usa «a» y no «y»
//
// El falso positivo se ve —una cifra que nadie escribió aparece de la nada— y
// eso fue lo que lo destapó: la puerta reclamaba un «9» que sí estaba en el
// artículo. Lo peligroso es el caso contrario, que no se ve: dos rangos
// distintos que sumen lo mismo cotejaban como iguales. "entre cuatro y seis" y
// "entre uno y nueve" son los dos 10, así que una explicación con el rango
// equivocado habría pasado la puerta de grounding sin que saltara nada.
//
// La regla real del español es estrecha y solo tiene dos formas aditivas:
//   · CENTENA seguida del resto, sin «y»:  "ciento veinte", "doscientos cincuenta y dos"
//   · DECENA + «y» + UNIDAD:               "setenta y dos", "noventa y nueve"
// Fuera de ahí, dos números seguidos son dos números, no su suma.
const esDecena = (t) => Object.prototype.hasOwnProperty.call(DECENAS, t);
const esCentena = (t) => Object.prototype.hasOwnProperty.call(CENTENAS, t);
const esUnidad = (t) => esNumeroPalabra(t) && VALOR[t] >= 1 && VALOR[t] <= 9;

export function normalizarNumeros(texto) {
  const tokens = sinAcentos(String(texto).toLowerCase()).match(/\d+|[a-zñ]+/g) || [];
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    if (!esNumeroPalabra(tokens[i])) {
      out.push(tokens[i]);
      i++;
      continue;
    }

    let suma = VALOR[tokens[i]];
    let j = i + 1;

    // "ciento veinte", "doscientos cincuenta y dos": la centena arrastra lo que
    // venga detrás si es menor, y sin «y» de por medio.
    if (esCentena(tokens[i]) && j < tokens.length && esNumeroPalabra(tokens[j]) && VALOR[tokens[j]] < 100) {
      suma += VALOR[tokens[j]];
      j++;
    }

    // "setenta y dos": solo si lo acumulado acaba en decena y lo que sigue a la
    // «y» es una unidad. Un rango —"nueve y doce"— no cumple ninguna de las dos.
    const ultima = tokens[j - 1];
    if (
      esDecena(ultima) &&
      tokens[j] === 'y' &&
      j + 1 < tokens.length &&
      esUnidad(tokens[j + 1])
    ) {
      suma += VALOR[tokens[j + 1]];
      j += 2;
    }

    out.push(String(suma));
    i = j;
  }
  return out.join(' ');
}

// ---------------------------------------------------------------------------
// MODO SENSIBLE A TILDES (16/08/2026, PROMPT_009)
//
// `normalizarNumeros` quita tildes y pasa a minúsculas, que es lo que se quiere
// para la ley (la fuente escribe "setenta y dos horas" donde la pregunta dice
// "72 horas", y un acento de más o de menos no debe tumbar un cotejo válido).
// Pero para el Tema 37 —ortografía— eso lo inutiliza: "sofá" y "sofa" cotejan
// igual, así que la puerta NO puede verificar la corrección de un acento.
//
// `cotejoSensible` conserva las TILDES, pero sigue ignorando mayúsculas y
// colapsando espacios. Tampoco convierte número↔palabra, que aquí no aporta.
//
// Lo de las mayúsculas no es descuido: la primera versión comparaba también
// caja y rechazaba ORTO-031, cuya opción correcta es «la primera palabra del
// título…» y su fuente «La primera palabra del título…». Eso es una mayúscula
// de inicio de frase, no un error ortográfico, y la puerta existe para juzgar
// acentos. Consecuencia asumida: este modo NO puede verificar por sí solo una
// pregunta sobre uso de mayúsculas; para eso está el modo `grafia`, que compara
// contra el diccionario.
//
// Por defecto NO se activa: las ~2.400 actividades ya verificadas siguen
// cotejando exactamente igual. Se enciende por actividad (`cotejo_sensible:
// true`) o por familia (ORTO), ver `esSensible()`.
// ---------------------------------------------------------------------------

const colapsa = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function cotejoSensible(cotejo, fragmento) {
  return colapsa(cotejo).includes(colapsa(fragmento));
}

// ¿Esta actividad se coteja con tildes? Explícito por actividad, o por familia
// (el primer token del id de concepto), que es como se identifica la materia en
// todo el pipeline.
export function esSensible(act, familiasSensibles = ["ORTO"]) {
  if (act?.cotejo_sensible === true) return true;
  const familia = String(act?.concepto_id ?? "").split("-")[0];
  return familiasSensibles.includes(familia);
}

function contiene(cotejo, fragmento, sensible = false) {
  return sensible
    ? cotejoSensible(cotejo, fragmento)
    : normalizarNumeros(cotejo).includes(normalizarNumeros(fragmento));
}

// Verifica una actividad contra su cotejo. Devuelve {ok, motivo}.
// - test / corta: la respuesta debe aparecer (normalizada) en el cotejo.
// - huecos: cada hueco debe aparecer en el cotejo.
// - vf: no se puede cotejar por substring (es una afirmación verdadera o falsa);
//       requiere juicio semántico -> se marca como 'requiere-revision-humana'.
export function verificarActividad(act, opciones = {}) {
  const cotejo = act.cotejo || act.cotejo_fuente || '';
  const r = act.respuesta || {};
  const sensible = opciones.sensible ?? esSensible(act);
  const sufijo = sensible ? ' (cotejo sensible a tildes)' : '';
  switch (act.tipo) {
    case 'test': {
      const val = r.correcta ?? '';
      return contiene(cotejo, val, sensible)
        ? { ok: true, motivo: 'respuesta sostenida por el cotejo' + sufijo }
        : { ok: false, motivo: `no se encontró «${val}» en el cotejo${sufijo}` };
    }
    case 'corta': {
      const val = r.texto ?? '';
      return contiene(cotejo, val, sensible)
        ? { ok: true, motivo: 'respuesta sostenida por el cotejo' + sufijo }
        : { ok: false, motivo: `no se encontró «${val}» en el cotejo${sufijo}` };
    }
    case 'huecos': {
      const huecos = r.huecos || [];
      const faltan = huecos.filter(h => !contiene(cotejo, h, sensible));
      return faltan.length === 0
        ? { ok: true, motivo: 'todos los huecos sostenidos por el cotejo' }
        : { ok: false, motivo: `huecos no encontrados: ${faltan.join(', ')}` };
    }
    case 'vf':
      return { ok: null, motivo: 'V/F requiere juicio semántico (no cotejable por substring)' };
    default:
      return { ok: false, motivo: `tipo desconocido: ${act.tipo}` };
  }
}

// --- self-test: node nucleo/verificador-cotejo.mjs --------------------------
// Este fichero no tenía ninguno, así que `npm run test:motor` lo ejecutaba y no
// comprobaba nada.
if (esEjecucionDirecta(import.meta.url)) {
  const casos = [];
  const comprobar = (nombre, real, esperado) => {
    const ok = real === esperado;
    casos.push(ok);
    console.log(`  ${ok ? '✓' : '✗'} ${nombre}${ok ? '' : ` (esperaba ${esperado}, dio ${real})`}`);
  };

  console.log('== normalización número↔palabra ==');
  comprobar('«setenta y dos» → 72', normalizarNumeros('setenta y dos horas'), '72 horas');
  comprobar('«veinticuatro» → 24', normalizarNumeros('veinticuatro horas'), '24 horas');
  comprobar('la «y» suelta no se come', normalizarNumeros('policía y guardia'), 'policia y guardia');

  // La «y» de un RANGO no es una suma. Cicatriz del 22/08/2026: la versión
  // anterior sumaba cualquier racha unida por «y», así que "entre nueve y doce
  // meses" (art. 25 Orden INT/632/2024) salía como "entre 21 meses". El falso
  // positivo se veía; el peligroso era el mudo: "entre cuatro y seis" y "entre
  // uno y nueve" valían los dos 10 y cotejaban como iguales.
  comprobar('rango: «nueve y doce» NO son 21', normalizarNumeros('entre nueve y doce meses'), 'entre 9 y 12 meses');
  comprobar('rango: «cuatro y seis» NO son 10', normalizarNumeros('entre cuatro y seis meses'), 'entre 4 y 6 meses');
  comprobar('rango con «a» (nunca falló)', normalizarNumeros('de uno a tres años'), 'de 1 a 3 anos');
  comprobar('compuesto real: decena + y + unidad', normalizarNumeros('noventa y nueve'), '99');
  comprobar('centena arrastra: «ciento veinte»', normalizarNumeros('ciento veinte'), '120');
  comprobar('centena + decena + y + unidad', normalizarNumeros('doscientos cincuenta y dos'), '252');
  comprobar('dos números sueltos siguen sueltos', normalizarNumeros('dos y tres'), '2 y 3');

  console.log('== modo normal (por defecto): tildes y caja se ignoran ==');
  const ley = { tipo: 'test', concepto_id: 'CE-001', cotejo: 'en el plazo máximo de setenta y dos horas' };
  comprobar('«72 horas» coteja', verificarActividad({ ...ley, respuesta: { correcta: '72 horas' } }).ok, true);
  comprobar('«plazo maximo» (sin tilde) coteja', verificarActividad({ ...ley, respuesta: { correcta: 'plazo maximo' } }).ok, true);
  comprobar('lo que no está, no coteja', verificarActividad({ ...ley, respuesta: { correcta: '48 horas' } }).ok, false);

  console.log('== modo sensible: la tilde importa, la mayúscula no ==');
  comprobar('«plazo maximo» ya NO coteja', verificarActividad({ ...ley, respuesta: { correcta: 'plazo maximo' } }, { sensible: true }).ok, false);
  comprobar('«plazo máximo» sí coteja', verificarActividad({ ...ley, respuesta: { correcta: 'plazo máximo' } }, { sensible: true }).ok, true);
  comprobar('mayúscula inicial no tumba el cotejo', cotejoSensible('La primera palabra del título', 'la primera palabra del título'), true);
  comprobar('cambiar una tilde sí lo tumba', cotejoSensible('La primera palabra del título', 'la primera palabra del titulo'), false);

  console.log('== a quién se le aplica ==');
  comprobar('familia ORTO entra sola', esSensible({ concepto_id: 'ORTO-001' }), true);
  comprobar('familia CE no entra', esSensible({ concepto_id: 'CE-T1-001' }), false);
  comprobar('marca explícita por actividad', esSensible({ concepto_id: 'CE-T1-001', cotejo_sensible: true }), true);

  const ok = casos.filter(Boolean).length;
  console.log(`\nself-test verificador-cotejo: ${ok}/${casos.length}`);
  if (ok !== casos.length) process.exit(1);
}
