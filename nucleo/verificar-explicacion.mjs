// Acertium — núcleo / calidad de la EXPLICACIÓN
//
// Regla de Jonathan (22/08/2026): «que la explicación cite el artículo no me
// sirve, tiene que ser de ayuda».
//
// Lo que hay que entender de este fichero es DÓNDE ESTÁ SU LÍMITE. Detecta una
// sola cosa con fiabilidad —que la explicación arranque parafraseando el
// artículo— y no pretende saber si un texto «ayuda». Eso es criterio y no hay
// patrón que lo dé:
//
//   VCD-033  «La anchura de las celdas depende de su capacidad: 60 centímetros
//             en las individuales y 100 en las dobles.»          ← repite la respuesta
//   SEGT-008 «La distinción individual/colectiva ordena el concepto: la
//             individual mira a la persona; la colectiva, al conjunto.»  ← enseña
//
// Las dos son declarativas, de longitud parecida, sin marcadores. Ninguna regla
// las separa. Medido sobre el banco: 819 de 3.343 fallan la regla de la cita,
// 418 tienen marcador didáctico, y **2.176 no caen en ningún patrón**. Esos hay
// que leerlos, y el informe lo dice en vez de inventarse un porcentaje.
//
// Hoy esto AVISA, no bloquea. Un aviso que se puede ignorar es poco, pero una
// puerta con falsos positivos es peor: hay explicaciones que empiezan citando el
// artículo y después enseñan algo, y bloquearlas sería castigar contenido bueno.
// El mismo día en que se escribe esto se ha quitado una puerta del generador que
// daba 16 marcadas y 16 falsos positivos. Para el contenido NUEVO la regla vive
// donde tiene que vivir: en el contrato y en el prompt del motor.
//
//   import { revisarExplicacion } from './verificar-explicacion.mjs'
//   node nucleo/verificar-explicacion.mjs        (self-test)

import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

// Arranca nombrando el artículo: "El artículo 67 enumera…", "Art. 6 declara…".
// Es la firma de la paráfrasis, y es la regla que Jonathan enunció literalmente.
const ABRE_CITANDO = /^\s*(el\s+)?(art\.?|artículo)\s*\d/i;

// Verbo declarativo de manual. Con el arranque anterior, es paráfrasis segura.
const VERBO_DE_MANUAL =
  /\b(declara|enumera|define|establece|fija|dispone|recoge|señala|regula|prevé|contempla|determina|detalla|especifica|reconoce|configura|atribuye)\b/i;

// Señales de que el texto ENSEÑA: contrasta, avisa, ordena. No son obligatorias
// —hay explicaciones buenas sin ninguna— así que su ausencia no acusa de nada;
// su presencia sí sirve para dejar de sospechar.
const MARCADOR_DIDACTICO =
  /\b(no es|no basta|no confundir|no desde|no solo|no se|a diferencia|mientras que|en cambio|es la trampa|el error|ojo|conviene|hay que retener|memorizar|la clave|se suele|cuidado|frente a|por eso|de ahí)\b/i;

/**
 * @returns {{ estado: 'parafrasea'|'ensena'|'sin_clasificar', motivo: string }}
 */
