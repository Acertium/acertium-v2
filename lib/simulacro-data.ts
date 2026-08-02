import "server-only";
import { createCerebroClient } from "@/lib/supabase/cerebro";
import { DEMO_USUARIO_ID, CONVOCATORIA_PN } from "@/lib/cerebro";

// ---------------------------------------------------------------------------
// MODO SIMULACRO — examen cronometrado (tipo Policía Nacional).
// Reutiliza el cliente service-role del cerebro (schema acertium_v2). NUNCA se
// revela la respuesta correcta al montar el examen: la corrección ocurre en el
// servidor al finalizar (corregirSimulacro), igual que en /practicar.
// ---------------------------------------------------------------------------

// Número de preguntas por defecto de un simulacro.
export const PREGUNTAS_SIMULACRO = 25;

export type PreguntaSimulacro = {
  actividadId: string;
  conceptoId: string;
  enunciado: string;
  opciones: string[];
};

export type RespuestaUsuario = {
  actividadId: string;
  // null = pregunta dejada en blanco (cuenta como fallo).
  indiceElegido: number | null;
  tiempoMs: number;
};

export type DetallePregunta = {
  actividadId: string;
  correcta: string | null; // texto de la opción correcta
  indiceCorrecto: number | null;
  acierto: boolean;
  explicacion: string | null;
  articulo: string | null;
  boeUrl: string | null;
};

export type ResumenSimulacro = {
  simulacroId: string | null;
  total: number;
  aciertos: number;
  nota: number; // sobre 10
  duracionMs: number;
  detalle: DetallePregunta[];
};

// Enlace al texto consolidado del BOE, con ancla al artículo (#aN). Réplica del
// helper de cerebro.ts (allí es privado): base verificada, el ancla degrada sin
// romperse.
function boeUrl(
  referencia: string | null,
  articulo: string | null,
): string | null {
  if (!referencia) return null;
  const base = `https://www.boe.es/buscar/act.php?id=${referencia}`;
  const m = articulo?.match(/(\d+)/);
  return m ? `${base}#a${m[1]}` : base;
}

// Mezcla in-place (Fisher–Yates). Sirve para muestrear preguntas al azar sin
// depender de RANDOM() de Postgres (PostgREST no lo expone sin RPC).
function mezclar<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Monta un simulacro: n actividades verificadas (tipo test) de la convocatoria
// PN, al azar, SIN la respuesta correcta. Join lógico
// actividad ↔ concepto (vía concepto_id) ↔ overlay_entrada (convocatoria).
export async function iniciarSimulacro(
  n: number = PREGUNTAS_SIMULACRO,
): Promise<PreguntaSimulacro[]> {
  const db = createCerebroClient();

  // 1) conceptos de la convocatoria PN
  const { data: overlay, error: eOverlay } = await db
    .from("overlay_entrada")
    .select("concepto_id")
    .eq("convocatoria_id", CONVOCATORIA_PN);
  if (eOverlay || !overlay || overlay.length === 0) return [];

  const conceptoIds = [
    ...new Set(overlay.map((o) => o.concepto_id as string)),
  ];

  // 2) actividades verificadas tipo test de esos conceptos
  const { data: acts, error: eActs } = await db
    .from("actividad")
    .select("id, concepto_id, enunciado, opciones")
    .eq("estado_verificacion", "verificado")
    .eq("tipo", "test")
    .in("concepto_id", conceptoIds);
  if (eActs || !acts || acts.length === 0) return [];

  // 3) muestreo aleatorio de n, descartando actividades sin opciones válidas
  const validas = acts.filter(
    (a) => Array.isArray(a.opciones) && (a.opciones as unknown[]).length > 0,
  );

  return mezclar(validas)
    .slice(0, n)
    .map((a) => ({
      actividadId: a.id as string,
      conceptoId: a.concepto_id as string,
      enunciado: a.enunciado as string,
      opciones: a.opciones as string[],
    }));
}

