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

**2. Unicidad dentro de una pregunta.** Ningún distractor puede ser cita literal
del mismo cotejo que sostiene la correcta.

Esta segunda apareció investigando las colisiones y es el hallazgo gordo. Dos
conceptos preguntaban «¿qué órgano directivo depende de la Subsecretaría del
Interior?» y cada uno elegía un elemento distinto de **la misma enumeración**:

```
cotejo: «…de la que dependen los siguientes órganos directivos:
         1.º La Secretaría General Técnica.
         2.º La Dirección General de Política Interior.
         3.º La Dirección General de Tráfico. …»

opciones: las cuatro salen de esa lista → las cuatro son verdad
```

**Es una pregunta que no se puede acertar sabiendo la norma.** Y ninguna puerta
lo veía, porque tanto la correcta como los distractores son texto literal. Medido
en el banco: **23 preguntas afectadas (0,7 %), 8 de ellas con dos o más**.

Un buen distractor puede parecerse mucho a la fuente —de eso vive un near-miss—
pero no puede **ser** la fuente. El self-test cubre las dos caras: rechaza el caso
de la enumeración y acepta el near-miss legítimo.

## Una decisión: la heurística que NO entró

Se probó detectar el sujeto genérico por patrón («el real decreto» sin número).
Marcaba **146 preguntas (4,3 %)**, y al revisar la muestra la mayoría eran sanas:
«el Reglamento de Armas» o «el reglamento del sistema de acogida de protección
internacional» sí identifican de qué hablan.

Con esa precisión sería una puerta que todo el mundo aprende a ignorar, que es
peor que no tenerla. **La colisión es mejor señal: no sospecha ambigüedad, la
demuestra.** Y para un generador en lote basta, porque es él quien produce las dos
preguntas que chocan, así que la contradicción aparece dentro del mismo lote.

## Lo que queda abierto

- **Las 23 preguntas con distractores verdaderos siguen en el banco.** La puerta
  impide que entren más; arreglar las que hay es trabajo de contenido aparte.
- **Los 4 enunciados contradictorios siguen ahí** por la misma razón. Los pares
  son ACOG-056/CPOL-062 (dos reales decretos distintos), MININT-007/MININT-023
  (la enumeración de arriba), PRL-028/PRLP-030 y PRL-031/PRLAGE-015 (ley general
  frente a norma policial).
- **No se puede correr desde el contenedor remoto**: sin `.env.local` no hay
  acceso a la base, y entonces la puerta compara el lote solo consigo mismo. Lo
  dice en voz alta en vez de fingir que comprobó.
