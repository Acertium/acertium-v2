// ---------------------------------------------------------------------------
// EL SALUDO DE LA PANTALLA HOY
//
// "Hola de nuevo" era correcto y no decía nada. Lo que hace que un Duolingo
// enganche no es la frase graciosa suelta: es que la frase SABE algo de ti. Por
// eso aquí no hay un bombo de frases al azar — el saludo se elige por el estado
// real del opositor (cuánto hace que no viene, si viene por primera vez, si ya
// ha estudiado hoy) y solo DENTRO de ese estado se rota.
//
// Dos decisiones de diseño que conviene no deshacer:
//
// 1. LA ROTACIÓN VA POR DÍA, NO POR VISITA. Si cambiara en cada refresco daría
//    sensación de ruleta y restaría credibilidad a lo que dice. Cambiando una
//    vez al día, el saludo parece que te acompaña.
// 2. NUNCA SE RIÑE AL QUE VUELVE. Una ausencia larga es justo el momento en que
//    el opositor está más cerca de abandonar; el que vuelve tras dos semanas se
//    encuentra una puerta abierta, no una factura. Es la misma razón por la que
//    el backlog dejó de llamarse "repasos atrasados".
//
// Sin datos personales: solo se usa cuántos días hace del último evento, que ya
// está en el log. No hay nombre, ni racha guardada, ni nada que persistir.
// ---------------------------------------------------------------------------

export type EstadoSaludo = {
  /** Días desde la última respuesta. null si nunca ha practicado. */
  diasSinVenir: number | null;
  /** Conceptos con absorción ≥ 0,9. */
  dominados: number;
};

// Cada bloque rota por día del año. Frases cortas, en voz de profesor cercano:
// ni animadoras vacías ("¡TÚ PUEDES!") ni frías. Se permite media sonrisa.
const PRIMERA_VEZ = [
  "Empezamos",
  "Bienvenido a bordo",
  "Vamos allá",
  "Aquí empieza lo tuyo",
];

const HOY_YA_ESTUVO = [
  "Otra vuelta, entonces",
  "Ya te echaba de menos",
  "Repetir es de listos",
  "Segunda ronda",
];

const AYER = [
  "Dos días seguidos",
  "Aquí sigues",
  "Puntual",
  "Vas cogiendo el ritmo",
];

const POCOS_DIAS = [
  "Cuánto bueno",
  "Ya estás aquí",
  "Retomamos",
  "Justo a tiempo",
];

const MUCHOS_DIAS = [
  "Bienvenido de vuelta",
  "Sin reproches: seguimos",
  "Lo dejamos donde estaba",
  "Te esperaba tu temario",
];

// Si ya domina bastante, se le reconoce. Sustituye al saludo por tiempo cuando
// hay algo de verdad que celebrar: es la única frase que presume, y presume de
// algo medido, no de la nada.
const CON_OFICIO = [
  "El de siempre",
  "Ya sabes de qué va esto",
  "A lo tuyo",
  "Como cada día",
];

function delDia(frases: string[], hoy: Date): string {
  // Día del año: la frase cambia a medianoche y se mantiene toda la jornada.
  const inicio = Date.UTC(hoy.getUTCFullYear(), 0, 0);
  const dia = Math.floor((hoy.getTime() - inicio) / 86400000);
  return frases[dia % frases.length];
}

// Umbral de "veterano": con 50 conceptos dominados ya no es alguien que está
// probando la app, y tratarlo como recién llegado suena a que no le conocemos.
const VETERANO = 50;

export function saludo(e: EstadoSaludo, ahora: Date = new Date()): string {
  const d = e.diasSinVenir;
  if (d === null) return delDia(PRIMERA_VEZ, ahora);
  // La ausencia manda sobre todo lo demás: es cuando el saludo más importa.
  if (d >= 7) return delDia(MUCHOS_DIAS, ahora);
  if (d >= 2) return delDia(POCOS_DIAS, ahora);
  // Viene hoy o ayer. Si además lleva rodaje, se le habla de tú a tú.
  if (e.dominados >= VETERANO) return delDia(CON_OFICIO, ahora);
  return delDia(d === 0 ? HOY_YA_ESTUVO : AYER, ahora);
}

// Frase de apoyo bajo el plan del día. Habla del ESFUERZO, no del resultado:
// felicitar por un acierto invita a evitar lo difícil, y aquí lo difícil es
// justo lo que hay que practicar.
const ANIMOS = [
  "Poco y a menudo gana a mucho de golpe.",
  "El truco no es estudiar más horas, es no dejar de venir.",
  "Cada repaso que haces hoy te ahorra media hora en junio.",
  "Nadie se sabe el temario entero. Se sabe el de hoy.",
  "Lo que hoy cuesta, en dos semanas sale solo.",
  "No hace falta que sea perfecto. Hace falta que sea seguido.",
];

export function animo(ahora: Date = new Date()): string {
  return delDia(ANIMOS, ahora);
}
