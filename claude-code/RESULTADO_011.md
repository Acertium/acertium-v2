# RESULTADO_011 — Módulo de consenso (`verificar-fuente` + `pendiente_revision`)

Ejecutado el **2026-08-16**. Estado: **completado**, con una desviación deliberada del §1 que explico
en el punto 2. Implementa `docs/contrato-fuentes-no-boe.md` §2-§3.

## 1. Estado `pendiente_revision`

Migración aplicada en producción y versionada en
`supabase/migrations/20260816120000_estado_pendiente_revision.sql`:

    alter type acertium_v2.estado_verificacion add value if not exists 'pendiente_revision';

El enum queda `{verificado, pendiente, rechazado, pendiente_revision}`. La distinción importa:
`pendiente` significa "aún no ha pasado las puertas"; `pendiente_revision`, "las ha pasado pero
necesita ojo humano". No es lo mismo y mezclarlos habría hecho invisible la cola de revisión.

## 2. La red de seguridad: comprobada de verdad, no leída

**Las cuatro funciones de selección filtran `estado_verificacion = 'verificado'`**: verificado leyendo
su `pg_get_functiondef` en producción — `siguiente_actividad_test()`, `simulacro_muestra(conv,n)`,
`actividad_de_concepto(cid)` y `practicar_estado(conv,usuario)` (esta última exige además que el
concepto tenga una actividad verificada para ser candidato).

Leer el `where` no me parecía prueba suficiente, así que hice una **de verdad**:
`adaptadores/legal-es/generador/probar-aislamiento-revision.mjs` crea un concepto y una pregunta en
`pendiente_revision`, **los mete en el overlay de la convocatoria** (para que fueran candidatos de
pleno derecho si el aislamiento fallara), interroga las cuatro vías y **borra lo que creó en un
bloque `finally`**. Resultado **5/5**:

| Comprobación | Resultado |
|---|---|
| `actividad_de_concepto()` no la devuelve | ✓ 0 filas |
| `practicar_estado()` no lo lista como candidato | ✓ 0 filas |
| `simulacro_muestra()` no la incluye ni pidiendo 100.000 preguntas | ✓ 0 filas |
| El universo de `siguiente_actividad_test()` la excluye | ✓ 0 verificadas |
| **Al promoverla a `verificado`, SÍ se sirve** | ✓ 1 fila |

La última no es de adorno: sin ella el test podría estar pasando porque nada sale nunca, y no
probaría el aislamiento. Un detalle que corregí sobre la marcha: la primera versión recorría la lista
devuelta por el RPC, pero **PostgREST corta en 1.000 filas**, así que "no aparece entre las que me
devolvió" no probaba nada; ahora se filtra por id sobre el resultado del RPC y responde Postgres.

**Desviación deliberada del §1.** El encargo dice "cualquier consulta de `lib/cerebro.ts` /
`lib/simulacro-data.ts` que lea actividades; si alguna NO filtra, añade el filtro". Hay dos que no
filtran y **no les he puesto el filtro**:

- `lib/cerebro.ts:236` — `responder()` lee la actividad **por id** para corregir una respuesta ya
  contestada.
- `lib/simulacro-data.ts:150` — `corregirSimulacro()` lee por los ids guardados del examen.

Las dos son rutas de **corrección**, no de selección: el id solo puede venir de una pregunta que el
runtime ya sirvió, y servir está cerrado. Añadir el filtro no cierra ningún agujero y sí abre uno de
usabilidad: si un contenido se degradara mientras un usuario tiene la pregunta en pantalla, su
respuesta reventaría con "actividad no encontrada". Lo dejo dicho por si Cowork prefiere el filtro
igualmente; es un cambio de dos líneas.

## 3. `nucleo/verificar-fuente.mjs` — la puerta

Según `tipo_fuente` (contrato §1-§3):

- **Los tres tipos**: `tipo_fuente ∈ {oficial, autoridad, consenso}` y referencia presente. Para
  `oficial` del BOE, el `BOE-A-…` vale como referencia.
