# La fecha objetivo y los dos modos del coach

> 21/08/2026. Nace de una pregunta de Jonathan: si la repetición espaciada se
> acorta conforme llega la fecha y esa fecha no está puesta, ¿qué hace el
> profesor? La respuesta corta: el espaciado no dependía nunca de la fecha, y el
> reparto entre avanzar y consolidar sí — y estaba atascado.

## Lo que la fecha NO toca: el espaciado

El intervalo de repaso de cada concepto lo calcula `nucleo/motor-bkt.mjs` y **no
mira el calendario en ningún punto**. Sale de cómo respondes y de cuándo:

```
retención r = 0,90 ^ (Δt / τ)        τ = días hasta bajar al 90 %
acierto → τ *= g   (g hasta 4,0, mayor cuanto más tarde llega el repaso)
fallo   → τ  = max(1, τ × 0,4)
```

Un concepto «vence» cuando su absorción cae al objetivo (0,90). Eso es todo. La
repetición espaciada funciona igual de bien sin fecha de examen, porque lo que la
gobierna es el olvido, no la convocatoria.

## Lo que la fecha SÍ toca: la mezcla

Lo que depende del horizonte es `nucleo/planificador.mjs`: cuántos conceptos
**nuevos** se introducen cada día y cuándo se deja de introducirlos.

| | Fórmula | Efecto |
|---|---|---|
| `cutoff` | `examDay − 19` | Último día en que entra materia nueva |
| `quota` | `restantes / (cutoff − hoy + 1)` | Ritmo diario para que quepa todo |
| `modo` | ver abajo | `normal` · `consolidacion` · `triaje` |

Los 19 días son la **ventana de estabilización**: aproximadamente la suma de los
cuatro primeros intervalos de repaso. Un concepto introducido dentro de esa
ventana no llega al examen asentado, así que a partir del corte el coach deja de
ampliar y solo consolida.

## El hallazgo: el horizonte era una cinta de correr

`lib/cerebro.ts` pasaba `examDay: hoy + 180` **e** `inicio: hoy`. Los dos
relativos a hoy, así que el examen se alejaba un día por cada día que pasaba.
Medido con el universo real (3.343 conceptos):

```
día    0: modo=normal  cutoff=161  (faltan 161 para el corte)  nuevos=21
día  200: modo=normal  cutoff=361  (faltan 161 para el corte)  nuevos=21
día 1000: modo=normal  cutoff=1161 (faltan 161 para el corte)  nuevos=21
```

Consecuencia: `triaje` y `consolidacion` eran **inalcanzables en la app**, no por
casualidad sino por aritmética —`triaje` exige `180 ≤ 19`; `consolidacion` exige
`hoy > hoy + 161`—. Los dos modos solo se habían ejecutado nunca en el self-test
de `planificador.mjs`.

## La decisión: la fecha la pone el opositor, no el BOE

Que la convocatoria publique una fecha **no** significa que este opositor se
presente a esa. Lo normal es tardar varias convocatorias, y hay quien empieza con
calma pensando en dentro de un par de años. Heredar la fecha del BOE haría dos
daños a la vez: el coach le cortaría la materia nueva 19 días antes de un examen
al que no va, y la app le hablaría de una cuenta atrás ajena.

Por eso `fecha_objetivo` vive en **`usuario`**, es **opcional**, y `NULL` es un
valor de primera clase —«estudia sin fecha»—, no un campo a medio rellenar.

### Modo maratón (sin fecha)

Horizonte rodante de 180 días. Nunca llega el corte, nunca se deja de introducir
materia, el reparto diario es estable. Es el comportamiento que ya había, pero
ahora es una **decisión con nombre** y no un efecto colateral de un valor
provisional.

### Modo fecha

Horizonte real y decreciente. La cuota diaria sube para que quepa el temario
antes del corte, y al pasarlo entra `consolidacion`. Medido, con la fecha fijada
el día 0 y el examen en el 200:

```
día 100 (faltan 100): modo=normal         nuevos=40
día 181 (faltan  19): modo=normal         nuevos=40
día 182 (faltan  18): modo=consolidacion  nuevos= 0   ← el corte
día 200 (faltan   0): modo=consolidacion  nuevos= 0
```

## Por qué existe `fecha_objetivo_fijada`

