# Acertium — Documento 004: Estructura de datos del MVP

> El esquema concreto sobre el que se construye. Traduce las 8 capas (Doc 001-003) a tablas. Pensado para Postgres (Supabase), pero el diseño es agnóstico de motor.
> Fecha: 2026-08-01 · Estado: diseño para build del MVP.

**Principio rector:** el **log crudo de eventos es la fuente de verdad**. El dominio (`L`, `tau`) es una *caché derivada* que siempre se puede recomputar desde los eventos. Nada que dependa del modelo se guarda sin poder regenerarse. Esto evita el lock-in (Doc 003·C).

---

## Capa 1 — Base canónica (por materia)

**El concepto es la unidad atómica y su relación con los artículos es muchos-a-muchos** (la "red neuronal"): un concepto puede apoyarse en varios artículos, y un artículo puede alimentar varios conceptos. Por eso la fuente NO vive dentro del concepto, sino en la tabla puente `concepto_fuente`.

### `concepto`
| campo | tipo | nota |
|-------|------|------|
| `id` | text (PK) | p.ej. `CE-TP-003` |
| `materia` | text | `constitucion-espanola` — **materia, no oposición** |
| `titulo` | text | etiqueta corta y buscable |
| `resumen` | text | 1-2 frases en llano |
| `estado_verificacion` | enum | `verificado` \| `pendiente` \| `rechazado` |
| `created_at` | timestamptz | |

### `concepto_fuente` (grounding concepto↔artículo, **N:M**)
| campo | tipo | nota |
|-------|------|------|
| `concepto_id` | text (FK→concepto) | |
| `norma` | text | `Constitución Española` |
| `articulo` | text | `art. 1.3` |
| `referencia_boe` | text | `BOE-A-1978-31229` |

> PK compuesta (`concepto_id`, `norma`, `articulo`). **Varias filas por concepto** = concepto que abarca varios artículos. **Varias filas con el mismo (`norma`,`articulo`)** = artículo que alimenta varios conceptos. Índice en (`norma`,`articulo`) para consultar "qué conceptos toca este artículo".

### `relacion_concepto` (grafo tipado concepto→concepto — la "red neuronal")
| campo | tipo | nota |
|-------|------|------|
| `origen` | text (FK→concepto) | |
| `destino` | text (FK→concepto) | |
| `tipo` | enum | `prerrequisito` \| `desarrolla` \| `limita` \| `remite` |
| `fuente` | text | provenance: `curada` o `remisión art. N` |

> PK (`origen`, `destino`, `tipo`); `check (origen <> destino)`. Semántica de los tipos: **prerrequisito** (para A hay que saber antes B), **desarrolla** (A concreta B), **limita** (A limita/suspende B), **remite** (el texto de A cita el artículo de B — nivel artículo, poblado automáticamente). `remite` es objetivo (sacado del texto); los otros tres son curados.

### `remision_pendiente` (aristas a artículos aún no cargados)
| campo | tipo | nota |
|-------|------|------|
| `origen` | text (FK→concepto) | |
| `norma_destino` | text | |
| `articulo_destino` | text | p.ej. `art. 161` |
| `tipo` | enum | por defecto `remite` |

> Cuando una remisión apunta a un artículo no segmentado (otro título/norma), no se crea arista rota: se guarda aquí y **se resuelve sola al cargar ese artículo**. El grafo se teje más denso según crece el cerebro.

---

## Capa 2 — Overlay de convocatoria (por oposición)

### `convocatoria`
| campo | tipo | nota |
|-------|------|------|
| `id` | text (PK) | `policia-nacional-2026` |
| `nombre` | text | `Policía Nacional — Escala Básica` |
| `oposicion` | text | `policia-nacional` |

### `overlay_entrada` (qué concepto entra, en qué tema, con qué peso)
| campo | tipo | nota |
|-------|------|------|
| `convocatoria_id` | text (FK→convocatoria) | |
| `concepto_id` | text (FK→concepto) | |
| `tema` | text | `Tema 1 — La Constitución` (**de ESTA oposición**) |
| `peso` | real | importancia en examen; para el planificador |

> PK compuesta (`convocatoria_id`, `concepto_id`). Mismo concepto canónico puede estar en varias convocatorias con `tema`/`peso` distintos.

---

## Capa 3 — Pool de actividades

