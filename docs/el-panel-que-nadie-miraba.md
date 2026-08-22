# El panel que nadie miraba

> 23/08/2026. Pregunta de Jonathan: «¿qué nos queda pendiente para tener el
> cerebro funcionando?».
>
> Respuesta corta: **ya funcionaba**. 3.343 conceptos, 3.434 preguntas, los 45
> temas con contenido, cero conceptos isla, cero conceptos sin pregunta, y la app
> en uso (121 eventos, 4 simulacros). Lo que estaba roto no era el cerebro: era
> lo que se suponía que lo vigilaba.

## Las once barreras, y por qué habían dejado de servir

`infra/barreras.sql` es lo que Doc 005 §2 llama «si algo sale FALLO, la carga NO
se da por buena». Al ejecutarlo:

| barrera | fallos |
|---|---|
| G1 · fuente oficial (referencia_boe) | **463** |
| G5 · ids fuera de convención | **3.087** |
| G6 · conceptos duplicados | **1** |
| G7 · norma citada sin registrar | **60** |

Cuatro rojos de once. Y ahí está el problema real: **una barrera que grita sin
motivo no es una barrera, es un panel que nadie mira**. G1 y G5 llevaban meses
en rojo por defectos suyos, y debajo estaban enterradas G6 y G7.

### G1 (463) — la barrera es anterior al carril no-BOE

Exigía `referencia_boe` a **todas** las fuentes. Pero 18 familias no están en el
BOE por diseño, y el propio `registro-materias.json` las declara con
`referencia_boe: ""`: DUDH, CIBER, INTEL, ORTO, SOST, DROGA, REDES, GRAM, ETICA,
INMIG, GEOD, GLOB, ACTIT, SEGT, SO, OMS, INSST, DGT. **Los 463 fallos eran
exactamente esas 18 familias.**

No se ha aflojado la comprobación: se ha movido a donde vive el dato que la
decide. `verificar-meta.mjs` ya cruza familia↔materia↔referencia contra el
registro antes de cargar, y ahí sí se sabe si a esa familia le toca BOE. En la
base queda el invariante que sí es suyo: que la fuente sea identificable (norma
y localizador) y que un BOE-A, si se declara, esté bien formado. Medido: 0 y 0.

### G5 (3.087) — el banco usa cuatro convenciones, la barrera codificaba una

| forma | ejemplo | conceptos |
|---|---|---|
| `FAM-NNN` | `SEGT-002` | 2.663 |
| `FAM-SEC-NNN` | `CE-T1-018` | 256 |
| `FAM-art-etiqueta` | `CP-189ter-persona-juridica` | 375 |
| `FAM-art-apartado` | `CP-020-6-7` | 49 |

Las cuatro son deliberadas. La barrera pedía la segunda. Ahora comprueba lo que
de verdad protege —familia en mayúsculas + al menos un localizador, todo
alfanumérico—, que es lo que pilla un `undefined`, un id con espacios o uno sin
familia.

### G6 (1) — no era un duplicado

Marcaba `CP-189ter-persona-juridica` contra `CP-197quinquies-persona-juridica`.
**Son dos artículos distintos del Código Penal que comparten título**, cosa que
en el CP pasa a menudo. Añadiendo el artículo al agrupamiento: **0 duplicados
reales**.

> Esto corrige lo que yo mismo había dicho en la auditoría anterior, donde lo
> di por «1 duplicado real». Lo era en el informe, no en el banco.

### G7 (60) — el cerebro no tenía reloj

Esta sí decía algo, y era lo más grave. `acertium_v2.norma` tenía **una fila**
—la Constitución— y el banco citaba **61 normas**. La regla 7 (los datos
normativos caducan, hay que re-verificar ante cambios de BOE) no tenía dónde
apoyarse: si mañana se reforma el Código Penal, nada en el sistema sabe que hay
378 conceptos colgando de él ni cuándo se miró por última vez.

