"use client";

import {
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
} from "react";
import { accionPreguntarProfesor } from "./profesor-actions";
import type { RespuestaProfesor } from "@/lib/profesor-data";

type Mensaje =
  | { de: "tu"; texto: string }
  | { de: "profesor"; texto: string; tarjetas?: RespuestaProfesor[] };

const MENSAJES_EJEMPLO: Mensaje[] = [
  {
    de: "profesor",
    texto:
      "Hola. Soy tu profesor. Pregúntame sobre el temario y te enseño lo que dice la normativa.",
  },
];

const superficie = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

export default function ProfesorFab() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>(MENSAJES_EJEMPLO);
  const [texto, setTexto] = useState("");
  const [pending, start] = useTransition();

  function enviar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || pending) return;
    setMensajes((m) => [...m, { de: "tu", texto: t }]);
    setTexto("");
    start(async () => {
      const res = await accionPreguntarProfesor(t);
      setMensajes((m) =>
        res.length === 0
          ? [
              ...m,
              {
                de: "profesor",
                texto:
                  "No he encontrado nada sobre eso en el temario; prueba con otras palabras.",
              },
            ]
          : [
              ...m,
              {
                de: "profesor",
                texto: "Esto es lo que dice la normativa:",
                tarjetas: res,
              },
            ],
      );
    });
  }

  const fabStyle: CSSProperties = {
    background: "var(--color-primary)",
    color: "#fff",
    bottom: "calc(84px + env(safe-area-inset-bottom))",
    boxShadow: "0 6px 20px color-mix(in srgb, var(--color-fg) 30%, transparent)",
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir el Profesor"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full"
        style={fabStyle}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 9 12 4 2 9l10 5 10-5Z" />
          <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11" />
          <path d="M22 9v5" />
        </svg>
      </button>

      {/* Overlay del chat */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Profesor"
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
            className="mt-auto flex h-[92dvh] flex-col overflow-hidden rounded-t-3xl"
            style={{ background: "var(--color-bg)" }}
          >
            {/* Cabecera */}
            <header
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: superficie }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "var(--color-primary-soft)" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 9 12 4 2 9l10 5 10-5Z" />
                    <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11" />
                  </svg>
                </span>
                <div>
                  <p
                    className="text-base font-semibold leading-none"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Profesor
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Respuestas basadas en el temario verificado
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setAbierto(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-muted"
              >
                ✕
              </button>
            </header>

            {/* Mensajes */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {mensajes.map((m, i) =>
                m.de === "tu" ? (
                  <div
                    key={i}
                    className="ml-auto max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed"
                    style={{ background: "var(--color-primary)", color: "#fff" }}
                  >
                    {m.texto}
                  </div>
                ) : (
                  <div key={i} className="mr-auto max-w-[92%] space-y-2">
                    <div
                      className="w-fit rounded-2xl rounded-bl-md px-4 py-2.5 text-[15px] leading-relaxed"
                      style={{
                        background: "var(--color-surface)",
                        border: `1px solid ${superficie}`,
                      }}
                    >
                      {m.texto}
                    </div>
                    {m.tarjetas?.map((t) => (
                      <article
                        key={t.conceptoId}
                        className="rounded-2xl border p-4"
                        style={{
                          background: "var(--color-surface)",
                          borderColor: superficie,
                        }}
                      >
                        <h3
                          className="text-[15px] font-semibold leading-snug"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {t.titulo}
                        </h3>
                        {t.explicacion && (
                          <p className="mt-1.5 text-[15px] leading-relaxed">
                            {t.explicacion}
                          </p>
                        )}
                        {(t.articulo || t.boeUrl) && (
                          <p className="mt-2 text-sm text-muted">
                            Fuente: {t.articulo ?? "normativa"}
                            {t.boeUrl && (
                              <>
                                {" · "}
                                <a
                                  href={t.boeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                  style={{ color: "var(--color-primary-dark)" }}
                                >
                                  Abrir en el BOE ↗
                                </a>
                              </>
                            )}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ),
              )}

              {pending && (
                <div
                  className="mr-auto w-fit rounded-2xl rounded-bl-md px-4 py-2.5 text-[15px] text-muted"
                  style={{
                    background: "var(--color-surface)",
                    border: `1px solid ${superficie}`,
                  }}
                >
                  Buscando en el temario…
                </div>
              )}
            </div>

            {/* Entrada */}
            <form
              onSubmit={enviar}
              className="flex items-center gap-2 border-t px-4 py-3"
              style={{
                borderColor: superficie,
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tu duda…"
                className="min-h-12 flex-1 rounded-full border px-4 text-[15px] outline-none"
                style={{
                  background: "var(--color-surface)",
                  borderColor: superficie,
                }}
              />
              <button
                type="submit"
                aria-label="Enviar"
                disabled={pending}
                className="flex h-12 w-12 items-center justify-center rounded-full disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "#fff" }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
