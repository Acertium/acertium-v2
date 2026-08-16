# PROMPT_004 — Contenido oleada 4 (Extranjería, Ciberseguridad, Vehículos, Conducción detenidos, Desarrollo selectivos)

Carga de 5 lotes nuevos. Ejecuta DESPUÉS de PROMPT_003. Revisa `git status`/`git diff`.
Sigue `CLAUDE.md`. Al terminar: commit, push a `main`, escribe `RESULTADO_004.md`, registra en
`EJECUCIONES.md`. NUNCA leas `.env`. Cada título fue confirmado por el generador leyendo la cabecera
del PDF (dos etiquetas del catálogo eran erróneas/incompletas; los datos reales van abajo).

## 1. Registrar familias (antes de cargar) — en `registro-materias.json`
```json
"EXTR": {
  "materia": "rd-1155-2024-reglamento-extranjeria",
  "norma": "Real Decreto 1155/2024, de 19 de noviembre, por el que se aprueba el Reglamento de la Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros en España y su integración social",
  "referencia_boe": "BOE-A-2024-24099",
  "temas": null
}
// IMPORTANTE EXTR: usa `temas: null` (EXTR abarca Temas 10 y 11 en varios lotes —el de 1ª tanda y los 4 de ampliación de PROMPT_005— con strings de `meta.tema` ligeramente distintos; con `null`, verificar-meta solo exige que `meta.tema` no esté vacío y NO valida pertenencia a la lista, evitando desajustes de string). Si prefieres fijar la lista, abre los lotes EXTR y copia sus `meta.tema` EXACTOS a `temas`.
"ENC": {
  "materia": "orden-pci-487-2019-estrategia-nacional-ciberseguridad",
  "norma": "Orden PCI/487/2019, por la que se publica la Estrategia Nacional de Ciberseguridad 2019",
  "referencia_boe": "BOE-A-2019-6347",
  "temas": ["Tema 15 — Protección de Infraestructuras Críticas: Catálogo Nacional, Sistema de Protección; ciberseguridad"]
}
"RGV": {
  "materia": "rd-2822-1998-reglamento-vehiculos",
  "norma": "Real Decreto 2822/1998, por el que se aprueba el Reglamento General de Vehículos",
  "referencia_boe": "BOE-A-1999-1826",
  "temas": ["Tema 43 — El vehículo prioritario: definición y señales de emergencia; señales en los vehículos (Reglamento General de Vehículos)"]
}
"VCD": {
  "materia": "orden-int-2573-2015-vehiculos-conduccion-detenidos",
  "norma": "Orden INT/2573/2015, por la que se determinan las especificaciones técnicas de los vehículos destinados a la conducción de detenidos, presos y penados",
  "referencia_boe": "BOE-A-2015-13138",
  "temas": ["Tema 44 — La Seguridad en la Conducción de Vehículos Prioritarios: seguridad activa y pasiva; conducción policial y traslado de detenidos"]
}
"DPSF": {
  "materia": "orden-int-632-2024-desarrollo-procesos-selectivos-pn",
  "norma": "Orden INT/632/2024, de 20 de junio, por la que se establecen normas para la aplicación y desarrollo del Reglamento de procesos selectivos y formación de la Policía Nacional (RD 853/2022)",
  "referencia_boe": "BOE-A-2024-12811",
  "temas": ["Tema 8 — La Dirección General de la Policía y la Policía Nacional: estructura, funciones, escalas y categorías, sistemas de acceso, régimen disciplinario y situaciones administrativas"]
}
```

## 2. Correcciones de catálogo en `datos/legal-es/boe-600-pn/00-indice.md`
- **§16** (fila 16): NO es un anexo suelto — es la **Orden INT/632/2024** (desarrollo del RD 853/2022). Pon Norma = "Orden INT/632/2024 (desarrollo del Reglamento de procesos selectivos y formación PN)", Referencia = **BOE-A-2024-12811**, Familia = DPSF.
- **§51** (fila 51): añade Referencia = **BOE-A-1999-1826** (RD 2822/1998; el PDF parcial no la imprime), Familia = RGV.
- (El §7 → Fiscalía Europea ya se corrige en PROMPT_002.)

## 3. Cargar los 5 lotes (flujo estándar: 3 puertas + `cargar.mjs`)
- `lotes/rd-1155-2024-reglamento-extranjeria.json` (EXTR, 47 — **cobertura PARCIAL**: Tema 10/11 nucleares; el reglamento tiene ~182 pág. y quedan muchos artículos para tandas futuras; ver RESULTADO del generador. Márcalo ✓ pero anota en el índice "(1ª tanda, ampliable)".)
- `lotes/orden-pci-487-2019-estrategia-nacional-ciberseguridad.json` (ENC, 34)
- `lotes/rd-2822-1998-vehiculos-prioritarios.json` (RGV, 24)
- `lotes/orden-int-2573-2015-vehiculos-conduccion-detenidos.json` (VCD, 41)
- `lotes/orden-int-632-2024-desarrollo-selectivos.json` (DPSF, 50)

Nota técnica: ENC y VCD son norma/estrategia con estructura por secciones/anexos, así que su campo `articulo` usa nombres de sección (no "art. N"); `verificar-lote` lo trata como clave de `fuentes` y valida bien. Tras cargar: `asercion-post-carga.sql` (0 filas) + integridad (0 descuadres, 0 islas).

## 4. Enlaces cruzados (tras cargar; resuelve ids reales o `remision_pendiente`)
- **EXTR → EXT** (desarrolla): EXTR-017→EXT-027 · EXTR-028→EXT-001 · EXTR-033/034→EXT-020/021 · EXTR-036→EXT-029 · EXTR-041→EXT-022 · EXTR-042→EXT-025/026 · EXTR-043→EXT-030 · EXTR-032→EXT-012.
- **ENC → IC** (remite): ENC-021→IC-006 · ENC-009→IC-006.
- **RGV → TRAF**: RGV-003→TRAF-008 · RGV-015→TRAF-008 · RGV-001→TRAF-006 · RGV-004→TRAF-002 · RGV-021→TRAF-008.
- **VCD**: VCD-001→LEC-022 (ya embebido). Propuestos: VCD→FCS y VCD→TRAF (resuelve ids).
- **DPSF → SEL**: DPSF-001→SEL-001 · DPSF-008/018→SEL-009 · DPSF-016→SEL-010 · DPSF-026→SEL-011 · DPSF-034/035/039→SEL-018 · DPSF-041→SEL-026. Además DPSF→PPN (arts. 16.3/19/29 LO 9/2015; resuelve ids).

## 5. Manifiesto
Marca §16, §23, §34, §51, §53 como ✓ (o lo hará el hook de `cargar.mjs`). Familias: §16→DPSF, §23→EXTR, §34→ENC, §51→RGV, §53→VCD.

## 6. Limpieza
Borra TODOS los `_ELIMINAR_*` que queden en el repo (raíz y `adaptadores/legal-es/generador/`).
