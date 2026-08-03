import { useEffect, useState } from "react";

// Devuelve true solo si `cargando` lleva activo más de `retardoMs`. Evita el
// parpadeo del indicador en cargas rápidas (<300ms): si la espera se resuelve
// antes del umbral, nunca se muestra. Limpia el timeout al desmontar y cada vez
// que cambia `cargando`. (Portado de V1; misma especificación de 300 ms.)
export function useRetardoCarga(cargando: boolean, retardoMs = 300) {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (!cargando) {
      setMostrar(false);
      return;
    }
    const t = setTimeout(() => setMostrar(true), retardoMs);
    return () => clearTimeout(t);
  }, [cargando, retardoMs]);

  return mostrar;
}
