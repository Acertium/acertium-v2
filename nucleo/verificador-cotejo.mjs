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

// «UN» Y «UNA» SON CASI SIEMPRE ARTÍCULOS, NO EL NÚMERO 1 (22/08/2026)
//
// Segunda cicatriz de esta función. Traducir «un»/«una» a 1 sin mirar el
// contexto convertía "una autorización" en "1 autorizacion" y "un delito" en
// "1 delito". Para el cotejo eso es inocuo —los dos lados se deforman igual—,
// pero `verificar-lote` saca las cifras de la explicación con esta misma
// función, así que cada artículo indeterminado se contaba como una cifra que
// había que declarar y justificar. Escribir esquivando los indefinidos no es
// solución — es doblegar la prosa para contentar a la puerta.
//
// TAMAÑO REAL DEL PROBLEMA, medido y no estimado (y más pequeño de lo que se
// dijo en su día): de las 182 declaraciones de `cifras` de los ficheros de
// reescritura, 24 desaparecen por este arreglo. Otras 80 ya sobraban antes —
// se habían declarado a ojo, sin comprobar si la puerta las pedía— y 78 siguen
// vivas. Conviene dejarlo escrito porque la primera versión de esta nota
// atribuía las 104 al defecto: lo medido son 24.
//
// La lista de abajo NO está intuida, está MEDIDA sobre el corpus completo
// (79 secciones) más los 110 lotes: se contaron los 4.672 «un» y los 3.922
// «una» por la palabra que les sigue. Manda el dato, y corrigió a la intuición
// en dos casos que parecían unidades y no lo son en este corpus:
//
//   · «un segundo»  → 11 apariciones, TODAS ordinales: "un segundo puesto de
//                     trabajo", "un segundo empleador". Ni una de tiempo.
//   · «un medio»    → 27 apariciones, TODAS artículo: "un medio ambiente
//                     adecuado", "un medio de comunicación".
//   · «un grado»    → 102, mezcladas: "la pena inferior en un grado" (cantidad)
//                     junto a "adquirirán un grado personal" (artículo).
//   · «un cuarto»   → 0 apariciones. Fuera: ni se gana nada ni se arriesga el
//                     "cuarto" de habitación.
//
// Los tres se quedan FUERA. La dirección del error importa: dejar fuera una
// unidad real solo hace que un cotejo válido no case —falla a la vista y
// fail-closed—, mientras que meter un artículo dentro inventa una cifra en
// silencio, que es el fallo que se está arreglando.
//
// Esto NO toca los compuestos: "treinta y un días" sigue siendo 31 y
// "ciento un" sigue siendo 101, porque ahí «un» es la cola de un número y se
// consume por la rama de suma, que no pasa por aquí. Y «uno» queda intacto: en
// español no existe como artículo ("de uno a tres años" es un rango real).
const UNIDADES_CUANTIFICABLES = new Set([
  // tiempo — atestiguadas con «un/una» en el corpus: ano (573), mes (360), dia (65), hora (8)
  'ano', 'mes', 'dia', 'hora', 'minuto', 'semana',
  'trimestre', 'semestre', 'bienio', 'trienio', 'quinquenio', 'decenio', 'siglo',
  // fracciones — atestiguadas: tercio (12), quinto (2), sexto (1), septimo (1)
  'tercio', 'quinto', 'sexto', 'septimo', 'octavo', 'noveno', 'decimo',
  // medida y moneda — no atestiguadas tras «un/una» en este corpus, pero no
  // admiten lectura de artículo + sustantivo: "una multa de un euro" es 1 euro.
  'milimetro', 'centimetro', 'metro', 'kilometro',
  'gramo', 'kilogramo', 'litro', 'tonelada',
  'euro', 'peseta', 'centimo',
]);

const esIndefinido = (t) => t === 'un' || t === 'una';

// ¿el «un»/«una» que abre un número es cantidad o artículo? Solo es cantidad si
// lo que viene detrás es una unidad de las medidas arriba.
function indefinidoEsCantidad(tokens, i) {
  return UNIDADES_CUANTIFICABLES.has(tokens[i + 1] ?? '');
}

// «UNO» TIENE EL MISMO PROBLEMA, POR OTRA VÍA
//
// «uno» no es artículo en español, así que al arreglar «un»/«una» parecía que
// podía quedarse como estaba. La medición dijo que no: al dejar de inventar
// cifras en la FUENTE, afloraron 9 conceptos marcados por un «uno» PRONOMINAL
// ("es uno de los ataques", "cada uno con una forma"). Mismo defecto, otra
// palabra.
//
// Otra vez manda el dato — 632 «uno» en el corpus y los lotes, por el conector
// que les sigue:
//   · "uno a tres/cuatro/cinco…"     434, todas rango       → CANTIDAD
//   · "uno o varios / o dos / o más" 205 de 208             → CANTIDAD
//   · "uno de los / de ellos / …"    296, todas pronombre   → pronombre
//   · "cada uno …"                   175, todas pronombre   → pronombre
//   · "uno u otro", "uno y otro"      15, correlativo       → pronombre
//   · "uno y cuatro / y tres / …"     21, enumeración       → CANTIDAD
//
// De ahí la regla: «uno» es cantidad solo si le sigue un conector (a, o, u, y)
// Y detrás de ese conector viene un número o un cuantificador. En cualquier
// otro sitio es pronombre y se queda como palabra.
//
// LO QUE ESTO CUESTA, dicho sin adornos: para el chequeo de cifras el falso
// negativo es la dirección MUDA (una cifra sin respaldo que no se marca), y
// aquí se aceptan algunos. Medido: REDES-028 dice "8 bytes para la red y solo
// uno para el host", donde ese «uno» sí es una cantidad y deja de contarse. Se
// asume porque una lista de declaraciones llena de ruido es una lista que el
// revisor deja de leer, y porque el número afectado es siempre el 1, que es el
// que menos engaña a un opositor. No es gratis: queda anotado para que quien
// lea esto sepa qué se cambió por qué.
const CONECTORES_DE_CANTIDAD = new Set(['a', 'o', 'u', 'y']);
const CUANTIFICADORES = new Set(['varios', 'varias', 'mas']);

