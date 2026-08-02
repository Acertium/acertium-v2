# Acertium — Documento 001: Visión de producto y el Cerebro

> El documento fundacional del producto. Corto a propósito. Si algo no acerca a que un estudiante aprenda mejor, no entra aquí.
> Fecha: 2026-08-01 · Estado: vivo (v1).

---

## 1. Qué es Acertium (en una frase)

Un **profesor particular con IA** que acompaña al estudiante desde el primer día hasta el examen: entiende el temario, sabe qué domina y qué no cada persona, y le hace practicar exactamente lo que necesita, midiendo su progreso real.

No es un banco de preguntas. Las preguntas son solo **una** de las cosas que hace.

**El destino (estrella polar):** un **profesor interactivo** que guía toda la formación, al que el usuario le puede **preguntar dudas** y pedir **clases de repaso**, y que responde **siempre desde el cerebro verificado** — con la fuente y la fecha a la vista, admitiendo lo que aún no sabe en vez de inventárselo. Todo lo que se construye (cerebro, verificación, grafo, frescura, motor de absorción) existe para hacer posible ese profesor y que sea **de fiar**. Un tutor que alucina, en YMYL, no vale; el nuestro solo habla de lo que puede citar.

---

## 2. Qué vive el usuario (el producto, no la tecnología)

1. Elige (o sube) su **convocatoria / temario**.
2. Acertium ya tiene ese **conocimiento segmentado en conceptos** (o lo procesa).
3. El usuario **practica**: actividades variadas centradas en los conceptos que aún no domina.
4. Acertium mide su **absorción del conocimiento** concepto a concepto.
5. Le muestra **estadísticas + una guía viva**: "vas bien en X, te cuesta inmigración, hoy toca repasar la norma 14.5".

El estudiante nunca ve la maquinaria. Ve un tutor que sabe dónde falla y le dirige.

---

## 3. El Cerebro (el corazón del producto)

La unidad atómica **no es la pregunta: es el concepto** (un tema, una norma como la 14.5, una idea). Todo gira alrededor del conocimiento, no del ejercicio.

La relación concepto↔fuente es **muchos-a-muchos** (la "red neuronal"): **un artículo puede contener varios conceptos, y un concepto puede abarcar varios artículos.** El concepto no es un trozo de texto: es una idea que se apoya en una o más fuentes. A esto se suman las conexiones concepto↔concepto (prerrequisitos y relaciones), que forman el grafo.

**Dos capas de datos, a propósito separadas:**

- **Base canónica (por MATERIA, no por convocatoria).** El conocimiento existe una sola vez: "la Constitución", "la Ley 40/2015". Un concepto canónico NO sabe a qué oposición pertenece. Esto evita duplicar el mismo saber por cada oposición y es lo que permite que absorber una norma sirva para muchas convocatorias.
- **Overlay de convocatoria (por OPOSICIÓN).** Cada convocatoria es un mapa ligero encima de la base: dice qué conceptos entran, en qué tema de ESA oposición caen y con qué peso. La Constitución puede ser el tema 1 en Policía Nacional y el tema 5 en Guardia Civil — mismo concepto canónico, dos overlays distintos.

El **dominio del usuario se mide sobre el concepto canónico**, no sobre el tema de una convocatoria. Así, si alguien ya estudió la Constitución para PN y luego se presenta a GC, su absorción ya cuenta.

```
Base canónica de conceptos  (conocimiento por materia: conceptos + relaciones + fuente oficial)
        │
        ├──◄  Overlay de convocatoria  (qué conceptos entran, en qué tema y con qué peso, por oposición)
        │
        ▼
Modelo de dominio por usuario  (qué domina / qué no, POR CONCEPTO CANÓNICO — "knowledge tracing")
        │
        ▼
Generación de la actividad que toca  (sobre el concepto débil, del tipo que mejor lo trabaje)
        │
        ▼
Auto-verificación contra la fuente oficial  (antes de mostrar nada al usuario)
        │
        ▼
Medición de la absorción  →  adapta el énfasis y programa el repaso
```

Ejemplos que debe cubrir de serie:
- *"La norma 14.5 no la tengo interiorizada"* → genera práctica dirigida a ese concepto.
- *"Le cuesta inmigración"* → sube el énfasis en esos conceptos hasta que suba el dominio.

---

## 4. Cómo se llena el Cerebro sin autoría manual

El "cerebro múltiple" **genera solo la metadata**: le das documentación y produce la segmentación, los conceptos, las relaciones y las actividades. El humano **no autora, valida**.

```
Documentación fuente
   → auto-segmentación (conceptos + estructura + relaciones)
   → auto-generación de actividades por concepto
   → AUTO-VERIFICACIÓN de cada ítem contra la fuente oficial (cotejo del dato/artículo)
   → validación humana LIGERA (muestreo + revisión de lo dudoso)
   → pool verificado por concepto (crece automáticamente)
```

Resultado: una persona cubre muchas oposiciones, porque revisa borradores auto-verificados en vez de escribir desde cero. **No es autoría manual, es cosecha verificada.**

---

