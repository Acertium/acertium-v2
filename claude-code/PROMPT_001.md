# PROMPT_001 — Contenido protección internacional + enchufar el "profesor" al selector

Encargo AGRUPADO. Revisa `git status` / `git diff` primero. Sigue `CLAUDE.md`.
Al terminar: `npm run build`, commit(s) descriptivos, push a `main`, escribe
`RESULTADO_001.md` en este canal y registra en `EJECUCIONES.md`. NUNCA leas
`.env`/`.env.*`. Puedes commitear por fases (contenido primero, selector después)
para que un fallo del selector no bloquee la carga de contenido.

## 1. Cargar 3 lotes nuevos (protección internacional, Tema 12)

Ya generados, afinados (sesgo de longitud ≤35 %) y con las 3 puertas en verde:

- `adaptadores/legal-es/generador/lotes/rd-865-2001-apatrida.json` (familia APAT, **ya registrada**)
- `adaptadores/legal-es/generador/lotes/rd-1325-2003-proteccion-temporal.json` (familia PTEMP)
- `adaptadores/legal-es/generador/lotes/rd-220-2022-acogida.json` (familia ACOG)

Antes de cargar, añade a `adaptadores/legal-es/generador/registro-materias.json` las
familias **PTEMP** y **ACOG** (APAT ya está). Copia EXACTAMENTE la estructura de la
entrada APAT existente:

```json
"PTEMP": {
  "materia": "rd-1325-2003-proteccion-temporal",
  "norma": "Real Decreto 1325/2003, por el que se aprueba el Reglamento sobre régimen de protección temporal en caso de afluencia masiva de personas desplazadas",
  "referencia_boe": "BOE-A-2003-19714",
  "temas": ["Tema 12 — La protección internacional: reglas procedimentales; menores y personas vulnerables; centros de acogida; apátridas y desplazados"]
}
"ACOG": {
  "materia": "rd-220-2022-acogida-proteccion-internacional",
  "norma": "Real Decreto 220/2022, por el que se aprueba el Reglamento por el que se regula el sistema de acogida en materia de protección internacional",
  "referencia_boe": "BOE-A-2022-4978",
  "temas": ["Tema 12 — La protección internacional: reglas procedimentales; menores y personas vulnerables; centros de acogida; apátridas y desplazados"]
}
```

Corre el flujo estándar por cada lote (verificar-lote + verificar-meta +
verificar-calidad, deben pasar) y `cargar.mjs`. Tras cargar: `asercion-post-carga.sql`
(0 filas) + comprobación de integridad (0 descuadres correcta⊄opciones, 0 islas).

## 2. Enlaces cruzados (red neuronal) — tras cargar

Añade aristas `relacion_concepto` de las familias nuevas hacia ASI/ASIR, resolviendo
ids reales; las que apunten a id inexistente → `remision_pendiente`. `tipo=remite`
salvo indicación:

- APAT-014→ASIR-004 · APAT-008→ASIR-009 · APAT-012→ASIR-018 · APAT-015→ASIR-007 · APAT-018→ASIR-025 · APAT-020→ASIR-024
- PTEMP-026→ASIR-016 · PTEMP-027→ASIR-018 · PTEMP-016/PTEMP-018→ASIR-004 (prerrequisito) · PTEMP-030→ASIR-028
- ACOG-016→ASIR-016 · ACOG-014→ASIR-017 · ACOG-024→ASIR-018

Hay más enlaces propuestos a ASI (Ley 12/2009) por descripción: resuelve el id por
artículo o déjalos en `remision_pendiente`.

## 3. ENCHUFAR EL "PROFESOR" AL SELECTOR DE PRÁCTICA (lo importante)

Hoy `/practicar` usa la RPC `acertium_v2.siguiente_actividad_test()` = `order by random()`:
no usa el motor. Cámbialo para que el selector use el motor YA DISEÑADO:
`nucleo/motor-bkt.mjs` (BKT con olvido, retención `r=L·0.9^(Δt/τ)`) y
`nucleo/planificador.mjs` (coach: consolidar vs ampliar, reserva anti-inanición,
gating por prereqs), scoped al usuario actual (`DEMO_USUARIO_ID` por ahora; el log
`evento` es la fuente de verdad, `estado_dominio` la caché).

Comportamiento esperado:

- Prioriza conceptos flojos (absorción baja) y los "vencidos" de repaso (retención decaída).
- Los dominados NO desaparecen: reaparecen a intervalos crecientes cuando su retención
  baja (repaso espaciado). Ningún concepto se cae jamás del sistema.
- Los nuevos/nunca vistos entran con reserva anti-inanición (tope tipo ≤60-80 % como el planificador).
- Elegido el concepto, sirve una actividad test verificada suya (conserva las 3 opciones
  barajadas y el grounding literal actuales).
- Arranque en frío (sin historial): cae a no-vistos primero / cobertura amplia / random,
  para que funcione desde la primera pregunta.
- Rendimiento: corre en cada "siguiente"; usa la caché `estado_dominio` y recomputa
  perezoso. Implementa donde sea más limpio (RPC nueva o `lib/cerebro.ts`) REUTILIZANDO
  nucleo, sin reimplementar el BKT.

Revisa antes `lib/cerebro.ts` (`siguienteActividad`, `responder`) para no romper la
actualización incremental del BKT ni el modo simulacro. Deja un fallback a random si
algo falla. Verifica: con historial mixto los flojos salen más que los dominados;
ningún concepto queda excluido para siempre; `/practicar` responde rápido; arranque en
frío OK.

## 4. Manifiesto de cobertura

- Marca §27/§28/§29 como ✓ en `datos/legal-es/boe-600-pn/00-indice.md` (columna Estado) tras cargar.
- Añade a `cargar.mjs` un paso que, al cargar un lote con éxito, localice su norma en
  `00-indice.md` por `referencia_boe` y ponga su Estado a ✓ con fecha (que el índice se
  mantenga solo).

## 5. Docs de estandarización (ya editados, solo commitear)

`contrato-generacion.md` y `contrato-calidad-preguntas.md` ya llevan la Capa 2 (afinado
de distractores) como paso OBLIGATORIO del flujo. Solo commitéalos.

## 6. Limpieza — borra estos temporales de agentes (seguros):

- `_ELIMINAR_puertas.mjs` (raíz)
- `adaptadores/legal-es/generador/_ELIMINAR_calib.mjs`
- `adaptadores/legal-es/generador/_ELIMINAR_run-puertas.mjs`
