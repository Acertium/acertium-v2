# RESULTADO_001 — Contenido protección internacional + el profesor enchufado al selector

Ejecutado el **2026-08-03**. Encargo: `PROMPT_001.md`. Estado: **completado**, con
tres salvedades anotadas al final (§ Lo que NO se pudo hacer).

---

## 1. Tres lotes de protección internacional (Tema 12) — CARGADOS

Añadidas al `registro-materias.json` las familias **PTEMP** y **ACOG** (APAT ya
estaba). Cada lote pasó las tres puertas antes de emitir SQL:

| Lote | Familia | Puerta de contenido | Sesgo de longitud | Meta |
|---|---|---|---|---|
| `rd-865-2001-apatrida.json` | APAT | 34 conceptos · 34 actividades · 30 relaciones · **0 rechazos** | **21 %** | ✓ |
| `rd-1325-2003-proteccion-temporal.json` | PTEMP | 37 · 37 · 36 · **0 rechazos** | **24 %** | ✓ |
| `rd-220-2022-acogida.json` | ACOG | 58 · 58 · 54 · **0 rechazos** | **26 %** | ✓ |

Los tres por debajo del 35 % que fija el estándar de Capa 2 (y del 55 % de la
puerta). Avisos informativos de «cifras ajenas a la fuente» en 17 explicaciones:
son avisos, no rechazos, y corresponden a números del propio contexto normativo.

**Cargado en producción** (proyecto `Acertium-prod`, schema `acertium_v2`) y
verificado contra la base:

| Familia | conceptos | fuentes | actividades | overlay | relaciones |
|---|---|---|---|---|---|
| APAT | 34 | 34 | 34 | 34 | 30 |
| PTEMP | 37 | 37 | 37 | 37 | 36 |
| ACOG | 58 | 58 | 58 | 58 | 54 |

**129 conceptos y 129 preguntas nuevas.** El banco verificado tipo test de la
convocatoria PN pasa de 1139 a **1268**.

### Aserciones post-carga e integridad — todas a 0 filas

| Comprobación | Filas |
|---|---|
| (a) familia repartida entre dos materias | 0 |
| (b) familia con dos referencias BOE | 0 |
| (c) materia con dos normas | 0 |
| correcta ⊄ opciones (banco entero) | 0 |
| conceptos isla en los lotes nuevos | 0 |

## 2. Enlaces cruzados — 14 aristas, ninguna pendiente

Las 14 aristas del encargo hacia ASIR se insertaron con ids **reales**
(comprobado que los 9 destinos distintos existen: ASIR-004, 007, 009, 016, 017,
018, 024, 025, 028). `fuente = 'curada · enlace cruzado protección internacional'`.
`tipo = remite` salvo `PTEMP-016→ASIR-004` y `PTEMP-018→ASIR-004`, que van como
`prerrequisito` según el encargo.

**Ninguna fue a `remision_pendiente`**: todos los destinos resolvieron.

## 3. EL PROFESOR ENCHUFADO AL SELECTOR — hecho

`/practicar` ya **no** sirve al azar. El motor y el planificador deciden.

**Nueva migración** `supabase/migrations/20260803210000_selector_motor_practica.sql`
(aplicada en producción), con dos funciones:

- `practicar_estado(conv, usuario)` — una fila por concepto candidato (los de la
  convocatoria **con** pregunta verificada) con su peso, su estado BKT cacheado
  (`estado_dominio`: `l`, `tau`, `last_seen`; null si nunca visto) y sus
  prerrequisitos. **Una sola ida y vuelta** para todo el universo: 1255 filas.
- `actividad_de_concepto(cid)` — una pregunta verificada al azar de ese concepto.

**`lib/cerebro.ts`** — `siguienteActividad()` reescrita. NO reimplementa el BKT:
importa `absorcion`/`crearEstado` de `nucleo/motor-bkt.mjs` y **`planDia` de
`nucleo/planificador.mjs`**, que es quien reparte CONSOLIDAR (vencidos, ordenados
por peso × cuánto han decaído) vs AMPLIAR (nuevos con prerrequisitos dominados),
con su reserva anti-inanición y su gating. El selector elige un concepto
respetando esa proporción y sirve una pregunta suya, conservando las 3
alternativas barajadas y el grounding literal.

Dos decisiones que conviene conocer:

- **Prerrequisitos fuera del universo practicable se descartan.** Si un concepto
  depende de otro que aún no tiene pregunta verificada, el gating lo bloquearía
  *para siempre*. Se filtran, y así el dependiente sigue siendo alcanzable.
- **Red de seguridad doble.** Si el plan sale vacío (todo bloqueado y nada
  vencido) se abre la puerta ignorando el gating; y si algo falla en cualquier
  punto, se cae a `siguiente_actividad_test()` (azar). El usuario nunca se queda
  sin pregunta.

### Verificación del selector — 12/12

