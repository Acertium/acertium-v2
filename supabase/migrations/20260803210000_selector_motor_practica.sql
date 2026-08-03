-- ---------------------------------------------------------------------------
-- SELECTOR DE PRÁCTICA CON EL MOTOR (el "profesor")
--
-- Hasta ahora /practicar servía preguntas con `siguiente_actividad_test()`
-- (order by random()): el motor BKT y el planificador existían pero NO decidían
-- nada. Estas dos funciones son la parte SQL del selector; la decisión (BKT +
-- planificador) sigue en `nucleo/` y se ejecuta en el servidor Next
-- (ver lib/cerebro.ts). Aquí solo se reúnen los datos y se sirve la actividad.
--
--   practicar_estado(conv, usuario) → una fila por concepto CANDIDATO con su
--     peso, su estado BKT cacheado (l, tau, last_seen; null si nunca se ha
--     visto) y sus prerrequisitos. Candidato = concepto de la convocatoria que
--     tiene al menos una actividad tipo test verificada. Así ningún concepto
--     del temario queda fuera del sistema y el planificador ve el universo
--     completo en UNA ida y vuelta.
--
--   actividad_de_concepto(cid) → una actividad test verificada al azar de ese
--     concepto (order by random() limit 1).
--
-- Dirección de `prerrequisito` (docs/004): "para A hay que saber antes B", con
-- A = origen y B = destino. Por eso los prerrequisitos de un concepto son los
-- DESTINOS de sus aristas de tipo prerrequisito.
-- ---------------------------------------------------------------------------

create or replace function acertium_v2.practicar_estado(conv text, usuario uuid)
returns table (
  concepto_id text,
  peso real,
  l real,
  tau real,
  last_seen timestamptz,
  prereqs text[]
)
language sql
stable
as $function$
  with candidatos as (
    select o.concepto_id, max(o.peso) as peso
    from acertium_v2.overlay_entrada o
    where o.convocatoria_id = conv
      and exists (
        select 1
        from acertium_v2.actividad a
        where a.concepto_id = o.concepto_id
          and a.tipo = 'test'
          and a.estado_verificacion = 'verificado'
      )
    group by o.concepto_id
  )
  select
    c.concepto_id,
    c.peso,
    e.l,
    e.tau,
    e.last_seen,
    coalesce(
      (select array_agg(r.destino)
       from acertium_v2.relacion_concepto r
       where r.origen = c.concepto_id
         and r.tipo = 'prerrequisito'),
      '{}'::text[]
    ) as prereqs
  from candidatos c
  left join acertium_v2.estado_dominio e
    on e.concepto_id = c.concepto_id
   and e.usuario_id = usuario;
$function$;

create or replace function acertium_v2.actividad_de_concepto(cid text)
returns setof acertium_v2.actividad
language sql
stable
as $function$
  select *
  from acertium_v2.actividad
  where concepto_id = cid
    and tipo = 'test'
    and estado_verificacion = 'verificado'
  order by random()
  limit 1;
$function$;
