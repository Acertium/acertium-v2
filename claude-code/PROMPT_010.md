# PROMPT_010 — No-BOE tanda 3: Sostenible (T35), Drogas (T34), Redes (T39), Gramática (T36), Sistemas Operativos (T38)

5 lotes NO-BOE (`oficial`/`autoridad`, cita literal). **Ejecuta DESPUÉS de PROMPT_007** (que ajusta
`verificar-meta` para aceptar `referencia_fuente` cuando `referencia_boe` está vacío; todos estos lo
tienen vacío). Revisa `git status`. Sigue `CLAUDE.md`. Al terminar: commit, push, `RESULTADO_010.md`,
`EJECUCIONES.md`. NUNCA leas `.env`.

## 1. Registrar familias — en `registro-materias.json`
```json
"SOST": {
  "materia": "agenda-2030-desarrollo-sostenible",
  "norma": "Agenda 2030 para el Desarrollo Sostenible (Resolución A/RES/70/1 de la Asamblea General de la ONU)",
  "referencia_boe": "",
  "referencia_fuente": "A/RES/70/1 (undocs.org/es/A/RES/70/1) + un.org/sustainabledevelopment/es, consulta 2026-08-04",
  "temas": ["Tema 35 — El desarrollo sostenible: concepto; coordinación y cooperación internacional; sociedad y desarrollo sostenible; instrumentos de gestión ambiental"]
}
"DROGA": {
  "materia": "drogodependencias-oms-unodc-oeda",
  "norma": "Definiciones OMS/UNODC; convenios de 1961 y 1971; Informe OEDA 2024 (PNSD)",
  "referencia_boe": "",
  "referencia_fuente": "pnsd.sanidad.gob.es (glosario OMS, OEDA 2024) + unodc.org, consulta 2026-08-04 (datos de tendencias con fecha, caducan)",
  "temas": ["Tema 34 — Drogodependencias: conceptos de droga, consumidor, administración, adicción, dependencia, tolerancia, politoxicomanías; clasificación de las drogas; últimas tendencias en el consumo"]
}
"REDES": {
  "materia": "redes-informaticas-osi-tcpip",
  "norma": "Fuentes técnicas de referencia sobre redes: modelo OSI y TCP/IP (Check Point, IBM), dispositivos (glosario INCIBE, Microsoft, VAS Experts), direccionamiento IP (Oracle)",
  "referencia_boe": "",
  "referencia_fuente": "incibe.es + checkpoint.com + ibm.com + oracle.com, consulta 2026-08-04",
  "temas": ["Tema 39 — Redes informáticas: modelo OSI; modelo TCP/IP; dispositivos de red; direccionamiento IP (clases, IPv4, IPv6)"]
}
"GRAM": {
  "materia": "gramatica-rae",
  "norma": "Gramática de la lengua española (RAE-ASALE): Glosario de términos gramaticales y Nueva gramática básica",
  "referencia_boe": "",
  "referencia_fuente": "rae.es (GTG, NGB), consulta 2026-08-04",
  "temas": ["Tema 36 — Gramática de la lengua española: morfología (sufijos, sustantivos, pronombres, adjetivos, adverbios, verbos, preposiciones, conjunciones); sintaxis (la oración: partes y tipos; análisis sintáctico)"]
}
"SO": {
  "materia": "sistemas-operativos-fundamentos",
  "norma": "Fuentes técnicas de referencia sobre sistemas operativos (Red Hat, Microsoft Learn, Apple)",
  "referencia_boe": "",
  "referencia_fuente": "redhat.com + learn.microsoft.com + support.apple.com, consulta 2026-08-04",
  "temas": ["Tema 38 — Fundamentos de sistemas operativos: funciones; tipologías (MS-DOS, UNIX, Linux, Windows, MAC OS); SO móviles (iOS, Android); sistemas de almacenamiento; sistemas de archivos"]
}
```

## 2. Cargar los 5 lotes (flujo estándar; con el ajuste de PROMPT_007 pasan las 3 puertas)
- `lotes/sostenible-agenda2030.json` (SOST, 26 — `oficial`)
- `lotes/drogas-oms-oeda.json` (DROGA, 33 — `oficial`)
- `lotes/redes-osi-tcpip.json` (REDES, 29 — `autoridad`)
- `lotes/gramatica-rae.json` (GRAM, 33 — `autoridad`)
- `lotes/sistemas-operativos.json` (SO, 30 — `autoridad`)
Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas). Quedan `verificado`.

## 3. Enlaces cruzados (resuelve ids o `remision_pendiente`)
- REDES↔CIBER: REDES-015→CIBER-005 (limita), CIBER-009→REDES-017 (remite).
- GRAM→ORTO: GRAM-007→ORTO-010, GRAM-033→ORTO-012 (remite).
- SO→REDES: SO-006→REDES-022, SO-001→REDES-001.

## 4. Segundas pasadas pendientes (contenido, para otra tanda — no ahora)
- T35: definición literal del Informe Brundtland + instrumentos de gestión ambiental (los PDF de la ONU dieron timeout/403).
- T34: "politoxicomanía/policonsumo" (glosario PNSD letra P) y más tendencias OEDA.
- T38: iOS, Android, UNIX, MS-DOS, Windows como SO autónomos + ext4/HFS+ (fetch degradado).
- T36: revisor humano debe cotejar el bloque `fuentes` de GRAM palabra por palabra contra las URLs RAE (el fetch a rae.es fue inestable; las definiciones se tomaron vía WebSearch de páginas GTG/NGB, no de memoria).

## 5. Limpieza
Borra TODOS los `_ELIMINAR_*` del repo (raíz, `adaptadores/legal-es/generador/` y `.../lotes/`).
