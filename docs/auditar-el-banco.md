# Auditar el banco entero

> 22/08/2026. Plan de Jonathan: «cuando tengamos afinadas todas las puertas,
> módulos y cerebro, pasamos todas las preguntas / definiciones / conceptos y
> grafos para saber que todo pasa OK y todo está estandarizado».
>
> Esto es cómo se hace, y sobre todo **cómo no**.

## La regla, antes que nada

Cuando una puerta se pasa sobre contenido **ya aceptado**, cada cosa que marca es
una de dos: **una pregunta mala, o una puerta mala**. Y no se distingue sin
leerla.

No es una precaución teórica. El 22/08/2026 se midió sobre el banco una
comprobación que parecía sólida —«ningún distractor puede ser cita literal del
cotejo»— y dio **16 marcadas, 16 falsos positivos, cero aciertos**. Prohibía
justo las mejores preguntas: las que enfrentan dos reglas del mismo artículo y
las separan con un ordinal («el tercero de los requisitos»), un superlativo, una
exclusión o el verbo. Se quitó la puerta, no las preguntas.

De ahí la regla de diseño de `auditar-banco.mjs`: **informa y no decide.** No
rechaza, no borra, no pasa nada a `pendiente_revision`. Si un fallo de puerta se
ejecutara solo sobre 3.434 preguntas, el daño sería retirar el temario del
runtime. La salida es una lista para leer.

## Las dos auditorías, y por qué hacen falta las dos

| | `auditar-corpus.mjs` | `auditar-banco.mjs` |
|---|---|---|
| Qué mira | los 110 lotes | lo que hay en el cerebro |
| Contra qué | el corpus | el corpus |
| Ve el bloque `fuentes` | sí → detecta elisiones (C) | no lo hay |
| Ve lo que no vino de un lote | **no** | sí |
| Cuándo | antes de cargar, como puerta | después, sobre lo servido |

**El punto ciego que obliga a la segunda.** Medido: **224 actividades del cerebro
no vienen de ningún lote.**

```
CE +105 · CP +48 · SC 32 · DISC +23 · FCS 16
```

SC y FCS no tienen lote siquiera. Las demás son cargas parciales, ampliaciones
posteriores (las 23 de DISC son de `profundidad/`, que no pasa por `lotes/`) o
ediciones hechas sobre la base. Es el **6,5 %** del banco, y son justo las que
menos control han tenido: para el auditor de lotes no existen.

Primera pasada real sobre FCS —16 preguntas que no había mirado nunca nada—:
**los 16 cotejos son literales del corpus.** Limpio.

## Cómo se corre

```bash
# con credenciales
node adaptadores/legal-es/generador/auditar-banco.mjs
node adaptadores/legal-es/generador/auditar-banco.mjs --familia FCS

# sin credenciales: volcado a fichero (el SQL está en la cabecera del script)
node adaptadores/legal-es/generador/auditar-banco.mjs --volcado banco.json
```

El volcado se deja como fichero a propósito: una tirada se puede repetir,
comparar con la anterior y correr donde no hay acceso a la base.

## Qué hizo falta para que esto fuera posible

La auditoría no llegaba al banco entero porque no había dónde cotejarlo: de las
3.440 parejas actividad↔fuente, solo el **81,8 %** tenía corpus. Se cerró
(`corpus-desde-lotes.mjs`, 452 epígrafes en 20 secciones) y ahora es el **100 %**.
Ver `datos/fuentes/README.md`.

Y el auditor de lotes tenía su propio agujero: un mapa familia→sección **escrito
a mano** que duplicaba `registro-materias.json` y se había quedado en 54 de 78
familias. Dejaba **756 cotejos «no auditables»** sin que la cifra alarmara a
nadie, porque salía en el informe como una categoría más. Resuelto contra el
registro y el índice: **756 → 140**, y los cotejos verificados de 2.440 a 3.052.

> Que algo no salga en los fallos no significa que esté bien. Puede significar
> que no se ha mirado. Por eso «no auditables» va en el informe con su cifra, y
> no escondido.

## Lo que encontró la primera pasada, ya triado

63 hallazgos de elisión (C) **no son 63 defectos iguales**. Leídos, se parten en
tres clases con responsables distintos:

| Caso | El lote dice | El corpus dice | Quién falla |
|---|---|---|---|
| PJ art. 21 | «a que **se** refiere» | «a que **ese** refiere» | **el corpus**: artefacto de ingesta |
| PJ art. 19 | «a **las** Unidades» | «a **la** Unidades» | nadie: errata del BOE que el lote corrigió |
| Asilo art. 8 y 11 | «…admitidas como refugiadas, **un delito grave**» | «…como refugiadas, **es decir, antes de la expedición de la autorización de residencia** basada en el reconocimiento de la condición de refugiado, un delito grave» | **el lote**: elisión real |
| Acogida art. 12 | «tendrán **los siguientes derechos**» | «tendrán **desde que accedan al sistema de acogida y durante el tiempo en que permanezcan en él**…» | **el lote**: elisión sustantiva |

Las dos últimas son las que importan: el `fuentes` presenta como literal un texto
que se salta una cláusula, y la de Acogida se salta **cuándo** se tienen esos
derechos. Aunque el `cotejo` de la pregunta no llegue a esa parte, cualquier
pregunta que se genere mañana desde ese `fuentes` heredaría el hueco.

El caso de PJ art. 21 **no se ha corregido a propósito**: tocar el corpus es
tocar una fuente, y la regla dice verificar contra el BOE, no contra la memoria
de nadie. Queda anotado para verificar con el texto oficial delante.

## Lo que una puerta no puede auditar

Jonathan nombró también definiciones y grafo. Ahí no llega:

- **Las explicaciones** solo tienen el control de `cifras` al escribirlas. Que una
  explicación sea *fiel* a su fuente no lo decide un `includes()`.
- **El grafo** se comprueba al cargar (los dos extremos existen, el tipo es
  válido, no hay autobucles ni duplicados) — y ahí está limpio: 3.784 relaciones,
  0 islas, 0 huérfanas. Pero nada dice si el tipo es *el correcto*, si
  «desarrolla» desarrolla de verdad.

Eso es muestreo y lectura humana, no puerta. Conviene tratarlo como trabajo
aparte y por muestra, y no colarlo en la pasada fingiendo que la pasada lo cubre.

## Lo que sigue pendiente

1. **Reingerir de verdad las 20 secciones marcadas `procedencia: "lote"`.** Hoy
   re-cotejar contra ellas no prueba nada: pasan por construcción. Hace falta el
   documento original en `datos/fuentes/<materia>/`.
2. **Triar los 63 (C) enteros**, no la muestra de arriba.
3. **Verificar «ese refiere» contra el BOE** y corregir el corpus si procede.
4. **Vigilante de frescura**: con texto y referencia en un sitio, diferenciar
   contra el BOE vivo para detectar reformas.
