// Indicadores de carga de marca de Acertium (portados de V1). FUENTE ÚNICA del
// SVG: no debe quedar ningún spinner suelto fuera de aquí. Dos gestos con la
// misma marca (diana concéntrica), el verde vía var(--color-primary) para que se
// adapte a claro/oscuro:
//
//   · SpinnerTrazo  → el check se DIBUJA en bucle. Para PantallaCarga (carga de
//     pantalla completa en la navegación). Comunica "preparando".
//   · SpinnerOrbita → un aro GIRA alrededor de la diana quieta, indeterminado.
//     Para indicadores inline (botones, "Siguiente"). El aro girando comunica
//     espera sin el matiz de "hecho" del check.
//
// Las animaciones y prefers-reduced-motion viven en app/globals.css
// (.trazo-check / .orbita-arco / @media reduce). Ambos aceptan `size` (px).

export function SpinnerTrazo({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="status"
      aria-label="Cargando"
    >
      <circle cx="20" cy="20" r="17" stroke="var(--color-primary)" strokeWidth="2.4" opacity="0.32" />
      <circle cx="20" cy="20" r="9.5" stroke="var(--color-primary)" strokeWidth="2.4" opacity="0.32" />
      <path
        className="trazo-check"
        d="M13.5 20.5L18 25L27 15"
        pathLength={1}
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SpinnerOrbita({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="status"
      aria-label="Cargando"
      className="spinner-orbita"
      style={{ display: "inline-block", verticalAlign: "-0.125em" }}
    >
      <circle cx="20" cy="20" r="13" stroke="var(--color-primary)" strokeWidth="2.8" opacity="0.25" />
      <path
        d="M14.5 20.5L18.2 24L26 16"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        className="orbita-arco"
        d="M20 4 A16 16 0 0 1 36 20"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
