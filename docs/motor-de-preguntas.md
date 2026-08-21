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

- **Ningún distractor puede ser texto literal del cotejo** (las 23 preguntas
  imposibles de acertar que encontró la puerta de unicidad).
- **El enunciado tiene que anclar de qué habla** — riesgo propio de la inversa,
  que funciona quitando el sujeto.

Y una que importa para no inflar el banco con ruido: **si el artículo no da para
otro ángulo honesto, devuelve menos preguntas**. Es correcto y esperado.

## Capa 2, medida antes de gastar

El afinado de distractores es un paso fijo del contrato (§0-quater). Aquí se
**mide primero**: si el lote ya está por debajo del 35 % de sesgo de longitud, no
se afina. Si el afinado devuelve un número de preguntas distinto del que se le
mandó, se descarta y se deja el original — un afinado que pierde preguntas es un
afinado roto, no una mejora.

## Configuración de la API

`claude-opus-5`, pensamiento adaptativo, `effort: high`, y **structured outputs**
con esquema JSON para que la salida no haya que parsearla a mano. `stop_reason:
"refusal"` llega con HTTP 200, así que se comprueba antes de leer el contenido.

## Lo que NO está probado

**No se ha ejecutado contra la API.** El contenedor de esta sesión no tiene
credenciales ni `.env.local`, así que lo verificado es:

- El encargo se monta bien (`--dry`), con el artículo literal, los conceptos y lo
  ya preguntado.
- **La salida del motor pasa las cuatro puertas** — probado con una salida
  simulada con la forma exacta del motor.
- El self-test de la puerta de unicidad entra en `npm run test:motor`.

Lo que falta es la única medida que importa de verdad: **correr el motor sobre
DISC y comparar lo que produce con las 23 preguntas escritas a mano.** Ahí se
sabrá si el job sirve, antes de soltarlo sobre 52 normas.
