"use client";

// ---------------------------------------------------------------------------
// EL SEGUIMIENTO DE LOS 30 DÍAS
//
// Segunda —y última— vez que la app pregunta por un examen. La del día siguiente
// preguntaba si la formación le sirvió; esta pregunta el resultado, que entonces
// no existía.
//
// SE PREGUNTA POR EL EJERCICIO DE CONOCIMIENTOS, no por la oposición entera. Al
// mes quedan por delante físicas, reconocimiento médico y entrevista: preguntar
// «¿aprobaste?» a secas recogería respuestas que no significan lo mismo y las
// mezclaríamos en la misma columna.
//
// «AÚN NO LO SÉ» ES UNA RESPUESTA, NO UN DESCARTE. Para mucha gente es la verdad
// ese día, y forzarla a inventarse un sí o un no ensuciaría el único dato duro
// que vamos a tener. Cuando la elige, se le vuelve a preguntar un mes después.
//
// El comentario es opcional y va en un solo campo, sin obligar a nada: quien
// tiene algo que decir suele decirlo sin que se lo pidan con asteriscos.
// ---------------------------------------------------------------------------

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

type Aprobo = "si" | "no" | "aun_no_lo_se" | "sin_decir";

const OPCIONES: { valor: Aprobo; texto: string }[] = [
  { valor: "si", texto: "Lo pasé" },
  { valor: "no", texto: "No lo pasé" },
  { valor: "aun_no_lo_se", texto: "Aún no lo sé" },
];

export default function SeguimientoExamen({
  fechaExamen,
  registrar,
}: {
  fechaExamen: string;
  registrar: (
    fechaExamen: string,
    aprobo: Aprobo,
    comentario?: string,
  ) => Promise<{ ok: boolean }>;
}) {
  const [elegido, setElegido] = useState<Aprobo | null>(null);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState(false);
  const [pendiente, empezar] = useTransition();
  const router = useRouter();

  const [a, m, d] = fechaExamen.split("-").map(Number);
  const enEspanol = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  function enviar(aprobo: Aprobo) {
    setError(false);
    empezar(async () => {
      const r = await registrar(fechaExamen, aprobo, comentario);
      if (!r.ok) {
        setError(true);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section
      className="mb-4 rounded-2xl border p-5"
      style={{ background: "var(--color-surface)", borderColor: borde }}
      aria-live="polite"
    >
      <h2
        className="text-lg font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        ¿Cómo acabó lo del {enEspanol}?
      </h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        Ha pasado un mes, así que igual ya tienes la nota del ejercicio de
        conocimientos. Si aún no ha salido, dilo y te lo pregunto más adelante.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {OPCIONES.map((o) => (
          <button
            key={o.valor}
            type="button"
            disabled={pendiente}
            onClick={() => setElegido(o.valor)}
            aria-pressed={elegido === o.valor}
            className="min-h-12 w-full rounded-xl border px-4 text-left text-[15px] font-medium disabled:opacity-50"
            style={{
              borderColor: borde,
              background:
                elegido === o.valor
                  ? "var(--color-primary-soft)"
                  : "transparent",
            }}
          >
            {o.texto}
          </button>
        ))}
      </div>

      {/* El comentario aparece al elegir: pedirlo antes de saber de qué va
          la respuesta es pedirle que escriba en el vacío. */}
      {elegido && (
        <div className="mt-3">
          <label
            htmlFor="comentario-seguimiento"
            className="text-[13px] text-muted"
          >
            ¿Algo que quieras contarme? (opcional)
          </label>
          <textarea
            id="comentario-seguimiento"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Qué te faltó, qué te sobró, qué cayó y no habías visto…"
            className="mt-1 w-full rounded-xl border px-4 py-3 text-[15px]"
            style={{ background: "var(--color-bg)", borderColor: borde }}
          />
          <button
            type="button"
            disabled={pendiente}
            onClick={() => enviar(elegido)}
            className="mt-2 min-h-12 w-full rounded-xl px-4 text-base font-medium disabled:opacity-50"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            {pendiente ? "Enviando…" : "Enviar"}
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={pendiente}
        onClick={() => enviar("sin_decir")}
        className="mt-3 w-full text-center text-[13px] text-muted underline disabled:opacity-50"
      >
        Prefiero no decirlo
      </button>

      {error && (
        <p
          className="mt-2 text-center text-[13px]"
          style={{ color: "var(--color-error, #b00)" }}
        >
          No se ha podido guardar. Inténtalo otra vez.
        </p>
      )}
    </section>
  );
}
