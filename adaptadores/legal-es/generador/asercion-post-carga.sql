-- Acertium — Barrera 3: aserción post-carga (cinturón)
-- El cargador la ejecuta DESPUÉS de cada lote. Las CUATRO consultas (a), (b), (c) y (e)
-- deben devolver 0 filas. Si alguna devuelve filas: NO seguir, revisar. Las tres
-- primeras cazan contaminación de meta; la (e), conceptos que el motor no puede
-- preguntar.
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

-- (e) Un CONCEPTO no puede quedarse sin ninguna actividad servible.
--     Añadida el 19/08/2026 tras encontrar el agujero del Tema 2: la Constitución
--     se había cargado entera como grafo, pero las preguntas solo se generaron para
--     los Títulos II a X. El Título I —derechos fundamentales— tenía 92 conceptos y
--     11 preguntas, y NADA lo detectaba: ni la pantalla de temas, que cuenta
--     conceptos, ni `docs/cobertura-epigrafes.md`, que cruza títulos y resúmenes, ni
--     `verificar-lote`, que solo mira dentro del lote que se está cargando.
--
--     No es un problema cosmético de cobertura: rompe el motor. `siguienteActividad()`
--     (lib/cerebro.ts) pide al planificador un concepto y luego una actividad suya con
--     `actividad_de_concepto`; si el concepto no tiene ninguna, la función no devuelve
--     nada y el runtime CAE AL FALLBACK aleatorio (`siguiente_actividad_test`). Es
--     decir: la decisión del BKT se descarta en silencio y el opositor recibe una
--     pregunta de cualquier otro tema. Cuantos más conceptos mudos, más se degrada el
--     planificador hasta ser indistinguible del azar.
--     OJO al filtro, que es exactamente el de `actividad_de_concepto`: tipo = 'test'
--     Y estado 'verificado'. El MVP es SOLO tipo test, porque ese es el formato del
--     examen oficial; el runtime no sirve ningún otro tipo y no debe hacerlo.
--     Al escribir esta aserción la comprobé con una consulta más laxa ("¿tiene
--     alguna actividad?") y di por bueno un 0 que era falso: quedaban SEIS conceptos
--     del Tema 2 con actividades verificadas de tipo `huecos`, `vf` y `corta` pero
--     ninguna `test` —entre ellos el art. 14, igualdad ante la ley—. Son el residuo
--     de una prueba de formatos que hizo otro agente, no contenido del MVP, y para
--     el runtime dejaban esos conceptos tan mudos como los que no tenían nada.
--
--     Los conceptos cuya única actividad está en `pendiente_revision` NO salen aquí:
--     van en la (f), porque no son un fallo sino una cola de trabajo de Jonathan.
select
  c.id,
  c.materia,
  (select o.tema from acertium_v2.overlay_entrada o where o.concepto_id = c.id limit 1) as tema
from acertium_v2.concepto c
where not exists (
  select 1 from acertium_v2.actividad a
  where a.concepto_id = c.id
    and a.tipo = 'test'
    and a.estado_verificacion = 'verificado'
)
and not exists (
  select 1 from acertium_v2.actividad a
  where a.concepto_id = c.id
    and a.estado_verificacion = 'pendiente_revision'
);

-- (f) INFORMATIVA, no bloquea: conceptos que hoy el runtime NO puede preguntar
--     porque todo su contenido está en revisión (`consenso` del contrato de fuentes
--     no-BOE). No es un defecto —el contrato manda que no se sirvan hasta que
--     Jonathan los apruebe en /admin—, pero mientras estén así degradan el
--     planificador igual que un concepto mudo, así que conviene tenerlos a la vista
--     y no dejar que la cola crezca sin control.
select
  split_part(c.id, '-', 1) as familia,
  count(*) as conceptos_en_espera
from acertium_v2.concepto c
where not exists (
  select 1 from acertium_v2.actividad a
  where a.concepto_id = c.id and a.tipo = 'test' and a.estado_verificacion = 'verificado'
)
and exists (
  select 1 from acertium_v2.actividad a
  where a.concepto_id = c.id and a.estado_verificacion = 'pendiente_revision'
)
group by 1
order by 2 desc;

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
