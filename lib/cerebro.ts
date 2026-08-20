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
// EL TOPE DE 1.000 FILAS (bug encontrado el 20/08/2026)
//
// PostgREST corta toda respuesta en `db-max-rows` (1.000 en Supabase por
// defecto) y NO avisa: devuelve 1.000 filas y `error: null`. Con 3.312
// conceptos en el cerebro, cuatro consultas de este fichero venían recibiendo
// un tercio de la realidad sin que nada fallara:
//
//   · `practicar_estado`  → el PLANIFICADOR solo veía 1.000 conceptos, así que
//     2.312 no podían salir a practicar NUNCA. Este era el grave: no es que se
//     contase mal, es que dos tercios del temario eran invisibles para el coach.
//   · `overlay_entrada` en `resumenHoy` → el «1.000 en total» de la pantalla.
//   · `overlay_entrada` en `progresoTemas` → temas enteros con 0 conceptos.
//   · `evento` → el % de acierto se habría congelado al llegar a 1.000 respuestas.
//
// Se arregla en el CÓDIGO y no subiendo `db-max-rows` en el proyecto, por dos
// razones: el tope volvería a aparecer al crecer el cerebro, y subirlo afecta a
// todos los endpoints. `traerTodo` pagina con `.range()` hasta que una página
// vuelve incompleta. Donde solo hace falta un número, mejor `contar()`: una
// consulta HEAD que no trae ni una fila.
// ---------------------------------------------------------------------------
const PAGINA = 1000;

type ConsultaPaginable<T> = {
  range: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
};

async function traerTodo<T>(hacerConsulta: () => ConsultaPaginable<T>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await hacerConsulta().range(desde, desde + PAGINA - 1);
    if (error || !data) break;
    filas.push(...data);
    // Página incompleta = última página. Es la única señal fiable: PostgREST no
    // distingue "he cortado" de "no hay más".
    if (data.length < PAGINA) break;
  }
  return filas;
}

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
  // Paginado: el planificador necesita el universo ENTERO para repartir entre
  // consolidar y ampliar. Con el tope de 1.000 veía menos de un tercio.
  const filas = await traerTodo<FilaEstado>(() =>
    db.rpc("practicar_estado", {
      conv: CONVOCATORIA_PN,
      usuario: DEMO_USUARIO_ID,
    }) as unknown as ConsultaPaginable<FilaEstado>,
  );
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

  const overlay = await traerTodo<{ concepto_id: string; tema: string }>(() =>
    db
      .from("overlay_entrada")
      .select("concepto_id, tema")
      .eq("convocatoria_id", CONVOCATORIA_PN) as unknown as ConsultaPaginable<{
      concepto_id: string;
      tema: string;
    }>,
  );
  if (overlay.length === 0) return [];

  const estados = await traerTodo<{ concepto_id: string; l: number | null }>(() =>
    db
      .from("estado_dominio")
      .select("concepto_id, l")
      .eq("usuario_id", DEMO_USUARIO_ID) as unknown as ConsultaPaginable<{
      concepto_id: string;
      l: number | null;
    }>,
  );

  const dominioDe = new Map<string, number>(
    estados.map((s) => [s.concepto_id, s.l ?? 0]),
  );

  const porTema = new Map<
    string,
    { total: number; practicados: number; dominados: number }
  >();
  for (const row of overlay) {
    const tema = row.tema as string;
    const agg = porTema.get(tema) ?? { total: 0, practicados: 0, dominados: 0 };
    agg.total += 1;
    if (dominioDe.has(row.concepto_id as string)) {
      agg.practicados += 1;
      if ((dominioDe.get(row.concepto_id as string) ?? 0) >= 0.9) {
        agg.dominados += 1;
      }
    }
    porTema.set(tema, agg);
  }

  return [...porTema.entries()]
    .map(([tema, a]) => ({
      tema,
      totalConceptos: a.total,
      dominados: a.dominados,
      practicados: a.practicados,
      pct: a.total > 0 ? Math.round((a.dominados / a.total) * 100) : 0,
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
};

// Cifras globales del usuario sobre la convocatoria PN para la pantalla /hoy.
// `aciertoPct` es el % de aciertos sobre TODO el log de eventos (null si aún no
// ha respondido nada).
export async function resumenHoy(): Promise<ResumenHoy> {
  const db = createCerebroClient();

  const overlay = await traerTodo<{ concepto_id: string }>(() =>
    db
      .from("overlay_entrada")
      .select("concepto_id")
      .eq("convocatoria_id", CONVOCATORIA_PN) as unknown as ConsultaPaginable<{
      concepto_id: string;
    }>,
  );
  const conceptos = new Set(overlay.map((o) => o.concepto_id));
  const totalConceptos = conceptos.size;

  const estados = await traerTodo<{ concepto_id: string; l: number | null }>(() =>
    db
      .from("estado_dominio")
      .select("concepto_id, l")
      .eq("usuario_id", DEMO_USUARIO_ID) as unknown as ConsultaPaginable<{
      concepto_id: string;
      l: number | null;
    }>,
  );
  let practicados = 0;
  let dominados = 0;
  for (const s of estados) {
    if (!conceptos.has(s.concepto_id)) continue;
    practicados += 1;
    if ((s.l ?? 0) >= 0.9) dominados += 1;
  }

  // El acierto se cuenta con dos consultas HEAD (`count: exact`): devuelven el
  // número sin traer ni una fila, así que no dependen del tope de páginas por
  // muchas respuestas que acumule el usuario.
  const { count: totalEventos } = await db
    .from("evento")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", DEMO_USUARIO_ID);
  const { count: aciertos } = await db
    .from("evento")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", DEMO_USUARIO_ID)
    .eq("acierto", true);
  const aciertoPct =
    totalEventos && totalEventos > 0
      ? Math.round(((aciertos ?? 0) / totalEventos) * 100)
      : null;

  // El plan de hoy sale del planificador, el mismo que sirve las preguntas en
  // /practicar. Antes esta pantalla calculaba "por repasar" como
  // practicados − dominados, que NO es lo mismo: un concepto practicado y no
  // dominado solo vence cuando su retención cae por debajo del objetivo. Con la
  // cuenta vieja la pantalla anunciaba repasos que el coach no iba a servir.
  const u = await cargarUniverso(db);
  const plan = u
    ? planDelDia(u)
    : { modo: "normal", consolidar: [], ampliar: [], backlog: 0 };

  return {
    totalConceptos,
    practicados,
    dominados,
    pendientes: totalConceptos - practicados,
    aciertoPct,
    hoyRepasar: plan.consolidar.length,
    hoyNuevos: plan.ampliar.length,
    backlog: plan.backlog,
    modo: plan.modo,
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
