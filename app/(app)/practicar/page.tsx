import { siguienteActividad } from "@/lib/cerebro";
import PracticaRunner from "./practica-runner";

// Se renderiza en cada request (lee del cerebro en Supabase).
export const dynamic = "force-dynamic";

export default async function PracticarPage() {
  const inicial = await siguienteActividad();

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Practicar
        </h1>
        <span className="text-sm text-muted">Policía Nacional · Escala Básica</span>
      </header>

      {inicial ? (
        <PracticaRunner inicial={inicial} />
      ) : (
        <p className="text-muted">
          No hay actividades disponibles todavía. (¿Está el schema{" "}
          <code>acertium_v2</code> expuesto en Supabase?)
        </p>
      )}
    </main>
  );
}
