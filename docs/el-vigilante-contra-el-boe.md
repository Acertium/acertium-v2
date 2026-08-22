# El vigilante contra el BOE: 1.163 preguntas o 31

> 23/08/2026, con acceso al BOE ya concedido. Se cierra lo que quedaba pendiente
> en `diff-por-articulo.md`: *«probarlo contra una reforma de verdad»*.

## La prueba que faltaba

La prueba anterior comparaba dos capturas de la **misma fecha** del Código Penal.
Demostraba que no hay falsos positivos, no que el diff detecte los cambios
reales. Con el BOE accesible se pudo hacer la buena, contra la única norma del
corpus de la que constaba una reforma posterior a nuestra captura: el
**Reglamento General de Circulación** (BOE-A-2003-23514), «modificado el
26/06/2026» cuando nuestra captura era de 17/06/2025.

```
corte 22/08/2026:  3 iguales · 0 MODIFICADOS · 1 parcial
                   → el 01/10/2026: art. 69 (2 conceptos)
corte 01/10/2026:  2 iguales · 1 MODIFICADOS
                   ⚠ re-verificar art. 69 → 2 de 14 conceptos: TRAF-011, TRAF-012
```

El diff detecta la reforma, y detecta **solo** la reforma: 2 conceptos de 14. Pero
lo importante es la primera línea.

## Publicado ≠ en vigor, y eso cambia el diseño

El consolidado del BOE **incluye redacciones que todavía no son Derecho**. El art.
69 del Reglamento tiene ya escrita la versión del RD 518/2026, publicada el
26/06/2026 — y su disposición final 3 la hace entrar en vigor el **1 de octubre**.
El BOE lo marca metiendo la redacción vigente en un `<blockquote caduca="20261001">`.

Quien coja «la última versión» le enseña al opositor un texto que hoy no rige.

Y el aviso del BOE dice «modificada el 26/06/2026». Reaccionar a esa fecha deja
dos salidas y las dos son malas:

- **marcar al publicarse** → al opositor se le retiran preguntas **correctas**
  durante tres meses (`pendiente` no se sirve);
- **no marcar nunca** → el 1 de octubre se le enseña Derecho derogado.

La salida está en separarlo: `extraer-articulos-boe.mjs` elige la versión por
`fecha_vigencia <= fecha de corte` y devuelve las posteriores aparte, en
`futuros`. Y en la base, `norma.cambio_futuro` guarda la fecha
(migración `20260823160000`). Hoy hay exactamente **una** norma en esa situación.

Esto responde además a la pregunta de Jonathan del 22/08 —«si el día 1 sale la
convocatoria y el día 10 una modificación, ¿cuál es la correcta?»—: la que esté
**en vigor** el día del examen, que no es la fecha del BOE sino la que fija la
disposición final de la reforma. Aquí van tres meses de diferencia.

## El barrido completo, y lo que mide

`npm run vigilar:normas -- --todas` compara las 59 secciones del corpus que tienen
referencia BOE contra el consolidado, artículo por artículo.

| | conceptos que se marcarían |
|---|---|
| si el aviso fuera **por norma** | **1.163** |
| con el diff **por artículo** | **31** |

Treinta y siete veces menos. Esa es toda la diferencia entre un vigilante y un
interruptor de apagado.

Y de esos 31, la mayoría **tampoco son reformas**:

| clase de discrepancia | artículos | conceptos | qué es |
|---|---|---|---|
| rótulo de división pegado | 26 | 18 | defecto del corpus |
| nota editorial del BOE pegada | 15 | 6 | defecto del corpus |
| resto | 36 | **7** | candidatos a cambio real |

**Siete conceptos** son lo que hay que mirar a mano. Los otros 24 salen de dos
defectos de captura del corpus que ya están identificados y localizados.

## Seis bugs míos, encontrados por el propio barrido

Igual que la vez anterior, el diff empezó encontrándose a sí mismo. En orden, con
lo que costaba cada uno:

