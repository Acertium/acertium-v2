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
// NO HAY PULGAR ABAJO, Y ES DELIBERADO. Solo «fue bien» y «prefiero no
// decirlo». Pedirle a alguien que acaba de suspender que lo declare pulsando un
// pulgar hacia abajo es pedirle que se señale, y este es justo el momento en que
// más gente abandona. Quien quiera contarlo tiene un botón; quien no, tiene otro
// igual de grande y sin connotación.
//
// LA CONSECUENCIA, QUE HAY QUE TENER PRESENTE AL LEER LOS DATOS: `sin_decir` ya
// no significa solo «no quiero contarlo» — absorbe también a quien le fue mal.
// De `examen_rendido` NO se puede deducir un porcentaje de aprobados, y nadie
// debería intentarlo. Es el precio elegido a cambio de no hurgar en la herida.
//
// Otras dos decisiones de tono:
//
// 1. SE PUEDE CERRAR SIN CONTARLO. «Prefiero no decirlo» guarda `sin_decir` y
//    limpia la fecha igual. Si el opositor cerrase la app sin responder, la
//    fecha vencida se quedaría ahí y el coach seguiría descolocado.
// 2. NINGUNA RESPUESTA CAMBIA EL PLAN. Lo que toca estudiar sale del motor, que
//    ya sabe lo que sabes por tus respuestas, no por lo que declares aquí.
// ---------------------------------------------------------------------------

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

type Resultado = "bien" | "sin_decir";

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

      {/* Las dos opciones, del mismo tamaño y con el mismo peso visual: callarse
          no es la salida de emergencia, es una respuesta como la otra. */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("bien")}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-[15px] font-medium disabled:opacity-50"
          style={{
            borderColor: borde,
            background:
              elegido === "bien" ? "var(--color-primary-soft)" : "transparent",
          }}
        >
          <span aria-hidden="true" className="text-xl">
            👍
          </span>
          Fue bien
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("sin_decir")}
          className="min-h-12 flex-1 rounded-xl border px-3 text-[15px] font-medium disabled:opacity-50"
          style={{
            borderColor: borde,
            background:
              elegido === "sin_decir"
                ? "var(--color-primary-soft)"
                : "transparent",
          }}
        >
          Prefiero no decirlo
        </button>
      </div>

      {error && (
        <p className="mt-2 text-center text-[13px]" style={{ color: "var(--color-error, #b00)" }}>
          No se ha podido guardar. Inténtalo otra vez.
        </p>
      )}
    </section>
  );
}
