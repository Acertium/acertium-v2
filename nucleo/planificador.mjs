// Acertium — pipeline / planificador (el "coach")
// Capa sobre el motor BKT (Doc 003 parte B). Cada sesión reparte el presupuesto
// entre CONSOLIDAR (repasos que vencen) y AMPLIAR (conceptos nuevos), según el
// tiempo al examen y la disponibilidad. Puro y determinista; no toca la nube.
//
//   import { planDia, cobertura, PLAN } from './planificador.mjs'
//
// ctx = {
//   conceptos: [{ id, peso }],                 // universo de la convocatoria (overlay)
//   estados:   { [id]: { e: <estadoBKT>, seen } },
//   prereq:    { [id]: [idsPrereq] },          // aristas 'prerrequisito' del grafo
//   examDay, hoy, inicio, B,                    // días (índices) y presupuesto (ítems/día)
//   ritmoMinimoNuevos                           // suelo de conceptos nuevos/día (opcional)
// }

import { absorcion, PARAMS } from './motor-bkt.mjs';
import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

export const PLAN = {
  ventana: 19,          // ventana de estabilización (≈ suma de los 4 primeros intervalos)
  gatingL: 0.6,         // no se introduce un concepto si un prerrequisito está por debajo
  capNewNormal: 0.6,    // tope de nuevos sobre el presupuesto (modo normal)
  capNewTriaje: 0.8,    // tope de nuevos en triaje (hay que cubrir temario deprisa)
  target: PARAMS.target // 0.9
};

// Plan de la sesión de hoy: qué repasar y qué introducir.
export function planDia(ctx, P = PLAN) {
  const { conceptos, estados, prereq = {}, examDay, hoy, inicio = 0, B,
          ritmoMinimoNuevos = 0 } = ctx;
  const A = id => absorcion(estados[id].e, hoy);

  // Triaje = nunca hubo margen sano (horizonte total ≤ ventana). Si SÍ lo hubo,
  // al pasar el corte entramos en consolidación (cero nuevos), no en triaje.
  const triage = (examDay - inicio) <= P.ventana;
  const cutoff = examDay - P.ventana;

  // Vencidos (absorción ≤ objetivo): prioridad por peso × cuánto ha decaído.
  const due = conceptos
    .filter(c => estados[c.id].seen && A(c.id) <= P.target + 1e-9)
    .sort((a, b) => (b.peso * (P.target - A(b.id))) - (a.peso * (P.target - A(a.id))));

  // Nuevos disponibles: prerrequisitos listos (todos con L ≥ gating). Por peso.
  const nuevos = conceptos
    .filter(c => !estados[c.id].seen && (prereq[c.id] || []).every(p => estados[p] && estados[p].e.L >= P.gatingL))
    .sort((a, b) => b.peso - a.peso);

  const restN = conceptos.filter(c => !estados[c.id].seen).length;
  const daysLeft = Math.max(1, examDay - hoy + 1);

  let quota;
  if (triage) quota = Math.ceil(restN / daysLeft);                       // reparte lo que quede, sin rendirse
  else if (hoy <= cutoff) quota = Math.ceil(restN / Math.max(1, cutoff - hoy + 1)); // ritmo uniforme hasta el corte
  else quota = 0;                                                        // pasado el corte: solo consolidar

  // SUELO DE RITMO — la paradoja de Zeno del horizonte rodante.
  // `quota` es proporcional a lo que queda; si además el horizonte se aleja un
  // día por cada día que pasa (el caso de quien estudia SIN fecha), el ritmo
  // decae geométricamente y el temario no se termina nunca: medido, 21 nuevos
  // el primer día, 8 el 160 y 2 el 400, con 211 conceptos aún sin tocar.
  // Con un suelo, el ritmo se mantiene y la cobertura se cierra de verdad.
  //
  // Importa especialmente desde que el peso ordena: sin suelo, la cola que no
  // llega nunca son SIEMPRE los mismos conceptos —los de menor peso—, y eso
  // convertiría «no priorizar» en «no cubrir», que es justo lo que la regla de
  // cobertura total prohíbe. Solo aplica cuando quedan nuevos por introducir.
  if (quota > 0 || (ritmoMinimoNuevos > 0 && restN > 0 && hoy <= cutoff))
    quota = Math.max(quota, Math.min(ritmoMinimoNuevos, restN));

  const capNew = Math.floor(B * (triage ? P.capNewTriaje : P.capNewNormal));
  const reserveNew = Math.min(quota, nuevos.length, capNew);            // hueco garantizado para nuevos
  const nDue = Math.min(due.length, B - reserveNew);                    // repasos primero, hasta dejar sitio
  const nNew = Math.min(quota, nuevos.length, B - nDue);

  return {
    modo: triage ? 'triaje' : (hoy > cutoff ? 'consolidacion' : 'normal'),
    consolidar: due.slice(0, nDue).map(c => c.id),
    ampliar: nuevos.slice(0, nNew).map(c => c.id),
    backlog: Math.max(0, due.length - nDue),   // repasos vencidos que no caben hoy
    cutoff
  };
}

