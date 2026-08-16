# Módulo de ortografía — generar y verificar grafía/acentuación (Tema 37)

## Problema
`nucleo/verificador-cotejo.mjs` normaliza el texto (quita tildes, pasa a minúsculas) para comprobar
que la opción correcta es cita literal de la fuente. Eso le impide **verificar la corrección de un
acento o de una grafía**: para el verificador, "sofá" y "sofa" son idénticos. Sirve para preguntas de
REGLA ("¿cuándo llevan tilde las agudas?"), pero NO para "¿qué palabra está bien escrita?".

## Diseño: verificación por diccionario + cotejo sensible a tildes
Dos piezas nuevas que reutilizan el núcleo:

### 1. Recurso de verdad — diccionario español autorizado
Un diccionario/wordlist de español con la grafía correcta (tildes y grafemas incluidos):
**hunspell es_ES** (RLA/LibreOffice, licencia libre) o el lemario RAE. Se versiona en el repo
(`adaptadores/tecnico-es/recursos/es_ES.dic`) o se instala en build. Es la fuente de verdad de "esta
palabra existe y se escribe así".

### 2. `verificar-ortografia.mjs` (puerta específica de la familia ORTO)
Según el `modo` de la actividad:
- **`modo: "grafia"`** (¿cuál está bien escrita? / ¿cuál lleva bien la tilde?): la opción **correcta
  debe existir en el diccionario** con match EXACTO (sensible a tildes/grafía); los **3 distractores NO
  deben existir** (grafías inválidas). Rechaza si la correcta no está, o si algún distractor también
  está (ambigüedad → dos respuestas válidas).
- **`modo: "regla"`** (por defecto): sigue con el cotejo literal contra la fuente RAE, como ahora.

### 3. Modo `sensibleTildes` en el verificador base
Para las actividades ORTO, el cotejo NO normaliza tildes (la tilde es el contenido). Un flag por
actividad o por familia.

## Generación (hacer ortografía)
- **Distractores de grafía** = alterar la correcta y comprobar con el diccionario que el resultado es
  INVÁLIDO: quitar/añadir/mover la tilde; b↔v; g↔j; con/sin h; ll↔y; etc. Así se garantiza una sola
  correcta.
- **Preguntas de acentuación de palabra** ("¿Cuál lleva bien la tilde?"): 1 forma correcta (en
  diccionario) + 3 mal acentuadas (no en diccionario).
- **Preguntas de regla** (las que ya generó el agente RAE) se conservan intactas.

## Alcance y beneficio extra
- Familia **ORTO** (Tema 37). `tipo_fuente: autoridad` (RAE) + el diccionario como recurso de verificación.
- El mismo diccionario sirve de **QA global**: se puede pasar sobre TODO el banco para detectar grafías
  raras (auditoría de ortografía ampliada), aunque el contenido legal ya salió limpio (auditoría 04/08).

## Pendiente de Code (pipeline)
1. Añadir el recurso diccionario (hunspell es_ES) al repo/build.
2. Implementar `verificar-ortografia.mjs` (§2) + el modo `sensibleTildes` en el verificador base (§3).
3. Engancharlo al flujo para la familia ORTO (junto a las puertas existentes).
4. **Después** (agentes): generar el lote ORTO ampliado con preguntas de grafía/acentuación verificadas
   contra el diccionario, además de las de regla que ya existen.
