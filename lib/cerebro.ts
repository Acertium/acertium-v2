import "server-only";
import { createCerebroClient } from "@/lib/supabase/cerebro";
// Motor agnóstico (núcleo). Import JS: los tipos llegan como any, es aceptable.
import { crearEstado, actualizar, absorcion } from "@/nucleo/motor-bkt.mjs";

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

// Saca una actividad verificada (tipo test) al azar. Formato EXAMEN OFICIAL PN:
// 3 alternativas. Reducimos las 4 opciones guardadas a la correcta + 2
// distractores al azar y las barajamos. La respuesta correcta NO se marca ni se
// envía: la corrección se hace en el servidor por texto (ver responder()).
export async function siguienteActividad(): Promise<ActividadPublica | null> {
  const db = createCerebroClient();
  // Elegimos la pregunta al azar EN LA BASE (order by random() limit 1) y traemos
  // SOLO esa fila, en vez de descargar todo el banco y elegir en memoria.
  // Ver función acertium_v2.siguiente_actividad_test().
  const { data, error } = await db.rpc("siguiente_actividad_test");
  if (error || !data || data.length === 0) return null;
  const a = data[0] as ActividadPublica & {
    respuesta?: { correcta?: string } | null;
  };
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
// columnas mínimas (overlay ~352 filas, estado ~decenas) y agregamos en memoria.
export async function progresoTemas(): Promise<ProgresoTema[]> {
  const db = createCerebroClient();

  const { data: overlay, error } = await db
    .from("overlay_entrada")
    .select("concepto_id, tema")
    .eq("convocatoria_id", CONVOCATORIA_PN);
  if (error || !overlay) return [];

  const { data: estados } = await db
    .from("estado_dominio")
    .select("concepto_id, l")
    .eq("usuario_id", DEMO_USUARIO_ID);

  const dominioDe = new Map<string, number>(
    (estados ?? []).map((s) => [s.concepto_id as string, (s.l ?? 0) as number]),
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
};

// Cifras globales del usuario sobre la convocatoria PN para la pantalla /hoy.
// `aciertoPct` es el % de aciertos sobre TODO el log de eventos (null si aún no
// ha respondido nada).
export async function resumenHoy(): Promise<ResumenHoy> {
  const db = createCerebroClient();

  const { data: overlay } = await db
    .from("overlay_entrada")
    .select("concepto_id")
    .eq("convocatoria_id", CONVOCATORIA_PN);
  const conceptos = new Set(
    (overlay ?? []).map((o) => o.concepto_id as string),
  );
  const totalConceptos = conceptos.size;

  const { data: estados } = await db
    .from("estado_dominio")
    .select("concepto_id, l")
    .eq("usuario_id", DEMO_USUARIO_ID);
  let practicados = 0;
  let dominados = 0;
  for (const s of estados ?? []) {
    if (!conceptos.has(s.concepto_id as string)) continue;
    practicados += 1;
    if (((s.l ?? 0) as number) >= 0.9) dominados += 1;
  }

  const { data: eventos } = await db
    .from("evento")
    .select("acierto")
    .eq("usuario_id", DEMO_USUARIO_ID);
  const totalEventos = eventos?.length ?? 0;
  const aciertos = (eventos ?? []).filter((e) => e.acierto).length;
  const aciertoPct =
    totalEventos > 0 ? Math.round((aciertos / totalEventos) * 100) : null;

  return {
    totalConceptos,
    practicados,
    dominados,
    pendientes: totalConceptos - practicados,
    aciertoPct,
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
