# RESULTADO_019 — Nota de traspaso empujada (y una corrección en la propia nota)

Ejecutado el **2026-08-16**. Estado: **completado**. El push salió a la primera; lo que merece
atención es el §3: **la nota de traspaso tenía un punto falso** que habría mandado al siguiente Code
a rehacer trabajo ya hecho.

## 1. Locks huérfanos

Estaban los dos que anunciaba el encargo, `.git/HEAD.lock` y `.git/index.lock`, ambos **vacíos** y de
las 14:37. Comprobado antes de tocarlos que **no había ningún proceso `git` vivo** (`tasklist`) y que
el árbol estaba sano. Borrados.

Es la **tercera vez** en la sesión que aparece un lock huérfano; ahora ya se sabe la causa: **una
sandbox sin credenciales de GitHub que intenta `push`**. El `push` falla al autenticar y deja los
`.lock` sin limpiar. Anotado abajo.

## 2. Push

`f645a9c` existía, era HEAD y contenía exactamente lo esperado (`claude-code/PARA-CODE-APP.md`, 67
líneas, un solo fichero). No hizo falta commitear nada nuevo ni forzar nada.

    74167b1..f645a9c  main -> main

### Verificación (la que pedía el §3)

| Comprobación | Resultado |
|---|---|
| `git rev-list --left-right --count origin/main...HEAD` | **`0  0`** |
| `git ls-tree -r origin/main --name-only \| grep PARA-CODE-APP` | **`claude-code/PARA-CODE-APP.md`** |
| Locks tras el push | ninguno |

## 3. Leí la nota, como pedía el encargo — y su punto 4 es falso

La nota lista como pendiente:

> **Enchufar el planificador/BKT en `/practicar`** (hoy usa `order by random()`, no el motor de
> repaso espaciado ya diseñado en `nucleo/`).

**Eso ya está hecho desde el PROMPT_001.** Comprobado en el código, no de memoria:

- `lib/cerebro.ts` importa `planDia` de `nucleo/planificador.mjs` y `absorcion`/`crearEstado` de
  `nucleo/motor-bkt.mjs` (líneas 5-6).
- `siguienteActividad()` decide con el RPC `practicar_estado(conv, usuario)` (línea 111) y reparte
  con `planDia()` (línea 148).
- El `order by random()` **solo sobrevive como red de seguridad**: `siguiente_actividad_test()` en la
  línea 198, con el comentario "Fallback", para que el usuario nunca se quede sin pregunta si algo
  falla.

Importa porque la nota es el **punto de arranque** del Code de la app: tal cual estaba, lo primero
que haría ese agente es reimplementar un selector que ya existe y funciona. **He corregido el punto
en la propia nota**, tachado y firmado con quién y cuándo lo corrigió, para que Cowork vea el cambio
en vez de encontrárselo silenciado. Y he dejado dicho lo que **sí** sigue abierto de ese frente: el
horizonte del planificador está fijo en 180 días porque `convocatoria` no guarda fecha de examen.

También arreglé una comilla invertida sin cerrar (`` `.gitignore ``) que se comía media frase al
renderizar el markdown.

## 4. El resto de la nota, contrastado

Lo demás lo di por bueno tras cruzarlo con lo que verifiqué en esta sesión:

- **2.634 conceptos · 2.542 servibles · 56 en cola · 0 islas** — coincide.
- **Corpus BOE-600 52/52** — coincide.
- **Los 4 temas que faltan (19, 20, 24, 45)** — los detecté yo en el PROMPT_017; correcto.
- **El aviso del corpus (§3 de la nota)** — es el mío del RESULTADO_018; correcto.
- **`ADMIN_TOKEN` ya fijado en Vercel** — me lo confirmó Jonathan. **Aviso práctico que la nota no
  recoge:** las variables de Vercel solo se aplican a **despliegues nuevos**; si se fijó después del
  último deploy, `/admin` sigue dando 404 hasta redesplegar. Y `/admin` de V2 **no está en
  `acertium.es`** —ese dominio es V1— sino en el proyecto `acertium-v2`, que además está detrás del
  SSO de Vercel.

## Pendientes / notas

- **Causa del lock huérfano, identificada:** el `push` de una sandbox sin credenciales de GitHub.
  Si Cowork va a seguir commiteando en local, o se le dan credenciales o conviene que no intente
  `push` y deje siempre el empujón a Code (que es lo que hace este encargo).
- El resto de pendientes vivos siguen siendo los de la nota: generar los temas 19, 20, 24 y 45 (solo
  desde el PC mientras el corpus no esté versionado), aprobar las 56 de consenso, y la lista de
  calidad de los RESULTADO_016/017.
