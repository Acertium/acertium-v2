import "server-only";
import { cookies } from "next/headers";
import { createCerebroClient } from "@/lib/supabase/cerebro";

// ---------------------------------------------------------------------------
// PANEL DE ADMIN — puerta de acceso y lectura/escritura del cerebro.
//
// Todo lo de aquí es server-only: usa el cliente service-role, que bypassa RLS
// y nunca debe llegar al navegador.
//
// GATING, FAIL-CLOSED. Hoy la app NO tiene login: `lib/cerebro.ts` trabaja con
// un `DEMO_USUARIO_ID` fijo, así que un gate por UID no tendría contra qué
// comparar. Por eso el mecanismo vigente es `ADMIN_TOKEN` (cookie), que es lo
// que el PROMPT_012 prevé como interino.
//
// TODO (cuando exista login real): comparar el id del usuario de la sesión con
// `ADMIN_USER_ID` —la variable ya está en `.env.local.example`— y, mejor aún,
// migrar a gating por rol. `esAdmin()` es el único punto a tocar.
//
// Fail-closed en los dos sentidos: sin variable configurada, o con token que no
// coincide, `esAdmin()` devuelve false y la ruta responde 404.
// ---------------------------------------------------------------------------

export const COOKIE_ADMIN = "acertium_admin";

/** Comparación en tiempo constante: evita distinguir un token por lo que tarda. */
function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function esAdmin(): Promise<boolean> {
  const esperado = process.env.ADMIN_TOKEN ?? "";
  // Sin token configurado, el panel está cerrado para todo el mundo.
  if (!esperado.trim()) return false;
  const cookie = (await cookies()).get(COOKIE_ADMIN)?.value ?? "";
  if (!cookie) return false;
  return igualSeguro(cookie, esperado);
}

// --- Bloque 1: reportes de usuarios ----------------------------------------

export type EstadoReporte = "abierto" | "revisado" | "corregido" | "descartado";

export type ReporteFila = {
  id: number;
  motivo: string;
  comentario: string | null;
  contexto: unknown;
  creado: string;
  conceptoId: string | null;
  actividadId: string | null;
  enunciado: string | null;
  conceptoTitulo: string | null;
};

export async function reportesAbiertos(): Promise<ReporteFila[]> {
  const db = createCerebroClient();
  const { data, error } = await db
    .from("reporte")
    .select("id, motivo, comentario, contexto, creado, concepto_id, actividad_id")
    .eq("estado", "abierto")
    .order("creado", { ascending: false })
    .limit(200);
  if (error) throw new Error(`no se pudieron leer los reportes: ${error.message}`);
  const filas = data ?? [];
  if (!filas.length) return [];

  // El enunciado y el título viven en otras tablas; se traen en dos consultas y
  // se cruzan aquí (PostgREST no hace joins arbitrarios entre estas tablas).
  const actIds = [...new Set(filas.map((r) => r.actividad_id).filter(Boolean))] as string[];
  const conIds = [...new Set(filas.map((r) => r.concepto_id).filter(Boolean))] as string[];

  const [acts, cons] = await Promise.all([
    actIds.length
      ? db.from("actividad").select("id, enunciado").in("id", actIds)
      : Promise.resolve({ data: [] as { id: string; enunciado: string }[] }),
    conIds.length
      ? db.from("concepto").select("id, titulo").in("id", conIds)
      : Promise.resolve({ data: [] as { id: string; titulo: string }[] }),
  ]);
  const porAct = new Map((acts.data ?? []).map((a) => [a.id, a.enunciado]));
  const porCon = new Map((cons.data ?? []).map((c) => [c.id, c.titulo]));

  return filas.map((r) => ({
    id: r.id as number,
    motivo: r.motivo as string,
    comentario: (r.comentario ?? null) as string | null,
    contexto: r.contexto,
    creado: r.creado as string,
    conceptoId: (r.concepto_id ?? null) as string | null,
    actividadId: (r.actividad_id ?? null) as string | null,
    enunciado: porAct.get(r.actividad_id as string) ?? null,
    conceptoTitulo: porCon.get(r.concepto_id as string) ?? null,
  }));
}

