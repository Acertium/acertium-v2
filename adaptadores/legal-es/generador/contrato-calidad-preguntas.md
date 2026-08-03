# Estándar de calidad de las preguntas — nivel examen oficial (Policía Nacional)

Objetivo: que una pregunta **no se pueda adivinar sin saber**, igual que en el examen oficial. La puerta de contenido ya garantiza que la respuesta correcta es cita literal del BOE; esto define cómo tienen que ser las **4 opciones y el enunciado** para que la pregunta discrimine de verdad.

El módulo tiene **dos capas**:
- **Capa 1 — determinista** (`verificar-calidad.mjs`, fail-closed): lo mecánico que delata la respuesta (longitud, posición, duplicados, meta-opciones, enunciado).
- **Capa 2 — semántica** (revisor/reescritor con criterio de profesor): juzga y reescribe los distractores flojos como *near-misses* plausibles. Es la que da la dificultad "oficial", porque requiere criterio que una regla no tiene.

## Rúbrica (qué hace difícil una pregunta)

1. **Homogeneidad.** Las 4 opciones tienen longitud parecida, la misma forma gramatical, el mismo registro y el mismo nivel de concreción. Ninguna destaca. (Regla dura: la correcta NO puede ser la única larga y completa — eso la delata.)
2. **Distractores = near-miss.** Cada distractor parte de la estructura de la correcta y cambia UN elemento decisivo:
   - una **cifra/plazo/cuantía/porcentaje** por otra del mismo tipo (3 años → 2 años · 5 años · 1 año);
   - un **órgano/sujeto** por otro real y competente en la materia (Ministro del Interior → Secretario de Estado de Seguridad · Director General de la Policía · Delegado del Gobierno);
   - una **calificación** (muy grave → grave → leve);
   - una **condición o excepción** (alterando el matiz: "salvo…", "siempre que…");
   - un **ámbito, fase o plazo** distinto pero verosímil.
3. **Plausibilidad.** Los distractores son verdaderos *en otro contexto*: conceptos reales del mismo dominio (otra falta que existe, otro plazo que la ley recoge, otro órgano real). El que no domina duda entre las cuatro.
4. **Prohibido** (lo caza la Capa 1 o el revisor):
   - opciones absurdas u obviamente falsas;
   - que la correcta sea la única larga/detallada;
   - meta-opciones: "todas/ninguna de las anteriores", "a y b son correctas", "no sabe/no contesta";
   - pistas gramaticales (concordancia de género/número que solo cuadra con una opción);
   - repetir literalmente el enunciado dentro de una sola opción.
5. **Enunciado.** Pregunta UNA cosa concreta y unívoca. Si es negativo ("¿cuál NO…?"), el NO va en mayúsculas/resaltado.
6. **Grounding intacto.** La opción correcta sigue siendo cita literal del artículo (no se toca; solo se reescriben los distractores).

## Ejemplos

**Mal (se adivina):** ¿Plazo de prescripción de las faltas muy graves? → ["Tres años" · "No prescriben" · "Depende del caso" · "Un plazo razonable"].
**Bien (hay que saber):** → ["Tres años" · "Dos años" · "Cinco años" · "Un año"] — todos plazos reales de prescripción.

**Mal:** ¿Quién impone la separación del servicio? → ["El Ministro del Interior, previa incoación de expediente disciplinario con todas las garantías" · "El jefe de grupo" · "Nadie" · "La propia policía"].
**Bien:** → ["El Ministro del Interior" · "El Secretario de Estado de Seguridad" · "El Director General de la Policía" · "El Delegado del Gobierno"] — los cuatro son órganos reales del art. 13; solo se acierta sabiendo cuál.

## Flujo del módulo

`pregunta generada → Capa 1 (verificar-calidad) → si pasa, se carga con opciones barajadas` ·
`banco existente / lotes flojos → Capa 2 (reescritor de distractores) → Capa 1 → recarga`

La Capa 2 recibe: el artículo fuente literal + la opción correcta (intocable) + los distractores actuales, y devuelve 3 distractores *near-miss* que cumplen la rúbrica, sin tocar la correcta. Luego el resultado vuelve a pasar la Capa 1.