No es metadato de auditoría: el planificador lo necesita como `inicio`.

`planDia` distingue `triaje` de `consolidacion` comparando `examDay − inicio` con
la ventana. Con `inicio = hoy`, quien llevaba medio año preparándose entraba en
**triaje** los últimos 19 días —volcándole temario nuevo en la peor semana
posible— en vez de en consolidación. Fue exactamente lo que salió al medirlo la
primera vez. Con `inicio` = el día en que se comprometió con la fecha, sale bien:

- Fijó el examen a 200 días → los últimos 19 son `consolidacion`.
- Fija el examen a 10 días → arranca en `triaje`, que es lo honesto: no tiene el
  margen y no se lo vamos a fingir.

## El saludo

Las frases con cuenta atrás **solo** aparecen si la fecha la puso él, y solo en
la última quincena: a 120 días «quedan 120» no dice nada y a algunos les pesa.
Dentro de la quincena, la recta final gana incluso a la vuelta tras una ausencia
larga —a tres días del examen, saber en qué punto estás ayuda más que un
«bienvenido de vuelta», y «a afianzar lo que ya sabes» tampoco riñe a nadie—.

Si la fecha ya pasó, se vuelve al saludo por hora sin decir nada: el opositor
sabrá mejor que la app cómo le fue.

## Lo que queda abierto

- **Un solo usuario.** Todo esto usa `DEMO_USUARIO_ID`. Cuando haya sesiones de
  verdad, la fecha se lee del usuario autenticado y no hay que tocar la lógica.
- **La fecha pasada no se limpia sola.** Si el opositor no la quita, el coach
  vuelve a comportarse como si el examen fuera hoy (`daysLeft = 1`). Convendrá un
  aviso en `/hoy` del tipo «tu fecha ya pasó, ¿pones la siguiente?».
- **`convocatoria` sigue sin fecha, y así se queda.** Si algún día se guarda, es
  para informar («la convocatoria de este año examina el X»), nunca para
  alimentar el planificador.

---

# Segunda vuelta (21/08/2026): el peso, y el cierre del ciclo

## El peso ordena — y por fin está encendido

`overlay_entrada.peso` lo usa el planificador desde siempre para ordenar
(`planificador.mjs:38` y `:44`), pero `cargar.mjs` lo clavaba a 1: el mecanismo
estaba construido de punta a punta y nadie lo había encendido. Ahora los tramos
salen de las 600 preguntas oficiales trazadas, y `cargar.mjs` los deriva del tema
(`pesos-temas.json`) para que los lotes nuevos nazcan con el suyo.

| Peso | Temas | Conceptos | En base |
|---|---|---|---|
| 4 | T8 | 8 % | 257 |
| 3 | T3, T10, T14, T17, T21 | 26 % | 865 |
| 2 | los otros 25 | 52 % | 1.731 |
| 1 | 14 temas | 15 % | 490 |

Los tramos 4, 3 y 1 coinciden exactamente con `anchura-y-profundidad.md`; el 2
creció en 105 conceptos porque ahí cayeron los lotes cargados después (RSP en T25,
DEP en T23).

**El peso ORDENA, NO FILTRA.** Medido en modo fecha con horizonte suficiente, la
cobertura sigue siendo del 100 % en los cuatro tramos: lo que cambia es el orden
de llegada, no quién llega.

```
FECHA a 180 días:  peso4 100 % · peso3 100 % · peso2 100 % · peso1 100 %
```

Con un plazo que no da (120 días), el orden hace lo que se le pide: salva lo que
más pesa y sacrifica la cola.

```
FECHA a 120 días:  peso4 100 % · peso3 100 % · peso2 77 % · peso1 0 %
```

Eso es deliberado, pero conviene decirlo en voz alta: **con plazo corto, «para el
final» acaba significando «no le da tiempo».** Es mejor que repartir uniformemente
y no dominar nada, y es exactamente lo que el 80/20 pide.

## El defecto que destapó el peso: la paradoja de Zeno del maratón

Al medir la cobertura por tramos apareció que en **modo maratón** el peso 1 se
quedaba al **0 % incluso tras 200 días**. La causa no era el peso:

```
quota = ceil(restantes / 162)     ← proporcional a lo que queda
día   0: quota 21, restan 3.343
día 160: quota  8, restan 1.192
día 400: quota  2, restan   211
```

