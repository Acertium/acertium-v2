-- Retirar el NOT NULL de `volatilidad` no bastaba: la columna tenía
-- DEFAULT 'media'.
--
-- 23/08/2026, corrigiendo un error de la misma tarde. Al registrar las 60
-- normas se dejó `volatilidad` sin poner, entendiendo que quedarían NULL =
-- «sin clasificar». No fue así: el DEFAULT las marcó a todas como `media`, y la
-- base pasó a afirmar una clasificación que nadie había hecho — exactamente lo
-- que se quería evitar, y encima de forma invisible, porque la barrera G7 las
-- contaba como resueltas (0 fallos) cuando el trabajo estaba entero por hacer.
--
-- Un DEFAULT en una columna de JUICIO es una trampa: convierte «no lo sé» en
-- una respuesta con aspecto de dato. Se retira, y las 60 vuelven a NULL.
-- La Constitución conserva su `estable`, que sí se puso a mano.
--
-- Aplicada en producción el 23/08/2026. Idempotente.

alter table acertium_v2.norma alter column volatilidad drop default;

update acertium_v2.norma
   set volatilidad = null
 where id <> 'constitucion-espanola';

do $$
declare sin_clasificar int; ce text;
begin
  select count(*) into sin_clasificar from acertium_v2.norma where volatilidad is null;
  if sin_clasificar <> 60 then raise exception 'esperaba 60 sin clasificar, hay %', sin_clasificar; end if;
  select volatilidad::text into ce from acertium_v2.norma where id = 'constitucion-espanola';
  if ce <> 'estable' then raise exception 'la Constitución ha perdido su clasificación: %', ce; end if;
end $$;

comment on column acertium_v2.norma.volatilidad is
  'NULL = sin clasificar. Sin NOT NULL y SIN DEFAULT desde el 23/08/2026: el DEFAULT ''media'' convertía un juicio no hecho en un dato con aspecto de verdadero.';
