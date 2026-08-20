# ¿Cuánto del examen real cubre el cerebro?

> Medición del 20/08/2026. Fuente: `datos/legal-es/pn-oficial-examenes-600.csv`, que
> **ya estaba en V2** — 600 preguntas de seis exámenes oficiales de Policía Nacional
> Escala Básica (37ª a 42ª promoción, 100 preguntas cada uno). No hubo que traer nada.
> Contrastadas contra los 3.238 conceptos del cerebro.

## Respuesta corta

Sobre una **muestra aleatoria de 30 preguntas clasificadas a mano** (semilla fija, 29
dentro del temario):

| | Preguntas | % |
|---|---|---|
| **Cubierto** — el concepto responde la pregunta | 13 | **45 %** |
| **Parcial** — está la materia, falta el dato concreto | 5 | 17 % |
| **No cubierto** | 11 | 38 % |

Con n=29 el intervalo de confianza del 95 % sobre ese 45 % es de unos **±18 puntos**.
La lectura honesta es «**entre un 27 % y un 63 % del examen real está cubierto**», con
otro 17 % a medias. Cualquier cifra más fina que eso sería inventada.

## Por qué no hay un número automático

Se intentó primero emparejar a máquina. Dos vías, las dos insuficientes:

1. **Por artículo citado.** `fuente_normativa` está relleno en las 600, pero solo el
   **17 %** trae un par norma+artículo extraíble. El resto es una nota descriptiva.
2. **Por solape léxico ponderado** (IDF) entre la pregunta y los conceptos de su tema.
   Da una distribución con mediana 0,21, pero **la puntuación no predice la cobertura**:

   - Solape 0,36 — pregunta sobre «la capa de red del modelo OSI», mejor
     emparejamiento «TCP/IP: capa de transporte». Emparejamiento equivocado, pero el
     concepto correcto (`OSI capa de red (capa 3)`) **sí existe** en el banco.
   - Solape 0,09 — caso práctico de torturas, emparejado con «Tortura: concepto».
     Puntuación baja y sin embargo **la pregunta se responde** con ese concepto.
   - Solape 0,18 — quórum del Comité contra la Tortura, emparejado con «El Comité
     contra la Tortura». Puntuación media y el dato concreto **no está**.

   Por eso la cifra sale de clasificar a mano, no del algoritmo.

## Lo que de verdad importa: el patrón de los fallos

Las once no cubiertas no son temas ausentes. Son **datos concretos dentro de normas
que YA tenemos ingeridas**:

| Pregunta oficial | Norma | ¿Tenemos la norma? |
|---|---|---|
| Quórum de dos tercios del Comité contra la Tortura | Convención, art. 17 | **sí** — tenemos 22 arts., incluido el 17, pero no ese apartado |
| Plazo máximo de supresión: 20 años | LO 7/2021 | **sí** — 22 artículos |
| Más de 250 funcionarios para… | LO 9/2015 | **sí** — 27 artículos |
| Plazo de recurso de la víctima: 15 días | Ley 4/2015 | **sí** — 22 artículos |
| Consolidación de grado personal: 2 años | EBEP | **sí** |
| Licencia F: entrega de armas en un año | Reglamento de Armas | **sí** |
| Comité de Expertos: cuatro y cuatro | LO 2/1986 | **sí** |
| Junta de Coordinación del Defensor del Pueblo: tres | Reglamento del DP | parcial |
| CEPOL: qué órgano ejerce de Unidad Nacional | RD estructura Interior | **sí** |
| Composición del TJUE | TUE/TFUE | no |
| Sede del Banco Central Europeo | — ninguna norma | no |

**Nueve de once son profundidad dentro de normas que ya están en el cerebro.** Solo
dos son materia genuinamente ausente.

Esto confirma desde el lado del examen lo que ya decía `docs/dimension-del-cerebro.md`
desde el lado del banco: **el problema no es la anchura, es la profundidad.** Tenemos
las normas; nos faltan los apartados que el tribunal pregunta.

## Consecuencia para el plan de trabajo

Deja de tener sentido preguntarse «¿qué norma falta?». La pregunta útil es «**¿qué
apartados de las normas que ya tenemos pregunta el tribunal y no hemos escrito?**».

Y hay una vía directa para responderla que no depende de heurísticas: **las 600
preguntas oficiales son, ellas mismas, el mapa de lo que hay que cubrir.** Cada una
apunta a un apartado concreto. Recorrerlas una a una y escribir el concepto que falta
es trabajo mecánico, verificable contra el corpus, y ataca justo el 38 %.

## Límites de esta medición

- **n=29.** El ±18 puntos es real. Para bajar a ±5 harían falta unas 350 preguntas
  clasificadas a mano.
- **La clasificación la hice yo**, no un tercero, y en cinco casos la frontera entre
  «parcial» y «cubierto» es discutible: un caso práctico que exige combinar dos
  conceptos, ¿está cubierto? Aquí se contó como parcial.
- **Seis exámenes** (2020-2025). El peso y el estilo pueden cambiar.
- **7 de las 600 están sin clasificar** por tema (tema 0) y una de ellas cayó en la
  muestra: era de contabilidad —cuentas anuales, libro mayor—, materia que no está en
  el temario de 45 temas. Conviene revisar esas siete.
