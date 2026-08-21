"use client";

// ---------------------------------------------------------------------------
// «¿TE SIRVIÓ LO QUE ESTUDIASTE AQUÍ?»
//
// Aparece cuando la fecha objetivo ya pasó y el opositor vuelve a entrar. Hace
// dos cosas y ninguna más: recoge SU APRECIACIÓN SOBRE SI LA FORMACIÓN LE HA
// RENTADO, y borra la fecha vencida.
//
// NO PREGUNTA SI APROBÓ, y no es un matiz. Son dos cosas distintas:
//
//   · El resultado de una oposición tarda SEMANAS en publicarse. Preguntarlo el
//     día del examen es pedirle que adivine, y guardaríamos una corazonada
//     creyendo guardar un hecho.
//   · Si las preguntas del examen le sonaban, en cambio, lo sabe al salir del
//     aula. Esa es la señal que de verdad dice si el temario del cerebro apunta
//     donde apunta el tribunal, y es lo único que esta ventana intenta medir.
//
// Lo que NO hace: no toca el progreso, ni el perfil, ni el cerebro. Presentarse
// a un examen no borra lo aprendido, y quien no aprueba sigue desde donde lo
// dejó — no desde cero. Es justo el momento en que un opositor está más cerca de
// abandonar, así que la pantalla no le pide nada más que un gesto.
//
// POR QUÉ SÍ HAY UNA OPCIÓN NEGATIVA, HABIÉNDOSE QUITADO ANTES. Cuando la
// ventana preguntaba «¿qué tal el examen?», el pulgar hacia abajo señalaba al
// OPOSITOR: era pedirle que declarara su propio fracaso, y sobraba. Preguntando
// si la formación le sirvió, el pulgar abajo señala a ACERTIUM. Eso no es una
// herida, es una crítica al producto, y es la única respuesta que puede decirnos
// que algo no funciona: sin ella el indicador solo sabe subir, porque quien no
// aprovechó el temario se iría por «prefiero no decirlo» y leeríamos su silencio
// como timidez.
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

type Aprovechamiento = "sirvio" | "no_sirvio" | "sin_decir";

export default function QueTalElExamen({
  fecha,
  registrar,
}: {
  fecha: string;
  registrar: (
    fecha: string,
    aprovechamiento: Aprovechamiento,
  ) => Promise<{ ok: boolean }>;
}) {
  const [pendiente, empezar] = useTransition();
  const [elegido, setElegido] = useState<Aprovechamiento | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();

  const [a, m, d] = fecha.split("-").map(Number);
  const enEspanol = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  function responder(r: Aprovechamiento) {
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
        ¿Te sirvió lo que estudiaste aquí?
      </h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        Tenías puesto el examen el {enEspanol}. No te pregunto la nota —eso tarda
        en salir—, sino si las preguntas te sonaban. Si no te sirvió, dímelo sin
        reparos: es lo que más me ayuda a corregir el temario. Contestes lo que
        contestes, quito la fecha y tu progreso se queda donde está.
      </p>

      {/* Los dos pulgares arriba, del mismo tamaño y sin que uno destaque sobre
          el otro: si el «sí» fuese el botón de color, estaríamos empujando la
          respuesta que nos conviene y el dato dejaría de valer. «Prefiero no
          decirlo» va debajo, a lo ancho, para que callarse siga siendo fácil. */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("sirvio")}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-[15px] font-medium disabled:opacity-50"
          style={{
            borderColor: borde,
            background:
              elegido === "sirvio" ? "var(--color-primary-soft)" : "transparent",
          }}
        >
          <span aria-hidden="true" className="text-xl">
            👍
          </span>
          Sí, me sirvió
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("no_sirvio")}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-[15px] font-medium disabled:opacity-50"
          style={{
            borderColor: borde,
            background:
              elegido === "no_sirvio"
                ? "var(--color-primary-soft)"
                : "transparent",
          }}
        >
          <span aria-hidden="true" className="text-xl">
            👎
          </span>
          No mucho
        </button>
      </div>

      <button
        type="button"
        disabled={pendiente}
        onClick={() => responder("sin_decir")}
        className="mt-2 min-h-12 w-full rounded-xl border text-[15px] font-medium disabled:opacity-50"
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
