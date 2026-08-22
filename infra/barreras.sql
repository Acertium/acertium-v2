-- Acertium — pipeline / barreras de integridad (Doc 005 §2)
-- Se ejecuta contra el schema acertium_v2 al final de CADA carga.
-- Devuelve una fila por barrera: OK (0 fallos) o FALLO (>0). Si algo sale FALLO,
-- la carga NO se da por buena.
-- Cubre G1, G2, G4(parcial), G5, G6 y G7. La verificación de contenido (G4
-- completa) la hace verificador-cotejo.mjs; la cobertura (G3) es una auditoría
-- aparte.
--
-- REVISIÓN DEL 23/08/2026 — por qué se reescribieron G1, G5 y G6
-- Tres de las once barreras llevaban meses en rojo por defectos SUYOS, no del
-- banco: G1 con 463 fallos, G5 con 3.087 y G6 con 1. Una barrera que grita sin
-- motivo no es una barrera: es un panel que nadie mira, y debajo estaban
-- enterradas G6 y G7, que sí decían algo. Lo que cambió, medido:
--
--   G1  exigía `referencia_boe` a TODAS las fuentes. Pero 18 familias —DUDH,
--       CIBER, INTEL, ORTO, SOST, DROGA, REDES, GRAM, ETICA, INMIG, GEOD, GLOB,
--       ACTIT, SEGT, SO, OMS, INSST, DGT— no están en el BOE por diseño, y el
--       propio `registro-materias.json` las declara con `referencia_boe: ""`.
--       Los 463 fallos eran exactamente esas 18. La barrera es anterior al
--       carril no-BOE.
--       NO se ha aflojado la comprobación, se ha movido a donde vive el dato
--       que la decide: `verificar-meta.mjs` cruza familia↔materia↔referencia
--       contra el registro ANTES de cargar, y ahí sí sabe si a esa familia le
--       toca BOE. Aquí queda el invariante que sí es de la base: que la fuente
--       sea identificable y que un BOE-A, si lo hay, esté bien formado.
--
--   G5  exigía el patrón `FAM-SEC-NNN`. El banco usa CUATRO formas, todas
--       deliberadas: `SEGT-002` (2.663), `CE-T1-018` (256),
--       `CP-189ter-persona-juridica` (375) y `CP-020-6-7` (49). La barrera
--       codificaba una sola. Ahora comprueba lo que de verdad importa —familia
--       en mayúsculas + al menos un localizador, todo alfanumérico—, que es lo
--       que pilla un `undefined`, un id con espacios o uno sin familia.
--
--   G6  agrupaba por materia+título y marcaba `CP-189ter-persona-juridica`
--       contra `CP-197quinquies-persona-juridica`. No es un duplicado: son DOS
--       ARTÍCULOS DISTINTOS del Código Penal que comparten título. Añadiendo el
--       artículo al agrupamiento quedan 0 duplicados reales.
--
-- Y una que se rompió al arreglar otra cosa: G5 daba por válidos tres estados
-- (verificado/pendiente/rechazado) y el enum tiene un cuarto, `pendiente_revision`
-- (migración 20260816120000). El día que el contenido de consenso pasó a
-- revisión —40 conceptos, 53 preguntas— esta barrera los habría marcado a todos.

with
-- G1 · la fuente es identificable. Que sea del BOE o no lo decide
-- `verificar-meta.mjs` contra `registro-materias.json`, que es donde está el
-- dato; aquí se comprueba que ninguna fuente sea anónima y que una referencia
-- del BOE, si se declara, tenga la forma BOE-A-AAAA-N.
g1a as (select count(*) n from acertium_v2.concepto_fuente
          where coalesce(btrim(norma), '') = '' or coalesce(btrim(articulo), '') = ''),
g1b as (select count(*) n from acertium_v2.concepto_fuente
          where coalesce(referencia_boe, '') <> ''
            and referencia_boe !~ '^BOE-A-[0-9]{4}-[0-9]+$'),
g2a as (select count(*) n from acertium_v2.concepto c
          where not exists (select 1 from acertium_v2.concepto_fuente f where f.concepto_id = c.id)),
g2b as (select count(*) n from acertium_v2.overlay_entrada o
          where not exists (select 1 from acertium_v2.concepto c where c.id = o.concepto_id)),
g2c as (select count(*) n from acertium_v2.relacion_concepto r
          where not exists (select 1 from acertium_v2.concepto c where c.id = r.destino)
             or not exists (select 1 from acertium_v2.concepto c where c.id = r.origen)),
