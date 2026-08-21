// ---------------------------------------------------------------------------
// EL SALUDO DE LA PANTALLA HOY
//
// "Hola de nuevo" era correcto y no decía nada. Lo que hace que un Duolingo
// enganche no es la frase graciosa suelta: es que la frase SABE algo de ti. Aquí
// lo que sabe es, sobre todo, QUÉ HORA ES —"¿un café y unos tests?" a las siete
// de la mañana, "últimos tests y a descansar" a las once de la noche—, y en dos
// momentos concretos, cuánto hace que no vienes.
//
// Cuatro decisiones de diseño que conviene no deshacer:
//
// 1. LA HORA MANDA EN EL CASO NORMAL. Es lo que cambia varias veces al día y lo
//    que hace que la app parezca acompañarte en tu jornada, no en tu expediente.
// 2. DOS ESTADOS LE GANAN A LA HORA: la primera visita y la vuelta tras una
//    ausencia larga. A quien vuelve después de tres semanas, un "¿sobremesa
//    productiva?" le suena a que nadie se ha enterado de nada.
// 3. NUNCA SE RIÑE AL QUE VUELVE. Una ausencia larga es justo el momento en que
//    el opositor está más cerca de abandonar; el que vuelve tras dos semanas se
//    encuentra una puerta abierta, no una factura. Es la misma razón por la que
//    el backlog dejó de llamarse "repasos atrasados".
// 4. DENTRO DE UNA MISMA FRANJA, LA ROTACIÓN VA POR DÍA, NO POR VISITA. La
//    frase debe cambiar al pasar de la mañana a la tarde —para eso está—, pero
//    no en cada refresco dentro de la misma franja: eso daría sensación de
//    ruleta y restaría credibilidad a lo que dice.
//
// LA HORA ES LA DE MADRID, NO LA DEL SERVIDOR. Esta pantalla se renderiza en el
// servidor (`force-dynamic`), y en Vercel el reloj del servidor va en UTC: sin
// esto, un "buenos días" de las 08:00 se calcularía como las 06:00 y en verano
// saldría la frase de madrugada. Se fija `Europe/Madrid` porque el piloto es una
// oposición española. Queda una desviación conocida de una hora en Canarias; se
// asume a cambio de no partir la pantalla en cliente ni pedir la ubicación.
//
// Sin datos personales: solo se usa cuántos días hace del último evento, que ya
// está en el log. No hay nombre, ni racha guardada, ni nada que persistir.
// ---------------------------------------------------------------------------

export type EstadoSaludo = {
  /** Días desde la última respuesta. null si nunca ha practicado. */
  diasSinVenir: number | null;
  /**
   * Días hasta la fecha que SE HA FIJADO EL OPOSITOR en su perfil. null si
   * estudia sin fecha, que es lo normal al principio y un estado legítimo.
   *
   * NUNCA sale de la convocatoria. Que el BOE publique una fecha no significa
   * que este opositor se presente a ESA: lo habitual es tardar varias, y hay
   * quien empieza pensando en dentro de un par de años. Contarle los días para
   * un examen al que no va no es motivador, es falso.
   */
  diasHastaExamen?: number | null;
};

const ZONA = "Europe/Madrid";

/**
 * Hora (0-23) y un índice de día correlativo, ambos leídos en el huso de
 * Madrid. El índice de día tiene que salir de la fecha de ALLÍ y no de la del
 * servidor: entre medianoche y las dos de la madrugada en España, en UTC
 * todavía es el día anterior, y la frase "del día" cambiaría a destiempo.
 */
function enMadrid(ahora: Date): { hora: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(ahora);
  const v = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return {
    // Algunas versiones de ICU devuelven "24" para la medianoche con hour12:false.
    hora: v("hour") % 24,
    dia: Math.floor(Date.UTC(v("year"), v("month") - 1, v("day")) / 86400000),
  };
}

// --- Franjas del día --------------------------------------------------------
// Frases cortas, en voz de profesor cercano: ni animadoras vacías ("¡TÚ
// PUEDES!") ni frías. Se permite media sonrisa. Ninguna promete resultados ni
// menciona fechas del proceso selectivo: la convocatoria no fija fecha de examen
// y no vamos a inventarla en un saludo.

const MADRUGADA = [
  "¿A estas horas? Va, unas pocas y a la cama",
  "Modo búho activado",
  "El temario no duerme, pero tú deberías",
  "Silencio absoluto: se rinde de maravilla",
];

const TEMPRANO = [
  "¿Un café y unos tests?",
  "Buenos días. Empezar pronto es media batalla",
  "Antes de que el mundo se ponga en marcha",
  "Café en mano, arrancamos",
  "A esta hora no compites con nadie",
];

