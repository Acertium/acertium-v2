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

## Dos cosas que quedaron anotadas por el camino

- **`registro-materias.json` no sabe expresar una familia con varias normas.**
  Está indexado por familia, y CEDH apunta al Convenio; pero 15 fuentes citan
  además los **Protocolos 14 y 15** (`BOE-A-2010-8504`, `BOE-A-2021-7554`), que
  por eso no estaban en el registro. Se han registrado en `norma`, pero el límite
  del fichero sigue ahí.
- **INTEL tiene 19 conceptos en su lote del repo y 12 en base.** Siete no
  llegaron a cargarse, o se cargaron con otro id. Sin mirar todavía.

## Lo que queda

1. **Poner el reloj en hora**: 60 normas × abrir su consolidado en el BOE, anotar
   `ultima_modificacion` y clasificar `volatilidad`. Es la cola que ahora marca G7.
2. **Revisar las 53 de consenso** en `/admin`, o dejarlas fuera.
3. **21 temas por debajo de 40 preguntas**; el más flojo, Tema 40 (Inteligencia)
   con 12.
4. **20 de 78 secciones del corpus con `procedencia: "lote"`** — reconstruidas
   desde los lotes, no desde el PDF. Contra esas no se puede re-verificar.
