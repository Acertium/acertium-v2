# Contrato de explicaciones

> Regla de Jonathan (22/08/2026): **«que la explicación cite el artículo no me
> sirve, tiene que ser de ayuda».**
>
> Es la misma regla que llevaba pidiendo desde las dos capturas del principio de
> la sesión. Yo entendí «falta el campo» y respondí con cobertura —«3.343 de
> 3.343, cero sin»—, que es medir lo que no era. Un campo lleno con una paráfrasis
> del artículo está, a efectos del opositor, tan vacío como un `null`.

## Qué es una explicación, y qué no

La explicación aparece **después de contestar**. El opositor ya ha leído el
enunciado, ya ha visto la opción correcta, y tiene el texto literal a un clic en
«Ver fuente». Así que **repetirle cualquiera de esas tres cosas no le da nada**.

Una explicación tiene que añadir lo que la fuente no dice de forma explícita:

| Sirve | Ejemplo real del banco |
|---|---|
| **Avisar de la trampa** | `RSP-021` — «Dos en el propio; cuatro en el ajeno; tres en el mancomunado. **Es la trampa clásica.**» |
| **Marcar la distinción exacta** | `LEC-588bisf` — «…el cómputo de la prórroga arranca desde la expiración del plazo anterior, **no desde el auto**.» |
| **Corregir el error de intuición** | `APAT-033` — «El estatuto **no es inmunidad** frente a la expulsión, pero se rodea de garantías…» |
| **Dar el criterio que ordena** | `SEGT-008` — «La distinción individual/colectiva **ordena el concepto**: la individual mira a la persona; la colectiva, al conjunto.» |
| **Decir qué hay que retener** | `MININT-005` — «…dibuja el esqueleto del Ministerio: cuatro grandes bloques. […] **Memorizar este mapa**…» |
| **Explicar el porqué** | `PRLP-044` — «…entrada en vigor inmediata: al día siguiente, **sin período de vacatio legis prolongado**.» |

| No sirve | Ejemplo real del banco |
|---|---|
| **Parafrasear el artículo** | `ARM-018` — «**El artículo 6 declara** armas de guerra […] las de calibre igual o superior a 20 milímetros…» |
| **Enumerar lo que enumera la norma** | `PPN-029` — «**El artículo 67 enumera** las causas del pase a segunda actividad: …» |
| **Definir lo que ya define la norma** | `ICR-024` — «**El artículo 30 define** los Planes de Apoyo Operativo como documentos operativos…» |
| **Repetir la respuesta con otras palabras** | `VCD-033` — «La anchura de las celdas depende de su capacidad: 60 centímetros en las individuales y 100 en las dobles.» |
| **Citar y ya** | `Art. 15 LO 4/2010.` (esto es lo que hay en el 89 % de las `justificacion`) |

## Las reglas

1. **No empieza citando el artículo.** «El artículo 67 enumera…» es la firma de
   la paráfrasis. Si el artículo hay que nombrarlo, va dentro, no de entrada.
2. **No repite la opción correcta.** El opositor acaba de leerla.
3. **Dice algo que la fuente no dice explícitamente**: el contraste, el error
   típico, el criterio que ordena, por qué está puesto así.
4. **En llano.** Si la norma dice «vacatio legis», se explica; no se copia.
5. **Fiel.** Puede añadir contexto pedagógico, pero **ninguna cifra, plazo, fecha
   o nombre que no esté en la fuente** (lo comprueba `verificar-lote` y ahí sigue
   el campo `cifras` para declarar y justificar las que sí).
6. **Corta.** Dos o tres frases. La mediana buena del banco está en 200
   caracteres; las malas suelen ser las largas, porque parafrasear ocupa.

## La diferencia con `justificacion`

Son **dos** textos y no se sustituyen (ver `docs/las-dos-explicaciones.md`):

- `concepto.explicacion` — del **concepto**. La misma para todas sus preguntas.
  Contexto: qué es esto y por qué importa.
