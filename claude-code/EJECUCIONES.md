# Registro de ejecuciones (Claude Code)

Bitácora de las sesiones de agente sobre AcertiumV2: qué se tocó, qué se
verificó y qué quedó pendiente. Una entrada por sesión, la más reciente arriba.

---

## 2026-08-03 — PROMPT_001: protección internacional + el motor decidiendo en /practicar

**Encargo.** Primer encargo por el canal `claude-code/` (ver `README.md`):
`PROMPT_001.md`, agrupado en seis partes. Resultado detallado en
**`RESULTADO_001.md`**; aquí queda el resumen para la bitácora.

### Qué se hizo

1. **Tres lotes de Tema 12 cargados en producción** (APAT 34, PTEMP 37, ACOG 58
   = **129 conceptos y 129 preguntas**). Registradas antes las familias PTEMP y
   ACOG. Las tres puertas en verde, 0 rechazos, sesgo de longitud 21/24/26 %.
   Aserciones post-carga e integridad: **0 filas** en las cinco.
2. **14 enlaces cruzados** hacia ASIR con ids reales; ninguno a
   `remision_pendiente`.
3. **El profesor enchufado al selector.** `/practicar` deja el `order by
   random()`: nueva migración con `practicar_estado()` y
   `actividad_de_concepto()`, y `siguienteActividad()` reescrita para usar
   `planDia` del planificador y `absorcion` del motor — sin reimplementar el BKT.
4. **Manifiesto de cobertura autoactualizable**: `marcarCobertura()` en
   `cargar.mjs`, llamado desde `generar.mjs`. §27/§28/§29 a ✓.
5. Contratos de generación/calidad commiteados (Capa 2 obligatoria).
6. **6 temporales borrados** (los 3 del encargo y 3 más del mismo tipo).

### Verificación

- `npm run build` → ✅.
- **Selector: 12/12** en una simulación con el núcleo real sobre un universo con
  la forma del real (1255 conceptos, cadena de gating de 109). Lo relevante: los
  flojos salieron 2395 veces frente a **0** los dominados en 4000 tiradas; un
  dominado cae de 0,972 a 0,167 de absorción en 120 días y vuelve a `consolidar`;
  el último eslabón de la cadena de gating acaba saliendo; con todo dominado
  sigue sirviendo pregunta.
- Coste: **0,66 ms** la decisión en JS, **11,3 ms** la consulta en base
  (`explain analyze` sobre producción).

### Ajustes propios

- El contador del índice venía desviado: decía «36 de 53» con 35 ✓ en la tabla, y
  contaba §1 (Introducción) como norma. Ahora se recalcula de la tabla: **38 de
  52**.
- Los prerrequisitos que apuntan fuera del universo practicable se descartan en
  el selector; si no, bloquearían a su dependiente para siempre.

### Pendientes / notas

- **Los enlaces a ASI «por descripción» no se hicieron: el PROMPT no traía la
  lista.** ASI sigue sin aristas desde las familias nuevas.
- El horizonte del planificador es fijo (180 días): `convocatoria` no guarda
  fecha de examen.
- El manifiesto se marca al **emitir** el SQL, no cuando la base confirma.
- Sin verificación visual: no se ha abierto `/practicar` para ver qué sirve.
- `npm run test:motor` sigue pasando en vacío en Windows.
- Apareció `PROMPT_002.md` (y lotes de otro agente) durante la ejecución; **no
  se han tocado**. Queda pendiente de disparar.

---

## 2026-08-03 — Reporte colaborativo, fase 1: "Mejorar esta pregunta" en todas

**Encargo.** Unificar el reporte de preguntas en un componente compartido y
ponerlo en todas las preguntas (práctica, examen y revisión del simulacro).

### Qué entra

**Nuevos**

- **`lib/reporte-actions.ts`** — server action compartida `accionReportar`, que
  envuelve `reportar()` del cerebro. Así práctica y simulacro (y lo que venga)
  usan la misma, sin arrastrar el cliente service-role al navegador.
