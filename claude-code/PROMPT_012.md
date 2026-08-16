# PROMPT_012 — Panel de admin/revisión (reportes de usuarios + cola de contenido pendiente_revision)

Funcionalidad de app (Next.js), móvil-first como el resto. Una sola pantalla protegida con DOS bloques.
Depende de PROMPT_011 (estado `pendiente_revision`) para el bloque 2. Revisa `git status`. Sigue
`CLAUDE.md`. Al terminar: `npm run build`, commit, push, `RESULTADO_012.md`, `EJECUCIONES.md`. NUNCA leas `.env`.

## Acceso (gating)
Ruta **`/admin`**, accesible solo para Jonathan. Usa la variable que **YA existe** en
`.env.local.example`: **`ADMIN_USER_ID`** (NO inventes `ADMIN_UID`). **Fail-closed**: si la variable está
vacía o no coincide → `/admin` devuelve **404**.
- **Comprueba primero si la app tiene auth real** (un usuario logueado con id). Si la hay: gatea
  comparando el id del usuario de la sesión con `ADMIN_USER_ID`.
- **Si AÚN NO hay login** (la app va con `DEMO_USUARIO_ID`, sin auth), un gate por UID no puede comparar
  nada → usa **`ADMIN_TOKEN`** (cookie/cabecera) como interino, también **fail-closed**, hasta que exista
  login. TODO: migrar a gating por rol cuando haya auth.
No sé si `ADMIN_USER_ID` tiene valor en Vercel (no leo `.env`); da igual: con fail-closed, si está puesta
funciona y si no, `/admin` queda cerrado. Documenta en el RESULTADO qué mecanismo usaste.

## Bloque 1 — Reportes de usuarios (cierra la fase 2 del reporte colaborativo)
Lee la tabla `acertium_v2.reporte`:
- Lista los reportes `estado='abierto'` (más recientes arriba) con: enunciado de la actividad, concepto,
  `motivo`, `comentario`, `contexto`, fecha. Enlace/botón para ver la pregunta.
- Acciones (server actions): marcar un reporte como **`revisado`** o **`corregido`** (añade esos valores a
  `reporte.estado`), con opción de nota interna. Al marcar `corregido`, queda registrado para —a futuro—
  poder mostrar al usuario que su aviso se atendió (fase 2 del contrato de reporte colaborativo).
- Contador arriba: nº de reportes abiertos.

## Bloque 2 — Cola de revisión de contenido (`pendiente_revision`)
Lee las actividades con `estado_verificacion='pendiente_revision'` (contenido `consenso` del Grupo C):
- Lista por familia/tema, con enunciado, opciones (marcando la correcta), `cotejo` y `referencia_fuente`.
- Acción (server action): **promover a `verificado`** individualmente o por familia, tras revisión.
  (Opcional: marcar "rechazado" para descartar/regenerar.)
- Contador por familia de lo pendiente.

## Requisitos técnicos
- Server-only para las lecturas/escrituras (cliente service-role del cerebro; nunca desde el navegador).
- No romper el runtime: practicar/simulacro siguen sirviendo SOLO `verificado` (garantía de PROMPT_011).
- `reporte.estado` pasa a admitir `abierto|revisado|corregido` (y opcional `descartado`); si es enum, migración.
- Móvil-first, botones grandes, misma estética.

## Verificación
- `npm run build` verde.
- Smoke: con un reporte de prueba en `abierto`, aparece y se puede marcar `revisado`; con una actividad
  `pendiente_revision`, aparece y se puede promover a `verificado` (y entonces sí la sirve practicar).

## Nota
Es la pantalla que Jonathan pidió para (a) leer los reportes (hoy caen en un buzón que nadie abre) y
(b) aprobar el contenido de consenso antes de que llegue al usuario. Une dos pendientes en una sola vista.
El valor de `ADMIN_USER_ID` (o `ADMIN_TOKEN`) lo fija Jonathan en Vercel/`.env.local`; Code NO necesita el
valor para implementar el panel (fail-closed lo cubre).
