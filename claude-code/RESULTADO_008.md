# RESULTADO_008 — No-BOE tanda 2 (CEDH, CIBER, INTEL, ORTO)

Ejecutado el **2026-08-16**. Estado: **completado**, con la segunda pasada del §5 **bloqueada** por
la puerta de meta (ver abajo). Cargador y verificación global en **`RESULTADO_014.md`**.

## Familias registradas

`CEDH` (con BOE principal `BOE-A-1979-24010` y `referencia_fuentes` con el Protocolo nº 11),
`CIBER`, `INTEL`, `ORTO` (las tres sin BOE, con `referencia_fuente`). Las `norma` se tomaron de los
lotes, que son más específicas que las del encargo.

## Carga (conteos releídos de la base)

| Lote | Familia | `tipo_fuente` | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|---|
| `ddhh-cedh.json` | CEDH | oficial (BOE) | 34 | 34 | 0 rechazos (19 avisos) | 29 % |
| `ciber-incibe.json` | CIBER | autoridad | 22 | 22 | 0 rechazos, 0 avisos | 18 % |
| `inteligencia-osint.json` | INTEL | autoridad | 12 | **27** | 0 rechazos, 0 avisos | 26 % |
| `ortografia-rae.json` | ORTO | autoridad | 32 | 32 | 0 rechazos (5 avisos) | 25 % |

INTEL trae 27 preguntas para 12 conceptos (varias por concepto). Todas quedan `verificado`.
Aserciones e integridad: **0 filas** en las cinco.

## Enlaces cruzados

- **CEDH→TORT y CEDH→DUDH: las 5 resuelven** (CEDH-003→TORT-001 y →DUDH-006, CEDH-006→DUDH-010,
  CEDH-010→DUDH-013, CEDH-016→DUDH-009).
- **INTEL→ENC: las 2 resuelven** (INTEL-011→ENC-013, INTEL-007→ENC-009). Posible porque ENC se cargó
  en el PROMPT_004.
- **CEDH→CE (tentativo): NO resuelve.** El lote traía CEDH-003→CE-T2-015 y CEDH-008→CE-T2-024, y
  **esos ids no existen**: la Constitución está cargada con otro esquema (CE-T1-\*, CE-T6-\*,
  CE-TP-\*…). Las dos aristas quedaron sin insertar y salen en el informe del cargador.
- **INTEL↔CIBER y CIBER→CP/LOPD**: el encargo no da pares concretos; no me los invento.

## §4 — El hallazgo del cotejo insensible a tildes: confirmado

Verificado en `nucleo/verificador-cotejo.mjs`: normaliza quitando tildes y pasando a minúsculas, así
que **no puede verificar la corrección de los acentos en sí**. El lote ORTO está construido, como
dice el encargo, con preguntas de **regla** (la correcta es un recorte literal del enunciado de la
regla RAE), no de acentuación de palabra. El modo sensible a tildes es justo lo que implementa el
**PROMPT_009**.

## §5 — Segunda pasada: los lotes existen pero la puerta los rechaza

Aparecieron en `lotes/` dos lotes que cubren exactamente los pendientes del §5, generados después de
escribirse este encargo:

- **`ciber-incibe-2.json`** (7 conceptos): **XSS**, el pendiente de T41. Cita **CCN-CERT**
  (guía CCN-STIC-401, ccn-cert.cni.es) — justo la fuente que el encargo sugería.
- **`ddhh-cedh-2.json`** (15 conceptos): **Protocolos nº 15 y nº 14**, los matices pendientes de T27
  (plazo de admisibilidad de 4 meses, mandato del juez).

**Los dos pasan las puertas de contenido y calidad, y los dos los rechaza la de meta**, con razón:
CIBER solo tiene declarado incibe.es en el registro, y el lote de los Protocolos declara
`norma` = "Protocolos n.º 14 y n.º 15…" con `referencia_boe` = **BOE-A-2021-7554**, distintos de los
de CEDH.

**No los he cargado ni he tocado la puerta para que pasen.** Relajar la barrera que existe
precisamente porque tres lotes se cargaron con el meta equivocado, y para contenido que ningún
encargo pide, no es una decisión mía. Hace falta que Cowork decida:

1. **CIBER**: ¿se amplía su `referencia_fuente` en el registro para admitir CCN-CERT? Es una línea.
2. **CEDH**: ¿los Protocolos son la **misma familia** —y entonces el registro debe declarar la lista
   de instrumentos admitidos y la puerta aceptar cualquiera de ellos como principal— o una **familia
   nueva**? Es la decisión de fondo. Ojo: `CEDH-026/031` que el §5 manda **actualizar** ya están
   cargados; si los Protocolos entran como conceptos nuevos (CEDH-035…049), habrá que decidir si esos
   dos se corrigen o quedan como están.

Queda pendiente también **Crime as a Service** (T41), del que no he visto lote.
