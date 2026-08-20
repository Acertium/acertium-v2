// ---------------------------------------------------------------------------
// FORMATO DEL SIMULACRO — constantes y tipos compartidos entre servidor y
// cliente. Este módulo NO toca la base de datos ni importa `server-only`, así
// que el runner (componente cliente) puede leerlo sin arrastrar el cliente
// service-role del cerebro al bundle del navegador.
//
// Réplica de la prueba oficial de conocimientos de la Policía Nacional
// (base 6.1.1, BOE-A-2026-15055). Las cuatro constantes de abajo se verificaron
// el 20/08/2026 contra el PDF de la base 6.1.1 de BOE-A-2025-16610 y coinciden;
// queda por aclarar cuál de las dos referencias es la vigente, ver
// datos/legal-es/convocatoria/BOE-A-2025-16610-bases-examen.md:
//   · 100 preguntas · 3 alternativas por pregunta (solo una correcta)
//   · 50 minutos de tiempo total
//   · corrección oficial: nota = [A − E/(n−1)] × 10 / P, con n = 3 → cada 2
//     errores restan 1 acierto; las preguntas en blanco no puntúan ni penalizan.
// ---------------------------------------------------------------------------

// Número de preguntas y tiempo del examen oficial.
export const PREGUNTAS_SIMULACRO = 100;
export const SEGUNDOS_SIMULACRO = 50 * 60; // 3000 s = 50:00

// Modos más cortos (mismo formato y cadencia oficial de 30 s/pregunta).
export const PREGUNTAS_MEDIO = 50;
export const SEGUNDOS_MEDIO = 25 * 60; // 1500 s = 25:00

export const PREGUNTAS_RAPIDO = 25;
export const SEGUNDOS_RAPIDO = 12 * 60 + 30; // 750 s = 12:30

// Nota mínima (sobre 10) para "seguir en el proceso".
export const NOTA_MINIMA = 3;

// Nº de alternativas por pregunta en el examen oficial.
export const ALTERNATIVAS = 3;

export type PreguntaSimulacro = {
  actividadId: string;
  conceptoId: string;
  enunciado: string;
  opciones: string[]; // 3 alternativas ya barajadas, sin marcar la correcta
};

export type RespuestaUsuario = {
  actividadId: string;
  // null = pregunta dejada en blanco (ni puntúa ni penaliza).
  textoElegido: string | null;
  tiempoMs: number;
};

export type DetallePregunta = {
  actividadId: string;
  conceptoId: string;
  enunciado: string;
  textoElegido: string | null;
  correcta: string | null; // texto de la opción correcta
  acierto: boolean;
  explicacion: string | null;
  articulo: string | null;
  boeUrl: string | null;
};

export type ResumenSimulacro = {
  simulacroId: string | null;
  total: number; // P (preguntas del examen)
  aciertos: number; // A
  errores: number; // E
  blancos: number;
  nota: number; // sobre 10, 0..10
  duracionMs: number;
  detalle: DetallePregunta[];
};
