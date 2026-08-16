# PROMPT_019 — Empujar la nota de traspaso a GitHub (y limpiar locks)

Cowork escribió y **commiteó localmente** la nota de traspaso `claude-code/PARA-CODE-APP.md`
(commit `f645a9c`), pero no puede hacer `push` (la sandbox no tiene credenciales de GitHub). Queda
1 commit local por delante de `origin/main`. Sigue `CLAUDE.md`. NUNCA leas `.env`.
Al terminar: `RESULTADO_019.md` + línea en `EJECUCIONES.md`.

## 1. Quitar locks huérfanos
El intento de push de Cowork dejó `.git/HEAD.lock` y `.git/index.lock`. Si no hay ninguna operación
git viva, bórralos: `rm -f .git/HEAD.lock .git/index.lock`.

## 2. Empujar
No hace falta commitear nada nuevo (la nota ya está en `f645a9c`). Solo:
```
git push origin main
```
Si por lo que sea `f645a9c` no existiera o el árbol estuviera raro, NO fuerces nada: para y anótalo.

## 3. Verificar (en RESULTADO_019)
- `git rev-list --left-right --count origin/main...HEAD` = `0	0`.
- `git ls-tree -r origin/main --name-only | grep PARA-CODE-APP` devuelve el fichero.

## Nota
Es la última tarea de esta tanda. Con esto, el Code de la app tiene su punto de arranque en el repo
(`claude-code/PARA-CODE-APP.md`). Lee esa nota tú también: resume el estado y el aviso del corpus
(los PDFs no están versionados → la generación de contenido nuevo aún exige el PC).
