// Acertium — pipeline / verificador de cotejo
// Guarda de salida (Doc 001 §6b): una actividad solo es "verificado" si su
// respuesta correcta está literalmente sostenida por el texto de la fuente.
// Incluye normalización número<->letra en español (0-999), porque la ley
// escribe los números con palabra ("setenta y dos horas" = "72 horas").
//
// Uso:
//   import { verificarActividad, normalizarNumeros } from './verificador-cotejo.mjs'
//   verificarActividad({ tipo:'test', respuesta:{correcta:'72 horas'}, cotejo:'...setenta y dos horas...' })

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
export function normalizarNumeros(texto) {
  const tokens = sinAcentos(String(texto).toLowerCase()).match(/\d+|[a-zñ]+/g) || [];
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    if (esNumeroPalabra(tokens[i])) {
      let suma = 0, j = i;
      while (j < tokens.length) {
        if (esNumeroPalabra(tokens[j])) { suma += VALOR[tokens[j]]; j++; continue; }
        // "y" solo conecta si va seguida de otra palabra-número (setenta y dos)
        if (tokens[j] === 'y' && j + 1 < tokens.length && esNumeroPalabra(tokens[j + 1])) { j++; continue; }
        break;
      }
      out.push(String(suma));
      i = j;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out.join(' ');
}

function contiene(cotejo, fragmento) {
  return normalizarNumeros(cotejo).includes(normalizarNumeros(fragmento));
}

// Verifica una actividad contra su cotejo. Devuelve {ok, motivo}.
// - test / corta: la respuesta debe aparecer (normalizada) en el cotejo.
// - huecos: cada hueco debe aparecer en el cotejo.
// - vf: no se puede cotejar por substring (es una afirmación verdadera o falsa);
//       requiere juicio semántico -> se marca como 'requiere-revision-humana'.
export function verificarActividad(act) {
  const cotejo = act.cotejo || act.cotejo_fuente || '';
  const r = act.respuesta || {};
  switch (act.tipo) {
    case 'test': {
      const val = r.correcta ?? '';
      return contiene(cotejo, val)
        ? { ok: true, motivo: 'respuesta sostenida por el cotejo' }
        : { ok: false, motivo: `no se encontró «${val}» en el cotejo` };
    }
    case 'corta': {
      const val = r.texto ?? '';
      return contiene(cotejo, val)
        ? { ok: true, motivo: 'respuesta sostenida por el cotejo' }
        : { ok: false, motivo: `no se encontró «${val}» en el cotejo` };
    }
    case 'huecos': {
      const huecos = r.huecos || [];
      const faltan = huecos.filter(h => !contiene(cotejo, h));
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
