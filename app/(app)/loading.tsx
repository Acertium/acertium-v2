import { PantallaCarga } from "@/components/pantalla-carga";

// Fallback de carga en la navegación entre pantallas del área de estudio.
// `antiParpadeo`: el spinner solo aparece si la carga supera 300 ms.
export default function Loading() {
  return <PantallaCarga antiParpadeo />;
}
