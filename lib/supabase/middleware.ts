import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión en cada request y sincroniza cookies. El guardado de rutas
// (redirigir a /login lo privado) se activará cuando existan las páginas de auth;
// por ahora todo es público (scaffold).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verifica/refresca la sesión (firma del JWT, local con claves asimétricas).
  await supabase.auth.getClaims();

  // TODO(auth): cuando existan /login, /registro, área privada, añadir aquí el
  // guard por rutas (patrón de V1: PUBLIC_ONLY / ALWAYS_PUBLIC).
  return response;
}
