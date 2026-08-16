# RESULTADO_006 — Cierre del §23 (Extranjería) + resolución del §11 (MININT)

Ejecutado el **2026-08-16**. Estado: **completado**, con una salvedad en el §11 que conviene leer.
Cargador y verificación global en **`RESULTADO_014.md`**.

## 1. Dos lotes de cierre de EXTR

| Lote | Rango | Conceptos | Actividades | Puertas | Sesgo |
|---|---|---|---|---|---|
| `…-titulo1-residencia.json` | EXTR-260…309 | 50 | 50 | 0 rechazos, 0 avisos | 28 % |
| `…-larga-duracion-final.json` | EXTR-310…363 | 54 | 54 | 0 rechazos (8 avisos) | 30 % |

**EXTR queda en 345 conceptos y 345 preguntas** (7 lotes, Títulos I-XV del RD 1155/2024) — cifra
releída de la base, no del lote. Aserciones e integridad: **0 filas** en las cinco.

## 2. Enlaces cruzados

Las seis aristas del §2 **venían ya en los lotes y todas resuelven**: EXTR-283→EXT-003,
EXTR-305→EXT-004, EXTR-328→EXTR-027, EXTR-342→EXTR-026, EXTR-354→EXTR-026, EXTR-353→EXT-024 y
EXT-004→EXTR-363. Se reafirmaron desde `enlaces-cruzados.mjs` para dejar constancia de que resuelven;
ninguna quedó pendiente.

## 3. §11 — hecho, pero con una salvedad de honestidad

Aplicado lo que pedía el encargo en `00-indice.md`, fila 11: Referencia → **BOE-A-2024-3793**,
Familia → **MININT**, Estado → **✓** con la nota de que es el RD 207/2024 y deroga el RD 734/2020.
El §11 sale de "A revisar", que **queda vacío**, y el resumen se recalculó.

**La salvedad:** el encargo dice "verificado (PDF + BD + BOE)".

- **La parte de base la confirmo yo**: `MININT` son 24 conceptos cuyo `concepto_fuente` dice
  `norma` = "Real Decreto 207/2024, por el que se desarrolla la estructura orgánica básica del
  Ministerio del Interior" y `referencia_boe` = `BOE-A-2024-3793`. Una sola norma, una sola
  referencia.
- **La parte del PDF NO la he verificado.** No hay `pdftotext`/poppler en esta máquina y mi intento
  de descomprimir los streams del PDF solo devolvió datos de subconjuntos de fuente, no texto. Así
  que la afirmación "el PDF de §11 es el RD 207/2024" descansa en la comprobación de Cowork, no en
  la mía. Lo digo porque el cambio marca ✓ una norma del corpus: si esa premisa fuera falsa, el §11
  quedaría dado por cubierto sin estarlo.

Sobre la nota opcional del encargo: MININT son **24 conceptos de un RD de 33 páginas**, extracción
enfocada. Anotado en la propia sección del índice como ampliable.

## Cobertura del corpus

Con este encargo el **corpus BOE-600 llega al 100 %: 52 de 52 normas, 0 pendientes, 0 a revisar.**
