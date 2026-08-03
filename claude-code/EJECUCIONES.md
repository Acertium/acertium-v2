# Registro de ejecuciones (Claude Code)

Bitácora de las sesiones de agente sobre AcertiumV2: qué se tocó, qué se
verificó y qué quedó pendiente. Una entrada por sesión, la más reciente arriba.

---

## 2026-08-03 — Cierre de pendientes: examen a 3 alternativas + limpieza del generador

**Encargo.** Revisar el árbol de trabajo, separar los cambios legítimos de los
ficheros temporales que habían dejado varios agentes, dejar el build verde y
subir a `main`.

### 1. Cambios de la app (formato examen oficial PN)

- `lib/cerebro.ts` — `siguienteActividad()` pasa a usar el RPC
  `acertium_v2.siguiente_actividad_test()` (`order by random() limit 1` en la
  base, en vez de descargar el banco entero y elegir en memoria) y reduce las 4
  opciones guardadas a **correcta + 2 distractores**, barajadas. `responder()`
  recibe ahora `textoElegido: string` y corrige **por texto**; devuelve
  `correctaIndice: null` porque tras barajar el índice del cliente no significa
  nada.
- `lib/simulacro-data.ts` — `iniciarSimulacro()` usa el RPC
  `acertium_v2.simulacro_muestra(conv, n)`; corrección con la fórmula oficial
  `[A − E/(n−1)] × 10 / P` (n = 3), blancos que ni puntúan ni penalizan, y solo
  se emiten eventos al motor por las preguntas contestadas.
- `app/(app)/practicar/actions.ts` y `practica-runner.tsx` — envían el texto
  elegido; el resaltado de la correcta se hace comparando textos.
- `app/(app)/simulacro/simulacro-runner.tsx` — pantalla de intro (modo completo
  100 preguntas / 50 min y modo rápido), cuenta atrás, navegador de preguntas y
  revisión con detalle.

**Arreglo necesario para el build:** el runner es un componente cliente y pasó a
importar *valores* (no solo tipos) de `lib/simulacro-data.ts`, que hace
`import "server-only"` → el build de Next fallaba con
`'server-only' cannot be imported from a Client Component module`. Se extrajo el
formato del examen (constantes + tipos públicos) a **`lib/simulacro-formato.ts`**,
sin acceso a datos; `simulacro-data.ts` lo re-exporta para el código de servidor
que ya lo importaba. Segundo error de tipos: `db.rpc()` devuelve `any`, así que
se describió la fila del RPC con el tipo local `FilaMuestra`.

### 2. Limpieza

Borrados los ficheros de trabajo temporales que dejaron agentes anteriores
(19 en total): `_rev_*.mjs`, `_tmp_gob_data.mjs`, `build_age.mjs`,
`tmp_build_ebep.mjs`, `tmp_gen_ce2.mjs`, los scripts sueltos de Python
(`build_ext.py`, `build2_ext.py`, `data_ext.py` — con rutas `/tmp` y de sesión
codificadas a mano), `lotes/_carga_*_tmp.sql`, `lotes/_ig_part*.sql`,
`rev_prl.json` y `tmp_rev_lopd7.json`. Su salida ya está en `lotes/*.json`.
Intactos los módulos reales del generador.

### 3. Módulo de calidad del generador

Se versionan `verificar-calidad.mjs`, `verificar-meta.mjs`,
`contrato-calidad-preguntas.md`, `auditoria-calidad.sql`,
`asercion-post-carga.sql`, `registro-materias.json`, los cambios en
`generar.mjs` / `cargar.mjs` / `contrato-generacion.md` / `README.md`, los 32
lotes nuevos y `datos/legal-es/boe-600-pn/temario-oficial.md` + las 3 carpetas
de artículos fuente (estatuto de la víctima, seguridad privada, régimen
disciplinario).

### 4. Migraciones

Nuevo `supabase/migrations/20260803120000_funciones_muestreo_aleatorio.sql` con
`siguiente_actividad_test()` y `simulacro_muestra(conv, n)`. **Ya estaban
aplicadas en producción**: el SQL se copió literal de la base con
`pg_get_functiondef`, no se escribió de memoria. Es idempotente
(`CREATE OR REPLACE`).

### Verificación

`npm run build` → ✅ (Next 16.2.6, TypeScript OK, 10 rutas). Los dos fallos
descritos arriba se arreglaron y se volvió a construir hasta verde.

### Pendientes / notas

- `demo-tipos-actividad.html` (raíz) quedó **sin versionar**: no entraba en el
  encargo y parece una maqueta suelta. Si vale, su sitio es `prototipos/`
  (ignorado por `.gitignore`); si no, se puede borrar.
- La app **no se ha probado en ejecución** (solo build + tipos). El formato de
  3 alternativas y la fórmula de corrección conviene verlos con datos reales.