Simulación con el **núcleo real** (`motor-bkt` + `planificador`) sobre un
universo con la misma forma que el real (1255 conceptos, 109 con prerrequisitos,
incluida una cadena de gating de 109 eslabones):

| Propiedad exigida | Resultado |
|---|---|
| Arranque en frío sirve siempre, y siempre concepto nuevo | ✓ 200/200 |
| Flojos salen MÁS que dominados | ✓ 2395 flojos vs **0** dominados en 4000 tiradas |
| Entran nuevos (reserva anti-inanición) | ✓ 1605 de 4000 |
| Un dominado no desaparece: decae y vuelve | ✓ absorción 0,972 hoy → 0,167 a 120 días, y reaparece en `consolidar` |
| Prereq fuera del universo no bloquea | ✓ servido tras 2691 preguntas |
| Último eslabón de una cadena de gating acaba saliendo | ✓ tras 2325 preguntas |
| Con TODO dominado sigue sirviendo pregunta | ✓ |
| Coste de la decisión | **0,66 ms** con 1255 conceptos |

Coste en base (`explain analyze` real sobre producción): `practicar_estado`
**11,3 ms** de ejecución. Una pregunta = esa consulta + 0,66 ms de decisión +
`actividad_de_concepto`.

## 4. Manifiesto de cobertura — se mantiene solo

- §27, §28 y §29 marcadas **✓ 2026-08-03** con su familia en `00-indice.md`.
- **`marcarCobertura()` nuevo en `cargar.mjs`**, llamado desde `generar.mjs` tras
  emitir el SQL: localiza la norma por `referencia_boe`, la pone a ✓ con fecha y
  familia, y **recalcula la línea de resumen contando la propia tabla**. Probado
  con los tres lotes; es idempotente.
- **Corregido un descuadre que venía de antes:** la cabecera decía «36 de 53
  extraídas» pero la tabla tenía 35 ✓, y contaba §1 (Introducción) como norma
  cuando su Estado es «—». Ahora el contador sale de la tabla: **38 de 52 normas
  extraídas · 13 pendientes · 1 a revisar (§11)**.

## 5. Docs de estandarización — commiteados

`contrato-generacion.md` y `contrato-calidad-preguntas.md` con la Capa 2 como
paso obligatorio, tal cual estaban.

## 6. Limpieza — 6 ficheros

Los 3 del encargo (`_ELIMINAR_puertas.mjs`, `_ELIMINAR_calib.mjs`,
`_ELIMINAR_run-puertas.mjs`) **y 3 más del mismo tipo** que encontré al revisar:
`_verificar_ptemp_tmp.mjs` y `tmp-run-gates.mjs` (ambos con una nota dentro que
pedía borrarlos) y `gate_err.txt` (log de una corrida de puertas).

---

## Lo que NO se pudo hacer / decisiones que conviene revisar

1. **Los enlaces «por descripción» a ASI (Ley 12/2009) no se resolvieron: el
   PROMPT_001 no incluía ninguno.** Dice «hay más enlaces propuestos a ASI por
   descripción», pero no llega la lista. No me los invento. Si Cowork los manda
   en un PROMPT siguiente, se resuelven por artículo o van a
   `remision_pendiente`. **ASI (30 conceptos) sigue sin aristas desde APAT /
   PTEMP / ACOG.**
2. **El horizonte del planificador es un valor fijo (180 días), no la fecha real
   del examen.** La tabla `convocatoria` solo tiene `id`, `nombre` y `oposicion`:
   no hay fecha de examen que leer. Con ese horizonte el planificador nunca entra
   en modo «triaje» ni «consolidación». En cuanto haya fecha, sale de ahí
   (constante `HORIZONTE_DIAS` en `lib/cerebro.ts`).
3. **El manifiesto se marca al emitir el SQL, no cuando la base confirma.**
   `cargar.mjs` no toca la base por diseño (emite SQL que ejecuta el agente), así
   que «cargado con éxito» aquí significa «pasó las tres puertas y se emitió el
   SQL». La comprobación dura sigue siendo `asercion-post-carga.sql`.
4. **Nada de esto se ha visto en ejecución.** `npm run build` verde y la
   simulación del selector con el núcleo real; pero no he abierto `/practicar`
   para ver qué preguntas sirve de verdad.
5. **`npm run test:motor` sigue sin ejecutar nada en Windows** (pendiente de
   entradas anteriores: el guard `import.meta.url === file://${process.argv[1]}`
   nunca se cumple). Pasa en vacío.
6. **Ha aparecido `claude-code/PROMPT_002.md`** mientras se ejecutaba este
   encargo, junto con lotes nuevos de otro agente
   (`lo-9-2021-fronteras-ue`, `rd-2-2006-prl-policia`, `rd-67-2010-prl-age`,
   `reglamento-defensor-pueblo`) y un `_ELIMINAR_check.mjs`. **No los he tocado
   ni commiteado**: no son de este encargo y pueden estar a medias. El 002 queda
   pendiente de disparar.
