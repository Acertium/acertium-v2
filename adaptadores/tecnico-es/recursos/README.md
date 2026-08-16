# Recursos del adaptador técnico-es

## Diccionario español `es_ES` (hunspell)

Recurso de verdad de la puerta de ortografía (`nucleo/verificar-ortografia.mjs`, Tema 37): decide si
una palabra existe **con esa grafía exacta, tildes incluidas**.

| | |
|---|---|
| Ficheros | `es_ES.aff` (163 KB, 6.755 reglas de afijo) · `es_ES.dic` (690 KB, 57.345 entradas) |
| Origen inmediato | [`wooorm/dictionaries`](https://github.com/wooorm/dictionaries/tree/main/dictionaries/es), ficheros `index.aff` / `index.dic` |
| Origen real | **RLA-ES** — [`sbosio/rla-es`](https://github.com/sbosio/rla-es), *Recursos Lingüísticos Abiertos del Español*; es el diccionario `es_ES` de LibreOffice / Apache OpenOffice, versión **2.8** |
| Licencia | **GPL-3.0 OR LGPL-3.0 OR MPL-1.1** (triple licencia; texto completo en `LICENSE.dic.txt`) |
| Descargado | 2026-08-16 |

`LICENSE.dic.txt` es el fichero de licencia tal cual viene del proyecto: consérvalo junto a los `.aff`
/ `.dic`, es condición de la licencia.

### Cómo se consulta

Con **`nspell`** (devDependency, mismo autor que el empaquetado del diccionario), que implementa el
lookup de hunspell **incluidas las reglas de afijo**. Se descartó expandir el diccionario a una lista
plana de palabras: 57.345 entradas × 6.755 reglas de afijo dan millones de formas, y el español
flexiona mucho (el `.dic` trae `sofá` y `sofás`, pero `corazones` y `cantaría` salen por afijo).

```js
import { cargarDiccionario } from "../../nucleo/verificar-ortografia.mjs";
const dic = await cargarDiccionario();
dic.existe("sofá");  // true
dic.existe("sofa");  // false  ← el punto de todo esto
```

### Límites que conviene conocer

- **Es una lista, no un juez de contexto.** Sabe si una palabra existe, no si es la adecuada en la
  frase: `casa` y `caza` existen las dos. Por eso el modo `grafia` rechaza una pregunta cuando más de
  una opción es palabra válida — sería ambigua.
- **Cobertura ≠ exhaustividad.** Si una palabra correcta no está en el diccionario, la puerta la
  rechaza. Es la dirección segura del error (fail-closed: nunca aprueba una falta), pero puede tumbar
  una pregunta buena. Si pasa a menudo, el sitio donde mirar es este recurso, no la puerta.
- **No sustituye a la RAE como fuente.** Las preguntas de *regla* siguen citando literalmente la
  Ortografía de la RAE-ASALE (ver la familia `ORTO` en `registro-materias.json`). El diccionario solo
  arbitra la grafía de palabras sueltas.

### Actualizarlo

Volver a bajar `index.aff` e `index.dic` del repo de origen, renombrarlos a `es_ES.*` y correr
`npm run test:motor` (el self-test de `verificar-ortografia` comprueba que sigue distinguiendo
`sofá`/`sofa` y `corazón`/`corazon`).
