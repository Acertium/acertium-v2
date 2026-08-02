# Acertium — Documento 002: Primer latido del Cerebro

> Prueba del pipeline completo sobre material real: **fuente oficial → segmentación en conceptos → actividades generadas → auto-verificación contra la fuente**.
> Rebanada elegida: **Constitución Española, Título Preliminar (arts. 1-9)**. Oposición: Policía Nacional. Fecha: 2026-08-01.

---

## 1. Fuente (de dónde sale, y por qué es limpio)

- **Norma:** Constitución Española. BOE-A-1978-31229. Título Preliminar, arts. 1 a 9.
- **Extraída de:** `BOE-600_...Policia_Nacional...pdf` (Código electrónico del BOE, edición 05/06/2026), §3.
- **Legalidad:** el **texto de la ley es público** (no tiene copyright). La licencia CC BY-NC-ND del BOE afecta a su *edición/compilación*, no al articulado. Generar preguntas del articulado = limpio. ✔

---

## 2. Esquema del concepto (el dato del Cerebro)

**Dos capas** (ver Doc 001 §3). El **concepto canónico** vive por materia y NO sabe a qué oposición pertenece; el **overlay de convocatoria** es quien lo asigna a un tema y un peso.

```
// CAPA 1 — concepto canónico (por materia; una sola vez)
concepto {
  id                 // p.ej. CE-TP-003
  materia            // constitucion-espanola  ← materia, NO oposición
  titulo             // etiqueta corta y buscable
  resumen            // 1-2 frases en llano
  fuentes []         // N:M — un concepto puede citar VARIOS artículos,
                     // y un artículo puede alimentar VARIOS conceptos.
                     //   cada fuente: { norma, articulo, referencia_boe }
  prerrequisitos     // [ids de conceptos previos] — aristas del grafo
  estado_verificacion // verificado | pendiente | rechazado
}

// CAPA 2 — overlay de convocatoria (por oposición; mapa ligero encima)
overlay_convocatoria {
  oposicion          // policia-nacional
  entradas [ {
    concepto_id      // CE-TP-003
    tema             // "Tema 1 — La Constitución"  ← el tema es de ESTA oposición
    peso             // importancia en el examen (para el planificador)
  } ]
}
```

Así, la Constitución se segmenta **una vez**; PN y GC son dos overlays que la referencian con temas y pesos distintos.

---

## 3. Segmentación auto-generada (Título Preliminar → 11 conceptos)

| id | título | resumen | fuente | prerreq. |
|----|--------|---------|--------|----------|
| CE-TP-001 | Estado social y democrático de Derecho + valores superiores | España es un Estado social y democrático de Derecho; valores superiores: libertad, justicia, igualdad y pluralismo político. | CE art. 1.1 | — |
| CE-TP-002 | Soberanía nacional | Reside en el pueblo español, del que emanan los poderes del Estado. | CE art. 1.2 | CE-TP-001 |
| CE-TP-003 | Forma política del Estado | Monarquía parlamentaria. | CE art. 1.3 | CE-TP-001 |
| CE-TP-004 | Unidad, autonomía y solidaridad | Unidad indisoluble de la Nación; derecho a la autonomía de nacionalidades y regiones; solidaridad entre ellas. | CE art. 2 | CE-TP-001 |
| CE-TP-005 | Lenguas de España | Castellano = lengua oficial del Estado (deber de conocerla, derecho a usarla); demás lenguas cooficiales en sus CCAA; patrimonio lingüístico protegido. | CE art. 3 | — |
| CE-TP-006 | Bandera | Tres franjas horizontales (roja-amarilla-roja), la amarilla de doble anchura; los Estatutos pueden reconocer banderas propias de CCAA. | CE art. 4 | — |
| CE-TP-007 | Capital del Estado | La villa de Madrid. | CE art. 5 | — |
| CE-TP-008 | Partidos políticos | Expresan el pluralismo; creación y actividad libres dentro de la Constitución y la ley; estructura y funcionamiento democráticos. | CE art. 6 | CE-TP-001 |
| CE-TP-009 | Sindicatos y asociaciones empresariales | Defienden intereses económicos y sociales propios; creación y actividad libres; estructura democrática. | CE art. 7 | CE-TP-008 |
| CE-TP-010 | Fuerzas Armadas | Ejército de Tierra, Armada y Ejército del Aire; misión: soberanía, independencia, integridad territorial y orden constitucional; una ley orgánica regula sus bases. | CE art. 8 | — |
| CE-TP-011 | Sujeción a la Constitución y principios del 9.3 | Ciudadanos y poderes públicos sujetos a la Constitución; promoción de la igualdad real; garantías del art. 9.3 (legalidad, jerarquía normativa, publicidad, irretroactividad, seguridad jurídica, responsabilidad, interdicción de la arbitrariedad). | CE art. 9 | CE-TP-001 |