g4a as (select count(*) n from acertium_v2.actividad
          where estado_verificacion = 'verificado' and (cotejo_fuente is null or cotejo_fuente = '')),
-- G4 · un concepto servible no puede colgar de una explicación sin revisar: al
-- opositor le llegarían las dos cosas en la misma pantalla.
g4b as (select count(*) n from acertium_v2.concepto
          where estado_verificacion = 'verificado' and explicacion_verificacion <> 'verificado'),
-- G5 · familia en mayúsculas + al menos un localizador. Ver la nota de arriba:
-- el banco usa cuatro convenciones y las cuatro son deliberadas.
g5a as (select count(*) n from acertium_v2.concepto
          where id !~ '^[A-Z][A-Z0-9]*(-[A-Za-z0-9]+)+$'),
g5b as (select count(*) n from acertium_v2.concepto
          where estado_verificacion not in ('verificado','pendiente','rechazado','pendiente_revision')),
g5c as (select count(*) n from acertium_v2.actividad
          where estado_verificacion not in ('verificado','pendiente','rechazado','pendiente_revision')),
-- G6 · duplicado = misma materia, mismo título Y mismo artículo. Sin el
-- artículo se marcan como duplicados dos preceptos distintos que se llaman
-- igual, que en el Código Penal pasa a menudo.
g6a as (select count(*) n from (
          select c.materia, lower(c.titulo) t, f.articulo
          from acertium_v2.concepto c
          left join acertium_v2.concepto_fuente f on f.concepto_id = c.id
          group by 1, 2, 3 having count(*) > 1) x),
g6b as (select count(*) n from acertium_v2.relacion_concepto where origen = destino),
g7a as (select count(distinct f.referencia_boe) n from acertium_v2.concepto_fuente f
          where f.referencia_boe is not null and f.referencia_boe <> ''
            and not exists (select 1 from acertium_v2.norma nm where nm.referencia_boe = f.referencia_boe)),
-- G7 se desdobló el 23/08/2026 porque «sin volatilidad/last_verified» metía en
-- el mismo saco tres trabajos distintos, y el panel no dejaba ver cuál avanzaba:
--   · la FECHA DE LA NORMA sale del corpus, que ya la traía de la ingesta;
--   · la CLASIFICACIÓN es criterio, y nadie la ha hecho;
--   · la RE-VERIFICACIÓN es ir al BOE hoy, y nadie ha ido.
--
-- OJO con la tercera: `volatilidad` es la NATURALEZA de la norma (docs/005 §9),
-- no cuándo se tocó por última vez. Lo segundo es `prioridad_revision` y se
-- calcula en la vista `norma_revision`; no se almacena y por eso no se cuenta
-- aquí. Confundir las dos ya costó una clasificación entera que hubo que
-- deshacer.
g7b as (select count(*) n from acertium_v2.norma where ultima_modificacion is null),
g7c as (select count(*) n from acertium_v2.norma where volatilidad is null),
g7d as (select count(*) n from acertium_v2.norma where last_verified is null),
res as (
  select 'G1 · fuente sin norma o sin localizador'      as barrera, (select n from g1a) as fallos union all
  select 'G1 · referencia_boe mal formada',               (select n from g1b) union all
  select 'G2 · conceptos sin fuente',                     (select n from g2a) union all
  select 'G2 · overlay sin concepto',                     (select n from g2b) union all
  select 'G2 · aristas del grafo rotas',                  (select n from g2c) union all
  select 'G4 · actividad verificada sin cotejo',          (select n from g4a) union all
  select 'G4 · concepto servible con explicación sin revisar', (select n from g4b) union all
  select 'G5 · ids fuera de convención',                  (select n from g5a) union all
  select 'G5 · estado_verificacion inválido (concepto)',  (select n from g5b) union all
  select 'G5 · estado_verificacion inválido (actividad)', (select n from g5c) union all
  select 'G6 · conceptos duplicados (materia+título+artículo)', (select n from g6a) union all
  select 'G6 · auto-referencias en el grafo',             (select n from g6b) union all
  select 'G7 · norma citada sin registrar',               (select n from g7a) union all
  select 'G7 · norma sin fecha de última modificación',   (select n from g7b) union all
  select 'G7 · norma sin clasificar por naturaleza',      (select n from g7c) union all
  select 'G7 · norma nunca re-verificada (last_verified)',(select n from g7d)
)
select barrera,
       case when fallos = 0 then 'OK' else 'FALLO' end as estado,
       fallos
from res
order by estado desc, barrera;
