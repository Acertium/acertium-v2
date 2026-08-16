"use client";

import { useState, useTransition } from "react";
import {
  accionCerrarReporte,
  accionPromoverActividad,
  accionPromoverFamilia,
  accionRechazarActividad,
} from "./actions";
import type { PendienteFila, ReporteFila } from "@/lib/admin";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

const MOTIVOS: Record<string, string> = {
  dato_incorrecto: "Hay un dato incorrecto",
  opcion_mala: "Una opción está mal planteada",
  fuente_erronea: "La fuente no cuadra",
  otro: "Otra cosa",
};

function Boton({
  children,
  onClick,
  pendiente,
  tono = "normal",
}: {
  children: React.ReactNode;
  onClick: () => void;
  pendiente?: boolean;
  tono?: "normal" | "primario" | "peligro";
}) {
  const estilo =
    tono === "primario"
      ? { background: "var(--color-primary)", color: "#fff", borderColor: "transparent" }
      : tono === "peligro"
        ? { background: "transparent", color: "var(--color-fg)", borderColor: borde, opacity: 0.75 }
        : { background: "var(--color-surface)", color: "var(--color-fg)", borderColor: borde };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pendiente}
      className="min-h-11 rounded-xl border px-4 text-sm font-medium disabled:opacity-50"
      style={estilo}
    >
      {children}
    </button>
  );
}

function MensajeError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p className="mt-2 text-sm" style={{ color: "var(--color-danger, #c0392b)" }}>
      {mensaje}
    </p>
  );
}

// --- Bloque 1: un reporte ---------------------------------------------------

export function TarjetaReporte({ r }: { r: ReporteFila }) {
  const [nota, setNota] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  const cerrar = (estado: string) =>
    empezar(async () => {
      setError(null);
      try {
        await accionCerrarReporte(r.id, estado, nota);
      } catch (e) {
        setError(e instanceof Error ? e.message : "no se pudo guardar");
      }
    });

  return (
    <li
      className="rounded-2xl border p-4"
      style={{ background: "var(--color-surface)", borderColor: borde }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span
          className="rounded-full px-2 py-1 font-medium"
          style={{ background: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
        >
          {MOTIVOS[r.motivo] ?? r.motivo}
        </span>
        <span>{new Date(r.creado).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
        {r.conceptoId && <span className="font-mono">{r.conceptoId}</span>}
      </div>

      <p className="mt-2 text-[15px] leading-snug">
        {r.enunciado ?? <span className="text-muted">(la actividad ya no existe)</span>}
      </p>
      {r.conceptoTitulo && <p className="mt-1 text-sm text-muted">{r.conceptoTitulo}</p>}
      {r.comentario && (
        <p className="mt-2 rounded-xl p-3 text-sm" style={{ background: "var(--color-bg)" }}>
          «{r.comentario}»
        </p>
      )}

      {!abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-3 text-sm font-medium underline underline-offset-4"
        >
          Atender
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota interna (opcional): qué has hecho con este aviso."
            rows={2}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ background: "var(--color-bg)", borderColor: borde }}
          />
          <div className="flex flex-wrap gap-2">
            <Boton tono="primario" pendiente={pendiente} onClick={() => cerrar("corregido")}>
              Corregido
            </Boton>
            <Boton pendiente={pendiente} onClick={() => cerrar("revisado")}>
              Revisado
            </Boton>
            <Boton tono="peligro" pendiente={pendiente} onClick={() => cerrar("descartado")}>
              Descartar
            </Boton>
          </div>
          <MensajeError mensaje={error} />
        </div>
      )}
    </li>
  );
}

// --- Bloque 2: una actividad pendiente de revisión --------------------------

export function TarjetaPendiente({ p }: { p: PendienteFila }) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  const resolver = (accion: (id: string) => Promise<number>) =>
    empezar(async () => {
      setError(null);
      try {
        await accion(p.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "no se pudo actualizar");
      }
    });

  return (
    <li
      className="rounded-2xl border p-4"
      style={{ background: "var(--color-surface)", borderColor: borde }}
    >
      <p className="font-mono text-xs text-muted">{p.conceptoId}</p>
      <p className="mt-1 text-[15px] leading-snug">{p.enunciado}</p>

      <ul className="mt-2 space-y-1 text-sm">
        {p.opciones.map((o) => (
          <li
            key={o}
            className="flex gap-2"
            style={o === p.correcta ? { color: "var(--color-primary-dark)", fontWeight: 600 } : undefined}
          >
            <span aria-hidden>{o === p.correcta ? "✓" : "·"}</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>

      {p.cotejo && (
        <p className="mt-2 rounded-xl p-3 text-sm text-muted" style={{ background: "var(--color-bg)" }}>
          {p.cotejo}
        </p>
      )}
      {p.fuente && <p className="mt-2 text-xs text-muted">{p.fuente}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Boton tono="primario" pendiente={pendiente} onClick={() => resolver(accionPromoverActividad)}>
          Aprobar
        </Boton>
        <Boton tono="peligro" pendiente={pendiente} onClick={() => resolver(accionRechazarActividad)}>
          Rechazar
        </Boton>
      </div>
      <MensajeError mensaje={error} />
    </li>
  );
}

// --- Bloque 2: aprobar una familia entera -----------------------------------

export function BotonFamilia({ familia, cuantas }: { familia: string; cuantas: number }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  if (!confirmando)
    return (
      <Boton onClick={() => setConfirmando(true)}>Aprobar las {cuantas} de {familia}</Boton>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">¿Seguro? Pasarán a servirse a los usuarios.</span>
      <Boton
        tono="primario"
        pendiente={pendiente}
        onClick={() =>
          empezar(async () => {
            setError(null);
            try {
              await accionPromoverFamilia(familia);
            } catch (e) {
              setError(e instanceof Error ? e.message : "no se pudo aprobar");
            }
            setConfirmando(false);
          })
        }
      >
        Sí, aprobar {familia}
      </Boton>
      <Boton onClick={() => setConfirmando(false)}>Cancelar</Boton>
      <MensajeError mensaje={error} />
    </div>
  );
}
