# Corpus del Código 600 — la copia que consultan los agentes

Texto **literal** de las normas del *Código Electrónico «Normativa para ingreso en la Policía Nacional, Escalas Básica y Ejecutiva»* (el BOE-600), extraído mecánicamente de los PDF oficiales.

**Estado: COMPLETO** (16/08/2026). Las **52 normas** del Código —§2 a §53; el §1 es la Introducción y no es una norma— con **3.354 artículos**. Con las secciones ampliadas y las añadidas de más abajo, el directorio tiene hoy **58 ficheros y 4.980 artículos**. Edición del Código: 20 de mayo de 2026.

**Para qué existe:** para que ningún agente tenga que abrir un PDF ni tirar de memoria. Si necesitas el texto de un artículo, está aquí. Es la fuente que consume el generador — regla de oro del Doc 006: *«el generador consume ESTE JSON, nunca el PDF»*.

Los PDF **no se versionan** (`.gitignore`: `datos/**/*.pdf`); estos JSON **sí**. Esa es la copia permanente.

## Cómo se consulta

`indice.json` lista qué normas hay, con su `referencia_boe`, su fecha de última modificación y cuántos artículos tiene cada una. Cada norma es `seccion-NNN.json`, donde `NNN` es su número de § en el Código:

```json
{
  "meta": { "seccion": 3, "titulo": "Constitución Española",
            "referencia_boe": "BOE-A-1978-31229",
            "ultima_modificacion": "20 de mayo de 2026" },
  "articulos": [ { "numero": 104, "ref": "104", "texto": "1. Las Fuerzas y Cuerpos de seguridad…" } ]
}
```

- **`ref`** es la cita canónica y es lo que debe usarse: `"104"`, `"31 bis"`, `"156 quinquies"`.
- **`numero`** es el número base como entero (el `31` de `31 bis`), para indexar.
- **`sufijo`** solo aparece cuando lo hay.

## Cómo se regenera

En el PC, con el Código recortado norma a norma:

```
python3 adaptadores/legal-es/ingestor.py <norma.pdf> <salida.json>
```

Cuando el Código llega en trozos de N páginas (varias normas por trozo, y la última partida por la mitad):

```
python3 adaptadores/legal-es/ingestor.py --codigo <trozo.pdf> <dir_acumulado>   # por cada trozo
python3 adaptadores/legal-es/ingestor.py --consolidar <dir_acumulado> <dir_json> # al final
python3 adaptadores/legal-es/ingestor.py --indice <este_directorio>              # refresca indice.json
```

**Solo se copian aquí las secciones completas.** El consolidador marca con `meta.posiblemente_incompleta` la última sección acumulada, que es la que estaba abierta cuando se acabó el último trozo: mientras queden trozos por pasar, su texto está cortado.

## Lo que NO trae

- **Las disposiciones** (adicionales, transitorias, derogatorias, finales) y los preámbulos: el ingestor corta en ellas. Quien necesite citarlas no las encontrará aquí.
- **Las secciones que no se estructuran en artículos.** `§34` (Orden PCI/487/2019) publica la Estrategia Nacional de Ciberseguridad **como anexo dividido en capítulos**, sin un solo artículo: aparece en el índice con `0 artículos` y eso es correcto, no una ingesta fallida. Su familia (`ENC`) no se puede auditar por artículo.
- **Lo que no es del Código 600.** Los instrumentos internacionales que el temario sí pide —Declaración Universal (`DUDH`), Convenio Europeo de Derechos Humanos (`CEDH`), Convenio contra la Tortura (`TORT`)— **no son secciones del Código** y por tanto no están aquí, aunque se publicaran en el BOE. Si hicieran falta, se ingieren aparte desde su propio PDF del BOE.
- **Las fuentes no-BOE** (temas 27-41: `CIBER`, `GRAM`, `SO`, `DROGA`, `GLOB`, `ORTO`, `REDES`…). Nunca tendrán corpus: su fidelidad depende de `verificar-fuente` y de revisión humana.
- El Código es una **recopilación con inclusiones parciales**: varios títulos llevan `[Inclusión parcial]` y no traen todos los artículos de la norma. El propio Código avisa de que «NO constituye la totalidad del contenido de los temarios». Que un artículo no esté aquí no significa que no exista: significa que el Código no lo incluye.

