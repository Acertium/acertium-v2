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

// Saca una actividad verificada (tipo test) al azar. NUNCA envía la respuesta
// correcta al cliente: eso se comprueba en el servidor (ver responder()).
export async function siguienteActividad(): Promise<ActividadPublica | null> {
  const db = createCerebroClient();
  const { data, error } = await db
    .from("actividad")
    .select("id, concepto_id, tipo, enunciado, opciones")
    .eq("estado_verificacion", "verificado")
    .eq("tipo", "test");
  if (error || !data || data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)] as ActividadPublica;
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
  indiceElegido: number,
  tiempoMs?: number,
): Promise<Resultado> {
  const db = createCerebroClient();

  const { data: act, error } = await db
    .from("actividad")
    .select("id, concepto_id, respuesta, cotejo_fuente, justificacion")
    .eq("id", actividadId)
    .single();
  if (error || !act) throw new Error("actividad no encontrada");

  const correctaIndice = (act.respuesta?.indice ?? null) as number | null;
  const correcta = (act.respuesta?.correcta ?? null) as string | null;
  const acierto = correctaIndice !== null && indiceElegido === correctaIndice;
  const ahora = new Date();

  // 1) evento append-only (con tiempo de respuesta, señal futura)
  await db.from("evento").insert({
    usuario_id: DEMO_USUARIO_ID,
    concepto_id: act.concepto_id,
    actividad_id: act.id,
    fecha: ahora.toISOString(),
    acierto,
    tiempo_respuesta_ms: tiempoMs ?? null,
  });

  // 2) recomputar el estado del concepto desde TODO su log
  const { data: evs } = await db
    .from("evento")
    .select("acierto, fecha, actividad_id")
    .eq("usuario_id", DEMO_USUARIO_ID)
    .eq("concepto_id", act.concepto_id)
    .order("fecha", { ascending: true });

  // tipo por actividad (para el guess del motor)
  const ids = [...new Set((evs ?? []).map((e) => e.actividad_id))];
  const { data: acts } = await db
    .from("actividad")
    .select("id, tipo")
    .in("id", ids);
  const tipoDe = new Map((acts ?? []).map((a) => [a.id, a.tipo]));

  const estado = crearEstado() as unknown as {
    L: number;
    tau: number;
    lastSeen: number;
  };
  for (const e of evs ?? []) {
    actualizar(estado, {
      correcto: e.acierto,
      tipo: tipoDe.get(e.actividad_id) ?? "test",
      t: new Date(e.fecha).getTime() / DIA_MS,
    });
  }

  // 3) persistir el estado (caché recomputable)
  await db.from("estado_dominio").upsert({
    usuario_id: DEMO_USUARIO_ID,
    concepto_id: act.concepto_id,
    l: estado.L,
    tau: estado.tau,
    last_seen: new Date(estado.lastSeen * DIA_MS).toISOString(),
    updated_at: ahora.toISOString(),
  });

  const abs = absorcion(estado, ahora.getTime() / DIA_MS);

  // concepto (título + explicación pedagógica) y su fuente principal (para el enlace)
  const { data: c } = await db
    .from("concepto")
    .select("titulo, explicacion")
    .eq("id", act.concepto_id)
    .single();
  const { data: f } = await db
    .from("concepto_fuente")
    .select("articulo, referencia_boe")
    .eq("concepto_id", act.concepto_id)
    .limit(1)
    .maybeSingle();

  return {
    acierto,
    correctaIndice,
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
