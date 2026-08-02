import Link from "next/link";
import { progresoTemas } from "@/lib/cerebro";

// Lee el progreso del cerebro en cada request.
export const dynamic = "force-dynamic";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

// "Tema 14 — La Ley…" → "14"
function numeroTema(tema: string): string {
  const m = tema.match(/Tema\s+(\d+)/i);
  return m ? m[1] : "·";
}

// Acorta "Tema N — Título largo: subtítulo…" a algo legible para la tarjeta:
// quita el prefijo "Tema N —", corta en el primer ":" y limita la longitud.
function tituloCorto(tema: string): string {
  let t = tema;
  const partes = t.split(/\s[—-]\s/);
  if (partes.length > 1) t = partes.slice(1).join(" — ");
  const colon = t.indexOf(":");
  if (colon > -1) t = t.slice(0, colon);
  t = t.trim();
  return t.length > 68 ? `${t.slice(0, 65).trimEnd()}…` : t;
}

export default async function TemasPage() {
  const temas = await progresoTemas();

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <header className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Temas
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tu temario, tema a tema. Cada barra es cuánto llevas dominado.
        </p>
      </header>

      {temas.length === 0 ? (
        <p className="text-muted">
          Aún no hay temas cargados para esta convocatoria.
        </p>
      ) : (
        <ul className="space-y-3">
          {temas.map((t) => (
            <li key={t.tema}>
              <Link
                href={`/practicar?tema=${encodeURIComponent(t.tema)}`}
                className="block rounded-2xl border p-4"
                style={{
                  background: "var(--color-surface)",
                  borderColor: borde,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      background: "var(--color-primary-soft)",
                      color: "var(--color-primary-dark)",
                    }}
                  >
                    {numeroTema(t.tema)}
                  </span>
                  <span className="text-[15px] font-medium leading-snug">
                    {tituloCorto(t.tema)}
                  </span>
                </div>

                {/* Barra de progreso (verde de marca) */}
                <div
                  className="mt-3 h-2 w-full overflow-hidden rounded-full"
                  style={{
                    background: "color-mix(in srgb, var(--color-fg) 8%, transparent)",
                  }}
                  role="progressbar"
                  aria-valuenow={t.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso de ${tituloCorto(t.tema)}`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${t.pct}%`,
                      background: "var(--color-primary)",
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>
                    {t.dominados}/{t.totalConceptos} conceptos dominados
                  </span>
                  <span className="font-semibold" style={{ color: "var(--color-primary-dark)" }}>
                    {t.pct}%
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
