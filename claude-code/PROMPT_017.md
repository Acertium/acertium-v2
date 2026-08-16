# PROMPT_017 — Grupo C oleada 2 (GLOB, ACTIT, SEGT) — cierra el temario

3 lotes NO-BOE del Grupo C (temas 28, 29, 33), mixtos. **Misma mecánica que PROMPT_016** (estado por
concepto: `oficial`/`autoridad`→`verificado`, `consenso`→`pendiente_revision`; fail-closed ante duda).
Ejecuta después de PROMPT_016. Sigue `CLAUDE.md`. NUNCA leas `.env`. Al terminar: `RESULTADO_017.md` +
`EJECUCIONES.md`.

## 1. Registrar familias (con los dominios citados, para la puerta de meta no-BOE)
```json
"GLOB": {
  "materia": "globalizacion-antiglobalizacion-foro-social-mundial",
  "norma": "Globalización (DLE RAE-ASALE; FMI 2000), consecuencias y reacciones; Movimiento Antiglobalización (consenso: Wikipedia) y Foro Social Mundial (Carta de Principios 2001)",
  "referencia_boe": "",
  "referencia_fuente": "https://dle.rae.es + https://www.imf.org + https://es.wikipedia.org + https://wsf2021.net, consulta 2026-08-16",
  "temas": ["Tema 28 — Globalización y antiglobalización: conceptos, características, consecuencias, reacciones; Movimiento Antiglobalización; Foro Social Mundial"]
}
"ACTIT": {
  "materia": "actitudes-valores-sociales-psicologia-social",
  "norma": "Actitudes y valores sociales (DLE RAE-ASALE; psicología social: Allport, Rosenberg-Hovland, Katz, Adorno, Rokeach, Cooley, Sumner): concepto/componentes/funciones de la actitud; estereotipo, prejuicio, discriminación; personalidad autoritaria, dogmatismo; grupos sociales",
  "referencia_boe": "",
  "referencia_fuente": "https://dle.rae.es + https://archive.org + https://www.gutenberg.org, consulta 2026-08-16",
  "temas": ["Tema 29 — Actitudes y valores sociales: formación de actitudes (concepto, componentes, funciones); estereotipos, prejuicios, discriminación; personalidad autoritaria (xenofobia, dogmatismo); grupos sociales"]
}
"SEGT": {
  "materia": "seguridad-y-teorias-de-la-delincuencia",
  "norma": "Concepto de seguridad y teorías de la delincuencia (mixto): LO 4/2015 (BOE-A-2015-3442), Ley 5/2014 (BOE-A-2014-3649), DUDH art. 3, DLE-RAE y criminología (Britannica)",
  "referencia_boe": "",
  "referencia_fuente": "https://www.boe.es + https://dle.rae.es + https://www.britannica.com, consulta 2026-08-16",
  "temas": ["Tema 33 — La seguridad: concepto; individual/colectiva; pública/privada; inseguridad; teorías explicativas de la delincuencia (modelos y clases)"]
}
```
(Si la puerta de meta compara dominios del `referencia_fuente` del lote con los del registro, ajústalos
para que coincidan con lo que cada lote cita; el BOE va por id `BOE-A-…`.)

## 2. Cargar los 3 lotes (estado por concepto, como en PROMPT_016)
- `lotes/globalizacion.json` (GLOB, 23: 17 autoridad + 6 consenso)
- `lotes/actitudes-valores.json` (ACTIT, 14: 6 autoridad DLE + 8 consenso)
- `lotes/seguridad-delincuencia.json` (SEGT, 21: 7 oficial + 3 autoridad + 11 consenso)
Flujo: `verificar-fuente` + `verificar-calidad` + `verificar-lote` (+ meta con dominios) → `cargar.mjs`
→ `asercion-post-carga.sql` (= 0). Aristas cruzadas propuestas (SEGT→SC/SP, ACTIT→ETICA) → resuelve ids
o `remision_pendiente`.

## 3. Verificación (en RESULTADO_017)
Por familia: conceptos en BD y **cuántos `verificado` vs `pendiente_revision`**. Cowork cruza por MCP.

## Nota
Con estos 3 + los de PROMPT_016, el Grupo C (temas 28-33) queda cargado y **el temario completo (1-45)
está en el cerebro**. El contenido de consenso NO se sirve hasta que Jonathan lo apruebe en `/admin`.
