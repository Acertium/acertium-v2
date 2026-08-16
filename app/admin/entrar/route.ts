import { NextResponse } from "next/server";
import { COOKIE_ADMIN } from "@/lib/admin";

// Entrada al panel: `/admin/entrar?token=…` deja la cookie y redirige a /admin.
//
// Existe para que el token no se quede colgando en la barra de direcciones ni
// en el historial de cada visita al panel: se pasa una vez y a partir de ahí
// manda la cookie (httpOnly, así que el JavaScript de la página no la ve).
//
// Fail-closed: sin `ADMIN_TOKEN` configurado, o con token que no coincide,
// responde 404 — el mismo 404 que /admin, para no confirmar que el panel existe.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const esperado = process.env.ADMIN_TOKEN ?? "";
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!esperado.trim() || token !== esperado) {
    return new NextResponse(null, { status: 404 });
  }

  const res = NextResponse.redirect(new URL("/admin", request.url));
  res.cookies.set(COOKIE_ADMIN, esperado, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
