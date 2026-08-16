# Corpus del Código 600 — la copia que consultan los agentes

Texto **literal** de las normas del *Código Electrónico «Normativa para ingreso en la Policía Nacional, Escalas Básica y Ejecutiva»* (el BOE-600), extraído mecánicamente de los PDF oficiales.

**Para qué existe:** para que ningún agente tenga que abrir un PDF ni tirar de memoria. Si necesitas el texto de un artículo, está aquí. Es la fuente que consume el generador — regla de oro del Doc 006: *«el generador consume ESTE JSON, nunca el PDF»*.

Los PDF **no se versionan** (`.gitignore`: `datos/**/*.pdf`); estos JSON **sí**. Esa es la copia permanente.

## Cómo se consulta

`indice.json` lista qué normas hay, con su `referencia_boe`, su fecha de última modificación y cuántos artículos tiene cada una. Cada norma es `seccion-NNN.json`, donde `NNN` es su número de § en el Código:

```json
{
  "meta": { "seccion": 3, "titulo": "Constitución Española",
            "referencia_boe": "BOE-A-1978-31229",
            "ultima_modificacion": "20 de mayo de 2026" },
  "articulos": [ { "numero": 104, "ref": "104", "texto": "1. Las Fuerzas y Cuerpos de seguridad…" } ]
}
```

- **`ref`** es la cita canónica y es lo que debe usarse: `"104"`, `"31 bis"`, `"156 quinquies"`.
- **`numero`** es el número base como entero (el `31` de `31 bis`), para indexar.
- **`sufijo`** solo aparece cuando lo hay.

## Cómo se regenera

En el PC, con el Código recortado norma a norma:

```
python3 adaptadores/legal-es/ingestor.py <norma.pdf> <salida.json>
```

Cuando el Código llega en trozos de N páginas (varias normas por trozo, y la última partida por la mitad):

```
python3 adaptadores/legal-es/ingestor.py --codigo <trozo.pdf> <dir_acumulado>   # por cada trozo
python3 adaptadores/legal-es/ingestor.py --consolidar <dir_acumulado> <dir_json> # al final
python3 adaptadores/legal-es/ingestor.py --indice <este_directorio>              # refresca indice.json
```

**Solo se copian aquí las secciones completas.** El consolidador marca con `meta.posiblemente_incompleta` la última sección acumulada, que es la que estaba abierta cuando se acabó el último trozo: mientras queden trozos por pasar, su texto está cortado.

## Lo que NO trae

- **Las disposiciones** (adicionales, transitorias, derogatorias, finales) y los preámbulos: el ingestor corta en ellas. Quien necesite citarlas no las encontrará aquí.
- **Las normas cuyo trozo aún no se ha ingerido.** `indice.json` dice lo que hay; lo que no está en él, no está.
- El Código es una **recopilación con inclusiones parciales**: varios títulos llevan `[Inclusión parcial]` y no traen todos los artículos de la norma. El propio Código avisa de que «NO constituye la totalidad del contenido de los temarios». Que un artículo no esté aquí no significa que no exista: significa que el Código no lo incluye.

## Quién lo usa

`adaptadores/legal-es/generador/auditar-corpus.mjs` contrasta contra este corpus los cotejos de todos los lotes, para detectar citas truncadas, contaminación entre artículos y texto que no esté en la norma.
