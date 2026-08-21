import "server-only";
import { createCerebroClient } from "@/lib/supabase/cerebro";
// Motor y planificador agnósticos (núcleo). Import JS: los tipos llegan como
// any, es aceptable. El BKT NO se reimplementa aquí: se reutiliza tal cual.
import { crearEstado, actualizar, absorcion } from "@/nucleo/motor-bkt.mjs";
import { planDia } from "@/nucleo/planificador.mjs";

const DIA_MS = 86400000;

// MVP sin auth todavía: usamos un usuario de prueba fijo. Cuando haya login,
// este id vendrá de la sesión (auth.uid()).
export const DEMO_USUARIO_ID = "c9959584-d908-4bda-8163-26d243d890e8";

export type ActividadPublica = {
  id: string;
  concepto_id: string;
  tipo: string;
  enunciado: string;
  opciones: string[] | null;
};

function barajar<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// EL TOPE DE 1.000 FILAS, Y POR QUÉ YA NO NOS AFECTA (20/08/2026)
//
// PostgREST corta toda respuesta en `db-max-rows` (1.000 en Supabase por
// defecto) y NO avisa: devuelve 1.000 filas y `error: null`. Con 3.343
// conceptos, cuatro consultas de este fichero recibían un tercio de la realidad
// sin que nada fallara. La grave era `practicar_estado`: el PLANIFICADOR solo
// veía 1.000 conceptos, así que 2.343 no podían salir a practicar NUNCA.
//
// El primer arreglo fue paginar con `.range()`. Correcto pero caro: cuatro
// peticiones SECUENCIALES por pantalla, y /hoy hacía además las suyas.
//
// El arreglo definitivo mueve el trabajo a Postgres, que es donde están los
// datos. Tres funciones nuevas, cada una de UNA sola vuelta:
//
//   · `practicar_estado_json` — el universo entero dentro de un jsonb. El tope
//     cuenta FILAS, así que una fila con 3.343 objetos dentro no lo toca.
//   · `progreso_temas`        — agrega por tema en SQL y devuelve ~45 filas.
//   · `resumen_usuario`       — los cinco conteos de /hoy en una consulta.
//
// No se sube `db-max-rows` en el proyecto a propósito: el tope volvería a
// aparecer al crecer el cerebro y subirlo afecta a todos los endpoints. Con
// este diseño el tamaño del cerebro deja de importar.
//
// Medido antes y después sobre `practicar_estado` (EXPLAIN ANALYZE):
//   387 ms ejecución + 108 ms planificación, ×4 vueltas
//    →  45 ms ejecución +   2 ms planificación, ×1 vuelta
// La mejora viene de tres sitios: un índice parcial sobre las actividades
// servibles, sustituir una subconsulta correlada que corría 3.343 veces por una
// agregación previa, y dejar de paginar.
// ---------------------------------------------------------------------------

// Formato EXAMEN OFICIAL PN: 3 alternativas. Reduce las 4 opciones guardadas a
// la correcta + 2 distractores al azar y las baraja. La respuesta correcta NO se
// marca ni se envía: la corrección se hace en el servidor por texto (responder()).
type FilaActividad = ActividadPublica & {
  respuesta?: { correcta?: string } | null;
};

function aPublica(a: FilaActividad): ActividadPublica {
  const correcta = a.respuesta?.correcta ?? null;
  let opciones = Array.isArray(a.opciones) ? a.opciones : [];
  if (correcta && opciones.length > 3) {
    const distractores = barajar(opciones.filter((o) => o !== correcta)).slice(0, 2);
    opciones = barajar([correcta, ...distractores]);
  }
  return {
    id: a.id,
    concepto_id: a.concepto_id,
    tipo: a.tipo,
    enunciado: a.enunciado,
    opciones,
  };
}

