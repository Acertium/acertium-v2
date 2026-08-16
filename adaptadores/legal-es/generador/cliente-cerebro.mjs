// Acertium — adaptador legal-es / generador / cliente del cerebro
//
// Espejo en Node puro de `lib/supabase/cerebro.ts` (que no se puede importar
// desde aquí: lleva `import "server-only"` y es TypeScript). MISMA configuración:
// service role + schema `acertium_v2`, sin sesión ni refresco de token.
//
// SECRETOS: lee `.env.local` de la raíz del repo por su cuenta y NUNCA imprime
// su contenido. Ningún agente debe volcar estas variables por consola.

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "../../..");

// Parser mínimo de .env (no hay dependencia dotenv en el proyecto). Soporta
// KEY=valor, comillas simples/dobles y comentarios de línea completa.
export function cargarEnvLocal(ruta = join(RAIZ, ".env.local")) {
  if (!existsSync(ruta)) return { ok: false, motivo: `no existe ${ruta}` };
  let n = 0;
  for (const linea of readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const clave = t.slice(0, i).trim();
    let valor = t.slice(i + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    )
      valor = valor.slice(1, -1);
    if (process.env[clave] === undefined) process.env[clave] = valor;
    n++;
  }
  return { ok: true, variables: n }; // solo el número, nunca los valores
}

export function createCerebroClient() {
  cargarEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local)",
    );
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "acertium_v2" },
  });
}
