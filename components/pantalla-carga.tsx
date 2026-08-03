import { SpinnerTrazo } from "@/components/spinners";

// Wrapper centrado que muestra el spinner de marca durante una espera (portado de
// V1). Se usa en los loading.tsx de ruta (navegación) y dentro de pantallas.
// Con `antiParpadeo` aplica la clase `carga-pantalla` (globals.css), que RETRASA
// la aparición 300 ms: si la carga termina antes, el spinner nunca llega a verse
// (evita el flash en navegaciones rápidas ~150-450 ms). Úsalo en los loading.tsx.
export function PantallaCarga({
  minHeight = "60vh",
  antiParpadeo = false,
}: {
  minHeight?: string;
  antiParpadeo?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-center" +
        (antiParpadeo ? " carga-pantalla" : "")
      }
      style={{ minHeight }}
    >
      <SpinnerTrazo />
    </div>
  );
}
