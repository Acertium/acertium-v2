# Generador automático (dominio legal-es)

Convierte artículos en contenido del cerebro (conceptos + explicaciones + preguntas), con **auto-verificación** que rechaza lo que no está sostenido por la fuente.

- `contrato-generacion.md` — qué produce el motor y las reglas de grounding.
- `../../../nucleo/verificar-lote.mjs` — **puerta de contenido** determinista (núcleo, agnóstica).
- `verificar-meta.mjs` — **puerta de metadatos** (materia/norma/BOE/tema coherentes por familia).
- `registro-materias.json` — fuente de verdad familia↔materia↔norma↔BOE↔tema.
- `cargar.mjs` — lote verificado → SQL para `acertium_v2`.
- `generar.mjs` — orquestador: `node generar.mjs lote.json > carga.sql`.
- `asercion-post-carga.sql` — cinturón: correr tras cada carga (debe dar 0 filas).

**Motor de generación (la costura del LLM):**
- **Opción A (hoy):** el agente produce el `lote.json` siguiendo el contrato. Coste 0.
- **Opción B (futuro):** un job con la API de Claude produce el `lote.json`. Mismo contrato, misma puerta, mismo cargador — solo cambia quién genera.

## ⚠️ CAMBIO DE COMPORTAMIENTO (02/08/2026) — el meta viaja en el lote

Antes, `generar.mjs` recibía el `meta.json` como fichero suelto elegido a mano y **nadie lo contrastaba**. Resultado: 3 lotes (SP, VIC, DISC) se estamparon con el meta de la Constitución (materia/norma/BOE/tema equivocados). Para que no vuelva a pasar hay ahora una **puerta de metadatos** (3 barreras, fail-closed):

1. **El `meta` se embebe DENTRO del lote** (`lote.meta` con materia, norma, referencia_boe, convocatoria, tema). `generar.mjs` lo lee de ahí. El argv `meta.json` queda solo como compatibilidad hacia atrás; si el lote trae meta, esa manda.
2. **`verificar-meta.mjs`** deriva la FAMILIA = primer token del id de concepto (CE, SP, CP, FCS, SC, VIC, DISC…) y la contrasta con `registro-materias.json`. Si `meta.materia/norma/referencia_boe/tema` no cuadran, la familia no está registrada, o el lote mezcla familias → **rechaza, exit 1, 0 SQL**. `cargar.mjs` revalida también (por si alguien salta `generar.mjs`).
3. **`asercion-post-carga.sql`** — tras cada carga, 3 consultas que deben devolver 0 filas.

**Qué tienes que hacer a partir de ahora:**
- Todo `lote.json` debe llevar el bloque `meta` (ver `contrato-generacion.md`).
- **Norma nueva → añade su familia a `registro-materias.json` ANTES de cargar.** Si no está, la puerta la rechaza a propósito.
- Tras ejecutar el SQL, corre `asercion-post-carga.sql` y comprueba 0 filas.

Ejemplo de `meta` embebido en el lote (Ley 5/2014 / PN):
```json
{
  "meta": {
    "materia": "ley-5-2014-seguridad-privada",
    "norma": "Ley 5/2014, de Seguridad Privada",
    "referencia_boe": "BOE-A-2014-3649",
    "convocatoria": "policia-nacional-2026",
    "tema": "Tema 13 — Disposiciones generales en materia de seguridad privada en España"
  },
  "fuentes": { "...": "..." },
  "conceptos": [ "..." ],
  "actividades": [ "..." ],
  "relaciones": [ "..." ]
}
```
