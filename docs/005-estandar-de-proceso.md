# Acertium — Documento 005: Estándar de proceso (carriles y barreras)

> Un solo camino, siempre igual. Toda materia que entra al cerebro recorre los mismos **carriles** y pasa por las mismas **barreras**. Si algo no pasa una barrera, no avanza. Sin excepciones.
> Fecha: 2026-08-01 · Estado: norma viva del pipeline.

El objetivo es que el funcionamiento sea **idéntico** para la Constitución, para la Ley 40/2015 o para cualquier oposición futura: mismo orden, mismas reglas, mismas comprobaciones. Así se escala sin que la calidad se degrade.

**Costura núcleo/adaptador (norte de plataforma — Doc 006).** Cada carril y cada pieza se clasifica: **núcleo agnóstico** (vale para cualquier corpus) o **adaptador por dominio** (propio de cómo entra o se cita ese corpus). Los carriles 2, 4-fondo, 5-verificación, 6, 7-motor son núcleo; el carril 1 (ingesta), la gramática de citas del carril 4 y el modelo de frescura son adaptadores. **Regla:** nada específico de un dominio entra en el núcleo. Test antes de escribir una pieza: *¿esto vale igual para una ley, un libro de mates y un manual de empresa?* Si no, va a un adaptador.

---

## 1. Los carriles (el pipeline fijo)

Toda materia recorre estos 8 pasos **en orden**. La salida de cada paso es la entrada del siguiente.

| # | Carril | Entrada | Salida | Herramienta |
|---|--------|---------|--------|-------------|
| 1 | **Fuente oficial** | Norma en BOE / código oficial | PDF recortado + `datos/<dominio>/<norma>/<norma>-articulos.json` (texto literal + referencia BOE + fecha) | `pdftotext`, parser |
| 2 | **Segmentación** | JSON de artículos | Conceptos canónicos (idea = concepto) | criterio §3 |
| 3 | **Grounding N:M** | Conceptos + artículos | `concepto_fuente` (concepto↔artículo, muchos-a-muchos) | SQL |
| 4 | **Grafo** | Conceptos + texto | `relacion_concepto` (tipada) + `remision_pendiente` | extractor de remisiones + curado |
| 5 | **Generación** | Conceptos + texto literal | Actividades (test, huecos, V/F, corta…) | generador |
| 6 | **Auto-verificación** | Actividad + cotejo literal | Actividad `verificado` / `rechazado` | `verificador-cotejo.mjs` |
| 7 | **Carga** | Todo lo anterior | Filas en schema `acertium_v2` | SQL |
| 8 | **Overlay** | Conceptos + convocatoria | `overlay_entrada` (tema + peso por oposición) | SQL |

**Regla de dirección:** no se salta ni se adelanta un carril. No se generan actividades (5) de un concepto que no está grounded (3). No se carga (7) nada que no haya pasado verificación (6).

---

## 2. Las barreras (gates — nada pasa sin cumplirlas)

Se ejecutan al final de cada carga con `infra/barreras.sql` (integridad) y `nucleo/verificador-cotejo.mjs` (contenido). **Si una barrera falla, la carga no se da por buena.**

| ID | Barrera | Qué exige | Dónde |
|----|---------|-----------|-------|
| **G1 — Fuente oficial** | Todo dato normativo tiene `norma` + `articulo` + `referencia_boe`. Prohibido blog/banco comercial como fuente. | `concepto_fuente.referencia_boe` no nulo | SQL |
| **G2 — Sin huérfanos** | 0 conceptos sin fuente · 0 aristas a conceptos inexistentes · 0 overlay sin concepto | joins | SQL |
| **G3 — Cobertura** | Cada apartado con idea propia tiene concepto, o se justifica como "grueso deliberado" (principios rectores) | auditoría §5 | SQL + revisión |
| **G4 — Verificación de contenido** | Ninguna actividad `verificado` de tipo test/corta/huecos sin pasar el cotejo. V/F → revisión humana explícita | `verificador-cotejo.mjs` | JS |
| **G5 — Nomenclatura** | IDs siguen la convención (§6). `materia`, `estado_verificacion` con valores del catálogo | regex | SQL |
| **G6 — Sin duplicados** | Sin conceptos duplicados (mismo título+materia) ni auto-referencias en el grafo (`concepto_id = requiere_id`) | SQL |
| **G7 — Fecha y caducidad** | La materia lleva `ultima_modificacion` de la fuente; se re-verifica si la norma cambia en BOE | metadato | revisión |

**V/F es un caso especial:** no se puede auto-verificar por cotejo literal (una afirmación falsa no aparece en la fuente). Regla: las V/F se generan **desde el texto** (verdadero = paráfrasis literal; falso = negación controlada de un dato literal) y se marcan para revisión humana ligera. Nunca se dan por `verificado` automáticamente.

---

## 3. Estándar de segmentación (carril 2)

- **La unidad es la idea, no el artículo ni el apartado.** Un artículo puede dar varios conceptos; un concepto puede abarcar varios artículos (N:M).
- **Parte un artículo** cuando sus apartados contienen ideas testables distintas (ej.: art. 22 → asociación / ilegales / secretas y paramilitares / disolución judicial / inscripción).
- **No partas** cuando los apartados son facetas de una misma idea programática (principios rectores, Cap. III CE): un concepto por artículo es correcto.
- **Grano de examen:** en la parte que "cae" (derechos fundamentales), afina; en lo programático, agrupa.

