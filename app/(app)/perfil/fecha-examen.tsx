"use client";

// ---------------------------------------------------------------------------
// LA FECHA DE EXAMEN, EN EL PERFIL
//
// La pone el opositor o no la pone. NO se hereda de la convocatoria: que el BOE
// publique una fecha no significa que este opositor se presente a ESA — lo
// normal es tardar varias convocatorias —, y darle por supuesta una cuenta atrás
// ajena le mete prisa el coach y le habla la app de un examen al que no va.
//
// Por eso el estado "sin fecha" se presenta como una ELECCIÓN con nombre («vas
// sin fecha»), no como un campo a medio rellenar, y se puede volver a él con un
// botón tan visible como el de guardar.
// ---------------------------------------------------------------------------

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

function enEspanol(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function FechaExamen({
  inicial,
  diasRestantes,
  guardar,
}: {
  inicial: string | null;
  diasRestantes: number | null;
  guardar: (fecha: string | null) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState(inicial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();
  const router = useRouter();

  // Mínimo = mañana. El servidor lo vuelve a comprobar: esto solo evita el viaje.
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  function aplicar(fecha: string | null) {
    setError(null);
    empezar(async () => {
      const r = await guardar(fecha);
      if (!r.ok) {
        setError(r.error ?? "No se ha podido guardar.");
        return;
      }
      setAbierto(false);
      // El plan del día cambia con la fecha, así que se relee el servidor.
      router.refresh();
    });
  }

  const resumen =
    inicial === null
      ? "Vas sin fecha"
      : diasRestantes !== null && diasRestantes >= 0
        ? `${enEspanol(inicial)} · ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`
        : enEspanol(inicial);

  return (
    <li
      className="rounded-2xl border px-5 py-3"
      style={{ background: "var(--color-surface)", borderColor: borde }}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-[15px] font-medium">Fecha de examen</span>
        <span className="flex items-center gap-2">
          <span className="text-right text-sm text-muted">{resumen}</span>
          <span className="text-muted">{abierto ? "⌄" : "›"}</span>
        </span>
      </button>

      {abierto && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: borde }}>
          <p className="text-[13px] leading-relaxed text-muted">
            Si te has fijado una convocatoria, ponla y el profesor apretará el
            ritmo conforme se acerque. Si estudias sin prisa, déjala vacía: el
            repaso espaciado funciona igual, solo que sin cuenta atrás.
          </p>

          <input
            type="date"
            value={valor}
            min={manana}
            onChange={(e) => setValor(e.target.value)}
            className="mt-3 min-h-12 w-full rounded-xl border px-4 text-base"
            style={{ background: "var(--color-bg)", borderColor: borde }}
          />

          {error && (
            <p className="mt-2 text-[13px]" style={{ color: "var(--color-error, #b00)" }}>
              {error}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pendiente || valor === ""}
              onClick={() => aplicar(valor)}
              className="min-h-12 flex-1 rounded-xl px-4 text-base font-medium disabled:opacity-50"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              {pendiente ? "Guardando…" : "Guardar"}
            </button>
            {inicial !== null && (
              <button
                type="button"
                disabled={pendiente}
                onClick={() => {
                  setValor("");
                  aplicar(null);
                }}
                className="min-h-12 rounded-xl border px-4 text-base font-medium disabled:opacity-50"
                style={{ borderColor: borde }}
              >
                Quitar fecha
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
