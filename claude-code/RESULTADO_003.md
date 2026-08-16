# RESULTADO_003 — Oleada 3 (UNI, CDPN, CPOL, PJ)

Ejecutado el **2026-08-16**. Estado: **completado**. Cargador y verificación global en
**`RESULTADO_014.md`**.

## Familias registradas

`UNI`, `CDPN`, `CPOL`, `PJ`, con las cadenas exactas de cada lote (coinciden con las del encargo).

## Carga (conteos releídos de la base)

| Lote | Familia | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|
| `orden-int-430-2014-uniformidad.json` | UNI | 50 | 50 | 0 rechazos, 0 avisos | 20 % |
| `rd-49-2024-centros-docentes.json` | CDPN | 44 | 44 | 0 rechazos (36 avisos) | 32 % |
| `rd-555-2011-regimen-electoral-consejo-policia.json` | CPOL | 62 | 62 | 0 rechazos (54 avisos) | 21 % |
| `rd-769-1987-policia-judicial.json` | PJ | 46 | 46 | 0 rechazos (44 avisos) | 2 % |

Aserciones post-carga e integridad: **0 filas** en las cinco.

## Enlaces cruzados — la mayoría no se pudieron resolver

De los enlaces del §3, solo tres grupos traían destino concreto:

- **CDPN-025→SEL-015 y SEL-016** (`desarrolla`): resuelven.
- **PJ-006 y PJ-011→CE art. 126**: resuelven a **CE-T6-018**.
- **PJ-001→LECrim art. 283**: resuelve a **LEC-020**.

A `remision_pendiente` (el artículo existe en el encargo pero no en el cerebro): PJ-007→FCS art. 30 ·
PJ-011→LOPJ arts. 443-446 · PJ-020→LOPJ art. 549 · PJ-004→LECrim art. 288 · CPOL-001→FCS art. 26.

**Sin concretar — hacen falta ids:** UNI-042…050→PPN (divisas por escala), UNI-011→SEL,
UNI-025/026→DGP, CDPN-032/041→SEL, CDPN-020→PPN, CDPN-040/041→DISC, CDPN-018/037→AGE, CPOL-055→LOPJ
(falta artículo), PJ-021/033→MF.

**Un caso que merece atención: `PJ-008→FCS art. 5`.** No es que falte el id: el artículo 5 de la LO
2/1986 está partido en **ocho** conceptos (`FCS-005-1`, `-arm`, `-cop`, `-ded`, `-det`, `-ob`,
`-resp`, `-sec`). Hay que decir a cuál de los ocho apunta.

## Manifiesto

§17→UNI, §18→CDPN, §20→CPOL, §21→PJ marcadas ✓ tras confirmar la inserción.