## Lo que sí estaba mal en el contenido: la regla 5 no se aplicaba

Esto no lo veía ninguna barrera, y es lo más serio que salió.

`CLAUDE.md` regla 5: *«`consenso` se carga como `pendiente_revision` y NO se
sirve hasta revisión humana»*. El mecanismo estaba **entero**: el enum tiene el
valor, `estadoSegunTipoFuente('consenso')` lo devuelve y tiene self-test, las
cuatro funciones de selección filtran por `verificado`, y hay pantalla de
revisión en `/admin` con aprobar y rechazar por pregunta o por familia.

Y aun así: **cero filas en todo el schema usaban `pendiente_revision`**. Los 40
conceptos que los lotes declaran `consenso` —teorías criminológicas, Allport,
Merton, Rokeach, globalización, migración, geografía humana— estaban en base
como `verificado`, sirviendo **53 preguntas**. La regla estaba escrita, probada
y no aplicada.

Ninguna de las 53 se había respondido todavía (0 eventos), así que no llegó a
contaminar ningún estado de dominio.

## Qué se hizo el 23/08/2026

1. **Las 53 dejan de servirse** (`infra/migracion-consenso-a-revision.sql`). Es
   un cambio de estado, no un borrado: `/admin` las lista y `resolverPendientes()`
   las devuelve a `verificado` cuando se revisen. El concepto viaja con su
   actividad.
2. **G1, G5 y G6 reescritas** para que comprueben lo que de verdad protegen, con
   la razón de cada cambio dentro del propio `barreras.sql`.
3. **Las 61 normas registradas** (`infra/migracion-registro-normas.sql`), con lo
   único que hoy consta de verdad: identidad, nombre y BOE-A, desde
   `registro-materias.json`.
4. **Un efecto secundario que había que cazar**: `progreso_temas` y
   `resumen_usuario` contaban desde `overlay_entrada` sin mirar el estado, así
   que el denominador se quedaba con los 40 conceptos inalcanzables y ningún tema
   podría volver a llegar al 100 % — el Tema 29 se habría quedado en 6 de 14 para
   siempre. Arreglado con el mismo criterio que las funciones de selección.

### El panel, después

Trece barreras (once más las dos que se desdoblaron) y **un solo rojo**:

```
G7 · norma sin volatilidad/last_verified ......... FALLO  60
todo lo demás .................................... OK      0
```

Y ese rojo es la verdad saliendo a la superficie, no un empeoramiento: antes
daba 0 porque solo había una norma registrada. Ahora es una **cola de trabajo de
60 entradas**.

## Lo que deliberadamente NO se hizo

**No se han inventado fechas ni volatilidades.** `ultima_modificacion`,
`last_verified`, `cadencia_revision` y `volatilidad` quedan en NULL en las 60
normas nuevas, porque averiguarlas es abrir el texto consolidado de cada una en
el BOE y leer su «Última actualización», una por una. Poner ahí una fecha
plausible sería exactamente lo que la regla 7 prohíbe, y peor que no tenerla:
parecería verificada.

Por eso se retiró el `NOT NULL` de `volatilidad`. El esquema obligaba a declarar
una volatilidad que nadie ha medido, así que la única forma de registrar una
norma era inventarse su clasificación. Con NULL, «sin clasificar» se puede decir,
y la barrera lo cuenta.

> **Los dos párrafos de arriba resultaron ser falsos, y así se corrigieron.**
> Ver la cuarta vuelta: la fecha SÍ estaba en el repo, y el NOT NULL no bastaba
> porque la columna tenía además `DEFAULT 'media'`.

## Una cosa que quedó anotada por el camino

**`registro-materias.json` no sabe expresar una familia con varias normas.** Está
indexado por familia, y CEDH apunta al Convenio; pero 15 fuentes citan además los
**Protocolos 14 y 15** (`BOE-A-2010-8504`, `BOE-A-2021-7554`), que por eso no
estaban en el registro. Se han registrado en `norma`, pero el límite del fichero
sigue ahí.

