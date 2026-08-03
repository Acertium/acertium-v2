"use client";

// Botón de "Mejorar esta pregunta" — reutilizable en TODAS las preguntas y
// formatos (práctica, simulacro examen, simulacro revisión y lo que venga). El
// tono es colaborativo, no de soporte: el usuario nos ayuda a afinar el temario,
// no "reporta una incidencia". Cuanto más se sienta parte, más cuida el
// contenido con nosotros.
//
// `variant`:
//   · "icono" (por defecto): botón redondo con la banderita, para la cabecera de
//     la pregunta (junto al enunciado).
//   · "enlace": enlace con texto "Mejorar esta pregunta", para la revisión del
//     simulacro, donde conviene que se vea claro.

import { useState, useTransition } from "react";
import { accionReportar } from "@/lib/reporte-actions";
import type { MotivoReporte } from "@/lib/cerebro";

const bordeSuave = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

const MOTIVOS: { valor: MotivoReporte; etiqueta: string }[] = [
  { valor: "dato_incorrecto", etiqueta: "Hay un dato incorrecto" },
  { valor: "opcion_mala", etiqueta: "Una opción está mal planteada" },
  { valor: "fuente_erronea", etiqueta: "La fuente no cuadra" },
  { valor: "otro", etiqueta: "Otra cosa" },
];

function BanderaIcono({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

export default function ReporteBoton({
  actividadId,
  conceptoId,
  enunciado,
  variant = "icono",
}: {
  actividadId: string;
  conceptoId: string;
  enunciado: string;
  variant?: "icono" | "enlace";
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
      {variant === "enlace" ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--color-primary-dark)" }}
        >
          <BanderaIcono size={15} />
          Mejorar esta pregunta
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Mejorar esta pregunta"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"
        >
          <BanderaIcono />
        </button>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Mejorar esta pregunta"
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
                  ¡Gracias! Tu aviso nos ayuda a afinar el temario para todos.
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
                <div className="mb-1 flex items-center justify-between">
                  <h2
                    className="text-lg font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Mejorar esta pregunta
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
                <p className="mb-4 text-sm text-muted">
                  ¿Ves algo que no cuadra? Cuéntanoslo y lo revisamos contra la
                  fuente oficial.
                </p>

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
                  placeholder="¿Qué has visto? (opcional)"
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
