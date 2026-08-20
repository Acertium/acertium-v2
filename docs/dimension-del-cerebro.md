# ¿Está sobredimensionado el cerebro?

> Medición del 20/08/2026 sobre 3.238 conceptos y 3.253 preguntas servibles,
> cruzada con **600 preguntas de seis exámenes oficiales** (37ª a 42ª promoción,
> 100 preguntas cada uno) que están en `datos/legal-es/pn-oficial-examenes-600.csv`.

La pregunta era si estamos creando más conceptos de los funcionalmente necesarios.
La respuesta corta: **el problema no es el tamaño, es la FORMA.** El cerebro es
ancho y plano, y está mal repartido respecto a lo que el tribunal pregunta.

## 1. El hallazgo principal: 97,6 % de los conceptos tiene UNA sola pregunta

| Preguntas distintas por concepto | Conceptos | % |
|---|---|---|
| 0 (no servible) | 40 | 1,2 % |
| **1 (siempre la misma)** | **3.161** | **97,6 %** |
| 2-3 | 31 | 1,0 % |
| 4 o más | 6 | 0,2 % |

Esto importa por cómo sirve el motor. `actividad_de_concepto(cid)` es:

```sql
select * from acertium_v2.actividad
where concepto_id = cid and tipo='test' and estado_verificacion='verificado'
order by random() limit 1;
```

`order by random() limit 1` **sin filtro contra lo ya visto**. Con una sola
actividad, de la segunda exposición en adelante el motor devuelve **el mismo
ítem**, palabra por palabra.

La consecuencia es seria y es de fondo:

- El opositor memoriza **la pregunta**, no el concepto. Reconoce la opción
  correcta por su forma, no porque domine la materia.
- El BKT lee ese acierto repetido como evidencia de dominio, y **no lo es**.
  Estamos midiendo memoria de ítem, no absorción.
- El modelo de olvido no se puede validar: no hay forma de distinguir «recuerda
  el concepto» de «recuerda esta pregunta».

Un cerebro para estudiar quiere la forma contraria: **menos conceptos, varias
preguntas cada uno**. Con 1:1 no hay práctica, hay relectura.

## 2. El tamaño, en cambio, es defendible

Con horizonte de 180 días (`HORIZONTE_DIAS` en `lib/cerebro.ts:85`):

| Exposiciones por concepto | Preguntas totales | Al día, 180 días seguidos |
|---|---|---|
| 1 | 3.238 | 18 |
| 3 | 9.714 | 54 |
| 5 | 16.190 | 90 |

18 al día para una pasada es cómodo. 90 al día para cinco exposiciones espaciadas
es exigente pero es lo que pide el dominio duradero. El número de conceptos NO es
el cuello de botella: **el cuello de botella es que esas exposiciones 2ª a 5ª no
existen como preguntas distintas.**

## 3. Lo que sí está mal: el reparto

Índice = (% que el tema ocupa del banco) ÷ (% que ocupa del examen real).
Por encima de 1 está sobreconstruido para lo que cae.

| | Tema | Preguntas oficiales (de 593) | Conceptos | Le tocarían | Desvío |
|---|---|---|---|---|---|
| 🔴 | **T24** PRL | **1** | 45 | 5 | **+40** |
| 🔴 | T10 extranjería | 20 | 316 | 109 | +207 |
| 🔴 | T12 protección internacional | 14 | 187 | 76 | +111 |
| 🔴 | T2 Constitución I | 15 | 163 | 82 | +81 |
| 🔴 | T21 procesal penal | 20 | 179 | 109 | +70 |
| 🟢 | T14 | 22 | 32 | 120 | **−88** |
| 🟢 | T4 Unión Europea | 19 | 30 | 104 | −74 |
| 🟢 | T1 Derecho | 17 | 26 | 93 | −67 |
| 🟢 | T6 funcionarios | 15 | 28 | 82 | −54 |
| 🟢 | T8 Policía Nacional | **54** | 257 | 295 | −38 |

**842 conceptos —el 26 % del banco— están por encima del peso de su tema.**

Dos casos que lo resumen:

- **T24** tiene 45 conceptos y ha caído **una** pregunta en seiscientas. Ahí es
  donde iba a escribir más contenido antes de medir esto.
- **T8** es el tema más pesado con diferencia —54 preguntas, el 9 % del examen— y
  aun así está ligeramente por DEBAJO de lo que le correspondería.

## 4. Qué haría con esto

**Cambiar la métrica.** Dejar de medir «epígrafes cubiertos» y empezar a medir
**preguntas distintas por concepto, ponderadas por el peso real del tema**. La
cobertura por epígrafe ya está prácticamente resuelta; la profundidad no ha
empezado.

**Dejar de ensanchar por defecto.** El concepto 3.239 en un tema sobreconstruido
vale casi cero. La segunda y tercera pregunta de un concepto del T8 valen mucho.

**Orden de trabajo que se deduce:** profundizar T8, T14, T4, T1, T6, T18 y T41
antes que añadir un solo concepto nuevo a T10, T12, T24 o T2.

**Y un arreglo barato del motor**, para cuando haya profundidad: que
`actividad_de_concepto` prefiera una actividad que el usuario NO haya visto,
cruzando contra `evento`. Hoy no serviría de nada —no hay entre qué elegir—, pero
sin él la profundidad tampoco se aprovecharía.

## Lo que esta medición NO demuestra

- **La muestra es corta.** Seis exámenes, 593 preguntas clasificadas. Un tema con
  1-5 preguntas oficiales tiene mucho ruido: el «1» del T24 podría ser un 3 en
  otra muestra. Lo que aguanta es el orden de magnitud —45 conceptos para 1-3
  preguntas—, no la cifra exacta.
- **`tema_numero` es un campo etiquetado por nosotros**, no viene del BOE. Los 600
  están marcados con confianza ALTA, pero conviene auditar una muestra antes de
  gobernar la estrategia con ese campo. Además 7 de las 600 están sin clasificar
  (tema 0) y quedan fuera del cálculo.
- **El peso puede cambiar** de una convocatoria a otra. Esto describe seis
  promociones pasadas, no garantiza la siguiente.
- **No mide la calidad de cada pregunta**, solo cuántas hay y dónde.
