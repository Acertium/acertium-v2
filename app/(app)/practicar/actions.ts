"use server";

import { responder, siguienteActividad } from "@/lib/cerebro";

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
