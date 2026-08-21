"use client";

// ---------------------------------------------------------------------------
// «¿QUÉ TAL EL EXAMEN?»
//
// Aparece cuando la fecha objetivo ya pasó y el opositor vuelve a entrar. Hace
// dos cosas y ninguna más: recoge el desenlace y BORRA la fecha vencida.
//
// Lo que NO hace, y conviene que siga siendo así: no toca el progreso, ni el
// perfil, ni el cerebro. Presentarse a un examen no borra lo aprendido, y quien
// no aprueba sigue desde donde lo dejó — no desde cero. Es justo el momento en
// que un opositor está más cerca de abandonar, así que la pantalla no le pide
// nada más que un gesto.
//
// Tres decisiones de tono:
//
// 1. SE PUEDE CERRAR SIN CONTARLO. «Prefiero no decirlo» guarda `sin_decir` y
//    limpia la fecha igual. Obligar a declarar un mal resultado el mismo día
//    sería cruel, y si el opositor cerrase la app sin responder, la fecha
//    vencida se quedaría ahí.
// 2. NINGUNA RESPUESTA CAMBIA EL PLAN. Ni el pulgar arriba ni el abajo alteran
//    lo que toca estudiar: el motor ya sabe lo que sabes, por tus respuestas.
// 3. NO SE FELICITA NI SE CONSUELA DE MÁS. Un «¡enhorabuena!» a quien marcó el
//    pulgar abajo por error, o un discurso a quien suspendió, sobran.
// ---------------------------------------------------------------------------

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

type Resultado = "bien" | "mal" | "sin_decir";

export default function QueTalElExamen({
  fecha,
  registrar,
}: {
  fecha: string;
  registrar: (
    fecha: string,
    resultado: Resultado,
  ) => Promise<{ ok: boolean }>;
}) {
  const [pendiente, empezar] = useTransition();
  const [elegido, setElegido] = useState<Resultado | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();

  const [a, m, d] = fecha.split("-").map(Number);
  const enEspanol = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  function responder(r: Resultado) {
    setElegido(r);
    setError(false);
    empezar(async () => {
      const res = await registrar(fecha, r);
      if (!res.ok) {
        setError(true);
        setElegido(null);
        return;
      }
      // Al borrarse la fecha, el plan del día vuelve a calcularse sin ella.
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
        ¿Qué tal el examen?
      </h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        Tenías puesto el {enEspanol}. Cuéntamelo si quieres y quito la fecha;
        tu progreso se queda donde está, pase lo que pase.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("bien")}
          aria-label="Fue bien"
          className="min-h-12 flex-1 rounded-xl border text-xl disabled:opacity-50"
          style={{
            borderColor: borde,
            background:
              elegido === "bien" ? "var(--color-primary-soft)" : "transparent",
          }}
        >
          👍
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("mal")}
          aria-label="Fue mal"
          className="min-h-12 flex-1 rounded-xl border text-xl disabled:opacity-50"
          style={{
            borderColor: borde,
            background:
              elegido === "mal" ? "var(--color-primary-soft)" : "transparent",
          }}
        >
          👎
        </button>
      </div>

      <button
        type="button"
        disabled={pendiente}
        onClick={() => responder("sin_decir")}
        className="mt-3 w-full text-center text-[13px] text-muted underline disabled:opacity-50"
      >
        Prefiero no decirlo
      </button>

      {error && (
        <p className="mt-2 text-center text-[13px]" style={{ color: "var(--color-error, #b00)" }}>
          No se ha podido guardar. Inténtalo otra vez.
        </p>
      )}
    </section>
  );
}
