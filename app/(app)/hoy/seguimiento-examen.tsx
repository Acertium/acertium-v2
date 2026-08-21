"use client";

// ---------------------------------------------------------------------------
// EL SEGUIMIENTO DE LOS 30 DÍAS
//
// Segunda —y última— vez que la app pregunta por un examen. La del día siguiente
// preguntaba si la formación le sirvió; esta pregunta el resultado, que entonces
// no existía.
//
// SOLO PREGUNTA POR LA PRIMERA PRUEBA: las 100 preguntas del temario del anexo I,
// que es de cuyo contenido respondemos. Los psicotécnicos, las físicas, el
// reconocimiento y la entrevista no dependen de lo que se estudia aquí. Meterlos
// en el mismo dato no daría una medida más completa: daría una peor, porque un
// «no» que en realidad es una lesión en el circuito se leería como un fallo del
// temario.
//
// NO SE PREGUNTA «¿APROBASTE?», Y ES A PROPÓSITO. En esta convocatoria esa
// palabra es ambigua: la base 6.1.1 exige un mínimo de 3 puntos, pero además solo
// continúan «las mejores calificaciones, hasta llegar a 1'75 aspirantes por cada
// una» de las plazas. Se puede sacar un 5 —aprobado de sobra— y no seguir en el
// proceso. Preguntando «¿seguiste?» y pidiendo la nota, las dos cosas quedan
// separadas en vez de mezcladas en la misma casilla.
//
// LA NOTA ES LO QUE DE VERDAD MIDE SI ESTO FUNCIONA. Es lo único comparable
// contra el dominio que el motor le estimaba antes del examen, así que va pedida
// pero opcional: quien no quiera darla contesta igual.
//
// «AÚN NO LO SÉ» ES UNA RESPUESTA, NO UN DESCARTE. Para mucha gente es la verdad
// ese día, y forzarla a inventarse un sí o un no ensuciaría el único dato duro
// que vamos a tener. Cuando la elige, se le vuelve a preguntar un mes después.
// ---------------------------------------------------------------------------

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

type PasoCorte = "si" | "no" | "aun_no_lo_se" | "sin_decir";

const OPCIONES: { valor: PasoCorte; texto: string }[] = [
  { valor: "si", texto: "Seguí en el proceso" },
  { valor: "no", texto: "Me quedé fuera" },
  { valor: "aun_no_lo_se", texto: "Aún no lo sé" },
];

export default function SeguimientoExamen({
  fechaExamen,
  registrar,
}: {
  fechaExamen: string;
  registrar: (
    fechaExamen: string,
    pasoCorte: PasoCorte,
    nota?: number | null,
    comentario?: string,
  ) => Promise<{ ok: boolean }>;
}) {
  const [elegido, setElegido] = useState<PasoCorte | null>(null);
  const [nota, setNota] = useState("");
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

  function enviar(pasoCorte: PasoCorte) {
    setError(false);
    // La coma decimal es lo natural escribiendo en español; el input numérico no
    // siempre la acepta, así que se normaliza aquí en vez de exigirle un punto.
    const n = Number(nota.replace(",", "."));
    const notaValida = nota.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 10;
    empezar(async () => {
      const r = await registrar(
        fechaExamen,
        pasoCorte,
        notaValida ? n : null,
        comentario,
      );
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
        ¿Cómo te fue en la primera prueba?
      </h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        La del {enEspanol}: las cien preguntas del temario. Solo te pregunto por
        esa, que es de la que respondo — los físicos y lo demás no dependen de lo
        que estudiamos aquí. Si aún no ha salido la nota, dilo y te lo pregunto
        más adelante.
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

      {/* La nota y el comentario aparecen al elegir: pedirlos antes de saber de
          qué va la respuesta es pedirle que escriba en el vacío. */}
      {elegido && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: borde }}>
          {elegido !== "aun_no_lo_se" && (
            <>
              <label htmlFor="nota-primera" className="text-[13px] text-muted">
                ¿Y qué nota sacaste, de 0 a 10? (opcional, pero es lo que más me
                ayuda)
              </label>
              <input
                id="nota-primera"
                inputMode="decimal"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="7,25"
                className="mt-1 min-h-12 w-full rounded-xl border px-4 text-base"
                style={{ background: "var(--color-bg)", borderColor: borde }}
              />
            </>
          )}

          <label
            htmlFor="comentario-seguimiento"
            className="mt-3 block text-[13px] text-muted"
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
