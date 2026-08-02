import "server-only";
import { createClient } from "@supabase/supabase-js";

// ⚠️  CLIENTE DEL CEREBRO — service role, schema `acertium_v2`. Bypassa RLS y
// SOLO se usa desde código de servidor (server actions, route handlers). En el
// MVP todo el acceso al cerebro pasa por aquí; nunca desde el navegador.
//
// GATE DE INFRA: para que esto funcione, el schema `acertium_v2` debe estar
// EXPUESTO a la API en Supabase (Settings → API → Exposed schemas). Por defecto
// solo se exponen `public` y `graphql_public`. Sin exponerlo, PostgREST no sirve
// las tablas ni con service role. (Alternativa futura: RLS + exponer para acceso
// por-usuario desde el cliente.)
export function createCerebroClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "acertium_v2" },
    },
  );
}
