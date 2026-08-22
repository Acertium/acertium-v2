-- `last_verified` para las 5 secciones que sí se re-ingirieron de boe.es
-- 23/08/2026, a raíz de una pregunta de Jonathan: «la fecha será de la que pone
-- en el BOE 600, compruébalo».
--
-- LO QUE SE COMPROBÓ
-- Sí y no, y el matiz importa. La fecha SALE del Código 600 —de la cabecera de
-- cada norma, no del compendio—, y ahora se puede leer en el repo porque los
-- PDFs dejaron de estar en el .gitignore:
--
--     § 35  Ley Orgánica 10/1995, del Código Penal. [Inclusión parcial]
--           «BOE» núm. 281, de 24 de noviembre de 1995
--           Última modificación: 9 de abril de 2026
--           Referencia: BOE-A-1995-25444
--
-- No es la fecha del compendio aplicada a todo: 32 valores distintos sobre 54
-- normas, 24 de ellos únicos, y la mayor agrupación real es de 3. Y los grupos
-- cuadran con reformas ómnibus reales — el Reglamento de Armas y sus ITC el
-- mismo día; la LO 2/1986 de FCSE y la LO 4/2010 disciplinaria el 29/07/2015,
-- que es la fecha de publicación de la LO 9/2015.
--
-- LA CORROBORACIÓN QUE LO CIERRA
-- Cinco secciones no vienen del Código 600 sino de una re-ingesta directa de
-- boe.es el 17/08/2026 (su `meta.fuente` lo dice). Dos de ellas son el Código
-- Penal y la LECrim, y en las dos la fecha coincide con la del PDF: 9 de abril
-- de 2026. **Dos capturas independientes, mismo valor.** La fecha es la última
-- modificación real de la norma, no un artefacto de la compilación.
--
-- QUÉ HACE ESTA MIGRACIÓN
-- Para esas cinco, ir a boe.es el 17/08/2026 ES una re-verificación con fecha.
-- Se registra. Las otras 55 siguen con `last_verified` en NULL: la fecha que
-- tienen es de la NORMA (cuándo se modificó), no de la COMPROBACIÓN (cuándo
-- fuimos a mirar), y el Código 600 es un snapshot — sus metadatos datan su
-- generación el 2026-08-02, pero eso es cuándo se generó el PDF, no cuándo
-- alguien cotejó nuestra copia contra la fuente.

begin;

update acertium_v2.norma
   set last_verified = date '2026-08-17'
 where referencia_boe in ('BOE-A-1995-25444','BOE-A-1882-6036','BOE-A-1999-1826','BOE-A-1997-12735','BOE-A-1997-17824')
   and last_verified is null;

do $$
declare n int;
begin
  select count(*) into n from acertium_v2.norma where last_verified is not null;
  -- 5 nuevas + la Constitución, que ya traía 2026-08-02 puesto a mano.
  if n <> 6 then raise exception 'esperaba 6 normas con last_verified, hay %', n; end if;
end $$;

commit;
