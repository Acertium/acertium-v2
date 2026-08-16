# PROMPT_006 — Cierre del §23 (Extranjería) + resolución del §11 (MININT)

Ejecuta DESPUÉS de PROMPT_005. Revisa `git status`/`git diff`. Sigue `CLAUDE.md`.
Al terminar: commit, push a `main`, escribe `RESULTADO_006.md`, registra en `EJECUCIONES.md`.
NUNCA leas `.env`.

## 1. Cargar 2 lotes de cierre de EXTR (familia ya registrada por PROMPT_004)
Mismo `meta` que la 1ª tanda (materia/norma/referencia_boe BOE-A-2024-24099). Rangos de id disjuntos.
- `lotes/rd-1155-2024-extranjeria-titulo1-residencia.json` — EXTR-260..309, 50 conceptos (Título I arts. 3,8,9,10,12,14,17,18,21; estancia 50; residencia 62-64; documentación entrada 90-99).
- `lotes/rd-1155-2024-extranjeria-larga-duracion-final.json` — EXTR-310..363, 54 conceptos (transfronterizos 156-158; menores 159-163; larga duración 177-189; modificación 190-192; disp. comunes 193-196; extinción 200-202; documentación 205-213).

Flujo estándar (3 puertas + `cargar.mjs`) + `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas).
Con esto EXTR queda en ~345 conceptos (cobertura prácticamente íntegra del RD 1155/2024, Títulos I-XV).

## 2. Enlaces cruzados (tras cargar; resuelve ids o `remision_pendiente`)
- Título1/residencia: EXTR-283→EXT-003 (remite) · EXTR-305→EXT-004 (remite). Resto ya intra-lote y a 1ª tanda EXTR.
- Larga duración/final: EXTR-328→EXTR-027 · EXTR-342/354→EXTR-026 · EXTR-353→EXT-024 · EXT-004→EXTR-363. (Ya vienen en los lotes; verifica que resuelven.)

## 3. Resolución del §11 (cierra el ⚠ del índice)
**Verificado (PDF + BD + BOE):** el PDF `11-estructura-organica-ministerio-interior.pdf` es el **RD 207/2024** (BOE-A-2024-3793), que **deroga el RD 734/2020** y desarrolla la estructura orgánica básica del Ministerio del Interior. Es EXACTAMENTE la norma de la que ya se cargó la familia **MININT** (24 conceptos, source BOE-A-2024-3793). Por tanto el §11 YA está cubierto; extraer el RD 734/2020 (derogado) sería un error.

Acción en `datos/legal-es/boe-600-pn/00-indice.md`, fila 11:
- Referencia BOE → **BOE-A-2024-3793**
- Familia → **MININT**
- Estado → **✓** (con nota: "= RD 207/2024, misma norma que MININT; deroga el RD 734/2020; ya cargada")
- Quita el §11 de la sección "A revisar (⚠)" y recalcula la línea de resumen (una norma menos pendiente/a revisar).

(Opcional, no urgente: MININT son 24 conceptos de un RD de 33 págs — extracción enfocada; suficiente para Tema 7, ampliable si se quiere más granularidad del organigrama.)

## 4. Limpieza
Borra TODOS los `_ELIMINAR_*` que queden en el repo (raíz, `adaptadores/legal-es/generador/` y `.../generador/lotes/`).
