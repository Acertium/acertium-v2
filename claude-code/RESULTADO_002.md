# RESULTADO_002 — Oleada 2 (PRLP, PRLAGE, RDP, FE)

Ejecutado el **2026-08-16**. Estado: **completado**. El detalle del cargador y la verificación global
está en **`RESULTADO_014.md`**; aquí va lo propio de este encargo.

> Aviso importante: este encargo se ejecutó **dos veces**. La primera, con el cargador viejo, emitió
> el SQL y marcó ✓ en el índice **sin que nada entrara en la base**. Ese falso positivo es el que
> detectó Cowork y motivó el PROMPT_014. La segunda vez, con el cargador arreglado, entró de verdad.

## Familias registradas

`PRLP`, `PRLAGE`, `RDP`, `FE` en `registro-materias.json`. **Dos `norma` del encargo no coincidían
literalmente con las de los lotes** y la puerta compara cadena exacta, así que se usaron las de los
lotes (que es lo que se carga):

- PRLAGE: el lote dice "Real Decreto 67/2010, **de 29 de enero**, de adaptación…"
- FE: el lote dice "…Reglamento (UE) 2017/1939 del Consejo, **de 12 de octubre de 2017**, por el que…"

La referencia BOE, que es el ancla real, coincide en ambos casos.

## Corrección del §7

Confirmado: `BOE-A-2021-10957` es la **LO 9/2021 de la Fiscalía Europea**, no la Guardia Europea de
Fronteras. Lote renombrado con `git mv` a `lo-9-2021-fiscalia-europea.json` y fila 7 del índice
corregida, dejando anotado que el nombre del PDF (`07-lo-9-2021-reglamento-ue-fronteras.pdf`) es el
equivocado.

## Carga (conteos releídos de la base)

| Lote | Familia | Conceptos | Actividades | Puertas | Sesgo de longitud |
|---|---|---|---|---|---|
| `rd-2-2006-prl-policia.json` | PRLP | 44 | 44 | 0 rechazos (6 avisos) | 30 % |
| `rd-67-2010-prl-age.json` | PRLAGE | 35 | 35 | 0 rechazos (17 avisos) | 20 % |
| `reglamento-defensor-pueblo.json` | RDP | 15 | 15 | 0 rechazos (3 avisos) | 13 % |
| `lo-9-2021-fiscalia-europea.json` | FE | 30 | 30 | 0 rechazos, 0 avisos | 0 % |

Los avisos son "explicación con cifras ajenas a la fuente": informativos, no rechazos. RDP son 15
conceptos porque el PDF del corpus es parcial (Sección V, arts. 19-22), como decía el encargo.

Aserciones post-carga e integridad: **0 filas** en las cinco.

## Enlaces cruzados

- **PRLP→PRL: las 18 aristas resuelven** (incluida PRLP-007→PRL-013 como `limita` y PRLP-038→PRL-031
  como `remite`).
- **PRLAGE→PRL: las 10 aristas resuelven.**
- **RDP→DP: las 4 del lote resuelven** (DP-001, DP-013 ×2, DP-005).
- **FE→CP:** los artículos 305, 305 bis, 306, 308 y 570 bis **no están cargados** en la familia CP,
  así que las 5 aristas van a `remision_pendiente` y se resolverán solas cuando entren.

**Sin concretar (no me invento destinos):** PRLAGE-004→PRLP-\* y PRLAGE-002→AGE-\* no traen id;
FE-003/029→LECrim, FE-013→LOPJ y FE-010/016/022/023→MF no traen artículo.

## Manifiesto

§45, §46, §49 y §7 marcadas ✓ por el hook de `cargar.mjs` **tras confirmar la inserción**.

## Limpieza

Los `_ELIMINAR_*` ya se habían borrado todos en el PROMPT_013.
