"use client";

import { useState, useTransition, useRef, type CSSProperties } from "react";
import { accionResponder, accionSiguiente } from "./actions";
import { SpinnerOrbita } from "@/components/spinners";
import ReporteBoton from "@/components/reporte-boton";
import { useRetardoCarga } from "@/hooks/useRetardoCarga";
import type { ActividadPublica, Resultado } from "@/lib/cerebro";

const borde = "color-mix(in srgb, var(--color-fg) 15%, transparent)";
const bordeSuave = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

export default function PracticaRunner({
  inicial,
}: {
  inicial: ActividadPublica;
}) {
  const [actividad, setActividad] = useState<ActividadPublica>(inicial);
  const [elegido, setElegido] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [pending, start] = useTransition();
  // El spinner de "Siguiente" solo aparece si la carga supera 300ms (anti-parpadeo,
  // misma especificación que la pantalla de carga). En cargas rápidas no se ve.
  const mostrarSpinner = useRetardoCarga(pending);
  const inicioRef = useRef<number>(Date.now());

  function responder(indice: number) {
    if (resultado || pending) return;
    setElegido(indice);
    const ms = Date.now() - inicioRef.current;
    const texto = actividad.opciones?.[indice] ?? "";
    start(async () => {
      const r = await accionResponder(actividad.id, texto, ms);
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
          const esCorrecta = resultado && op === resultado.correcta;
          const esFallo = resultado && esElegido && !resultado.acierto;
          // Marca INSTANTÁNEA al tocar: mientras el servidor corrige, la opción
          // elegida se resalta ya (sin esperar a la respuesta). Evita la sensación
          // de que "tarda en marcar".
          const esPendiente = esElegido && !resultado;
          let estilo: CSSProperties = {
            background: "var(--color-surface)",
            borderColor: borde,
          };
          if (esPendiente)
            estilo = {
              background: "var(--color-primary-soft)",
              borderColor: "var(--color-primary)",
              color: "var(--color-primary-dark)",
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

      {/* Indicador de "comprobando" solo si la verificación tarda >300ms; en las
          respuestas rápidas no llega a verse (no parpadea). */}
      {!resultado && mostrarSpinner && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <SpinnerOrbita size={16} />
          Comprobando…
        </div>
      )}

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
            {resultado.acierto ? "Correcto." : "Incorrecto."}
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
            {mostrarSpinner ? <SpinnerOrbita size={20} /> : "Siguiente"}
          </button>
        </div>
      )}
    </div>
  );
}

