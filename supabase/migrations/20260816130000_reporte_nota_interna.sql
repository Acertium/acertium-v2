-- Acertium — PROMPT_012: nota interna en los reportes de usuarios.
--
-- El panel /admin permite marcar un reporte como revisado/corregido dejando una
-- nota de por qué. `reporte.estado` ya es `text` con default 'abierto' y sin
-- CHECK ni enum, así que admite 'revisado' | 'corregido' | 'descartado' sin
-- migración; lo que faltaba era dónde escribir la nota y cuándo se atendió.
--
-- Aplicada en producción el 16/08/2026. Idempotente.

alter table acertium_v2.reporte
  add column if not exists nota_interna text,
  add column if not exists atendido timestamptz;

comment on column acertium_v2.reporte.nota_interna is
  'Nota del revisor al cerrar el reporte (panel /admin). No se muestra al usuario.';
comment on column acertium_v2.reporte.atendido is
  'Cuándo se marcó revisado/corregido/descartado. Permite, a futuro, avisar al usuario de que su aviso se atendió.';
