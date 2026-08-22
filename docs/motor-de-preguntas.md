# El motor de preguntas (opción B)

> 22/08/2026. `generar.mjs` lo anunciaba en su cabecera desde el diseño:
>
> ```
> El <lote.json> lo produce el "motor de generación":
>   · Opción A (hoy): el agente, siguiendo contrato-generacion.md.
>   · Opción B (futuro): un job con la API de Claude. Mismo contrato, misma puerta.
> ```
>
> Esto es la opción B. Estaba planificada y nadie la había construido.

## El cuello de botella no era el que yo decía

Al planificar la profundidad calculé que hacían falta ~2.900 preguntas y lo
presenté como un problema de fuente: «cada concepto tiene ~340 caracteres de
norma, no da para más». Dos cosas desmontaron esa cuenta:

1. **La pregunta inversa sale del MISMO cotejo.** No necesita texto nuevo.
2. **El cuello de botella era yo escribiéndolas a mano.** DISC —26 conceptos—
   costó una sesión entera para 23 preguntas.

La trazabilidad, que era mi objeción de fondo, nunca fue el problema: **el
artículo es la ENTRADA del generador**, y la puerta comprueba que la respuesta
sale literalmente de él. No hace falta confiar en el generador.

## Qué hace

```
node motor-preguntas.mjs --familia DISC --seccion 14
node motor-preguntas.mjs --familia DISC --seccion 14 --dry
node motor-preguntas.mjs --familia DISC --seccion 14 --material m.json
```

- **Entrada**: el artículo del corpus + los conceptos que cuelgan de él + **las
  preguntas que ya tienen**.
- **Salida**: un JSON de propuestas. No carga nada.
- **Unidad**: el **artículo**, no el concepto. Cuelgan 2,5 conceptos de media del
  mismo texto; pidiendo por concepto salen dos veces las mismas preguntas.
- `--dry` enseña el encargo sin llamar a la API. `--material` lee los conceptos de
  un fichero en vez de la base: sirve para revisar y para reproducir una tirada.

## El motor propone, la puerta dispone

El fichero **no carga y no decide si algo es correcto**. Escribe un JSON que
después pasa `aplicar-profundidad.mjs` con las cuatro puertas fail-closed. Si el
modelo se inventa un cotejo, la puerta lo tira.

Las reglas van **explícitas dentro del prompt**, no referenciadas: el modelo no
tiene el repo delante. Son las mismas de `contrato-generacion.md`, incluidas las
dos que salieron de hallazgos recientes:

- **El enunciado tiene que dejar UNA sola respuesta en pie** — riesgo propio de la
  inversa, que funciona quitando el sujeto del enunciado.

Aquí había una segunda regla, «ningún distractor puede ser texto literal del
cotejo», que **se ha quitado**: al medirla sobre el banco dio 16 marcadas y 16
falsos positivos. Prohibía justo las mejores preguntas —las que enfrentan dos
reglas del mismo artículo y las separan con un ordinal, un superlativo o una
exclusión—. Ver `docs/puerta-de-unicidad.md`.

Y una que importa para no inflar el banco con ruido: **si el artículo no da para
otro ángulo honesto, devuelve menos preguntas**. Es correcto y esperado.

## Capa 2, medida antes de gastar

El afinado de distractores es un paso fijo del contrato (§0-quater). Aquí se
**mide primero**: si el lote ya está por debajo del 35 % de sesgo de longitud, no
se afina.

**Del afinado se acepta UNA cosa: los distractores.** El enunciado, el cotejo y
la opción correcta se reimponen desde el original, cuadrando pregunta a pregunta
por `concepto_id`. Lo que no cuadre se revierte a su versión sin afinar, que es
peor pregunta pero es una pregunta buena. La razón es que los dos daños posibles
son asimétricos y ninguno de los dos se arregla solo:

| Si el afinado toca… | ¿Lo ve alguna puerta? | Coste |
|---|---|---|
| la **opción correcta** | Sí, `verificarLote` | Tira **el lote entero**, y con él las 90 buenas de la misma tirada |
| el **enunciado** o el **cotejo** | **No** | La pregunta sigue siendo válida, pero ya no es la que se revisó |