---

# Segunda vuelta: dos correcciones mías y el agujero de debajo

## Lo que dije mal

**«INTEL tiene 19 conceptos en el lote y 12 en base; siete no llegaron a
cargarse».** Falso, y era un error de suma mío: son **dos** lotes,
`inteligencia-osint.json` (12 conceptos) e `inteligencia-osint-2.json`, que
**vuelve a declarar 7 de los mismos conceptos** para colgarles preguntas nuevas.
Conceptos distintos: 12. Actividades en los lotes: 40. En base: 12 y 40. **No se
perdió nada.**

**«21 temas por debajo de 40 preguntas; el más flojo, Tema 40 con 12».** Conté
mal la unidad: esa consulta contaba filas de `overlay_entrada`, que son
**conceptos**, no preguntas. Medido bien, sobre preguntas servibles: **20 temas**
por debajo de 40, y el más flojo no es el 40 sino el **Tema 29, con 9**.

## Y al medirlo bien aparece lo que importa: las 53 congeladas caen todas juntas

| tema | servibles | en revisión | total |
|---|---|---|---|
| 29 · Actitudes y valores | **9** | 17 | 26 |
| 33 · La seguridad | **11** | 12 | 23 |
| 28 · Globalización | **18** | 7 | 25 |
| 30 · Principios éticos | **20** | 8 | 28 |
| 31 · Inmigración | **20** | 6 | 26 |
| 32 · Geografía humana | **22** | 3 | 25 |

Los seis temas más flojos del temario son **exactamente** los seis que tocó la
congelación de consenso. El Tema 29 perdió 17 de 26 preguntas, el 65 %.

Eso reordena la lista: **revisar las 53 no es un punto más, es LA acción de
contenido con más efecto**, porque devuelve justo lo que ahora falta. Y es tuya:
son fuentes de consenso, la revisión es humana por contrato.

## El agujero de debajo: la fuente primaria no está en el repo

Al ir a arreglar las 20 secciones de corpus con `procedencia: "lote"` me
encontré con que **no se puede desde aquí**, y por dos motivos que son el mismo:

1. **`www.boe.es` está bloqueado** por la política de red de este entorno. El
   proxy lo deja registrado: `gateway answered 403 to CONNECT (policy denial)`.
   Por eso el reloj de G7 tampoco se puede poner en hora sin inventarse las
   fechas.
2. **`.gitignore:15` excluye `datos/**/*.pdf`.** Los PDFs de las normas —la
   fuente primaria de todo el corpus— **no están versionados**; la única
   excepción es la convocatoria. Y `CLAUDE.md` describe
   `datos/legal-es/boe-600-pn/` como «corpus fuente (PDFs de las normas)»,
   describiendo algo que no está.

La regla de Jonathan del 22/08 dice justo lo contrario, y explica por qué
importa: *«una fuente que no está en el repo es una fuente contra la que ya no se
puede re-verificar»*.

### Lo que sí se pudo hacer: que el auditor lo diga

`auditar-corpus.mjs` contrastaba los lotes contra el corpus y cantaba los
aciertos como «cotejos literales OK». Pero para 20 familias ese corpus **salió de
los propios lotes**, así que no era grounding: era el lote confirmándose a sí
mismo, contado junto a los buenos. Nueva comprobación **(F)**:

```
  cotejos literales OK          : 2442
  (F) corpus CIRCULAR (del lote): 610   ← encajan, pero contra sí mismos
```

**610 de 3.052 —el 20 %— estaban en esa categoría y no se veía.** Las familias
son ACTIT, CEDH, CIBER, DGT, DROGA, DUDH, ENC, ETICA, GEOD, GLOB, GRAM, INMIG,
INSST, INTEL, ORTO, REDES, SEGT, SO, SOST y TORT: las del carril no-BOE, que
nunca estuvieron en el PDF del Código 600.

