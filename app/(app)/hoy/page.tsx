import Link from "next/link";
import ProfesorFab from "./profesor-fab";
import { resumenHoy } from "@/lib/cerebro";
import { saludo, animo } from "@/lib/saludo";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

// Lee el resumen del cerebro en cada request.
export const dynamic = "force-dynamic";

export default async function HoyPage() {
  const r = await resumenHoy();

  // El titular es el PLAN DE HOY que ha calculado el coach, no el backlog
  // entero. Decir "tienes 3.290 conceptos por empezar" es cierto y no sirve de
  // nada: no es lo que toca hoy. Lo que toca hoy es lo que el planificador ha
  // repartido entre repasar y avanzar.
  const hoyTotal = r.hoyRepasar + r.hoyNuevos;
  const partes: string[] = [];
  if (r.hoyRepasar > 0)
    partes.push(`${r.hoyRepasar} ${r.hoyRepasar === 1 ? "repaso" : "repasos"}`);
  if (r.hoyNuevos > 0)
    partes.push(
      `${r.hoyNuevos} ${r.hoyNuevos === 1 ? "concepto nuevo" : "conceptos nuevos"}`,
    );
  const titular =
    hoyTotal === 0
      ? "Hoy no te toca nada: puedes descansar o hacer un simulacro"
      : `Hoy te tocan ${partes.join(" y ")}`;

  // El saludo lo elige `lib/saludo.ts` a partir del estado real del opositor
  // (cuánto hace que no viene, si es su primera vez, cuánto domina ya).
  const hola = saludo({ diasSinVenir: r.diasSinVenir, dominados: r.dominados });

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted">Policía Nacional · Escala Básica</p>
        <h1
          className="mt-1 text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {hola}
        </h1>
      </header>

      {/* Plan del día: sale del planificador, no de un cálculo de esta pantalla. */}
      <section
        className="rounded-2xl border p-5"
        style={{ background: "var(--color-surface)", borderColor: borde }}
      >
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {titular}
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          {r.aciertoPct !== null
            ? `Tu acierto hasta ahora es del ${r.aciertoPct}%. Te quedan ${r.pendientes.toLocaleString("es-ES")} conceptos por tocar de aquí al examen.`
            : "Empieza cuando quieras: tu profesor ajusta la tanda a tu absorción real."}
          {/* El backlog NO es culpa del opositor: son repasos vencidos que no
              caben en el presupuesto de hoy (PRESUPUESTO_DIARIO). Llamarlos
              "atrasados" además de sonar a reproche era inexacto. */}
          {r.backlog > 0
            ? ` Hay ${r.backlog.toLocaleString("es-ES")} repasos más esperando; te los iré repartiendo estos días.`
            : ""}
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
              {r.dominados.toLocaleString("es-ES")}
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
              {r.practicados.toLocaleString("es-ES")}
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
              {r.totalConceptos.toLocaleString("es-ES")}
            </p>
            <p className="mt-1 text-xs text-muted">del temario</p>
          </div>
        </div>

        <Link
          href="/practicar"
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-base font-medium"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Empezar
        </Link>

        <p className="mt-3 text-center text-[13px] leading-snug text-muted">
          {animo()}
        </p>
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
            Elige 25, 50 o 100 preguntas, cronometrado como el examen real.
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