## Secciones ampliadas con el texto consolidado (excepciones declaradas)

Cuando una inclusión parcial deja fuera algo que el temario **sí** exige, la sección se
sustituye por el **texto consolidado íntegro** de esa misma norma, descargado de boe.es. Es la
única forma de fundamentar el tema sin inventar, y no rompe nada: el consolidado contiene todo
lo que traía el Código. Cada excepción se declara aquí y en el campo `meta.fuente` del fichero.

| § | Norma | Motivo | Efecto |
|---|-------|--------|--------|
| 35 | Código Penal (BOE-A-1995-25444) | El Código no traía los arts. **197 bis/ter/quater/quinquies** (acceso ilícito a sistemas) ni **264 bis/ter/quater** (daños informáticos autónomos), del Tema 20 | 268 → **723 artículos**. De los 268 originales, 262 con texto idéntico y 6 que solo pierden el marcador `[ . . . ]` |
| 37 | LECrim (BOE-A-1882-6036) | El Código llegaba al art. 328 y no traía el bloque **588 bis a – 588 octies**, que es «la prueba digital en el proceso penal» del Tema 20 | 121 → **1.037 artículos**. De los 121 originales, 116 con texto idéntico y 5 que solo pierden el marcador `[ . . . ]` de la inclusión parcial |
| 51 | Reglamento General de Vehículos (BOE-A-1999-1826) | El Código solo traía **3 artículos**, insuficientes para las condiciones técnicas de los vehículos del Tema 44 | 3 → **54 artículos**. Los 3 originales siguen, con el mismo articulado: el 11 solo pierde el marcador `[ . . . ]`, y el 27 y el 48 bis pierden además el texto que la recopilación les había pegado **detrás** de ese marcador y que no era suyo (un encabezado de subsección en el 27, un fragmento del Anexo II en el 48 bis) |

## Secciones que no vienen del Código 600

Hay normas que el temario necesita y que la recopilación **no incluye en absoluto**. Se ingieren
igual, desde su texto oficial —el consolidado cuando lo hay—, y ocupan números de sección por encima
de los 53 del Código para que se vea de un vistazo que no forman parte de él.

Las dos primeras (§54 y §55) salieron de un cruce automático de todas las citas «Ley/LO/RD n/aaaa»
del temario contra este índice. Las cuatro restantes no las cita el temario por su número: son la
única fuente oficial de epígrafes que estaban sin fundamentar —§56 y §57 en el Tema 45, §58 en el 42
y §59 en el 24—.

**Lo que NO entra aquí aunque fundamente contenido:** las fuentes no-BOE que no son normas. El
manual del INSST «Curso de capacitación para el desempeño de funciones de nivel básico», que
fundamenta los epígrafes doctrinales del Tema 24 (familia `INSST`, `tipo_fuente: autoridad`), es
obra de referencia, no norma: su texto literal viaja en el bloque `fuentes` del lote y su fidelidad
la cubren `verificar-fuente` y la revisión humana, como dice «Lo que NO trae» más arriba.

| § | Familia | Norma | Tema |
|---|---------|-------|------|
| 54 | `RSP` | RD 39/1997, Reglamento de los Servicios de Prevención (BOE-A-1997-1853) | 25 |
| 55 | `DEP` | Ley 39/2006, de promoción de la autonomía personal y atención a las personas en situación de dependencia (BOE-A-2006-21990) | 23 |
| 56 | `EPI` | RD 773/1997, utilización por los trabajadores de equipos de protección individual (BOE-A-1997-12735) | 45 |
| 57 | `EQT` | RD 1215/1997, utilización por los trabajadores de los equipos de trabajo (BOE-A-1997-17824) | 45 |
| 58 | `ITC` | Instrucciones técnicas complementarias 1 a 5 del Reglamento de Armas (BOE-A-2020-9134) | 42 |
| 59 | `OMS` | Constitución de la Organización Mundial de la Salud (texto español auténtico, OMS) | 24 |

