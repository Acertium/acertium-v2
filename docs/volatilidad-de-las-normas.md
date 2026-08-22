# La volatilidad de las 61 normas, para revisar

> 23/08/2026. Encargo de Jonathan: «clasifica tú la volatilidad de las 60 y lo
> reviso».

## Qué es esto, dicho exacto

**No es una medida de volatilidad. Es una derivación** a partir de la única señal
que consta en el repositorio: cuándo se modificó la norma por última vez, según
el metadato `ultima_modificacion` que cada sección del corpus guardó de su
ingesta desde boe.es.

Se buscó algo mejor antes de conformarse con esto. `acertium_v2.articulo_reforma`
tiene **dos filas**, las dos de la Constitución: no da para contar reformas por
norma. Y sin acceso al BOE —bloqueado por la política de red del entorno— no hay
forma de obtener el historial de modificaciones, que es la señal que de verdad
mide volatilidad.

## La regla

| clase | criterio |
|---|---|
| `volatil` | última modificación hace **< 3 años** |
| `media` | entre **3 y 10 años** |
| `estable` | **≥ 10 años**, o nunca modificada desde su publicación |

El corte en 3 años es la ventana en la que una norma sigue en territorio
legislativo activo; los 10, evidencia fuerte de que ya no se toca. Sobre las 53
clasificables el reparto no está degenerado (26 / 13 / 15), así que la regla
separa algo.

La fecha de referencia va **fija** (`2026-08-23`), no `current_date`, para que
esto sea reproducible y para que conste cuándo se clasificó.

---

## ⚠ Lo primero que hay que mirar: la regla contradice la única clasificación humana

`constitucion-espanola` era **la única fila clasificada a mano**, y decía
`estable`. Su `ultima_modificacion` es **2026-05-20**, así que mi regla la habría
puesto **`volatil`**. El `UPDATE` la respetó (solo tocaba las que estaban en
NULL), pero la discrepancia queda.

Y hay un tercer dato que apunta al mismo sitio: `articulo_reforma` registra **dos
reformas de la Constitución en 48 años** (1992 y 2024). Eso es `estable` sin
discusión.

**Conclusión:** o bien el 2026-05-20 no es una reforma sustantiva sino una
actualización editorial del texto consolidado, o bien la CE se reformó otra vez.
**Desde el repositorio no se puede resolver**, y no lo voy a decidir de memoria.

Lo que sí deja establecido, y es lo importante para revisar el resto: **la fecha
de «última actualización» del BOE no es lo mismo que la frecuencia de reforma
sustantiva.** En la única norma donde hay con qué contrastar, la regla falla.

---

## Tres límites más, para tener delante

**1. La señal es de la NORMA; el contenido es del ARTÍCULO.** El banco usa 112
conceptos de la LECrim, que tiene ~1.000 artículos: una reforma del art. 324 la
marca «volátil» sin tocar nada de lo que estudiamos. Igual con
`codigo-civil-titulo-preliminar`, del que solo se usa el Título Preliminar —de lo
más quieto del ordenamiento— y sale `volatil`.

Así que **«volátil» aquí significa «esta norma está en movimiento, hay que
mirarla», no «nuestro contenido está caducado»**. Como disparador de
re-verificación sirve; como diagnóstico, no.

**2. La recencia predice el futuro solo en parte.** `lo-4-2015-seguridad-ciudadana`
sale `media` (2021) y su reforma lleva años en trámite parlamentario.

**3. La fecha es la de la ingesta, no la de hoy.** Una norma reformada después de
que se ingiriera su sección parece más estable de lo que es. El sesgo va en la
dirección mala, y solo lo cierra `last_verified`, que sigue en NULL en las 60
porque exige ir al BOE.

---

## Las 7 sin clasificar

