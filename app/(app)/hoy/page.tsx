import Link from "next/link";
import ProfesorFab from "./profesor-fab";
import { resumenHoy } from "@/lib/cerebro";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

// Lee el resumen del cerebro en cada request.
export const dynamic = "force-dynamic";

export default async function HoyPage() {
  const r = await resumenHoy();
  // "Por repasar": conceptos ya practicados que aún no están dominados.
  const porRepasar = Math.max(0, r.practicados - r.dominados);

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted">Constitución · Policía Nacional</p>
        <h1
          className="mt-1 text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Hola de nuevo
        </h1>
      </header>

      {/* Tarjeta "Hoy toca…" con datos reales */}
      <section
        className="rounded-2xl border p-5"
        style={{ background: "var(--color-surface)", borderColor: borde }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Hoy toca…
        </p>
        <h2
          className="mt-1 text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tienes {r.pendientes}{" "}
          {r.pendientes === 1 ? "concepto" : "conceptos"} por empezar
          {porRepasar > 0 ? ` y ${porRepasar} por repasar` : ""}
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          {r.aciertoPct !== null
            ? `Tu acierto hasta ahora es del ${r.aciertoPct}%. Sigue sumando repasos para afianzar lo que ya tocaste.`
            : "Empieza cuando quieras: tu profesor ajusta la tanda a tu absorción real."}
        </p>

        {/* Mini-resumen */}
        <div className="mt-4 flex gap-2">
          <div
            className="flex-1 rounded-xl px-3 py-2 text-center"
            style={{ background: "var(--color-primary-soft)" }}
          >
            <p
              className="text-lg font-bold leading-none"
              style={{ color: "var(--color-primary-dark)" }}
            >
              {r.dominados}
            </p>
            <p className="mt-1 text-xs text-muted">dominados</p>
          </div>
          <div
            className="flex-1 rounded-xl px-3 py-2 text-center"
            style={{ background: "var(--color-primary-soft)" }}
          >
            <p
              className="text-lg font-bold leading-none"
              style={{ color: "var(--color-primary-dark)" }}
            >
              {r.practicados}
            </p>
            <p className="mt-1 text-xs text-muted">practicados</p>
          </div>
          <div
            className="flex-1 rounded-xl px-3 py-2 text-center"
            style={{ background: "var(--color-primary-soft)" }}
          >
            <p
              className="text-lg font-bold leading-none"
              style={{ color: "var(--color-primary-dark)" }}
            >
              {r.totalConceptos}
            </p>
            <p className="mt-1 text-xs text-muted">en total</p>
          </div>
        </div>

        <Link
          href="/practicar"
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-base font-medium"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Empezar
        </Link>
      </section>

      {/* Acceso a simulacro */}
      <Link
        href="/simulacro"
        className="mt-4 flex items-center justify-between rounded-2xl border p-5"
        style={{ background: "var(--color-surface)", borderColor: borde }}
      >
        <div className="pr-4">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Haz un simulacro
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Examen cronometrado como el día real.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
          style={{
            background: "var(--color-primary-soft)",
            color: "var(--color-primary-dark)",
          }}
        >
          Empezar
        </span>
      </Link>

      <ProfesorFab />
    </main>
  );
}