export function revisarExplicacion(texto, opciones = {}) {
  const t = String(texto ?? "").trim();
  if (!t) return { estado: "parafrasea", motivo: "no hay explicación" };

  // Repetir la opción correcta es el otro fallo que sí se puede ver, cuando se
  // pasa la correcta para compararla.
  const correcta = String(opciones.correcta ?? "").trim();
  if (correcta.length >= 30 && t.includes(correcta))
    return { estado: "parafrasea", motivo: "contiene la opción correcta literal: no añade nada a lo que acaba de leer" };

  if (ABRE_CITANDO.test(t)) {
    const conVerbo = VERBO_DE_MANUAL.test(t);
    // Si después de la cita hay marcador didáctico, probablemente enseñe algo y
    // solo tenga mal la entrada. Se distingue para no mezclar «hay que
    // reescribirla entera» con «hay que cambiarle la primera frase».
    if (MARCADOR_DIDACTICO.test(t))
      return { estado: "sin_clasificar", motivo: "abre citando el artículo, pero después contrasta: revisar solo la entrada" };
    return {
      estado: "parafrasea",
      motivo: conVerbo
        ? "abre con «artículo N» + verbo declarativo: es el artículo parafraseado"
        : "abre citando el artículo",
    };
  }

  if (MARCADOR_DIDACTICO.test(t))
    return { estado: "ensena", motivo: "contrasta, avisa o distingue" };

  return { estado: "sin_clasificar", motivo: "no cae en ningún patrón: hay que leerla" };
}

export function informe(entradas) {
  const cuenta = { parafrasea: 0, ensena: 0, sin_clasificar: 0 };
  const detalle = [];
  for (const e of entradas) {
    const r = revisarExplicacion(e.explicacion, { correcta: e.correcta });
    cuenta[r.estado]++;
    if (r.estado === "parafrasea") detalle.push({ id: e.id, motivo: r.motivo });
  }
  return { cuenta, detalle };
}

// --- Self-test: node verificar-explicacion.mjs ---
// Las cadenas salen del banco (22/08/2026), no están inventadas.
if (esEjecucionDirecta(import.meta.url)) {
  let fallos = 0;
  const caso = (esperado, texto, extra = {}) => {
    const r = revisarExplicacion(texto, extra);
    const ok = r.estado === esperado;
    if (!ok) fallos++;
    console.log(`${ok ? "✓" : "✗"} ${esperado.padEnd(15)} ${r.estado !== esperado ? `(dio ${r.estado}) ` : ""}${texto.slice(0, 68)}`);
  };

  console.log("— parafrasean el artículo (regla de Jonathan) —");
  caso("parafrasea", "El artículo 6 declara armas de guerra, cuya adquisición, tenencia y uso quedan prohibidos a particulares, las de calibre igual o superior a 20 milímetros.");
  caso("parafrasea", "El artículo 67 enumera las causas del pase a segunda actividad: la insuficiencia de las aptitudes psicofísicas; la petición propia una vez cumplidas las edades.");
  caso("parafrasea", "El artículo 30 define los Planes de Apoyo Operativo como documentos operativos con las medidas que las Administraciones Públicas ponen en marcha.");
  caso("parafrasea", "El artículo 1.5 dibuja el esqueleto del Ministerio: cuatro grandes bloques.");

  console.log("\n— repiten la respuesta —");
  caso("parafrasea", "La anchura de las celdas depende de su capacidad: 60 centímetros en las individuales y 100 centímetros en las dobles.",
    { correcta: "60 centímetros en las individuales y 100 centímetros en las dobles" });

  console.log("\n— enseñan —");
  caso("ensena", "Dos en el propio; cuatro en el ajeno; tres en el mancomunado. Es la trampa clásica.");
  caso("ensena", "Dos días para resolver, y el cómputo de la prórroga arranca desde la expiración del plazo anterior, no desde el auto.");
  caso("ensena", "El estatuto no es inmunidad frente a la expulsión, pero se rodea de garantías: se sigue el procedimiento de extranjería.");
  caso("ensena", "Es la válvula de escape del precepto, y exige motivación expresa en la sentencia. No es automática.");

  console.log("\n— abre citando pero después enseña: solo la entrada —");
  caso("sin_clasificar", "El artículo 15 fija los plazos, pero ojo: el cómputo no arranca con la falta sino con su conocimiento.");

  console.log("\n— no cae en ningún patrón: hay que leerla —");
  caso("sin_clasificar", "La distinción individual/colectiva ordena el concepto: la seguridad individual mira a la persona; la colectiva, al conjunto social.");

  console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ todo en orden");
  process.exit(fallos ? 1 : 0);
}
