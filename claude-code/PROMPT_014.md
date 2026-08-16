# PROMPT_014 — Arreglar `cargar.mjs` (inserción real y confirmada) + reconciliar índice + re-cargar

**Diagnóstico (verificado por Cowork con SQL contra la base, 16/08):** el índice `00-indice.md` da
FALSOS POSITIVOS. `marcarCobertura()` marca ✓ **al EMITIR el SQL, no cuando la base confirma el
insert**. Estado real de la BD: **1.346 conceptos, pero SOLO la oleada 1 (APAT/PTEMP/ACOG) está de
verdad**. Familias marcadas ✓ hoy (FE, PRLP, PRLAGE, RDP) tienen **0 filas** en `acertium_v2.concepto`.
El SQL no entró. Este encargo lo arregla. Sigue `CLAUDE.md`. NUNCA leas `.env` (el script sí puede
leer `.env.local` por su cuenta; tú no imprimas su contenido). Al terminar: `RESULTADO_014.md` + `EJECUCIONES.md`.

## 1. Arreglar CÓMO inserta `cargar.mjs`
Revisa cómo carga hoy. Si **emite SQL en texto para un ejecutor externo** (MCP/manual), cámbialo para
que **inserte con el cliente JS service-role de Supabase** — el MISMO `createCerebroClient` de
`lib/supabase/cerebro` que la app ya usa para escribir (eventos, reportes), leyendo `.env.local`:
- `db.from('concepto').insert([...])`, `db.from('actividad').insert([...])`,
  `db.from('concepto_fuente').insert([...])`, `db.from('relacion_concepto').insert([...])`.
- **Comprueba el resultado de CADA insert** (`{ data, error }`): si hay `error`, ABORTA ese lote,
  NO marques ✓, y repórtalo. Así se confirma la inserción de verdad (que es justo lo que hoy no pasa).
- Mantén la lógica actual de baraja de opciones (posición uniforme) y de construcción de aristas.
- Ventajas: sin secreto nuevo, sin dejar nada raro en producción, e inserta confirmando.
- Si alguna operación necesita SQL crudo real (poco probable; todo son INSERT en tablas existentes),
  usa **`pg` con la connection string** que Jonathan ponga en `.env.local` (opción estándar).
  **NUNCA crees una función `exec_sql`/de SQL arbitrario en producción.**

## 2. Arreglar `marcarCobertura()`
Que marque ✓ en `00-indice.md` (y recalcule el resumen) **solo DESPUÉS de que los insert del lote se
confirmen sin error**. Si la carga falla, no marca ✓ (o revierte la marca).

## 3. Reconciliar el índice con la realidad
Ahora mismo el índice miente. Recalcúlalo contra la BD: una familia es ✓ **solo si sus conceptos
existen en `acertium_v2.concepto`**. Quita el ✓ (vuelve a ⏳) de FE/§7, PRLP/§45, PRLAGE/§46, RDP/§49
y de cualquier otra que esté marcada pero con 0 filas. Corrige la línea de resumen.

## 4. Re-cargar de verdad (con el cargar.mjs arreglado), en orden
Carga todo lo que está generado pero NO está en la BD (todo menos la oleada 1). Orden y dependencias:
1. **BOE**: los lotes de PROMPT_002, 003, 004, 005, 006 (registra sus familias en `registro-materias.json`
   ANTES de cargar, como indican esos PROMPTs; muchas ya están registradas).
2. **Fix de meta no-BOE**: aplica el ajuste de `verificar-meta` de **PROMPT_007** (aceptar
   `referencia_fuente` cuando `referencia_boe` está vacío) y carga los lotes de 007.
3. **No-BOE**: lotes de PROMPT_008 y PROMPT_010.
Tras CADA lote: `asercion-post-carga.sql` (debe dar 0). Si da >0, para y repórtalo.

## 5. Verificación (obligatoria, por familia)
Para cada familia cargada, confirma en la BD `select count(*) from acertium_v2.concepto where id like 'FAM-%'` > 0
y que coincide con el nº de conceptos del lote. Deja en `RESULTADO_014.md` una tabla familia→conceptos
en BD. (Cowork cruzará estos conteos por su cuenta vía MCP.)

## Nota
Los módulos y el panel (PROMPT_009 ortografía, 011 consenso, 012 admin) son tareas de código aparte y
siguen su curso; este encargo es solo el arreglo del cargador + la carga real del contenido.
