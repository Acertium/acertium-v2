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

// El planificador razona con un horizonte hasta el examen. La convocatoria aún
// no guarda fecha de examen en la base, así que usamos un horizonte fijo. En
// cuanto `convocatoria` tenga fecha, este valor sale de ahí.
const HORIZONTE_DIAS = 180;
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
};

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
  const { data, error } = await db.rpc("practicar_estado_json", {
    conv: CONVOCATORIA_PN,
    usuario: DEMO_USUARIO_ID,
  });
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

  return { conceptos, estados, prereq, hoy };
}

type PlanDia = {
  modo: string;
  consolidar: string[];
  ampliar: string[];
  backlog: number;
};

function planDelDia(u: Universo): PlanDia {
  return planDia({
    conceptos: u.conceptos,
    estados: u.estados,
    prereq: u.prereq,
    examDay: u.hoy + HORIZONTE_DIAS,
    hoy: u.hoy,
    inicio: u.hoy,
    B: PRESUPUESTO_DIARIO,
  }) as PlanDia;
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
      const { data } = await db.rpc("actividad_de_concepto", {
        cid: conceptoId,
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
  };
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
