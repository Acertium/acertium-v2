-- Acertium — quién revisó qué, y cuándo.
--
-- 23/08/2026. `docs/contrato-fuentes-no-boe.md` §2 pone la revisión humana como
-- LA puerta del contenido de consenso: «ningún concepto consenso se sirve sin
-- revisión humana». Y §5 exige cadencia de re-verificación para las fuentes con
-- datos vivos (INE, OEDA, tendencias de ciberamenazas).
--
-- Las dos cosas se apoyaban en un dato que no existía: `resolverPendientes()`
-- cambiaba el estado y no dejaba rastro. Consecuencias reales:
--   · una recarga que vuelva a aplicar `estadoSegunTipoFuente` devuelve esos
--     conceptos a `pendiente_revision`, y nadie sabría que ya se revisaron;
--   · sin fecha de revisión, la cadencia del §5 no se puede calcular — y las
--     fuentes de consenso son las MÁS volátiles del banco (una entrada de
--     Wikipedia puede cambiar hoy).
--
-- Esta tabla es append-only: una fila por cada tránsito de estado revisado.
-- La escriben la pantalla /admin (`lib/admin.ts`) y el CLI
-- (`revision-pendientes.mjs`), y en ninguno de los dos bloquea la operación: si
-- falla el registro, el contenido ya está promovido y dejarlo a medias sería
-- peor. Se avisa por consola.
--
-- Aplicada en producción el 23/08/2026. Idempotente.

create table if not exists acertium_v2.revision (
  id             bigserial primary key,
  actividad_id   uuid references acertium_v2.actividad(id) on delete cascade,
  concepto_id    text not null,
  estado_anterior acertium_v2.estado_verificacion not null,
  estado_nuevo    acertium_v2.estado_verificacion not null,
  revisado_en    timestamptz not null default now(),
  -- 'admin'       registrado en el momento por la pantalla /admin
  -- 'cli'         ídem, desde revision-pendientes.mjs
  -- 'retroactivo' anotado después, a partir de lo que consta; NO es un evento
  --               observado, y por eso se distingue
  origen         text not null,
  nota           text
);

create index if not exists revision_concepto_idx on acertium_v2.revision (concepto_id);
create index if not exists revision_fecha_idx on acertium_v2.revision (revisado_en desc);

comment on table acertium_v2.revision is
  'Append-only. Rastro de la revisión humana que exige contrato-fuentes-no-BOE §2, y base de la cadencia de re-verificación del §5.';
comment on column acertium_v2.revision.origen is
  'admin/cli = capturado en el momento. retroactivo = anotado después a partir de lo que consta; no es un evento observado.';
