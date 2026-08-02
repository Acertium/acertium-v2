"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  type CSSProperties,
} from "react";
import { accionCorregir } from "./simulacro-actions";
import type {
  PreguntaSimulacro,
  RespuestaUsuario,
  ResumenSimulacro,
} from "@/lib/simulacro-data";

const borde = "color-mix(in srgb, var(--color-fg) 15%, transparent)";
const bordeSuave = "color-mix(in srgb, var(--color-fg) 12%, transparent)";
const LETRAS = ["A", "B", "C", "D", "E", "F"];

function mmss(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function SimulacroRunner({
  preguntas,
}: {
  preguntas: PreguntaSimulacro[];
}) {
  const N = preguntas.length;
  const [indice, setIndice] = useState(0);
  const [elegidos, setElegidos] = useState<(number | null)[]>(
    () => Array(N).fill(null),
  );
  const [resumen, setResumen] = useState<ResumenSimulacro | null>(null);
  const [pending, start] = useTransition();

  // Cronómetro: arranca al montar, se congela al finalizar.
  const inicioRef = useRef<number>(Date.now());
  const [ahora, setAhora] = useState<number>(Date.now());
  const finalizado = resumen !== null;
  useEffect(() => {
    if (finalizado) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finalizado]);

  // Tiempo por pregunta: acumulado + marca de entrada a la pregunta actual.
  const tiemposRef = useRef<number[]>(Array(N).fill(0));
  const entradaRef = useRef<number>(Date.now());
  function registrarTiempo() {
    const now = Date.now();
    tiemposRef.current[indice] += now - entradaRef.current;
    entradaRef.current = now;
  }
  function irA(nuevo: number) {
    registrarTiempo();
    setIndice(Math.max(0, Math.min(N - 1, nuevo)));
  }

  function elegir(op: number) {
    setElegidos((prev) => {
      const copia = [...prev];
      copia[indice] = copia[indice] === op ? null : op;
      return copia;
    });
  }

  function finalizar() {
    registrarTiempo();
    const respuestas: RespuestaUsuario[] = preguntas.map((p, i) => ({
      actividadId: p.actividadId,
      indiceElegido: elegidos[i],
      tiempoMs: tiemposRef.current[i],
    }));
    start(async () => {
      const r = await accionCorregir(respuestas);
      setResumen(r);
    });
  }

  const sinResponder = elegidos.filter((e) => e === null).length;
  const transcurrido = finalizado
    ? resumen!.duracionMs
    : ahora - inicioRef.current;

  // ------------------------------------------------------------------ RESULTADO
  if (finalizado) {
    return (
      <Resultado
        resumen={resumen!}
        preguntas={preguntas}
        elegidos={elegidos}
      />
    );
  }

  // -------------------------------------------------------------------- EXAMEN
  const p = preguntas[indice];
  const elegido = elegidos[indice];

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      {/* Cabecera: progreso + cronómetro */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">
          Pregunta {indice + 1}/{N}
        </span>
        <span
          className="rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
          style={{
            background: "var(--color-primary-soft)",
            color: "var(--color-primary-dark)",
          }}
          aria-label="Tiempo transcurrido"
        >
          {mmss(transcurrido)}
        </span>
      </div>

      {/* Barra de progreso */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-fg) 8%, transparent)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${((indice + 1) / N) * 100}%`,
            background: "var(--color-primary)",
          }}
        />
      </div>

      {/* Enunciado */}
      <p className="mt-6 text-lg font-medium leading-relaxed">{p.enunciado}</p>

      {/* Opciones */}
      <div className="mt-6 flex flex-col gap-3">
        {p.opciones.map((op, i) => {
          const activo = elegido === i;
          const estilo: CSSProperties = activo
            ? {
                background: "var(--color-primary-soft)",
                borderColor: "var(--color-primary)",
                color: "var(--color-primary-dark)",
              }
            : { background: "var(--color-surface)", borderColor: borde };
          return (
            <button
              key={i}
              type="button"
              onClick={() => elegir(i)}
              className="flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base leading-snug transition-colors"
              style={estilo}
              aria-pressed={activo}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
                style={{
                  borderColor: activo ? "var(--color-primary)" : bordeSuave,
                }}
              >
                {LETRAS[i]}
              </span>
              <span className="flex-1">{op}</span>
            </button>
          );
        })}
      </div>

      {/* Navegación anclada abajo */}
      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            disabled={indice === 0}
            className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border text-base font-medium disabled:opacity-40"
            style={{ background: "var(--color-surface)", borderColor: borde }}
          >
            Atrás
          </button>
          {indice < N - 1 ? (
            <button
              type="button"
              onClick={() => irA(indice + 1)}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl text-base font-medium"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={finalizar}
              disabled={pending}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl text-base font-semibold disabled:opacity-60"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              {pending ? "Corrigiendo…" : "Finalizar"}
            </button>
          )}
        </div>
        {indice === N - 1 && sinResponder > 0 && (
          <p className="mt-3 text-center text-sm text-muted">
            Te quedan {sinResponder} sin responder (contarán como fallo).
          </p>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- RESULTADO
function Resultado({
  resumen,
  preguntas,
  elegidos,
}: {
  resumen: ResumenSimulacro;
  preguntas: PreguntaSimulacro[];
  elegidos: (number | null)[];
}) {
  const detalleDe = new Map(resumen.detalle.map((d) => [d.actividadId, d]));
  const aprobado = resumen.nota >= 5;

  return (
    <div className="py-2">
      {/* Nota grande */}
      <div
        className="rounded-3xl border p-6 text-center"
        style={{ background: "var(--color-surface)", borderColor: borde }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Tu nota
        </p>
        <p
          className="mt-1 text-5xl font-bold tabular-nums"
          style={{
            fontFamily: "var(--font-display)",
            color: aprobado ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {resumen.nota.toFixed(2)}
          <span className="text-2xl text-muted"> / 10</span>
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <span>
            <strong className="text-base">
              {resumen.aciertos}/{resumen.total}
            </strong>{" "}
            <span className="text-muted">aciertos</span>
          </span>
          <span>
            <strong className="text-base tabular-nums">
              {mmss(resumen.duracionMs)}
            </strong>{" "}
            <span className="text-muted">tiempo</span>
          </span>
        </div>
      </div>

      {/* Revisión pregunta a pregunta */}
      <h2
        className="mb-3 mt-8 text-lg font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Revisión
      </h2>
      <ol className="flex flex-col gap-4">
        {preguntas.map((p, i) => {
          const d = detalleDe.get(p.actividadId);
          const elegido = elegidos[i];
          const acierto = d?.acierto ?? false;
          return (
            <li
              key={p.actividadId}
              className="rounded-2xl border p-4"
              style={{
                background: "var(--color-surface)",
                borderColor: acierto
                  ? "var(--color-success)"
                  : "var(--color-danger)",
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-0.5 shrink-0 text-sm font-bold"
                  style={{
                    color: acierto
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                  }}
                >
                  {i + 1}. {acierto ? "✓" : "✗"}
                </span>
                <p className="flex-1 text-[15px] font-medium leading-snug">
                  {p.enunciado}
                </p>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted">Tu respuesta: </span>
                  {elegido !== null && elegido !== undefined ? (
                    <span
                      style={{
                        color: acierto
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                      }}
                    >
                      {LETRAS[elegido]}. {p.opciones[elegido]}
                    </span>
                  ) : (
                    <span className="text-muted">(en blanco)</span>
                  )}
                </p>
                {!acierto && d?.indiceCorrecto !== null && (
                  <p>
                    <span className="text-muted">Correcta: </span>
                    <span style={{ color: "var(--color-success)" }}>
                      {d?.indiceCorrecto !== undefined &&
                      d?.indiceCorrecto !== null
                        ? `${LETRAS[d.indiceCorrecto]}. `
                        : ""}
                      {d?.correcta ?? "—"}
                    </span>
                  </p>
                )}
              </div>

              {d?.explicacion && (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {d.explicacion}
                </p>
              )}
              {d?.boeUrl && (
                <a
                  href={d.boeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm underline"
                  style={{ color: "var(--color-primary-dark)" }}
                >
                  Abrir en el BOE{d.articulo ? ` · ${d.articulo}` : ""} ↗
                </a>
              )}
            </li>
          );
        })}
      </ol>

      {/* Repetir: recarga para un examen nuevo al azar */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 flex min-h-14 w-full items-center justify-center rounded-2xl text-base font-medium"
        style={{ background: "var(--color-primary)", color: "#fff" }}
      >
        Repetir
      </button>
    </div>
  );
}