// ---------------------------------------------------------------------------
// EL PROFESOR: selector de la siguiente pregunta.
//
// Antes se servía al azar (`siguiente_actividad_test()`), con el motor BKT y el
// planificador escritos pero sin decidir nada. Ahora deciden ellos:
//
//   1) `practicar_estado(conv, usuario)` trae, en UNA consulta, todos los
//      conceptos de la convocatoria que tienen pregunta verificada, con su peso,
//      su estado BKT cacheado (`estado_dominio`) y sus prerrequisitos.
//   2) `planDia()` (núcleo) reparte entre CONSOLIDAR (vencidos: absorción por
//      debajo del objetivo, ordenados por peso × cuánto han decaído) y AMPLIAR
//      (nuevos con los prerrequisitos ya dominados), con la reserva
//      anti-inanición del planificador.
//   3) Se elige un concepto respetando esa proporción y se sirve una de sus
//      preguntas al azar.
//
// Propiedades que esto garantiza:
//   · Los flojos y los vencidos salen antes que los dominados.
//   · Un dominado NO desaparece: su retención decae (r = L·0,9^(Δt/τ)) y vuelve
//     a entrar en «vencidos». Como τ crece con cada acierto, reaparece a
//     intervalos cada vez más largos (repaso espaciado).
//   · Ningún concepto se cae del sistema: si el gating por prerrequisitos
//     bloquea a TODOS los nuevos, se abre la puerta igualmente (ver `sinGating`).
//   · Arranque en frío (sin historial): no hay vencidos, así que todo el
//     presupuesto va a nuevos y funciona desde la primera pregunta.
//   · Si algo falla, se cae al azar puro. Nunca se queda sin pregunta.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// LOS DOS MODOS DEL COACH: CON FECHA Y SIN FECHA
//
// El planificador razona con un horizonte hasta el examen, y ese horizonte NO
// sale de la convocatoria. Que el BOE publique una fecha no significa que este
// opositor se presente a ESA: lo normal es tardar varias convocatorias, y hay
// quien empieza con calma pensando en dentro de un par de años. Suponerle una
// fecha que no ha elegido hace dos daños — el coach le corta la materia nueva 19
// días antes de un examen al que no va, y la app le habla de una cuenta atrás
// ajena. Así que la fecha la pone el opositor en su perfil, o no la pone.
//
//   · MODO MARATÓN (`usuario.fecha_objetivo` a NULL). Horizonte rodante: el
//     examen está siempre a 180 días vista, así que se aleja un día por cada día
//     que pasa. Consecuencia querida: nunca llega el corte, nunca se deja de
//     introducir materia nueva, y el reparto diario es estable. Consecuencia que
//     conviene saber: `triaje` y `consolidacion` son inalcanzables en este modo
//     —matemáticamente, no por casualidad—, porque ambos comparan `hoy` con un
//     `cutoff` que huye a la misma velocidad.
//   · MODO FECHA (hay `fecha_objetivo`). Horizonte real y decreciente: el
//     `cutoff` se acerca, la cuota diaria de conceptos nuevos sube para que quepa
//     todo el temario antes de él, y al pasarlo el coach entra en
//     `consolidacion` (cero nuevos, solo repaso). Si el margen desde el primer
//     día ya era menor que la ventana de estabilización, arranca en `triaje`.
//
// OJO A LO QUE **NO** DEPENDE DE ESTO: el espaciado de cada repaso. El intervalo
// τ de `motor-bkt.mjs` sale solo de cómo respondes y de cuándo — no mira el
// calendario. La repetición espaciada funciona igual de bien sin fecha; lo que
// la fecha cambia es la MEZCLA entre avanzar temario y consolidar lo visto.
// ---------------------------------------------------------------------------

/** Horizonte del modo maratón: el examen siempre a esta distancia. */
const HORIZONTE_DIAS = 180;
/** `PLAN.ventana` del planificador: los días finales en que ya no entra materia. */
const VENTANA_ESTABILIZACION = 19;
// Presupuesto de ítems/día con el que se reparte consolidar vs ampliar. No
// limita cuánto practica el usuario: solo fija la PROPORCIÓN de cada tipo.
const PRESUPUESTO_DIARIO = 40;

type FilaEstado = {
  concepto_id: string;
  peso: number | null;
  l: number | null;
  tau: number | null;
  last_seen: string | null;
  prereqs: string[] | null;
};

// Elige al azar entre los `n` primeros de una lista ya ordenada por prioridad.
// Mantiene la prioridad (siempre sale de la cabeza) sin ser determinista, para
// que un fallo no devuelva la misma pregunta una y otra vez.
function deLaCabeza(ids: string[], n = 5): string | null {
  if (ids.length === 0) return null;
  const k = Math.min(n, ids.length);
  return ids[Math.floor(Math.random() * k)];
}

type Universo = {
  conceptos: { id: string; peso: number }[];
  estados: Record<string, { e: unknown; seen: boolean }>;
  prereq: Record<string, string[]>;
  hoy: number;
  /** Día (índice) del examen que se ha fijado el opositor. null = sin fecha. */
  examenDia: number | null;
  /** Día (índice) en que fijó esa fecha. Es el `inicio` del planificador. */
  fijadaDia: number | null;
};

/**
 * Fecha objetivo del opositor y cuándo la fijó, en días desde época. Se lee de
 * `usuario`, NUNCA de `convocatoria`.
 *
 * Las fechas se convierten con `Date.UTC` y no con `new Date(cadena)`: `hoy` se
 * cuenta como `Date.now() / DIA_MS`, que es una escala UTC, y todas tienen que
 * ir en la misma o la resta saldría desplazada según el huso del servidor. Se
 * hace explícito en vez de confiar en cómo parsea cada motor una fecha suelta.
 */
