-- Acertium — Barrera 3: aserción post-carga (cinturón)
-- El cargador la ejecuta DESPUÉS de cada lote. Las tres consultas deben devolver
-- 0 filas. Si alguna devuelve filas, hubo contaminación de meta: NO seguir, revisar.
-- Es independiente del registro (no confía en él): comprueba invariantes internas.

-- (a) Una FAMILIA (primer token del id) no puede repartirse entre dos materias.
--     Aquí habría saltado el fallo del 02/08 (SP-* con materia constitucion-espanola
--     conviviendo con SP-* correctos, o CE-* mezclados).
select
  split_part(c.id, '-', 1) as familia,
  count(distinct c.materia)  as n_materias,
  string_agg(distinct c.materia, ', ') as materias
from acertium_v2.concepto c
group by 1
having count(distinct c.materia) > 1;

-- (b) Una FAMILIA no puede tener dos referencias BOE distintas en concepto_fuente.
select
  split_part(cf.concepto_id, '-', 1) as familia,
  count(distinct cf.referencia_boe)  as n_boe,
  string_agg(distinct cf.referencia_boe, ', ') as boes
from acertium_v2.concepto_fuente cf
group by 1
having count(distinct cf.referencia_boe) > 1;

-- (c) Una MATERIA no puede tener dos normas distintas en concepto_fuente.
select
  c.materia,
  count(distinct cf.norma) as n_normas,
  string_agg(distinct cf.norma, ' | ') as normas
from acertium_v2.concepto c
join acertium_v2.concepto_fuente cf on cf.concepto_id = c.id
group by 1
having count(distinct cf.norma) > 1;
