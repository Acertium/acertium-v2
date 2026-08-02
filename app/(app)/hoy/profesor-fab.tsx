"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

type Mensaje = { de: "profesor" | "tu"; texto: string };

const MENSAJES_EJEMPLO: Mensaje[] = [
  {
    de: "profesor",
    texto:
      "Hola. Soy tu profesor. Pregúntame lo que no entiendas del temario y te lo explico con calma.",
  },
  {
    de: "tu",
    texto: "¿Qué diferencia hay entre derechos y libertades en la Constitución?",
  },
  {
    de: "profesor",
    texto:
      "Buena pregunta. En cuanto conecte con el temario te lo desgloso artículo por artículo. (Aún estoy en construcción.)",
  },
];

const superficie = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

export default function ProfesorFab() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>(MENSAJES_EJEMPLO);
  const [texto, setTexto] = useState("");

  function enviar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setMensajes((m) => [
      ...m,
      { de: "tu", texto: t },
      {
        de: "profesor",
        texto: "Todavía no puedo responder de verdad, pero pronto lo haré.",
      },
    ]);
    setTexto("");
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
                  <p className="mt-1 text-xs text-muted">Pronto disponible</p>
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
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.de === "tu"
                      ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed"
                      : "mr-auto max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-[15px] leading-relaxed"
                  }
                  style={
                    m.de === "tu"
                      ? { background: "var(--color-primary)", color: "#fff" }
                      : {
                          background: "var(--color-surface)",
                          border: `1px solid ${superficie}`,
                        }
                  }
                >
                  {m.texto}
                </div>
              ))}
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
                className="flex h-12 w-12 items-center justify-center rounded-full"
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
