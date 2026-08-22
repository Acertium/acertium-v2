-- Dos señales distintas, en dos sitios distintos
-- 23/08/2026. Aplicada en producción ese día. Idempotente.
--
-- EL ERROR QUE ESTO CORRIGE
-- Se clasificaron las 60 normas por RECENCIA de la última modificación, sin ver
-- que `docs/005 §9` ya definía `volatilidad` — y la definía por otra cosa: por
-- NATURALEZA del contenido.
--
--   estable  texto casi inmutable           → Constitución, códigos estructurales
--   media    LO reformadas de vez en cuando → LO 2/1986 FCSE, Extranjería, LO 4/2015
--   volatil  CIFRAS que cambian por presupuestos/órdenes → SMI, IPREM, cuantías
--
-- Bajo esa definición la clasificación fallaba justo donde más se veía: ponía la
-- Constitución como `volatil` (última modificación 2026-05-20) cuando el propio
-- §9 la nombra como EL ejemplo de `estable`.
--
-- LO QUE SE MIDIÓ ANTES DE DECIDIR
-- ¿Hay en este corpus normas del cajón `volatil`? Se buscaron IPREM, SMI,
-- «cuantía» y cifras en euros en los 3.434 cotejos. Salen 9 normas, pero al
-- leerlas **la norma no lleva la cifra, lleva el porcentaje**:
--
--   EXTR-074  «una cantidad que represente mensualmente el 100 % del IPREM»
--   EXTR-105  «al 150 % del IPREM, en unidades familiares que incluyan…»
--   VG-019    «al 75 por 100 del salario mínimo interprofesional»
--
-- El texto NO cambia cuando cambia el IPREM. El cajón `volatil` está **vacío en
-- este corpus**, y eso es un hallazgo: aquí el riesgo no es «cuantías que caducan
-- cada enero» —de donde venía esa taxonomía, de Dependencia Fácil— sino
-- «articulado que se reforma de tarde en tarde».
--
-- LA SEPARACIÓN
--   · `norma.volatilidad`     NATURALEZA (§9). Decide `cadencia_revision`.
--   · vista `norma_revision`  RECENCIA, calculada, nunca almacenada. Dice cuál
--     mirar primero. Vocabulario DISTINTO a propósito (alta/media/baja): usar
--     las mismas palabras para las dos cosas es lo que llevó a confundirlas.
--
-- Se retiran los 53 valores derivados por recencia. Se dejan SOLO los cuatro que
-- el §9 nombra literalmente. Los otros 57 quedan sin clasificar, que es la
-- verdad — y ya no bloquea nada, porque la vista da la prioridad sin necesitar
-- esa clasificación.

begin;

update acertium_v2.norma set volatilidad = null where id <> 'constitucion-espanola';

update acertium_v2.norma set volatilidad = 'media'
 where id in ('lo-2-1986-fcse', 'lo-4-2000-extranjeria', 'lo-4-2015-seguridad-ciudadana');

update acertium_v2.norma
   set cadencia_revision = case volatilidad::text
         when 'estable' then 'anual'
         when 'media'   then 'trimestral'
         when 'volatil' then 'mensual'
       end
 where volatilidad is not null;

create or replace view acertium_v2.norma_revision as
select
  n.id, n.nombre, n.referencia_boe, n.ultima_modificacion,
  (current_date - n.ultima_modificacion) as dias_desde_modificacion,
  -- PRIORIDAD por recencia. No es volatilidad y por eso no se llama igual: dice
  -- a cuál mirar primero, no cada cuánto tocaría mirarla.
  case
    when n.ultima_modificacion is null                     then 'sin_fecha'
    when (current_date - n.ultima_modificacion) < 365 * 3  then 'alta'
    when (current_date - n.ultima_modificacion) < 365 * 10 then 'media'
    else                                                        'baja'
  end as prioridad_revision,
  n.volatilidad, n.cadencia_revision, n.last_verified,
  (current_date - n.last_verified) as dias_desde_verificacion,
  (select count(*) from acertium_v2.concepto_fuente f
     where f.referencia_boe = n.referencia_boe) as conceptos
from acertium_v2.norma n;

comment on view acertium_v2.norma_revision is
  'Las dos señales juntas y separadas: `volatilidad` (naturaleza, docs/005 §9) decide cada cuánto tocaría revisar; `prioridad_revision` (recencia, calculada aquí) dice a cuál mirar primero. Vocabulario distinto a propósito.';

do $$
declare sin_clasificar int; con_cadencia int;
begin
  select count(*) filter (where volatilidad is null),
         count(*) filter (where cadencia_revision is not null)
    into sin_clasificar, con_cadencia from acertium_v2.norma;
  if sin_clasificar <> 57 then raise exception 'esperaba 57 sin clasificar, hay %', sin_clasificar; end if;
  if con_cadencia <> 4 then raise exception 'esperaba 4 con cadencia, hay %', con_cadencia; end if;
  if (select volatilidad::text from acertium_v2.norma where id='constitucion-espanola') <> 'estable' then
    raise exception 'la Constitución debe quedar estable, que es lo que dice el §9';
  end if;
end $$;

commit;