const MANANA = [
  "A media mañana se rinde bien",
  "Buen momento: la cabeza aún está fresca",
  "Un rato ahora y el día ya está salvado",
  "Vamos con lo de hoy",
  "Media mañana, media hora",
];

const MEDIODIA = [
  "Después de comer, poquito y bueno",
  "Sobremesa productiva",
  "Justo lo que cabe antes del café",
  "Media horita y sigues con tu día",
];

const TARDE = [
  "La tarde es buena para repasar",
  "Un rato ahora y luego lo tuyo",
  "Tarde de temario",
  "Antes de que se te eche la noche",
  "Lo hacemos ahora y ya está hecho",
];

const NOCHE = [
  "Últimos tests y a descansar",
  "Cierra el día con unos pocos",
  "Un último empujón y a la cama",
  "Se acaba el día: lo justo y a dormir",
];

// --- Estados que le ganan a la hora ----------------------------------------

const PRIMERA_VEZ = [
  "Empezamos",
  "Bienvenido a bordo",
  "Vamos allá",
  "Aquí empieza lo tuyo",
];

const MUCHOS_DIAS = [
  "Bienvenido de vuelta",
  "Sin reproches: seguimos",
  "Lo dejamos donde estaba",
  "Te esperaba tu temario",
];

// --- La recta final, solo si él puso la fecha ------------------------------
// Estas frases dicen un número, así que solo aparecen cuando ese número es suyo.
// Y solo cerca: a ciento veinte días, "quedan 120" no dice nada y a algunos les
// pesa. Se activa en la última quincena, que es cuando la cuenta atrás ayuda a
// decidir qué hacer hoy en vez de solo dar ansiedad.
const VISPERA = 15;

function rectaFinal(dias: number): string | null {
  if (dias < 0) return null;
  if (dias === 0) return "Hoy es el día. Un repaso suave y a por ello";
  if (dias === 1) return "Mañana. Hoy toca repasar, no aprender nada nuevo";
  if (dias <= 3) return `Quedan ${dias} días: a afianzar lo que ya sabes`;
  if (dias <= VISPERA) return `Quedan ${dias} días. Vamos con lo de hoy`;
  return null;
}

/** Franjas en horas de Madrid. Los cortes van donde cambia lo que apetece oír. */
function franja(hora: number): string[] {
  if (hora < 6) return MADRUGADA;
  if (hora < 9) return TEMPRANO;
  if (hora < 13) return MANANA;
  if (hora < 16) return MEDIODIA;
  if (hora < 21) return TARDE;
  return NOCHE;
}

function delDia(frases: string[], dia: number): string {
  return frases[dia % frases.length];
}

/** Se considera ausencia larga a partir de una semana sin aparecer. */
const AUSENCIA_LARGA = 7;

export function saludo(e: EstadoSaludo, ahora: Date = new Date()): string {
  const { hora, dia } = enMadrid(ahora);
  if (e.diasSinVenir === null) return delDia(PRIMERA_VEZ, dia);

  // La recta final gana a todo lo demás, incluida la ausencia larga: a tres días
  // del examen, lo que más ayuda es saber en qué punto está y qué toca hoy, y
  // "quedan 3 días: a afianzar lo que ya sabes" tampoco riñe a nadie. Eso sí,
  // solo si la fecha la puso él y solo en la última quincena.
  if (e.diasHastaExamen != null) {
    const f = rectaFinal(e.diasHastaExamen);
    if (f) return f;
  }

  if (e.diasSinVenir >= AUSENCIA_LARGA) return delDia(MUCHOS_DIAS, dia);
  return delDia(franja(hora), dia);
}

// Frase de apoyo bajo el plan del día. Habla del ESFUERZO, no del resultado:
// felicitar por un acierto invita a evitar lo difícil, y aquí lo difícil es
// justo lo que hay que practicar. Esta sí rota solo por día: es el poso del día,
// no un comentario sobre la hora.
const ANIMOS = [
  "Poco y a menudo gana a mucho de golpe.",
  "El truco no es estudiar más horas, es no dejar de venir.",
  "Cada repaso de hoy es media hora que no tendrás que echar luego.",
  "Nadie se sabe el temario entero. Se sabe el de hoy.",
  "Lo que hoy cuesta, en dos semanas sale solo.",
  "No hace falta que sea perfecto. Hace falta que sea seguido.",
];

export function animo(ahora: Date = new Date()): string {
  return delDia(ANIMOS, enMadrid(ahora).dia);
}