No bloquea —no hay nada que el autor de un lote pueda hacer al respecto— pero
deja de contarse como acierto, que era lo que engañaba.

---

# Tercera vuelta: las 53 aprobadas, y lo que la aprobación no dejaba escrito

Jonathan las revisó y aprobó en `/admin` el 23/08/2026. Comprobado en base: las
53 actividades y los 40 conceptos vuelven a `verificado`, y
`explicacion_verificacion` viajó con el concepto en las 40 — `resolverPendientes()`
hizo su trabajo completo.

| | congelado | aprobado |
|---|---|---|
| actividades servibles | 3.381 | **3.434** |
| Tema 29 | 9 preguntas | **26** |
| Tema 33 | 11 | **23** |
| denominador del progreso | 3.303 | **3.343** |

## Pero la aprobación no dejaba rastro

El contrato pone la revisión humana como LA puerta del contenido de consenso
(§2) y exige cadencia de re-verificación para las fuentes con datos vivos (§5).
Las dos cosas se apoyaban en un dato que no existía: `resolverPendientes()`
cambiaba el estado y nada más. Dos consecuencias concretas:

- Una recarga que volviera a aplicar `estadoSegunTipoFuente` devolvería esos 40
  conceptos a `pendiente_revision`, y **nadie sabría que ya se revisaron**.
- Sin fecha de revisión, la cadencia del §5 **no tiene desde cuándo contar** — y
  justo en las fuentes de consenso, que son las más volátiles del banco: una
  entrada de Wikipedia puede cambiar hoy.

Nueva tabla `acertium_v2.revision`, append-only, que escriben tanto `/admin`
como el CLI `revision-pendientes.mjs`. No bloquea la operación: si falla el
registro el contenido ya está promovido, y dejarlo a medias sería peor.

Las 53 de hoy quedan anotadas con `origen = 'retroactivo'` y la nota lo dice sin
adornos: **la fecha es la del registro, no la del clic**. No observé la
aprobación; la anoto a partir de lo que consta. Lo que se capture a partir de
ahora irá como `admin` o `cli`, que sí son el momento real.

## Lo que queda, reordenado

1. ~~Revisar las 53 de consenso~~ — **hecho el 23/08/2026**.
2. **Poner el reloj en hora**: 60 normas × su consolidado en el BOE.
   **Bloqueado aquí** por la política de red; hace falta permitir `boe.es` en el
   entorno o hacerlo desde otra máquina.
3. **Versionar los PDFs de las normas**, o decidir explícitamente que no y
   asumir que 20 familias no son re-verificables. Hoy la decisión está tomada por
   una línea de `.gitignore` que nadie escribió pensando en esto.
4. **Los 63 hallazgos (C) de elisión y los 9 (A) de cita cerrada** que el auditor
   lleva marcando y siguen sin triar.
5. **Las 18 familias no-BOE no tienen reloj, y no pueden tenerlo.**
   `norma.referencia_boe` es `NOT NULL`, así que una fuente sin BOE-A no se
   puede registrar ahí. Es el mismo agujero que G7 destapó para las normas, en
   el otro carril — y peor, porque el §5 del contrato señala precisamente esas
   fuentes (INE, OEDA, ciberamenazas) como las que caducan. Hace falta decidir
   cómo se modela una fuente no-BOE antes de poder ponerle fecha.

---

# Cuarta vuelta: el reloj ya estaba en casa, y un DEFAULT que mentía por mí

Al retirar `datos/**/*.pdf` del `.gitignore` (regla de Jonathan del 23/08: **de
cada PDF se guarda copia versionada**) aparecieron tres PDFs que ya estaban en
disco y que git no veía: el Código Penal, la LECrim y la Ley de PRL. Son
extractos del Código 600, y el prefijo de su nombre coincide con su sección del
corpus (`35-…` ↔ `seccion-035.json`). Pesan 495K, 252K y 287K — **la objeción de
tamaño que justificaba la línea del `.gitignore` no se sostenía**: el Código
Penal entero ocupa medio mega.