Las dos últimas rompen, cada una por su lado, un supuesto que el resto del corpus da por hecho, y
por eso llevan su propia advertencia:

- **§58 no se divide en artículos.** Las ITC se aprobaron por el *artículo segundo* del RD 726/2020 y
  se publicaron como **anexos** suyos, así que ni las trae el §50 (que es el articulado del Reglamento
  de Armas) ni las vería el ingestor, que corta en `ANEXO`. Cada ITC es **una entrada**, con `ref`
  `"ITC 1"` … `"ITC 5"`, porque la unidad de cita es la ITC entera. Dos de ellas no salen del RD:
  la **ITC 4** está en la redacción vigente que le dio la Orden INT/291/2025 (que sustituyó la de 2020
  por entero) y la **ITC 1** incorpora el apartado C) que le añadió la Orden INT/330/2025.
- **§59 no sale del BOE, y es deliberado.** El «BOE» núm. 116 de 15/05/1973, que publicó esta
  Constitución en España, es un **facsímil escaneado** con el OCR sucio y con una errata propia
  («Organización *Mundical* de la Salud», artículo 1). No hacía falta pelearse con él: el
  **artículo 74 de la propia Constitución** dispone que los textos en chino, español, francés,
  inglés y ruso «serán considerados igualmente auténticos», y la cláusula de firma lo repite. El
  **texto español que publica la OMS es el instrumento mismo**, no una traducción, así que la
  sección se ingiere de *Documentos básicos*, 49.ª edición (OMS, 2020), que además incorpora las
  reformas en vigor. Los `ref` `"Principio 1"` … `"Principio 9"` son los nueve principios del
  preámbulo y **no** son artículos; los `ref` numéricos sí son los artículos 1 a 82. Tampoco tiene
  identificador `BOE-A` que citar —los boletines anteriores a 1994 no lo llevan—, así que la familia
  se registra con `referencia_fuente`, no con `referencia_boe`.

  Esto **sustituyó** una primera ingesta (18/08/2026) transcrita a mano contra la imagen del
  facsímil. Las diferencias entre uno y otro texto son solo ortográficas y de puntuación
  («trasmisibles»/«transmisibles», comas, mayúsculas), ninguna sustantiva, pero **rompen la
  literalidad**: las doce actividades que ya se habían cargado contra el texto del BOE se
  regeneraron contra este y se actualizaron en base. Es el caso que el protocolo del final de esta
  página anticipa —cambiar el texto de una sección puede invalidar cotejos ya verificados sin que
  nadie se entere— y la razón de que aquí se deje escrito.

Como ninguna de las dos cita por número de artículo, `refDe()` en `auditar-corpus.mjs` reconoce
además `"ITC N"` y `"principio N"`; sin eso, `"ITC 4"` iría a buscar el artículo 4 y
`"Preámbulo, principio 2"` se daría por no auditable.

`00-indice.md` **no** las lista: ese índice rastrea la cobertura de las 52 normas del Código 600 y
`marcarCobertura()` se apoya en él. Estas viven solo aquí y en el `SECCION` de `auditar-corpus.mjs`.

Antes de sustituir una sección hay que comprobar dos cosas, en este orden: que el consolidado
**contiene los artículos que ya traía el Código** y con el mismo texto, y que `auditar-corpus.mjs`
sobre el banco entero **no empeora ningún contador que bloquee**. Si el texto cambiara, cotejos ya
verificados podrían dejar de ser literales sin que nadie se entere.

## Quién lo usa

`adaptadores/legal-es/generador/auditar-corpus.mjs` contrasta contra este corpus los cotejos de todos los lotes, para detectar citas truncadas, contaminación entre artículos y texto que no esté en la norma.