function unoEsCantidad(tokens, i) {
  if (!CONECTORES_DE_CANTIDAD.has(tokens[i + 1] ?? '')) return false;
  const detras = tokens[i + 2] ?? '';
  return esNumeroPalabra(detras) || CUANTIFICADORES.has(detras);
}

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

    // Artículo indeterminado en cabeza de número: se deja como palabra. Solo se
    // pregunta aquí, en la cabeza; como cola de compuesto («treinta y un») no
    // llega a este punto.
    if (esIndefinido(tokens[i]) && !indefinidoEsCantidad(tokens, i)) {
      out.push(tokens[i]);
      i++;
      continue;
    }

    // «uno» pronominal: "uno de los", "cada uno". Igual que arriba, solo en
    // cabeza — como cola de compuesto («treinta y uno») no llega aquí.
    if (tokens[i] === 'uno' && !unoEsCantidad(tokens, i)) {
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

  // «un»/«una»: artículo o cantidad. Las cadenas de abajo salen del corpus, no
  // están inventadas — las de artículo son las que llenaban de declaraciones de
  // `cifras` la reescritura de explicaciones.
  console.log('== «un»/«una»: artículo indeterminado vs. cantidad ==');
  comprobar('artículo: «una autorización»', normalizarNumeros('se necesita una autorización'), 'se necesita una autorizacion');
  comprobar('artículo: «un delito»', normalizarNumeros('cometer un delito'), 'cometer un delito');
  comprobar('artículo: «una vez transcurrido»', normalizarNumeros('una vez transcurrido el plazo'), 'una vez transcurrido el plazo');
  comprobar('artículo: «un plazo» (plazo NO es unidad)', normalizarNumeros('en un plazo de tres meses'), 'en un plazo de 3 meses');
  comprobar('cantidad: «un año»', normalizarNumeros('en el plazo de un año'), 'en el plazo de 1 ano');
  comprobar('cantidad: «un mes»', normalizarNumeros('el plazo máximo de un mes'), 'el plazo maximo de 1 mes');
  comprobar('cantidad: «una hora»', normalizarNumeros('una hora'), '1 hora');
  comprobar('cantidad: «un tercio» (fracción)', normalizarNumeros('reducida en un tercio'), 'reducida en 1 tercio');
  // Corregidas por el dato, no por la intuición: en este corpus son ordinal y
  // artículo, nunca unidad.
  comprobar('medido: «un segundo puesto» es ordinal', normalizarNumeros('desempeñar un segundo puesto'), 'desempenar un segundo puesto');
  comprobar('medido: «un medio de comunicación» es artículo', normalizarNumeros('a través de un medio de comunicación'), 'a traves de un medio de comunicacion');
  // Los compuestos no se tocan: ahí «un» es cola de número, no cabeza.
  comprobar('compuesto: «treinta y un días» sigue 31', normalizarNumeros('treinta y un días'), '31 dias');
  comprobar('compuesto: «ciento un» sigue 101', normalizarNumeros('ciento un días'), '101 dias');
  comprobar('«veintiún» no se ve afectado', normalizarNumeros('veintiún cartuchos'), '21 cartuchos');

  // «uno»: pronombre vs. cantidad. Los pronombres son los que afloraron al
  // dejar de inventar cifras en la fuente.
  comprobar('cantidad: «uno o varios»', normalizarNumeros('uno o varios'), '1 o varios');
  comprobar('cantidad: «uno o más»', normalizarNumeros('uno o más puestos'), '1 o mas puestos');
  comprobar('cantidad: «uno y cuatro» (enumeración)', normalizarNumeros('apartados uno y cuatro'), 'apartados 1 y 4');
  comprobar('pronombre: «uno de los»', normalizarNumeros('es uno de los ataques'), 'es uno de los ataques');
  comprobar('pronombre: «cada uno»', normalizarNumeros('cada uno con su forma'), 'cada uno con su forma');
  comprobar('pronombre: «uno u otro» (correlativo)', normalizarNumeros('uno u otro'), 'uno u otro');
  comprobar('pronombre: «uno y otro» (correlativo)', normalizarNumeros('uno y otro'), 'uno y otro');
  comprobar('compuesto: «treinta y uno» sigue 31', normalizarNumeros('treinta y uno'), '31');
  // Y lo que motivó todo: la cifra deja de aparecer donde nadie la escribió.
  comprobar('cifras: el artículo ya no inventa un 1',
    (normalizarNumeros('Es una excepción de alcance corto').match(/\d+/g) || []).length, 0);

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
