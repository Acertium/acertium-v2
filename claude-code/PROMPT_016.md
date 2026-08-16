# PROMPT_016 — Grupo C oleada 1 (ETICA, INMIG, GEOD) + estado por concepto

3 lotes NO-BOE del Grupo C (temas 30, 31, 32), MIXTOS (conceptos `oficial`/`autoridad` citables +
`consenso`). Depende de PROMPT_011 (estado `pendiente_revision`, ya está). Sigue `CLAUDE.md`. NUNCA leas
`.env`. Al terminar: `RESULTADO_016.md` + `EJECUCIONES.md`.

## 1. Mejora clave — `estado_verificacion` POR CONCEPTO (no por lote)
Hoy `cargar.mjs` estampa un único `estado` por lote (según `meta.tipo_fuente`), lo que obliga a que un
lote mixto entre entero como `pendiente_revision`. Cada concepto/actividad de estos lotes ya trae su
**`tipo_fuente` real por concepto**. Cambia `cargar.mjs` para fijar el estado **por concepto**:
- concepto `oficial`/`autoridad` que pasa las puertas → `verificado`.
- concepto `consenso` → `pendiente_revision`.
Así las definiciones citables (CP, INE, OIM, RAE) se sirven ya, y solo lo de consenso espera revisión.
Mantén el fail-closed: ante duda o si un concepto no declara `tipo_fuente`, `pendiente_revision`.
(Si prefieres no tocar el cargador ahora, alternativa segura: carga todo como `pendiente_revision` y
que Jonathan promueva por /admin; pero la vía por concepto es la buena y los lotes ya la soportan.)

## 2. Registrar familias (con los dominios que citan, para la puerta de meta no-BOE)
```json
"ETICA": {
  "materia": "etica-valores-contravalores-delitos-odio",
  "norma": "Principios éticos, valores y contravalores (CE arts. 1/10/14; UNESCO Tolerancia 1995; DLE RAE-ASALE; Berger y Luckmann; Ley 19/2007) y delitos de odio del CP (arts. 22.4ª y 510, redacción LO 6/2022)",
  "referencia_boe": "",
  "referencia_fuente": "https://www.unesco.org + https://dle.rae.es + https://www.boe.es, consulta 2026-08-16",
  "temas": ["Tema 30 — Principios éticos; transmisión de valores; libertad, igualdad, tolerancia; contravalores; delitos de odio"]
}
"INMIG": {
  "materia": "inmigracion-movimientos-migratorios",
  "norma": "Glosario OIM sobre migración, Parlamento Europeo (causas) e INE (Estadística de Migraciones 2024)",
  "referencia_boe": "",
  "referencia_fuente": "https://www.iom.int + https://www.europarl.europa.eu + https://www.ine.es, consulta 2026-08-16",
  "temas": ["Tema 31 — Inmigración: movimientos migratorios (concepto, causas, tipos, efectos); grandes migraciones; migraciones actuales; integración social"]
}
"GEOD": {
  "materia": "geografia-humana-demografia-ine-rae",
  "norma": "Definiciones demográficas del INE (Indicadores Demográficos Básicos, DEGURBA) y del DLE (RAE-ASALE); geografía humana y sociedad de masas de fuentes de consenso (Wikipedia; Ortega, 1929)",
  "referencia_boe": "",
  "referencia_fuente": "https://www.ine.es + https://dle.rae.es + https://es.wikipedia.org, consulta 2026-08-16",
  "temas": ["Tema 32 — Geografía humana; la ciudad; población; demografía (densidad, natalidad, mortalidad, crecimiento vegetativo); sociedad de masas; medio ambiente"]
}
```
Si la puerta de meta no-BOE compara dominios del `meta.referencia_fuente` del lote con los del registro,
asegúrate de que coinciden (los agentes citaron BOE por id `BOE-A-…` sin URL; si hace falta, añade una
URL `https://www.boe.es/...` al meta del lote ETICA, o ajusta los dominios del registro a lo que el lote cita).

## 3. Cargar los 3 lotes
- `lotes/etica-valores-odio.json` (ETICA, 15: 5 oficial CP + 10 consenso)
- `lotes/inmigracion.json` (INMIG, 21: 13 autoridad OIM + 3 oficial INE + 5 consenso)
- `lotes/geografia-demografia.json` (GEOD, 23: 20 autoridad INE/RAE + 3 consenso)
Flujo: `verificar-fuente` + `verificar-calidad` + `verificar-lote` (+ meta con dominios) → `cargar.mjs`
→ `asercion-post-carga.sql` (= 0). Aristas cruzadas propuestas (a CP/IG/VG/EXT/ASI) → resuelve ids o `remision_pendiente`.

## 4. Verificación (en RESULTADO_016)
Por familia: conceptos en BD, y **cuántos quedaron `verificado` vs `pendiente_revision`** (debería
coincidir con oficial+autoridad vs consenso). Cowork cruza por MCP.
