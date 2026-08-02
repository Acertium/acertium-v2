import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de servidor ligado a la sesión (cookies). Para auth y datos del
// usuario en el schema public. El cerebro va por lib/supabase/cerebro.ts.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component: el refresco de sesión lo hace el proxy.
          }
        },
      },
    },
  );
}
