# RESULTADO_013 — Subir a GitHub el trabajo pendiente (solo git)

**Estado:** hecho. Dos commits en `main`, empujados a
`https://github.com/Acertium/acertium-v2.git` (`184b316..9601e49`).
No se ha tocado Supabase ni se ha montado ningún módulo, como pedía el encargo.

## 1. Limpieza previa

Borrados **26 ficheros** temporales, ninguno llegó al commit:

- Raíz: `_ELIMINAR_check.mjs`, `_ELIMINAR_check2.mjs`, `_ELIMINAR_check3.mjs`.
- `adaptadores/legal-es/generador/` (12): `_ELIMINAR_gate.mjs`, `_ELIMINAR_run-gates.mjs`,
  `_ELIMINAR_run.mjs`, `_ELIMINAR_run_drogas.mjs`, `_ELIMINAR_run_extr.mjs`,
  `_ELIMINAR_run_gates.mjs`, `_ELIMINAR_run_gates_intel.mjs`, `_ELIMINAR_run_gates_sost.mjs`,
  `_ELIMINAR_run_orto.mjs`, `_ELIMINAR_run_redes.mjs`, `_ELIMINAR_run_so.mjs`,
  `_ELIMINAR_runner.mjs`.
- `adaptadores/legal-es/generador/lotes/` (10): `_ELIMINAR_build_menores_sancionador.py`,
  `_ELIMINAR_build_tortura.py`, `_ELIMINAR_check.mjs`, `_ELIMINAR_gates_tortura.mjs`,
  `_ELIMINAR_gen.py`, `_ELIMINAR_meta.mjs`, `_ELIMINAR_pdftext.txt`, `_ELIMINAR_run.mjs`,
  `_ELIMINAR_run_cedh.mjs`, `_ELIMINAR_run_gates.mjs`.

**Extra no previsto en el encargo:** `adaptadores/legal-es/generador/err` (69 bytes) también se
borró. No es un `_ELIMINAR_*`, pero su contenido único era la salida de error de un `mv` fallido
(`mv: cannot remove '_ELIMINAR_run_gates.mjs': Operation not permitted`), es decir, un `2> err`
que se quedó ahí. Basura del mismo lote de agentes; lo anoto por transparencia.

## 2. Commits

**`8c64a46` — contenido: lotes BOE-600 + temas no-BOE (generados, sin cargar en base)**
33 ficheros, 16.186 líneas. Todos los `lotes/*.json` nuevos: protección internacional /
fronteras UE, PRL (policía y AGE), uniformidad, centros docentes, Consejo de Policía, Policía
Judicial, Extranjería (RD 1155/2024 y sus seis ampliaciones), ciberseguridad, vehículos
prioritarios, conducción de detenidos, desarrollo de selectivos, Defensor del Pueblo; y los
no-BOE: DDHH (DUDH / TORT / CEDH), CIBER, INTEL, ORTO, SOST, DROGA, REDES, GRAM, SO.

**`9601e49` — docs+canal: planes de temas no-BOE, encargos Cowork-Code y `.gitignore`**
17 ficheros, 841 líneas: `docs/plan-temas-no-boe.md`, `docs/contrato-fuentes-no-boe.md`,
`docs/modulo-ortografia.md`, `docs/cobertura-temas-no-boe.md`, `claude-code/PROMPT_002.md …
PROMPT_013.md` y el `.gitignore`.

**`.gitignore`:** añadido un bloque que ignora `_ELIMINAR_*` y `/tmp/`, para que estos
temporales no vuelvan a aparecer en `git status` ni puedan colarse en un commit.

## 3. La duda del CSV — resuelta, pero no como decía el encargo

`datos/legal-es/pn-oficial-examenes-600.csv` **no aparece modificado**. `git status` lo da
limpio; su último cambio está commiteado en `da36ecb` ("App móvil-first…"). Entre que se
escribió el PROMPT_013 y esta ejecución alguien lo comiteó o revirtió. **No he tocado el
fichero**: no había nada que decidir.

## 4. Cosas del encargo que ya estaban hechas

`contrato-generacion.md`, `contrato-calidad-preguntas.md`, `registro-materias.json`,
`datos/legal-es/boe-600-pn/00-indice.md`, `claude-code/README.md`, `PROMPT_001.md`,
`EJECUCIONES.md` y `RESULTADO_001.md` **ya estaban versionados** de sesiones anteriores, sin
cambios pendientes. No entran en estos commits porque no había diff.

## 5. Verificación

- `git status` **limpio** tras el push (salvo `RESULTADO_013.md` / `EJECUCIONES.md`, que se
  comitean aparte con esta entrega).
- Comprobado que **ningún** `_ELIMINAR_*` ni fichero de `/tmp` quedó versionado.
- Buscados patrones de secreto (`SUPABASE`, `SERVICE_ROLE`, `ANTHROPIC`, `sk-ant`, JWT `eyJ…`)
  en todos los lotes nuevos: **cero coincidencias**. `.env` no se ha leído.
- `npm run build` **no se ejecutó**, tal y como indica el encargo: no se toca código de app.
  El árbol no traía cambios de app sin comitear.

## Notas / incidencias

- **`.git/index.lock` huérfano.** El primer `git add` falló por un `index.lock` vacío de 15
  minutos atrás, sin ningún proceso `git` vivo. Lo eliminé y el commit siguió. Probablemente lo
  dejó un git interrumpido de una sesión anterior (¿otro agente, o el editor?). Si vuelve a
  pasar a menudo, merece la pena mirar qué lo crea.
- **No hay `CLAUDE.md` en el repo.** El encargo dice "sigue `CLAUDE.md`" y no existe en ninguna
  ruta de AcertiumV2 (buscado; tampoco lo registra el historial). He seguido las reglas
  globales de Jonathan. Si se da por supuesto que existe uno de proyecto, **falta**: puede ser
  otro fichero perdido que convenga escribir.
- Git avisa de conversión LF→CRLF en los ficheros nuevos (Windows, `core.autocrlf`). No afecta
  al contenido versionado, que se guarda con LF.
- Este trabajo solo pone los ficheros a salvo en GitHub. **La carga en base y el montaje de
  módulos siguen pendientes** en PROMPT_002–012, que están sin ejecutar (ninguno tiene su
  `RESULTADO_NNN.md`).
