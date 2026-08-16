# RESULTADO_012 — Panel `/admin` (reportes de usuarios + cola de revisión)

Ejecutado el **2026-08-16**. Estado: **completado y probado en ejecución**, con una cosa que
necesito de Jonathan (§6). Depende del PROMPT_011, que ya está.

## 1. Gating — `ADMIN_TOKEN`, porque no hay login

Lo comprobé antes de elegir, como pedía el encargo: **la app no tiene auth real**. `lib/cerebro.ts`
trabaja con un `DEMO_USUARIO_ID` fijo (`c9959584-…`) y no hay sesión de usuario en ninguna parte. Un
gate por `ADMIN_USER_ID` no tendría con qué comparar, así que el mecanismo vigente es el interino que
el encargo prevé: **`ADMIN_TOKEN` en cookie**.

- **`/admin/entrar?token=…`** (route handler) valida el token y deja una cookie `httpOnly`,
  `sameSite=lax`, `secure` en producción, 30 días. Existe para que el token no se quede en la barra
  de direcciones ni en el historial en cada visita: se pasa una vez.
- **`/admin`** lee la cookie. Sin cookie, con cookie que no cuadra, o **con `ADMIN_TOKEN` sin
  configurar**, responde **404** — no 403, para no confirmar siquiera que el panel existe.
- La comparación es en **tiempo constante**, para no filtrar el token por lo que tarda.
- **TODO marcado en el código**: cuando exista login, `esAdmin()` en `lib/admin.ts` es el único punto
  a tocar para pasar a `ADMIN_USER_ID` y, mejor, a gating por rol.

**Las server actions vuelven a comprobar `esAdmin()` cada una.** Una server action es un endpoint
HTTP: que la página esté cerrada no impide que alguien llame a la acción directamente. El gate de la
página protege la vista; el de las acciones protege la escritura.

## 2. Bloque 1 — Avisos de usuarios

Lee `acertium_v2.reporte` con `estado='abierto'`, más recientes arriba, con el **enunciado de la
actividad** y el **título del concepto** (dos consultas extra cruzadas en memoria: PostgREST no hace
esos joins). Motivo traducido a lenguaje llano, igual que en el botón de reporte. Contador arriba.

Acciones: **Corregido · Revisado · Descartar**, con **nota interna** opcional.

Migración `20260816130000_reporte_nota_interna.sql` (aplicada): `reporte.estado` ya era `text` sin
enum ni CHECK, así que admite los valores nuevos **sin migrar**; lo que faltaba era dónde escribir la
nota. Añadidas `nota_interna text` y `atendido timestamptz` — esta última es la que permitirá, a
futuro, decirle al usuario que su aviso se atendió (fase 2 del reporte colaborativo).

## 3. Bloque 2 — Contenido por aprobar

Lee las actividades `estado_verificacion='pendiente_revision'`, **agrupadas por familia**, con
enunciado, opciones (la correcta marcada), cotejo y la referencia de la fuente. Contador por familia.

Acciones: **Aprobar** / **Rechazar** por actividad, y **aprobar la familia entera** con paso de
confirmación (dice explícitamente que pasarán a servirse a los usuarios).

**Detalle que no estaba en el encargo pero hacía falta:** al promover una actividad **se promueve
también su concepto**. Si no, quedaría un concepto `pendiente_revision` con pregunta servible, que es
la incoherencia que el contrato quiere evitar. Mismo criterio que `revision-pendientes.mjs`.

## 4. Requisitos técnicos

- **Todo server-only**: `lib/admin.ts` abre con `import "server-only"` y usa el cliente service-role.
  El componente cliente solo recibe datos ya cocinados y llama a server actions; el service-role
  nunca toca el navegador.
- **El runtime no cambia**: no se ha tocado ninguna consulta de selección. Practicar y simulacro
  siguen sirviendo solo `verificado` (probado en el PROMPT_011, 5/5).
- Móvil-first: `max-w-xl`, botones de 44 px de alto mínimo, mismas variables de color y tipografía
  que `/temas` y `/hoy`.
- El panel vive **fuera** del grupo `(app)`, así que no arrastra la barra de navegación inferior:
  no es una pantalla de estudio.

## 5. Verificación — probado de verdad, no solo compilado

**`npm run build` verde** (exit 0), con `/admin` y `/admin/entrar` en la tabla de rutas.

**Smoke test completo**, con el servidor levantado y un reporte y una actividad de prueba
(prefijo `ZZTEST-`) creados para la ocasión:

| Comprobación | Resultado |
|---|---|
| `/admin` sin cookie | **404** |
| `/admin/entrar?token=incorrecto` | **404** |
| `/admin/entrar?token=` correcto | 307 → `/admin`, cookie puesta |
| `/admin` con cookie | **200**, con los dos bloques y sus datos |
| Atender el reporte → nota → «Revisado» | `estado='revisado'`, `nota_interna` guardada, `atendido` con fecha |
| «Aprobar» en la cola | actividad **y concepto** a `verificado` |
| ¿La sirve practicar tras aprobarla? | **sí**, `actividad_de_concepto()` devuelve 1 fila |

Hecho clicando en el navegador, no simulado. **Datos de prueba borrados**: 0 filas `ZZTEST-` en
concepto, actividad y reporte; la base queda igual que antes (2.481 conceptos, 2.419 preguntas).

Un fallo que salió en el build y arreglé: llamé `Error` a un componente interno, y eso **sombreaba al
constructor global** en los `catch (e) { e instanceof Error }`. Renombrado a `MensajeError`.

## 6. Lo que necesito de Jonathan

**Falta poner `ADMIN_TOKEN`.** Sin ella el panel está cerrado (404) para todo el mundo, incluido tú:

1. Genera una cadena larga y aleatoria (no una contraseña que uses en otro sitio).
2. Ponla como `ADMIN_TOKEN` en **Vercel** (Settings → Environment Variables) y en tu `.env.local`.
3. Entra una vez a `https://…/admin/entrar?token=EL_VALOR`. A partir de ahí, `/admin` a secas.

**No he podido añadirla a `.env.local.example`**: ese fichero está cubierto por la regla de secretos
del `CLAUDE.md` y mis permisos me lo deniegan. Habría que añadir a mano, junto a `ADMIN_USER_ID`:

    # Gate INTERINO de /admin mientras no hay login. Cadena larga y aleatoria.
    # Fail-closed: si está vacía, /admin devuelve 404 para todo el mundo.
    # Entrar una vez por /admin/entrar?token=EL_VALOR (deja cookie httpOnly de 30 días).
    ADMIN_TOKEN=

(Y convendría anotar en `ADMIN_USER_ID` que aún no se usa, porque no hay login.)

## 7. Otras notas

- **La cola de revisión está vacía** en producción: el contenido de consenso (temas 28-33) todavía no
  se ha generado. El bloque 2 lo dice con su propio texto en vez de quedarse en blanco.
- El panel **no permite editar** una pregunta, solo aprobarla, rechazarla o cerrar el aviso. Corregir
  el contenido sigue siendo cosa del generador. Si al leer un reporte quieres arreglar la pregunta,
  hoy hay que hacerlo por el lote y recargar.
- El listado corta en **200 reportes** y **500 pendientes**. Con el volumen actual sobra; si algún
  día se llena, hará falta paginación.
- `ADMIN_TOKEN` es un secreto compartido, no autenticación. Es lo que el encargo pide como interino y
  está bien para un panel de una sola persona, pero **no** es sustituto de login con roles cuando
  haya usuarios reales.