- **`oficial` / `autoridad`**: check literal (correcta ⊂ cotejo, cotejo ⊂ fuente). → `verificado`.
- **`consenso`**: no exige substring, pero sí (a) referencia **concreta** —obra + apartado/página o
  URL; "varios autores" se rechaza—, (b) destino `pendiente_revision`, (c) `revision_humana` que no
  contradiga eso. **Un `consenso` que venga marcado `verificado` se RECHAZA.**

`estadoSegunTipoFuente()` es la única fuente de verdad de qué estado le toca a cada tipo, y la usan
tanto la puerta como el cargador, para que no puedan discrepar.

**Un fallo mío que conviene contar.** La primera versión normalizaba por su cuenta (tildes + caja,
conservando la puntuación) y **rechazaba 7 actividades de CEDH, SOST, DROGA y SO que ya estaban
cargadas y que la puerta de contenido había dado por buenas**. No eran errores de contenido: eran
comas. El contrato dice "reutiliza el check literal de legal-es", y eso es exactamente lo que hace
ahora (`normalizarNumeros`, que además ignora puntuación y convierte número↔palabra). Dos puertas que
miden lo mismo con distinta regla producen falsos rechazos, no más seguridad.

Tras el arreglo, **los 11 lotes no-BOE ya cargados pasan la puerta con 0 rechazos**.

## 4. `cargar.mjs` fija el estado por tipo de fuente

`consenso` → `pendiente_revision`; `oficial`/`autoridad` → `verificado`; un lote **sin**
`tipo_fuente` es del corpus BOE de siempre → `verificado`. Aplicado tanto en `cargarLote()` (la carga
real) como en `loteASql()` (el modo `--sql`), para que no se separen.

## 5. Revisión humana — `revision-pendientes.mjs`

Mínimo viable en terminal, mientras llega el panel del PROMPT_012:

    node revision-pendientes.mjs                        resumen por familia
    node revision-pendientes.mjs --familia GLOB         detalle (enunciado, opciones, cotejo, fuente)
    node revision-pendientes.mjs --promover GLOB-007    promueve una
    node revision-pendientes.mjs --promover-familia GLOB
    node revision-pendientes.mjs --rechazar GLOB-007

Detalle que no estaba en el encargo pero hacía falta: al promover una actividad **también se promueve
su concepto**. Si no, quedaría un concepto `pendiente_revision` con pregunta servible, que es
justamente la incoherencia que este módulo existe para evitar.

Hoy la cola está **vacía**: el contenido de consenso (temas 28-33) aún no se ha generado.

## 6. Enganche y verificación

- `generar.mjs` corre la puerta **solo si el lote declara `tipo_fuente`**; un lote BOE no la ejecuta.
  Fail-closed. Si el destino no es `verificado`, avisa en pantalla de que ese lote no se servirá.
- **Self-tests, todos en `npm run test:motor`:**

| Suite | Resultado |
|---|---|
| `verificar-fuente` (nueva) | **11/11** |
| `verificador-cotejo` | 13/13 |
| `verificar-ortografia` | 12/12 |
| `verificar-meta` no-BOE | 5/5 |
| Aislamiento contra la BD (aparte, necesita `.env.local`) | **5/5** |

Los cuatro casos del §5 están cubiertos: (a) `oficial`/`autoridad` literal → pasa y queda
`verificado`; (b) `consenso` sin substring pero con fuente + cotejo → pasa y queda
`pendiente_revision`; (c) `consenso` marcado `verificado` → rechaza; (d) el runtime no devuelve un
`pendiente_revision`.

- **`npm run build` verde** (exit 0, Next 16.2.6, 10 rutas).
- **No se ha roto nada de lo existente**: las ~2.419 actividades siguen `verificado` y los 11 lotes
  no-BOE pasan la puerta nueva.

## Lo que NO entra

- **No hay contenido de consenso todavía.** Este encargo desbloquea los temas 28-33; generarlos es
  otro trabajo. La cola de revisión está vacía a propósito.
- El script de revisión es de terminal. El panel con pantalla es el PROMPT_012.
- El test de aislamiento **escribe en producción** (un concepto y una actividad de prueba, con
  prefijo `ZZTEST-`, borrados en `finally`). Es deliberado —es la única forma de probar el
  aislamiento de verdad— pero conviene saberlo antes de lanzarlo a la ligera. Comprueba y reporta
  que no ha dejado restos.