**«Longitud parecida» no es la métrica.** Lo que se mide es *en qué porcentaje de
preguntas la correcta es la más larga*, y **empatar cuenta como serlo**
(`verificar-calidad.mjs:48`, `correcta.length === maxLen`). Un afinador que deja
los tres distractores un poco más cortos cumple la letra del encargo y **no mueve
el número**: para bajar hace falta que en la mayoría de preguntas al menos un
distractor sea *estrictamente* más largo. El prompt de afinado ahora lo dice con
el número delante — el banco real está en el **23 %** (788 de 3.434, de las
cuales 133 son empates exactos), y ese es el listón.

Y como solo se afina **una vez**: si tras afinar sigue por encima del 35 %, se
avisa explícitamente de que la puerta **no** lo va a parar (corta en el 55 %).

## Configuración de la API

`claude-opus-5`, pensamiento adaptativo, `effort: high`, y **structured outputs**
con esquema JSON para que la salida no haya que parsearla a mano. `stop_reason:
"refusal"` llega con HTTP 200, así que se comprueba antes de leer el contenido.

## Cómo se prueba sin credenciales

`motor-preguntas.test.mjs` (en `npm run test:motor`, 20 comprobaciones) le pasa a
`ejecutar` un **cliente de mentira** que devuelve exactamente lo que se quiere
probar, incluido lo que un modelo hace mal: ids inventados, JSON ilegible,
`refusal`, un afinado que toca la correcta, uno que cambia el enunciado, uno que
devuelve otra cantidad, uno que revienta a mitad. Lo único que queda sin
ejercitar es el **transporte HTTP**.

No mide si las preguntas son *buenas*: eso lo dicen las cuatro puertas y una
lectura humana. Mide que **el motor se porta bien cuando el modelo no**.

Escribir esa prueba encontró tres cosas, todas arregladas:

1. **Un `concepto_id` inventado se llevaba por delante toda la tirada.** Salía con
   `articulo: undefined`, `aplicar-profundidad` no le encontraba fuente y
   rechazaba **el fichero entero** — fail-closed correcto, precio desproporcionado.
   Ahora se descarta esa pregunta, en el sitio donde se sabe por qué.
2. **El afinado se creía a pies juntillas.** Ver la tabla de Capa 2, arriba.
3. **`aplicar-profundidad` tenía un fail-open silencioso.** `supabase-js` no lanza
   cuando el RPC falla: devuelve `{ data: null, error }`. El `catch` no lo veía y
   `data ?? []` dejaba el banco vacío **sin decir nada**, así que la puerta de
   unicidad corría ciega y `--aplicar` insertaba igual. Ahora sin banco se puede
   simular, pero no aplicar: *una puerta que se desactiva sola cuando falla la red
   no es una puerta.*

## Lo que sigue sin estar probado

**El motor no se ha ejecutado nunca contra la API.** Hace falta la única medida
que decide si esto sirve: **correr el motor sobre DISC y comparar lo que produce
con las 23 preguntas escritas a mano**, que ya están cargadas y sirven de patrón.
Hasta entonces no hay dato sobre la calidad de lo que genera — solo sobre la
solidez de la tubería que lo rodea. No soltarlo sobre las 52 normas antes de esa
comparación.

## Decisión: esto se queda parado (23/08/2026)

Jonathan: **«el API lo usaremos cuando veamos que tiene futuro el MVP, por el
momento seguimos de forma manual».**

Así que la opción B queda **construida y en pausa**, y esto no es una tarea
pendiente que se haya olvidado: es una decisión. Lo que implica, para que dentro
de un mes no haya que reconstruir el razonamiento:

- **El camino manual no depende de nada de esto.** `motor-preguntas.mjs` es el
  único fichero del repo que importa `@anthropic-ai/sdk` (comprobado). El camino
  de siempre —escribir el lote siguiendo `contrato-generacion.md`, pasar las
  puertas, `cargar.mjs`— corre sin llave y sin red.
- **La opción B no se pudre mientras espera**, porque sus 20 comprobaciones usan
  un cliente de mentira y entran en `npm run test:motor`. Si alguien rompe el
  motor arreglando otra cosa, salta ahí y no el día que se encienda la API.
- **La prueba de fuego sigue siendo la misma** cuando llegue el momento: DISC
  contra las 23 escritas a mano. No hace falta decidirla ahora.
- **Lo que sí sigue aplicando hoy** es la regla 10 en su versión nueva
  (justificación opcional, no se cita): la escribe el motor, pero también la mano.
  Ver `docs/las-dos-explicaciones.md`.
