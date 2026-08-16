# RESULTADO_010 — No-BOE tanda 3 (SOST, DROGA, REDES, GRAM, SO)

Ejecutado el **2026-08-16**. Estado: **completado**, con la segunda pasada de T38 **bloqueada** por
la puerta de meta (ver abajo). Cargador y verificación global en **`RESULTADO_014.md`**.

## Familias registradas

`SOST`, `DROGA`, `REDES`, `GRAM`, `SO`, las cinco sin BOE y con `referencia_fuente`. Las `norma` se
tomaron de los lotes (más detalladas que las del encargo).

## Carga (conteos releídos de la base)

| Lote | Familia | `tipo_fuente` | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|---|
| `sostenible-agenda2030.json` | SOST | oficial | 26 | 26 | 0 rechazos (3 avisos) | 15 % |
| `drogas-oms-oeda.json` | DROGA | oficial | 33 | 33 | 0 rechazos (8 avisos) | 30 % |
| `redes-osi-tcpip.json` | REDES | autoridad | 29 | 29 | 0 rechazos (5 avisos) | 7 % |
| `gramatica-rae.json` | GRAM | autoridad | 33 | 33 | 0 rechazos (5 avisos) | 33 % |
| `sistemas-operativos.json` | SO | autoridad | 30 | 30 | 0 rechazos (3 avisos) | 20 % |

Todas quedan `verificado`. Aserciones e integridad: **0 filas** en las cinco.

## Enlaces cruzados — los 6 resuelven

REDES-015→CIBER-005 (`limita`) · CIBER-009→REDES-017 (`remite`) · GRAM-007→ORTO-010 ·
GRAM-033→ORTO-012 · SO-006→REDES-022 · SO-001→REDES-001. Todos posibles porque CIBER y ORTO se
cargaron antes, en el PROMPT_008.

## §4 — Segundas pasadas

- **T38**: existe `sistemas-operativos-2.json` (14 conceptos: iOS, Android, Windows, macOS, Unix,
  ext4, HFS+) — exactamente lo que pedía el §4. Pasa contenido y calidad, pero **la puerta de meta lo
  rechaza**: cita **IBM**, `docs.redhat.com` y Apple/Monterey, y el registro de SO solo declara
  redhat.com, learn.microsoft.com y support.apple.com. No lo he cargado ni he relajado la puerta para
  contenido que ningún encargo pide: hace falta que Cowork decida si se amplía la
  `referencia_fuente` de SO (una línea en el registro) y entonces entra.
- **T35** (Brundtland e instrumentos de gestión ambiental), **T34** (politoxicomanía/policonsumo y
  más OEDA) y **T36** (cotejo humano de las fuentes GRAM contra las URLs de la RAE): **siguen
  pendientes**, no hay lotes.

**Recordatorio del propio encargo que conviene no perder:** las fuentes de GRAM se tomaron vía
WebSearch porque el fetch a rae.es fue inestable, así que su bloque `fuentes` **necesita cotejo
humano palabra por palabra**. Y los datos de tendencias de DROGA (OEDA 2024) **caducan**: están
marcados como tales en la propia `referencia_fuente` de la familia.
