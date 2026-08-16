# PROMPT_008 — No-BOE tanda 2: CEDH (T27), Ciberdelincuencia (T41), Inteligencia (T40), Ortografía (T37)

4 lotes NO-BOE. **Ejecuta DESPUÉS de PROMPT_007** (que ajusta `verificar-meta` para aceptar
`referencia_fuente` cuando no hay `referencia_boe` — imprescindible para los `autoridad` de aquí).
Revisa `git status`/`git diff`. Sigue `CLAUDE.md`. Al terminar: commit, push, `RESULTADO_008.md`,
`EJECUCIONES.md`. NUNCA leas `.env`.

## 1. Registrar familias — en `registro-materias.json`
```json
"CEDH": {
  "materia": "convenio-europeo-derechos-humanos",
  "norma": "Convenio Europeo para la Protección de los Derechos Humanos y de las Libertades Fundamentales (Roma, 1950) y Protocolo nº 11",
  "referencia_boe": "BOE-A-1979-24010",
  "referencia_fuentes": ["BOE-A-1979-24010", "BOE-A-1998-15127"],
  "temas": ["Tema 27 — Derechos Humanos: Declaración Universal; Convenio Europeo DDHH; Convenio contra la Tortura; Protocolo facultativo; Mecanismo Nacional de Prevención de la Tortura del Defensor del Pueblo"]
}
"CIBER": {
  "materia": "glosario-ciberseguridad-incibe",
  "norma": "Glosario y recursos oficiales de ciberseguridad de INCIBE",
  "referencia_boe": "",
  "referencia_fuente": "https://www.incibe.es (glosario y guías, consulta 2026-08-04)",
  "temas": ["Tema 41 — Ciberdelincuencia y agentes de la amenaza: malware, phishing, ransomware y demás; cibercriminales; APT; Cyber Kill Chain"]
}
"INTEL": {
  "materia": "inteligencia-osint-fuentes-abiertas",
  "norma": "Doctrina de inteligencia del CNI (ciclo y disciplinas) e INCIBE (OSINT, deep/dark web)",
  "referencia_boe": "",
  "referencia_fuente": "https://www.cni.es/la-inteligencia + https://www.incibe.es (consulta 2026-08-04)",
  "temas": ["Tema 40 — Inteligencia: dato, información e inteligencia; tipologías; ciclo de inteligencia; OSINT; surface/deep/dark web/darknet"]
}
"ORTO": {
  "materia": "ortografia-rae",
  "norma": "Ortografía de la lengua española (RAE-ASALE)",
  "referencia_boe": "",
  "referencia_fuente": "https://www.rae.es (Ortografía / OLE 2010, consulta 2026-08-04)",
  "temas": ["Tema 37 — Ortografía de la lengua española: reglas ortográficas; uso de las letras o grafemas; uso de la tilde, de los signos ortográficos y de mayúsculas y minúsculas"]
}
```

## 2. Cargar los 4 lotes (flujo estándar; con el ajuste de PROMPT_007 pasan las 3 puertas)
- `lotes/ddhh-cedh.json` (CEDH, 34) — `tipo_fuente: oficial` (BOE).
- `lotes/ciber-incibe.json` (CIBER, 22) — `tipo_fuente: autoridad` (referencia_fuente).
- `lotes/inteligencia-osint.json` (INTEL, 12) — `autoridad`.
- `lotes/ortografia-rae.json` (ORTO, 32) — `autoridad`.
Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas). Quedan `verificado`
(oficial/autoridad, cita literal).

## 3. Enlaces cruzados (resuelve ids o `remision_pendiente`)
- CEDH→TORT (CEDH-003→TORT-001), CEDH→DUDH (003→DUDH-006, 006→DUDH-010, 010→DUDH-013, 016→DUDH-009), CEDH→CE (art.15/24, tentativo).
- INTEL→ENC (INTEL-011→ENC-013, INTEL-007→ENC-009) y INTEL↔CIBER.
- CIBER: a familias del CP (delitos informáticos) / LOPD cuando existan ids → `remision_pendiente`.

## 4. Hallazgo para Code (no bloquea la carga, sí a futuro)
La puerta de cotejo (`verificador-cotejo.mjs`) **normaliza quitando tildes y a minúsculas**, así que NO
puede verificar la corrección de los acentos en sí. Por eso el lote ORTO está construido con preguntas
de **regla** (la correcta es un recorte literal del enunciado de la regla RAE), no de tipo "¿qué palabra
lleva bien la tilde?". Si en el futuro se quieren preguntas de acentuación de palabras concretas, hará
falta un modo de cotejo **sensible a tildes** para la familia ORTO.

## 5. Pendientes de contenido (T27 y técnicos, para otra tanda)
- T27: los matices del **Protocolo nº 15 (plazo de admisibilidad 4 meses)** y **nº 14 (mandato del juez 9 años)** — traer su literal del BOE y actualizar CEDH-026/031.
- T41: **XSS** y **Crime as a Service** (no había definición INCIBE limpia; usar CCN-CERT CCN-STIC).

## 6. Limpieza
Borra TODOS los `_ELIMINAR_*` del repo (raíz, `adaptadores/legal-es/generador/` y `.../lotes/`).
