// Acertium — pipeline / ¿este módulo se está ejecutando directamente?
//
// Los módulos del núcleo llevan sus self-tests detrás de un guard. El guard era
//   import.meta.url === `file://${process.argv[1]}`
// y en Windows NUNCA se cumple: `import.meta.url` es `file:///C:/…` con la ruta
// escapada y separadores `/`, mientras `process.argv[1]` es `C:\…` con `\`.
// Resultado: `npm run test:motor` salía con código 0 **sin ejecutar una sola
// aserción** — verde falso, anotado en EJECUCIONES el 03/08 y sin arreglar.
//
// `pathToFileURL` hace la conversión bien en los tres sistemas.

import { pathToFileURL } from "url";

export function esEjecucionDirecta(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return metaUrl === pathToFileURL(argv1).href;
}
