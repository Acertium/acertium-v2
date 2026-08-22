-- El reloj de las normas, con la fecha que YA estaba en el repo
-- 23/08/2026.
--
-- Al registrar las 61 normas se dejaron `ultima_modificacion` y `last_verified`
-- en NULL diciendo que averiguarlas exigía abrir el consolidado de cada norma en
-- el BOE, y que www.boe.es está bloqueado por la política de red del entorno.
-- Lo primero resultó ser falso: **la fecha ya estaba en el repositorio**.
--
-- Cada sección del corpus guarda, de su ingesta desde boe.es, el metadato
-- `ultima_modificacion` («9 de abril de 2026» para el Código Penal) y su
-- `publicacion`. Son 55 secciones, 54 referencias BOE distintas. No es memoria
-- ni es una estimación: es lo que decía el texto consolidado cuando se ingirió,
-- que es exactamente la línea base que la regla 7 necesita para poder preguntar
-- después «¿ha cambiado desde entonces?».
--
-- CONTRASTE QUE LO VALIDA: la Constitución era la única fila que ya tenía fecha,
-- puesta a mano — `2026-05-20`. El corpus dice «20 de mayo de 2026». Coinciden al
-- día, y la aserción de abajo lo comprueba para que un futuro cambio no la pise.
--
-- Las 13 que el corpus marca «sin modificaciones» toman su fecha de
-- `publicacion`: una norma nunca modificada tiene por texto vigente el original.
--
-- QUÉ SIGUE SIN SABERSE, y no se rellena:
--   · `last_verified` — nadie ha ido al BOE a comprobar si ha cambiado DESDE la
--     ingesta. Esa fecha es de la norma, no de la comprobación.
--   · `volatilidad` — es criterio, no dato. Ver 20260823140000.
--   · 7 normas sin fecha: los Protocolos 14 y 15 del CEDH, el propio CEDH, la
--     Convención contra la Tortura, la Ley 39/2006, la Orden PCI/487/2019 y el
--     RD 39/1997. Sus secciones del corpus no traen el metadato.

begin;
update acertium_v2.norma n set ultima_modificacion = v.d
from (values ('BOE-A-1889-4763','2025-01-03'::date),('BOE-A-1978-31229','2026-05-20'::date),('BOE-A-1979-23709','2024-08-02'::date),('BOE-A-1981-10325','2009-11-04'::date),('BOE-A-1981-12774','1981-06-05'::date),('BOE-A-2021-10957','2021-07-02'::date),('BOE-A-2015-10566','2024-08-02'::date),('BOE-A-1997-25336','2025-01-03'::date),('BOE-A-2015-11719','2025-07-30'::date),('BOE-A-2024-3793','2026-04-27'::date),('BOE-A-2023-17072','2023-08-17'::date),('BOE-A-2015-8468','2024-11-12'::date),('BOE-A-2010-8115','2015-07-29'::date),('BOE-A-2022-16582','2022-10-12'::date),('BOE-A-2024-12811','2024-06-25'::date),('BOE-A-2014-2997','2026-04-30'::date),('BOE-A-2024-814','2024-01-17'::date),('BOE-A-1986-6859','2015-07-29'::date),('BOE-A-2011-7173','2011-04-21'::date),('BOE-A-1987-14578','2024-12-23'::date),('BOE-A-2000-544','2025-03-19'::date),('BOE-A-2024-24099','2026-04-15'::date),('BOE-A-2007-4184','2015-11-09'::date),('BOE-A-2009-17242','2023-03-01'::date),('BOE-A-1995-5542','2005-05-07'::date),('BOE-A-2001-14166','2001-07-21'::date),('BOE-A-2003-19714','2003-10-25'::date),('BOE-A-2022-4978','2022-03-30'::date),('BOE-A-2014-3649','2021-05-27'::date),('BOE-A-2015-3442','2021-02-23'::date),('BOE-A-2011-7630','2022-07-29'::date),('BOE-A-2011-8849','2011-05-21'::date),('BOE-A-1995-25444','2026-04-09'::date),('BOE-A-1985-12666','2025-02-17'::date),('BOE-A-1882-6036','2026-04-09'::date),('BOE-A-1984-11620','2024-11-14'::date),('BOE-A-1982-837','2025-01-03'::date),('BOE-A-2015-4606','2022-09-07'::date),('BOE-A-2004-21760','2022-09-07'::date),('BOE-A-2007-6115','2024-08-02'::date),('BOE-A-2023-5366','2023-03-01'::date),('BOE-A-1995-24292','2026-04-09'::date),('BOE-A-2006-624','2006-01-17'::date),('BOE-A-2010-2161','2014-12-24'::date),('BOE-A-2018-16673','2025-12-27'::date),('BOE-A-2021-8806','2022-07-29'::date),('BOE-A-1983-10613','2012-03-01'::date),('BOE-A-1993-6202','2025-04-04'::date),('BOE-A-1999-1826','2026-06-26'::date),('BOE-A-2003-23514','2025-06-17'::date),('BOE-A-2015-13138','2015-12-04'::date),('BOE-A-1997-12735','2021-12-08'::date),('BOE-A-1997-17824','2004-11-13'::date),('BOE-A-2020-9134','2025-04-04'::date)) as v(ref, d)
where n.referencia_boe = v.ref and n.ultima_modificacion is null;

do $$
declare con int;
begin
  select count(*) into con from acertium_v2.norma where ultima_modificacion is not null;
  if con < 54 then raise exception 'esperaba al menos 54 normas con fecha, hay %', con; end if;
  if (select ultima_modificacion from acertium_v2.norma where id='constitucion-espanola') <> '2026-05-20'::date then
    raise exception 'se ha alterado la fecha de la Constitución';
  end if;
end $$;
commit;
