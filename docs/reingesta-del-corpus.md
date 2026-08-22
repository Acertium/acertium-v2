# La reingesta del corpus, y las 31 alarmas que eran nuestras

> 23/08/2026. El corpus deja de ser una captura del PDF y pasa a ser el texto
> oficial del BOE.

## El resultado, en una línea

```
vigilante ANTES:  59 normas · 18 con algo que mirar · 31 conceptos a re-verificar
vigilante AHORA:  59 normas ·  1 con algo que mirar ·  0 conceptos
```

Y ese 1 es el art. 69 del Reglamento de Circulación, cuya redacción nueva **entra
en vigor el 1 de octubre**: no hay nada que tocar hoy.

**Ninguna de las 31 alarmas era una reforma.** Todas eran defectos de cómo se
capturó el corpus. El vigilante llevaba días señalando correctamente que nuestro
texto no coincidía con la ley, y la causa estaba siempre de nuestro lado.

## Qué se reemplazó

101 artículos de 22 secciones, tomados del consolidado del BOE en su versión
**en vigor**:

| | artículos | qué era |
|---|---|---|
| el corpus estaba **truncado** | 9 | faltaba texto de la norma |
| el corpus tenía **texto de más** | 14 | rótulos de división o artículos siguientes pegados |
| diferencias menores | 78 | puntuación, notas editoriales, ruido de captura |

Los tres peores dan la medida del problema:

```
LOPJ art. 87    279 → 11.852 caracteres   (teníamos el 2,4 % del artículo)
LOPJ art. 89    361 →  9.753
LECrim art. 861 2.721 →  1.254            (se había tragado los artículos siguientes)
```

De esos 23 artículos con defecto grave colgaban **5 conceptos**: EXT-025 a
EXT-028 y LOPJ-028 — exactamente los que el vigilante venía marcando.

## Qué NO hace la reingesta, y es deliberado

- **No añade artículos.** El BOE tiene 2.820 que el corpus no guarda. Traerlos
  para tener 340 conceptos del Código Penal no mejora nada y dobla el repo.
- **No borra nada.** Los 43 artículos que el consolidado no trae bajo esa
  referencia —anexos, disposiciones, numeraciones que cambiaron— se conservan y
  se cuentan aparte.
- **No toca las fuentes que no son BOE.** La Ortografía de la RAE, los manuales
  de la DGT, el DLE: su verificación es la del `contrato-fuentes-no-boe.md`.
- **Coge la versión en vigor, no la última publicada.** Meter la redacción del
  1 de octubre en el corpus de agosto sería enseñar Derecho que aún no lo es.

## Los `fuentes` de los lotes: recortar, no sustituir

Al refrescar el corpus, seis extractos del bloque `fuentes` de los lotes dejaron
de encajar. No era una regresión: **el defecto cambió de sitio**. El extracto
llevaba el rótulo pegado desde el principio y hasta entonces «encajaba» porque el
corpus lo llevaba también — las dos copias compartían el mismo error.

La tentación era sustituir el extracto por el artículo entero. No se hizo:
`fuentes` es una **selección**, no una copia. El art. 23 LOPJ tiene 13.499
caracteres y el lote cita 1.241. Sustituirlo habría destruido la curación y
multiplicado el peso de los lotes.

Lo que se hace es **recortar el rótulo, y solo si al recortarlo el extracto pasa
a encajar de verdad en el BOE**. Cinco recortados. El sexto era otra cosa: el
extracto del art. 4 de la LO 4/1981 se había comido una conjunción («de la
Constitución, concurra» donde el BOE dice «de la Constitución, **y** concurra»).
Corregido; ninguna pregunta lo citaba.

## Tres cosas que la reingesta destapó

**1. «art. cuarto» y «4» no cruzaban.** 51 actividades citan el artículo en
letra —toda la LO 3/1981 del Defensor del Pueblo, la LO 4/1981— y el corpus usa
cifras. Cada herramienta traía su propia normalización de la clave, y ninguna
entendía numerales escritos. Esos 51 cotejos salían como «artículo fuera del
consolidado», que se lee como «no aplica» cuando lo que pasaba era «no lo he
encontrado». Ahora hay **una sola** `claveArticulo()`, en el adaptador, que usan
las cuatro herramientas. La cobertura del cotejo subió de 2.367 a **2.418**.

**2. Una cuarta errata del BOE.** Con esos 51 cotejos ya alcanzables apareció
DP-002: la LO 3/1981 escribe «del Senado» ocho veces y «del **s**enado» dos, y el
art. 2 es una de las dos. Nuestra cita lo capitaliza. Va a `ERRATAS_BOE`.

**3. El BOE también parte palabras.** El consolidado publica «libro- talonario»
(RD 2822/1998 art. 45) e «informe- propuesta» (RD 39/1997 art. 27) con el espacio
dentro. `sanear-corpus` los «arreglaba» y con eso apartaba el corpus de su fuente
— el vigilante los denunciaba como modificados en cada pasada. **Una sección
reingerida del BOE ya no se sanea**: sanear limpia defectos de captura, y el
consolidado no es una captura.

## Lo que la reingesta NO arregló, y por qué

`auditar-corpus` sigue exactamente donde estaba: 2.443 cotejos literales OK, 63
hallazgos (C), 610 cotejos circulares. Eso es lo esperado y conviene decirlo sin
adornos:

- **Los 610 circulares no se podían arreglar por aquí.** Son 20 familias —ORTO,
  GRAM, DGT, INTEL, CIBER, REDES, DUDH, CEDH, TORT…— que **no son normas del
  BOE**. Su corpus se reconstruyó desde los propios lotes porque no había otra
  fuente en el repo. Lo que las salda es conseguir el documento original y
  versionarlo (`npm run auditar:fuentes`), no esto.
- **Los 63 hallazgos (C)** son frases del bloque `fuentes` que no están en la
  norma. Los seis que la reingesta movió ya están resueltos; los 63 restantes son
  anteriores y siguen pendientes de mirarse uno a uno.

## Comprobaciones

```
npm run reingerir:corpus -- --cache <dir>          # informa
npm run reingerir:corpus -- --cache <dir> --escribir
```

Idempotente: una segunda pasada seguida no cambia nada. Tras aplicarla,
`test:motor` y `build` en verde, `auditar-corpus` en su línea base y
`cotejar-contra-boe` con **0 no encontrados** sobre 2.418 citas.
