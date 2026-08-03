-- ---------------------------------------------------------------------------
-- Muestreo aleatorio EN LA BASE para /practicar y /simulacro.
--
-- Estas dos funciones YA están aplicadas en la BD de producción (Acertium-prod);
-- esta migración las versiona tal cual están (obtenidas con
-- pg_get_functiondef), para que el repo sea la fuente de verdad. Son
-- idempotentes (CREATE OR REPLACE): aplicarlas de nuevo no cambia nada.
--
-- Motivo: antes el servidor descargaba TODO el banco de actividades verificadas
-- y elegía en memoria. Con `order by random() limit N` la base devuelve solo las
-- filas necesarias. `respuesta` viaja en la fila pero nunca sale del servidor
-- (se usa para corregir y para construir las alternativas; ver lib/cerebro.ts y
-- lib/simulacro-data.ts).
-- ---------------------------------------------------------------------------

-- Una actividad tipo test verificada al azar (modo práctica).
CREATE OR REPLACE FUNCTION acertium_v2.siguiente_actividad_test()
 RETURNS SETOF acertium_v2.actividad
 LANGUAGE sql
 STABLE
AS $function$
  select *
  from acertium_v2.actividad
  where estado_verificacion = 'verificado' and tipo = 'test'
  order by random()
  limit 1;
$function$;

-- n actividades tipo test verificadas al azar de una convocatoria (simulacro).
CREATE OR REPLACE FUNCTION acertium_v2.simulacro_muestra(conv text, n integer)
 RETURNS SETOF acertium_v2.actividad
 LANGUAGE sql
 STABLE
AS $function$
  select a.*
  from acertium_v2.actividad a
  where a.estado_verificacion = 'verificado'
    and a.tipo = 'test'
    and a.concepto_id in (
      select o.concepto_id from acertium_v2.overlay_entrada o
      where o.convocatoria_id = conv
    )
  order by random()
  limit n;
$function$;
