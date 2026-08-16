"use server";

import { revalidatePath } from "next/cache";
import {
  cerrarReporte,
  esAdmin,
  resolverPendientes,
  type EstadoReporte,
} from "@/lib/admin";

// Server actions del panel. Cada una vuelve a comprobar `esAdmin()`: una server
// action es un endpoint HTTP, y que la página esté gateada no impide que alguien
// llame directamente a la acción. El gate de la página protege la vista; este
// protege la escritura.

const ESTADOS_VALIDOS: EstadoReporte[] = ["revisado", "corregido", "descartado"];

export async function accionCerrarReporte(id: number, estado: string, nota: string) {
  if (!(await esAdmin())) throw new Error("no autorizado");
  if (!ESTADOS_VALIDOS.includes(estado as EstadoReporte))
    throw new Error(`estado no válido: ${estado}`);
  await cerrarReporte(id, estado as EstadoReporte, nota ?? "");
  revalidatePath("/admin");
}

export async function accionPromoverActividad(actividadId: string) {
  if (!(await esAdmin())) throw new Error("no autorizado");
  const n = await resolverPendientes({ actividadId }, "verificado");
  revalidatePath("/admin");
  return n;
}

export async function accionRechazarActividad(actividadId: string) {
  if (!(await esAdmin())) throw new Error("no autorizado");
  const n = await resolverPendientes({ actividadId }, "rechazado");
  revalidatePath("/admin");
  return n;
}

export async function accionPromoverFamilia(familia: string) {
  if (!(await esAdmin())) throw new Error("no autorizado");
  if (!/^[A-Z0-9]+$/.test(familia)) throw new Error(`familia no válida: ${familia}`);
  const n = await resolverPendientes({ familia }, "verificado");
  revalidatePath("/admin");
  return n;
}