// Corrige el simulacro en el servidor: consulta las respuestas correctas,
// calcula nota, persiste un registro en `simulacro` y un `evento` por pregunta
// (log = fuente de verdad, alimenta el motor BKT como cualquier práctica).
export async function corregirSimulacro(
  respuestas: RespuestaUsuario[],
): Promise<ResumenSimulacro> {
  const db = createCerebroClient();

  const total = respuestas.length;
  if (total === 0) {
    return {
      simulacroId: null,
      total: 0,
      aciertos: 0,
      nota: 0,
      duracionMs: 0,
      detalle: [],
    };
  }

  const actividadIds = respuestas.map((r) => r.actividadId);

  // 1) respuestas correctas de las actividades del examen
  const { data: acts } = await db
    .from("actividad")
    .select("id, concepto_id, respuesta")
    .in("id", actividadIds);
  const actInfo = new Map(
    (acts ?? []).map((a) => [
      a.id as string,
      {
        conceptoId: a.concepto_id as string,
        indice: (a.respuesta?.indice ?? null) as number | null,
        correcta: (a.respuesta?.correcta ?? null) as string | null,
      },
    ]),
  );

  const conceptoIds = [
    ...new Set([...actInfo.values()].map((a) => a.conceptoId)),
  ];

  // 2) explicación pedagógica por concepto y su fuente principal (para el BOE)
  const { data: conceptos } = await db
    .from("concepto")
    .select("id, explicacion")
    .in("id", conceptoIds);
  const explicacionDe = new Map(
    (conceptos ?? []).map((c) => [c.id as string, c.explicacion as string | null]),
  );

  const { data: fuentes } = await db
    .from("concepto_fuente")
    .select("concepto_id, articulo, referencia_boe")
    .in("concepto_id", conceptoIds);
  const fuenteDe = new Map<string, { articulo: string | null; ref: string | null }>();
  for (const f of fuentes ?? []) {
    // primera fuente por concepto (como en cerebro.responder)
    if (!fuenteDe.has(f.concepto_id as string)) {
      fuenteDe.set(f.concepto_id as string, {
        articulo: (f.articulo ?? null) as string | null,
        ref: (f.referencia_boe ?? null) as string | null,
      });
    }
  }

  // 3) corregir pregunta a pregunta + preparar eventos
  const ahora = new Date();
  let aciertos = 0;
  let duracionMs = 0;
  const detalle: DetallePregunta[] = [];
  const eventos: Record<string, unknown>[] = [];

  for (const r of respuestas) {
    const info = actInfo.get(r.actividadId);
    duracionMs += Math.max(0, r.tiempoMs || 0);
    const indiceCorrecto = info?.indice ?? null;
    const acierto =
      indiceCorrecto !== null && r.indiceElegido === indiceCorrecto;
    if (acierto) aciertos += 1;

    const fuente = info ? fuenteDe.get(info.conceptoId) : undefined;
    detalle.push({
      actividadId: r.actividadId,
      correcta: info?.correcta ?? null,
      indiceCorrecto,
      acierto,
      explicacion: info ? (explicacionDe.get(info.conceptoId) ?? null) : null,
      articulo: fuente?.articulo ?? null,
      boeUrl: boeUrl(fuente?.ref ?? null, fuente?.articulo ?? null),
    });

    if (info) {
      eventos.push({
        usuario_id: DEMO_USUARIO_ID,
        concepto_id: info.conceptoId,
        actividad_id: r.actividadId,
        fecha: ahora.toISOString(),
        acierto,
        tiempo_respuesta_ms: r.tiempoMs ?? null,
      });
    }
  }

  const nota = Math.round((aciertos / total) * 10 * 100) / 100; // sobre 10, 2 dec.

  // 4) persistir: un registro de simulacro + un evento por pregunta
  const { data: sim } = await db
    .from("simulacro")
    .insert({
      usuario_id: DEMO_USUARIO_ID,
      convocatoria_id: CONVOCATORIA_PN,
      total,
      aciertos,
      nota,
      duracion_ms: duracionMs,
      detalle,
    })
    .select("id")
    .single();

  if (eventos.length > 0) {
    await db.from("evento").insert(eventos);
  }

  return {
    simulacroId: (sim?.id as string) ?? null,
    total,
    aciertos,
    nota,
    duracionMs,
    detalle,
  };
}
