# Anchura total, profundidad ponderada

> Criterio de contenido para AcertiumV2, con las mediciones que lo sostienen.
> 20/08/2026. Reproducible: `python3 adaptadores/legal-es/medir-concentracion-examen.py`.
> **Propuesta, no regla vigente.** La regla 6 de `CLAUDE.md` sigue como está hasta que
> Jonathan decida; al final se dice exactamente qué habría que cambiar.

## La duda que lo origina

La regla 6 dice: «cobertura total del temario, **sin saltar conceptos por frecuencia de
examen**». Se puso por una razón de producto que sigue en pie: *que ningún opositor pueda
venir a decir que le salió una pregunta que no estaba en Acertium*.

La duda razonable era si eso sobredimensiona el cerebro. Si el tribunal se concentrara en
un núcleo pequeño —el 80/20 de toda la vida— cubrir la cola larga sería trabajo tirado.

**Se ha medido. No hay 80/20.** La anchura se queda. Lo que había que replantear es otra
cosa.

## Medición 1 — Concentración por tema

593 preguntas clasificadas de seis exámenes oficiales (37ª a 42ª promoción), 45 temas.

| | |
|---|---|
| Temas donde cae el 80 % del examen | **29 de 45** = el **64 %** del temario |
| Temas sin ninguna pregunta en 6 exámenes | **ninguno** |
| Temas con 3 preguntas o menos | **uno** (T24, prevención de riesgos laborales) |
| Los 5 temas más pesados juntos | T8, T3, T14, T17, T10 = **23 %** del examen |

Un 80/20 exigiría que nueve temas cubrieran el 80 %. Hacen falta **veintinueve**.
Es un **80/64**: el examen está deliberadamente repartido.

## Medición 2 — Repetición por artículo

Sobre los 164 artículos que el trazador localiza con fiabilidad
(`docs/articulos-que-pregunta-el-tribunal.md`):

| Un artículo preguntado aparece en… | Artículos | % |
|---|---|---|
| **1 sola convocatoria** | **145** | **88 %** |
| 2 convocatorias | 14 | 9 % |
| 3 | 4 | 2 % |
| 4 | 1 | 1 % |

**Nueve de cada diez artículos salen una vez y no vuelven.** No hay un núcleo estable
que memorizar.

## Medición 3 — Curva de descubrimiento

Cuántos artículos distintos llevas acumulados según cuántos exámenes hayas visto,
promediado sobre los 720 órdenes posibles para que no dependa de por cuál empieces:

```
1 examen  →  32 artículos
2         →  61      (+29 nuevos)
3         →  88      (+28)
4         → 115      (+26)
5         → 140      (+25)
6         → 164      (+24)
```

**Es prácticamente una recta.** Si existiera un núcleo reutilizado, esta curva saturaría:
el cuarto examen aportaría poco y el sexto casi nada. En vez de eso, el sexto examen
todavía trae 24 artículos que ninguno de los cinco anteriores tocó.

Aplicando **Chao2** —el estimador de riqueza por incidencia que se usa en ecología para
calcular cuántas especies hay en un bosque a partir de cuántas se vieron una sola vez—:

```
Chao2 = S + ((m-1)/m) · Q1²/(2·Q2)  =  164 + (5/6)·145²/(2·14)  ≈  790
```

**Unos 790 artículos preguntables; en seis convocatorias hemos visto el 21 %.**

Ese número asume que el tribunal muestrea parecido cada año y que la bolsa es estable, y
ninguna de las dos cosas se puede comprobar: **trátalo como orden de magnitud, no como
cifra.** Lo que no depende del estimador, y es lo que decide, es el dato crudo: 145 de
164 artículos salieron una única vez.

## Conclusión 1: la anchura no se toca

Las tres mediciones dicen lo mismo desde ángulos distintos. Y de paso miden el techo del
método de la competencia: **una academia que construye su temario sobre exámenes
anteriores trabaja con el 21 % de la bolsa**, y cada año descubre otros ~25 artículos yendo
por detrás. No porque lo haga mal: porque el método no da para más.

La regla 6 no era exceso de celo. Era la lectura correcta de un examen plano, y es
exactamente la ventaja competitiva de Acertium. **Se mantiene íntegra.**

*(Corrijo aquí una propuesta mía anterior en esta misma sesión: sugerí que un artículo solo
entrara si un epígrafe del temario lo pedía explícitamente. Estaba mirando el síntoma
correcto —el desequilibrio— y proponiendo la palanca equivocada.)*