async function fechaObjetivoDias(
  db: ReturnType<typeof createCerebroClient>,
): Promise<{ examenDia: number | null; fijadaDia: number | null }> {
  const { data, error } = await db
    .from("usuario")
    .select("fecha_objetivo, fecha_objetivo_fijada")
    .eq("id", DEMO_USUARIO_ID)
    .maybeSingle();
  const f = error ? null : ((data?.fecha_objetivo ?? null) as string | null);
  if (!f) return { examenDia: null, fijadaDia: null };
  const [a, m, d] = f.split("-").map(Number);
  const puesta = (data?.fecha_objetivo_fijada ?? null) as string | null;
  return {
    examenDia: Date.UTC(a, m - 1, d) / DIA_MS,
    fijadaDia: puesta ? new Date(puesta).getTime() / DIA_MS : null,
  };
}

// Trae de la base el universo practicable con el que razona el planificador.
// Lo comparten `/practicar` (para elegir la siguiente pregunta) y `/hoy` (para
// contar el plan del día): así las dos pantallas dicen lo mismo, porque
// preguntan a lo mismo.
async function cargarUniverso(
  db: ReturnType<typeof createCerebroClient>,
): Promise<Universo | null> {
  // UNA sola vuelta: `practicar_estado_json` devuelve el universo entero dentro
  // de un jsonb. El tope de PostgREST cuenta FILAS, así que una fila con 3.343
  // objetos dentro no lo toca; antes eran 4 peticiones paginadas seguidas.
  // La fecha objetivo va EN PARALELO: es una fila diminuta y no depende de esto.
  const [{ data, error }, { examenDia, fijadaDia }] = await Promise.all([
    db.rpc("practicar_estado_json", {
      conv: CONVOCATORIA_PN,
      usuario: DEMO_USUARIO_ID,
    }),
    fechaObjetivoDias(db),
  ]);
  const filas = (error ? [] : ((data ?? []) as FilaEstado[]));
  if (filas.length === 0) return null;

  const hoy = Date.now() / DIA_MS;
  const conceptos: { id: string; peso: number }[] = [];
  const estados: Record<string, { e: unknown; seen: boolean }> = {};
  const prereqCrudo: Record<string, string[]> = {};

  for (const f of filas) {
    conceptos.push({ id: f.concepto_id, peso: f.peso ?? 1 });
    prereqCrudo[f.concepto_id] = f.prereqs ?? [];
    // Visto = tiene fila en la caché `estado_dominio`.
    const visto = f.l !== null && f.last_seen !== null;
    estados[f.concepto_id] = {
      e: visto
        ? {
            L: f.l as number,
            tau: f.tau as number,
            lastSeen: new Date(f.last_seen as string).getTime() / DIA_MS,
          }
        : crearEstado(),
      seen: visto,
    };
  }

  // Los prerrequisitos que apuntan FUERA del universo practicable (conceptos sin
  // pregunta verificada todavía) se descartan: si no, bloquearían para siempre a
  // su dependiente y ese concepto no saldría jamás.
  const prereq: Record<string, string[]> = {};
  for (const [id, ps] of Object.entries(prereqCrudo)) {
    prereq[id] = ps.filter((p) => estados[p] !== undefined);
  }

  return { conceptos, estados, prereq, hoy, examenDia, fijadaDia };
}

type PlanDia = {
  modo: string;
  consolidar: string[];
  ampliar: string[];
  backlog: number;
};

function planDelDia(u: Universo): PlanDia {
  // Con fecha, el horizonte es real y se acorta solo. Sin fecha, rueda con el
  // día (ver el bloque de los dos modos, arriba).
  //
  // UNA FECHA VENCIDA NO ES UNA FECHA. Si ya pasó y el opositor todavía no ha
  // cerrado el ciclo en /hoy, se planifica como si no la hubiera: con
  // `examDay < hoy`, `daysLeft` se queda en 1 y el coach le volcaría el temario
  // entero en la sesión de hoy. Mientras tanto la pantalla le pregunta qué tal
  // le fue, y al contestar la fecha se borra.
  const conFecha = u.examenDia !== null && u.examenDia >= u.hoy;
  const examDay = conFecha ? (u.examenDia as number) : u.hoy + HORIZONTE_DIAS;

  // `inicio` le dice al planificador si ALGUNA VEZ hubo margen sano, y de eso
  // depende que los últimos 19 días sean `consolidacion` (repasar y nada más) o
  // `triaje` (volcar lo que quede). Tiene que ser el día en que el opositor se
  // comprometió con la fecha, NO hoy: con `inicio = hoy`, quien lleva medio año
  // preparándose entraría en triaje en la última semana y le llovería temario
  // nuevo justo cuando toca afianzar. Quien fija un examen a diez días vista sí
  // arranca en triaje, y es lo honesto: no tiene el margen y no vamos a fingirlo.
  const inicio = conFecha ? (u.fijadaDia ?? u.hoy) : u.hoy;

  // Sin fecha hace falta un suelo de ritmo, o el temario no se acaba nunca: la
  // cuota es proporcional a lo que queda y el horizonte se aleja un día por cada
  // día que pasa, así que decae geométricamente (21 nuevos el primer día, 8 el
  // 160, 2 el 400). Con suelo, la cobertura se cierra en un horizonte. Se calcula
  // sobre el universo ENTERO, no sobre lo que resta, para que sea constante.
  const ritmoMinimoNuevos = conFecha
    ? 0
    : Math.ceil(u.conceptos.length / (HORIZONTE_DIAS - VENTANA_ESTABILIZACION));

  return planDia({
    conceptos: u.conceptos,
    estados: u.estados,
    prereq: u.prereq,
    examDay,
    hoy: u.hoy,
    inicio,
    B: PRESUPUESTO_DIARIO,
    ritmoMinimoNuevos,
  }) as PlanDia;
}

