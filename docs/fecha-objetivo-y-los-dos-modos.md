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