Con el horizonte rodante, el ritmo decae geométricamente y **el temario no se
termina nunca**. El defecto era anterior al peso —con todos los pesos a 1 la cola
tampoco se cubría—, pero el peso lo volvió sistemático: la cola que no llega
pasaban a ser siempre los mismos 490 conceptos. Eso convertía «no priorizar» en
«no cubrir», que es justo lo que prohíbe la regla 6 de `CLAUDE.md`.

Arreglo: `ritmoMinimoNuevos` en `planDia`, un suelo de introducción que solo se
aplica sin fecha, calculado sobre el universo entero (no sobre lo que resta) para
que sea constante: `ceil(3.343 / 161) = 21` conceptos nuevos al día.

```
MARATÓN, 200 días:  100 % en los cuatro tramos → temario completo el día 159
```

El self-test de `planificador.mjs` sigue dando lo mismo.

## El cierre del ciclo: «¿qué tal el examen?»

Quedaba abierto que una fecha vencida dejaba al coach creyendo que el examen era
hoy (`daysLeft = 1`, temario entero volcado en una sesión). Dos piezas:

1. **Salvaguarda.** Una fecha que ya pasó no cuenta como fecha: se planifica en
   modo maratón hasta que el opositor cierre el ciclo.
2. **La ventana.** En `/hoy`, arriba del plan. Guarda la respuesta en
   `examen_rendido` y **borra la fecha**.

### Qué mide la ventana (corregido)

Nació preguntando «¿qué tal el examen?», que es preguntar por el **resultado del
opositor**. No es eso. Lo que interesa es **su apreciación de si la formación le
ha rentado**, y son dos cosas distintas:

- **El resultado de una oposición tarda semanas en publicarse.** Preguntarlo el
  día del examen es pedirle que adivine, y guardaríamos una corazonada creyendo
  guardar un hecho.
- **Si las preguntas le sonaban, en cambio, lo sabe al salir del aula.** Esa es
  la señal que dice si el cerebro apunta donde apunta el tribunal — que es la
  promesa entera del proyecto — y es lo único que la ventana intenta medir.

Por eso la columna dejó de llamarse `resultado` y pasó a `aprovechamiento`. No es
cosmética: con el nombre viejo, quien consultara la tabla dentro de un año leería
aprobados donde no los hay. El texto lo dice de frente: «No te pregunto la nota
—eso tarda en salir—, sino si las preguntas te sonaban».

Lo que la ventana **no** toca: `evento`, `estado_dominio`, el perfil y el cerebro
se quedan igual. Presentarse a un examen no borra lo aprendido, y quien no aprueba
sigue desde donde lo dejó, no desde cero.

### Las tres respuestas, y por qué vuelve la negativa

«👍 Sí, me sirvió» · «👎 No mucho» · «Prefiero no decirlo».

La negativa se había quitado, y con buen motivo mientras la pregunta era «¿qué
tal el examen?»: allí el pulgar abajo señalaba **al opositor** y era pedirle que
declarara su propio fracaso. Preguntando si la formación le sirvió, el pulgar
abajo señala **a Acertium**. Eso no es una herida, es una crítica al producto.

Y hace falta, porque sin ella el indicador **solo sabía subir**: quien no
aprovechó el temario se iría por «prefiero no decirlo» y leeríamos su silencio
como timidez. Con las tres, `sin_decir` vuelve a significar solo lo que dice.

Los dos pulgares van del mismo tamaño y ninguno lleva color de acento: si el «sí»
fuese el botón destacado estaríamos empujando la respuesta que nos conviene, y el
dato dejaría de valer. El texto pide expresamente la mala noticia — «si no te
sirvió, dímelo sin reparos: es lo que más me ayuda a corregir el temario».

Se puede cerrar sin contestar, a propósito: si el opositor cerrase la app sin
responder, la fecha vencida se quedaría sin limpiar y el coach seguiría
descolocado.

## Lo que sigue abierto

- **El peso es una foto de 600 preguntas, y no habrá más.** Ver la tercera vuelta,
  abajo: se midió cuánta confianza merece cada uno y se corrigieron tres.
- **La profundidad todavía no sigue al peso.** Los conceptos de T8 pesan 4 pero
  tienen tantas preguntas como los de T24. Es el punto 1 del orden de trabajo de
  `anchura-y-profundidad.md` y sigue pendiente.
