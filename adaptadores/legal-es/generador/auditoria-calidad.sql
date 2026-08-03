-- Acertium — Auditoría de CALIDAD del banco de preguntas (estándar automático)
-- Ejecútalo cuando quieras medir el estado del banco. Objetivos del estándar:
--   · Posición de la correcta repartida (~25% cada índice; nada por encima de ~35%).
--   · La correcta NO debe ser la más larga mucho más del 25-55% (sesgo de longitud).
--   · 0 opciones duplicadas · 0 test con índice fuera de rango.

-- (1) Sesgo de POSICIÓN de la opción correcta (global)
select 'posicion' as chequeo, (respuesta->>'indice') as valor,
       count(*) n, round(100.0*count(*)/sum(count(*)) over (),1) as pct
from acertium_v2.actividad where tipo='test'
group by 2 order by 2;

-- (2) Sesgo de LONGITUD: % de preguntas donde la correcta es la más larga / la más corta
select 'longitud' as chequeo,
  round(100.0*avg(case when len_c = max_len then 1 else 0 end),1) as pct_correcta_mas_larga,
  round(100.0*avg(case when len_c = min_len then 1 else 0 end),1) as pct_correcta_mas_corta,
  round(avg(len_c),0) as media_correcta, round(avg(otras),0) as media_distractores
from (
  select length(a.respuesta->>'correcta') len_c,
    (select max(length(x)) from jsonb_array_elements_text(a.opciones) x) max_len,
    (select min(length(x)) from jsonb_array_elements_text(a.opciones) x) min_len,
    (select avg(length(x)) from jsonb_array_elements_text(a.opciones) x where x <> a.respuesta->>'correcta') otras
  from acertium_v2.actividad a where a.tipo='test' and a.opciones is not null
) t;

-- (3) Sesgo de longitud POR MATERIA (para localizar qué normas hay que reforzar)
select c.materia,
  count(*) n,
  round(100.0*avg(case when length(a.respuesta->>'correcta') =
      (select max(length(x)) from jsonb_array_elements_text(a.opciones) x) then 1 else 0 end),0) as pct_correcta_mas_larga
from acertium_v2.actividad a join acertium_v2.concepto c on c.id=a.concepto_id
where a.tipo='test' and a.opciones is not null
group by 1 having count(*)>0 order by 3 desc;

-- (4) Opciones duplicadas dentro de una pregunta (debe dar 0 filas)
select a.id, a.concepto_id, left(a.enunciado,50) enunciado
from acertium_v2.actividad a
where a.tipo='test' and a.opciones is not null
  and (select count(distinct x) from jsonb_array_elements_text(a.opciones) x) < jsonb_array_length(a.opciones);

-- (5) Test con índice fuera de rango o correcta que no está en las opciones (debe dar 0 filas)
select a.id, a.concepto_id
from acertium_v2.actividad a
where a.tipo='test' and a.opciones is not null
  and (a.opciones ->> ((a.respuesta->>'indice')::int)) is distinct from (a.respuesta->>'correcta');
