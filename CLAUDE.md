# CLAUDE.md — AcertiumV2

## Secretos (.env) — regla innegociable

Ningún agente (Cowork, Code ni subagentes) debe leer, abrir, imprimir, copiar ni volcar el contenido de ficheros de secretos: `.env`, `.env.local`, `.env.*`, ni nada bajo `secrets/`. Ni con la herramienta Read, ni con `cat`/`type`/`Get-Content`, ni con `grep`, ni por ninguna otra vía. Estos ficheros los lee la aplicación en ejecución, no el agente. Para saber qué variables existen, consulta `.env.local.example` o pregunta. Si una tarea parece exigir el valor de un secreto, detente y pídeselo a Jonathan; nunca lo leas tú.

## Reglas de honestidad y precisión (innegociables)

Aplican las 7 reglas globales de Jonathan (montadas en el `~/.claude/CLAUDE.md` global). En corto, y con fuerza redoblada porque esto es contenido **YMYL** (una respuesta mal puede perjudicar a un opositor):

- **No inventes, no alucines, verifica.** Ningún dato normativo, cifra, plazo o definición se afirma sin fuente. Si no puedes fundamentarlo en la fuente, NO lo pongas y dilo.
- **No te fíes ni de la memoria ni de blogs.** Verifica contra la fuente oficial (BOE) o autorizada. Nunca re-verifiques de memoria.
- **Distingue lo verificado de lo que no.** Marca explícitamente lo que no pudiste confirmar.
- **Doble/triple verificación** de cualquier cifra o afirmación antes de darla por buena.

## Qué es AcertiumV2

App **móvil-first** de estudio para oposiciones (piloto: **Policía Nacional, Escala Básica**, convocatoria **BOE-A-2026-15055**). El núcleo es un **"cerebro"** = grafo de conocimiento verificado (conceptos + relaciones tipadas) sobre el que corren un **motor de absorción (BKT con olvido)** y un **planificador/coach**. Next.js en Vercel + Supabase (schema `acertium_v2`). V2 sustituirá a V1 (schema `public` de la misma instancia); **no tocar `public`**.

## Mapa del repo

- `app/` — Next.js (App Router). Pantallas en `app/(app)/`: **hoy, practicar, simulacro, perfil** + FAB "profesor". Lógica de servidor en `lib/cerebro.ts` y `lib/simulacro-data.ts`; cliente service-role scoped a `acertium_v2` en `lib/supabase/cerebro.ts` (**server-only**, nunca desde el navegador).
- `nucleo/` — agnóstico de dominio: `motor-bkt.mjs` (BKT con olvido), `planificador.mjs` (coach), `verificador-cotejo.mjs`, `verificar-lote.mjs`.
- `adaptadores/legal-es/generador/` — pipeline de contenido legal: `contrato-generacion.md`, `contrato-calidad-preguntas.md`, `generar.mjs`, `cargar.mjs`, puertas `verificar-meta.mjs` / `verificar-calidad.mjs`, `registro-materias.json`, `lotes/*.json`, `asercion-post-carga.sql`.
- `datos/legal-es/boe-600-pn/` — corpus fuente (PDFs de las normas), `00-indice.md` (tracker de cobertura, **se automantiene**), `temario-oficial.md` (los 45 temas; usar SIEMPRE para asignar el `tema`, nunca inventar números).
- `docs/` — diseño y planes: `contrato-fuentes-no-boe.md`, `modulo-ortografia.md`, `plan-temas-no-boe.md`, `cobertura-temas-no-boe.md`, Docs 001-006 del motor.
- `claude-code/` — canal Cowork↔Code (protocolo abajo).

## Stack y comandos

- Next.js 16.2.6 · React 19 · Tailwind v4 · Supabase (schema `acertium_v2`, project `vdeuywagomkxbtpvuovm`).
- **Deploy:** push a `main` → Vercel despliega solo. Ejecuta **`npm run build`** (verde) antes de dar por terminado cualquier cambio de app.
- **El runtime del usuario SOLO sirve actividades `estado_verificacion = 'verificado'`.** Nada `pendiente_revision` llega al usuario.

## El cerebro (tablas clave en `acertium_v2`)

`concepto` · `actividad` (tipo test; `opciones` jsonb, `respuesta` jsonb, `cotejo_fuente`, `estado_verificacion`) · `relacion_concepto` (`origen`/`destino`/`tipo` ∈ prerrequisito|desarrolla|limita|remite) · `concepto_fuente` · `estado_dominio` (caché del BKT, recomputable) · `evento` (log de respuestas = **fuente de verdad**) · `reporte` · `simulacro`.

## Reglas de contenido (innegociables)

1. **Grounding.** La opción correcta de cada test es **cita literal** de la fuente (lo verifica `verificar-lote`/cotejo). Nada fuera de la fuente.
2. **Tres puertas fail-closed** por lote: contenido (`verificar-lote`), **metadatos** (`verificar-meta`: familia↔materia↔referencia↔tema contra `registro-materias.json`; añade la familia ANTES de cargar), **calidad** (`verificar-calidad`).
3. **Capa 2 (afinado de distractores) obligatoria** en cada lote: near-miss plausibles; la correcta = la más larga en ≤35 % del lote (la puerta dura corta en 55 %). No se toca nunca la opción correcta.
4. **Interconexión obligatoria:** cada lote lleva `relaciones`; ningún concepto se carga como isla.
5. **Fuentes no-BOE (temas 27-41):** campo `tipo_fuente` ∈ `oficial` | `autoridad` | `consenso`. `oficial`/`autoridad` = cita literal (pueden quedar `verificado`); **`consenso` se carga como `pendiente_revision` y NO se sirve hasta revisión humana**. Ver `docs/contrato-fuentes-no-boe.md`.
6. **Cobertura total del temario**, sin saltar conceptos por frecuencia de examen.
7. **Caducidad / re-verificación:** los datos normativos caducan; re-verificar contra fuente oficial ante cambios de BOE (p. ej. reformas). Nunca re-verificar de memoria ni contra blogs.

## Canal Cowork ↔ Code (`claude-code/`)

Ver `claude-code/README.md`. Cowork deja cada encargo como `PROMPT_NNN.md`; Code ejecuta el pendiente de número más bajo siguiendo este `CLAUDE.md`, escribe `RESULTADO_NNN.md` y añade una entrada a `EJECUCIONES.md`. **Jonathan solo dispara** ("revisa `claude-code` y ejecuta el PROMPT pendiente"); no traslada contenido. Los temporales de agentes llevan prefijo `_ELIMINAR_` y están en `.gitignore` (no se comitean).

## Notas operativas

- El índice `00-indice.md` se automantiene: `marcarCobertura()` en `cargar.mjs` marca ✓ cada norma por su `referencia_boe` al cargar su lote.
- Tras cargar, correr `asercion-post-carga.sql` (debe dar 0 filas).
- Windows: pueden aparecer avisos LF→CRLF (`core.autocrlf`); el contenido se versiona con LF, no afecta.