## 4. Estándar de contenido

- **`resumen`**: 1-2 frases, lenguaje llano (nivel 2.º ESO), **fiel al texto literal**, sin inventar ni extrapolar. Voz directa.
- **`titulo`**: etiqueta corta, buscable, en minúscula (sentence case), sin punto final.
- **Actividad**: `cotejo_fuente` = texto literal del artículo del que sale. Nada se sirve sin cotejo. La `justificacion` es **opcional y no cita**: solo existe cuando hay algo que enseñar sobre esa pregunta (23/08/2026 — ver `docs/las-dos-explicaciones.md`).
- **Cifras y plazos**: se escriben tal como los expresa la norma; el verificador normaliza número↔letra para el cotejo.

## 5. Auditoría de cobertura (barrera G3)

Antes de cerrar una materia se cruza la lista de apartados del JSON con `concepto_fuente`. Resultado esperado: cada apartado con idea propia tiene concepto, o figura en la lista de "gruesos deliberados" con su justificación. La granularidad es una **decisión registrada**, no un descuido.

## 6. Convenciones de nomenclatura

- **Concepto id**: `{NORMA}-{SECCIÓN}-{NNN}`.
  - Constitución: `CE-TP` (Título Preliminar), `CE-T1`…`CE-T10` (Títulos I-X), `CE-DA` (disp. adicionales), `CE-DT` (transitorias), `CE-DD` (derogatoria), `CE-DF` (final). Ej.: `CE-T1-018`.
  - Otras normas: siglas de la norma + sección. Ej.: `L40-` (Ley 40/2015).
- **`materia`**: slug canónico por materia, **no por oposición** (`constitucion-espanola`). Nunca el nombre de la convocatoria.
- **`articulo`** en `concepto_fuente`: formato `art. N` o `art. N.M` (apartado). Con `referencia_boe` obligatoria.
- **`estado_verificacion`**: `verificado` | `pendiente` | `rechazado`.
- **`convocatoria` id**: `{oposicion}-{año}` (ej.: `policia-nacional-2026`).

## 7. Herramientas del pipeline (`nucleo/` (agnóstico) e `infra/`)

- `nucleo/verificador-cotejo.mjs` — barrera G4 (contenido): normaliza número↔letra y comprueba que la respuesta esté sostenida por el cotejo.
- `infra/barreras.sql` — barreras G1, G2, G5, G6 (integridad): se ejecuta contra `acertium_v2` y devuelve pasa/falla por barrera.
- `datos/<dominio>/<norma>/<norma>-articulos.json` — fuente canónica de cotejo por materia.

## 8. Definición de "hecho" (definition of done por materia/sección)

Una sección está **hecha** cuando, y solo cuando:
1. Existe su JSON de artículos verificado contra la fuente (carril 1).
2. Todos sus conceptos están cargados, con fuente N:M y sin huérfanos (G1, G2).
3. La auditoría de cobertura pasa o registra sus "gruesos deliberados" (G3).
4. Sus actividades pasan la verificación de contenido (G4).
5. `barreras.sql` devuelve **todo verde** (G1, G2, G5, G6).
6. Está mapeada al overlay de al menos una convocatoria (carril 8).

Mientras una sección no cumpla los 6 puntos, **no se considera terminada** aunque "parezca" completa.

---

## 9. Frescura y volatilidad (el BOE está vivo)

El cerebro tiene que estar **siempre actualizado**. Para eso, cada norma se registra con su propensión a cambiar.

**Registro `norma`**: `nombre`, `referencia_boe`, `url_boe`, `ultima_modificacion` (del texto consolidado oficial), `volatilidad`, `cadencia_revision`, `last_verified`.

**Taxonomía de volatilidad y cadencia:**

| Nivel | Qué es | Ejemplos | Cadencia |
|-------|--------|----------|----------|
| `estable` | texto casi inmutable | Constitución, códigos estructurales | anual |
| `media` | leyes orgánicas reformadas de vez en cuando | LO 2/1986 (FCSE), Extranjería, Seguridad Ciudadana | trimestral |
| `volatil` | cifras que cambian por presupuestos/órdenes | SMI, IPREM, cuantías, tramos | mensual / por evento |

**Grupo fino (`articulo_reforma`)**: aunque una norma sea `estable`, artículos concretos se reforman (ej.: CE art. 49 en 2024, art. 13.2 en 1992). Se registran para vigilarlos de cerca aunque el resto de la norma no cambie.

**Barrera G7**: toda norma citada por un concepto está en el registro, con `volatilidad` y `last_verified`. Un dato caduca según la cadencia de su norma (como la política de caducidad de Dependencia Fácil).

**Carril futuro — agente vigilante (no ejecutar aún):** un agente programado revisa el BOE y los boletines, priorizando por volatilidad (lo `volatil` a diario, lo `estable` de tarde en tarde). Cuando detecta una modificación de una norma/artículo registrado, marca los conceptos afectados (vía `concepto_fuente`) como `pendiente` de re-verificación y avisa; el mismo mecanismo vigila las **convocatorias de oposiciones** (un cambio de temario reescribe el overlay, no el conocimiento canónico). Es la automatización de la disciplina de caducidad, no una vía para saltarse la verificación: lo que el agente marca, un humano (o el pipeline) lo re-verifica contra la fuente antes de volver a `verificado`.
