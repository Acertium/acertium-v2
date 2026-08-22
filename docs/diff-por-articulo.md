# El diff por artículo, y por qué el vigilante lo necesita

> 23/08/2026. Jonathan: «¿con el agente vigilante solucionamos el problema de la
> revisión?».
>
> Parcialmente. Detectar sí; reaccionar, no — y la reacción mal calibrada es
> peor que no avisar.

## El problema, medido

El vigilante del Doc 005 §9 detecta que una norma se ha modificado y marca sus
conceptos como pendientes de re-verificar. Pero **el aviso del BOE es por NORMA y
nuestro contenido es por ARTÍCULO**. Y `pendiente` no se sirve, así que marcar de
más apaga contenido:

| si se reforma… | preguntas que caen | del banco | temas que pierden **más de la mitad** |
|---|---|---|---|
| Código Penal | 388 | **11,3 %** | **4** |
| Reglamento de Extranjería | 345 | 10,0 % | 2 |
| Constitución | 258 | 7,5 % | 2 |
| LECrim | 112 | 3,3 % | 1 |

No es hipotético: **el Código Penal se reformó el 9 de abril de 2026**. Con el
vigilante en marcha ese día y sin diff, el opositor se habría quedado sin el 11 %
del banco de un día para otro — por una reforma que probablemente no tocaba
ninguno de nuestros artículos.

**La cifra que lo arregla**: los 388 conceptos del CP cuelgan de **185 artículos
distintos**, a **2,1 conceptos por artículo** de media (máximo 13). Con diff, una
reforma de un artículo marca ~2 conceptos en vez de 388.

## Las dos piezas

- `nucleo/comparar-articulos.mjs` — agnóstico de dominio. Dos mapas `ref → texto`
  y devuelve `iguales` / `modificados` / `añadidos` / `eliminados`, más
  `conceptosAfectados()` para bajar de artículos a conceptos. Normaliza **solo
  ruido de captura** (saltos de línea, comillas y guiones tipográficos): no toca
  acentos, mayúsculas ni puntuación, porque en una norma una coma cambia el
  sentido.
- `adaptadores/legal-es/generador/extraer-articulos-pdf.mjs` — saca los artículos
  de un PDF del BOE (`pdftotext`).

## La prueba: dos capturas independientes de la misma norma

No hizo falta el BOE, que aquí está bloqueado. El Código Penal está **dos veces**
en el repo por caminos distintos:

- `seccion-035.json` — 723 artículos, texto consolidado íntegro **de boe.es**,
  reingerido el 17/08/2026.
- `35-lo-10-1995-codigo-penal.pdf` — el **Código 600**, que apareció al retirar
  `datos/**/*.pdf` del `.gitignore`.

Las dos declaran la misma última modificación: **9 de abril de 2026**. Así que un
diff correcto tiene que salir vacío en los artículos comunes. Y lo que pasó fue
mejor que un «funciona»: el diff encontró **tres bugs míos y dos defectos del
corpus**.

| ronda | modificados | qué era |
|---|---|---|
| 1 | **71** | el parser pegaba el rótulo de división («TÍTULO I De la infracción penal») al artículo anterior |
| 2 | **25** | `artículo 92.` al final de una línea partida parecía una cabecera, y truncaba el artículo en curso |
| 3 | **8** | las Secciones llevan la descripción en la misma línea |
| 4 | **2** | `[...]`, la marca de omisión del Código 600 — 6 caracteres exactos, en 5 artículos |

### Los tres bugs, porque los tres enseñan lo mismo

**1. El rótulo de división.** Entre el fin de un artículo y el siguiente el BOE
mete «TÍTULO I / De la infracción penal / CAPÍTULO I / De los delitos», y el
parser lo acumulaba:

```
art. 9  corpus: «…más consecuencias de la infracción penal.»
art. 9  pdf   : «…más consecuencias de la infracción penal. TÍTULO I De la
                 infracción penal CAPÍTULO I De los delitos»
```

**2. La mayúscula no era cosmética.** pdftotext parte las líneas por el margen, y
una remisión interna acaba en un renglón que es literalmente `artículo 92.`. Con
el modificador `/i` eso **es** una cabecera: el parser abría un artículo 92 falso
y dejaba el 36 con 84 caracteres de 3.299. El BOE capitaliza las cabeceras y
escribe las remisiones en minúscula — es la única señal que los distingue, porque
por forma son idénticos.

**3. La marca de omisión.** Cinco artículos discrepaban en **exactamente 6
caracteres**, que es lo que mide ` [...]`. El Código 600 es «[Inclusión parcial]»
y señala así lo que se salta. Un artículo con esa marca **no es comparable**: le
faltan apartados por diseño. Se retira del texto y **se devuelve señalado**, no
se recorta en silencio — recortar y callar convierte un artículo mutilado en uno
aparentemente íntegro.

### El resultado

```
PDF: 268 artículos, 6 con omisión → comparables: 262
iguales: 260   MODIFICADOS: 2   añadidos: 0
```

**Cero falsos positivos sobre 262 artículos.** Y las 2 discrepancias que quedan
**no son del PDF: son del corpus**. Los artículos 9 y 137 de `seccion-035.json`
llevan pegado el rótulo del LIBRO que viene detrás:

```
art. 137 corpus: «…en los casos establecidos por la Ley. LIBRO II Delitos y sus penas»
art. 137 pdf   : «…en los casos establecidos por la Ley.»
```

Es decir: **la ingesta de boe.es del 17/08 tiene el mismo bug que yo tuve en la
ronda 1**, y llevaba una semana en la línea base sin que nada lo viera. El diff
lo encontró de paso.

## Qué queda

- **Limpiar los arts. 9 y 137 del corpus.** Un concepto cuelga de ellos. Al
  barrer las 59 normas contra el BOE resultó que no son dos casos sueltos: son
  **26 artículos** con el rótulo pegado, de los que cuelgan 18 conceptos.
- ~~**Probarlo contra una reforma de verdad**~~ — **hecho el 23/08/2026**, en
  cuanto llegó el acceso al BOE. Ver `el-vigilante-contra-el-boe.md`: el diff
  detecta la reforma del art. 69 del Reglamento General de Circulación y solo
  esa (2 conceptos de 14), y de paso apareció lo que esta página no podía ver —
  que el consolidado del BOE **trae redacciones que aún no están en vigor**.
- **Las disposiciones y anexos** no se extraen: el corpus tampoco los guarda como
  artículos. Se cuentan aparte para que no parezcan pérdidas silenciosas.
