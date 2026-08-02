# Generador automático (dominio legal-es)

Convierte artículos en contenido del cerebro (conceptos + explicaciones + preguntas), con **auto-verificación** que rechaza lo que no está sostenido por la fuente.

- `contrato-generacion.md` — qué produce el motor y las reglas de grounding.
- `../../../nucleo/verificar-lote.mjs` — la **puerta** determinista (núcleo, agnóstica).
- `cargar.mjs` — lote verificado → SQL para `acertium_v2`.
- `generar.mjs` — orquestador: `node generar.mjs lote.json meta.json > carga.sql`.

**Motor de generación (la costura del LLM):**
- **Opción A (hoy):** el agente produce el `lote.json` siguiendo el contrato. Coste 0.
- **Opción B (futuro):** un job con la API de Claude produce el `lote.json`. Mismo contrato, misma puerta, mismo cargador — solo cambia quién genera.

`meta.json` de ejemplo (Constitución / PN):
```json
{ "materia":"constitucion-espanola", "norma":"Constitución Española",
  "referencia_boe":"BOE-A-1978-31229",
  "convocatoria":"policia-nacional-2026", "tema":"Tema 1 — La Constitución" }
```
