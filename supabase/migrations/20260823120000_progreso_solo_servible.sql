-- El progreso se mide sobre lo que el opositor PUEDE practicar.
--
-- 23/08/2026. `progreso_temas` y `resumen_usuario` contaban desde
-- `overlay_entrada` sin mirar `concepto.estado_verificacion`. Mientras no hubo
-- ni una fila en `pendiente_revision` daba igual; el día que el contenido de
-- consenso pasó a revisión —40 conceptos— el denominador se quedó con 40
-- conceptos inalcanzables y ningún tema podía llegar al 100 %. El Tema 29
-- (actitudes) se habría quedado en 6 de 14 para siempre.
--
-- Mismo criterio que las cuatro funciones de selección: solo `verificado`.
-- Aplicada en producción el 23/08/2026. Idempotente.

create or replace function acertium_v2.progreso_temas(conv text, usuario uuid)
 returns table(tema text, total integer, practicados integer, dominados integer)
 language sql
 stable
as $function$
  select o.tema,
         count(*)::int,
         count(e.concepto_id)::int,
         count(*) filter (where e.l >= 0.9)::int
  from acertium_v2.overlay_entrada o
  join acertium_v2.concepto c
    on c.id = o.concepto_id and c.estado_verificacion = 'verificado'
  left join acertium_v2.estado_dominio e
    on e.concepto_id = o.concepto_id and e.usuario_id = usuario
  where o.convocatoria_id = conv
  group by o.tema;
$function$;

create or replace function acertium_v2.resumen_usuario(conv text, usuario uuid)
 returns table(total_conceptos integer, practicados integer, dominados integer, eventos integer, aciertos integer, ultima timestamp with time zone)
 language sql
 stable
as $function$
  select
    (select count(*)::int from acertium_v2.overlay_entrada o
       join acertium_v2.concepto c on c.id = o.concepto_id and c.estado_verificacion = 'verificado'
       where o.convocatoria_id = conv),
    (select count(*)::int from acertium_v2.estado_dominio e
       join acertium_v2.overlay_entrada o on o.concepto_id = e.concepto_id and o.convocatoria_id = conv
       join acertium_v2.concepto c on c.id = e.concepto_id and c.estado_verificacion = 'verificado'
       where e.usuario_id = usuario),
    (select count(*)::int from acertium_v2.estado_dominio e
       join acertium_v2.overlay_entrada o on o.concepto_id = e.concepto_id and o.convocatoria_id = conv
       join acertium_v2.concepto c on c.id = e.concepto_id and c.estado_verificacion = 'verificado'
       where e.usuario_id = usuario and e.l >= 0.9),
    (select count(*)::int from acertium_v2.evento v where v.usuario_id = usuario),
    (select count(*)::int from acertium_v2.evento v where v.usuario_id = usuario and v.acierto),
    (select max(v.fecha) from acertium_v2.evento v where v.usuario_id = usuario);
$function$;