- **`actividad_de_concepto` no evita repetir pregunta.** Hoy da igual porque casi
  no hay entre qué elegir; en cuanto haya profundidad, hará falta.


---

# Tercera vuelta (21/08/2026): cuánto se sostiene cada peso

No hay más exámenes. Seis promociones (37-42), 100 preguntas cada una, es toda la
evidencia que se ha podido conseguir. Eso convierte la nota «re-medir cuando haya
más datos» en un deseo, no en un plan, y obliga a hacer la otra pregunta: **con
seis, ¿cuánto se sostiene cada peso?**

Se mide con `adaptadores/legal-es/estabilidad-pesos.py`, y siempre sobre la
**promoción**, nunca sobre la pregunta: las 100 preguntas de un examen no son
observaciones independientes, las escribió el mismo tribunal el mismo día.

## Prueba 1 — quitar una promoción

Se recalcula la tabla seis veces, quitando cada vez un examen. **Solo 29 de 45
temas mantienen su peso** haciendo eso. Los otros 16 cambian según cuál quites.

## Prueba 2 — bootstrap sobre promociones

Remuestreando las seis 5.000 veces, la probabilidad de que el tramo asignado sea
el que sale:

| Tema | Peso | Confianza |
|---|---|---|
| T8 | 4 | **99 %** |
| T14 | 3 | 77 % |
| T3 | 3 | 76 % |
| T21 | 3 | **62 %** |
| T10 | 3 | **54 %** |
| T17 | 3 | **54 %** |

**Solo 21 de 45 pesos llegan al 80 %.** Los tres marcados son monedas al aire
entre 3 y 2.

## Prueba 3 — encogimiento, y un error propio por el camino

La corrección estándar cuando la muestra es corta es encoger cada estimación
hacia la media según su ruido. **El primer intento estaba mal especificado**: con
un modelo normal de varianza común, T8 salía como el tema MENOS fiable (B = 0,48)
justo cuando el bootstrap le daba un 99 %. Esa contradicción era el aviso — en
conteos el ruido crece con el tamaño, y penalizar la varianza bruta castiga a los
temas grandes por ser grandes.

Rehecho con Gamma-Poisson, que es el modelo que corresponde a conteos, las dos
vías coinciden:

| Tema | Bruto | Encogido | Se cree al dato | Peso |
|---|---|---|---|---|
| T8 | 54 | 45,8 | 94 % | 4 |
| T3 | 23 | 21,0 | 87 % | 3 |
| T14 | 22 | 20,2 | 87 % | 3 |
| T10, T17, T21 | 20 | 18,6 | 86 % | **3 → 2** |
| T24 | 1 | 3,4 | **23 %** | 1 |

## Lo que se cambió

**T10, T17 y T21 bajan de 3 a 2.** Son exactamente los tres que el bootstrap daba
por monedas al aire, y los mismos que el encogimiento empuja por debajo del corte.
Dos métodos independientes de acuerdo: eso es lo que da confianza al cambio.

| Peso | Temas | Conceptos | Antes |
|---|---|---|---|
| 4 | T8 | 257 | 257 |
| 3 | T3, T14 | 219 | 865 |
| 2 | 28 temas | 2.377 | 1.731 |
| 1 | 14 temas | 490 | 490 |

## Lo que se asume, dicho en voz alta

Los tramos siguen siendo **más finos de lo que la muestra sostiene**: 24 de 45
temas quedan por debajo del 80 % de confianza. No se aplana la tabla del todo por
una razón concreta: **el peso solo cambia el ORDEN de presentación, nunca la
cobertura**, así que equivocarse en un tramo cuesta poco —el concepto llega antes
o después, pero llega—. Sería muy distinto si el peso decidiera qué se estudia.

Lo único que hay que evitar es tratar esta tabla como si midiera la verdad. **T24
pesa 1 con UNA sola pregunta en 600**: tras encoger, su estimación es un 23 %
dato y un 77 % prior. Es un peso razonable, no un hecho medido.

`estabilidad-pesos.py` compara `pesos-temas.json` contra la tabla encogida y
avisa si divergen, así que el día que aparezca una séptima promoción basta con
añadirla al CSV y correrlo.

---

# Cuarta vuelta (21/08/2026): el seguimiento de los 30 días