## Conclusión 2: el 80/20 sí aplica, pero a la profundidad

El desequilibrio real, medido en `docs/dimension-del-cerebro.md`, es otro:

- **97,6 % de los conceptos tiene UNA sola pregunta**, y `actividad_de_concepto` la
  reparte con `order by random() limit 1` sin filtrar contra lo ya visto. De la segunda
  exposición en adelante el motor devuelve el mismo ítem palabra por palabra: el opositor
  memoriza la pregunta, no el concepto, y el BKT lee memoria de ítem como dominio.
- **345 conceptos del RD 1155/2024** (que cae 2 veces en 600 preguntas) frente a **16 de
  la LO 2/1986** (que cae 13). Cubrir ambas es correcto; dedicarles el mismo esfuerzo, no.

De ahí el criterio en dos ejes:

> **Anchura — total, sin ponderar.** Un concepto por cada artículo que el temario alcance.
> Sin excepciones y sin mirar si ha caído nunca. Es lo que sostiene la promesa.
>
> **Profundidad — ponderada por el peso real del tema.** La segunda, tercera y cuarta
> pregunta de un concepto se escriben donde el examen pesa.

Nunca hay un hueco, y el tiempo de estudio se gasta donde se juega la nota.

## El mecanismo de ponderación ya existe — y estaba planificado

**Esto no es un hallazgo: estaba escrito desde el 01/08/2026 y yo no lo había leído.** El Doc 003
lo dice en tres sitios distintos:

> §B.1 — «Del sistema: el **peso de cada concepto/tema en el examen** (dato del overlay de
> convocatoria; **afinable analizando exámenes pasados**).»
>
> §D, tabla de evolución — «Peso de temas · MVP: *estimado / manual* → Futuro con datos:
> **analizado de exámenes oficiales pasados**.»
>
> §E, límites del MVP — «El peso de cada tema en el examen **empieza estimado, no analizado**.»

Es decir: **la tabla de pesos de este documento no propone nada nuevo, ejecuta el paso que el
diseño del motor dejó pendiente para cuando hubiera datos.** Los datos son las 600 preguntas
oficiales. Lo único que aporto es el análisis que el Doc 003 dejó anotado como futuro.

Lo que sí conviene tener delante: **está construido de punta a punta y nadie lo ha encendido.**

`overlay_entrada` tiene una columna `peso`, y el planificador la usa de verdad:

```js
// nucleo/planificador.mjs:38 — vencidos, por peso × cuánto ha decaído
.sort((a, b) => (b.peso * (P.target - A(b.id))) - (a.peso * (P.target - A(a.id))));

// nucleo/planificador.mjs:44 — conceptos nuevos, por peso
.sort((a, b) => b.peso - a.peso);
```

También pondera por `peso` el cálculo de dominio y de progreso esperado
(`planificador.mjs:73-79`). Pero el cargador lo clava a 1:

```js
// adaptadores/legal-es/generador/cargar.mjs:278
.map((id) => ({ convocatoria_id: convocatoria, concepto_id: id, tema, peso: 1 }));
```

Resultado en base: **3.231 conceptos con peso 1**, 6 con peso 2 y 1 con peso 3 (restos de
pruebas). El coach lleva todo este tiempo priorizando con todos los pesos iguales.

**Consecuencia práctica: la mitad de este criterio no necesita contenido nuevo.** Poner el
peso correcto en `overlay_entrada` cambia hoy mismo el orden en que el coach presenta y
repasa, sin escribir una sola pregunta.

## Propuesta concreta de pesos

Peso por tramos respecto a la media de 13,2 preguntas por tema:

| Peso | Criterio | Temas | Conceptos | Preguntas oficiales |
|---|---|---|---|---|
| **4** | ≥ 2,5× la media | **T8** | 257 (8 %) | 54 (9 %) |
| **3** | 1,5× – 2,5× | T3, T10, T14, T17, T21 | 865 (27 %) | 105 (18 %) |
| **2** | 0,75× – 1,5× | 25 temas | 1.626 (50 %) | 344 (58 %) |
| **1** | < 0,75× | T15, T19, T24, T28, T30, T31, T32, T33, T35, T36, T39, T40, T44, T45 | 490 (15 %) | 90 (15 %) |

