"use client";

import { useState, useTransition, useRef, type CSSProperties } from "react";
import { accionResponder, accionSiguiente } from "./actions";
import type { ActividadPublica, Resultado } from "@/lib/cerebro";

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
    <div>
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--color-surface)", borderColor: "color-mix(in srgb, var(--color-fg) 12%, transparent)" }}
      >
        <p className="mb-4 text-base leading-relaxed">{actividad.enunciado}</p>

        <div className="flex flex-col gap-2">
          {opciones.map((op, i) => {
            const esElegido = elegido === i;
            const esCorrecta = resultado && resultado.correctaIndice === i;
            const esFallo = resultado && esElegido && !resultado.acierto;
            let estilo: CSSProperties = {
              borderColor: "color-mix(in srgb, var(--color-fg) 15%, transparent)",
            };
            if (esCorrecta)
              estilo = { background: "var(--color-success-bg)", borderColor: "var(--color-success)", color: "var(--color-success)" };
            else if (esFallo)
              estilo = { background: "var(--color-danger-bg)", borderColor: "var(--color-danger)", color: "var(--color-danger-fg)" };
            return (
              <button
                key={i}
                onClick={() => responder(i)}
                disabled={!!resultado || pending}
                className="rounded-xl border px-4 py-3 text-left text-[15px] transition-colors disabled:cursor-default"
                style={estilo}
              >
                {op}
              </button>
            );
          })}
        </div>
      </div>

      {resultado && (
        <div className="mt-4 rounded-2xl border p-5" style={{ background: "var(--color-surface)", borderColor: "color-mix(in srgb, var(--color-fg) 12%, transparent)" }}>
          <p className="mb-2 font-medium" style={{ color: resultado.acierto ? "var(--color-success)" : "var(--color-danger)" }}>
            {resultado.acierto ? "Correcto." : `Era: ${resultado.correcta ?? "—"}.`}
          </p>

          {resultado.explicacion && (
            <p className="text-[15px] leading-relaxed">{resultado.explicacion}</p>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-sm" style={{ color: "var(--color-primary-dark)" }}>
              Ver fuente{resultado.articulo ? ` · ${resultado.articulo}` : ""}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">«{resultado.cotejo}»</p>
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
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--color-fg) 8%, transparent)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(resultado.absorcion * 100)}%`, background: "var(--color-primary)" }} />
            </div>
          </div>

          <button
            onClick={siguiente}
            disabled={pending}
            className="mt-5 rounded-xl px-4 py-2.5 text-[15px] font-medium disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            {pending ? "…" : "Siguiente"}
          </button>
        </div>
      )}
    </div>
  );
}