/** Días naturales que faltan para el examen fijado. null si no hay fecha. */
export function diasHastaExamen(u: {
  hoy: number;
  examenDia: number | null;
}): number | null {
  if (u.examenDia === null) return null;
  return Math.ceil(u.examenDia - u.hoy);
}

/** La fecha, en ISO, si ya pasó y sigue sin cerrarse. null en cualquier otro caso. */
function examenVencido(u: Universo): string | null {
  if (u.examenDia === null || u.examenDia >= u.hoy) return null;
  return new Date(u.examenDia * DIA_MS).toISOString().slice(0, 10);
}

async function elegirConcepto(
  db: ReturnType<typeof createCerebroClient>,
): Promise<string | null> {
  const u = await cargarUniverso(db);
  if (!u) return null;
  const { conceptos, estados } = u;

  const plan = planDelDia(u);
  const consolidar = plan.consolidar ?? [];
  const ampliar = plan.ampliar ?? [];

  // Reparto proporcional al plan: así se respeta la reserva anti-inanición que
  // el planificador ya ha calculado, sin volver a decidirla aquí.
  const total = consolidar.length + ampliar.length;
  if (total > 0) {
    const tocaNuevo = Math.random() * total < ampliar.length;
    const elegido = tocaNuevo
      ? (deLaCabeza(ampliar) ?? deLaCabeza(consolidar))
      : (deLaCabeza(consolidar) ?? deLaCabeza(ampliar));
    if (elegido) return elegido;
  }

  // Red de seguridad: el plan puede quedarse vacío si TODOS los nuevos están
  // bloqueados por gating y no hay ningún vencido. Ningún concepto debe quedar
  // excluido para siempre, así que abrimos la puerta ignorando el gating.
  const sinGating = conceptos.filter((c) => !estados[c.id].seen);
  const pool = sinGating.length > 0 ? sinGating : conceptos;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? null;
}

export async function siguienteActividad(): Promise<ActividadPublica | null> {
  const db = createCerebroClient();

  try {
    const conceptoId = await elegirConcepto(db);
    if (conceptoId) {
      // Se le pasa el usuario para que NO repita una pregunta que ya ha visto
      // mientras quede otra sin ver. No es solo comodidad: el motor supone que
      // aciertas por azar 1 de cada 3 veces, y eso solo es cierto si estás
      // eligiendo entre tres alternativas y no recordando cuál marcaste.
      const { data } = await db.rpc("actividad_de_concepto", {
        cid: conceptoId,
        usuario: DEMO_USUARIO_ID,
      });
      const fila = ((data ?? []) as FilaActividad[])[0];
      if (fila) return aPublica(fila);
    }
  } catch {
    // Cualquier fallo del selector NO deja al usuario sin pregunta: se cae al
    // azar de abajo. El motor es una mejora, no un punto único de fallo.
  }

  // Fallback: una verificada al azar en la base (order by random() limit 1).
  const { data, error } = await db.rpc("siguiente_actividad_test");
  if (error || !data || data.length === 0) return null;
  return aPublica((data as FilaActividad[])[0]);
}

export type Resultado = {
  acierto: boolean;
  correctaIndice: number | null;
  correcta: string | null;
  explicacion: string | null;
  cotejo: string;
  justificacion: string;
  articulo: string | null;
  boeUrl: string | null;
  absorcion: number;
  conceptoTitulo: string;
};

// Enlace al texto consolidado del BOE, con ancla al artículo (#aN). La URL base
// está verificada; el ancla es la convención estándar del BOE y degrada sin
// romperse. (Adaptador legal — Doc 006.)
function boeUrl(referencia: string | null, articulo: string | null): string | null {
  if (!referencia) return null;
  const base = `https://www.boe.es/buscar/act.php?id=${referencia}`;
  const m = articulo?.match(/(\d+)/);
  return m ? `${base}#a${m[1]}` : base;
}

