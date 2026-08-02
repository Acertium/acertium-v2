export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <svg
        width="220"
        height="60"
        viewBox="0 0 240 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Acertium"
        role="img"
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
        />
        <circle
          cx="32"
          cy="32"
          r="16"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          opacity="0.4"
        />
        <path
          d="M23 32 L29 38 L42 24"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="76"
          y="42"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="28"
          letterSpacing="-0.6"
          fill="var(--color-primary-dark)"
        >
          Acertium
        </text>
      </svg>

      <p className="text-lg text-fg">
        Tu profesor con IA para la oposición. Practica lo que necesitas, mide tu
        absorción real y estudia con fuente verificada.
      </p>
      <p className="text-sm text-muted">
        Estamos construyendo la nueva Acertium. Llega pronto.
      </p>
      <a
        href="/practicar"
        className="rounded-xl px-5 py-3 text-[15px] font-medium"
        style={{ background: "var(--color-primary)", color: "#fff" }}
      >
        Probar una pregunta
      </a>
    </main>
  );
}
