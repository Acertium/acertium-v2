import Link from "next/link";
import { iniciarSimulacro, PREGUNTAS_SIMULACRO } from "@/lib/simulacro-data";
import SimulacroRunner from "./simulacro-runner";

// Se monta en cada request (lee actividades al azar del cerebro).
export const dynamic = "force-dynamic";

export default async function SimulacroPage() {
  const preguntas = await iniciarSimulacro(PREGUNTAS_SIMULACRO);

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-6">
      {preguntas.length > 0 ? (
        <SimulacroRunner preguntas={preguntas} />
      ) : (
        <div className="py-10">
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Simulacro
          </h1>
          <p className="mt-3 text-muted">
            No hay suficientes preguntas verificadas todavía para montar un
            examen. (¿Está el schema <code>acertium_v2</code> expuesto en
            Supabase?)
          </p>
          <Link
            href="/hoy"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-medium"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            Volver
          </Link>
        </div>
      )}
    </main>
  );
}
