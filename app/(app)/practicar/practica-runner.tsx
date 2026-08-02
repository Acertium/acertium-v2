"use client";

import { useState, useTransition, useRef, type CSSProperties } from "react";
import { accionResponder, accionSiguiente, accionReportar } from "./actions";
import type { ActividadPublica, Resultado, MotivoReporte } from "@/lib/cerebro";

const borde = "color-mix(in srgb, var(--color-fg) 15%, transparent)";
const bordeSuave = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

const MOTIVOS: { valor: MotivoReporte; etiqueta: string }[] = [
  { valor: "dato_incorrecto", etiqueta: "Dato incorrecto" },
  { valor: "opcion_mala", etiqueta: "Opción mal planteada" },
  { valor: "fuente_erronea", etiqueta: "Fuente errónea" },
  { valor: "otro", etiqueta: "Otro" },
];

export default function PracticaRunner({
  inicial,
}: {
  inicial: ActividadPublica;
}) {
  const [actividad, setActividad] = useState<ActividadPublica>(inicial);
  const [elegido, setElegido] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [pending, start] = useTransition();
  const inicioRef = useRef<number>(Date.now());

  function responder(indice: number) {
    if (resultado || pending) return;
    setElegido(indice);
    const ms = Date.now() - inicioRef.current;
    start(async () => {
      const r = await accionResponder(actividad.id, indice, ms);
      setResultado(r);
    });
  }

  function siguiente() {
    start(async () => {
      const a = await accionSiguiente();
      if (a) {
        setActividad(a);
        setElegido(null);
        setResultado(null);
        inicioRef.current = Date.now();
      }
    });
  }

  const opciones = actividad.opciones ?? [];

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      {/* Enunciado + reporte */}
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-lg font-medium leading-relaxed">
          {actividad.enunciado}
        </p>
        <ReporteBoton
          actividadId={actividad.id}
          conceptoId={actividad.concepto_id}
          enunciado={actividad.enunciado}
        />
      </div>

      {/* Opciones: botones grandes apilados */}
      <div className="mt-6 flex flex-col gap-3">
        {opciones.map((op, i) => {
          const esElegido = elegido === i;
          const esCorrecta = resultado && resultado.correctaIndice === i;
          const esFallo = resultado && esElegido && !resultado.acierto;
          let estilo: CSSProperties = {
            background: "var(--color-surface)",
            borderColor: borde,
          };
          if (esCorrecta)
            estilo = {
              background: "var(--color-success-bg)",
              borderColor: "var(--color-success)",
              color: "var(--color-success)",
            };
          else if (esFallo)
            estilo = {
              background: "var(--color-danger-bg)",
              borderColor: "var(--color-danger)",
              color: "var(--color-danger-fg)",
            };
          return (
            <button
              key={i}
              onClick={() => responder(i)}
              disabled={!!resultado || pending}
              className="flex min-h-14 w-full items-center rounded-2xl border px-4 py-3 text-left text-base leading-snug transition-colors disabled:cursor-default"
              style={estilo}
            >
              {op}
            </button>
          );
        })}
      </div>

      {/* Corrección + explicación + fuente */}
      {resultado && (
        <div
          className="mt-6 rounded-2xl border p-5"
          style={{ background: "var(--color-surface)", borderColor: bordeSuave }}
        >
          <p
            className="mb-2 text-base font-semibold"
            style={{
              color: resultado.acierto
                ? "var(--color-success)"
                : "var(--color-danger)",
            }}
          >
            {resultado.acierto
              ? "Correcto."
              : `Era: ${resultado.correcta ?? "—"}.`}
          </p>

          {resultado.explicacion && (
            <p className="text-[15px] leading-relaxed">{resultado.explicacion}</p>
          )}

          <details className="mt-3">
            <summary
              className="cursor-pointer text-sm"
              style={{ color: "var(--color-primary-dark)" }}
            >
              Ver fuente{resultado.articulo ? ` · ${resultado.articulo}` : ""}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              «{resultado.cotejo}»
            </p>
            {resultado.boeUrl && (
              <a
                href={resultado.boeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm underline"
                style={{ color: "var(--color-primary-dark)" }}
              >
                Abrir en el BOE ↗
              </a>
            )}
          </details>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>{resultado.conceptoTitulo}</span>
              <span>{Math.round(resultado.absorcion * 100)}% absorción</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{
                background: "color-mix(in srgb, var(--color-fg) 8%, transparent)",
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(resultado.absorcion * 100)}%`,
                  background: "var(--color-primary)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Botón Siguiente, anclado abajo */}
      {resultado && (
        <div className="mt-auto pt-6">
          <button
            onClick={siguiente}
            disabled={pending}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl text-base font-medium disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            {pending ? "…" : "Siguiente"}
          </button>
        </div>
      )}
    </div>
  );
}

function ReporteBoton({
  actividadId,
  conceptoId,
  enunciado,
}: {
  actividadId: string;
  conceptoId: string;
  enunciado: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<MotivoReporte | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [pending, start] = useTransition();

  function enviar() {
    if (!motivo || pending) return;
    start(async () => {
      await accionReportar({
        actividadId,
        conceptoId,
        motivo,
        comentario,
        contexto: { enunciado },
      });
      setEnviado(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Reportar un problema con esta pregunta"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 21V4" />
          <path d="M4 4h11l-1.5 4L15 12H4" />
        </svg>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Reportar pregunta"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 -z-10"
            style={{ background: "color-mix(in srgb, #000 45%, transparent)" }}
            tabIndex={-1}
          />
          <div
            className="w-full max-w-xl rounded-t-3xl p-5"
            style={{
              background: "var(--color-bg)",
              paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
            }}
          >
            {enviado ? (
              <div className="py-6 text-center">
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--color-success)" }}
                >
                  Gracias, lo revisaremos.
                </p>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="mt-5 min-h-12 w-full rounded-2xl text-base font-medium"
                  style={{ background: "var(--color-primary)", color: "#fff" }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2
                    className="text-lg font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Reportar un problema
                  </h2>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    onClick={() => setAbierto(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-muted"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  {MOTIVOS.map((m) => {
                    const activo = motivo === m.valor;
                    return (
                      <button
                        key={m.valor}
                        type="button"
                        onClick={() => setMotivo(m.valor)}
                        className="flex min-h-12 w-full items-center rounded-xl border px-4 text-left text-[15px]"
                        style={{
                          background: activo
                            ? "var(--color-primary-soft)"
                            : "var(--color-surface)",
                          borderColor: activo
                            ? "var(--color-primary)"
                            : bordeSuave,
                          color: activo
                            ? "var(--color-primary-dark)"
                            : "var(--color-fg)",
                        }}
                      >
                        {m.etiqueta}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentario (opcional)"
                  rows={3}
                  className="mt-3 w-full rounded-xl border px-4 py-3 text-[15px] outline-none"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: bordeSuave,
                  }}
                />

                <button
                  type="button"
                  onClick={enviar}
                  disabled={!motivo || pending}
                  className="mt-4 min-h-12 w-full rounded-2xl text-base font-medium disabled:opacity-50"
                  style={{ background: "var(--color-primary)", color: "#fff" }}
                >
                  {pending ? "Enviando…" : "Enviar"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
