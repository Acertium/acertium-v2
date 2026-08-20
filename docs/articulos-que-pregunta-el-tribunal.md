# Los artículos que el tribunal pregunta y el cerebro no tiene

> Medición del 20/08/2026. Fuentes: `datos/legal-es/pn-examenes-600-trazado.csv`
> (traza de las 600 preguntas oficiales, producida por
> `adaptadores/legal-es/trazar-examenes.py`) contra la tabla `concepto_fuente` del
> cerebro. Todo lo de aquí sale de cruzar esas dos cosas; nada está deducido de memoria.

## De dónde sale esta lista

`docs/cobertura-vs-examen-oficial.md` dejó la pregunta útil planteada: «¿qué apartados
de las normas que ya tenemos pregunta el tribunal y no hemos escrito?». Faltaba saber a
qué artículo apunta cada pregunta, porque el campo `fuente_normativa` del CSV solo trae
una cita limpia en el 17 % de los casos.

El trazador lo resuelve **localizando, no deduciendo**: busca entre los 4.980 artículos
del corpus aquel cuyo texto contiene literalmente el fragmento más largo de la pregunta,
y guarda ese fragmento como prueba auditable. Resultado sobre las 600:

| Confianza | Preguntas | % |
|---|---|---|
| **ALTA** | 133 | 22 % |
| **MEDIA** | 66 | 11 % |
| BAJA | 185 | 31 % |
| SIN TRAZA | 216 | 36 % |

Se trabaja solo con **ALTA + MEDIA = 199 preguntas**, menos **3 falsas detectadas a mano**
(ver «Lo que esto no es», abajo) → **196 trazas fiables** sobre **164 pares norma+artículo**
distintos, repartidos en **41 normas**.

Las 401 restantes no son un fallo del método: buena parte no sale de ninguna norma
(psicología, geografía, ortografía, estructura orgánica descrita en otra fuente).

## El resultado

De los 164 artículos que el tribunal preguntó y el trazador localizó:

| | Artículos | Preguntas |
|---|---|---|
| El cerebro **tiene** al menos un concepto de ese artículo | 115 | 140 (71 %) |
| El cerebro **no tiene** ningún concepto de ese artículo | **49** | **56 (29 %)** |

**Ojo con leer ese 71 % como cobertura.** Que exista un concepto citando el artículo no
significa que responda la pregunta: un artículo largo tiene muchos apartados y nosotros
solemos tener uno. La medición a mano de `cobertura-vs-examen-oficial.md` —45 % cubierto,
17 % parcial, ±18 puntos— sigue siendo la buena. **El 71 % es un techo, no una cobertura.**

Lo que sí es exacto es la otra mitad: **estos 49 artículos no los tenemos, y sabemos que
caen.**

## Los 49 artículos que faltan

Ordenados por preguntas que sostienen. Entre paréntesis, cuántas preguntas si es más de una.

| Preg. | Temas | Norma | Artículos que faltan |
|---|---|---|---|
| 8 | T1 | **Código Civil** (BOE-A-1889-4763) | 14, 19, 20, 22, 23, 26, 29, 30 |
| 8 | T9, T21 | **LO 2/1986 FCS** (BOE-A-1986-6859) | 48 (2), 6, 7, 31, 47, 49, 50 |
| 8 | T7, T8, T23, T45 | **RD 207/2024 estructura Interior** (BOE-A-2024-3793) | 6 (5), 5, 12, 15 |
| 6 | T10, T12 | **LO 4/2000 extranjería** (BOE-A-2000-544) | 4, 5, 25 bis, 31 bis, 35, 36 |
| 4 | T3 | **Constitución Española** (BOE-A-1978-31229) | 73, 74, 78, 86 |
| 3 | T8, T9 | **LO 9/2015 personal PN** (BOE-A-2015-8468) | 15, 93, 94 |
| 3 | T17 | **Código Penal** (BOE-A-1995-25444) | 379, 404, 445 |
| 3 | T13 | **Ley 5/2014 seguridad privada** (BOE-A-2014-3649) | 25 (2), 18 |
| 2 | T22 | **Ley 4/2015 estatuto de la víctima** (BOE-A-2015-4606) | 8 (2) |
| 1 | T2 | LO 3/1981 Defensor del Pueblo | 15 |
| 1 | T5 | Ley 50/1997 del Gobierno | 29 |
| 1 | T5 | Ley 40/2015 régimen jurídico | 73 |
| 1 | T6 | RDL 5/2015 EBEP | 4 |
| 1 | T8 | RD 853/2022 | 45 |
| 1 | T12 | RD 865/2001 | único |
| 1 | T14 | LO 7/2021 protección de datos | 15 |
| 1 | T23 | **Ley 39/2006 dependencia** | 1 |
| 1 | T25 | Ley 31/1995 PRL | 9 |
| 1 | T25 | **RD 39/1997 servicios de prevención** | 14 |
| 1 | T45 | RD 2822/1998 Reglamento de Vehículos | 32 |

