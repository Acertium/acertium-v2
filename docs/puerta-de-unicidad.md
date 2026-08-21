# La puerta de unicidad

> 22/08/2026. Cuarta barrera del generador. Las otras tres miran cada pregunta
> contra su fuente; esta la mira contra el resto del banco, que es el único sitio
> donde vive este fallo.

## El daño que evita

El opositor contesta «el día siguiente al de su publicación», acierta, y días
después le sale lo que para él es la misma pregunta —«¿cuándo entra en vigor el
real decreto?»—, contesta igual y falla, porque esa otra hablaba de **otro** real
decreto. No ha aprendido nada: ha aprendido a desconfiar. **Una laguna se
perdona; una contradicción, no.**

## Por qué ahora y no antes

Con preguntas **directas** el fallo es raro, porque el enunciado arrastra su
sujeto: «¿cuál es el objeto de la LO 4/2010?» no se confunde con nada. Medido
sobre las 3.411 del banco: **solo 4 enunciados repetidos**, y los 4 con respuesta
distinta.

Pero la pregunta **inversa** funciona precisamente quitando el sujeto del
enunciado —eso es lo que la hace inversa— y un generador automático las produce
mucho más deprisa de lo que nadie las revisa. El fallo pasa de raro a estructural
justo cuando se dan los dos pasos que veníamos planeando.

## Qué comprueba

**1. Unicidad entre preguntas.** Mismo enunciado normalizado con distinta
respuesta correcta → RECHAZO. Compara el lote consigo mismo y contra el banco
entero (`banco_enunciados()`, una fila con un jsonb: el tope de PostgREST cuenta
filas). Misma pregunta y misma respuesta en dos sitios → aviso, no rechazo: no
engaña a nadie, pero sobra una.

## La comprobación que se cayó al medirla

Aquí hubo una segunda regla: **«ningún distractor puede ser cita literal del
mismo cotejo»**. La escribí convencido de que era el hallazgo gordo, y la
documenté con una cifra —«23 preguntas afectadas»— que **no significaba lo que yo
decía que significaba**.

Al pasarla sobre las 3.434 del banco y **leer una por una** las que marcaba: **16
marcadas, 16 falsos positivos, ningún acierto.**

El razonamiento estaba mal de raíz. *«El distractor es literal del cotejo»* no
implica *«el distractor también es verdad»*. El cotejo es un **artículo**, y un
artículo casi siempre contiene varias reglas. El enunciado elige una, y entonces
las demás reglas del mismo artículo son los **mejores distractores que existen**,
porque son justo las distinciones que pregunta el tribunal:

| Pregunta | Distractor literal | Por qué es falso |
|---|---|---|
| «el **tercero** de los requisitos del estado de necesidad» (CP-020-5) | el primero y el segundo | no son el tercero |
| «la cuota diaria de la multa, **salvo** personas jurídicas» (CP-050) | la cuota de las personas jurídicas | el enunciado la excluye |
| «el plazo **tras el Protocolo n.º 15**» (CEDH-035) | «en el plazo de seis meses» | el cotejo es el texto que lo deroga |
| «¿quién **resuelve**?» (PTEMP-016) | la Oficina de Asilo, la Comisión | esas tramitan y proponen |
| «¿quién incurre en la **misma** responsabilidad?» (DISC-004) | «los superiores que la toleren» | el cotejo dice que esos incurren en falta de inferior grado |

Y el remate: **el caso que yo citaba como ejemplo motivador —MININT-007 vs
MININT-023— esta regla no lo detectaba.** Sus distractores no salen de su propio
cotejo. Lo detecta la comprobación 1, la de enunciados.

Cero verdaderos positivos, dieciséis falsos, y el ejemplo que la justificaba era
de la otra regla. **Se ha quitado**, no degradado a aviso: ya escribí en este
mismo documento que una puerta que todo el mundo aprende a ignorar es peor que no
tenerla, y esta habría empezado ignorada.

El riesgo sí existe, pero no es «el distractor es literal»: es **«el enunciado no
selecciona una sola regla del artículo»**, que es la comprobación 1. En el prompt
del motor las reglas 6 y 7 se han fundido en esa idea, con los selectores que
sirven: un ordinal, un superlativo, una exclusión, una condición, el verbo.

## Una decisión anterior, del mismo tipo

Se probó detectar el sujeto genérico por patrón («el real decreto» sin número).
Marcaba **146 preguntas (4,3 %)**, y al revisar la muestra la mayoría eran sanas:
«el Reglamento de Armas» sí identifica de qué habla. Se descartó por eso.

Son el mismo error dos veces: una regla plausible, medida por cuántas cosas
marca en vez de por cuántas acierta. La diferencia es que la primera la descarté
antes de montarla y esta la monté, la documenté y la vendí como hallazgo. **La
cifra que hay que mirar no es cuántas marca: es cuántas de las que marca son de
verdad.**

## Lo que se arregló en el banco

Los **4 enunciados contradictorios** ya están corregidos (0 restantes). Se tocó
**solo el enunciado**; la opción correcta y el cotejo son cita literal y no se
rozaron:

- **ACOG-056 / CPOL-062** — «¿cuándo entra en vigor el real decreto?» × 2, con
  respuestas opuestas. Cada uno lleva ahora su RD (220/2022 y 555/2011).
- **PRL-028 / PRLP-030** y **PRL-031 / PRLAGE-015** — ley general frente a norma
  policial y frente a la de la AGE. Cada uno cita su norma.
- **MININT-007 / MININT-023** — el único que **no** se arreglaba citando la
  norma: son del mismo RD 207/2024 y los dos artículos enumeran los mismos cinco
  órganos, así que el opositor seguiría sin poder elegir. Citar el artículo
  habría contentado a la puerta dejando la pregunta igual de imposible. Lleva
  ahora un selector real, sacado del orden que está literal en cada cotejo:
  «¿cuál figura inmediatamente después de la Secretaría General Técnica?» y
  «¿qué órgano encabeza la relación?».

## Lo que queda abierto

- **No se puede correr desde el contenedor remoto**: sin `.env.local` no hay
  acceso a la base, y entonces la puerta compara el lote solo consigo mismo. Lo
  dice en voz alta, y desde ahora **se niega a aplicar** sin banco: una puerta que
  se desactiva sola cuando falla la red no es una puerta.