## 5. No solo preguntas (estilo Duolingo)

Al girar sobre el concepto, de cada nodo cuelgan muchas actividades — todas son formas de *ejercitar y medir* el mismo conocimiento:

- Tipo test · rellenar huecos · flashcards · verdadero/falso **con justificación** · ordenar pasos/procedimientos · respuesta corta evaluada por IA · repaso espaciado · rachas y gamificación.

El sistema elige el tipo de actividad según el concepto y el momento del usuario.

---

## 6. Los dos muros honestos (esto es el foso, no un estorbo)

1. **Corrección (YMYL).** Lo que el usuario ve **debe ser correcto**: se juega un examen real. Ningún ítem se muestra sin pasar la auto-verificación contra la fuente. La verificación no baja a cero humano, pero sí muy abajo — y esa fiabilidad es lo que hará que Acertium se recomiende y que la competencia genérica no pueda copiar.
2. **Legalidad.** El cerebro es legal según **la boca por la que entra la documentación**: aliméntalo con **fuentes oficiales/públicas** (BOE, temario y exámenes oficiales) o **material propio**. **NO** con libros/bancos comerciales: generar preguntas de ahí es obra derivada (problema de copyright). Las preguntas propias/verificadas son, además, un activo de la empresa.

---

## 6b. Guardas y datos personales (dónde vive cada obligación)

No hay una "capa de seguridad" aparte: sería sobre-arquitectura en un MVP de cero usuarios. Hay **cuatro guardas**, y cada una cuelga de una capa que ya existe.

1. **Guarda de entrada — legalidad/copyright.** Un *check* en la boca del pipeline de ingesta: solo se acepta **fuente oficial/pública o material propio** (BOE, temario y exámenes oficiales). Nunca libros ni bancos comerciales (sería obra derivada). Es la regla del §6.2 hecha comprobación explícita, no una capa.
2. **Guarda de salida — corrección (YMYL).** La **auto-verificación** contra la fuente antes de servir cualquier ítem (§6.1). Ya está en la cola del pipeline.
3. **Datos personales (RGPD) + cuentas.** El log de eventos y el progreso son datos personales en cuanto haya usuarios reales (email + actividad de estudio). No es una capa nueva: es **higiene de la capa de datos de usuario**. Dos principios de diseño desde ya: **minimización** (guardar solo lo necesario para el motor) y **borrado/exportación triviales** (salen gratis del log crudo por usuario). La maquinaria (auth, aviso de privacidad) se monta cuando las cuentas se activen, **no antes**.
4. **Secretos.** Cubierto por la norma global `.env`: ningún agente lee `.env*` ni `secrets/`.

Regla: dos guardas viven dentro del pipeline (entrada y salida); dos obligaciones despiertan con el primer usuario real. Ninguna añade caja arquitectónica.

---

## 7. El MVP — la rebanada vertical

**Una sola oposición, de punta a punta.** Objetivo: demostrar que el cerebro funciona con algo real antes de escalar.

Incluye:
- El temario de esa oposición segmentado en conceptos (auto + revisión).
- Un pool de actividades verificadas para esos conceptos.
- El modelo de dominio por usuario (qué sabe / qué no).
- El bucle: practicar → medir absorción → adaptar énfasis → programar repaso.
- Un panel de progreso + guía viva.

NO incluye (todavía): múltiples oposiciones, todos los tipos de actividad, gamificación completa, cuentas avanzadas. Se añaden cuando el núcleo funcione.

---

## 8. Principios (heredados del Master Document + uno nuevo)

- **El producto está por encima de la documentación.** La documentación solo existe para construir.
- **El MVP es la prioridad.** Filtro para toda tarea: *¿esto acerca a que un estudiante aprenda? Si no, se aplaza.*
- **La simplicidad gana.** Menos capas, más producto.
- **NUEVO — nada se muestra al usuario sin pasar la verificación.** La corrección es innegociable (es YMYL).
- **NORTE DE PLATAFORMA (Doc 006) — el núcleo es agnóstico.** El fin último es un *sistema operativo del conocimiento*: mismo motor, cualquier corpus (BOE, libros, manuales de empresa), vendible a instituciones. Toda pieza nueva **o es núcleo agnóstico** (vale para cualquier corpus) **o es un adaptador/overlay enchufable**; nada específico de un dominio contamina el kernel. Se construye el vertical de oposiciones primero; se respetan las costuras. Esta meta gobierna cada decisión.

---

## 9. Qué NO es Acertium (para no repetir el error)

- No es un framework documental ni un sistema de gobernanza de documentos.
- No requiere terminar 7 dominios y 28 capacidades de documentación antes de existir.
- El éxito no se mide en documentos escritos, sino en que **un estudiante pueda usar la app para aprender mejor.**

---

## 10. Siguiente paso

Elegir la oposición de arranque y desglosar la rebanada vertical (§7) en tareas concretas: (a) segmentar su temario en conceptos, (b) generar+verificar un primer pool de actividades, (c) el modelo de dominio + bucle de repaso, (d) el panel. Cuando esté, Acertium existe.
