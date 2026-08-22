# `datos/fuentes/huellas/` — la huella por artículo de cada norma

Un fichero por norma, `<referencia_boe>.json`, con **un hash del texto de cada
artículo** tal como lo publicaba el BOE el día de la captura.

```json
{
  "referencia_boe": "BOE-A-2003-23514",
  "capturado": "2026-08-22",
  "articulos_en_vigor": 174,
  "articulos": { "1": "77d5ca0cafb6264c", "2": "2d1053328004f2ae", … },
  "futuros": [{ "ref": "69", "norma": "BOE-A-2026-13889", "vigencia": "20261001" }]
}
```

## Por qué esto y no el XML entero

Regla de Jonathan del 23/08/2026: lo que se baja del BOE se versiona. Pero un
barrido completo de las 59 normas son **26 MB** de XML, y el vigilante tiene que
correr **cada semana**: 1,3 GB al año de ficheros casi idénticos.

Decisión (23/08/2026): **la huella siempre, el XML completo solo cuando algo
cambia.** El corpus entero cabe en **376 KB**.

El reparo obvio —«si solo guardas el hash, pierdes el texto anterior»— no se
cumple, y por una razón concreta: **el consolidado del BOE lleva dentro todas las
versiones históricas de cada artículo**, cada una con su `fecha_vigencia`. El XML
que se guarda el día que algo cambia trae las dos redacciones, la nueva y la
vieja. La huella dice *qué* mirar; el XML nuevo tiene con qué mirarlo.

## Qué se hashea

El texto **normalizado** con `normalizarParaComparar` (la misma normalización que
usa el diff), no el crudo. Si no, un guion tipográfico distinto en la captura
movería la huella y el vigilante gritaría por ruido. Usar la misma función
garantiza que huella y diff no puedan discrepar entre sí.

16 caracteres hex = 64 bits. Para 5.432 artículos la probabilidad de colisión es
del orden de 10⁻¹²; y una colisión aquí solo significa «no avisó de un cambio en
ese artículo», nunca un dato falso servido al opositor.

## Dos preguntas distintas

El vigilante responde a dos cosas que se confunden con facilidad:

- **el diff contra el corpus** — ¿lo que servimos coincide con lo vigente?
- **la huella contra la captura anterior** — ¿se ha movido el BOE?

No son la misma pregunta. El BOE puede moverse en artículos que no tenemos (y
entonces no hay nada que re-verificar), y nuestro corpus puede apartarse de lo
vigente sin que el BOE se haya movido (y entonces el defecto es nuestro). La
huella se calcula sobre el consolidado **entero**, no solo sobre los artículos que
usamos: así, el día que se amplíe el corpus de una norma, ya hay línea base.

## «Ha cambiado todo» no es una reforma

Si cambia **más de la mitad** de los artículos de una norma, el informe lo marca
`⚠ SOSPECHOSO`. Eso casi nunca es el BOE: es que ha cambiado nuestro extractor.
Las dos cosas se ven igual —«187 artículos cambiados»— y una pide re-verificar
contenido mientras la otra pide mirar el código.

## Cómo se regeneran

```
npm run vigilar:normas -- --todas
```

Escribe o actualiza todas las huellas y versiona el XML solo de las normas en
las que algo cambió, anotando en el `PROCEDENCIA.md` de esa materia qué artículos
fueron.