La ventana del día siguiente no puede preguntar por el resultado, porque el
resultado no existe todavía. Al mes sí, así que hay un **segundo y último
momento**, con una pregunta distinta.

| | Cuándo | Qué pregunta | Por qué entonces |
|---|---|---|---|
| Ventana 1 | Al volver, con la fecha ya pasada | ¿Te sirvió lo que estudiaste aquí? | Si las preguntas le sonaban lo sabe **al salir del aula** |
| Ventana 2 | A los 30 días | ¿Seguiste en el proceso? ¿Con qué nota? | La nota de la primera prueba ya suele estar publicada |

Nunca se muestran las dos a la vez: la primera solo aparece con una fecha vencida
sin cerrar, y la segunda solo con una fila ya cerrada.

## Solo la primera prueba — la de cuyo contenido respondemos

Se pregunta **exclusivamente por la primera prueba**: las cien preguntas del
temario del anexo I. Los psicotécnicos, las físicas, el reconocimiento médico y
la entrevista no dependen de lo que se estudia aquí.

Excluirlos no da una medida más pobre, da una **mejor**: si el proceso entero
entrara en el mismo dato, un «no» que en realidad fue una lesión en el circuito
se leería como un fallo del temario.

## «Aprobar» era ambiguo — leyendo la base 6.1.1

La primera redacción preguntaba «¿lo pasaste?», y al ir al PDF de la convocatoria
resultó que esa palabra no significa una sola cosa:

> «Se calificará de cero a diez puntos. Únicamente serán seleccionadas para
> continuar en el proceso las personas aspirantes que habiendo alcanzado la
> **puntuación mínima de 3 puntos** obtengan las **mejores calificaciones**, hasta
> llegar a **1'75 aspirantes por cada una** de las 2.163 plazas.»

Es decir: **se puede sacar un 5 —aprobado de sobra— y no continuar**, porque el
corte real lo pone la competencia, no el 3. Un sí/no mezclaba las dos cosas en la
misma casilla.

Arreglado en tres sitios:

- La pregunta es **«¿seguiste en el proceso?»**, no «¿aprobaste?».
- La columna se llama **`paso_corte`**, no `aprobo`.
- Se pide además **la nota (0-10, opcional)**, que desambigua las dos cosas y es
  el único dato comparable contra el dominio que el motor le estimaba antes del
  examen. Ahí está la medida de verdad de si esto funciona.

## «Aún no lo sé» es una respuesta, no un descarte

Para mucha gente es la verdad ese día, y forzarla a inventarse un sí o un no
ensuciaría el único dato duro que vamos a tener. Cuando la elige, **se le vuelve
a preguntar un mes después** en vez de darlo por cerrado.

Probado con cuatro casos contra la base real:

```
 5 días, sin contestar          → no aparece  (aún no es el mes)
31 días, sin contestar          → aparece
90 días, dijo «aún no lo sé»
        hace 31 días            → vuelve a aparecer
200 días, ya contestó «sí»      → no aparece  (cerrado)
```

Y el `CHECK` de la nota rechaza en la base un 11, además de validarlo el cliente:
la validación del formulario evita el viaje, la de la base evita el dato malo.

## Una vista, no dos consultas

`acertium_v2.seguimiento_pendiente` decide a quién le toca. Existe como **vista** y
no como consulta suelta para que la app y un futuro envío por correo usen
exactamente el mismo criterio: dos criterios distintos harían que a alguien le
llegara el aviso dos veces, o ninguna. La vista ya expone el `email` del usuario
precisamente para que un envío pueda apoyarse en ella sin reimplementar nada.

## Sobre el correo

Está preparado el dato, no el envío. Mandar correo a opositores reales no es
añadir una llamada: hace falta dominio verificado con SPF/DKIM, una base legal
para el contacto y su registro, baja en un clic en cada envío, y decidir qué pasa
con quien no confirma su dirección. Nada de eso es difícil, pero es una decisión
de producto y de RGPD, no un detalle de implementación — y hasta que se tome, la
ventana en la app cubre a quien vuelve.

**Lo que la app no alcanza, y conviene tener presente:** quien aprobó y dejó de
entrar no verá nunca esta ventana. Es justo la población de la que más
interesaría saber, y es el argumento real a favor del correo.
