# RESULTADO_005 — Ampliación del §23 (Reglamento de Extranjería), 4 lotes

Ejecutado el **2026-08-16**. Estado: **completado**. Cargador y verificación global en
**`RESULTADO_014.md`**.

## Comprobación previa de meta

EXTR quedó registrada en el PROMPT_004 con `temas: null`, así que `verificar-meta` solo exige
`meta.tema` no vacío. Comprobado además que los cuatro lotes traen **la misma `materia`, `norma` y
`referencia_boe`** que la 1ª tanda (`rd-1155-2024-reglamento-extranjeria`, BOE-A-2024-24099): lo
cumplen los siete lotes EXTR.

## Carga (conteos releídos de la base)

| Lote | Rango de ids | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|
| `…-t2-visados.json` | EXTR-050…089 | 40 | 40 | 0 rechazos (6 avisos) | 20 % |
| `…-reagrupacion-arraigo.json` | EXTR-100…149 | 50 | 50 | 0 rechazos, 0 avisos | 26 % |
| `…-trabajo-estudios.json` | EXTR-150…199 | 50 | 50 | 0 rechazos (6 avisos) | 32 % |
| `…-menores-sancionador.json` | EXTR-200…253 | 54 | 54 | 0 rechazos (3 avisos) | 30 % |

Rangos disjuntos, sin colisión con la 1ª tanda ni entre sí. Aserciones post-carga e integridad:
**0 filas** en las cinco.

## Enlaces cruzados

Las aristas internas y las que apuntan a la 1ª tanda EXTR **venían en los propios lotes y todas
resuelven** (204 aristas salientes entre los cuatro).

**Lo que NO se ha podido hacer:** el §3 del encargo remite, para las propuestas hacia **EXT** (LO
4/2000: reagrupación arts. 16-19, arraigo 31.3, VG 31 bis, trata 59/59 bis, trabajo/estudios
52/53/54), a "los RESULTADOS de los generadores". **Esos ficheros no están en el repo**, así que no
hay lista de pares origen→destino que resolver y no me los invento. Es el mismo caso que los enlaces
a ASI del PROMPT_001. Si Cowork manda los pares, se insertan en un minuto con
`enlaces-cruzados.mjs`.

## Cobertura

Con estos cuatro lotes EXTR pasa de 47 a 241 conceptos. El cierre (PROMPT_006) lo lleva a **345**.
