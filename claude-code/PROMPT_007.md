# PROMPT_007 — Piloto no-BOE: Tema 27 (DDHH) + ajuste de meta para fuentes no-BOE

Primer contenido NO-BOE (Tema 27, Derechos Humanos), `tipo_fuente: oficial` (cita literal de tratados;
gate literal aplicable). Ejecuta cuando quieras (independiente de PROMPT_002-006). Revisa
`git status`/`git diff`. Sigue `CLAUDE.md`. Al terminar: `npm run build` si tocas app, commit, push,
`RESULTADO_007.md`, `EJECUCIONES.md`. NUNCA leas `.env`. Contexto en `docs/contrato-fuentes-no-boe.md`.

## 1. Ajuste de pipeline (lo que reveló el piloto)
`verificar-meta.mjs` hoy exige `referencia_boe` NO vacío y lo compara con el registro. Las fuentes
no-BOE (p. ej. la Declaración Universal, texto ONU) no tienen `BOE-A-…`. Ajuste:
- Acepta **`referencia_fuente`** (URL/obra + fecha) como sustituto válido de `referencia_boe`
  CUANDO `referencia_boe` esté vacío. Es decir: exige `referencia_boe` **O** `referencia_fuente` (uno de
  los dos), no ambos. Mantén el resto fail-closed igual (familia registrada, materia/norma/tema).
- Para lotes multi-instrumento (varios tratados en un lote, p. ej. TORT), acepta un
  `referencia_fuentes` (array) opcional en meta además del `referencia_boe` principal; valida solo el principal.
- NO relajes nada para los lotes BOE normales (si hay `referencia_boe`, se valida como siempre).

(La puerta completa `verificar-fuente.mjs` y el estado `pendiente_revision` del contrato §3 son para el
**Grupo C / consenso** y van en un encargo posterior; el piloto de hoy es `oficial` = literal y no los necesita.)

## 2. Registrar familias (antes de cargar) — en `registro-materias.json`
```json
"DUDH": {
  "materia": "declaracion-universal-derechos-humanos",
  "norma": "Declaración Universal de Derechos Humanos, 1948",
  "referencia_boe": "",
  "referencia_fuente": "https://www.un.org/es/about-us/universal-declaration-of-human-rights",
  "temas": ["Tema 27 — Derechos Humanos: Declaración Universal; Convenio Europeo DDHH; Convenio contra la Tortura; Protocolo facultativo; Mecanismo Nacional de Prevención de la Tortura del Defensor del Pueblo"]
}
"TORT": {
  "materia": "convencion-contra-la-tortura",
  "norma": "Convención contra la Tortura (1984), Protocolo facultativo (2002) y MNP del Defensor del Pueblo",
  "referencia_boe": "BOE-A-1987-25053",
  "referencia_fuentes": ["BOE-A-1987-25053", "BOE-A-2006-11128", "BOE-A-1981-10325"],
  "temas": ["Tema 27 — Derechos Humanos: Declaración Universal; Convenio Europeo DDHH; Convenio contra la Tortura; Protocolo facultativo; Mecanismo Nacional de Prevención de la Tortura del Defensor del Pueblo"]
}
```
(Decisión tomada: TORT es **una familia compuesta** —Tema 27 antitortura es un bloque unitario—, no se parte por instrumento. `referencia_boe` principal = la Convención.)

## 3. Cargar los 2 lotes (flujo estándar; las 3 puertas deben pasar con el ajuste §1)
- `adaptadores/legal-es/generador/lotes/ddhh-declaracion-universal.json` (DUDH, 39 conceptos)
- `adaptadores/legal-es/generador/lotes/ddhh-tortura.json` (TORT, 25 conceptos)
Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas). Quedan `verificado`
(son `oficial`/literal).

## 4. Enlaces cruzados (tras cargar; resuelve ids o `remision_pendiente`)
- TORT-023→DP-001 (desarrolla) · TORT-025→DP-013 (remite) · RDP-001→TORT-024 (desarrolla, Consejo Asesor del MNP).
- DUDH→CE (art. 5→CE art. 15; art. 1→CE art. 10; etc.): la CE de Tema 2 (Título I derechos) aún no está como familia con esos ids → deja en `remision_pendiente` hasta que exista.

## 5. Limpieza
Borra TODOS los `_ELIMINAR_*` del repo (raíz, `adaptadores/legal-es/generador/` y `.../lotes/`).

## Nota
El índice `00-indice.md` es del corpus BOE-600; estos temas no-BOE no van ahí. Cuando avancemos con
27-41 conviene un tracker de cobertura aparte (temas 27-41) análogo.
