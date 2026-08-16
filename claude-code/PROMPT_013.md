# PROMPT_013 — Subir a GitHub TODO el trabajo pendiente (solo git, sin cargar BD)

Objetivo: **versionar en GitHub** todo lo generado que aún no está comiteado, para no perderlo. Este
encargo es SOLO git (add/commit/push). **NO cargues nada en Supabase, NO construyas módulos** — eso va
en los PROMPT_002-012 aparte, cuando toque. Sigue `CLAUDE.md`. NUNCA leas `.env`. Al terminar escribe
`RESULTADO_013.md` y registra en `EJECUCIONES.md`.

## 1. Limpieza previa (NO comitear basura)
Borra TODOS los ficheros temporales de agentes `_ELIMINAR_*` estén donde estén (raíz de AcertiumV2,
`adaptadores/legal-es/generador/`, `adaptadores/legal-es/generador/lotes/`). Son runners de verificación,
seguros de eliminar. Que NO entren en el commit.

## 2. Revisa `git status` y comitea el trabajo legítimo
Añade y comitea (con `.gitignore` sano para que no cuele ningún `_ELIMINAR_*` ni `/tmp`):
- **Lotes nuevos:** `adaptadores/legal-es/generador/lotes/*.json` (BOE: protección internacional, PRL,
  uniformidad, centros docentes, Consejo de Policía, Policía Judicial, Extranjería y sus ampliaciones,
  ciberseguridad, vehículos, conducción de detenidos, desarrollo selectivos, Fiscalía Europea; y
  no-BOE: DDHH —DUDH/TORT/CEDH—, CIBER, INTEL, ORTO, SOST, DROGA, REDES, GRAM, SO).
- **Docs:** `docs/plan-temas-no-boe.md`, `docs/contrato-fuentes-no-boe.md`, `docs/modulo-ortografia.md`,
  `docs/cobertura-temas-no-boe.md`.
- **Canal:** `claude-code/README.md`, `claude-code/PROMPT_001.md … PROMPT_013.md`, `claude-code/EJECUCIONES.md`
  y cualquier `RESULTADO_NNN.md`.
- **Ediciones de contrato/registro/índice:** `adaptadores/legal-es/generador/contrato-generacion.md`,
  `contrato-calidad-preguntas.md`, `registro-materias.json`, `datos/legal-es/boe-600-pn/00-indice.md`.
- Cualquier otro fichero de trabajo real que veas en `git status` y NO sea un `_ELIMINAR_*`.

## 3. Duda a resolver por ti (Code)
`datos/legal-es/pn-oficial-examenes-600.csv` aparece **modificado** (` M`). No sé si ese cambio es
intencional. Míralo con `git diff`: si es un cambio legítimo, comitéalo; si parece ruido/accidental o no
lo entiendes, **déjalo fuera del commit** (no lo revuelvas) y anótalo en el RESULTADO para que Jonathan
decida.

## 4. Commit y push
Uno o varios commits descriptivos (p. ej. "contenido: lotes BOE-600 + temas no-BOE (sin cargar)",
"docs+canal: contratos, planes y encargos Cowork↔Code"). Push a `main`.

## 5. Verificación
- `git status` limpio tras el push (salvo lo que dejes fuera a propósito, p. ej. el CSV).
- Confirma que NINGÚN `_ELIMINAR_*` ni fichero de `/tmp` quedó versionado.
- `npm run build` NO es necesario (no se toca código de app aquí); pero si el árbol ya tenía cambios de
  app sin comitear de sesiones previas, respétalos/inclúyelos según corresponda.

## Nota
Esto solo pone los ficheros a salvo en GitHub. La carga en la base y el montaje de módulos siguen su
curso en PROMPT_002-012.
