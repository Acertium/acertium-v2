import { resumenHoy, fechaObjetivo, guardarFechaObjetivo } from "@/lib/cerebro";
import FechaExamen from "./fecha-examen";

export const dynamic = "force-dynamic";

const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center rounded-2xl border px-3 py-4"
      style={{ background: "var(--color-surface)", borderColor: borde }}
    >
      <span
        className="text-2xl font-bold"
        style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}
      >
        {valor}
      </span>
      <span className="mt-1 text-center text-xs text-muted">{etiqueta}</span>
    </div>
  );
}

// Guarda o borra la fecha objetivo del opositor. Vive aquí, en el servidor, para
// que el cliente no toque nunca la clave de servicio.
async function guardar(fecha: string | null) {
  "use server";
  return guardarFechaObjetivo(fecha);
}

export default async function PerfilPage() {
  let resumen: Awaited<ReturnType<typeof resumenHoy>> | null = null;
  let fecha: string | null = null;
  try {
    [resumen, fecha] = await Promise.all([resumenHoy(), fechaObjetivo()]);
  } catch {
    resumen = null;
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <header className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Perfil
        </h1>
        <p className="mt-1 text-sm text-muted">Tu progreso y tus ajustes.</p>
      </header>

      {/* Tarjeta de usuario */}
      <section
        className="flex items-center gap-4 rounded-2xl border p-5"
        style={{ background: "var(--color-surface)", borderColor: borde }}
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold"
          style={{
            background: "var(--color-primary-soft)",
            color: "var(--color-primary-dark)",
            fontFamily: "var(--font-display)",
          }}
        >
          O
        </span>
        <div>
          <p
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Opositor
          </p>
          <p className="text-sm text-muted">Policía Nacional</p>
        </div>
      </section>

      {/* Estadísticas reales */}
      {resumen && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-muted">Tu progreso</h2>
          <div className="flex gap-3">
            <Dato
              valor={`${resumen.dominados}/${resumen.totalConceptos}`}
              etiqueta="conceptos dominados"
            />
            <Dato valor={`${resumen.practicados}`} etiqueta="practicados" />
            <Dato
              valor={
                resumen.aciertoPct == null ? "—" : `${resumen.aciertoPct}%`
              }
              etiqueta="acierto"
            />
          </div>
        </section>
      )}

      {/* Ajustes */}
      <ul className="mt-5 space-y-3">
        <FechaExamen
          inicial={fecha}
          diasRestantes={resumen?.diasHastaExamen ?? null}
          guardar={guardar}
        />
        {/* Pendientes de implementar: se dejan como estaban, sin acción. */}
        {["Mi oposición", "Notificaciones", "Ayuda"].map((item) => (
          <li
            key={item}
            className="flex min-h-12 items-center justify-between rounded-2xl border px-5 py-3"
            style={{ background: "var(--color-surface)", borderColor: borde }}
          >
            <span className="text-[15px] font-medium">{item}</span>
            <span className="text-muted">›</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