export async function cerrarReporte(id: number, estado: EstadoReporte, nota: string) {
  const db = createCerebroClient();
  const { error } = await db
    .from("reporte")
    .update({
      estado,
      nota_interna: nota.trim() || null,
      atendido: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`no se pudo cerrar el reporte ${id}: ${error.message}`);
}

// --- Bloque 2: cola de revisión de contenido -------------------------------

export type PendienteFila = {
  id: string;
  conceptoId: string;
  familia: string;
  enunciado: string;
  opciones: string[];
  correcta: string | null;
  cotejo: string | null;
  fuente: string | null;
};

export async function colaRevision(): Promise<PendienteFila[]> {
  const db = createCerebroClient();
  const { data, error } = await db
    .from("actividad")
    .select("id, concepto_id, enunciado, opciones, respuesta, cotejo_fuente")
    .eq("estado_verificacion", "pendiente_revision")
    .limit(500);
  if (error) throw new Error(`no se pudo leer la cola de revisión: ${error.message}`);
  const filas = data ?? [];
  if (!filas.length) return [];

  const conIds = [...new Set(filas.map((a) => a.concepto_id as string))];
  const fuentes = new Map<string, string>();
  for (let i = 0; i < conIds.length; i += 100) {
    const { data: fs } = await db
      .from("concepto_fuente")
      .select("concepto_id, norma, articulo, referencia_boe")
      .in("concepto_id", conIds.slice(i, i + 100));
    for (const f of fs ?? [])
      fuentes.set(
        f.concepto_id as string,
        [f.norma, f.articulo, f.referencia_boe].filter(Boolean).join(" · "),
      );
  }

  return filas.map((a) => ({
    id: a.id as string,
    conceptoId: a.concepto_id as string,
    familia: String(a.concepto_id).split("-")[0],
    enunciado: (a.enunciado ?? "") as string,
    opciones: (a.opciones ?? []) as string[],
    correcta: ((a.respuesta as { correcta?: string } | null)?.correcta ?? null) as string | null,
    cotejo: (a.cotejo_fuente ?? null) as string | null,
    fuente: fuentes.get(a.concepto_id as string) ?? null,
  }));
}

/**
 * Promueve (o rechaza) contenido pendiente de revisión.
 *
 * El concepto viaja con su actividad: si la pregunta pasa a `verificado` pero su
 * concepto se queda en `pendiente_revision`, el selector acabaría con un
 * concepto sin revisar y pregunta servible — justo la incoherencia que el
 * contrato quiere evitar. Mismo criterio que `revision-pendientes.mjs`.
 */
export async function resolverPendientes(
  filtro: { actividadId: string } | { familia: string },
  estado: "verificado" | "rechazado",
): Promise<number> {
  const db = createCerebroClient();
  let q = db
    .from("actividad")
    .update({ estado_verificacion: estado })
    .eq("estado_verificacion", "pendiente_revision");
  q = "actividadId" in filtro ? q.eq("id", filtro.actividadId) : q.like("concepto_id", `${filtro.familia}-%`);

  const { data, error } = await q.select("id, concepto_id");
  if (error) throw new Error(`no se pudo actualizar la cola: ${error.message}`);

  const conceptos = [...new Set((data ?? []).map((r) => r.concepto_id as string))];
  if (conceptos.length) {
    const { error: eC } = await db
      .from("concepto")
      .update({ estado_verificacion: estado, explicacion_verificacion: estado })
      .in("id", conceptos)
      .eq("estado_verificacion", "pendiente_revision");
    if (eC) throw new Error(`actividades actualizadas pero el concepto no: ${eC.message}`);
  }
  return (data ?? []).length;
}