Tirando de ese hilo salieron las dos cosas de esta vuelta.

## El reloj no estaba bloqueado: estaba en el repo

Dije que poner `ultima_modificacion` exigía ir al BOE, y que el entorno lo
bloquea. Lo segundo es cierto; lo primero **no**. Cada sección del corpus guarda,
de su ingesta desde boe.es, el metadato `ultima_modificacion` — «9 de abril de
2026» para el Código Penal — y su `publicacion`. **55 secciones lo traen.**

No es memoria ni estimación: es lo que decía el consolidado cuando se ingirió,
que es justo la línea base que la regla 7 necesita para poder preguntar después
«¿ha cambiado desde entonces?».

**El contraste que lo valida**: la Constitución era la única fila con fecha,
puesta a mano — `2026-05-20`. El corpus dice «20 de mayo de 2026». Coinciden al
día. Las 13 que el corpus marca «sin modificaciones» toman la de `publicacion`,
porque una norma nunca modificada tiene por texto vigente el original.

**54 de 61 normas con fecha real.** Y lo que enseña de inmediato:

| norma | última modificación |
|---|---|
| Reglamento General de Vehículos | 2026-06-26 |
| Constitución | 2026-05-20 |
| Orden INT/430/2014 uniformidad | 2026-04-30 |
| **Código Penal** | **2026-04-09** |

Cuatro normas del banco tocadas en los últimos cinco meses. Eso es exactamente
la señal que antes no existía.

## Y un DEFAULT que afirmaba por mí

`G7 · norma sin clasificar (volatilidad)` salió **0**, cuando yo había dejado 60
normas sin clasificar a propósito. Motivo: **la columna tenía `DEFAULT 'media'`**.
Retirar el `NOT NULL` no bastaba — mis 60 inserciones se llevaron la etiqueta en
silencio, y la base pasó a afirmar una volatilidad que nadie había medido.

Es el error que más me interesa de toda la sesión, porque es el que peor se ve:
no falló nada, no saltó ninguna barrera, y el panel decía que ese trabajo estaba
hecho. **Un DEFAULT en una columna de juicio convierte «no lo sé» en una
respuesta con aspecto de dato.** Retirado, y las 60 vuelven a NULL.

## G7 desdoblada, porque eran tres trabajos distintos

«Sin volatilidad/last_verified» los metía en el mismo saco y no dejaba ver cuál
avanzaba:

```
G7 · norma citada sin registrar ................. OK      0
G7 · norma sin fecha de última modificación ..... FALLO   7
G7 · norma sin clasificar (volatilidad) ......... FALLO  60
G7 · norma nunca re-verificada (last_verified) .. FALLO  60
```

- **7 sin fecha**: los Protocolos 14 y 15 del CEDH, el propio CEDH, la Convención
  contra la Tortura, la Ley 39/2006, la Orden PCI/487/2019 y el RD 39/1997. Sus
  secciones del corpus no traen el metadato.
- **60 sin clasificar**: es criterio, no dato. Decisión de Jonathan.
- **60 sin re-verificar**: esto sí necesita el BOE. La fecha que tenemos es de la
  norma, no de la comprobación.

## Y la regla nueva ya no empieza en cero

`npm run auditar:fuentes` inventaría las 78 materias y dice cuáles tienen su
documento. Con los tres PDF colocados en `datos/fuentes/<materia>/` con su
`PROCEDENCIA.md`: **3 de 78**. Las fichas dicen lo que consta y lo que no —
edición no declarada, fecha de consulta desconocida, y si el extracto del Código
600 recoge la norma íntegra o una selección, sin establecer.
