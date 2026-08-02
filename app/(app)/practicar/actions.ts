"use server";

import {
  responder,
  siguienteActividad,
  reportar,
  type MotivoReporte,
} from "@/lib/cerebro";

export async function accionResponder(
  actividadId: string,
  indice: number,
  tiempoMs?: number,
) {
  return responder(actividadId, indice, tiempoMs);
}

export async function accionSiguiente() {
  return siguienteActividad();
}

export async function accionReportar(entrada: {
  actividadId: string;
  conceptoId: string;
  motivo: MotivoReporte;
  comentario?: string | null;
  contexto?: Record<string, unknown> | null;
}) {
  await reportar(entrada);
  return { ok: true };
}
