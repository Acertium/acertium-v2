// Acertium — pipeline / motor de absorción (BKT + olvido)
// Estima el dominio del usuario por concepto y programa el repaso.
// Refina el Doc 003: retención r = target^(Δt/τ)  ⇒  τ ES el intervalo natural
// (días hasta bajar al 90% de retención). La estabilidad crece según el espaciado,
// así empollar de golpe NO construye durabilidad.
//
// El log de eventos es la fuente de verdad; el estado (L, τ) es una caché que
// SIEMPRE se puede recomputar con recomputar(eventos).
//
//   import { crearEstado, actualizar, absorcion, proximoRepasoDias, recomputar } from './motor-bkt.mjs'

import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

export const PARAMS = {
  L0: 0.20,      // creencia inicial de dominio
  pT: 0.15,      // aprendizaje por intento (transición)
  pS: 0.10,      // slip: sabiéndolo, fallar
  tau0: 1.0,     // estabilidad inicial (días)
  target: 0.90,  // retención objetivo: τ = días hasta bajar a este nivel
  m: 2.2,        // multiplicador de estabilidad en un repaso a tiempo
  penal: 0.4,    // factor de estabilidad al fallar
  gcap: 4.0      // tope al crecimiento de estabilidad (evita saltos por repaso muy tardío)
};

// Adivinar (guess) según el formato de la actividad. Un test se SIRVE con 3
// alternativas (formato oficial PN, tanto en practicar como en simulacro), así que
// acertar al azar es 1/3; una V/F, 1/2 (evidencia débil); huecos/corta, casi nada.
export function pGporFormato(tipo) {
  switch (tipo) {
    case 'test':   return 1 / 3;
    case 'vf':     return 0.50;
    case 'huecos': return 0.05;
    case 'corta':  return 0.05;
    default:       return 0.20;
  }
}

export function crearEstado(P = PARAMS) {
  return { L: P.L0, tau: P.tau0, lastSeen: null };
}

// Retención en función del tiempo transcurrido (días) y la estabilidad.
export function retencion(dtDias, tau, P = PARAMS) {
  if (dtDias <= 0) return 1;
  return Math.pow(P.target, dtDias / tau);
}

// Absorción mostrada al usuario en un instante: creencia por retención actual.
export function absorcion(estado, ahoraDias, P = PARAMS) {
  if (estado.lastSeen === null) return estado.L;
  const dt = Math.max(0, ahoraDias - estado.lastSeen);
  return estado.L * retencion(dt, estado.tau, P);
}

// Días hasta el próximo repaso (cuando la retención baje al objetivo) = τ.
export function proximoRepasoDias(estado) {
  return estado.tau;
}

// Actualiza el estado con un intento. ev = { correcto, tipo, t } (t en días).
// Devuelve el mismo estado mutado + datos de traza.
export function actualizar(estado, ev, P = PARAMS) {
  const t = ev.t;
  const pG = ev.pG ?? pGporFormato(ev.tipo);
  const dt = estado.lastSeen === null ? 0 : Math.max(0, t - estado.lastSeen);
  const r = retencion(dt, estado.tau, P);

  // 1) olvido sobre la creencia
  const Lm = estado.L * r;
  // 2) observación bayesiana (slip / guess)
  let Lp;
  if (ev.correcto) {
    Lp = (Lm * (1 - P.pS)) / (Lm * (1 - P.pS) + (1 - Lm) * pG);
  } else {
    Lp = (Lm * P.pS) / (Lm * P.pS + (1 - Lm) * (1 - pG));
  }
  // 3) aprendizaje (se aplica siempre: también al fallar se aprende al ver la solución)
  estado.L = Lp + (1 - Lp) * P.pT;
  // 4) estabilidad, sensible al espaciado
  if (ev.correcto) {
    let g = 1 + (P.m - 1) * (1 - r) / (1 - P.target); // a tiempo→m, empollado→~1, tarde→bonus
    g = Math.min(g, P.gcap);
    estado.tau *= g;
  } else {
    estado.tau = Math.max(P.tau0, estado.tau * P.penal);
  }
  estado.lastSeen = t;
  return { r, L: estado.L, tau: estado.tau };
}

// Recomputa el estado desde el log de eventos (fuente de verdad).
// eventos: [{ correcto, tipo, t }] ordenados por t (días).
export function recomputar(eventos, P = PARAMS) {
  const s = crearEstado(P);
  for (const ev of eventos) actualizar(s, ev, P);
  return s;
}

// --- Self-test: node motor-bkt.mjs ---
if (esEjecucionDirecta(import.meta.url)) {
  const f2 = x => Number(x).toFixed(2);
  const f3 = x => Number(x).toFixed(3);
  console.log('A) ESPACIADO (repasa al vencer, acierta):');
  let s = crearEstado(); let day = 0;
  actualizar(s, { correcto: true, tipo: 'test', t: 0 });
  console.log(`  aprende: L=${f2(s.L)} τ=${f2(s.tau)}d`);
  for (let i = 0; i < 6; i++) {
    day += s.tau;
    const tr = actualizar(s, { correcto: true, tipo: 'test', t: day });
    console.log(`  día ${day.toFixed(1)}: repaso#${i + 1} r=${f2(tr.r)} L=${f3(s.L)} intervalo=${f2(s.tau)}d`);
  }
  console.log('\nB) EMPOLLAR (5 repasos el mismo día):');
  s = crearEstado(); actualizar(s, { correcto: true, tipo: 'test', t: 0 }); let t = 0;
  for (let i = 0; i < 5; i++) { t += 0.02; const tr = actualizar(s, { correcto: true, tipo: 'test', t }); console.log(`  #${i + 1} r=${f2(tr.r)} L=${f3(s.L)} τ=${f2(s.tau)}d`); }
  console.log(`  → mañana absorción = ${f2(absorcion(s, s.lastSeen + 1))} (τ se quedó en ~1d: sin durabilidad)`);
  console.log('\nC) UN FALLO A MITAD:');
  s = crearEstado(); actualizar(s, { correcto: true, tipo: 'test', t: 0 }); day = 0;
  for (const acc of [true, true, false, true]) { day += s.tau; actualizar(s, { correcto: acc, tipo: 'test', t: day }); console.log(`  acierto=${acc} L=${f3(s.L)} τ=${f2(s.tau)}d`); }
  console.log('\nD) V/F acertada (evidencia débil, pG=0.5) vs test:');
  let a = crearEstado(), b = crearEstado();
  actualizar(a, { correcto: true, tipo: 'vf', t: 0 });
  actualizar(b, { correcto: true, tipo: 'test', t: 0 });
  console.log(`  V/F → L=${f3(a.L)}   |   test → L=${f3(b.L)}  (la V/F sube menos)`);
}
