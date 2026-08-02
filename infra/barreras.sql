-- Acertium — pipeline / barreras de integridad (Doc 005 §2)
-- Se ejecuta contra el schema acertium_v2 al final de CADA carga.
-- Devuelve una fila por barrera: OK (0 fallos) o FALLO (>0). Si algo sale FALLO,
-- la carga NO se da por buena.
-- Cubre G1, G2, G4(parcial), G5 y G6. La verificación de contenido (G4 completa)
-- la hace verificador-cotejo.mjs; la cobertura (G3) es una auditoría aparte.

with
g1 as (select count(*) n from acertium_v2.concepto_fuente
         where referencia_boe is null or referencia_boe = ''),
g2a as (select count(*) n from acertium_v2.concepto c
          where not exists (select 1 from acertium_v2.concepto_fuente f where f.concepto_id = c.id)),
g2b as (select count(*) n from acertium_v2.overlay_entrada o
          where not exists (select 1 from acertium_v2.concepto c where c.id = o.concepto_id)),
g2c as (select count(*) n from acertium_v2.relacion_concepto r
          where not exists (select 1 from acertium_v2.concepto c where c.id = r.destino)
             or not exists (select 1 from acertium_v2.concepto c where c.id = r.origen)),
g4a as (select count(*) n from acertium_v2.actividad
          where estado_verificacion = 'verificado' and (cotejo_fuente is null or cotejo_fuente = '')),
g5a as (select count(*) n from acertium_v2.concepto
          where id !~ '^[A-Z0-9]+-[A-Z0-9]+-[0-9]{3}$'),
g5b as (select count(*) n from acertium_v2.concepto
          where estado_verificacion not in ('verificado','pendiente','rechazado')),
g6a as (select count(*) n from (
          select materia, lower(titulo) t from acertium_v2.concepto
          group by materia, lower(titulo) having count(*) > 1) x),
g6b as (select count(*) n from acertium_v2.relacion_concepto where origen = destino),
g7a as (select count(distinct f.referencia_boe) n from acertium_v2.concepto_fuente f
          where f.referencia_boe is not null
            and not exists (select 1 from acertium_v2.norma nm where nm.referencia_boe = f.referencia_boe)),
g7b as (select count(*) n from acertium_v2.norma
          where last_verified is null or volatilidad is null),
res as (
  select 'G1 · fuente oficial (referencia_boe)'        as barrera, (select n from g1)  as fallos union all
  select 'G2 · conceptos sin fuente',                    (select n from g2a) union all
  select 'G2 · overlay sin concepto',                    (select n from g2b) union all
  select 'G2 · aristas del grafo rotas',                 (select n from g2c) union all
  select 'G4 · actividad verificada sin cotejo',         (select n from g4a) union all
  select 'G5 · ids fuera de convención',                 (select n from g5a) union all
  select 'G5 · estado_verificacion inválido',            (select n from g5b) union all
  select 'G6 · conceptos duplicados (materia+título)',   (select n from g6a) union all
  select 'G6 · auto-referencias en el grafo',            (select n from g6b) union all
  select 'G7 · norma citada sin registrar',              (select n from g7a) union all
  select 'G7 · norma sin volatilidad/last_verified',     (select n from g7b)
)
select barrera,
       case when fallos = 0 then 'OK' else 'FALLO' end as estado,
       fallos
from res
order by estado desc, barrera;
