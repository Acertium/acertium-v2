-- Acertium V2 — el contenido `consenso` deja de servirse (regla 5)
-- 23/08/2026.
--
-- QUÉ PASABA
-- `CLAUDE.md` regla 5 y `docs/contrato-fuentes-no-boe.md` §2 dicen que el
-- contenido de `tipo_fuente = consenso` se carga como `pendiente_revision` y NO
-- se sirve hasta que un humano lo promueva. El mecanismo estaba entero:
--
--   · el enum tiene el valor (migración 20260816120000)
--   · `estadoSegunTipoFuente('consenso')` devuelve `pendiente_revision`, con
--     self-test en `nucleo/verificar-fuente.mjs`
--   · las cuatro funciones de selección filtran por `verificado`
--   · hay pantalla de revisión en /admin con aprobar/rechazar
--
-- …y aun así, medido el 23/08/2026: **cero filas en todo el schema usaban
-- `pendiente_revision`**, y los 40 conceptos que los lotes del repo declaran
-- `consenso` estaban en base como `verificado`, sirviendo 53 preguntas. La
-- regla estaba escrita, probada y no aplicada — se cargaron antes de que el
-- mecanismo existiera, o se promovieron sin revisión.
--
-- Ninguna de las 53 se había respondido todavía (0 eventos), así que no ha
-- llegado a contaminar ningún estado de dominio.
--
-- QUÉ SON
-- Temas 28-33: teorías criminológicas (Beccaria, Lombroso, Merton, Sutherland),
-- actitudes y prejuicio (Allport, Rokeach, Katz, Adorno), globalización y
-- antiglobalización, migración, geografía humana. Fuente de consenso —
-- Wikipedia, Britannica, manuales—, no norma ni autoridad.
--
-- ESTO NO BORRA NADA. Es un cambio de estado y tiene vuelta: la pantalla
-- /admin las lista en la cola de revisión y `resolverPendientes()` las devuelve
-- a `verificado` de una en una o por familia. El concepto viaja con su
-- actividad, igual que hace esa función.
--
-- La lista es explícita a propósito: sale de `tipo_fuente: "consenso"` en
-- `adaptadores/legal-es/generador/lotes/*.json`, que es el único sitio donde
-- ese campo está registrado (`concepto_fuente` no tiene columna `tipo_fuente`).

begin;

create temporary table _consenso(id text primary key) on commit drop;
insert into _consenso(id) values
 ('ACTIT-007'),('ACTIT-008'),('ACTIT-009'),('ACTIT-010'),('ACTIT-011'),('ACTIT-012'),('ACTIT-013'),('ACTIT-014'),
 ('ETICA-004'),('ETICA-005'),('ETICA-006'),('ETICA-007'),('ETICA-008'),('ETICA-009'),('ETICA-010'),
 ('GEOD-004'),('GEOD-005'),('GEOD-021'),
 ('GLOB-011'),('GLOB-012'),('GLOB-013'),('GLOB-014'),('GLOB-015'),('GLOB-016'),
 ('INMIG-014'),('INMIG-015'),('INMIG-016'),('INMIG-017'),('INMIG-018'),
 ('SEGT-008'),('SEGT-011'),('SEGT-013'),('SEGT-014'),('SEGT-015'),('SEGT-016'),('SEGT-017'),('SEGT-018'),('SEGT-019'),('SEGT-020'),('SEGT-021');

-- 1) Las actividades dejan de servirse.
update acertium_v2.actividad a
   set estado_verificacion = 'pendiente_revision'
  from _consenso k
 where a.concepto_id = k.id and a.estado_verificacion = 'verificado';

-- 2) Y el concepto viaja con ellas: un concepto `verificado` con preguntas
--    pendientes deja al selector con contenido a medio revisar, que es justo la
--    incoherencia que evita `resolverPendientes()` en lib/admin.ts.
update acertium_v2.concepto c
   set estado_verificacion = 'pendiente_revision',
       explicacion_verificacion = 'pendiente_revision'
  from _consenso k
 where c.id = k.id and c.estado_verificacion = 'verificado';

-- 3) Aserciones.
do $$
declare n_con int; n_act int; n_ev int;
begin
  select count(*) into n_con from acertium_v2.concepto c join _consenso k on k.id=c.id
   where c.estado_verificacion <> 'pendiente_revision';
  if n_con <> 0 then raise exception '% conceptos de consenso siguen servibles', n_con; end if;

  select count(*) into n_act from acertium_v2.actividad a join _consenso k on k.id=a.concepto_id
   where a.estado_verificacion <> 'pendiente_revision';
  if n_act <> 0 then raise exception '% actividades de consenso siguen servibles', n_act; end if;

  -- Nada fuera de la lista se ha tocado.
  select count(*) into n_ev from acertium_v2.actividad a
   where a.estado_verificacion = 'pendiente_revision'
     and not exists (select 1 from _consenso k where k.id = a.concepto_id);
  if n_ev <> 0 then raise exception '% actividades ajenas a la lista quedaron pendientes', n_ev; end if;
end $$;

commit;
