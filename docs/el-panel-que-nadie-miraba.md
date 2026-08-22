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

## Lo que queda, reordenado

1. **Revisar las 53 de consenso** en `/admin`. Devuelve los seis temas más
   flojos. Es tuya.
2. **Poner el reloj en hora**: 60 normas × su consolidado en el BOE.
   **Bloqueado aquí** por la política de red; hace falta permitir `boe.es` en el
   entorno o hacerlo desde otra máquina.
3. **Versionar los PDFs de las normas**, o decidir explícitamente que no y
   asumir que 20 familias no son re-verificables. Hoy la decisión está tomada por
   una línea de `.gitignore` que nadie escribió pensando en esto.
4. **Los 63 hallazgos (C) de elisión y los 9 (A) de cita cerrada** que el auditor
   lleva marcando y siguen sin triar.
