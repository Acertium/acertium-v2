-- Clasificación de `volatilidad` derivada de la fecha de última modificación
-- 23/08/2026. Encargo de Jonathan: «clasifica tú la volatilidad de las 60 y lo
-- reviso».
--
-- QUÉ ES ESTO, DICHO EXACTO
-- NO es una medida de volatilidad. Es una DERIVACIÓN a partir de la única señal
-- que consta en el repositorio: cuándo se modificó la norma por última vez,
-- según el metadato `ultima_modificacion` que cada sección del corpus guardó de
-- su ingesta desde boe.es.
--
-- Se probó antes si había algo mejor. `acertium_v2.articulo_reforma` tiene DOS
-- filas, las dos de la Constitución: no da para contar reformas por norma. Y sin
-- acceso al BOE (bloqueado por la política de red del entorno) no hay forma de
-- obtener el historial completo de modificaciones, que sería la señal buena.
--
-- LA REGLA, explícita para que se pueda discutir y rehacer:
--   volatil   última modificación hace  < 3 años
--   media     entre 3 y 10 años
--   estable   ≥ 10 años, o nunca modificada desde su publicación
--
-- El corte en 3 años es la ventana en la que una norma sigue en territorio
-- legislativo activo; los 10 años, evidencia fuerte de que ya no se toca. El
-- reparto que producen sobre las 53 clasificables no está degenerado —26 / 13 /
-- 15— así que la regla separa algo.
--
-- TRES LÍMITES QUE HAY QUE TENER DELANTE AL REVISAR
--
-- 1. LA SEÑAL ES DE LA NORMA; EL CONTENIDO ES DEL ARTÍCULO. `ultima_modificacion`
--    se refiere a la norma entera. El banco usa 112 conceptos de la LECrim, que
--    tiene ~1.000 artículos: una reforma del art. 324 la marca «volátil» sin
--    tocar nada de lo que estudiamos. Lo mismo con el Código Civil, del que solo
--    se usa el Título Preliminar. Así que «volátil» aquí significa «esta norma
--    está en movimiento, hay que mirarla», no «nuestro contenido está caducado».
--
-- 2. LA RECENCIA PREDICE EL FUTURO SOLO EN PARTE. Que una norma lleve 10 años
--    quieta no garantiza que siga quieta. La LO 4/2015 de seguridad ciudadana
--    sale `media` (2021) y su reforma lleva años en trámite parlamentario.
--
-- 3. LA FECHA ES LA DE LA INGESTA, no la de hoy. Una norma reformada después de
--    que se ingiriera su sección parece más estable de lo que es. El sesgo va en
--    la dirección mala, y solo lo cierra `last_verified` — que sigue en NULL en
--    las 60 porque exige ir al BOE.
--
-- LAS 7 SIN FECHA SE QUEDAN SIN CLASIFICAR. Protocolos 14 y 15 del CEDH, el
-- propio CEDH, la Convención contra la Tortura, la Ley 39/2006, la Orden
-- PCI/487/2019 y el RD 39/1997: sus secciones del corpus no traen el metadato.
-- No se clasifica lo que no se puede medir.
--
-- La fecha de referencia va FIJA (no `current_date`) para que esto sea
-- reproducible y para que conste cuándo se hizo la clasificación.

begin;

update acertium_v2.norma
   set volatilidad = case
         when (date '2026-08-23' - ultima_modificacion) / 365.25 <  3 then 'volatil'
         when (date '2026-08-23' - ultima_modificacion) / 365.25 < 10 then 'media'
         else 'estable'
       end::acertium_v2.volatilidad
 where volatilidad is null
   and ultima_modificacion is not null;

do $$
declare v int; m int; e int; sinc int;
begin
  select count(*) filter (where volatilidad = 'volatil'),
         count(*) filter (where volatilidad = 'media'),
         count(*) filter (where volatilidad = 'estable'),
         count(*) filter (where volatilidad is null)
    into v, m, e, sinc
  from acertium_v2.norma;
  raise notice 'volatil=% media=% estable=% sin clasificar=%', v, m, e, sinc;
  if sinc <> 7 then raise exception 'esperaba 7 sin clasificar (las que no tienen fecha), hay %', sinc; end if;
  -- La Constitución tenía `estable` puesto a mano; con fecha 2026-05-20 la regla
  -- diría `volatil`. El WHERE la respeta, y esto lo comprueba: si cambiara, es
  -- que la clasificación a mano se está pisando.
  if (select volatilidad::text from acertium_v2.norma where id = 'constitucion-espanola') <> 'estable' then
    raise exception 'se ha pisado la clasificación a mano de la Constitución';
  end if;
end $$;

commit;
