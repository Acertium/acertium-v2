# RESULTADO_004 — Oleada 4 (EXTR, ENC, RGV, VCD, DPSF)

Ejecutado el **2026-08-16**. Estado: **completado**. Cargador y verificación global en
**`RESULTADO_014.md`**.

## Familias registradas

`EXTR` (con `temas: null`, como indicaba el encargo, porque sus siete lotes usan `meta.tema` de los
Temas 10 y 11 con cadenas distintas), `ENC`, `RGV`, `VCD`, `DPSF`. Se usaron las `norma` exactas de
los lotes; las de VCD y DPSF venían abreviadas en el encargo.

## Correcciones de catálogo

- **§16**: era "Aplicación/desarrollo Reglamento procesos selectivos" sin referencia. Ahora
  **Orden INT/632/2024**, `BOE-A-2024-12811`, familia DPSF.
- **§51**: le faltaba la referencia; añadida `BOE-A-1999-1826`, familia RGV.

Ambas eran **necesarias antes de cargar**, no cosméticas: `marcarCobertura()` localiza la fila por su
`referencia_boe`, y sin ella no habría marcado nada.

## Carga (conteos releídos de la base)

| Lote | Familia | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|
| `rd-1155-2024-reglamento-extranjeria.json` | EXTR | 47 | 47 | 0 rechazos (7 avisos) | 28 % |
| `orden-pci-487-2019-…-ciberseguridad.json` | ENC | 34 | 34 | 0 rechazos, 0 avisos | 24 % |
| `rd-2822-1998-vehiculos-prioritarios.json` | RGV | 24 | 24 | 0 rechazos, 0 avisos | 29 % |
| `orden-int-2573-2015-…-detenidos.json` | VCD | 41 | 41 | 0 rechazos, 0 avisos | 27 % |
| `orden-int-632-2024-desarrollo-selectivos.json` | DPSF | 50 | 50 | 0 rechazos (47 avisos) | 0 % |

La nota técnica del encargo se confirma: ENC y VCD usan nombres de sección en `articulo` (no "art.
N") y `verificar-lote` los trata bien como clave de `fuentes`.

Aserciones post-carga e integridad: **0 filas** en las cinco.

## Enlaces cruzados

- **EXTR→EXT (`desarrolla`): las 10 aristas resuelven.**
- **ENC→IC (`remite`): las 2 resuelven** (ENC-021 y ENC-009 → IC-006).
- **RGV→TRAF: las 5 resuelven.** El encargo no fijaba tipo; van como **`remite`**, que es el tipo
  objetivo "el texto de A cita a B" (`docs/004`), porque son dos reglamentos hermanos y ninguno
  desarrolla al otro. Si Cowork prefiere otro tipo, se cambia.
- **DPSF→SEL: las 9 resuelven**, como **`desarrolla`**: la Orden INT/632/2024 es literalmente la
  norma de desarrollo del RD 853/2022.
- **VCD-001→LEC-022** venía embebida en el lote y resuelve.

**Sin concretar:** VCD→FCS y VCD→TRAF ("propuestos", sin ids) y DPSF→PPN (arts. 16.3/19/29 de la LO
9/2015, sin ids de PPN).

## Manifiesto

§16, §23, §34, §51 y §53 marcadas ✓ tras confirmar la inserción. El §23 ya **no** queda como "1ª
tanda ampliable": con los PROMPT_005 y 006 llegó a cobertura completa (ver `RESULTADO_006.md`).
