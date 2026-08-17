# Corpus del Código 600 — la copia que consultan los agentes

Texto **literal** de las normas del *Código Electrónico «Normativa para ingreso en la Policía Nacional, Escalas Básica y Ejecutiva»* (el BOE-600), extraído mecánicamente de los PDF oficiales.

**Estado: COMPLETO** (16/08/2026). Las **52 normas** del Código —§2 a §53; el §1 es la Introducción y no es una norma— con **3.354 artículos**. Edición del Código: 20 de mayo de 2026.

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

## Secciones que no vienen del Código 600

El temario cita por su nombre dos normas que la recopilación **no incluye en absoluto**. Se ingieren
igual, desde su texto consolidado, y ocupan números de sección por encima de los 53 del Código para
que se vea de un vistazo que no forman parte de él. Salieron de un cruce automático de todas las
citas «Ley/LO/RD n/aaaa» del temario contra este índice: son las dos únicas que faltaban.

| § | Familia | Norma | Tema |
|---|---------|-------|------|
| 54 | `RSP` | RD 39/1997, Reglamento de los Servicios de Prevención (BOE-A-1997-1853) | 25 |
| 55 | `DEP` | Ley 39/2006, de promoción de la autonomía personal y atención a las personas en situación de dependencia (BOE-A-2006-21990) | 23 |

`00-indice.md` **no** las lista: ese índice rastrea la cobertura de las 52 normas del Código 600 y
`marcarCobertura()` se apoya en él. Estas viven solo aquí y en el `SECCION` de `auditar-corpus.mjs`.

Antes de sustituir una sección hay que comprobar dos cosas, en este orden: que el consolidado
**contiene los artículos que ya traía el Código** y con el mismo texto, y que `auditar-corpus.mjs`
sobre el banco entero **no empeora ningún contador que bloquee**. Si el texto cambiara, cotejos ya
verificados podrían dejar de ser literales sin que nadie se entere.

## Quién lo usa

`adaptadores/legal-es/generador/auditar-corpus.mjs` contrasta contra este corpus los cotejos de todos los lotes, para detectar citas truncadas, contaminación entre artículos y texto que no esté en la norma.
