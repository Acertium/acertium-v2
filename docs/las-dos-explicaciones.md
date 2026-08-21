# Las dos explicaciones

> 22/08/2026. Pregunta de Jonathan: «las explicaciones de las preguntas que se
> generan automáticamente, ¿qué hacemos? Por no tener unas que sí y otras que no».
>
> Resulta que lo de «unas sí y otras no» ya estaba resuelto, y que el problema
> real era otro y estaba a punto de crecer.

## Lo que había: dos textos, y solo se servía uno

| | `concepto.explicacion` | `actividad.justificacion` |
|---|---|---|
| ¿De qué habla? | del **concepto** | de **esta pregunta** |
| ¿Se repite? | sí, en todas las preguntas del concepto | no, es única |
| Qué dice | contexto general | la distinción que se probaba, o el error típico |
| ¿Se veía? | **sí** | **no** |

Cobertura, medida: **3.343/3.343 conceptos con explicación, 3.434/3.434
actividades con justificación. Cero sin.** Nada faltaba.

Lo que pasaba es que `lib/cerebro.ts` **traía** la justificación (línea 418, y la
devolvía en la 514) y `practica-runner.tsx` **no la pintaba nunca**. Con UNA
pregunta por concepto no se notaba: la explicación del concepto y su única
pregunta hablaban de lo mismo.

**El motor de preguntas existe justamente para romper eso.** Caso real, DISC-020
(art. 15, prescripción), dos preguntas del mismo concepto:

```
1  «¿En qué PLAZOS prescriben las faltas?»
   ve → «El artículo 15 fija los plazos: tres años las muy graves…»   ✓ encaja

2  «Una vez interrumpida, ¿cuándo se REANUDA la prescripción?»
   ve → «El artículo 15 fija los plazos: tres años las muy graves…»   ✗ no responde

   y su justificación, que estaba escrita y guardada:
   «Seis meses de parálisis, y solo si la culpa no es del expedientado:
    quien retrasa su propio expediente no gana prescripción con ello.»
```

Ya pasaba en **71 conceptos (162 preguntas)**, y cada pregunta que añada el motor
suma una más.

## Lo que NO se podía hacer: cambiar una por otra

Medido antes de tocar nada: **el 89 % de las justificaciones (3.057 de 3.434) son
solo una cita.** Longitud mediana, **22 caracteres** — «Art. 15 LO 4/2010.».
Servir eso en lugar de la explicación habría sido una regresión en nueve de cada
diez preguntas, y encima duplicando lo que ya sale en «Ver fuente · art. 15».

## Lo que se hizo

Se muestran **las dos**, en el orden en que sirven: primero la justificación
—habla de lo que acabas de fallar—, debajo y atenuada la explicación del
concepto, como contexto. Y la justificación **solo cuando aporta**.

En `practicar` y en la corrección del `simulacro`, donde se repasan muchas
seguidas y el efecto se nota más.

### La cicatriz de la heurística

`justificacionAporta()` decidía en su primera versión **por longitud** (≥ 45
caracteres). Al contrastarla contra cadenas reales del banco se cayó sola:

```
«INCIBE, Glosario de términos de ciberseguridad (2021), «Ciberdelincuente».»   74 car.
«FMI (2000), sección III: crecimiento desigual y ampliación de la brecha.»     72 car.
```

Las dos son referencias y las dos habrían pasado. **La longitud no es la señal**:
las familias no-BOE citan largo, y en quince estilos distintos («INCIBE, …»,
«DGT, Manual II…», «RAE-ASALE, DLE:…», «A/RES/70/1…», «Britannica «…»»). La
versión buena detecta **cómo empieza**: una cita abre con la fuente y su
localizador; una explicación abre con el sujeto de lo que va a decir.

Se salva la cita cuando detrás hay explicación de verdad («Art. 7 LO 4/2010. Se
castiga participar, no solo convocar.»), y no basta con que haya una segunda
frase: «Wikipedia (es), «Movimiento antiglobalización»: controversia del término.
CONSENSO.» tiene dos, pero la segunda es una marca, no una explicación.

`lib/justificacion.test.mjs` (en `npm run test:motor`) la prueba contra **30
cadenas sacadas del banco**, no inventadas: 19 citas y 11 explicaciones.

## Qué gana esto hoy, y qué no

Con la regla puesta, **102 de 3.434 preguntas (3 %) mostrarían justificación**. De
las 162 que están en conceptos con dos o más, **36**.

O sea: **la cañería queda arreglada; el contenido es el trabajo.** Y es un
trabajo que se va haciendo solo hacia delante, porque la regla 10 del motor
(`motor-preguntas.mjs`) ya exige que la justificación sea «una frase que enseña
algo: la distinción que se está probando, o el error típico. No repitas la
respuesta». Todo lo que genere el motor cuenta; las 23 de DISC escritas a mano
también.

## Lo que hay que arreglar de raíz

**La señal no debería adivinarse de una cadena de texto.** `justificacionAporta`
es un parche honesto pero es eso: una heurística sobre texto, y hoy ya me ha
fallado una vez antes de llegar a producción.

Lo correcto es guardar **qué es** cada justificación cuando se escribe, que es
cuando se sabe: un campo `justificacion_tipo` ∈ `cita` | `ensena`, que el motor
rellena (su regla 10 lo garantiza) y que una puerta comprueba para el contenido
nuevo. Entonces el runtime no adivina: pregunta.

Mientras tanto queda la decisión de contenido, que es de Jonathan: **rellenar las
~3.300 justificaciones que hoy son solo cita**, o dejar que se vayan llenando
según el motor amplíe cada concepto. No bloquea nada: donde no hay justificación
buena, el opositor ve exactamente lo que veía ayer.
