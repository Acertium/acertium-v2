# RESULTADO_015 — Los 3 lotes de relleno, desbloqueados y cargados

Ejecutado el **2026-08-16**. Estado: **completado**. **Los tres lotes entraron**; ninguno quedó
pendiente. De paso salió un error de cita en el contenido de CEDH-2 que he corregido (§5).

## 1. `verificar-meta` refinada para familias `autoridad`

Cuando `tipo_fuente = "autoridad"`, la puerta **ya no exige que la referencia coincida** con la del
registro: basta con que `referencia_fuente` exista y no esté vacía. Lo que **sigue estricto**:
familia, materia, norma y tema se contrastan exactos, y los `oficial` con `referencia_boe` no se han
tocado.

El porqué, documentado en el propio módulo: una familia de autoridad (RAE, INCIBE, técnicas) no tiene
una fuente única —se apoya en varias obras solventes y la lista crece con cada tanda—, así que
encadenarla al dominio que se registró el primer día bloquea contenido bueno. Rechazó `ciber-incibe-2`
por citar CCN-CERT y `sistemas-operativos-2` por citar IBM y `docs.redhat.com`, ambas fuentes
perfectamente autorizadas. El cuarteto familia/materia/norma/tema es el que de verdad impide estampar
un lote con el meta de otra materia (el fallo del 02/08); el dominio era un cinturón extra que aquí
estorbaba más de lo que aportaba.

Self-test ampliado a **8/8**, con tres casos nuevos: `autoridad` citando otra fuente solvente
**pasa** · `autoridad` sin ninguna referencia **sigue rechazando** · `autoridad` con materia que no
cuadra **sigue rechazando**.

## 2. CEDH-2 — BOE-A confirmados, no supuestos

El encargo pedía no cargar si no podía confirmar los BOE-A. **Los he verificado uno por uno contra
boe.es**, no de memoria:

| Instrumento | BOE-A | Título comprobado en boe.es |
|---|---|---|
| Protocolo n.º 15 | **BOE-A-2021-7554** | "Instrumento de ratificación del Protocolo n.º 15 de enmienda al Convenio para la Protección de los Derechos Humanos y de las Libertades Fundamentales, hecho en Estrasburgo el 24 de junio de 2013" |
| Protocolo n.º 14 | **BOE-A-2010-8504** | "Instrumento de Ratificación del Protocolo número 14 al Convenio para la protección de los Derechos Humanos y de las Libertades Fundamentales, por el que se modifica el mecanismo de control del Convenio" |

Añadidos al `referencia_fuentes` de CEDH junto al Convenio (BOE-A-1979-24010) y el Protocolo 11
(BOE-A-1998-15127), con una nota en el registro de que son los instrumentos **admitidos**.

**Y la puerta tuvo que aprender qué es una familia multi-instrumento.** Declarar los BOE en el
registro no bastaba: la puerta comparaba `referencia_boe` y `norma` contra el instrumento principal,
y un lote del Protocolo 15 nunca cuadraría con el BOE ni el título del Convenio de 1950. Ahora acepta
el BOE principal **o uno de los declarados en `referencia_fuentes`**; y cuando el lote usa un
instrumento secundario, la `norma` no se compara (por definición es otro título) pero sí se exige que
no esté vacía. Materia, tema y familia siguen exactos. **Lo que no está declarado se sigue
rechazando**: no es una relajación, es una lista blanca.

## 3. Integridad de los 3 lotes ANTES de cargar

El encargo avisaba de que el agente generador se cortó por un límite de uso. **Los tres están
completos**; ninguno quedó a medias:

| Lote | JSON | Conceptos / actividades / relaciones | Fuentes | `indice_correcto` | Islas |
|---|---|---|---|---|---|
| `ciber-incibe-2` | ✓ | 7 / 7 / 8 | 3, todas resuelven | en rango | 0 |
| `sistemas-operativos-2` | ✓ | 14 / 14 / 19 | 13, todas resuelven | en rango | 0 |
| `ddhh-cedh-2` | ✓ | 15 / 15 / 15 | 14, todas resuelven | en rango | 0 |

Comprobado además: 4 opciones por actividad, ninguna vacía, todas las actividades apuntan a un
concepto del lote, todos los conceptos tienen actividad y cotejo, y todos tienen fuente para su
`articulo`.

## 4. Carga — los tres entraron

Conteos **releídos de la base**:

