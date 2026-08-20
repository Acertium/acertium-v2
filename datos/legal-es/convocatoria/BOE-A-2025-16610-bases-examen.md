# Convocatoria BOE-A-2025-16610 — ANTERIOR (referencia para diffs)

> Resolución de 31 de julio de 2025, de la Dirección General de la Policía, por la que se
> convoca oposición libre para cubrir plazas de alumnos/as de la Escuela Nacional de
> Policía, aspirantes a ingreso en la **Escala Básica, categoría de Policía**.
> BOE núm. 192, lunes 11 de agosto de 2025, págs. 108490-108536.
>
> PDF completo junto a este fichero: `BOE-A-2025-16610.pdf` (47 págs.).
> **Extracto verificado el 20/08/2026 leyendo el PDF, no de memoria.** Lo entrecomillado
> es cita literal; el resto es resumen. Ante cualquier duda, manda el PDF.

## Por qué está esto en el repo

Todo el proyecto se apoya en dos cosas de este documento —los 45 temas y el formato de la
prueba— y hasta hoy ninguna estaba versionada: `temario-oficial.md` citaba un PDF ausente
y `lib/simulacro-formato.ts` traía las constantes sin fuente comprobable. Este fichero deja
el texto **citable, greppable y diffable** entre convocatorias sin abrir el PDF.

## Convocatoria ANTERIOR — resuelto el 20/08/2026

Este documento **no es el vigente**. Es la convocatoria de 2025; la que rige hoy es
**BOE-A-2026-15055** (07/07/2026), cuyo PDF y extracto están al lado. El aviso de
discrepancia que estuvo puesto unas horas —el repo citaba 2026-15055 y solo teníamos este
PDF— **queda cerrado: el repo tenía razón, solo faltaba el documento.**

Se conserva porque permite lo que ninguna otra fuente permite: **diffear dos convocatorias**.
De ahí sale la comprobación de que el temario no cambió ni una coma entre una y otra. La
comparación está en `BOE-A-2026-15055-bases-examen.md`.

## Base 6.1.1 — Primera prueba (de conocimientos)

> «La prueba consistirá en la contestación por escrito en **cincuenta minutos** a un
> cuestionario de **cien preguntas**, con un enunciado y **tres alternativas** de respuestas
> de las que solo una es verdadera, **relacionadas con el temario que figura como anexo I**
> a la presente convocatoria.»

> «En la corrección se utilizará la fórmula: **[A–E/(n–1)]\*10/P**, siendo «A» el número de
> aciertos, «E» el de errores, «n» el número de alternativas de respuesta y «P» el número
> total de preguntas.»

> «Se calificará de cero a diez puntos. Únicamente serán seleccionadas para continuar en el
> proceso las personas aspirantes que habiendo alcanzado la **puntuación mínima de 3 puntos**
> obtengan las mejores calificaciones, hasta llegar a **2'25 aspirantes por cada una** de las
> 2.211 plazas convocadas no reservadas para los militares profesionales de tropa y
> marinería.»

Con n = 3, la penalización es **E/2**: cada dos errores anulan un acierto. Las preguntas en
blanco ni puntúan ni penalizan (no entran en A ni en E).

**Nota de corte de la reserva** (base 6.1.1, último párrafo): la menor entre 5 puntos y la
de la última persona declarada apta en las plazas no reservadas.

### Lo que la convocatoria NO dice

Se han leído las bases **6.1 a 6.15 completas**. En ellas:

- **No hay reparto de preguntas por tema ni por bloque.** Solo «relacionadas con el temario
  que figura como anexo I». El peso de cada tema **no está fijado**: hay que inferirlo de
  exámenes anteriores, que es lo que hace `docs/anchura-y-profundidad.md`.
- **No se mencionan preguntas de reserva.** Cien preguntas, sin suplentes declarados.
- **No se fija fecha de referencia normativa** (a qué redacción de cada norma se examina).

## Estructura del Anexo I: tres bloques, 45 temas

Esto **no estaba recogido en `temario-oficial.md`**, que listaba los 45 temas en plano:

| Bloque | Temas | Nº |
|---|---|---|
| **A) Ciencias Jurídicas** | 1-26 | 26 |
| **B) Ciencias Sociales** | 27-37 | 11 |
| **C) Materias Técnico-Científicas** | 38-45 | 8 |

El corte de bloque explica de golpe una asimetría que veníamos midiendo: los temas 27-41,
los que no salen de ninguna norma BOE, son justo el bloque B entero más el arranque del C.

Contrastado el texto de los 45 temas contra `temario-oficial.md`: **coinciden**.

## Otras bases de interés

| Base | Contenido |
|---|---|
| 1.1 | 2.764 plazas; 553 reservadas a militares de tropa y marinería, 2.211 de oposición libre |
| 1.2 | Tres fases: oposición · curso de formación · módulo de formación práctica |
| 6.1.2 | Segunda prueba: aptitud física (anexo II), media aritmética, mínimo 5, un cero elimina |
| 6.1.3 | Tercera prueba: a) reconocimiento médico · b) entrevista · c) test psicotécnicos (60 min, misma fórmula de corrección) |
| **6.2** | **Impugnación de preguntas: 2 días hábiles** desde la publicación, a secretariaprocesos.dfp@policia.es |
| 6.11 | Nota final de oposición = conocimientos + aptitud física. Desempate: conocimientos → físicas → 1.er ejercicio físico → psicotécnicos |
| 6.14 | Idiomas: hasta 2 puntos extra (B1 0,50 · B2 1 · C1 1,50 · C2 2) |

La base 6.2 tiene lectura directa para nosotros: **el tribunal admite que sus preguntas
pueden estar mal y abre plazo para impugnarlas.** Es exactamente el riesgo que cubren las
puertas fail-closed del generador y la regla de que la opción correcta sea cita literal.