// Cobertura honesta en un instante. Dos números, no uno:
//  - dominado: peso de conceptos con absorción ≥ objetivo (memoria durable)
//  - esperada: absorción media ponderada (fracción del temario que previsiblemente aciertas)
export function cobertura(ctx, P = PLAN) {
  const { conceptos, estados, dia } = ctx;
  const Wt = conceptos.reduce((s, c) => s + c.peso, 0) || 1;
  let dom = 0, esp = 0;
  for (const c of conceptos) {
    const seen = estados[c.id].seen;
    const a = seen ? Math.min(1, Math.max(0, absorcion(estados[c.id].e, dia))) : 0;
    if (seen && a >= P.target) dom += c.peso;
    esp += c.peso * a;
  }
  return { dominado: dom / Wt, esperada: esp / Wt };
}

// --- Self-test: node planificador.mjs ---
if (esEjecucionDirecta(import.meta.url)) {
  const { crearEstado, actualizar } = await import('./motor-bkt.mjs');
  // Universo sintético: 30 conceptos; los 10 primeros pesan 3; cadena de prereqs en los 12 primeros.
  const conceptos = Array.from({ length: 30 }, (_, i) => ({ id: 'K' + i, peso: i < 10 ? 3 : 1 }));
  const prereq = {}; conceptos.forEach((c, i) => prereq[c.id] = (i > 0 && i < 12) ? ['K' + (i - 1)] : []);
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pS = PARAMS.pS, pG = 0.25;

  function correr(nombre, { examDay, B }) {
    const estados = {}; conceptos.forEach(c => estados[c.id] = { e: crearEstado(), seen: false });
    let backlogDias = 0, modo = '';
    for (let hoy = 1; hoy <= examDay; hoy++) {
      const plan = planDia({ conceptos, estados, prereq, examDay, hoy, inicio: 0, B });
      modo = plan.modo; if (plan.backlog > 0) backlogDias++;
      for (const id of plan.ampliar) { estados[id].seen = true; const p = 0.2 * (1 - pS) + 0.8 * pG; actualizar(estados[id].e, { correcto: rnd() < p, tipo: 'test', t: hoy }); }
      for (const id of plan.consolidar) { const a = absorcion(estados[id].e, hoy); const p = a * (1 - pS) + (1 - a) * pG; actualizar(estados[id].e, { correcto: rnd() < p, tipo: 'test', t: hoy }); }
    }
    const cov = cobertura({ conceptos, estados, dia: examDay });
    const vistos = conceptos.filter(c => estados[c.id].seen).length;
    console.log(`${nombre}: modo=${modo} vistos=${vistos}/30 dominado=${(100 * cov.dominado).toFixed(0)}% esperada=${(100 * cov.esperada).toFixed(0)}% backlog=${backlogDias}d`);
  }
  correr('HOLGADO (examen d45, 12/día)', { examDay: 45, B: 12 });
  correr('AJUSTADO (examen d25, 11/día)', { examDay: 25, B: 11 });
  correr('TRIAJE  (examen d12, 10/día)', { examDay: 12, B: 10 });
}
