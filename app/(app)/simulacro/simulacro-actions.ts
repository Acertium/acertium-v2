"use server";

import {
  corregirSimulacro,
  type RespuestaUsuario,
  type ResumenSimulacro,
} from "@/lib/simulacro-data";

// Envuelve la corrección server-side. El cliente nunca ve las respuestas
// correctas hasta que finaliza y llega este resumen.
export async function accionCorregir(
  respuestas: RespuestaUsuario[],
): Promise<ResumenSimulacro> {
  return corregirSimulacro(respuestas);
}
