-- AcertiumV2 · 23/08/2026 · publicado ≠ en vigor
--
-- `norma.ultima_modificacion` guarda lo que dice la cabecera del BOE, que es la
-- fecha de PUBLICACIÓN de la última reforma. Y eso no es lo mismo que la fecha
-- en que esa reforma es Derecho.
--
-- El caso que lo destapó: el Reglamento General de Circulación (BOE-A-2003-23514)
-- figura como «modificado el 26/06/2026». Su art. 69 tiene, en el consolidado del
-- BOE, una redacción nueva del RD 518/2026… que entra en vigor el 1 de OCTUBRE de
-- 2026. A 23/08/2026 la redacción vigente sigue siendo la de 2025 — la que
-- tenemos — y las 2 preguntas que cuelgan de ese artículo son correctas HOY.
--
-- Sin esta distinción solo caben dos errores, y los dos malos:
--   · marcar los conceptos al publicarse → se le quitan al opositor preguntas
--     correctas durante tres meses;
--   · no marcarlos nunca → el 1 de octubre se le enseña Derecho derogado.
--
-- Con `cambio_futuro` el planificador puede hacer lo único sensato: seguir
-- sirviendo la redacción vigente y avisar de la fecha.

alter table acertium_v2.norma
  add column if not exists cambio_futuro date,
  add column if not exists cambio_futuro_ref text;

comment on column acertium_v2.norma.ultima_modificacion is
  'Fecha de PUBLICACIÓN de la última reforma, tal como la da la cabecera del BOE. No es la fecha de entrada en vigor: ver cambio_futuro.';
comment on column acertium_v2.norma.cambio_futuro is
  'Fecha en que entra en vigor una redacción ya publicada por el BOE pero todavía no vigente. NULL = no hay ninguna pendiente. Hasta esa fecha se sirve la redacción actual.';
comment on column acertium_v2.norma.cambio_futuro_ref is
  'Referencia BOE de la norma que introduce ese cambio futuro (p. ej. BOE-A-2026-13889).';

-- Lo que hay a 23/08/2026, medido con `npm run vigilar:normas -- --todas`:
-- de las 59 normas del corpus comprobadas contra el consolidado, solo una tiene
-- una redacción publicada y no vigente que toque artículos nuestros.
update acertium_v2.norma
   set cambio_futuro = date '2026-10-01',
       cambio_futuro_ref = 'BOE-A-2026-13889'
 where referencia_boe = 'BOE-A-2003-23514';
