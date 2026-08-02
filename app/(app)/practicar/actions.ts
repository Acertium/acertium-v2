"use server";

import { responder, siguienteActividad } from "@/lib/cerebro";

export async function accionResponder(actividadId: string, indice: number) {
  return responder(actividadId, indice);
}

export async function accionSiguiente() {
  return siguienteActividad();
}
