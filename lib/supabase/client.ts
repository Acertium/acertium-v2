import { createBrowserClient } from "@supabase/ssr";

// Cliente de navegador: SOLO para auth/sesión. El cerebro (schema acertium_v2)
// se lee/escribe desde el servidor (ver lib/supabase/cerebro.ts).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
