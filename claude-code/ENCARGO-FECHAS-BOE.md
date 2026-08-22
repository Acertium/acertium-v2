# ENCARGO — fechas de última modificación que faltan (agente con acceso al BOE)

> 23/08/2026. Para un agente **externo** con acceso a `boe.es`. No tiene el repo,
> así que el prompt de abajo es autónomo: las reglas van explicadas dentro, no
> referenciadas.
>
> Se pasa **pegado en el chat**, dentro de un bloque de código. Este fichero es
> solo el registro.

## Por qué hace falta

`acertium_v2.norma` registra las 61 normas del banco con su fecha de última
modificación, que es la línea base de la regla 7 (los datos normativos caducan).
54 la tienen, sacada de la cabecera de cada norma en el Código 600. **Siete no**,
porque sus secciones del corpus no traen el metadato. Entre las siete sostienen
**213 conceptos**.

Y hay una octava pregunta, distinta: la Constitución figura con última
modificación **20 de mayo de 2026**, lo que la haría «volátil» por la regla de
clasificación; pero `articulo_reforma` solo registra dos reformas en 48 años y la
clasificación puesta a mano dice `estable`. Hay que saber si ese 2026-05-20 es
una reforma sustantiva o una actualización editorial del texto consolidado.

## Lo que NO se le pide

No se le pide el barrido de las otras 54 normas (ir hoy al BOE y comprobar si
alguna se ha reformado desde que se hizo el Código 600). Eso sería otro encargo,
más largo y también valioso — pero mezclarlo con este alarga la respuesta y
retrasa lo que falta.

## El prompt

```
Necesito que consultes el BOE y me devuelvas un dato muy concreto de ocho
normas españolas. Es para un sistema de estudio de oposiciones, así que un dato
mal puede perjudicar a un opositor: prefiero "no consta" antes que una fecha
aproximada.

REGLAS, y son innegociables:
- Solo fuente oficial: www.boe.es. Nada de blogs, resúmenes ni wikis.
- No respondas de memoria. Si no has abierto la página, no lo pongas.
- Si un dato no aparece en la página, escribe "no consta" y explica por qué en
  la nota. No estimes, no interpoles, no deduzcas de la fecha de publicación.
- Dime en cada caso la URL exacta que consultaste y la fecha en que lo hiciste.

QUÉ BUSCAR EN CADA UNA
El texto consolidado del BOE está en:
    https://www.boe.es/buscar/act.php?id=<IDENTIFICADOR>
En la cabecera de esa página, junto a la referencia y la fecha de publicación,
aparece una línea "Última modificación: <fecha>". Esa es la que quiero.

AVISO IMPORTANTE sobre los tratados internacionales: cuatro de las ocho
(BOE-A-1979-24010, BOE-A-1987-25053, BOE-A-2010-8504, BOE-A-2021-7554) son
instrumentos de ratificación de convenios, y es MUY posible que el BOE no
publique texto consolidado de ellos. Si es el caso, dímelo tal cual —"no hay
texto consolidado, la entrada es de tipo instrumento de ratificación"— y dame
en su lugar la fecha de publicación en BOE y, si la página lo indica, si consta
alguna modificación posterior. No te inventes una "última modificación" que la
página no da.

LAS SIETE QUE ME FALTAN

1. BOE-A-2006-21990
   Ley 39/2006, de 14 de diciembre, de Promoción de la Autonomía Personal y
   Atención a las personas en situación de dependencia.

2. BOE-A-1997-1853
   Real Decreto 39/1997, de 17 de enero, por el que se aprueba el Reglamento de
   los Servicios de Prevención.

3. BOE-A-2019-6347
   Orden PCI/487/2019, por la que se publica la Estrategia Nacional de
   Ciberseguridad 2019.

4. BOE-A-1979-24010
   Convenio Europeo para la Protección de los Derechos Humanos y de las
   Libertades Fundamentales (Roma, 4 de noviembre de 1950).

5. BOE-A-1987-25053
   Convención contra la Tortura y otros tratos o penas crueles, inhumanos o
   degradantes (1984).

6. BOE-A-2010-8504
   Protocolo n.º 14 al Convenio para la Protección de los Derechos Humanos y de
   las Libertades Fundamentales (Estrasburgo, 13 de mayo de 2004).

7. BOE-A-2021-7554
   Protocolo n.º 15 de enmienda al Convenio para la Protección de los Derechos
   Humanos y de las Libertades Fundamentales (Estrasburgo, 24 de junio de 2013).

LA OCTAVA, QUE ES UNA PREGUNTA DISTINTA

8. BOE-A-1978-31229 — Constitución Española.
   Tengo anotado que su última modificación es el 20 de mayo de 2026 y no me
   cuadra: la Constitución se ha reformado muy pocas veces. Necesito distinguir
   dos cosas que se confunden con facilidad:
     (a) ¿qué dice exactamente la línea "Última modificación" de su texto
         consolidado?
     (b) en el apartado de análisis/modificaciones de esa misma página, ¿aparece
         listada alguna modificación de la Constitución con fecha de 2026? Si
         aparece, dime qué norma la produjo y a qué artículo afecta. Si NO
         aparece ninguna modificación de 2026, dímelo también — significaría que
         esa fecha es una actualización editorial del consolidado y no una
         reforma, que es justo lo que quiero saber.

FORMATO DE RESPUESTA
Devuélvemelo como un bloque JSON, un objeto por norma, con estos campos:

[
  {
    "referencia_boe": "BOE-A-2006-21990",
    "ultima_modificacion": "2026-01-15",   // AAAA-MM-DD, o "no consta"
    "url_consultada": "https://www.boe.es/buscar/act.php?id=BOE-A-2006-21990",
    "fecha_consulta": "2026-08-23",
    "nota": ""                              // por qué "no consta", o cualquier
                                            // salvedad. Vacío si no hay nada
                                            // que añadir.
  }
]

Para la número 8 añade además un campo "modificaciones_2026" con lo que hayas
encontrado en el apartado de análisis, o "ninguna" si no hay.

Si alguna página no carga o el BOE no responde, dilo en la nota de esa norma en
vez de dejarla fuera: necesito saber cuáles quedaron sin comprobar.
```

## Qué hacer con la respuesta

Pegármela. Con ese JSON:

- las que traigan fecha entran en `norma.ultima_modificacion` y se clasifican con
  la misma regla que las demás (`volatil` < 3 años, `media` 3-10, `estable` ≥ 10),
- `norma.last_verified` se pone a la `fecha_consulta`, porque **eso sí es una
  comprobación contra la fuente oficial**, que es lo que el campo significa,
- y la respuesta a la 8 decide si la Constitución se queda `estable` (si no hay
  reforma de 2026) o si hay que revisar la clasificación entera, porque
  significaría que la regla basada en recencia va bien y mi duda no tenía base.