| Familia | Antes | Después | Suma | Puertas |
|---|---|---|---|---|
| **CIBER** | 22 conceptos / 22 actividades | **29 / 29** | +7 | 0 rechazos, sesgo 43 % |
| **SO** | 30 / 30 | **44 / 44** | +14 | 0 rechazos, sesgo 29 % |
| **CEDH** | 34 / 34 | **49 / 49** | +15 | 0 rechazos, sesgo 47 % |

Ids en su rango reservado (CIBER-023…029, SO-031…044, CEDH-035…049), sin colisión. Los tres pasaron
las cuatro puertas (contenido, calidad, meta y fuente) y la carga quedó **confirmada releyendo la
base**. Total: **2.517 conceptos** y **2.455 preguntas verificadas** (antes 2.481 / 2.419).

Nota sobre el sesgo de longitud: CIBER-2 (43 %) y CEDH-2 (47 %) están por encima del 35 % que fija el
estándar de Capa 2, aunque por debajo del 55 % de la puerta dura, que es la que corta. Son lotes de 7
y 15 preguntas, donde una sola pregunta mueve el porcentaje 7 puntos. Lo dejo anotado, no arreglado:
tocar los distractores es trabajo del generador.

## 5. Un error de cita que salió al cargar — corregido

`ddhh-cedh-2` mezcla artículos de **dos** instrumentos (9 conceptos del Protocolo 14 y 6 del 15),
pero `meta.referencia_boe` es **uno por lote**. Resultado: los 9 conceptos del Protocolo 14 quedaron
estampados con `BOE-A-2021-7554`, que es el BOE del Protocolo **15**. Una pregunta citando la fuente
equivocada es exactamente lo que este pipeline existe para impedir, así que:

- **Corregidos en la base** los 9 `concepto_fuente` a `BOE-A-2010-8504` (el verificado en boe.es), con
  su `norma` propia; y afinada también la `norma` de los 6 del Protocolo 15. Estado final: Convenio 34
  → BOE-A-1979-24010 · P14 9 → BOE-A-2010-8504 · P15 6 → BOE-A-2021-7554.
- **Arreglada la causa** en `cargar.mjs`: un concepto puede traer su propia `referencia_boe`/`norma` y
  entonces mandan sobre las del meta. Así un lote multi-instrumento futuro no vuelve a mis-estampar.
  (El lote actual no las trae; por eso hizo falta la corrección a mano.)

## 6. La aserción post-carga tuvo que cambiar, y conviene saberlo

Con CEDH multi-instrumento, las aserciones **(b)** "una familia no puede tener dos referencias BOE" y
**(c)** "una materia no puede tener dos normas" **empezaron a devolver filas**. No es contaminación:
es la consecuencia correcta de que la familia sea un bloque de varios tratados.

En vez de dejarlas devolviendo filas "que ya sabemos" —lo que erosiona una barrera hasta volverla
ruido—, la excepción se **declara**: (b) y (c) excluyen ahora `CEDH` y `TORT`, con un comentario que
obliga a mantener esa lista en sintonía con las familias que tienen `referencia_fuentes` en el
registro. Se añade una consulta **(d) informativa** que lista qué instrumentos tiene de verdad cada
familia declarada, para poder revisar de un vistazo que la excepción sigue justificada.

**La aserción (a)** —una familia repartida entre dos materias— **no lleva excepción**: es la que
detecta de verdad un meta contaminado, y ninguna familia multi-instrumento la rompe.

## 7. Verificación

| Comprobación | Resultado |
|---|---|
| Aserciones (a), (b), (c) | **0 filas** |
| correcta ⊄ opciones (banco tipo test) | **0** |
| Conceptos isla | **0** |
| `npm run test:motor` | verde — cotejo 13/13 · ortografía 12/12 · fuente 11/11 · **meta 8/8** |
| `npm run build` | verde (exit 0) |

## Pendientes / notas

- **Sigue sin haber lote de "Crime as a Service"** (T41), que el PROMPT_008 §5 dejaba anotado. XSS ya
  entra con `ciber-incibe-2`.
- La lista de excepciones de `asercion-post-carga.sql` está **escrita a mano** (`'CEDH','TORT'`). Si
  aparece otra familia multi-instrumento hay que tocar dos sitios: el registro y ese SQL. Se podría
  derivar del registro, pero la aserción es SQL suelto que se corre contra la base y hoy no lee JSON;
  prefiero la duplicación explícita y comentada a un mecanismo que nadie recuerde.
- `TORT` está en la lista de excepciones **por definición** (es multi-instrumento en el registro),
  pero hoy sus 25 conceptos comparten una sola referencia BOE: la excepción todavía no se le aplica de
  hecho.
