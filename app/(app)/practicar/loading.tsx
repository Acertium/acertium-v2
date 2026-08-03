import { PantallaCarga } from "@/components/pantalla-carga";

// Carga de la pantalla de practicar (primera pregunta). `antiParpadeo`: el
// spinner solo aparece si la carga supera 300 ms.
export default function Loading() {
  return <PantallaCarga antiParpadeo />;
}
