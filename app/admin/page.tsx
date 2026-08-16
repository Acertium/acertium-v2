import { notFound } from "next/navigation";
import { colaRevision, esAdmin, reportesAbiertos } from "@/lib/admin";
import { BotonFamilia, TarjetaPendiente, TarjetaReporte } from "./admin-client";

// Panel de revisión. Dos bloques: los avisos que mandan los usuarios y el
// contenido de consenso que espera aprobación antes de servirse.
//
// Cerrado con `ADMIN_TOKEN` (ver lib/admin.ts). Fail-closed: sin token
// configurado o sin cookie válida, 404 — no 403, para no confirmar que existe.

export const dynamic = "force-dynamic";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

export default async function AdminPage() {
  if (!(await esAdmin())) notFound();

  const [reportes, pendientes] = await Promise.all([reportesAbiertos(), colaRevision()]);

  const porFamilia = new Map<string, typeof pendientes>();
  for (const p of pendientes) {
    if (!porFamilia.has(p.familia)) porFamilia.set(p.familia, []);
    porFamilia.get(p.familia)!.push(p);
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-8 pb-16">
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Revisión
        </h1>
        <p className="mt-1 text-sm text-muted">
          Lo que los usuarios avisan y lo que espera tu visto bueno antes de servirse.
        </p>
      </header>

      {/* ---------- Bloque 1: reportes ---------- */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Avisos de usuarios
          </h2>
          <span className="text-sm text-muted">
            {reportes.length === 0
              ? "ninguno abierto"
              : `${reportes.length} abierto${reportes.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {reportes.length === 0 ? (
          <p
            className="rounded-2xl border p-4 text-sm text-muted"
            style={{ background: "var(--color-surface)", borderColor: borde }}
          >
            Nadie ha reportado nada pendiente. Cuando alguien use «Mejorar esta pregunta»,
            aparecerá aquí.
          </p>
        ) : (
          <ul className="space-y-3">
            {reportes.map((r) => (
              <TarjetaReporte key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Bloque 2: cola de contenido ---------- */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Contenido por aprobar
          </h2>
          <span className="text-sm text-muted">
            {pendientes.length === 0 ? "nada en cola" : `${pendientes.length} preguntas`}
          </span>
        </div>

        {pendientes.length === 0 ? (
          <p
            className="rounded-2xl border p-4 text-sm text-muted"
            style={{ background: "var(--color-surface)", borderColor: borde }}
          >
            La cola está vacía. Aquí caerá el contenido de <em>consenso</em> (temas 28-33), que se
            carga sin servirse hasta que lo apruebes.
          </p>
        ) : (
          [...porFamilia].sort().map(([familia, lista]) => (
            <div key={familia} className="mb-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-sm font-semibold">
                  {familia} · {lista.length}
                </h3>
                <BotonFamilia familia={familia} cuantas={lista.length} />
              </div>
              <ul className="space-y-3">
                {lista.map((p) => (
                  <TarjetaPendiente key={p.id} p={p} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