### `actividad`
| campo | tipo | nota |
|-------|------|------|
| `id` | uuid (PK) | |
| `concepto_id` | text (FK→concepto) | de qué concepto cuelga |
| `tipo` | enum | `test` \| `huecos` \| `vf` \| `corta` |
| `enunciado` | text | |
| `opciones` | jsonb | array (para `test`/`vf`); null en otros |
| `respuesta` | jsonb | correcta(s) |
| `justificacion` | text | por qué, con cita literal del artículo |
| `cotejo_fuente` | text | texto literal contra el que se verificó |
| `estado_verificacion` | enum | `verificado` \| `pendiente` \| `rechazado` |
| `created_at` | timestamptz | |

> Solo se sirven filas `estado_verificacion = verificado` (guarda de salida, Doc 001 §6b·2).

---

## Capa 4 — Usuario, eventos y estado

### `usuario`
| campo | tipo | nota |
|-------|------|------|
| `id` | uuid (PK) | |
| `email` | text | mínimo imprescindible (RGPD: minimización) |
| `created_at` | timestamptz | |

### `evento` — **la fuente de verdad** (log crudo, append-only)
| campo | tipo | nota |
|-------|------|------|
| `id` | uuid (PK) | |
| `usuario_id` | uuid (FK→usuario) | |
| `concepto_id` | text (FK→concepto) | denormalizado para recomputar rápido |
| `actividad_id` | uuid (FK→actividad) | |
| `fecha` | timestamptz | el `t` del motor |
| `acierto` | boolean | |
| `tiempo_respuesta_ms` | integer | señal futura (dificultad, confianza) |

> Nunca se actualiza ni se borra fila a fila; solo se inserta. Borrar un usuario = borrar sus filas (RGPD trivial).

### `estado_dominio` — **caché derivada** (recomputable desde `evento`)
| campo | tipo | nota |
|-------|------|------|
| `usuario_id` | uuid (FK→usuario) | |
| `concepto_id` | text (FK→concepto) | |
| `L` | real | P(dominado) |
| `tau` | real | estabilidad (días) |
| `last_seen` | timestamptz | |
| `updated_at` | timestamptz | |

> PK compuesta (`usuario_id`, `concepto_id`). Si se cambian los parámetros del motor, se **regenera** desde `evento`. No es fuente de verdad.

### `plan_estudio` (input del planificador, Doc 003·B)
| campo | tipo | nota |
|-------|------|------|
| `usuario_id` | uuid (PK, FK→usuario) | |
| `convocatoria_id` | text (FK→convocatoria) | qué se prepara |
| `examen_fecha` | date | |
| `dias_semana` | integer | disponibilidad |
| `min_sesion` | integer | disponibilidad |
| `objetivo` | real | opcional (p.ej. 0.85) |

---

## Parámetros del motor (Doc 003·A.6)

En el MVP son **globales**, así que viven en config del código, no en tabla (un solo juego para todos): `p_L0=0.20, p_T=0.15, p_S=0.10, p_G=0.25, tau0=1día, objetivo=0.90`. Cuando se pase a por-concepto, se añade una tabla `parametros_concepto`. **No** se crea todavía (principio: ¿acerca al MVP?).

---

## Qué se construye "de verdad" en el MVP vs. stub

| Capa | MVP real | Stub / mínimo |
|------|----------|---------------|
| 1 Base canónica | ✅ Constitución completa segmentada | — |
| 2 Overlay convocatoria | — | 🟡 una fila por concepto con `tema`+`peso` a mano (PN) |
| 3 Pool actividades | ✅ generadas + auto-verificadas | — |
| 4 Datos usuario | ✅ `evento` + `estado_dominio` | 🟡 `usuario` sin auth real todavía |
| 5 Pipeline ingesta | ✅ segmentación + generación + verificación | — |
| 6 Motor absorción | ✅ BKT + olvido (~100 líneas) | — |
| 7 Planificador | — | 🟡 regla de tres (nuevos/día) + repasos vencidos |
| 8 UI / panel | ✅ practicar + ver absorción | 🟡 sin gamificación |

El corazón que hay que hacer bien: **1, 3, 5, 6**. Lo demás arranca como stub y crece después.

---

## Decisión pendiente (para el build)

**Motor de almacenamiento.** Acertium V1 usa **Supabase (Postgres)** + Vercel. Lo natural es reutilizar ese stack para V2 (mismo Postgres, RLS por usuario para el aislamiento de datos, todo el esquema de arriba es Postgres directo). Confírmame si V2 va sobre el mismo Supabase/Vercel o quieres separarlo, y con eso arranco las migraciones (tablas capa 1→4) y sembramos la Constitución como primer asset canónico.
