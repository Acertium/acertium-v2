# Reglamento General de Circulación — procedencia

- **Norma**: Real Decreto 1428/2003, de 21 de noviembre, por el que se aprueba el
  Reglamento General de Circulación.
- **Referencia BOE**: `BOE-A-2003-23514`
- **Fichero**: `BOE-A-2003-23514-consolidado-2026-08-22.xml` (1.142.120 bytes)
- **De dónde sale**: API de datos abiertos del BOE, texto consolidado íntegro.
  `https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2003-23514/texto`
- **Fecha de consulta**: 22/08/2026
- **Cómo se bajó**:
  `node adaptadores/legal-es/generador/extraer-articulos-boe.mjs BOE-A-2003-23514 --guardar <ruta>`
  (tras un proxy, con `NODE_USE_ENV_PROXY=1` delante).

## Qué contiene y por qué esta copia importa

Es el consolidado **con el historial de versiones por artículo**: cada `<bloque>`
lleva una o varias `<version>` con `id_norma`, `fecha_publicacion` y
`fecha_vigencia`. Eso es lo que permite saber no solo *qué* cambió sino *cuándo
empieza a regir*.

Estado en esta captura, a 22/08/2026:

- 174 artículos en vigor.
- **32 versiones futuras**, todas del RD 518/2026 (`BOE-A-2026-13889`, publicado
  el 26/06/2026), que **entran en vigor el 1 de octubre de 2026**.
- De nuestros 4 artículos (67 a 70), el 69 es el único con redacción futura
  pendiente. Los arts. 151 a 158 son nuevos y aún no existen.

Esta captura es la que sirvió para la primera prueba del diff contra una reforma
real; ver `docs/el-vigilante-contra-el-boe.md`.

## Cobertura respecto del corpus

El corpus (`datos/legal-es/boe-600-pn/corpus/seccion-052.json`) solo guarda los
arts. 67-70 —viene del Código 600, que es «[Inclusión parcial]»— y el art. 70
lleva la marca de omisión `[ . . . ]`, por lo que está señalado `parcial: true` y
no se compara.
