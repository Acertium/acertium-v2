# RESULTADO_018 — Lo pendiente ya estaba subido; y un aviso sobre trabajar desde la nube

Ejecutado el **2026-08-16**. Estado: **objetivo cumplido**, pero conviene leer el §4: **subir estos
ficheros no basta para poder trabajar desde la nube**, y el encargo da por hecho que sí.

## 1. Los 9 ficheros ya estaban en `origin/main`

Este encargo se escribió antes de que ejecutara los PROMPT_015, 016 y 017, y **en esos tres los
comiteé y empujé**. Comprobado uno por uno con `git ls-tree -r origin/main`: los nueve están.

| Fichero | Entró en |
|---|---|
| `lotes/etica-valores-odio.json` · `inmigracion.json` · `geografia-demografia.json` | `b39a219` (PROMPT_016) |
| `lotes/globalizacion.json` · `actitudes-valores.json` · `seguridad-delincuencia.json` | `82ddec7` (PROMPT_017) |
| `claude-code/PROMPT_015.md` | `de48d52` (PROMPT_015) |
| `claude-code/PROMPT_016.md` | `b39a219` |
| `claude-code/PROMPT_017.md` | `82ddec7` |

**No he hecho ningún commit de contenido nuevo**, porque no había nada que subir. Este encargo solo
añade su propio `PROMPT_018.md` y este resultado.

## 2. Lo demás del encargo

- **`.git/index.lock` (§0):** no existía al empezar. (Sí apareció huérfano dos veces durante la
  sesión, la última a mitad del PROMPT_015; las dos las quité tras comprobar que no había ningún
  proceso git vivo. Conviene averiguar qué lo deja: pasa cuando otro agente escribe en el repo a la
  vez.)
- **El CSV (§2):** `datos/legal-es/pn-oficial-examenes-600.csv` **no sale modificado**. `git status`
  lo da limpio y su último cambio está en `da36ecb`. No hay nada que excluir del commit.
- **`git add -A` (§1):** no se ha usado, ni hacía falta.

## 3. Verificación

| Comprobación | Resultado |
|---|---|
| `git status` | limpio (solo `PROMPT_018.md` sin versionar, que va en este commit) |
| `git rev-list --left-right --count origin/main...HEAD` | **`0  0`** — local y remoto idénticos |
| Los 9 ficheros en `origin/main` | **los 9** |
| Lotes en disco vs versionados | **78 de 78** |

**Limpieza extra:** habían aparecido **6 temporales `_ELIMINAR_*` nuevos**, de los agentes que
generaron los lotes del Grupo C (`_ELIMINAR_diag.mjs`, `_ELIMINAR_run_puertas.mjs`,
`_ELIMINAR_build_segt.py`, `_ELIMINAR_meta.mjs`, `_ELIMINAR_run.mjs`, `_ELIMINAR_run_gates.mjs`).
El `.gitignore` del PROMPT_013 impedía que se colaran en un commit, pero seguían ahí ocupando el
árbol. Borrados.

## 4. **Aviso: con esto todavía no se puede trabajar desde la nube**

El objetivo del encargo es "poder trabajar desde la nube sin el PC". Los lotes y el canal ya están
arriba, así que **cargar en Supabase sí se puede hacer desde la nube**. Pero **generar contenido
nuevo, no**, y ahora mismo hace falta:

**El corpus fuente no está en el repo, y es deliberado.** El `.gitignore` excluye `datos/**/*.pdf`
con este motivo escrito: *"corpus pesado: fuente local; el runtime lee el cerebro desde Supabase"*.
En el PC hay **56 PDFs (21 MB)** del corpus BOE-600 y **1,9 MB** más en `_fuentes-brutas/`; en
`origin/main` hay **0**. De `datos/` solo se versionan el índice, el temario oficial, unos pocos
`*-articulos.json` y el CSV.

Por qué importa justo ahora: el PROMPT_017 dejó constancia de que **faltan los temas 19, 20, 24 y
45** (delitos contra el orden público, delitos informáticos, introducción a PRL y PRL en seguridad
vial). Generarlos exige leer las fuentes —los temas 19 y 20 salen del **Código Penal**, cuyo PDF es
uno de esos 56— y **desde la nube no estarían**. Un agente que lo intente se encontrará el fichero
ausente, o peor, tirará de memoria: exactamente lo que `CLAUDE.md` prohíbe.

Tres salidas, y la decisión es de Jonathan porque tiene coste:

1. **Versionar el corpus.** 23 MB en total. Git lo aguanta de sobra (el límite de GitHub es 100 MB
   por fichero) y es la opción simple. Cambia el criterio del `.gitignore`, que fue una decisión
   consciente: habría que anotar por qué se cambia.
2. **Git LFS** para `datos/**/*.pdf`. Mantiene el repo ligero, pero añade una herramienta más al
   flujo y hay que instalarla en cada sitio.
3. **Dejarlo como está** y aceptar que la generación de contenido nuevo se hace desde el PC, y desde
   la nube solo carga, código y revisión. Es perfectamente viable si se sabe de antemano.

**No he tocado el `.gitignore`**: cambiarlo mete 23 MB en el repo y contradice una decisión escrita a
propósito. Eso se decide, no se asume.

## Pendientes / notas

- Sigue sin resolverse qué deja el `.git/index.lock` huérfano.
- El resto de pendientes vivos están en `RESULTADO_017.md`: los 4 temas que faltan, las 56 preguntas
  de consenso sin revisar, y el `ADMIN_TOKEN` sin fijar (sin él, `/admin` es 404 y no se pueden
  aprobar).