- `actividad.justificacion` — de **esta pregunta**. La distinción concreta que se
  estaba probando. Regla 10 del motor: «una frase que enseña algo […] no repitas
  la respuesta».

Con el motor metiendo dos y tres preguntas por concepto, la explicación aguanta
el contexto y la justificación cambia con cada pregunta. Por eso el runtime pinta
las dos.

## Dónde está el trabajo, medido

De los 3.343 conceptos:

| | Cuántos | Qué son |
|---|---|---|
| Empiezan citando el artículo | **819** | la regla 1 los descarta de entrada; 425 son paráfrasis de manual («artículo N + declara/enumera/define») |
| Tienen marcador didáctico | 418 | contraste, aviso de trampa, distinción — la clase buena |
| Ni una cosa ni otra | **2.176** | **hay que leerlos** |

Esos 2.176 no los clasifica ninguna regla, y conviene decirlo en vez de fingir un
número: `VCD-033` está ahí y es mala (repite la respuesta), `SEGT-008` está ahí y
es buena. Distinguirlas es criterio, no patrón.

Leyendo una muestra de 13 al azar, aproximadamente **la mitad ayudan** y la otra
mitad parafrasean. Extrapolar de 13 sería inventar una cifra, así que no se
extrapola: lo que se sabe es que 819 fallan la regla 1 y que el resto está sin
mirar.

## Cómo se reescribe

`aplicar-explicaciones.mjs` ya existe y ya tiene puerta: rellena la columna sin
tocar el historial ni el estado BKT del concepto, y pasa el texto por
`verificarLote` contra el artículo del corpus, así que una explicación con cifras
ajenas no entra.

Lo que falta es **escribir las buenas**, y eso es trabajo de contenido a escala de
miles: es un encargo para el motor (`motor-preguntas.mjs`, opción B), con este
contrato dentro del prompt. Hacerlo a mano es el cuello de botella que ya
conocemos — la familia DISC costó una sesión entera para 23 preguntas.

### Ejemplos de reescritura

Mismos hechos, ya verificados contra el artículo; solo cambia qué se enseña.

**`ARM-018`**
> ~~El artículo 6 declara armas de guerra, cuya adquisición, tenencia y uso quedan prohibidos a particulares, las de calibre igual o superior a 20 milímetros, las automáticas, sus municiones y material como bombas, misiles o granadas.~~
>
> Dos criterios **independientes**, y basta con uno: el calibre (20 milímetros o más) **o** el automatismo. Un arma automática es de guerra aunque no llegue a ese calibre — por ahí se cae mucha gente que solo memoriza la cifra.

**`PPN-029`**
> ~~El artículo 67 enumera las causas del pase a segunda actividad: la insuficiencia de las aptitudes psicofísicas; la petición propia una vez cumplidas las edades del artículo 69; y la petición propia tras haber cumplido veinticinco años efectivos…~~
>
> Tres puertas, y solo la primera es involuntaria: la insuficiencia psicofísica. Las otras dos son a petición propia y se distinguen por lo que exigen — o la edad, o veinticinco años. Ojo al «**efectivos**»: cuentan servicio activo, servicios especiales y excedencia forzosa, no cualquier situación.

**`ICR-024`**
> ~~El artículo 30 define los Planes de Apoyo Operativo como documentos operativos con las medidas que las Administraciones Públicas ponen en marcha en apoyo de los operadores críticos…~~
>
> **No confundirlo con el Plan de Protección Específico**: ese lo hace el operador para su infraestructura; el de Apoyo Operativo lo hace la policía, para respaldarlo. Va uno por infraestructura, y presupone que el Específico ya existe.

**`VCD-033`**
> ~~La anchura de las celdas depende de su capacidad: 60 centímetros en las individuales y 100 centímetros en las dobles.~~
>
> La cifra **no se duplica** al pasar de una plaza a dos: de 60 a 100 centímetros, no a 120. Es la trampa habitual.
