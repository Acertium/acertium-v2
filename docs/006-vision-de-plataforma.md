# Acertium — Documento 006: Visión de plataforma (el SO del conocimiento)

> La estrella polar. Acertium no es una app de oposiciones: es un **sistema operativo del conocimiento** — un núcleo que convierte cualquier corpus verificable en un cerebro que enseña, mide la absorción y guía el estudio. Las oposiciones son el primer "programa de usuario".
> **Regla que gobierna TODO lo que se construye:** o es **núcleo agnóstico**, o es un **adaptador/overlay enchufable**. Nada específico de un dominio contamina el kernel.
> Fecha: 2026-08-01 · Estado: norte a futuro (no se construye la plataforma ahora; se construye el vertical y se respetan las costuras).

---

## 1. La meta a futuro (por qué existe este documento)

El fin último no es un producto, es una **plataforma**: dale documentación (el BOE, un libro, el manual de una empresa, una guía clínica) y te devuelve un **cerebro verificado** con planes de estudio personalizados y seguimiento real de absorción. Y venderlo — a opositores hoy, a **instituciones y empresas** mañana (formación corporativa, certificaciones, cumplimiento normativo).

Este documento existe para que esa meta **no se olvide** y para que **cada decisión de diseño la sirva**. No para construirla ya (eso sería la trampa del andamiaje vacío). Se construye el vertical; se respetan las costuras.

## 2. El mapa de capas

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTOS (aplicación)   Acertium oposiciones · Formación de │
│                          empresa · Certificaciones B2B        │
├─────────────────────────────────────────────────────────────┤
│ OVERLAYS                 convocatoria / programa formativo    │
│                          (qué conceptos entran y con qué peso)│
├─────────────────────────────────────────────────────────────┤
│ ADAPTADORES POR DOMINIO  ingestor · gramática de citas ·      │
│  «la boca»               modelo de frescura · plantillas      │
├─────────────────────────────────────────────────────────────┤
│ NÚCLEO AGNÓSTICO         concepto + grafo · verificación ·    │
│  el kernel  [hecho]      motor de absorción · planificador    │
├─────────────────────────────────────────────────────────────┤
│ TRANSVERSAL              barreras (integridad) · vigilante    │
└─────────────────────────────────────────────────────────────┘
Flujo: corpus → adaptador → el núcleo lo hace cerebro verificado
       → un overlay lo enfoca a un programa → el producto lo sirve.
```

## 3. Qué es núcleo, qué es adaptador, qué es producto (la regla de oro)

**Núcleo agnóstico (no sabe de leyes ni de oposiciones — sabe de conocimiento, memoria y olvido):**
- Modelo de concepto canónico + grafo tipado (`concepto`, `concepto_fuente`, `relacion_concepto`).
- Verificación de una actividad contra su fuente (guarda de salida).
- Motor de absorción (BKT + olvido) y planificador (coach).
- El profesor (QA grounded sobre el cerebro).

**Adaptadores por dominio (lo único que cambia al cambiar de corpus):**
- **Ingestor**: cómo se lee la fuente (código BOE ≠ PDF de libro ≠ Confluence de empresa).
- **Gramática de citas**: cómo se detectan las remisiones ("artículo 55 remite al 116" ≠ "véase capítulo 3").
- **Modelo de frescura**: cada cuánto cambia y cómo se vigila (ley por BOE ≠ edición de libro ≠ versión de manual).
- **Plantillas de actividad**: qué tipos de ejercicio pegan a ese material.

**Producto/overlay (lo que enfoca el cerebro a un objetivo):**
- Overlay = convocatoria (oposiciones) o programa formativo (empresa): qué conceptos entran, en qué tema y con qué peso.

> **Test de una pieza nueva:** ¿esto vale igual para una ley, un libro de mates y un manual de empresa? Si **sí** → núcleo. Si **no** (es propio de cómo entra o se cita ese corpus) → adaptador. Nunca metas lo segundo en lo primero.

## 4. Los contratos entre programas (las "syscalls")

Interfaces estables entre módulos. Mientras se respeten, añadir un dominio nuevo = escribir adaptadores, sin tocar el núcleo.

| Programa | Capa | Entrada → Salida |
|----------|------|------------------|
| **Ingestor** | adaptador | fuente bruta → `documento { unidades:[{ref, texto_literal, contexto}], meta:{obra, referencia, fecha, url} }` |
| **Segmentador** | núcleo | documento → `conceptos:[{titulo, resumen, fuentes[], prerrequisitos?}]` |
| **Extractor de relaciones** | adaptador (gramática) | `unidad.texto` → `referencias[]` → aristas `remite` / pendientes |
| **Generador** | núcleo (+ plantillas) | concepto + texto literal → `actividades:[{tipo, enunciado, respuesta, cotejo}]` |
| **Verificador** | núcleo | actividad → `{ ok, motivo }` (nada sin cotejo) |
| **Motor de absorción** | núcleo | `(estado, evento) → estado'` · `(eventos) → estado` · `absorcion(estado, t)` |
| **Planificador** | núcleo | `(conceptos, estados, grafo, examen, disponibilidad) → plan{consolidar, ampliar}` · `cobertura` |
| **Profesor** | núcleo | `(pregunta, cerebro) → respuesta citada | "no lo sé"` |
| **Vigilante de frescura** | adaptador (fuente) | registro de normas → conceptos marcados `pendiente` |

Los módulos ya escritos (`verificador-cotejo.mjs`, `motor-bkt.mjs`, `planificador.mjs`, extractor de remisiones, `barreras.sql`) son estos programas en su versión del dominio "legal español".

## 5. B2B / multi-tenant (futuro, no ahora)

- El **overlay** generaliza a **programa formativo** de un cliente (onboarding, certificación, normativa interna).
- El **foso de verificación** (cada afirmación citada a su fuente, auditable, con fecha) es el argumento de venta en sectores regulados (banca, sanidad, seguros): un tutor que **no alucina** y es **auditable**.
- La única costura nueva será una **dimensión `org`/tenant** (aislar corpus y usuarios por cliente, con RLS). **No se construye hoy**; solo se evita cualquier decisión que la impida (ninguna actual lo hace).
- Modelo de negocio B2B: *"danos vuestra documentación → cerebro verificado + plan de estudio por persona con seguimiento de absorción"*.

## 6. Qué NO se hace todavía (para no caer en la trampa)

- No se construye el ingestor genérico ni la plataforma multi-dominio: primero el vertical de oposiciones **hasta que dé dinero**.
- No se monta multi-tenancy, ni billing B2B, ni panel de cliente.
- No se generaliza un módulo "por si acaso": se generaliza cuando llega el **segundo** dominio real.

Regla final: **vertical primero, costuras siempre, plataforma cuando el vertical lo pague.** Toda pieza que se construya se pregunta antes: *¿esto acerca el vertical Y respeta la costura núcleo/adaptador?* Si rompe la costura, se rediseña.