// Corrige en el servidor, registra el evento (log = fuente de verdad),
// recomputa el estado de dominio del concepto con el motor y lo persiste.
export async function responder(
  actividadId: string,
  textoElegido: string,
  tiempoMs?: number,
): Promise<Resultado> {
  const db = createCerebroClient();

  const { data: act, error } = await db
    .from("actividad")
    .select("id, concepto_id, tipo, respuesta, cotejo_fuente, justificacion")
    .eq("id", actividadId)
    .single();
  if (error || !act) throw new Error("actividad no encontrada");

  const correcta = (act.respuesta?.correcta ?? null) as string | null;
  // Corrección por TEXTO: las opciones se sirven reducidas y barajadas, así que
  // el índice del cliente no es fiable; comparamos el texto elegido con la correcta.
  const acierto = correcta !== null && textoElegido === correcta;
  const ahora = new Date();

  // Panel (concepto + fuente) y estado BKT ACTUAL del concepto, todo en PARALELO
  // (una sola ida y vuelta en vez de varias en cadena).
  const [{ data: c }, { data: f }, { data: est }] = await Promise.all([
    db.from("concepto").select("titulo, explicacion").eq("id", act.concepto_id).single(),
    db
      .from("concepto_fuente")
      .select("articulo, referencia_boe")
      .eq("concepto_id", act.concepto_id)
      .limit(1)
      .maybeSingle(),
    db
      .from("estado_dominio")
      .select("l, tau, last_seen")
      .eq("usuario_id", DEMO_USUARIO_ID)
      .eq("concepto_id", act.concepto_id)
      .maybeSingle(),
  ]);

  // Estado BKT del concepto:
  //  · CON caché → incremental (rápido): partimos del estado guardado y solo
  //    aplicamos esta respuesta, sin recorrer el log. Es el camino común.
  //  · SIN caché → reconstrucción desde el log del concepto (AUTOCORRECTIVO): si
  //    la fila de caché falta o se ha borrado, no se pierde el progreso. Es barato
  //    porque, sin caché, el historial suele ser mínimo o nulo.
  // El log de `evento` es la fuente de verdad en ambos casos.
  const estado = crearEstado() as unknown as {
    L: number;
    tau: number;
    lastSeen: number;
  };
  if (est) {
    estado.L = est.l as number;
    estado.tau = est.tau as number;
    estado.lastSeen = new Date(est.last_seen as string).getTime() / DIA_MS;
  } else {
    const { data: previos } = await db
      .from("evento")
      .select("acierto, fecha")
      .eq("usuario_id", DEMO_USUARIO_ID)
      .eq("concepto_id", act.concepto_id)
      .order("fecha", { ascending: true });
    for (const e of previos ?? []) {
      actualizar(estado, {
        correcto: e.acierto,
        tipo: "test",
        t: new Date(e.fecha).getTime() / DIA_MS,
      });
    }
  }
  // El tipo determina el `guess` del motor (test 1/3, vf 0.50, huecos 0.05), así
  // que viene de la propia actividad —no fijado a "test"—, aprovechando el select
  // de arriba: no cuesta ningún viaje extra.
  actualizar(estado, {
    correcto: acierto,
    tipo: act.tipo ?? "test",
    t: ahora.getTime() / DIA_MS,
  });
  const abs = absorcion(estado, ahora.getTime() / DIA_MS);

  // Escrituras en PARALELO: log del evento + caché del estado (independientes).
  await Promise.all([
    db.from("evento").insert({
      usuario_id: DEMO_USUARIO_ID,
      concepto_id: act.concepto_id,
      actividad_id: act.id,
      fecha: ahora.toISOString(),
      acierto,
      tiempo_respuesta_ms: tiempoMs ?? null,
    }),
    db.from("estado_dominio").upsert({
      usuario_id: DEMO_USUARIO_ID,
      concepto_id: act.concepto_id,
      l: estado.L,
      tau: estado.tau,
      last_seen: new Date(estado.lastSeen * DIA_MS).toISOString(),
      updated_at: ahora.toISOString(),
    }),
  ]);

  return {
    acierto,
    correctaIndice: null,
    correcta,
    explicacion: c?.explicacion ?? null,
    cotejo: act.cotejo_fuente,
    justificacion: act.justificacion,
    articulo: f?.articulo ?? null,
    boeUrl: boeUrl(f?.referencia_boe ?? null, f?.articulo ?? null),
    absorcion: abs,
    conceptoTitulo: c?.titulo ?? act.concepto_id,
  };
}

// ---------------------------------------------------------------------------
// Progreso del alumno (paneles /temas y /hoy). Todo sobre la convocatoria PN y
// el usuario demo. El log de `evento` es la fuente de verdad; `estado_dominio`
// es la caché derivada (l = P(dominado) 0..1).
// ---------------------------------------------------------------------------

