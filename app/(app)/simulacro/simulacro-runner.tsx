"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accionCorregir } from "./simulacro-actions";
import ReporteBoton from "@/components/reporte-boton";
import { justificacionAporta } from "@/lib/justificacion";
import {
  PREGUNTAS_MEDIO,
  PREGUNTAS_RAPIDO,
  SEGUNDOS_SIMULACRO,
  SEGUNDOS_MEDIO,
  SEGUNDOS_RAPIDO,
  NOTA_MINIMA,
  type PreguntaSimulacro,
  type RespuestaUsuario,
  type ResumenSimulacro,
} from "@/lib/simulacro-formato";

const borde = "color-mix(in srgb, var(--color-fg) 15%, transparent)";
const bordeSuave = "color-mix(in srgb, var(--color-fg) 12%, transparent)";
const LETRAS = ["A", "B", "C", "D", "E", "F"];

// mm:ss a partir de milisegundos (para el cronómetro en cuenta atrás).
function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type Modo = "completo" | "medio" | "rapido";
type Fase = "intro" | "examen";

export default function SimulacroRunner({
  preguntas,
}: {
  preguntas: PreguntaSimulacro[];
}) {
  const [fase, setFase] = useState<Fase>("intro");
  const [modo, setModo] = useState<Modo>("completo");

  // Subconjunto activo (todas, o las primeras N en modo rápido).
  const [activas, setActivas] = useState<PreguntaSimulacro[]>([]);
  const [indice, setIndice] = useState(0);
  const [elegidos, setElegidos] = useState<(number | null)[]>([]);
  const [resumen, setResumen] = useState<ResumenSimulacro | null>(null);
  const [pending, start] = useTransition();
  const finalizado = resumen !== null;

  const router = useRouter();
  // UI del examen: navegador de preguntas plegable y confirmación de finalizar.
  const [mostrarNav, setMostrarNav] = useState(false);
  const [confirmarFinal, setConfirmarFinal] = useState(false);

  // El examen está "en curso" solo cuando está empezado y sin corregir.
  const enCurso = fase === "examen" && !finalizado;

  // Cronómetro en cuenta atrás. `limiteMsRef` se fija al empezar (según modo);
  // `inicioRef` marca el arranque; `ahora` refresca la pantalla.
  const limiteMsRef = useRef<number>(SEGUNDOS_SIMULACRO * 1000);
  const inicioRef = useRef<number>(0);
  const [ahora, setAhora] = useState<number>(0);

  // Tiempo por pregunta: acumulado + marca de entrada a la pregunta actual.
  const tiemposRef = useRef<number[]>([]);
  const entradaRef = useRef<number>(0);
  const finalizandoRef = useRef<boolean>(false);

  function registrarTiempo() {
    const now = Date.now();
    tiemposRef.current[indice] += now - entradaRef.current;
    entradaRef.current = now;
  }
  function irA(nuevo: number) {
    registrarTiempo();
    setIndice(Math.max(0, Math.min(activas.length - 1, nuevo)));
  }
  function elegir(op: number) {
    setElegidos((prev) => {
      const copia = [...prev];
      copia[indice] = copia[indice] === op ? null : op;
      return copia;
    });
  }

  function empezar() {
    const sel =
      modo === "rapido"
        ? preguntas.slice(0, PREGUNTAS_RAPIDO)
        : modo === "medio"
          ? preguntas.slice(0, PREGUNTAS_MEDIO)
          : preguntas;
    setActivas(sel);
    tiemposRef.current = Array(sel.length).fill(0);
    setElegidos(Array(sel.length).fill(null));
    setIndice(0);
    limiteMsRef.current =
      (modo === "rapido"
        ? SEGUNDOS_RAPIDO
        : modo === "medio"
          ? SEGUNDOS_MEDIO
          : SEGUNDOS_SIMULACRO) * 1000;
    const now = Date.now();
    inicioRef.current = now;
    entradaRef.current = now;
    finalizandoRef.current = false;
    setAhora(now);
    setFase("examen");
  }

  function finalizar() {
    if (finalizandoRef.current) return;
    finalizandoRef.current = true;
    registrarTiempo();
    const respuestas: RespuestaUsuario[] = activas.map((p, i) => ({
      actividadId: p.actividadId,
      textoElegido:
        elegidos[i] !== null && elegidos[i] !== undefined
          ? p.opciones[elegidos[i] as number]
          : null,
      tiempoMs: tiemposRef.current[i] ?? 0,
    }));
    start(async () => {
      const r = await accionCorregir(respuestas);
      setResumen(r);
    });
  }

  // Tick del cronómetro (cada 250 ms para reaccionar cerca del 0).
  useEffect(() => {
    if (fase !== "examen" || finalizado) return;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [fase, finalizado]);

  // Autocorrección al agotarse el tiempo.
  const restante =
    fase === "examen"
      ? Math.max(0, limiteMsRef.current - (ahora - inicioRef.current))
      : limiteMsRef.current;
  useEffect(() => {
    if (fase !== "examen" || finalizado || finalizandoRef.current) return;
    if (limiteMsRef.current - (ahora - inicioRef.current) <= 0) finalizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, fase, finalizado]);

  // Avisa antes de cerrar/recargar la pestaña mientras el examen está en curso,
  // para no perder el simulacro por accidente. La navegación interna (router)
  // no dispara beforeunload, así que "Abandonar" y "Terminar" salen sin aviso.
  useEffect(() => {
    if (!enCurso) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enCurso]);

  // ------------------------------------------------------------------ RESULTADO
  if (finalizado) {
    return <Resultado resumen={resumen!} />;
  }

  // ---------------------------------------------------------------------- INTRO
  if (fase === "intro") {
    return (
      <Intro
        modo={modo}
        setModo={setModo}
        onEmpezar={empezar}
        totalDisponible={preguntas.length}
      />
    );
  }

  // -------------------------------------------------------------------- EXAMEN
  const N = activas.length;
  const p = activas[indice];
  const elegido = elegidos[indice];
  const sinResponder = elegidos.filter((e) => e === null).length;
  const respondidas = N - sinResponder;
  const casiAgotado = restante <= 60_000;
  const primeraBlanco = elegidos.findIndex((e) => e === null);

  // Salir del examen a /hoy con confirmación. router.push no dispara
  // beforeunload, así que basta un confirm nativo.
  function abandonar() {
    if (
      window.confirm(
        "Perderás el simulacro y no se corregirá. ¿Seguro que quieres salir?",
      )
    ) {
      router.push("/hoy");
    }
  }

  // "Revisar": cierra el aviso y salta a la primera pregunta en blanco (si la
  // hay) para que el usuario pueda completarla antes de terminar.
  function revisar() {
    setConfirmarFinal(false);
    if (primeraBlanco >= 0) irA(primeraBlanco);
  }

  // El examen EN CURSO se pinta como capa a pantalla completa por ENCIMA de la
  // barra de navegación inferior (z-50 > z-40), de modo que no se pueda saltar a
  // otra pestaña por error. La intro y los resultados usan el flujo normal.
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--color-bg)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Examen en curso"
    >
      <div className="mx-auto flex h-full w-full max-w-xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {/* Barra superior: solo Abandonar. El mapa de preguntas se abre con el
            botón central del isotipo (entre Atrás y Siguiente). */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={abandonar}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted"
            style={{ background: "var(--color-surface)" }}
          >
            <span aria-hidden="true">←</span> Abandonar
          </button>
        </div>

        {/* Cabecera: cronómetro destacado + progreso */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted">
            Pregunta {indice + 1}/{N}
          </span>
          <span
            className="rounded-full px-4 py-1.5 text-lg font-bold tabular-nums"
            style={{
              background: casiAgotado
                ? "var(--color-danger-bg)"
                : "var(--color-primary-soft)",
              color: casiAgotado
                ? "var(--color-danger-fg)"
                : "var(--color-primary-dark)",
            }}
            aria-label="Tiempo restante"
          >
            {mmss(restante)}
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

        {/* Zona desplazable: enunciado + opciones */}
        <div className="-mx-5 flex-1 overflow-y-auto px-5">
          {/* Enunciado + botón para mejorar la pregunta */}
          <div className="mt-6 flex items-start justify-between gap-3">
            <p className="flex-1 text-lg font-medium leading-relaxed">
              {p.enunciado}
            </p>
            <ReporteBoton
              actividadId={p.actividadId}
              conceptoId={p.conceptoId}
              enunciado={p.enunciado}
            />
          </div>

          {/* Opciones (3 alternativas) */}
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
        </div>

        {/* Navegación anclada abajo + Finalizar siempre disponible */}
        <div className="pt-4">
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
            <button
              type="button"
              onClick={() => setMostrarNav(true)}
              className="flex min-h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                background: "var(--color-surface)",
                borderColor: borde,
                color: "var(--color-primary)",
              }}
              aria-label="Ver el mapa de preguntas"
            >
              <IsotipoAcertium size={26} />
            </button>
            <button
              type="button"
              onClick={() => irA(indice + 1)}
              disabled={indice === N - 1}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl text-base font-medium disabled:opacity-40"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              Siguiente
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmarFinal(true)}
            disabled={pending}
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border text-base font-semibold disabled:opacity-60"
            style={{ borderColor: borde, color: "var(--color-primary-dark)" }}
          >
            {pending ? "Corrigiendo…" : "Finalizar examen"}
          </button>
          {sinResponder > 0 && (
            <p className="mt-2 text-center text-sm text-muted">
              {sinResponder} sin responder (las que dejes en blanco no penalizan).
            </p>
          )}
        </div>
      </div>

      {/* Navegador de preguntas (hoja inferior plegable) */}
      {mostrarNav && (
        <NavegadorPreguntas
          total={N}
          indice={indice}
          elegidos={elegidos}
          onIr={(i) => {
            irA(i);
            setMostrarNav(false);
          }}
          onCerrar={() => setMostrarNav(false)}
        />
      )}

      {/* Confirmación antes de corregir */}
      {confirmarFinal && (
        <div
          className="absolute inset-0 z-20 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar finalización"
          onClick={() => setConfirmarFinal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border p-6"
            style={{ background: "var(--color-surface)", borderColor: borde }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ¿Terminar el simulacro?
            </h2>
            <p className="mt-2 text-base">
              Has respondido <strong>{respondidas}</strong> de {N} ·{" "}
              <strong>{sinResponder}</strong> en blanco.
            </p>
            <p className="mt-2 text-sm text-muted">
              Las preguntas en blanco no penalizan. Solo los errores restan (cada
              2 fallos restan 1 acierto).
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmarFinal(false);
                  finalizar();
                }}
                disabled={pending}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl text-base font-semibold disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "#fff" }}
              >
                {pending ? "Corrigiendo…" : "Terminar y corregir"}
              </button>
              <button
                type="button"
                onClick={revisar}
                className="flex min-h-12 w-full items-center justify-center rounded-2xl border text-base font-medium"
                style={{ borderColor: borde, color: "var(--color-primary-dark)" }}
              >
                {primeraBlanco >= 0 ? "Revisar (ir a una en blanco)" : "Revisar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------- NAVEGADOR DE PREGUNTAS
// Hoja inferior con la cuadrícula 1..N. Cada número muestra su estado:
// respondida (relleno verde), en blanco (contorno) o actual (resaltada).
function NavegadorPreguntas({
  total,
  indice,
  elegidos,
  onIr,
  onCerrar,
}: {
  total: number;
  indice: number;
  elegidos: (number | null)[];
  onIr: (i: number) => void;
  onCerrar: () => void;
}) {
  const sinResponder = elegidos.filter((e) => e === null).length;
  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Mapa de preguntas"
      onClick={onCerrar}
    >
      <div
        className="max-h-[80%] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5"
        style={{ background: "var(--color-surface)", borderColor: borde }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Preguntas
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted"
            aria-label="Cerrar el mapa de preguntas"
          >
            Cerrar
          </button>
        </div>

        {/* Leyenda de estados */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3.5 w-3.5 rounded"
              style={{ background: "var(--color-primary)" }}
            />
            Respondida
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3.5 w-3.5 rounded border"
              style={{ borderColor: borde, background: "var(--color-surface)" }}
            />
            En blanco
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3.5 w-3.5 rounded border-2"
              style={{ borderColor: "var(--color-primary)" }}
            />
            Actual
          </span>
        </div>

        {/* Cuadrícula de números */}
        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Array.from({ length: total }, (_, i) => {
            const respondida = elegidos[i] !== null && elegidos[i] !== undefined;
            const actual = i === indice;
            const estilo: CSSProperties = actual
              ? {
                  background: "var(--color-primary-soft)",
                  border: "2px solid var(--color-primary)",
                  color: "var(--color-primary-dark)",
                }
              : respondida
                ? { background: "var(--color-primary)", color: "#fff" }
                : {
                    background: "var(--color-surface)",
                    border: `1px solid ${borde}`,
                    color: "var(--color-fg)",
                  };
            return (
              <button
                key={i}
                type="button"
                onClick={() => onIr(i)}
                className="flex aspect-square min-h-11 items-center justify-center rounded-xl text-sm font-semibold tabular-nums"
                style={estilo}
                aria-label={`Pregunta ${i + 1}${
                  respondida ? ", respondida" : ", en blanco"
                }${actual ? ", actual" : ""}`}
                aria-current={actual ? "true" : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-muted">
          {sinResponder} en blanco. Las preguntas en blanco{" "}
          <strong>no penalizan</strong>: solo restan los errores (cada 2 fallos
          restan 1 acierto).
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------- INTRO
function Intro({
  modo,
  setModo,
  onEmpezar,
  totalDisponible,
}: {
  modo: Modo;
  setModo: (m: Modo) => void;
  onEmpezar: () => void;
  totalDisponible: number;
}) {
  const rapidoDisponible = totalDisponible >= PREGUNTAS_RAPIDO;
  const medioDisponible = totalDisponible >= PREGUNTAS_MEDIO;
  const opciones: { id: Modo; titulo: string; sub: string; disabled?: boolean }[] =
    [
      {
        id: "rapido",
        titulo: "Rápido",
        sub: `${PREGUNTAS_RAPIDO} preguntas · ${mmss(SEGUNDOS_RAPIDO * 1000)}`,
        disabled: !rapidoDisponible,
      },
      {
        id: "medio",
        titulo: "Medio",
        sub: `${PREGUNTAS_MEDIO} preguntas · ${mmss(SEGUNDOS_MEDIO * 1000)}`,
        disabled: !medioDisponible,
      },
      {
        id: "completo",
        titulo: "Completo",
        sub: `${totalDisponible} preguntas · ${mmss(SEGUNDOS_SIMULACRO * 1000)}`,
      },
    ];

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col py-2">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Simulacro oficial
      </h1>
      <p className="mt-2 text-base text-muted">
        Réplica de la prueba de conocimientos de la Policía Nacional.
      </p>

      {/* Reglas */}
      <ul className="mt-6 flex flex-col gap-2.5">
        {[
          "100 preguntas, 3 opciones cada una",
          "50 minutos de tiempo total",
          "Cada 2 fallos restan 1 acierto",
          "Las que dejes en blanco no penalizan",
          `Mínimo ${NOTA_MINIMA}/10 para seguir en el proceso`,
        ].map((regla) => (
          <li key={regla} className="flex items-start gap-2.5 text-[15px]">
            <span
              className="mt-0.5 shrink-0 font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              ·
            </span>
            <span>{regla}</span>
          </li>
        ))}
      </ul>

      {/* Selección de modo */}
      <div className="mt-6 flex flex-col gap-3">
        {opciones.map((o) => {
          const activo = modo === o.id;
          return (
            <button
              key={o.id}
              type="button"
              disabled={o.disabled}
              onClick={() => setModo(o.id)}
              className="flex min-h-16 w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-40"
              style={{
                background: activo
                  ? "var(--color-primary-soft)"
                  : "var(--color-surface)",
                borderColor: activo ? "var(--color-primary)" : borde,
              }}
              aria-pressed={activo}
            >
              <span>
                <span
                  className="block text-base font-semibold"
                  style={{ color: activo ? "var(--color-primary-dark)" : undefined }}
                >
                  {o.titulo}
                </span>
                <span className="block text-sm text-muted">{o.sub}</span>
              </span>
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                style={{
                  borderColor: activo ? "var(--color-primary)" : bordeSuave,
                  color: "var(--color-primary)",
                }}
              >
                {activo ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onEmpezar}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl text-base font-semibold"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Empezar simulacro
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- RESULTADO
function Resultado({ resumen }: { resumen: ResumenSimulacro }) {
  const supera = resumen.nota >= NOTA_MINIMA;

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
            color: supera ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {resumen.nota.toFixed(2)}
          <span className="text-2xl text-muted"> / 10</span>
        </p>
        <p
          className="mt-2 text-sm font-medium"
          style={{
            color: supera ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {supera
            ? `Supera el mínimo de ${NOTA_MINIMA} para seguir en el proceso`
            : `No llega al mínimo de ${NOTA_MINIMA} para seguir en el proceso`}
        </p>

        {/* Desglose */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Metrica valor={resumen.aciertos} etiqueta="aciertos" color="var(--color-success)" />
          <Metrica valor={resumen.errores} etiqueta="errores" color="var(--color-danger)" />
          <Metrica valor={resumen.blancos} etiqueta="en blanco" />
        </div>
        <p className="mt-4 text-sm text-muted">
          {resumen.total} preguntas · {mmss(resumen.duracionMs)} empleados
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Fórmula oficial: nota = [aciertos − errores/2] × 10 / {resumen.total}.
          Cada 2 fallos restan 1 acierto; las preguntas en blanco no puntúan ni
          penalizan.
        </p>
      </div>

      {/* Revisión pregunta a pregunta */}
      <h2
        className="mb-3 mt-8 text-lg font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Revisión
      </h2>
      <ol className="flex flex-col gap-4">
        {resumen.detalle.map((d, i) => {
          const enBlanco = d.textoElegido === null;
          const color = d.acierto
            ? "var(--color-success)"
            : enBlanco
              ? bordeSuave
              : "var(--color-danger)";
          return (
            <li
              key={d.actividadId}
              className="rounded-2xl border p-4"
              style={{ background: "var(--color-surface)", borderColor: color }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-0.5 shrink-0 text-sm font-bold"
                  style={{ color }}
                >
                  {i + 1}. {d.acierto ? "✓" : enBlanco ? "—" : "✗"}
                </span>
                <p className="flex-1 text-[15px] font-medium leading-snug">
                  {d.enunciado}
                </p>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted">Tu respuesta: </span>
                  {!enBlanco ? (
                    <span
                      style={{
                        color: d.acierto
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                      }}
                    >
                      {d.textoElegido}
                    </span>
                  ) : (
                    <span className="text-muted">(en blanco)</span>
                  )}
                </p>
                {!d.acierto && d.correcta && (
                  <p>
                    <span className="text-muted">Correcta: </span>
                    <span style={{ color: "var(--color-success)" }}>
                      {d.correcta}
                    </span>
                  </p>
                )}
              </div>

              {/* Primero lo que explica ESTA pregunta, después el contexto del
                  concepto: en una corrección se repasan muchas seguidas y la
                  explicación del concepto se repite en cada una de sus preguntas. */}
              {justificacionAporta(d.justificacion) && (
                <p className="mt-3 text-sm font-medium leading-relaxed">
                  {d.justificacion}
                </p>
              )}
              {d.explicacion && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {d.explicacion}
                </p>
              )}
              {d.boeUrl && (
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

              {/* Sin conceptoId no se puede reportar: `concepto_id` tiene FK a
                  `concepto`, así que el envío fallaría. Solo pasa si la
                  actividad ya no existe al corregir (detalle sin `info`). */}
              {d.conceptoId && (
                <div
                  className="mt-3 border-t pt-3"
                  style={{ borderColor: bordeSuave }}
                >
                  <ReporteBoton
                    variant="enlace"
                    actividadId={d.actividadId}
                    conceptoId={d.conceptoId}
                    enunciado={d.enunciado}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Acciones: repetir (examen nuevo al azar) o salir a /hoy sin la barra */}
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/hoy"
          className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border text-base font-medium"
          style={{ background: "var(--color-surface)", borderColor: borde }}
        >
          Salir
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex min-h-14 flex-1 items-center justify-center rounded-2xl text-base font-medium"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Repetir
        </button>
      </div>
    </div>
  );
}

// Isotipo de Acertium (diana concéntrica + check), de marca/assets/acertium-symbol.svg.
// Usa currentColor para heredar el color del botón que lo contiene.
function IsotipoAcertium({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
      <circle
        cx="32"
        cy="32"
        r="16"
        stroke="currentColor"
        strokeWidth="3.5"
        opacity="0.4"
      />
      <path
        d="M23 32 L29 38 L42 24"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Metrica({
  valor,
  etiqueta,
  color,
}: {
  valor: number;
  etiqueta: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-2xl border py-3"
      style={{ borderColor: bordeSuave }}
    >
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: color ?? "var(--color-fg)" }}
      >
        {valor}
      </p>
      <p className="text-xs text-muted">{etiqueta}</p>
    </div>
  );
}
