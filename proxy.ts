import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renombró "middleware" a "proxy": el fichero se llama proxy.ts y
// exporta una función `proxy`. La lógica de sesión vive en lib/supabase/middleware.ts.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
