# PROMPT_018 — Subir a GitHub lo pendiente (Grupo C + prompts)

Objetivo: dejar el repo remoto (`origin/main`, github.com/Acertium/acertium-v2) con TODO lo generado,
para poder trabajar desde la nube sin el PC. Sigue `CLAUDE.md`. NUNCA leas `.env`.
Al terminar: `RESULTADO_018.md` + entrada en `EJECUCIONES.md`.

## 0. Quitar el lock si existe
Si hay `.git/index.lock` huérfano (ninguna operación git en curso), bórralo antes de empezar.

## 1. Añadir SOLO estos 9 archivos (no hagas `git add -A`)
```
adaptadores/legal-es/generador/lotes/etica-valores-odio.json
adaptadores/legal-es/generador/lotes/inmigracion.json
adaptadores/legal-es/generador/lotes/geografia-demografia.json
adaptadores/legal-es/generador/lotes/globalizacion.json
adaptadores/legal-es/generador/lotes/actitudes-valores.json
adaptadores/legal-es/generador/lotes/seguridad-delincuencia.json
claude-code/PROMPT_015.md
claude-code/PROMPT_016.md
claude-code/PROMPT_017.md
```

## 2. NO subir el CSV
`datos/legal-es/pn-oficial-examenes-600.csv` sale modificado pero son 601/601 líneas = solo cambio de
fin de línea (CRLF↔LF), sin contenido real. NO lo incluyas en el commit; déjalo tal cual.

## 3. Commit + push
```
git commit -m "contenido: lotes del Grupo C (temas 28-33) + encargos de carga 015-017"
git push origin main
```

## 4. Verificar (en RESULTADO_018)
- `git status` limpio salvo el CSV.
- `git rev-list --left-right --count origin/main...HEAD` = `0	0` (local == remoto) tras el push.
- Confirma que los 9 archivos aparecen en `git ls-tree -r origin/main --name-only | grep -E "Grupo|globalizacion|PROMPT_01[567]"` (o equivalente).

## Nota
Esto NO carga nada en la base — solo sube los ficheros. La carga en Supabase la hacen PROMPT_015/016/017,
que ya se pueden ejecutar desde la nube una vez estos lotes están en el repo.
