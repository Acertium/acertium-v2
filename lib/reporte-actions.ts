"use server";

// Server action compartida por práctica y simulacro (y cualquier formato
// futuro) para registrar un reporte de usuario sobre una pregunta. `reportar`
// vive en el cerebro (cliente service-role, server-only); este envoltorio la
// expone a los componentes cliente sin arrastrar el cliente al navegador.

import { reportar, type MotivoReporte } from "@/lib/cerebro";

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
