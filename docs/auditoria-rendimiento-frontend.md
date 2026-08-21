# Auditoría de rendimiento del frontend

> 20/08/2026. Medido con `EXPLAIN (ANALYZE, BUFFERS)` contra la base real, no
> estimado. Todas las pantallas son `dynamic = "force-dynamic"`: leen el cerebro
> en cada request, así que lo que tarda una consulta lo espera el usuario.

## Qué se encontró

Las cinco pantallas de `app/(app)/` cargan datos en el servidor. El problema no
estaba en el cliente —los bundles son pequeños y el runner ya marca la opción
elegida al instante— sino en **cuántas idas y vueltas a Supabase hace cada
pantalla y cuántas filas arrastra**.

La consulta central, `practicar_estado`, la piden `/hoy` y `/practicar`:

```
Hash Left Join  (actual time=336.944..386.655 rows=3343)
  ->  Seq Scan on actividad     (actual time=1.141..236.759 rows=3411)   ← 236 ms
  ->  Seq Scan on overlay_entrada (actual time=1.753..93.697 rows=3343)
  SubPlan 1
    ->  Index Only Scan on relacion_concepto  (loops=3343)  Buffers: 6732 ← 3.343 veces
Planning Time: 108.310 ms
Execution Time: 387.107 ms
```

**Tres causas, y las tres se arreglaron:**

1. **Un `Seq Scan` de 236 ms sobre `actividad`.** El único índice era por
   `concepto_id`, y el filtro real es `tipo='test' AND estado_verificacion='verificado'`.
2. **Una subconsulta correlada que se ejecutaba 3.343 veces** —una por concepto—
   para resolver los prerrequisitos: 6.732 buffers solo para eso.
3. **Cuatro peticiones secuenciales por pantalla.** PostgREST corta en 1.000
   filas (ver el comentario del tope en `lib/cerebro.ts`), así que traer 3.343
   conceptos exigía paginar cuatro veces, una detrás de otra.

A eso se sumaba que **`/hoy` pedía el universo entero además de sus propios
conteos**, cosa que introduje yo esa misma mañana al hacer que la pantalla
preguntase al planificador: correcto de fondo, caro de forma.

## Qué se hizo

**Índices** (`indices_rendimiento_practicar`):

- `idx_actividad_servible` — parcial sobre `(concepto_id) WHERE tipo='test' AND
  estado_verificacion='verificado'`. Parcial a propósito: el runtime **solo**
  sirve verificadas, así que el índice cubre justo lo que se consulta y no paga
  por el resto.
- `idx_evento_usuario_fecha` — `(usuario_id, fecha DESC)`, para la última
  respuesta y los conteos de acierto.
- `ANALYZE` de las seis tablas: el planificador estimaba 3.040 filas en
  `overlay_entrada` cuando hay 3.343.

**Tres funciones nuevas, de una sola vuelta cada una**
(`practicar_estado_json_una_sola_vuelta`):

| Función | Sustituye a | Devuelve |
|---|---|---|
| `practicar_estado_json` | 4 peticiones paginadas | **1 fila** con el universo en un `jsonb` |
| `progreso_temas` | 3.343 filas del overlay + agregación en memoria | 45 filas ya agregadas |
| `resumen_usuario` | 5 consultas de `/hoy` | 1 fila con los cinco conteos |

El truco del `jsonb` merece explicación porque no es evidente: **el tope de
PostgREST cuenta FILAS, no bytes.** Una fila que contiene un array de 3.343
objetos no lo toca. Se prefirió eso a subir `db-max-rows` en el proyecto, por dos
razones: el tope volvería a aparecer al crecer el cerebro, y subirlo afecta a
todos los endpoints. Con este diseño **el tamaño del cerebro deja de importar**.

Y `practicar_estado` se reescribió por dentro: la subconsulta correlada pasa a
ser una agregación previa que recorre `relacion_concepto` **una sola vez**.

## Resultado medido

| | Antes | Después |
|---|---|---|
| `practicar_estado` · ejecución | **387 ms** | **45 ms** |
| `practicar_estado` · planificación | 108 ms | 1,5 ms |
| Vueltas a Supabase por pantalla | 4 (secuenciales) | **1** |
| `progreso_temas` | 4 vueltas + 3.343 filas | 2,9 ms · 45 filas |

En `/hoy`, además, los conteos y el universo ahora se piden **en paralelo**
(`Promise.all`) en vez de en cadena.

## Lo que se miró y NO era el problema

Conviene dejarlo escrito para que nadie lo vuelva a mirar:

- **`simulacro_muestra`: 17 ms** para 100 preguntas. Hace `order by random()`
  sobre 3.411 filas anchas; se podría afinar seleccionando ids primero, pero a
  17 ms no compensa tocarlo.
- **`responder()` ya estaba paralelizado**: concepto, fuente y estado BKT se
  piden con un `Promise.all`. No es una cadena.
- **El cliente no es el cuello de botella.** `practica-runner.tsx` marca la
  opción elegida ANTES de que conteste el servidor, y el spinner de
  «Comprobando…» solo aparece si la respuesta tarda más de 300 ms (`useRetardoCarga`),
  así que no parpadea en las rápidas.

## Lo que queda abierto

- **`/perfil` y `/temas` no se han medido con usuario real cargado.** Con 33
  filas en `estado_dominio` cualquier plan es rápido; conviene volver a medir
  cuando un usuario tenga cientos de conceptos practicados.
- **No hay caché.** Todas las pantallas son `force-dynamic` porque el cerebro
  cambia y el plan del día también. Con más usuarios habrá que decidir qué se
  puede cachear por unos segundos; hoy, con un usuario, no compensa.
- **El `order by random()` del simulacro** escalará mal si el banco crece mucho:
  ordena todas las filas servibles. Anotado, no urgente.
