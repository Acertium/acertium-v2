# RESULTADO_016 — Grupo C oleada 1 (ETICA, INMIG, GEOD) + estado por concepto

Ejecutado el **2026-08-16**. Estado: **completado**. Los tres lotes entraron y, con el estado por
concepto, **44 de las 59 preguntas se sirven ya**; solo las 20 de consenso esperan revisión.

## 1. `estado_verificacion` POR CONCEPTO — hecho (la vía buena, no la alternativa segura)

`cargar.mjs` estampaba un único estado por lote. Con estos lotes mixtos eso significaba dejar 39
definiciones citables de la OIM, el INE y la RAE esperando revisión humana sin ningún motivo. Ahora
el estado se decide **concepto a concepto**, con esta cascada:

    lo que diga el concepto → lo que diga el meta del lote → verificado

**El último escalón no es un agujero**, y conviene entender por qué: es el camino de los lotes BOE,
que no declaran `tipo_fuente` en ninguna parte porque su grounding ya lo garantiza `verificar-lote`
(cita literal de la norma). Dentro de un lote no-BOE —el que sí declara `meta.tipo_fuente`— un
concepto que no diga nada **hereda el del lote**, que para el Grupo C es `consenso`: fail-closed, como
pedía el encargo. Aplicar "sin `tipo_fuente` → `pendiente_revision`" a secas habría mandado a la cola
las 2.500 preguntas del corpus BOE.

**La actividad hereda de SU concepto** salvo que declare el suyo (ETICA lo hace; INMIG y GEOD no).
Hacía falta: una pregunta no puede servirse si el concepto del que cuelga está sin revisar.

Mismo criterio aplicado al modo `--sql`, y nuevo desglose por estado en el informe de carga.

## 2. `verificar-fuente` también juzga por concepto

No estaba en el encargo, pero sin esto el §1 quedaba cojo: la puerta seguía juzgando las 59
actividades con el `tipo_fuente` del lote (`consenso`), y eso fallaba **en la dirección peligrosa** —
eximía del check literal a las 39 citables. Ahora cada actividad se juzga por el tipo de su concepto,
con el del lote como respaldo. Añadido además el control de que **un concepto no puede
autoproclamarse `verificado` si es de consenso**, que ya existía a nivel de lote.

## 3. Familias registradas

`ETICA`, `INMIG` y `GEOD`, con las `norma`/`tema` **exactas de los lotes** (las del encargo estaban
abreviadas y la puerta compara cadena literal).

**El detalle de los dominios que anticipaba el §2 sí ocurrió**, y con ETICA: el lote cita el Código
Penal por su id `BOE-A-1995-25444`, **sin URL**, mientras el registro propuesto pedía
`https://www.boe.es`. En vez de retocar el lote, ajusté el registro a lo que el lote cita de verdad:
los dominios con URL son `unesco.org` y `dle.rae.es` —los dos que la puerta exigirá—, y las normas del
BOE van nombradas por su id sin enlace, que es como se citan. Anotado en el registro para que la
próxima familia del Grupo C siga el mismo criterio.

## 4. Carga — los tres lotes, con el desglose que pedía el §4

Conteos **releídos de la base**:

| Familia | Conceptos | `verificado` | `pendiente_revision` | Actividades | `verificado` | `pendiente_revision` |
|---|---|---|---|---|---|---|
| **ETICA** | 15 | **5** (oficial, CP y CE) | **10** (consenso) | 18 | **7** | **11** |
| **INMIG** | 21 | **16** (13 autoridad OIM + 3 oficial INE) | **5** (consenso) | 26 | **20** | **6** |
| **GEOD** | 23 | **20** (autoridad INE/RAE) | **3** (consenso) | 25 | **22** | **3** |

**Coincide exactamente con lo previsto en el encargo** (5+10, 13+3+5, 20+3). Las tres pasaron las
cuatro puertas con **0 rechazos**; sesgo de longitud 28 %, 4 % y 32 %, los tres por debajo del 35 %
del estándar.

Base: **2.576 conceptos** · **2.504 preguntas servibles** · **20 en cola de revisión**.

## 5. Aristas cruzadas

- **Las 5 aristas fuera de familia resuelven**: ETICA-011→IG-005, ETICA-006→IG-007, ETICA-011→VG-001,
  INMIG-009→ASI-001, INMIG-012→EXT-001.
- **ETICA → CP: a `remision_pendiente`.** Los cinco conceptos `oficial` de ETICA son literalmente los
  delitos de odio del Código Penal (arts. 22.4ª y 510), pero **esos artículos no están segmentados en
  la familia CP** (comprobado: 0 filas). Añadidas 5 remisiones que se tejerán solas cuando entren.
- GEOD no propone ninguna arista fuera de familia.

## 6. Verificación

| Comprobación | Resultado |
|---|---|
| Aserciones (a), (b), (c) | **0 filas** |
| correcta ⊄ opciones · conceptos isla | **0** · **0** |
| ¿Alguna pendiente alcanzable por `simulacro_muestra`? | **0** |
| ¿Algún concepto pendiente candidato en `practicar_estado`? | **0** |
| `npm run test:motor` | verde — cotejo 13/13 · ortografía 12/12 · fuente 11/11 · meta 8/8 |
| `npm run build` | verde (exit 0) |

**El aislamiento probado con contenido real, no con una fila de prueba:** las 20 actividades y 18
conceptos de consenso están en la base y **ninguno es alcanzable** por las vías de selección.

**Y el panel los recoge**: levanté `/admin` y el bloque 2 lista las tres familias con sus contadores
(ETICA 11, INMIG 6, GEOD 3 = 20 preguntas), cada una con su enunciado, opciones, cotejo y fuente,
lista para aprobar o rechazar.

## Pendientes / notas

- **Nadie ha revisado aún las 20 de consenso.** Es lo correcto —se cargan para que un humano las
  mire— pero hasta que Jonathan las apruebe por `/admin`, los temas 30, 31 y 32 se sirven **solo con
  su parte citable**.
- En el panel, el campo «fuente» muestra la `norma` completa del lote, que en estas familias es un
  párrafo entero, más el artículo. Es informativo pero queda largo; si estorba al revisar, se recorta.
- El aviso ⚠ del cargador decía "este lote se cargará como pendiente_revision", que con lotes mixtos
  era falso. Ahora avisa de que es mixto y que cada concepto va por su cuenta.
- Quedan los temas **28, 29 y 33** del Grupo C (globalización, actitudes/valores, seguridad y teorías
  de la delincuencia). Sus lotes ya están en `lotes/` (`globalizacion.json`, `actitudes-valores.json`,
  `seguridad-delincuencia.json`) pero **no los he tocado**: no son de este encargo.
