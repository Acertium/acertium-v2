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

-- FAMILIAS MULTI-INSTRUMENTO (añadido 16/08/2026, PROMPT_015)
-- --------------------------------------------------------------------------
-- Las aserciones (b) y (c) daban por hecho "una familia = una norma". Hay
-- familias que son un BLOQUE TEMÁTICO de varios textos oficiales y que rompen
-- esa premisa siendo perfectamente correctas:
--   · CEDH = Convenio (1950) + Protocolos 11, 14 y 15
--   · TORT = Convención contra la Tortura + Protocolo facultativo + MNP
-- Para ellas, dos referencias BOE distintas NO es contaminación.
--
-- En vez de bajar el listón (dejar que (b) y (c) devuelvan filas "que ya
-- sabemos"), la excepción se DECLARA aquí. Esta lista debe coincidir con las
-- familias que tienen `referencia_fuentes` en `registro-materias.json`; si
-- aparece una familia nueva multi-instrumento, hay que añadirla en los dos
-- sitios a conciencia. Todo lo que no esté declarado sigue siendo un fallo.
--
-- La (a) —una familia repartida entre dos MATERIAS— no lleva excepción: esa es
-- la invariante que detecta de verdad un meta contaminado, y ninguna familia
-- multi-instrumento la rompe.

-- (b) Una FAMILIA no puede tener dos referencias BOE distintas en concepto_fuente,
--     salvo que esté declarada como multi-instrumento.
select
  split_part(cf.concepto_id, '-', 1) as familia,
  count(distinct cf.referencia_boe)  as n_boe,
  string_agg(distinct cf.referencia_boe, ', ') as boes
from acertium_v2.concepto_fuente cf
where split_part(cf.concepto_id, '-', 1) not in ('CEDH', 'TORT')
group by 1
having count(distinct cf.referencia_boe) > 1;

-- (c) Una MATERIA no puede tener dos normas distintas en concepto_fuente,
--     misma excepción.
select
  c.materia,
  count(distinct cf.norma) as n_normas,
  string_agg(distinct cf.norma, ' | ') as normas
from acertium_v2.concepto c
join acertium_v2.concepto_fuente cf on cf.concepto_id = c.id
where split_part(c.id, '-', 1) not in ('CEDH', 'TORT')
group by 1
having count(distinct cf.norma) > 1;

-- (d) INFORMATIVA, no es una aserción: qué instrumentos tiene de verdad cada
--     familia declarada multi-instrumento. Sirve para revisar de un vistazo que
--     la excepción sigue estando justificada y no se ha colado nada.
select
  split_part(cf.concepto_id, '-', 1) as familia,
  cf.referencia_boe,
  count(*) as conceptos
from acertium_v2.concepto_fuente cf
where split_part(cf.concepto_id, '-', 1) in ('CEDH', 'TORT')
group by 1, 2
order by 1, 2;
