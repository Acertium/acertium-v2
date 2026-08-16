# PROMPT_011 — Módulo de consenso (verificar-fuente + pendiente_revision) para el Grupo C (T28-33)

Cambio de PIPELINE que implementa la parte pendiente del `docs/contrato-fuentes-no-boe.md` (§2-§3):
la puerta `verificar-fuente.mjs`, el estado `pendiente_revision` y la garantía de que el runtime
**solo sirve `verificado`**. Desbloquea el contenido de "consenso" (temas 28-33). Depende de PROMPT_007
(que ya adapta `verificar-meta` para aceptar `referencia_fuente`). Revisa `git status`. Sigue `CLAUDE.md`.
Al terminar: `npm run build`, self-tests del núcleo, commit, push, `RESULTADO_011.md`, `EJECUCIONES.md`.
NUNCA leas `.env`.

## 1. Estado `pendiente_revision` (migración)
- `actividad.estado_verificacion` es un enum de Postgres (USER-DEFINED). Añade el valor
  **`pendiente_revision`** (`ALTER TYPE ... ADD VALUE`), vía `apply_migration`. Idempotente/seguro.
- **CRÍTICO (la red de seguridad):** confirma que TODO lo que sirve preguntas al usuario filtra
  `estado_verificacion = 'verificado'`:
  - RPC `acertium_v2.siguiente_actividad_test()` (practicar),
  - RPC `acertium_v2.simulacro_muestra(conv,n)` (simulacro),
  - cualquier consulta de `lib/cerebro.ts` / `lib/simulacro-data.ts` que lea actividades.
  Si alguna NO filtra, añade el filtro. Un `pendiente_revision` NO puede llegar jamás al usuario.

## 2. `nucleo/verificar-fuente.mjs` (nueva puerta)
Según `tipo_fuente` de la actividad/lote (contrato §1-§3):
- Todos: exige `tipo_fuente ∈ {oficial, autoridad, consenso}` y `referencia_fuente` (nombre/URL + fecha)
  presente y no vacío. (Para `oficial` con BOE vale `referencia_boe`.)
- `oficial` / `autoridad`: aplica el check literal de contenido (correcta ⊂ cotejo; reutiliza el de
  `verificar-lote.mjs`). Aptas para quedar `verificado`.
- `consenso`: NO exige substring literal. Exige (a) `cotejo` con la cita/paráfrasis + `referencia_fuente`
  concreta (obra + apartado/URL), (b) que su `estado_verificacion` sea `pendiente_revision`, (c) marca
  `revision_humana: pendiente`. **Rechaza** un `consenso` que venga marcado `verificado`.
Devuelve el mismo formato que las otras puertas (ok/rechazos/avisos).

## 3. `cargar.mjs`
Al emitir el SQL, fija `estado_verificacion` según `tipo_fuente`:
- `consenso` → `pendiente_revision` (NUNCA `verificado`).
- `oficial` / `autoridad` que pasan las puertas → `verificado` (como hasta ahora).
Lee `tipo_fuente` del meta del lote (o por concepto si viniera por concepto).

## 4. Revisión humana (mínimo viable)
Script/consulta `adaptadores/legal-es/generador/revision-pendientes.mjs` (o SQL equivalente) que:
- Liste los `pendiente_revision` por familia con su enunciado, correcta y `referencia_fuente`.
- Permita **promover** a `verificado` por id o por familia tras revisión.
(Se solapa con el panel de admin de reportes; a futuro puede ser la MISMA pantalla. Aquí basta el script.)

## 5. Enganche + verificación
- Engancha `verificar-fuente.mjs` al flujo de los adaptadores no-BOE (junto a las puertas existentes).
- Self-tests: (a) `oficial`/`autoridad` con correcta literal → PASA y queda `verificado`; (b) `consenso`
  sin substring literal pero con fuente+cotejo → PASA y queda `pendiente_revision`; (c) `consenso`
  marcado `verificado` → RECHAZA; (d) una consulta de runtime NO devuelve un `pendiente_revision`.
- `npm run build` verde. NO rompas las puertas existentes ni las ~1.268 actividades ya `verificado`.

## Nota — qué desbloquea
Con esto los temas **28-33** (globalización, actitudes/valores, ética/delitos de odio, inmigración,
geografía/demografía, seguridad y teorías de la delincuencia) se generarán como `consenso`, se cargarán
`pendiente_revision` y **no se sirven** hasta que Jonathan (o el futuro revisor) los promueva. Es la red
de seguridad del contrato. Este encargo es de pipeline y puede ir antes o después de la cola de contenido.
