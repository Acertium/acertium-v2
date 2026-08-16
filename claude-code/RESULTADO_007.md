# RESULTADO_007 — Piloto no-BOE (Tema 27) + ajuste de meta para fuentes no-BOE

Ejecutado el **2026-08-16**. Estado: **completado**. Cargador y verificación global en
**`RESULTADO_014.md`**.

## 1. Ajuste de `verificar-meta.mjs` — hecho, y más estricto de lo pedido

La puerta exigía `referencia_boe` no vacío. Ahora exige **`referencia_boe` O `referencia_fuente`**,
nunca ninguna de las dos. **Para lotes BOE no se relaja nada**: si hay `referencia_boe`, se compara
exacta como siempre, y si la familia tiene BOE registrado, un meta sin BOE se **rechaza**.

**Un detalle que el encargo no previó:** preveía `referencia_fuentes` (plural, array) como campo
aparte del principal. Pero **los generadores metieron la lista de fuentes dentro de
`referencia_fuente` como array**. La puerta acepta las dos formas y el string suelto.

**Lo que no quise perder.** Esta puerta existe porque tres lotes se cargaron con el meta de la
Constitución. Aceptar cualquier `referencia_fuente` no vacía habría dejado a las familias no-BOE sin
ancla. Solución: el registro declara la fuente canónica de cada familia y la puerta comprueba que
**los dominios de esa fuente aparezcan de verdad en las referencias del lote**. Un lote de la RAE no
puede colarse con el meta de INCIBE. No se comparan las cadenas completas porque el registro guarda
el puntero canónico y el lote la lista detallada de citas con fecha de consulta: nunca serían
iguales.

Ese anclaje ya ha servido: rechazó tres lotes reales (ver `RESULTADO_014.md`, salvedad 1).

**Self-test añadido al fichero, 5/5:** no-BOE citando su fuente PASA · sin ninguna referencia RECHAZA
· citando otra fuente RECHAZA · familia con BOE registrado y meta sin BOE RECHAZA · lote BOE normal
PASA.

**Ajuste colateral en `cargar.mjs`:** con `referencia_boe` vacía, `concepto_fuente.referencia_boe` se
guarda como **NULL**, no como `""`. Con cadena vacía, la aserción (b) —"una familia no puede tener
dos referencias BOE"— contaría `""` como una referencia más.

## 2. Familias registradas

`DUDH` (sin BOE, fuente ONU) y `TORT` (**con** BOE principal `BOE-A-1987-25053` y
`referencia_fuentes` con los tres instrumentos). Se mantiene la decisión de Cowork: TORT es **una
familia compuesta**, no se parte por instrumento.

## 3. Carga (conteos releídos de la base)

| Lote | Familia | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|
| `ddhh-declaracion-universal.json` | DUDH | 39 | 39 | 0 rechazos (4 avisos) | 8 % |
| `ddhh-tortura.json` | TORT | 25 | **26** | 0 rechazos (5 avisos) | 23 % |

TORT tiene 26 preguntas para 25 conceptos: el lote trae dos para un mismo concepto. Es lo que dice el
lote, no un descuadre. Ambos quedan `verificado` (son `oficial`/literal). Aserciones e integridad:
**0 filas** en las cinco.

## 4. Enlaces cruzados

- **TORT-023→DP-001** (`desarrolla`), **TORT-025→DP-013** (`remite`) y **RDP-001→TORT-024**
  (`desarrolla`): **las tres resuelven**. La tercera solo es posible porque RDP se cargó en el
  PROMPT_002.
- **DUDH→CE**: como preveía el encargo, se queda sin hacer. La CE está cargada con otro esquema de
  ids y no hay conceptos del Título I con los que emparejar art. 5→CE 15 o art. 1→CE 10.

## 5. Nota de cobertura

Confirmado lo que apunta el encargo: `00-indice.md` es el manifiesto del corpus **BOE-600** y estos
temas no van ahí. Al reconciliar el índice quedan explícitamente fuera **11 familias no-BOE**
(CEDH, CIBER, DROGA, DUDH, GRAM, INTEL, ORTO, REDES, SO, SOST, TORT). Sigue haciendo falta el
**tracker de cobertura de los temas 27-41** que menciona el encargo; existe
`docs/cobertura-temas-no-boe.md`, pero no se actualiza solo como sí hace el índice BOE.
