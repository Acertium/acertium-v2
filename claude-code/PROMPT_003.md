# PROMPT_003 — Contenido oleada 3 (uniformidad, centros docentes, Consejo de Policía, Policía Judicial)

Carga de 4 lotes nuevos. Ejecuta DESPUÉS de PROMPT_002. Revisa `git status`/`git diff`.
Sigue `CLAUDE.md`. Al terminar: commit, push a `main`, escribe `RESULTADO_003.md`, registra en
`EJECUCIONES.md`. NUNCA leas `.env`. Los títulos fueron confirmados por el generador leyendo la
cabecera de cada PDF (dos etiquetas del catálogo eran genéricas; el asunto real es el que consta abajo).

## 1. Registrar familias (antes de cargar) — en `adaptadores/legal-es/generador/registro-materias.json`

```json
"UNI": {
  "materia": "orden-int-430-2014-uniformidad",
  "norma": "Orden INT/430/2014, de 10 de marzo, por la que se regula la uniformidad en el Cuerpo Nacional de Policía",
  "referencia_boe": "BOE-A-2014-2997",
  "temas": ["Tema 8 — La Dirección General de la Policía y la Policía Nacional: estructura, funciones, escalas y categorías, sistemas de acceso, régimen disciplinario y situaciones administrativas"]
}
"CDPN": {
  "materia": "rd-49-2024-centros-docentes-pn",
  "norma": "Real Decreto 49/2024, por el que se aprueba el Reglamento de los centros docentes de la Policía Nacional",
  "referencia_boe": "BOE-A-2024-814",
  "temas": ["Tema 8 — La Dirección General de la Policía y la Policía Nacional: estructura, funciones, escalas y categorías, sistemas de acceso, régimen disciplinario y situaciones administrativas"]
}
"CPOL": {
  "materia": "rd-555-2011-regimen-electoral-consejo-policia",
  "norma": "Real Decreto 555/2011, de 20 de abril, por el que se establece el régimen electoral del Consejo de Policía",
  "referencia_boe": "BOE-A-2011-7173",
  "temas": ["Tema 9 — La Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad: los derechos de representación colectiva; el Consejo de Policía"]
}
"PJ": {
  "materia": "rd-769-1987-policia-judicial",
  "norma": "Real Decreto 769/1987, de 19 de junio, sobre regulación de la Policía Judicial",
  "referencia_boe": "BOE-A-1987-14578",
  "temas": ["Tema 21 — Derecho Procesal Penal: órganos de la jurisdicción penal; la detención; el Ministerio Fiscal; la Policía Judicial"]
}
```

## 2. Cargar los 4 lotes (flujo estándar: 3 puertas + `cargar.mjs`)
- `lotes/orden-int-430-2014-uniformidad.json` (UNI, 50)
- `lotes/rd-49-2024-centros-docentes.json` (CDPN, 44)
- `lotes/rd-555-2011-regimen-electoral-consejo-policia.json` (CPOL, 62)
- `lotes/rd-769-1987-policia-judicial.json` (PJ, 46)

Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas).

## 3. Enlaces cruzados (tras cargar; resuelve ids reales o `remision_pendiente`)
- **UNI:** UNI-009→DGP-007 y UNI-011→DGP-019 (ya en el lote). Añadir: UNI-042…UNI-050→PPN (desarrolla, divisas por escala/categoría) · UNI-011→SEL (remite) · UNI-025/UNI-026→DGP (desarrolla).
- **CDPN:** CDPN-032/CDPN-041→SEL (remite) · CDPN-025→SEL-015/016 (desarrolla) · CDPN-020→PPN (remite) · CDPN-040/CDPN-041→DISC (remite) · CDPN-018/CDPN-037→AGE (remite).
- **CPOL:** CPOL-001→FCS (concepto del art. 26 LO 2/1986; desarrolla) · CPOL-055→LOPJ (recurso contencioso; remite).
- **PJ:** PJ-006/PJ-011→CE (art. 126; desarrolla) · PJ-007→FCS (art. 30) · PJ-008→FCS (art. 5) · PJ-011/PJ-020→LOPJ (arts. 443-446/549) · PJ-001/PJ-004→LEC (arts. 283/288) · PJ-021/PJ-033→MF.

## 4. Manifiesto
Marca §17, §18, §20, §21 como ✓ en `datos/legal-es/boe-600-pn/00-indice.md` (o lo hará el hook de
`cargar.mjs`). Familias: §17→UNI, §18→CDPN, §20→CPOL, §21→PJ.

## 5. Limpieza
Borra TODOS los ficheros `_ELIMINAR_*` del repo (raíz de AcertiumV2 y
`adaptadores/legal-es/generador/`): son runners temporales de agentes, seguros de eliminar.
