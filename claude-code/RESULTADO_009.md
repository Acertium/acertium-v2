# RESULTADO_009 — Módulo de ortografía (grafía y acentuación)

Ejecutado el **2026-08-16**. Estado: **completado**. Es cambio de pipeline, no de contenido: no se ha
cargado ni modificado ninguna actividad.

## 1. Recurso de verdad — diccionario español

En `adaptadores/tecnico-es/recursos/` (carpeta nueva), con su `README.md` documentando origen y
licencia:

- `es_ES.aff` (163 KB, 6.755 reglas de afijo) y `es_ES.dic` (690 KB, **57.345 entradas**).
- **Origen real: RLA-ES** (`sbosio/rla-es`), el diccionario `es_ES` de LibreOffice/Apache OpenOffice,
  **versión 2.8**; tomado del empaquetado de `wooorm/dictionaries`.
- **Licencia GPL-3.0 OR LGPL-3.0 OR MPL-1.1**, con el fichero de licencia original conservado como
  `LICENSE.dic.txt` (es condición de la licencia).

**Decisión sobre el lookup.** El encargo daba a elegir entre expandir a wordlist plana o usar una
librería. Expandir no era viable: 57.345 entradas × 6.755 reglas de afijo dan millones de formas, y el
español las necesita (el `.dic` trae `sofá` y `sofás`, pero `corazones` y `cantaría` solo salen por
afijo). Se usa **`nspell`** (devDependency, mismo autor que el empaquetado), que implementa el lookup
de hunspell con afijos. Es exacto y sensible a tildes, que es justo lo que hacía falta.

## 2. `nucleo/verificar-ortografia.mjs` — la puerta

- **`modo: "grafia"`** — la correcta debe existir en el diccionario con match exacto; **rechaza** si
  la correcta no está, y **rechaza por ambigüedad** si algún distractor también es palabra válida
  (habría dos respuestas correctas). Rechaza además si las opciones no son palabras sueltas: en ese
  caso la puerta no sabe juzgar y lo dice, en vez de dar un veredicto falso.
- **`modo: "regla"` (o sin `modo`)** — delega en el cotejo literal de siempre, pero **en modo sensible
  a tildes**, que es lo suyo para esta familia.
- Aviso no bloqueante cuando ningún distractor es una variante de acentuación de la correcta: la
  pregunta puede ser trivial.
- Mismo formato de salida que las otras puertas: `{ ok, resumen, rechazos, avisos }`.

**Nota de capas.** `nucleo/` es agnóstico de dominio y el diccionario es de un adaptador. El módulo
**no conoce la ruta**: recibe el diccionario ya cargado (o su carpeta) por parámetro, con un default
al `es_ES` para no cablearlo en cada llamada. Así se puede inyectar otro idioma sin tocar el núcleo.

## 3. Modo sensible a tildes en `verificador-cotejo.mjs`

`normalizarNumeros` quita tildes y baja a minúsculas — correcto para la ley (la fuente escribe
"setenta y dos horas" donde la pregunta dice "72 horas"), pero incapaz de juzgar un acento.

Nuevo `cotejoSensible()` + `esSensible()`. Se activa por actividad (`cotejo_sensible: true`) o por
familia (**ORTO**). **Por defecto no se activa: las ~2.400 actividades ya verificadas cotejan
exactamente igual que antes**, y `verificar-lote.mjs` (que tiene su propio `contiene`) no cambia nada
para ninguna familia.

**Un ajuste que hice sobre la marcha, y por qué.** La primera versión comparaba también mayúsculas y
**rechazó ORTO-031**, una actividad ya cargada en producción: su opción correcta es «la primera
palabra del título…» y su fuente «**La** primera palabra del título…». Eso es una mayúscula de inicio
de frase, no una falta. El modo sensible conserva **las tildes** e **ignora la caja**. Consecuencia
asumida y anotada en el código: este modo no puede, por sí solo, verificar una pregunta sobre uso de
mayúsculas; para eso está el modo `grafia`.

## 4. Enganche

`generar.mjs` corre la puerta **solo si la familia es ORTO**, fail-closed como las demás (si rechaza,
no se carga). El resto de familias no la ejecutan.

## 5. Verificación

`npm run test:motor` **ejecuta ahora de verdad** (ver abajo) y pasa entero:

| Suite | Resultado |
|---|---|
| `verificador-cotejo` (nuevo) | **13/13** |
| `verificar-ortografia` (nuevo) | **12/12** |
| `verificar-meta` fuentes no-BOE | **5/5** |
| `motor-bkt`, `planificador`, `verificar-lote` | pasan |

Los tres casos que pedía el §5 están cubiertos: (a) `sofá` ∈ dic y `sofa` ∉ dic (más
`corazón`/`corazon`); (b) una `grafia` con correcta válida + 3 inválidas **pasa**, una con dos
válidas se **rechaza**, y una cuya correcta no existe se **rechaza**; (c) el verificador base da el
mismo resultado que antes en modo normal.

**Regresión sobre contenido real:** el lote `ortografia-rae.json` (32 actividades, ya en producción)
pasa la puerta nueva con **0 rechazos y 0 avisos**.

## 6. Arreglado de paso: `npm run test:motor` pasaba en vacío

Llevaba anotado desde el 03/08 en tres entradas de `EJECUCIONES.md`. El guard de los self-tests era

    import.meta.url === `file://${process.argv[1]}`

que **en Windows no se cumple nunca** (`import.meta.url` es `file:///C:/…` con `/`;
`process.argv[1]` es `C:\…` con `\`). El comando salía con código 0 **sin ejecutar una sola
aserción**: verde falso. Nuevo `nucleo/ejecucion-directa.mjs` con `pathToFileURL`, aplicado a
`motor-bkt`, `planificador`, `verificar-lote`, `verificador-cotejo`, `verificar-ortografia` y
`verificar-meta`.

Además: `verificador-cotejo.mjs` **no tenía self-test** (el comando lo ejecutaba y no comprobaba
nada); ahora tiene 13 casos. Y `test:motor` incluye las tres suites que faltaban.

Con el guard arreglado apareció un fallo real en el self-test de `verificar-meta` que yo había
escrito una hora antes: el fixture hacía `{ ORTO: {...}, ...registro }`, así que **el registro real
pisaba el ORTO de prueba** y el caso no probaba lo que decía. Corregido el orden y añadido
`process.exit(1)` cuando falla, que tampoco lo tenía.

## Lo que NO entra en este encargo

- **No se ha generado ningún lote ORTO de grafía.** El encargo lo deja explícitamente para después
  ("Después (no en este encargo)"). La puerta está lista y con `modo: "grafia"` esperando contenido;
  el lote ORTO actual es todo de `regla`.
- El diccionario **no valida contexto**: `casa` y `caza` existen las dos. Por eso la ambigüedad se
  rechaza en vez de resolverse.
- Si una palabra correcta falta del diccionario, la puerta la rechaza. Es la dirección segura (nunca
  aprueba una falta), pero puede tumbar una pregunta buena: está anotado en el README del recurso.
