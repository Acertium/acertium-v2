# PROMPT_002 — Contenido oleada 2 (PRL policía, PRL AGE, Reglamento Defensor, Fiscalía Europea)

Encargo de CARGA de 4 lotes nuevos. Ejecuta DESPUÉS de PROMPT_001. Revisa `git status`/`git diff`.
Sigue `CLAUDE.md`. Al terminar: `npm run build` (si tocas app; aquí es sobre todo datos), commit,
push a `main`, escribe `RESULTADO_002.md` y registra en `EJECUCIONES.md`. NUNCA leas `.env`.

## 1. Registrar familias nuevas (antes de cargar)
Añade a `adaptadores/legal-es/generador/registro-materias.json`, con el estilo de las entradas existentes:

```json
"PRLP": {
  "materia": "rd-2-2006-prl-policia",
  "norma": "Real Decreto 2/2006, por el que se establecen normas sobre prevención de riesgos laborales en la actividad de los funcionarios del Cuerpo Nacional de Policía",
  "referencia_boe": "BOE-A-2006-624",
  "temas": ["Tema 25 — Marco normativo básico de prevención de riesgos laborales: la Ley 31/1995 de Prevención de Riesgos Laborales"]
}
"PRLAGE": {
  "materia": "rd-67-2010-prl-age",
  "norma": "Real Decreto 67/2010, de adaptación de la legislación de Prevención de Riesgos Laborales a la Administración General del Estado",
  "referencia_boe": "BOE-A-2010-2161",
  "temas": ["Tema 25 — Marco normativo básico de prevención de riesgos laborales: la Ley 31/1995 de Prevención de Riesgos Laborales"]
}
"RDP": {
  "materia": "reglamento-defensor-del-pueblo",
  "norma": "Reglamento de Organización y Funcionamiento del Defensor del Pueblo",
  "referencia_boe": "BOE-A-1983-10613",
  "temas": ["Tema 2 — La Constitución Española (I): estructura, caracteres, valores y principios; derechos y deberes; el Defensor del Pueblo"]
}
"FE": {
  "materia": "lo-9-2021-fiscalia-europea",
  "norma": "Ley Orgánica 9/2021, de 1 de julio, de aplicación del Reglamento (UE) 2017/1939 del Consejo, por el que se establece una cooperación reforzada para la creación de la Fiscalía Europea",
  "referencia_boe": "BOE-A-2021-10957",
  "temas": ["Tema 4 — La Unión Europea; cooperación policial internacional"]
}
```

## 2. Corrección de catálogo (§7 estaba mal etiquetado)
El PDF `07-lo-9-2021-reglamento-ue-fronteras.pdf` / `BOE-A-2021-10957` NO es "Guardia Europea de
Fronteras": es la **LO 9/2021 de la Fiscalía Europea** (verificado en la cabecera del PDF). Por eso:
- Renombra el lote `adaptadores/legal-es/generador/lotes/lo-9-2021-fronteras-ue.json` →
  `lo-9-2021-fiscalia-europea.json` (la familia es **FE**, el contenido es Fiscalía Europea).
- Corrige la fila 7 de `datos/legal-es/boe-600-pn/00-indice.md`: la Norma pasa a "LO 9/2021, de
  aplicación del Reglamento (UE) 2017/1939 — Fiscalía Europea" (la referencia BOE ya es correcta).
- (El nombre del PDF puede quedarse; basta con anotarlo en el índice.)

## 3. Cargar los 4 lotes
Corre el flujo estándar (verificar-lote + verificar-meta + verificar-calidad, deben pasar) y
`cargar.mjs` para:
- `lotes/rd-2-2006-prl-policia.json` (PRLP, 44 conceptos)
- `lotes/rd-67-2010-prl-age.json` (PRLAGE, 35)
- `lotes/reglamento-defensor-pueblo.json` (RDP, 15 — el PDF del corpus es parcial: solo Sección V,
  Consejo Asesor del Mecanismo Nacional de Prevención de la Tortura, arts. 19-22; es lo que hay)
- `lotes/lo-9-2021-fiscalia-europea.json` (FE, 30)
Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres correcta⊄opciones, 0 islas).

## 4. Enlaces cruzados (red neuronal) — tras cargar; resuelve ids reales o `remision_pendiente`
- **PRLP → PRL** (Ley 31/1995), tipo desarrolla salvo indicación: PRLP-001→PRL-003/PRL-001 · PRLP-004→PRL-011 · PRLP-006→PRL-013 · PRLP-007→PRL-013 (limita) · PRLP-008→PRL-014 · PRLP-009→PRL-015 · PRLP-010→PRL-016 · PRLP-014→PRL-017 · PRLP-017→PRL-018 · PRLP-019→PRL-019 · PRLP-021→PRL-022 · PRLP-027/028→PRL-024 · PRLP-030→PRL-028 · PRLP-036→PRL-030 · PRLP-038→PRL-031 (remite) · PRLP-041→PRL-027.
- **PRLAGE → PRL**: PRLAGE-001→PRL-001 (desarrolla) · PRLAGE-003→PRL-003 (remite) · PRLAGE-005/006→PRL-015 · PRLAGE-009→PRL-029 · PRLAGE-010→PRL-032 · PRLAGE-011/013→PRL-030 · PRLAGE-015→PRL-031 · PRLAGE-017→PRL-025. Además PRLAGE-004→PRLP-* (remite, peculiaridades PN) y PRLAGE-002→AGE-* (ámbito).
- **RDP → DP**: ya vienen 4 aristas en el propio lote (RDP-001→DP-001, RDP-002→DP-013, RDP-003→DP-013, RDP-004→DP-005). Verifica que resuelven.
- **FE → CP/MF/LEC/LOPJ** (la norma es proceso penal, NO extranjería): FE-006/007→CP (delitos financieros arts. 305/305bis/306/308/570bis, desarrolla) · FE-003 y FE-029→LEC/LECrim (remite) · FE-013→LOPJ (Audiencia Nacional/TS) · FE-010/016/022/023→MF (Ministerio Fiscal/FGE). Resuelve ids reales; lo que no exista → `remision_pendiente`. NO enlaces a UE/EXT (no hay solape real).

## 5. Manifiesto
Marca §45, §46, §49, §7 como ✓ en `00-indice.md` (columna Estado) tras cargar (si el hook de
cargar.mjs de PROMPT_001 ya está, lo hará solo; si no, a mano).

## 6. Limpieza
Borra `_ELIMINAR_check.mjs` (raíz) si sigue ahí (los `_ELIMINAR_*` de generador ya los borra PROMPT_001).
