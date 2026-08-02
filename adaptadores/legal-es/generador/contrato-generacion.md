# Contrato de generación — dominio legal-es

Reglas que sigue el **motor de generación** (opción A: el agente; opción B: la API de Claude) para convertir el texto de un artículo en contenido del cerebro. La salida es un JSON que **debe pasar** `nucleo/verificar-lote.mjs` antes de cargarse.

## Entrada
El texto **literal** de uno o varios artículos + sus metadatos (norma, referencia BOE, convocatoria, tema).

## Salida (JSON)
```json
{
  "fuentes": { "art. 66": "<texto literal íntegro del artículo>" },
  "conceptos": [
    { "id": "CE-T3-001", "articulo": "art. 66",
      "titulo": "…", "resumen": "…(1-2 frases, llano, fiel)…",
      "explicacion": "…(pedagógica, en llano, fiel a la fuente)…" }
  ],
  "actividades": [
    { "concepto_id": "CE-T3-001", "articulo": "art. 66", "tipo": "test",
      "enunciado": "…", "opciones": ["…","…","…","…"], "indice_correcto": 1,
      "cotejo": "<cita LITERAL del artículo que sostiene la respuesta>",
      "justificacion": "Art. 66.1 CE." }
  ],
  "relaciones": [
    { "origen": "FCS-011-mis", "destino": "CE-T4-014", "tipo": "desarrolla",
      "justificacion": "La LO 2/1986 desarrolla el art. 104 CE." }
  ]
}
```
`relaciones` es OBLIGATORIO (ver regla 0-bis): enlaza los conceptos del lote entre sí y con los ya existentes. `origen`/`destino` son ids de concepto (del lote o de la base); `tipo` ∈ {prerrequisito, desarrolla, limita, remite}. `cargar.mjs` emite los INSERT en `acertium_v2.relacion_concepto`.

## Regla de cobertura (innegociable)
0. **Se cubre TODO el temario, sin filtrar por frecuencia de examen.** El motor genera conceptos de los 45 temas de la convocatoria y, dentro de cada norma, de todos los artículos/apartados con contenido testable — no solo de los más preguntados. La frecuencia histórica (p. ej. el CSV de exámenes) decide únicamente el ORDEN en que se abordan, nunca qué se deja fuera. Regla de Jonathan (02/08/2026): "no dejes temas o conceptos sin tocar porque no sean de los más preguntados; nunca se sabe qué pueden preguntar". Un artículo se considera "hecho" solo cuando se han extraído todas sus ideas testables; los apartados que queden fuera de una tanda se anotan como pendientes y se completan después.

## Regla de interconexión (innegociable)
0-bis. **Generar un concepto incluye generar sus interconexiones.** El cerebro es una red neuronal: cada lote lleva un array `relaciones` que enlaza los conceptos nuevos entre sí Y con los ya existentes en la base, mediante el grafo tipado `relacion_concepto`. **Ningún concepto se carga como isla.** Los enlaces cruzan dominios (p. ej. la LO 2/1986 *desarrolla* el art. 104 CE; la LO 4/2015 *remite* al art. 5 LO 2/1986; el asesinato *desarrolla* el homicidio). Una barrera verifica que ambos extremos existen (en el lote o en la base), que el `tipo` es válido y que no hay auto-bucles ni duplicados; lo que no pasa, se rechaza. Regla de Jonathan (02/08/2026): "todo se tiene que interconectar como una red neuronal". Tipos: **prerrequisito** (hay que dominar A para B), **desarrolla** (A concreta/expande B), **limita** (A restringe o excepciona B), **remite** (A se remite a B).

## Reglas de grounding (innegociables)
1. **El `cotejo` es texto literal** del artículo (copiado, no parafraseado).
2. **La opción correcta debe aparecer literal en el `cotejo`** (admite número↔letra: "72"="setenta y dos"). → por eso las opciones correctas se redactan con las palabras del artículo.
3. **Nada fuera del texto.** Ni cifras, ni fechas, ni nombres que no estén en la fuente. (La `explicacion` puede añadir contexto pedagógico, pero si mete una cifra ajena, la puerta la marca con un aviso para revisión.)
4. **4 opciones, exactamente una correcta**, todas plausibles y no vacías.
5. **Granularidad**: una idea = un concepto (Doc 005 §3). Partir artículos con ideas testables distintas.
6. **IDs**: `{NORMA}-{SECCIÓN}-{NNN}` (Doc 005 §6). Constitución: `CE-TP`, `CE-T1`…`CE-T10`, `CE-DA/DT/DD/DF`.

## Qué NO hace el motor
No decide si algo es correcto: eso lo hace la **puerta determinista** (`verificar-lote`). El motor propone; la puerta dispone. Lo que no pasa se rechaza y se regenera.

## Flujo
`artículo → (motor genera JSON) → verificar-lote → cargar (SQL) → acertium_v2`
Ver `generar.mjs`. La opción B (API) sustituye solo el paso "motor genera JSON"; el resto es idéntico.
