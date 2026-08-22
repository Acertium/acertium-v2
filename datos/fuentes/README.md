# `datos/fuentes/` — los documentos originales

Aquí van **los documentos tal cual**: los PDF, los manuales, las páginas guardadas.
No el texto ya procesado —eso es el corpus— sino aquello de lo que salió.

> Regla de Jonathan (22/08/2026): todo documento que pase a un agente se copia al
> repo en la misma sesión, **antes de usarlo**. La sesión es efímera; el repo no.
>
> Regla de Jonathan (23/08/2026), que la cierra: **de cada PDF se guarda copia
> versionada en el repo, como histórico** — también los que descarga un agente
> del BOE, no solo los que él pasa por el chat. Hasta ese día `.gitignore` lo
> impedía con una sola línea (`datos/**/*.pdf`); se retiró.

**Estado, y se puede consultar**: `npm run auditar:fuentes` dice qué materias
tienen ya su documento y cuáles no. El día que se retiró la línea del
`.gitignore`: **78 materias, 0 con documento versionado.** No es una puerta y no
bloquea nada — es un inventario, y de lo que se trata es de que esa cifra baje.
Las 20 marcadas con `×` son las urgentes: su corpus salió de los propios lotes,
así que ahí la ausencia del documento no solo impide re-verificar, es que hace
pasar por verificado algo que no lo está.

## Por qué existe esta carpeta

El 22/08/2026, midiendo si se podía auditar el banco entero, salió esto: de las
3.440 parejas actividad↔fuente, solo el **81,8 %** tenía dónde cotejarse. Y al
mirar por qué, el patrón era siempre el mismo — el documento original **nunca
estuvo en el repo**. Se le pasó a un agente, el agente extrajo el texto, escribió
las preguntas, y el PDF se quedó en el contenedor. Al morir la sesión se fue con
ella.

Lo que sobrevivió fue la **cita** (`referencia_fuente` en cada lote: edición,
NIPO, URL, fecha de consulta), que está bien y es más de lo que suele haber. Pero
una cita no permite re-verificar: permite saber qué habría que ir a buscar otra
vez. Y para contenido YMYL —donde una respuesta mal puede perjudicar a un
opositor— la diferencia entre esas dos cosas es toda.

El caso que lo dejó claro: `seccion-034.json`, la Estrategia Nacional de
Ciberseguridad, era un fichero de **378 bytes** con `"articulos": []`. Había 34
preguntas cargadas contra ella. Se verificaron en su día contra el BOE, pero no
quedó ni el texto ni forma de comprobarlo.

## Cómo se guarda

```
datos/fuentes/
  dgt-cuestiones-seguridad-vial/
    PROCEDENCIA.md          ← obligatorio
    manual-ii-2023.pdf
  ortografia-rae/
    PROCEDENCIA.md
    ortografia-basica-2.4.1.html
```

El nombre de la carpeta es la **materia**, la misma que en `meta.materia` del
lote y en `acertium_v2.concepto.materia`. Así se enlaza sin adivinar.

### `PROCEDENCIA.md`

Sin esta ficha, un documento no es una fuente citable. Lleva:

- **Qué es**: título completo y quién lo publica.
- **Edición o versión**: la que sea (2023, 49.ª, consolidado a 3-1-2025, NIPO…).
  Sin esto no se sabe si el documento de hoy es el mismo que se usó.
- **De dónde salió**: URL exacta, o «lo pasó Jonathan por el chat el DD/MM/AAAA».
- **Fecha de consulta**.
- **Tipo de fuente**: `oficial` | `autoridad` | `consenso` (contrato de fuentes
  no-BOE). Decide si su contenido puede quedar `verificado` o entra como
  `pendiente_revision`.
- **Qué se ingirió y qué no**: si solo se usaron tres capítulos, se dice. Media
  ingesta sin declarar parece cobertura completa.

### Si el documento no se puede versionar

Copyright, tamaño, o una web que no se deja guardar entera: **se crea igualmente
la carpeta con su `PROCEDENCIA.md`**, con la referencia lo más exacta posible
(edición, página, apartado). Es peor que tener el documento, pero es mucho mejor
que nada, y deja constancia de que falta.

### Lo que NO va aquí

Secretos, en ninguna forma (ver `CLAUDE.md`). Y nada de lo que produce el
sistema: los lotes, el corpus y los informes tienen su sitio.

## Relación con el corpus

```
datos/fuentes/<materia>/         el documento original
        ↓ (ingesta: extraer el texto)
datos/legal-es/boe-600-pn/corpus/seccion-NNN.json    el texto, por epígrafes
        ↓ (generación)
adaptadores/legal-es/generador/lotes/*.json          conceptos y preguntas
        ↓ (carga)
acertium_v2                                          el cerebro
```

Cada sección del corpus declara su `procedencia`:

- **sin `procedencia`** o `"ingesta"` — extraída del documento original. Es la
  buena. Ejemplo: `seccion-059.json` (Constitución de la OMS), que hasta
  documenta en `sustituye` una ingesta anterior descartada por erratas.
- **`"lote"`** — recogida de los lotes por `corpus-desde-lotes.mjs` el
  22/08/2026, porque el documento no estaba. Sirve para generar preguntas nuevas
  y para las puertas de calidad y unicidad, pero **re-cotejar contra ella las
  preguntas que salieron de esos mismos lotes no demuestra nada**: pasan por
  construcción. Son 20 secciones y 452 epígrafes esperando reingesta de verdad.

Convertir una sección de `"lote"` a ingesta real es exactamente: conseguir el
documento, guardarlo aquí con su `PROCEDENCIA.md`, reingerir, y comparar el texto
nuevo con el que había. Las diferencias que salgan son el hallazgo.