- **`components/reporte-boton.tsx`** — `ReporteBoton` cliente reutilizable, con
  copy colaborativo: "Mejorar esta pregunta", motivos en lenguaje llano ("Hay un
  dato incorrecto", "Una opción está mal planteada", "La fuente no cuadra") y
  agradecimiento cálido al enviar. Prop `variant`: `"icono"` (banderita, por
  defecto) o `"enlace"` (texto, para la revisión).

**Modificados**

- `app/(app)/practicar/practica-runner.tsx` — usa el componente compartido; se
  borra la copia local (~170 líneas) y la constante `MOTIVOS`.
- `app/(app)/practicar/actions.ts` — fuera `accionReportar` y los imports que se
  quedaban sin uso (`reportar`, `MotivoReporte`).
- `lib/simulacro-formato.ts` — `DetallePregunta` gana `conceptoId`, que el
  reporte necesita desde la revisión.
- `lib/simulacro-data.ts` — `corregirSimulacro` lo rellena.
- `app/(app)/simulacro/simulacro-runner.tsx` — `ReporteBoton` junto al enunciado
  del examen (icono) y en cada ítem de la revisión (enlace).

### Ajuste propio — un fallo real, no cosmético

En `corregirSimulacro` el detalle hace `conceptoId: info?.conceptoId ?? ""`.
Comprobado contra producción: `acertium_v2.reporte.concepto_id` es `text` **con
FK a `concepto(id)`**, así que un `""` viola la clave ajena; y `reportar()` hace
`throw` si el insert falla. Como el envío ocurre dentro de un `useTransition`
sin `catch`, el usuario vería el botón sin que pasara nada.

Añadido un guard en la revisión: el botón solo se pinta si `d.conceptoId` no
está vacío. Solo ocurre si la actividad ya no existe al corregir, pero el coste
del guard es una línea.

### Verificación

- `npm run build` → ✅ antes y después del guard (Next 16.2.6, TypeScript OK).
- Comprobado en producción que la tabla `reporte` acepta lo que el botón manda:
  columnas `actividad_id` (uuid, FK), `concepto_id` (text, FK), `motivo` (text,
  NOT NULL), `comentario` (text), `contexto` (jsonb), `estado` (text). **No hay
  CHECK sobre `motivo`**, así que los cuatro valores del enum de TypeScript
  entran sin problema.
- El import de `MotivoReporte` en el componente cliente es `import type`, se
  borra al compilar y no arrastra `server-only` al navegador (el error que rompió
  el build al portar el simulacro).

### Pendientes / notas

- **Nadie lee los reportes todavía.** Se insertan con `estado: 'abierto'` y no
  hay panel ni consulta que los revise. La fase 1 recoge señal; hace falta algo
  que la explote.
- El reporte no guarda `usuario_id` aunque la columna existe: `reportar()` no lo
  envía. Con login habría que rellenarlo.
- Sin verificación visual: build y tipos. No se ha abierto el modal en ejecución
  ni se ha enviado un reporte de prueba.

---

## 2026-08-03 — Mapa de preguntas con el isotipo, tercer modo de simulacro y copy

**Encargo.** Tres ajustes del simulacro. También se pidió arrastrar los cambios
previos de `motor-bkt.mjs`, `lib/cerebro.ts` y `practica-runner.tsx` si seguían
sin commitear: **ya estaban en `26e5ccd`**, el árbol solo tenía lo nuevo.

### Qué cambia

1. **`lib/simulacro-formato.ts`** — `PREGUNTAS_MEDIO = 50` y
   `SEGUNDOS_MEDIO = 25 * 60` (25:00). Mantiene la cadencia de 30 s/pregunta de
   los otros modos.
2. **`app/(app)/simulacro/simulacro-runner.tsx`**
   - `IsotipoAcertium`: port fiel de `marca/assets/acertium-symbol.svg` (mismo
     viewBox 0 0 64 64, mismos círculos, mismo path y grosores); lo único que
     cambia es el `stroke`, que pasa a `currentColor` para heredar el color del
     botón.
   - Botón central con ese isotipo entre "Atrás" y "Siguiente" que abre el mapa
     de preguntas (`setMostrarNav(true)`).
   - Eliminado el botón "Preguntas · X/N" de la barra superior, que ahora solo
     lleva "Abandonar".
   - Tercer modo `"medio"`: tipo `Modo`, ramas en `empezar()` (slice a 50 y
     `SEGUNDOS_MEDIO`) e Intro reordenada Rápido·25 / Medio·50 / Completo·100,
     con "Medio" deshabilitado si el banco no llega a 50.
3. **`app/(app)/hoy/page.tsx`** — subtítulo de la tarjeta de simulacro:
   "Elige 25, 50 o 100 preguntas, cronometrado como el examen real."

### Verificación

- `npm run build` → ✅ (Next 16.2.6, TypeScript OK).
- Comprobado que el isotipo del componente coincide de verdad con el SVG de
  marca al que dice referirse (no es una referencia inventada).
- `respondidas` no queda huérfana al quitar el botón de la barra: se sigue
  usando en el aviso de finalizar.
- Consultada la base de producción: **1139** actividades verificadas tipo test
  de la convocatoria PN. Los tres modos tienen material de sobra y la copy de
  "25, 50 o 100" es exacta (con menos de 100 preguntas, "Completo" mostraría el
  total real y la tarjeta de /hoy prometería de más).

### Pendientes / notas

- Sin verificación visual: build y tipos. No se ha visto ni el botón del isotipo
  ni la intro de tres modos en ejecución.
- Sigue pendiente de entradas anteriores: el guard de los self-tests del núcleo
  no funciona en Windows (`npm run test:motor` pasa en vacío).

---

## 2026-08-03 — Corrección más limpia, guess a 1/3 y `responder()` autocorrectivo

**Encargo.** Tres ajustes sueltos: quitar el "Era: …" del panel de corrección,
ajustar el guess del BKT al formato de 3 alternativas y recuperar el
comportamiento autocorrectivo cuando no hay caché de estado.

### Qué cambia

1. **`app/(app)/practicar/practica-runner.tsx`** — el panel muestra solo
   "Correcto." / "Incorrecto."; se deja de pintar `Era: {correcta}`, porque la
   opción correcta ya se resalta en la lista. `resultado.correcta` sigue en los
   datos y se sigue usando para ese resaltado, así que no queda huérfano.
2. **`nucleo/motor-bkt.mjs`** — `pGporFormato('test')` pasa de `0.25` a `1/3`.
   Desde el cambio al formato oficial se sirven 3 alternativas, así que acertar
   por azar es 1/3 y el motor ya no sobreinterpreta los aciertos. (Era el
   pendiente anotado en la entrada anterior.)
3. **`lib/cerebro.ts`** — `responder()` vuelve a ser autocorrectivo, pero solo en
   el camino frío: **con** caché sigue incremental (rápido, el caso común);
   **sin** caché reconstruye el estado desde el log del concepto, de modo que si
   la fila de `estado_dominio` falta o se borra ya no se pierde el progreso.
   Barato, porque sin caché el historial suele ser mínimo. (También era pendiente
   de la entrada anterior.)

### Ajuste propio

El comentario de `lib/cerebro.ts` que enumera los guess decía "test 0.25";
actualizado a "test 1/3" para que no contradiga al motor.

### Verificación

- `npm run build` → ✅ (Next 16.2.6, TypeScript OK).
- **`npm run test:motor` no ejecuta nada en Windows.** Los self-tests del núcleo
  están dentro de un guard ``import.meta.url === `file://${process.argv[1]}` ``
  que nunca se cumple en Windows (`import.meta.url` es
  `file:///C:/...` con la ruta escapada; `process.argv[1]` es una ruta con `\`).
  El comando sale con código 0 **sin correr una sola aserción**: pasa en vacío,
  no pasa de verdad.
- Como el cambio 2 toca un parámetro del motor, hice una comprobación aparte (en
  scratchpad, no versionada): `pGporFormato` devuelve 1/3 · 0.50 · 0.05 · 0.20;
  un acierto sube `L` y un fallo la baja; y el mismo acierto con guess 1/3 deja
  `L = 0.4925` frente a `0.5526` con 0.25 — es decir, informa menos, que es
  justo el efecto buscado. 8/8.

### Pendientes / notas

- **Arreglar el guard de los self-tests del núcleo** para que `test:motor` sirva
  en Windows (`pathToFileURL(process.argv[1]).href`). Hoy da una falsa sensación
  de verde.
- `nucleo/planificador.mjs:90` fija `pG = 0.25` — pero está **dentro del
  self-test**, es el simulador sintético, no lógica de producción. No lo he
  tocado; si se quiere que la simulación refleje el formato real, ahí habría que
  poner 1/3 también.
- `docs/004-estructura-de-datos.md:145` sigue documentando `p_G=0.25` como
  parámetro global del MVP. No lo he tocado: es un documento de diseño y el
  cambio es por formato de actividad, no del parámetro global.
- La reconstrucción sin caché replica los eventos históricos con `tipo: "test"`
  fijo (no consulta el tipo real de cada actividad, que costaría otro viaje).
  Hoy es exacto porque el banco solo sirve tipo test.
- Sin verificación visual: build, tipos y la comprobación del motor. La pantalla
  no se ha visto en ejecución.

---

## 2026-08-03 — BKT incremental: `responder()` de ~7 viajes a la base a 3

**Encargo.** Optimizar la latencia de la verificación en `/practicar`.

### Qué cambia

- **`lib/cerebro.ts`** — `responder()` ya no recomputa el BKT recorriendo TODO el
  log del concepto (leía `evento` completo + los tipos de todas las actividades
  implicadas, y reproducía la secuencia entera). Ahora es **incremental**: lee el
  `estado_dominio` cacheado —o el estado inicial si no hay— y aplica solo la
  respuesta actual. Además agrupa las lecturas (concepto + fuente + estado) en un
  `Promise.all` y las escrituras (evento + estado) en otro. Quedan 3 pasos
  secuenciales: actividad → 3 lecturas en paralelo → 2 escrituras en paralelo.
- **`app/(app)/practicar/practica-runner.tsx`** — indicador "Comprobando…" con
  `SpinnerOrbita` bajo las opciones, reutilizando el `mostrarSpinner` que ya
  deriva de `useRetardoCarga`: solo aparece si la verificación supera 300 ms.

### Ajuste propio

El diff fijaba `tipo: "test"` a mano en la llamada al motor. Ese valor determina
el `guess` del BKT (`pGporFormato`: test 0.25, vf 0.50, huecos/corta 0.05), y
antes se leía de la actividad de cada evento. Ahora se pide `tipo` en el `select`
de `actividad` que ya se hacía —cero viajes extra— y se usa `act.tipo ?? "test"`.
Hoy es siempre `test` (el banco solo sirve tipo test), pero así no se rompe en
silencio si algún día entra otro formato.

### Verificación

`npm run build` → ✅ (Next 16.2.6, TypeScript OK).

### Pendientes / notas — leer antes de dar por buena la nota

- **El cambio no es equivalente al anterior, es una aproximación.** El recálculo
  completo era autocorrectivo: si `estado_dominio` estaba desfasado o la fila no
  existía, se regeneraba desde el log. El incremental **arrastra el error**: si
  falta la fila (cache borrada, concepto con historial anterior a la caché), se
  parte del estado inicial y se pierde todo el historial de ese concepto en la
  absorción mostrada. El log de `evento` sigue siendo la fuente de verdad, así
  que un recálculo de reconciliación es posible — **pero no existe todavía**.
  Convendría un job o un `recomputarConcepto()` para eso.
- **`guess` de 0.25 con 3 alternativas.** `pGporFormato('test')` devuelve 0.25,
  que corresponde a 4 opciones. Desde el cambio al formato oficial se sirven 3,
  así que el acierto por azar es 1/3, no 1/4. El motor está siendo algo optimista
  al interpretar los aciertos. Es anterior a este cambio y no lo he tocado: es
  una decisión de modelado.
- Sin verificación visual ni medición real de la mejora: solo build y tipos. No
  he cronometrado `responder()` antes y después.

---

## 2026-08-03 — Anti-parpadeo del spinner de "Siguiente"

**Encargo.** Conectar `useRetardoCarga` al botón "Siguiente" de `/practicar`.

Cambio de una línea efectiva en
`app/(app)/practicar/practica-runner.tsx`: el `SpinnerOrbita` pasa de mostrarse
con `pending` a mostrarse con `mostrarSpinner = useRetardoCarga(pending)`, es
decir, solo si la espera supera 300 ms. Misma especificación que el
`antiParpadeo` de `PantallaCarga`, ahora también en JS.

`disabled={pending}` **no** cambia: el botón se bloquea en el mismo instante del
clic, solo se retrasa el indicador visual. En una carga rápida el usuario ve
"Siguiente" atenuado un momento y nunca aparece el spinner.

Con esto `hooks/useRetardoCarga.ts` deja de ser código muerto (era el pendiente
que quedó anotado en la entrada anterior).

### Verificación

`npm run build` → ✅ a la primera (Next 16.2.6, TypeScript OK).

### Pendientes / notas

- Sigue sin verificación visual: solo build y tipos. El umbral de 300 ms no se
  ha comprobado con latencia real de `responder()`.

---

## 2026-08-03 — Pantalla de carga V1→V2 y latencia percibida en practicar

**Encargo.** Commitear y desplegar los indicadores de carga de marca portados de
V1 y la mejora de latencia de `/practicar`.

### Qué entra

- **`components/spinners.tsx`** (nuevo) — fuente única del SVG de los dos
  indicadores, ambos con la diana concéntrica de la marca y el verde vía
  `var(--color-primary)` (se adapta a claro/oscuro sin JS):
  `SpinnerTrazo` (el check se dibuja en bucle, para pantalla completa) y
  `SpinnerOrbita` (un aro gira alrededor de la diana quieta, para inline).
- **`components/pantalla-carga.tsx`** (nuevo) — wrapper centrado; con
  `antiParpadeo` retrasa la aparición 300 ms.
- **`hooks/useRetardoCarga.ts`** (nuevo) — misma regla de 300 ms para estados de
  carga en JS.
- **`app/(app)/loading.tsx`** y **`app/(app)/practicar/loading.tsx`** (nuevos) —
  fallback de navegación de Next con `antiParpadeo`.
- **`app/globals.css`** — animaciones `.trazo-check`, `.carga-pantalla` y
  `.orbita-arco`, más un bloque `prefers-reduced-motion` que las ralentiza en
  vez de detenerlas (siguen comunicando espera, sin parpadeo brusco).
- **`app/(app)/practicar/practica-runner.tsx`** — la opción tocada se resalta al
  instante mientras el servidor corrige (quita la sensación de "tarda en
  marcar"), y el botón "Siguiente" muestra `SpinnerOrbita` en vez de "…".
- **`lib/cerebro.ts`** — `responder()` lanza las lecturas del panel (concepto +
  fuente) en paralelo con el registro del evento y el recálculo BKT; no dependen
  de ellos, así que salen del camino crítico.

### Ajuste propio

`tsconfig.json`: `hooks/**` no estaba en `include`, así que
`useRetardoCarga.ts` no lo revisaba el type-check. Añadidos `hooks/**` y
`components/**/*.ts`.

### Verificación

`npm run build` → ✅ a la primera (Next 16.2.6, TypeScript OK) y de nuevo tras
tocar el tsconfig. Comprobado que `--color-primary-soft` y `--color-primary-dark`
(usadas en la marca instantánea) existen en `globals.css` en claro y oscuro.

### Pendientes / notas

- **`hooks/useRetardoCarga.ts` no lo usa nadie todavía.** Compila y está
  versionado, pero de momento es código muerto: los `loading.tsx` resuelven el
  anti-parpadeo por CSS (`.carga-pantalla`). Queda ahí para los estados de carga
  en JS que aún no lo aplican (p. ej. el botón "Siguiente", que hoy muestra el
  spinner desde el primer milisegundo).
- No lleva `"use client"`: correcto mientras solo lo importen componentes
  cliente; si algún día lo importa un componente servidor, fallará el build.
- Sin verificación visual: solo build y tipos. Las animaciones no se han visto
  en ejecución.

---

## 2026-08-03 — Cierre de pendientes: examen a 3 alternativas + limpieza del generador

**Encargo.** Revisar el árbol de trabajo, separar los cambios legítimos de los
ficheros temporales que habían dejado varios agentes, dejar el build verde y
subir a `main`.

### 1. Cambios de la app (formato examen oficial PN)

- `lib/cerebro.ts` — `siguienteActividad()` pasa a usar el RPC
  `acertium_v2.siguiente_actividad_test()` (`order by random() limit 1` en la
  base, en vez de descargar el banco entero y elegir en memoria) y reduce las 4
  opciones guardadas a **correcta + 2 distractores**, barajadas. `responder()`
  recibe ahora `textoElegido: string` y corrige **por texto**; devuelve
  `correctaIndice: null` porque tras barajar el índice del cliente no significa
  nada.
- `lib/simulacro-data.ts` — `iniciarSimulacro()` usa el RPC
  `acertium_v2.simulacro_muestra(conv, n)`; corrección con la fórmula oficial
  `[A − E/(n−1)] × 10 / P` (n = 3), blancos que ni puntúan ni penalizan, y solo
  se emiten eventos al motor por las preguntas contestadas.
- `app/(app)/practicar/actions.ts` y `practica-runner.tsx` — envían el texto
  elegido; el resaltado de la correcta se hace comparando textos.
- `app/(app)/simulacro/simulacro-runner.tsx` — pantalla de intro (modo completo
  100 preguntas / 50 min y modo rápido), cuenta atrás, navegador de preguntas y
  revisión con detalle.

**Arreglo necesario para el build:** el runner es un componente cliente y pasó a
importar *valores* (no solo tipos) de `lib/simulacro-data.ts`, que hace
`import "server-only"` → el build de Next fallaba con
`'server-only' cannot be imported from a Client Component module`. Se extrajo el
formato del examen (constantes + tipos públicos) a **`lib/simulacro-formato.ts`**,
sin acceso a datos; `simulacro-data.ts` lo re-exporta para el código de servidor
que ya lo importaba. Segundo error de tipos: `db.rpc()` devuelve `any`, así que
se describió la fila del RPC con el tipo local `FilaMuestra`.

### 2. Limpieza

Borrados los ficheros de trabajo temporales que dejaron agentes anteriores
(19 en total): `_rev_*.mjs`, `_tmp_gob_data.mjs`, `build_age.mjs`,
`tmp_build_ebep.mjs`, `tmp_gen_ce2.mjs`, los scripts sueltos de Python
(`build_ext.py`, `build2_ext.py`, `data_ext.py` — con rutas `/tmp` y de sesión
codificadas a mano), `lotes/_carga_*_tmp.sql`, `lotes/_ig_part*.sql`,
`rev_prl.json` y `tmp_rev_lopd7.json`. Su salida ya está en `lotes/*.json`.
Intactos los módulos reales del generador.

### 3. Módulo de calidad del generador

Se versionan `verificar-calidad.mjs`, `verificar-meta.mjs`,
`contrato-calidad-preguntas.md`, `auditoria-calidad.sql`,
`asercion-post-carga.sql`, `registro-materias.json`, los cambios en
`generar.mjs` / `cargar.mjs` / `contrato-generacion.md` / `README.md`, los 32
lotes nuevos y `datos/legal-es/boe-600-pn/temario-oficial.md` + las 3 carpetas
de artículos fuente (estatuto de la víctima, seguridad privada, régimen
disciplinario).

### 4. Migraciones

Nuevo `supabase/migrations/20260803120000_funciones_muestreo_aleatorio.sql` con
`siguiente_actividad_test()` y `simulacro_muestra(conv, n)`. **Ya estaban
aplicadas en producción**: el SQL se copió literal de la base con
`pg_get_functiondef`, no se escribió de memoria. Es idempotente
(`CREATE OR REPLACE`).

### Verificación

`npm run build` → ✅ (Next 16.2.6, TypeScript OK, 10 rutas). Los dos fallos
descritos arriba se arreglaron y se volvió a construir hasta verde.

### Pendientes / notas

- `demo-tipos-actividad.html` (raíz) quedó **sin versionar**: no entraba en el
  encargo y parece una maqueta suelta. Si vale, su sitio es `prototipos/`
  (ignorado por `.gitignore`); si no, se puede borrar.
- La app **no se ha probado en ejecución** (solo build + tipos). El formato de
  3 alternativas y la fórmula de corrección conviene verlos con datos reales.
