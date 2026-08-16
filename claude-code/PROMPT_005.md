# PROMPT_005 — Ampliación del §23 (Reglamento de Extranjería): 4 lotes de continuación

Carga de 4 lotes MÁS de la familia **EXTR** (misma norma RD 1155/2024, BOE-A-2024-24099).
Ejecuta DESPUÉS de PROMPT_004 (que registra EXTR y carga la 1ª tanda EXTR-001..047).
Revisa `git status`/`git diff`. Sigue `CLAUDE.md`. Al terminar: commit, push a `main`, escribe
`RESULTADO_005.md`, registra en `EJECUCIONES.md`. NUNCA leas `.env`.

## Contexto
La 1ª tanda de EXTR (47 conceptos, en PROMPT_004) cubría lo nuclear de Temas 10/11. Estos 4 lotes
amplían el reglamento a los Títulos I-XV con rangos de id DISJUNTOS (sin colisión). Familia EXTR ya
queda registrada por PROMPT_004; NO hay que volver a registrarla.

## 1. Comprobación de meta antes de cargar
Como EXTR usa `temas: null` en el registro (ver PROMPT_004), `verificar-meta` solo exige `meta.tema`
no vacío. Verifica que la familia EXTR está registrada (por PROMPT_004) y que estos lotes tienen la
misma `materia`/`referencia_boe` que la 1ª tanda (lo tienen). Si por lo que sea EXTR quedó con lista
de temas fija, ábrela y asegúrate de que incluye los `meta.tema` EXACTOS de estos lotes.

## 2. Cargar los 4 lotes (flujo estándar: 3 puertas + `cargar.mjs`)
- `lotes/rd-1155-2024-extranjeria-t2-visados.json` — EXTR-050..089, 40 conceptos (Título II, Visados, arts. 25-47).
- `lotes/rd-1155-2024-extranjeria-reagrupacion-arraigo.json` — EXTR-100..149, 50 conceptos (reagrupación familiar arts. 65-71; arraigo/circunstancias excepcionales arts. 124-155, VG/trata).
- `lotes/rd-1155-2024-extranjeria-trabajo-estudios.json` — EXTR-150..199, 50 conceptos (estudios 53-59; trabajo cuenta ajena 72-81; cuenta propia 82-87; excepciones 88-89; temporada 100-112; gestión colectiva 113-123).
- `lotes/rd-1155-2024-extranjeria-menores-sancionador.json` — EXTR-200..253, 54 conceptos (menores no acompañados 164-174, 214; resto sancionador 217-255; oficinas de extranjería 258-265 + disp. adic.).

Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas). El §23 en el
índice ya estará ✓ desde PROMPT_004; puedes anotar que ahora es cobertura amplia (Títulos I-XV,
~241 conceptos EXTR en total).

## 3. Enlaces cruzados (tras cargar)
Cada lote ya trae aristas internas y algunas a la 1ª tanda EXTR (EXTR-004/020/023/024/025/026 y los
sancionadores EXTR-029/030/033/035/038/040/041/042/045/046). Además hay propuestas a **EXT** (LO 4/2000)
en los RESULTADOS de los generadores (reagrupación→arts. 16-19; arraigo→31.3; VG→31 bis; trata→59/59 bis;
trabajo/estudios→52/53/54); añádelas resolviendo ids reales o `remision_pendiente`.

## 4. Limpieza
Borra TODOS los `_ELIMINAR_*` que queden en el repo: raíz, `adaptadores/legal-es/generador/` y
`adaptadores/legal-es/generador/lotes/` (varios runners `.mjs`, `.py`, `.txt` de agentes; seguros).

## Nota de cobertura
Con esto el Reglamento de Extranjería queda cubierto en su núcleo testable de los Títulos I-XV.
Quedan por extraer, si se quiere el 100% literal, algunos artículos sueltos (p. ej. Título I 3/8/9/10/12/14/17/18/21,
detalles de renovación/duración de residencia y disposiciones organizativas menores). Suficiente para
el examen; ampliable en otra tanda.