Y si la profundidad siguiera al peso —tantas preguntas distintas por concepto como su
peso—, el banco pasaría de **3.253 a ~7.365 preguntas**: unas **41 al día** en el horizonte
de 180 días de `lib/cerebro.ts:85`. Exigente pero razonable, y es lo que hace falta para
que la 2ª y 3ª exposición existan de verdad.

Dos avisos sobre esta tabla:

- **Los conceptos no siguen al peso.** El peso 3 tiene el 27 % de los conceptos para el
  18 % del examen; el peso 4 está bien calibrado. Es el desvío que ya documentó
  `dimension-del-cerebro.md`, y se corrige con profundidad, no borrando conceptos.
- **T24 pesa 1 con una sola pregunta en 600.** Con esa n el dato es casi ruido: podría ser
  un 3 en otra muestra. El peso 1 significa «no priorizar», nunca «no cubrir».

## Orden de trabajo que se deduce

1. **Poner `peso` en `overlay_entrada`** según la tabla, y que `cargar.mjs` lo derive del
   tema en vez de escribir 1. Es la única parte que rinde sin contenido nuevo.
2. **Arreglar `actividad_de_concepto`** para que prefiera una actividad que el usuario no
   haya visto, cruzando contra `evento`. Hoy no cambia nada —no hay entre qué elegir—,
   pero sin ese arreglo la profundidad no se aprovecharía.
3. **Cerrar los 49 artículos ausentes** de `docs/articulos-que-pregunta-el-tribunal.md`.
   Son huecos de anchura confirmados y el Código Civil (8 artículos, 8 preguntas, cero
   cubiertos) es el más rentable.
4. **Profundizar por peso**, empezando por T8.

## Lo que esto NO demuestra

- **Seis convocatorias.** El reparto por temas puede cambiar de una a otra; esto describe
  el pasado, no garantiza la siguiente.
- **`tema_numero` lo etiquetamos nosotros**, no viene del BOE, y 7 de las 600 están sin
  clasificar.
- **El análisis por artículo solo alcanza al tercio de preguntas trazables.** Los otros
  dos tercios no salen de normas o no se pudieron localizar; si la concentración fuera
  distinta ahí, no lo veríamos.
- **Chao2 es un modelo con supuestos**, no una medición. El dato duro es 145/164.

## Comprobado contra la convocatoria (20/08/2026)

Quedaba pendiente verificar si el BOE fija pesos por tema, en cuyo caso la tabla de arriba
sobraría. **Leída la convocatoria BOE-A-2025-16610** (ya versionada en
`datos/legal-es/convocatoria/`, extracto en `BOE-A-2025-16610-bases-examen.md`):

- **La base 6.1.1 no reparte preguntas por tema ni por bloque.** Dice solo que las cien
  preguntas están «relacionadas con el temario que figura como anexo I». Leídas las bases
  6.1 a 6.15 completas, no hay ponderación en ninguna. **Inferir el peso de los exámenes
  pasados no es un atajo: es la única vía que existe.** La tabla se sostiene.
- **Confirma el formato**: 100 preguntas, 3 alternativas, 50 minutos, corrección
  `[A−E/(n−1)]×10/P` y mínimo de 3 puntos — exactamente lo que ya implementa
  `lib/simulacro-formato.ts`. Ese fichero estaba bien.
- **Aporta una estructura que no teníamos**: el Anexo I va en tres bloques —A) Ciencias
  Jurídicas (temas 1-26), B) Ciencias Sociales (27-37), C) Técnico-Científicas (38-45)—.
  El bloque A es justo el que sale de normas BOE, que es por lo que los temas sin artículo
  caían todos juntos en las mediciones.
- **Sigue sin resolverse la referencia.** El repo cita BOE-A-2026-15055 en dos sitios y el
  PDF disponible es BOE-A-2025-16610, con el mismo temario y el mismo formato. No se ha
  cambiado ninguna cita: hace falta ver el otro documento.

## Qué habría que cambiar para adoptarlo

Nada de esto está aplicado. Si se adopta, el cambio mínimo es en `CLAUDE.md`, regla 6,
que hoy mezcla los dos ejes en una frase:

> *Hoy:* «Cobertura total del temario, sin saltar conceptos por frecuencia de examen.»
>
> *Propuesta:* «**Anchura:** cobertura total del temario, sin saltar conceptos por
> frecuencia de examen. **Profundidad:** el número de preguntas distintas por concepto se
> pondera por el peso del tema en el examen oficial; nunca baja de una.»

Y en `cargar.mjs`, que `peso` salga del tema en lugar de ser 1.