---

## 4. Actividades generadas Y AUTO-VERIFICADAS

Cada actividad se coteja contra el texto literal del artículo antes de darse por válida. `estado_verificacion: verificado`.

**A1 · CE-TP-003 · tipo test**
> ¿Cuál es la forma política del Estado español según la Constitución?
> a) República parlamentaria · b) **Monarquía parlamentaria** · c) Monarquía constitucional · d) Estado autonómico
> **Correcta: b.** ✔ Verificado contra art. 1.3: *«La forma política del Estado español es la Monarquía parlamentaria.»*

**A2 · CE-TP-007 · respuesta corta**
> ¿Cuál es la capital del Estado según la Constitución?
> **Respuesta: la villa de Madrid.** ✔ Verificado contra art. 5: *«La capital del Estado es la villa de Madrid.»* (Ojo al matiz literal: «villa de Madrid», no «ciudad de Madrid».)

**A3 · CE-TP-001 · rellenar huecos**
> Los valores superiores del ordenamiento jurídico son la libertad, la justicia, la ______ y el ______.
> **Respuesta: igualdad / pluralismo político.** ✔ Verificado contra art. 1.1.

**A4 · CE-TP-010 · verdadero/falso con justificación**
> «Las Fuerzas Armadas están constituidas por el Ejército de Tierra, la Armada y el Ejército del Aire.»
> **Verdadero.** ✔ Verificado contra art. 8.1.

---

## 5. El foso en acción: una actividad RECHAZADA

Ejemplo de pregunta que el generador propuso y la **auto-verificación tumbó** (así se evita mostrar errores al usuario):

> ✗ *«Según el art. 5, la capital del Estado es la ciudad de Madrid, sede del Gobierno y las Cortes.»*
> **RECHAZADA.** El art. 5 dice literalmente «la **villa** de Madrid» y NO menciona «sede del Gobierno y las Cortes» (eso es un añadido inventado). `estado_verificacion: rechazado` → no se sirve; se re-genera o se descarta.

Esto es exactamente el mecanismo que hace fiable a Acertium: nada llega al usuario sin coincidir con la fuente oficial.

---

## 6. Qué prueba este latido

- El pipeline funciona de punta a punta sobre **material real** (una norma del Código 600).
- La **segmentación** convierte texto legal en conceptos manejables con trazabilidad a su artículo.
- La **generación** produce actividades variadas por concepto (test, respuesta corta, huecos, V/F).
- La **auto-verificación** contra el texto literal acepta lo correcto y **rechaza lo inventado** — sin autoría manual, pero con corrección.

## 7. Siguiente paso

Sobre esto se monta lo demás: (a) el **modelo de dominio por usuario** (qué conceptos domina), (b) el **bucle de repaso** que prioriza los flojos, (c) el **panel** de absorción. Y se escala tema a tema. Falta tu **lista de temas de la convocatoria** para mapear el temario completo a estas normas del Código 600.
