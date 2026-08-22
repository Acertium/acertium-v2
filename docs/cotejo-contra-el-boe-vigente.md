# ¿Sigue estando en la ley lo que le enseñamos al opositor?

> 23/08/2026. La pregunta que hasta hoy no se podía hacer, porque no había BOE.

## Por qué esta comprobación no es ninguna de las que ya había

| comprueba | contra qué |
|---|---|
| `verificar-lote` / `verificador-cotejo` | que la opción correcta es cita literal **del corpus** |
| `comprobar-normas` | que **el corpus** coincide con el BOE |
| **`cotejar-contra-boe`** | que **la frase que servimos** está, hoy, en el texto **en vigor** del BOE |

Las dos primeras pueden pasar y la tercera fallar. Si el corpus se capturó mal,
el cotejo cuadra contra un texto que no es el de la ley. Y eso no era hipotético:
el 22/08 se midió que **20 de las 78 secciones del corpus se habían reconstruido
desde los propios lotes** —el lote confirmándose a sí mismo— y `auditar-corpus`
contaba esos **610 cotejos** como «literales OK».

Esto no se puede engañar así. El texto viene de boe.es en el momento, y se elige
la versión **en vigor**, no la última publicada.

## El resultado

```
3.210 actividades con cotejo · 2.367 cotejables contra el BOE vigente

  literal en el BOE de hoy        : 2.356
  literal salvo el punto de cierre:     7
  literal salvo la viñeta de lista:     1
  corrige una errata del BOE      :     3
  NO ENCONTRADO                   :     0
```

**Ni un solo cotejo dice algo que no esté en la ley.** Y las 11 excepciones están
nombradas una a una, no barridas debajo de la alfombra:

- **7 cierran la cita con un punto que la ley no tiene**, porque la frase sigue:
  «…presidido por el Director del CNPIC.» cuando el artículo dice «…del CNPIC, y
  estará compuesto por:». No es error de contenido, pero se cuenta aparte:
  «literal» tiene que querer decir literal.
- **1 se salta la viñeta** con que la ley abre un ítem de lista (art. 3 LPRL
  enumera «de: -Policía, seguridad y resguardo aduanero»).
- **3 corrigen una errata del propio BOE.** Ver abajo.

## Las tres erratas del BOE, y por qué no se «arreglan»

Nuestro texto es mejor español que el oficial en tres sitios, y **hasta hoy lo era
en silencio**:

| norma | el BOE dice | nosotros |
|---|---|---|
| RD 769/1987, art. 19 | «a **la** Unidades de la Policía Judicial» | «a **las** Unidades» |
| RD 203/1995, art. 5 | «en particular**.** del derecho» | «en particular del derecho» |
| RD 203/1995, art. 18 | «Ley 5/1984**;** reguladora» | «Ley 5/1984, reguladora» |

Suena a mejora y es un problema: **el examen se redacta desde el BOE**, no desde
nuestra corrección. Por eso van en `ERRATAS_BOE`, con nombre y apellidos, y no se
normalizan a ciegas. Añadir una entrada exige haber ido al consolidado y haberlo
visto.

## Lo que arregló el camino hasta el cero

La primera pasada dio **14 no encontrados**. Ninguno era una discrepancia legal:

1. **Indicador ordinal contra signo de grado.** El BOE escribe «artículo 5.**°**»
   con el signo de grado (U+00B0) donde nosotros ponemos el ordinal (U+00BA). Se
   dibujan igual y nadie los distingue. → `normalizarParaComparar`.
2. **Espacio delante de punto y coma en NUESTRO texto.** «de repetición **;** y
   revólveres». Dos cotejos, una opción y una explicación, arreglados en los lotes
   y en la base.
3. **Artículos con letra final.** «Artículo 588 bis a». La LECrim numera así todo
   el capítulo de interceptación de comunicaciones y registro de dispositivos, que
   es materia de examen: **69 preceptos, 51 cotejos nuestros**, y el extractor no
   los reconocía.
4. **Cinco lotes sin `meta`.** `ce-t8`, `ce-t9`, `ce-t10`, `ce-disp` y
   `ley-5-2014` son anteriores a la puerta de metadatos y no declaran su norma:
   **88 cotejos** quedaban fuera del alcance por una carencia de fichero, no de
   contenido. Ahora la referencia se resuelve del registro por familia.

Los puntos 3 y 4 no arreglaron ningún fallo: **ampliaron la cobertura** de 2.243
a 2.367 cotejos comprobables. Que es la mitad del valor de este ejercicio.

## Un fallo mío que conviene no repetir

Al llevar la limpieza de «espacio ante signo» del corpus a los lotes, la regla que
cierra el guion de partición —«contencioso- administrativo» → «contencioso-administrativo»—
se encontró con esto, una opción del banco de ortografía:

> «las palabras que empiezan por **jen- o** terminan en -jero»

Ahí el guion marca un morfema citado, no una palabra partida. Unirlo daba
«jen-o» y **destruía la pregunta**. Y al buscar más apareció que la pasada
anterior ya había estropeado una entrada del DLE en el corpus: «De xeno- y
-fobia» había quedado como «De xeno-y -fobia». Reparado.

La lección está en el código: `cerrarGuionDeParticion` se separó de
`quitarEspacioAnteSigno` y **solo se aplica al texto de artículo del corpus**,
donde las 41 apariciones se miraron una a una. En texto libre la regla no vale, y
hay tres autopruebas que lo fijan — incluida la del DLE, con la nota de que fue un
destrozo real.

## Qué queda fuera, y por qué

**843 cotejos (26 %)** no tienen contra qué comprobarse aquí:

- **592** son de fuentes que no son BOE: manuales de la DGT, doctrina del CNI,
  Ortografía y Gramática de la RAE, glosarios de INCIBE y la OIM, la Declaración
  Universal, la Agenda 2030… más los cuatro tratados que el BOE publica pero no
  consolida. Su verificación es la del `contrato-fuentes-no-boe.md`, no esta.
- **251** apuntan a **anexos y disposiciones**, que el consolidado no organiza
  como artículos: los anexos de la Orden INT/2573/2015, las ITC del Reglamento de
  Armas, el Anexo XI del Reglamento de Vehículos.

Ese 26 % es el techo real de esta comprobación, y decirlo importa tanto como el
cero: **cotejable no es lo mismo que verificado**.

## Cómo se corre

```
npm run cotejar:boe              # descarga y comprueba
npm run cotejar:boe -- --cache <dir> --fecha 2026-08-22
```

No es una puerta: es un inventario, y siempre sale con código 0.