No se clasifica lo que no se puede medir: sus secciones del corpus no traen el
metadato. Son `ley-39-2006-dependencia`, `rd-39-1997-reglamento-servicios-prevencion`,
`convenio-europeo-derechos-humanos`, `orden-pci-487-2019-estrategia-nacional-ciberseguridad`,
`convencion-contra-la-tortura` y los Protocolos 14 y 15 del CEDH. Entre las siete
sostienen **213 conceptos**.

---

## La tabla completa

`años` = desde la última modificación hasta el 2026-08-23. `conceptos` = cuántos
del banco cuelgan de esa norma, que es lo que está en juego si cambia.

| norma | última modificación | años | conceptos | clase |
|---|---|---|---|---|
| `lo-10-1995-codigo-penal` | 2026-04-09 | 0.4 | 388 | **volatil** |
| `rd-1155-2024-reglamento-extranjeria` | 2026-04-15 | 0.4 | 345 | **volatil** |
| `lecrim-1882` | 2026-04-09 | 0.4 | 112 | **volatil** |
| `rd-137-1993-reglamento-armas` | 2025-04-04 | 1.4 | 58 | **volatil** |
| `orden-int-430-2014-uniformidad` | 2026-04-30 | 0.3 | 50 | **volatil** |
| `orden-int-632-2024-desarrollo-procesos-selectivos-pn` | 2024-06-25 | 2.2 | 50 | **volatil** |
| `rd-769-1987-policia-judicial` | 2024-12-23 | 1.7 | 46 | **volatil** |
| `ley-31-1995-prl` | 2026-04-09 | 0.4 | 45 | **volatil** |
| `rd-49-2024-centros-docentes-pn` | 2024-01-17 | 2.6 | 44 | **volatil** |
| `lo-4-2000-extranjeria` | 2025-03-19 | 1.4 | 31 | **volatil** |
| `lo-3-2007-igualdad` | 2024-08-02 | 2.1 | 30 | **volatil** |
| `lo-9-2015-personal-policia-nacional` | 2024-11-12 | 1.8 | 30 | **volatil** |
| `ley-40-2015-sector-publico` | 2024-08-02 | 2.1 | 30 | **volatil** |
| `rdleg-5-2015-ebep` | 2025-07-30 | 1.1 | 28 | **volatil** |
| `lo-2-1979-tribunal-constitucional` | 2024-08-02 | 2.1 | 28 | **volatil** |
| `ley-50-1981-ministerio-fiscal` | 2025-01-03 | 1.6 | 28 | **volatil** |
| `lo-6-1985-poder-judicial` | 2025-02-17 | 1.5 | 28 | **volatil** |
| `ley-50-1997-gobierno` | 2025-01-03 | 1.6 | 28 | **volatil** |
| `lo-3-2018-proteccion-datos` | 2025-12-27 | 0.7 | 26 | **volatil** |
| `codigo-civil-titulo-preliminar` | 2025-01-03 | 1.6 | 26 | **volatil** |
| `rd-2822-1998-reglamento-vehiculos` | 2026-06-26 | 0.2 | 24 | **volatil** |
| `rd-207-2024-estructura-ministerio-interior` | 2026-04-27 | 0.3 | 24 | **volatil** |
| `itc-reglamento-armas` | 2025-04-04 | 1.4 | 21 | **volatil** |
| `lo-6-1984-habeas-corpus` | 2024-11-14 | 1.8 | 17 | **volatil** |
| `rd-1428-2003-reglamento-circulacion` | 2025-06-17 | 1.2 | 14 | **volatil** |
| `rd-220-2022-acogida-proteccion-internacional` | 2022-03-30 | 4.4 | 58 | **media** |
| `ley-5-2014-seguridad-privada` | 2021-05-27 | 5.2 | 45 | **media** |
| `lo-1-2004-violencia-genero` | 2022-09-07 | 4.0 | 34 | **media** |
| `lo-4-2015-seguridad-ciudadana` | 2021-02-23 | 5.5 | 32 | **media** |
| `ley-12-2009-asilo` | 2023-03-01 | 3.5 | 30 | **media** |
| `orden-int-859-2023-estructura-dgp` | 2023-08-17 | 3.0 | 30 | **media** |
| `lo-9-2021-fiscalia-europea` | 2021-07-02 | 5.1 | 30 | **media** |
| `ley-8-2011-infraestructuras-criticas` | 2022-07-29 | 4.1 | 28 | **media** |
| `ley-4-2023-trans-lgtbi` | 2023-03-01 | 3.5 | 28 | **media** |
| `rd-853-2022-procesos-selectivos-pn` | 2022-10-12 | 3.9 | 27 | **media** |
| `lo-7-2021-datos-penales` | 2022-07-29 | 4.1 | 27 | **media** |
| `ley-4-2015-estatuto-victima` | 2022-09-07 | 4.0 | 23 | **media** |
| `rd-773-1997-epi` | 2021-12-08 | 4.7 | 14 | **media** |
| `constitucion-espanola` | 2026-05-20 | 0.3 | 262 | **estable** ⚠ |
| `rd-555-2011-regimen-electoral-consejo-policia` | 2011-04-21 | 15.3 | 62 | **estable** |
| `rd-2-2006-prl-policia` | 2006-01-17 | 20.6 | 44 | **estable** |
| `orden-int-2573-2015-vehiculos-conduccion-detenidos` | 2015-12-04 | 10.7 | 41 | **estable** |
| `rd-1325-2003-proteccion-temporal` | 2003-10-25 | 22.8 | 37 | **estable** |
| `rd-67-2010-prl-age` | 2014-12-24 | 11.7 | 35 | **estable** |
| `rd-865-2001-reglamento-apatrida` | 2001-07-21 | 25.1 | 34 | **estable** |
| `rd-203-1995-reglamento-asilo` | 2005-05-07 | 21.3 | 28 | **estable** |
| `rd-704-2011-reglamento-infraestructuras-criticas` | 2011-05-21 | 15.3 | 27 | **estable** |
| `lo-4-1981-estados-alarma-excepcion-sitio` | 1981-06-05 | 45.2 | 26 | **estable** |
| `lo-4-2010-regimen-disciplinario` | 2015-07-29 | 11.1 | 26 | **estable** |
| `lo-3-1981-defensor-del-pueblo` | 2009-11-04 | 16.8 | 25 | **estable** |
| `rd-240-2007-libre-circulacion-ue` | 2015-11-09 | 10.8 | 25 | **estable** |
| `lo-2-1986-fcse` | 2015-07-29 | 11.1 | 16 | **estable** |
| `reglamento-defensor-del-pueblo` | 2012-03-01 | 14.5 | 15 | **estable** |
| `rd-1215-1997-equipos-trabajo` | 2004-11-13 | 21.8 | 13 | **estable** |
| `ley-39-2006-dependencia` | — | — | 69 | sin clasificar |
| `rd-39-1997-reglamento-servicios-prevencion` | — | — | 36 | sin clasificar |
| `convenio-europeo-derechos-humanos` | — | — | 34 | sin clasificar |
| `orden-pci-487-2019-estrategia-nacional-ciberseguridad` | — | — | 34 | sin clasificar |
| `convencion-contra-la-tortura` | — | — | 25 | sin clasificar |
| `cedh-protocolo-14` | — | — | 9 | sin clasificar |
| `cedh-protocolo-15` | — | — | 6 | sin clasificar |

## Reparto

| clase | normas | conceptos |
|---|---|---|
| `volatil` | 25 | 1.551 |
| `estable` | 16 | 716 |
| `media` | 13 | 406 |
| sin clasificar | 7 | 213 |

**Más de la mitad del banco cuelga de normas tocadas en los últimos tres años.**
Ese es el motivo por el que la regla 7 existe.

## Lo que NO se ha hecho

`cadencia_revision` sigue vacía. Sale casi sola de la volatilidad —trimestral /
semestral / anual— pero es otra decisión, y esta clasificación todavía está sin
revisar: encadenar una derivación a otra sin que nadie haya mirado la primera es
como se construyen los datos que parecen verdad.
