# PROMPT_009 — Módulo de ortografía (generar y verificar grafía/acentuación)

Implementa el módulo de ortografía descrito en `docs/modulo-ortografia.md`. Es cambio de PIPELINE
(nueva puerta + recurso + modo sensible a tildes), NO carga de contenido. Revisa `git status`. Sigue
`CLAUDE.md`. Al terminar: `npm run build` si toca app, tests del núcleo, commit, push, `RESULTADO_009.md`,
`EJECUCIONES.md`. NUNCA leas `.env`.

## 1. Recurso de verdad — diccionario español
Añade un diccionario español autorizado con grafía correcta (tildes incluidas): **hunspell es_ES**
(RLA/LibreOffice, licencia libre) o equivalente. Ubícalo en `adaptadores/tecnico-es/recursos/`
(crea la carpeta) y documenta su origen/licencia. Carga un set de palabras (lemas + formas) accesible
desde Node para lookup O(1) (Set/Map). Si hunspell trae flags de flexión, expándelo a un wordlist plano
o usa una librería de lookup; prioriza fiabilidad sobre exhaustividad.

## 2. `nucleo/verificar-ortografia.mjs` (nueva puerta, familia ORTO)
Según el campo `modo` de la actividad:
- `modo: "grafia"`: la opción CORRECTA debe existir en el diccionario con match EXACTO (sensible a
  tildes/mayúsculas-minúsculas según proceda); los 3 DISTRACTORES NO deben existir. Rechaza si la
  correcta no está, o si algún distractor también está (ambigüedad).
- `modo: "regla"` (o ausente): delega en el cotejo literal actual contra la fuente (sin cambios).
Devuelve el mismo formato de resultado que las otras puertas (ok/rechazos/avisos).

## 3. Modo sensible a tildes en `nucleo/verificador-cotejo.mjs`
Añade un modo (flag por actividad `cotejo_sensible: true` o derivado de familia=ORTO) que NO normalice
tildes al comparar. Por defecto, comportamiento actual intacto (no rompas las 1268 actividades ya
verificadas). Cúbrelo con un self-test.

## 4. Enganche
Engancha `verificar-ortografia.mjs` al flujo de puertas para la familia ORTO (junto a verificar-lote/
meta/calidad). El resto de familias no cambian.

## 5. Verificación
- Self-tests: (a) "sofá" ∈ dic y "sofa" ∉ dic (tilde-sensible); (b) una pregunta `grafia` con correcta
  válida + 3 inválidas PASA, y una con 2 válidas se RECHAZA; (c) el verificador base sigue dando el
  mismo resultado que hoy en modo normal.
- `npm run build` verde; no romper las puertas existentes.

## Después (no en este encargo)
Con la puerta lista, se generará (agentes) el lote ORTO ampliado con preguntas de grafía/acentuación de
palabra verificadas contra el diccionario, además de las de regla que ya hizo el agente RAE (lote
`ortografia-rae.json`, en cola en PROMPT_008).

## Nota
Este encargo es independiente de la cola de contenido (PROMPT_002-008); puede ir antes o después.