export const CONVOCATORIA_PN = "policia-nacional-2026";

// "Tema 14 — …" → 14. Sirve para ordenar los temas por su número real (no
// alfabéticamente, que colocaría "Tema 14" antes de "Tema 2").
function numeroTema(tema: string): number {
  const m = tema.match(/Tema\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export type ProgresoTema = {
  tema: string;
  totalConceptos: number;
  dominados: number;
  practicados: number;
  pct: number;
};

// Por cada `tema` de la convocatoria PN: cuántos conceptos tiene, cuántos ha
// practicado el usuario (tiene fila en estado_dominio) y cuántos domina
// (l >= 0.9). PostgREST no agrupa sin RPC/vista, así que traemos solo las dos
// columnas mínimas y agregamos en memoria — paginando, porque el overlay pasa
// de largo el tope de 1.000 (3.312 filas a 20/08/2026).
export async function progresoTemas(): Promise<ProgresoTema[]> {
  const db = createCerebroClient();
  // Agrega en Postgres y devuelve ~45 filas. Antes se traían las 3.343 del
  // overlay (cuatro peticiones paginadas) para contarlas en memoria.
  const { data, error } = await db.rpc("progreso_temas", {
    conv: CONVOCATORIA_PN,
    usuario: DEMO_USUARIO_ID,
  });
  if (error || !data) return [];

  return (data as { tema: string; total: number; practicados: number; dominados: number }[])
    .map((r) => ({
      tema: r.tema,
      totalConceptos: r.total,
      dominados: r.dominados,
      practicados: r.practicados,
      pct: r.total > 0 ? Math.round((r.dominados / r.total) * 100) : 0,
    }))
    .sort((x, y) => numeroTema(x.tema) - numeroTema(y.tema));
}

export type ResumenHoy = {
  totalConceptos: number;
  practicados: number;
  dominados: number;
  pendientes: number;
  aciertoPct: number | null;
  // Lo que el COACH dice que toca hoy, no un cálculo aparte de la pantalla.
  hoyRepasar: number; // vencidos que entran en la sesión de hoy
  hoyNuevos: number; // conceptos nuevos que toca introducir hoy
  backlog: number; // vencidos que no caben hoy
  modo: string; // normal | consolidacion | triaje
  // Días desde la última respuesta (null si nunca ha practicado). Lo usa el
  // saludo de /hoy para no tratar igual al que viene a diario y al que vuelve.
  diasSinVenir: number | null;
  // Días que faltan para la fecha que SE HA FIJADO EL OPOSITOR. null = estudia
  // sin fecha, que es un estado legítimo y no un dato pendiente de rellenar.
  diasHastaExamen: number | null;
  // Fecha ("2027-05-14") de un examen que YA PASÓ y sobre el que aún no ha dicho
  // qué tal le fue. Mientras no lo cierre, /hoy se lo pregunta y el coach
  // planifica como si no hubiera fecha.
  examenPendienteDe: string | null;
};

// Cifras globales del usuario sobre la convocatoria PN para la pantalla /hoy.
// `aciertoPct` es el % de aciertos sobre TODO el log de eventos (null si aún no
// ha respondido nada).
export async function resumenHoy(): Promise<ResumenHoy> {
  const db = createCerebroClient();

  // Los cinco conteos y la última fecha, en UNA consulta. Antes eran cuatro
  // peticiones (overlay paginado, estado_dominio, dos HEAD de evento) más una
  // quinta para la última respuesta.
  const [{ data: res }, universo] = await Promise.all([
    db
      .rpc("resumen_usuario", { conv: CONVOCATORIA_PN, usuario: DEMO_USUARIO_ID })
      .single(),
    // En paralelo, no en serie: el plan del día no depende de los conteos.
    cargarUniverso(db),
  ]);

  const r = (res ?? {}) as {
    total_conceptos?: number;
    practicados?: number;
    dominados?: number;
    eventos?: number;
    aciertos?: number;
    ultima?: string | null;
  };
  const totalConceptos = r.total_conceptos ?? 0;
  const practicados = r.practicados ?? 0;
  const eventos = r.eventos ?? 0;

  const diasSinVenir = r.ultima
    ? Math.floor((Date.now() - new Date(r.ultima).getTime()) / DIA_MS)
    : null;

  // El plan de hoy sale del planificador, el mismo que sirve las preguntas en
  // /practicar. Antes esta pantalla calculaba "por repasar" como
  // practicados - dominados, que NO es lo mismo: un concepto practicado y no
  // dominado solo vence cuando su retención cae por debajo del objetivo.
  const plan = universo
    ? planDelDia(universo)
    : { modo: "normal", consolidar: [], ampliar: [], backlog: 0 };

  return {
    totalConceptos,
    practicados,
    dominados: r.dominados ?? 0,
    pendientes: totalConceptos - practicados,
    aciertoPct: eventos > 0 ? Math.round(((r.aciertos ?? 0) / eventos) * 100) : null,
    hoyRepasar: plan.consolidar.length,
    hoyNuevos: plan.ampliar.length,
    backlog: plan.backlog,
    modo: plan.modo,
    diasSinVenir,
    diasHastaExamen: universo ? diasHastaExamen(universo) : null,
    examenPendienteDe: universo ? examenVencido(universo) : null,
  };
}

/** Juicio del opositor sobre la FORMACIÓN, no sobre su nota. */
export type Aprovechamiento = "sirvio" | "no_sirvio" | "sin_decir";

/**
 * Cierra el ciclo de un examen ya pasado: guarda si el opositor cree que la
 * preparación le ha rentado, y BORRA la fecha.
 *
 * LO QUE SE PREGUNTA ES SI ACERTIUM LE SIRVIÓ, no si aprobó. Son dos cosas
 * distintas, y la segunda ni siquiera se sabe ese día: el resultado oficial de
 * una oposición tarda semanas. Lo que sí sabe al salir del aula es si las
 * preguntas le sonaban, y eso es justo lo que interesa medir.
 *
 * Y solo eso. No toca `evento`, ni `estado_dominio`, ni el perfil, ni el cerebro:
 * presentarse a un examen no borra lo aprendido, y quien no aprueba sigue su
 * preparación desde donde la dejó, no desde cero. Es también lo que devuelve al
 * coach al modo maratón hasta que el opositor se fije la siguiente fecha.
 */
export async function registrarExamen(
  fecha: string,
  aprovechamiento: Aprovechamiento,
): Promise<{ ok: boolean }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false };
  const db = createCerebroClient();

  // La apreciación primero: si fallara, la fecha sigue ahí y se le vuelve a
  // preguntar. Al revés se perdería el dato sin que nadie se enterase.
  const { error: eIns } = await db
    .from("examen_rendido")
    .upsert(
      { usuario_id: DEMO_USUARIO_ID, fecha_examen: fecha, aprovechamiento },
      { onConflict: "usuario_id,fecha_examen" },
    );
  if (eIns) return { ok: false };

  const { error } = await db
    .from("usuario")
    .update({ fecha_objetivo: null, fecha_objetivo_fijada: null })
    .eq("id", DEMO_USUARIO_ID);
  return { ok: !error };
}

