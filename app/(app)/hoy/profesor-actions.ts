"use server";

import { preguntarProfesor } from "@/lib/profesor-data";

// Envuelve la recuperación del profesor para poder llamarla desde el cliente
// (el chat del FAB en /hoy). De momento es búsqueda sobre el temario, sin LLM.
export async function accionPreguntarProfesor(pregunta: string) {
  const p = pregunta.trim();
  if (!p) return [];
  return preguntarProfesor(p);
}
