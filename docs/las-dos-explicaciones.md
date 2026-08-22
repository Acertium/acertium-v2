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

El self-test de `nucleo/verificar-justificacion.mjs` (en `npm run test:motor`)
la prueba contra **30 cadenas sacadas del banco**, no inventadas: 19 citas y 11 explicaciones.

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
cuando se sabe. Entonces el runtime no adivina: pregunta.

---

# Segunda parte (23/08/2026): el campo pasa a ser opcional

> Jonathan, al leer lo de arriba: «¿Qué diferencia hay entre una justificación y
> una explicación? No sé por qué necesitamos una de cada para cada pregunta».
>
> Y después: **«no quiero relleno, solo información que valga la pena saber»**.

La respuesta corta a su pregunta es que **no** hacía falta una de cada. Hacían
falta las dos solo cuando un concepto tiene varias preguntas — y el **97,9 %** de
los conceptos (3.272 de 3.343) tiene exactamente una. Que el campo fuera
`NOT NULL` obligaba a escribir algo en las otras 3.300, y lo que se escribió fue
la referencia.

## Lo que se midió antes de tocar

| | |
|---|---|
| actividades del banco | 3.434 |
| longitud mediana de la justificación | **22 caracteres** — «Art. 15 LO 4/2010.» |
| que el runtime ya ocultaba por heurística | **3.333 (97 %)** |
| que llegaban al opositor | **101** |
| de esas, que de verdad enseñan algo, **leídas a mano** | **45** |

O sea: un campo obligatorio cuyo contenido era, en el 99 % de los casos, una
copia de lo que ya sale en pantalla como «Ver fuente · art. 15».

## Lo que se hizo

`actividad.justificacion` **deja de ser `NOT NULL`**. NULL es la respuesta
normal, no una carencia que rellenar. Y el runtime **deja de adivinar**: pinta la
justificación si no es NULL, sin heurística de por medio. La señal está en el
dato, que era justo lo que pedía la sección anterior.

- **Puerta** (`nucleo/verificar-lote.mjs`): si el motor escribe una cita, se
  **retira** y se carga NULL. Se retira y no se rechaza el lote: una cita no es
  un error de contenido, es un campo que sobra, y rechazar por eso volvería
  irreverificables los 110 lotes históricos.
- **Motor** (regla 10): la justificación es opcional, no se cita, y *«si no
  tienes nada que enseñar, escribe "" y no pasa nada»*.
- **Migración**: `infra/migracion-justificacion-opcional.sql`. Nada se borra —
  las 3.389 retiradas quedan en `acertium_v2.justificacion_retirada` con su
  motivo y su fecha, así que esto se deshace con un `UPDATE`.

## Por qué las 101 supervivientes se leyeron a mano

Porque la heurística **no sabe distinguir «enseña» de «repite la respuesta»**.
Estas dos pasan igual, y solo una vale:

```
✓ «El encubrimiento aquí es por OMISIÓN: basta con callar. No hace falta
   ocultar pruebas ni ayudar al autor.»                              DISC-004
✗ «Art. 17.2 CE: la detención dura el tiempo estrictamente necesario y,
   en todo caso, un máximo de setenta y dos horas.»                CE-T1-018
```

La segunda no es una cita, así que la puerta la deja pasar — pero es el enunciado
otra vez, que es lo que la regla 10 prohíbe expresamente. Y las 15 de `RDP-*`
sobreviven por un motivo todavía peor: **«Art.» cuenta como fin de frase**, así
que «Art. 19.1 del Reglamento de Organización y Funcionamiento del Defensor del
Pueblo.» parece tener una explicación detrás.

**Se intentó arreglar la heurística y se descartó.** Corregir el corte de frase
tumbaba `PJ-002` y `PJ-012`, que separan con `;` en vez de con punto. Y ensanchar
la detección de citas para pillar «ITC 2, apartado 1 (…)» tumbaba «Seis meses de
parálisis, y solo si la culpa no es del expedientado…», que es de las buenas. El
coste es asimétrico: **un falso positivo BORRA una frase que enseñaba.** Se dejó
como estaba y se leyó.

### Las 45 que se quedan

| | | por qué |
|---|---|---|
| `DISC-*` | 23 | escritas a mano con la regla 10; enseñan la distinción que se prueba |
| `CEDH-*` | 14 | qué Protocolo modificó qué artículo, con su BOE-A — **procedencia que no está en ningún otro campo** |
| `%distractores%` | 4 | ACTIT-002, ACTIT-010, ETICA-011, SEGT-002: dicen por qué las otras tres son falsas |
| `PJ-002`, `PJ-012` | 2 | resuelven una anáfora del artículo («'estos últimos' son los superiores policiales») |
| `ITC-018` | 1 | «en la redacción de la Orden INT/291/2025» — hace falta para la regla 7 (caducidad) |
| `CE-T1-057` | 1 | dos artículos distintos que remiten a lo mismo |

Y se retiran 56: localizadores (`ITC 2, apartado 1 (…)`, los 15 de `RDP-*`),
marcas de procedencia («Paráfrasis fiel; …») y paráfrasis que repiten la
respuesta (`CE-T1-018`, `CE-T1-022`, `INMIG-015`…).

## Qué cambia para el opositor

**Casi nada, y a propósito.** De las 101 que veía, deja de ver 56 — que eran
referencias duplicadas de «Ver fuente». Las 45 que enseñaban algo siguen ahí.

Lo que cambia es hacia delante: el banco ya no arrastra 3.389 campos de relleno
que había que ir esquivando con una heurística, y el motor tiene permiso
explícito para no escribir nada cuando no hay nada que decir.