// ---------------------------------------------------------------------------
// EL SEGUIMIENTO DE LOS 30 DÍAS
//
// La ventana del día siguiente pregunta si la formación le sirvió, y no puede
// preguntar más: el resultado no existe todavía. Al mes sí, así que hay un
// segundo momento con una pregunta distinta.
//
// SOLO SE PREGUNTA POR LA PRIMERA PRUEBA: las 100 preguntas del temario del
// anexo I, que es de cuyo contenido respondemos. Los psicotécnicos, las físicas,
// el reconocimiento y la entrevista no dependen de lo que se estudia aquí, y
// meterlos en el mismo dato solo emborronaría la señal.
//
// Y SE PIDE LA NOTA, no solo un sí o un no, porque en esta convocatoria
// «aprobar» es ambiguo: la base 6.1.1 exige un mínimo de 3 puntos, pero además
// solo continúan «las mejores calificaciones, hasta llegar a 1,75 aspirantes por
// cada una» de las plazas. Se puede sacar un 5 —aprobado— y no seguir en el
// proceso. La nota distingue las dos cosas y, además, es lo único comparable
// contra el dominio que el motor le estimaba.
//
// «Aún no lo sé» es una respuesta de primera clase y no un descarte: cuando la
// elige, se le vuelve a preguntar un mes después en vez de darlo por cerrado.
// ---------------------------------------------------------------------------

export type Seguimiento = {
  /** Fecha del examen al que se refiere ("2027-05-14"). */
  fechaExamen: string;
  /** Qué contestó el día siguiente, para no repetirle la misma pregunta. */
  aprovechamiento: Aprovechamiento | null;
  diasDesdeExamen: number;
};

/** Si CONTINUÓ en el proceso tras la primera prueba. No es «aprobar». */
export type PasoCorte = "si" | "no" | "aun_no_lo_se" | "sin_decir";

/** A quién le toca el seguimiento hoy. null si a nadie. */
export async function seguimientoPendiente(): Promise<Seguimiento | null> {
  const db = createCerebroClient();
  // Se lee de la VISTA, no de una consulta propia: es la misma fuente que usaría
  // un envío por correo, y dos criterios distintos harían que a alguien le
  // llegara dos veces o ninguna.
  const { data, error } = await db
    .from("seguimiento_pendiente")
    .select("fecha_examen, aprovechamiento, dias_desde_examen")
    .eq("usuario_id", DEMO_USUARIO_ID)
    .order("fecha_examen", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    fechaExamen: data.fecha_examen as string,
    aprovechamiento: (data.aprovechamiento ?? null) as Aprovechamiento | null,
    diasDesdeExamen: Number(data.dias_desde_examen ?? 0),
  };
}

