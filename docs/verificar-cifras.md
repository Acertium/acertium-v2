# Verificar las cifras de una explicación

*23/08/2026. Escrito después de medir, no antes.*

## El agujero que había

`verificar-lote` comprobaba que las cifras de una explicación estuvieran en el
artículo, pero con la **cifra pelada**. En el BOE eso no comprueba casi nada
para los enteros pequeños, porque los artículos van numerados:

> 1. El empresario aplicará… **2.** Se evaluará… **3.** Se combatirá en su origen.

El 2 y el 3 están en el texto pase lo que pase. Así que una explicación podía
decir «el plazo es de tres años» sobre un artículo que dice dos, y pasar la
puerta porque el artículo tenía un apartado 3.

**Medido** sobre los 110 lotes: de las **1.483** cifras 1-9 que la puerta daba
por respaldadas, **623 (42 %)** lo estaban solo por numeración de apartado o por
una cita normativa. La medición usa un proxy —quitar marcadores y citas con
expresión regular—, así que el 42 % es orden de magnitud, no cifra exacta.

## La palanca: el andamiaje nunca lleva unidad

Se tabuló qué palabra sigue a una cifra en el corpus entero (79 secciones). O es
una **unidad**…

| unidad | veces | unidad | veces |
|---|---|---|---|
| `años` | 1.487 | `horas` | 124 |
| `meses` | 1.021 | `euros` | 115 |
| `días` | 548 | `metros` | 81 |

…o es **andamiaje** (`de` 2.911, `la` 1.684, `el` 1.561), que es la numeración
de apartado y las citas.

De ahí `nucleo/verificar-cifras.mjs`: no comprueba la cifra, comprueba el **par
cifra+unidad**. «3 años» tiene que estar en el artículo como «3 años», y ningún
apartado numerado puede fabricar eso.

## La asimetría, que es lo delicado

**El lado fuente se ensancha; el lado explicación no.** La ley elide de dos
maneras, y las dos son idiomáticas:

- **el numeral**: «las leves prescriben **al mes**» = 1 mes
- **la unidad**: «mínima de tres meses y **máxima de cuatro**» = 4 meses;
  «por nueve años… se renueva **cada tres**» = 3 años

Ensanchar solo la fuente hace la puerta más permisiva, nunca más ciega de lo que
ya era. Al revés haría daño, y está medido: con la regla simétrica, «el 100 %
del IPREM **al mes**» (EXTR-074) y «cosa juzgada **al día** siguiente»
(CE-T9-012) inventaban un «1 mes» y un «1 día» que nadie había escrito.

## Qué encontró al estrenarse

Sobre las 404 explicaciones del banco que llevan cifra con unidad: **ni un solo
error de contenido**. Los 8 hallazgos son referencias cruzadas a otros artículos
que hoy pasaban mudas y que ahora hay que declarar en el campo `cifras`:

- `LEC-037` cita «las setenta y dos horas del art. 520» estando en el art. 496
- `APAT-020` contrasta con «los seis meses del expediente de asilo»
- `CE-T9-004` contrasta los nueve años del TC con «los cinco años del CGPJ»

Eso es exactamente lo que la puerta debe pedir: no que la cifra sea falsa, sino
que **conste de dónde sale**.

## Lo que esto NO cubre, y por qué

Los **recuentos sin unidad** —«las dos condiciones», «los tres criterios»— siguen
sin verificarse. No es pereza: no son verificables de forma determinista, y hay
medición que lo respalda.

Se probaron dos vías y las dos se descartaron:

1. **Contra la enumeración del artículo.** Muchos recuentos correctos no cuentan
   la enumeración del artículo sino cosas que el autor agrupa («los dos agentes
   que sorprenden» de una lista de nueve). Falsos positivos a mansalva.

2. **Consistencia interna** (si la explicación dice «tres X» y luego enumera,
   contar lo enumerado). Medido sobre las 767 explicaciones reescritas: **118
   recuentos detectados, 55 discrepancias — y al leerlas, todas correctas.** El
   español anida las enumeraciones: «leyes marco, leyes de transferencia **o**
   delegación, y leyes de armonización» son tres instrumentos, no cuatro;
   «expresión, reunión **y** asociación, y no discriminación» son tres artículos,
   no cinco.

Una puerta con 55 falsos positivos de 118 es peor que no tener puerta: es la
misma trampa en la que ya cayó `distractoresQueTambienSonVerdad`, que se retiró
el 22/08 con 16 marcadas y 16 falsos positivos. **No se construyó.**

### Entonces, ¿qué se hace con los recuentos?

Se leen. Los 55 recuentos que la puerta de cifras nunca había verificado se
comprobaron a mano contra el artículo el 23/08/2026: **55 de 55 correctos**. La
lectura encontró, eso sí, dos defectos que ninguna puerta miraba —`PJ-020` y
`PJ-023` enunciaban la regla comiéndose una salvedad expresa del mismo párrafo—,
y esa es la pista de dónde está el riesgo real: no en la cifra, sino en la
omisión.

Si algún día se quiere cubrir eso, no será afinando esta puerta. Hace falta otra
cosa —revisión con criterio, humana o asistida— y conviene no disfrazarla de
comprobación determinista.