| # | qué | coste |
|---|---|---|
| 1 | el BOE numera con letra («Artículo cincuenta y cuatro») | **11 normas enteras** sin comparar |
| 2 | rótulo con letra y párrafo con cifra (LOPJ) | 207 falsos positivos |
| 3 | `<a class="refPost">` dejaba `#aunico` dentro del texto | art. 517 CP y otros |
| 4 | guion blando (U+00AD) invisible en el XML | art. 348 CP |
| 5 | espacio suelto donde iba una etiqueta: `(Suprimido) .` | ~21 artículos |
| 6 | la rúbrica sin punto final | ~12 artículos |

El **1** es el que más enseña, y no por el tamaño: **fallaba en silencio y en la
dirección peligrosa**. Once normas —la LOPJ con 210 artículos, el Código Civil con
160, la LO 2/1986 de FCSE con 54— daban `0 modificados`, que se lee como «todo en
orden». Lo que había en realidad era `no he comparado nada`. Son 1.048 preceptos
de 7.030, el 15 % del corpus.

Los seis están cubiertos por autopruebas en `npm run test:motor`.

## Tres defectos del corpus, encontrados de paso

1. **La marca de omisión con los puntos separados.** `[ . . . ]` — pdftotext
   reparte los puntos según el kerning, así que la marca del Código 600 aparece
   de dos formas y la expresión original solo cogía una. **25 artículos de 8
   normas**, con 13 preguntas colgando, llevaban la marca dentro del texto como
   si fuera parte de la norma. Ahora van marcados `parcial: true` y quedan fuera
   del diff — un falso positivo permanente enseña a ignorar el aviso.

2. **Espacio delante de signo de puntuación.** «armas de guerra ; y de los
   Ministerios». 99 apariciones en 47 artículos. Sale de la ingesta de boe.es: al
   retirar una etiqueta del HTML queda el espacio. **No es cosmético**: el corpus
   es contra lo que las puertas comprueban que la opción correcta es cita
   literal, así que un cotejo puede fallar por un carácter que la norma no tiene.

3. **Guion de partición sin cerrar.** «contencioso- administrativo»,
   «socio- sanitarios». 41 en el corpus. Mismo problema que el anterior.

Los tres los arregla `npm run test:motor` ▸ `sanear-corpus.mjs --escribir`, que es
idempotente y se puede volver a correr tras reingerir una sección.

## Qué queda

- **Los 7 candidatos a cambio real**, uno por uno, contra la fuente. Salen de
  `npm run vigilar:normas -- --todas`.
- **El rótulo de división pegado** (26 artículos, 18 conceptos) y **la nota
  editorial pegada** (15 artículos, 6 conceptos): son defectos de la ingesta de
  boe.es de agosto, el mismo bug que tuve yo en la primera ronda. Lo que los
  arregla de verdad es **reingerir el corpus desde el consolidado del BOE**, que
  ahora es posible y que además cambiaría la línea base contra la que se
  verificaron 3.052 cotejos — no es un cambio para hacer de pasada.
- ~~**Dónde guardar los consolidados**~~ — **resuelto**. Jonathan: «guarda el
  hash por artículo y el XML solo si cambia algo». Hecho: `datos/fuentes/huellas/`
  lleva un hash del texto de cada artículo de las 57 normas en **376 KB** (frente
  a 26 MB), y el XML completo se versiona solo cuando la huella se mueve,
  anotando en el `PROCEDENCIA.md` de esa materia qué artículos fueron.

  El reparo obvio —«pierdes el texto anterior»— no se cumple: **el consolidado del
  BOE lleva dentro todas las versiones históricas de cada artículo**, así que el
  XML que se guarda el día del cambio trae las dos redacciones.

  Probado en los dos sentidos: segunda pasada seguida → 0 cambios, 0 XML
  escritos; con una reforma simulada en el art. 1 CE → detecta 1 artículo, lo
  baja a 2 conceptos, versiona el XML y anota la procedencia.
- **Cuatro tratados no tienen texto consolidado** (el BOE devuelve 404): la
  Convención contra la Tortura, los Protocolos del CEDH. No es un fallo del
  vigilante; son normas que el BOE publica pero no consolida.