/**
 * Guarda la respuesta del seguimiento. El comentario es opcional y es lo único
 * de esta tabla que puede llevar texto que él escriba, así que se recorta y se
 * guarda como null si viene vacío.
 */
export async function registrarSeguimiento(
  fechaExamen: string,
  pasoCorte: PasoCorte,
  nota?: number | null,
  comentario?: string,
): Promise<{ ok: boolean }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaExamen)) return { ok: false };
  const texto = (comentario ?? "").trim().slice(0, 2000);
  // La nota se valida aquí además de en el CHECK: si viene fuera de rango o no
  // es un número, se guarda como null en vez de tumbar la respuesta entera. Lo
  // que no se puede perder es el `paso_corte`; la nota es opcional.
  const n =
    typeof nota === "number" && Number.isFinite(nota) && nota >= 0 && nota <= 10
      ? Math.round(nota * 100) / 100
      : null;
  const db = createCerebroClient();
  const { error } = await db
    .from("examen_rendido")
    .update({
      paso_corte: pasoCorte,
      nota: n,
      comentario: texto || null,
      seguimiento_en: new Date().toISOString(),
    })
    .eq("usuario_id", DEMO_USUARIO_ID)
    .eq("fecha_examen", fechaExamen);
  return { ok: !error };
}

// ---------------------------------------------------------------------------
// LA FECHA OBJETIVO, DESDE /perfil
// ---------------------------------------------------------------------------

/** La fecha tal cual está guardada ("2027-05-14"), o null. Para el formulario. */
export async function fechaObjetivo(): Promise<string | null> {
  const db = createCerebroClient();
  const { data, error } = await db
    .from("usuario")
    .select("fecha_objetivo")
    .eq("id", DEMO_USUARIO_ID)
    .maybeSingle();
  if (error) return null;
  return (data?.fecha_objetivo ?? null) as string | null;
}

/**
 * Guarda o borra la fecha objetivo. `null` la borra y devuelve al opositor al
 * modo maratón: quitarla tiene que ser tan fácil como ponerla, porque los planes
 * cambian y una fecha vieja miente más que la falta de fecha.
 *
 * Se rechaza una fecha pasada. No es una validación de formulario cualquiera: si
 * entrara, `examDay < hoy` haría `daysLeft = 1` y el coach volcaría el temario
 * entero en la sesión de hoy.
 */
export async function guardarFechaObjetivo(
  fecha: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (fecha !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return { ok: false, error: "La fecha no tiene un formato válido." };
    const [a, m, d] = fecha.split("-").map(Number);
    const dia = Date.UTC(a, m - 1, d) / DIA_MS;
    if (!Number.isFinite(dia))
      return { ok: false, error: "La fecha no tiene un formato válido." };
    if (dia <= Date.now() / DIA_MS)
      return { ok: false, error: "La fecha del examen tiene que ser futura." };
  }
  const db = createCerebroClient();
  // `fecha_objetivo_fijada` se sella AQUÍ y se borra con la fecha: es el margen
  // que tenía cuando se comprometió, y lo usa el planificador como `inicio`.
  const { error } = await db
    .from("usuario")
    .update({
      fecha_objetivo: fecha,
      fecha_objetivo_fijada: fecha === null ? null : new Date().toISOString(),
    })
    .eq("id", DEMO_USUARIO_ID);
  if (error) return { ok: false, error: "No se ha podido guardar." };
  return { ok: true };
}

export type MotivoReporte =
  | "dato_incorrecto"
  | "opcion_mala"
  | "fuente_erronea"
  | "otro";

export type EntradaReporte = {
  actividadId: string;
  conceptoId: string;
  motivo: MotivoReporte;
  comentario?: string | null;
  contexto?: Record<string, unknown> | null;
};

// Registra un reporte de usuario sobre una pregunta (dato incorrecto, opción
// mala, fuente errónea…). Inserta en acertium_v2.reporte con estado 'abierto'.
// Usa el cliente service-role del cerebro (nunca desde el navegador).
export async function reportar(entrada: EntradaReporte): Promise<void> {
  const db = createCerebroClient();
  const { error } = await db.from("reporte").insert({
    actividad_id: entrada.actividadId,
    concepto_id: entrada.conceptoId,
    motivo: entrada.motivo,
    comentario: entrada.comentario?.trim() ? entrada.comentario.trim() : null,
    contexto: entrada.contexto ?? null,
    estado: "abierto",
  });
  if (error) throw new Error(error.message);
}
