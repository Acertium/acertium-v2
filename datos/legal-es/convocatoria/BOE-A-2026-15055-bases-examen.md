# Convocatoria BOE-A-2026-15055 — LA VIGENTE

> Resolución de **7 de julio de 2026**, de la Dirección General de la Policía, por la que se
> convoca oposición libre para cubrir plazas de alumnos/as de la Escuela Nacional de Policía,
> aspirantes a ingreso en la **Escala Básica, categoría de Policía, del Cuerpo Nacional de
> Policía**. BOE núm. 167, viernes 10 de julio de 2026, págs. 96257 y ss.
>
> PDF completo junto a este fichero: `BOE-A-2026-15055.pdf` (49 págs.).
> **Extracto verificado el 20/08/2026 leyendo el PDF, no de memoria.** Lo entrecomillado es
> cita literal; el resto es resumen. Ante cualquier duda, manda el PDF.
>
> Leídas: bases 1, 2, 5.3-5.6, **6.1 a 6.15 completas**, 7.1, 11 y 12, **Anexo I entero** y el
> arranque del Anexo II. No leídas: bases 3, 4, 5.1-5.2 (tribunales), 8-10, y los anexos II
> (resto), III a VI.

## Referencia resuelta

**El repo tenía razón desde el principio.** `temario-oficial.md` y `lib/simulacro-formato.ts`
citaban `BOE-A-2026-15055` y esa **es** la convocatoria vigente. `BOE-A-2025-16610` (31/07/2025)
es la **anterior**, y se conserva en esta carpeta para poder diffear entre convocatorias.

El aviso de discrepancia que estuvo puesto unas horas el 20/08/2026 queda **cerrado**: no había
tal, solo faltaba el PDF.

## Base 6.1.1 — Primera prueba (de conocimientos)

> «La prueba consistirá en la contestación por escrito en **cincuenta minutos** a un
> cuestionario de **cien preguntas**, con un enunciado y **tres alternativas** de respuestas de
> las que solo una es verdadera, **relacionadas con el temario que figura como anexo I** a la
> presente convocatoria.»

> «En la corrección se utilizará la fórmula: **[A–E/(n–1)]\*10/P** — «A» el número de aciertos,
> «E» el de errores, «n» el número de alternativas de respuesta y «P» el número total de
> preguntas.»

> «Se calificará de cero a diez puntos. Únicamente serán seleccionadas para continuar en el
> proceso las personas aspirantes que habiendo alcanzado la **puntuación mínima de 3 puntos**
> obtengan las mejores calificaciones, hasta llegar a **1'75 aspirantes por cada una** de las
> 2.163 plazas convocadas no reservadas para los militares profesionales de tropa y marinería.»

Con n = 3, la penalización es **E/2**: cada dos errores anulan un acierto. Las preguntas en
blanco ni puntúan ni penalizan (no entran en A ni en E).

**Nota de corte de la reserva:** la menor entre 5 puntos y la de la última persona declarada
apta en las plazas no reservadas.

## Lo que la convocatoria NO dice

Leídas las bases **6.1 a 6.15 completas**:

- **No hay reparto de preguntas por tema ni por bloque.** Solo «relacionadas con el temario que
  figura como anexo I». El peso de cada tema **no está fijado por el BOE**, así que inferirlo de
  exámenes anteriores —lo que hace `docs/anchura-y-profundidad.md`— no es un atajo: es la única
  vía que existe.
- **No se mencionan preguntas de reserva.** Cien preguntas, sin suplentes declarados.
- **No se fija fecha de referencia normativa**: a qué redacción de cada norma se examina.
  Nuestra política de caducidad (`docs/005 §9`) sigue siendo criterio propio, no exigencia.

## Anexo I — 45 temas en tres bloques

| Bloque | Temas | Nº |
|---|---|---|
| **A) Ciencias Jurídicas** | 1-26 | 26 |
| **B) Ciencias Sociales** | 27-37 | 11 |
| **C) Materias Técnico-Científicas** | 38-45 | 8 |

El bloque A es el que sale de normas BOE (corpus `boe-600-pn`). Los bloques B y C son, casi
enteros, las fuentes no-BOE del `docs/contrato-fuentes-no-boe.md`.

**Contrastado tema a tema contra `temario-oficial.md`: coincide.**

## Qué cambió respecto a la convocatoria anterior (2025-16610)

Comparados los dos PDF:

| | 2025-16610 | **2026-15055** |
|---|---|---|
| Fecha | 31/07/2025 (BOE 11/08/2025) | **07/07/2026 (BOE 10/07/2026)** |
| Plazas | 2.764 (553 reservadas · 2.211 libres) | **2.704 (541 · 2.163)** |
| Aspirantes que pasan por plaza | 2'25 | **1'75** |
| **Base 6.1.1 (formato del examen)** | 100 · 3 alt. · 50 min · [A−E/(n−1)]·10/P · mín. 3 | **idéntica** |
| **Anexo I (los 45 temas)** | 45 temas, 3 bloques | **idéntico** |
| Denominación | «de la Policía Nacional» | «del Cuerpo Nacional de Policía» |
| Plan de igualdad · oferta de empleo | III Plan · RD 342/2025 | IV Plan · RD 207/2026 |
| Sorteo (letra de orden) | «U» | «B» |
| Bases | 11 = Norma final | **11 = Portal del Aspirante · 12 = Norma final** |
| 6.1.3.a) | — | añade que el «no apto» médico exige motivar la intensidad de la causa |

### Las dos conclusiones que importan

1. **El temario NO cambió de una convocatoria a la siguiente, ni una coma.** Todo el cerebro
   construido sigue apuntando al sitio correcto, y el trabajo de cobertura no caduca al cambiar
   de convocatoria. Es la primera evidencia que tenemos de esa estabilidad — con n=2, así que no
   es una ley, pero sí un indicio fuerte.
2. **El corte se ha endurecido: de 2'25 a 1'75 aspirantes por plaza**, con menos plazas (2.704
   frente a 2.764). Pasar la primera prueba exige más nota que el año pasado, y eso empuja hacia
   la profundidad, no hacia la anchura: el opositor marginal ya no entra.

## Otras bases de interés

| Base | Contenido |
|---|---|
| 1.1 | 2.704 plazas; 541 reservadas a militares de tropa y marinería, 2.163 de oposición libre |
| 1.2 | Tres fases: oposición · curso de formación · módulo de formación práctica |
| 6.1.2 | Segunda prueba: aptitud física (anexo II), media aritmética, mínimo 5, un cero elimina |
| 6.1.3 | Tercera prueba: a) reconocimiento médico · b) entrevista (6 criterios, 1 punto cada uno) · c) test psicotécnicos (60 min, misma fórmula) |
| **6.2** | **Impugnación de preguntas: 2 días hábiles** desde la publicación, a secretariaprocesos.dfp@policia.es |
| 6.7 | Primera prueba en 14 sedes; primera prueba y psicotécnicos en acto único |
| 6.11 | Nota final = conocimientos + aptitud física. Desempate: conocimientos → físicas → 1.er ejercicio físico → psicotécnicos |
| 6.14 | Idiomas: hasta 2 puntos extra (B1 0,50 · B2 1 · C1 1,50 · C2 2) |
| 11 | Portal del Aspirante (www.policia.es/portalaspirantes/) como canal oficial |

La base **6.2** tiene lectura directa para nosotros: **el tribunal admite que sus preguntas
pueden estar mal y abre plazo para impugnarlas.** Es exactamente el riesgo que cubren las puertas
fail-closed del generador y la regla de que la opción correcta sea cita literal de la fuente.