**49 artículos · 56 preguntas.**

### Dos normas que están en el corpus y no tienen NI UN concepto

| Norma | Artículos en el corpus | Conceptos en el cerebro |
|---|---|---|
| RD 39/1997, Reglamento de los Servicios de Prevención (§54) | 42 | **0** |
| Ley 39/2006, de Dependencia (§55) | 48 | **0** |

Están ingeridas y sin explotar. Las dos han caído en examen.

## Qué dice esto que no supiéramos

Confirma y **afila** lo de `dimension-del-cerebro.md`. El desvío por temas decía dónde
sobra y falta contenido en grueso; esto dice **qué escribir exactamente**:

- **T1 (Código Civil) es el hueco más limpio de todos.** Ocho artículos, ocho preguntas,
  ninguno cubierto. Y el T1 ya salía como el tema más infraconstruido del banco (26
  conceptos para 17 preguntas oficiales). Aquí no hay que decidir nada: están los ocho
  artículos, está el corpus, es escribir.
- **La LO 2/1986 tiene 16 conceptos** para ser la norma nuclear del cuerpo. Faltan siete
  artículos preguntados, incluido el **art. 48** (Consejo de Política de Seguridad), que
  cayó dos veces.
- **RD 207/2024 art. 6** (Gabinete de Coordinación y Estudios de la SES) sostiene cinco
  preguntas él solo —CEPOL, VioGén, cooperación policial, quejas y sugerencias— y no
  tiene ni un concepto. Es el artículo suelto más rentable de la lista.
- **El Código Penal, con 388 conceptos, solo falla en tres artículos.** Ahí no hay nada
  que hacer: está bien construido.

## Cómo usar el CSV

`datos/legal-es/pn-examenes-600-trazado.csv`, una fila por pregunta:

| Columna | Qué es |
|---|---|
| `external_id` | La pregunta en `pn-oficial-examenes-600.csv` |
| `confianza` | ALTA / MEDIA / BAJA / SIN TRAZA |
| `modo` | `norma nombrada` si la pregunta citaba la norma; si no, `búsqueda abierta` |
| `norma`, `articulo`, `referencia_boe` | La traza |
| `evidencia_caracteres`, `evidencia_literal` | **El fragmento común. Es la prueba: si no convence, la traza no vale.** |
| `aviso` | Marca los artículos imán (abajo) |

## Lo que esto no es

- **No es una medición de cobertura.** Es una lista de artículos ausentes. El 71 % de
  arriba es un techo.
- **Las trazas BAJA y SIN TRAZA (67 %) están fuera.** Si el tribunal pregunta un artículo
  que solo aparece ahí, esta lista no lo ve. Es incompleta por diseño, no es un censo.
- **MEDIA falla, y sé cómo.** Cuando la norma de la que sale la pregunta no está en el
  corpus pero su NOMBRE sí se cita dentro de algún artículo, el trazador se engancha a
  esa cita: palabras correctas, asunto equivocado. Encontrado a mano: tres preguntas del
  T27 sobre el Protocolo facultativo contra la tortura acabaron en el art. 6 del
  RD 207/2024, con 76 caracteres literales de coincidencia. **Esas tres están descontadas
  de todas las cifras de este documento.** El aviso de «artículo imán» (uno que atrae
  preguntas de 3+ temas) marca ese grupo en el CSV, pero no lo corrige solo: en ese mismo
  grupo 5 de 8 trazas eran buenas.
- **No he auditado las 196 a mano**, solo el grupo imán y los casos que citan una norma
  ajena al corpus. La precisión medida contra citas limpias fue 89 % en ALTA (n=18), con
  un intervalo de ±14 puntos.
- **`tema_numero` lo etiquetamos nosotros**, no viene del BOE.
