const borde = "color-mix(in srgb, var(--color-fg) 12%, transparent)";

export default function PerfilPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <header className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Perfil
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tu progreso y tus ajustes. Aún en construcción.
        </p>
      </header>

      {/* Resumen */}
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

      {/* Ajustes placeholder */}
      <ul className="mt-4 space-y-3">
        {["Mi oposición", "Notificaciones", "Suscripción", "Ayuda"].map(
          (item) => (
            <li
              key={item}
              className="flex min-h-12 items-center justify-between rounded-2xl border px-5 py-3"
              style={{ background: "var(--color-surface)", borderColor: borde }}
            >
              <span className="text-[15px] font-medium">{item}</span>
              <span className="text-muted">›</span>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
