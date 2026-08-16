-- Acertium — corrección de cotejos truncados (16/08/2026)
--
-- Detectados por `auditar-corpus.mjs`. Los dos cotejos cortaban la frase del
-- artículo en una coma y la cerraban con punto, presentando como cita completa
-- una regla a la que le falta una cláusula. `verificar-lote` no podía verlo: su
-- normalización descarta la puntuación, así que la cita truncada le resulta
-- indistinguible de la entera.
--
-- Ninguno de los dos inventa texto ni hace incorrecta la respuesta: cada palabra
-- del cotejo está en la norma y la opción correcta se sigue sosteniendo. Lo que
-- se corrige es la CITA, que omitía lo que sigue:
--
--   SP-013  (Ley 5/2014, art. 14.2) — la pregunta menciona "hechos delictivos" y
--           la cita cortaba justo antes de "así como todo hecho delictivo del que
--           tuviesen conocimiento…": la mitad de lo preguntado no estaba citada.
--   DISC-026 (LO 4/2010, art. 50.2) — omitía "siempre que durante aquel tiempo no
--           hubiese sido sancionado el interesado…", que CONDICIONA la
--           cancelación de la anotación.
--
-- Los lotes ya están corregidos en el repo (ley-5-2014.json,
-- lo-4-2010-disciplinario.json); esto pone al día lo YA CARGADO en la base.
-- Idempotente: si ya está corregido, actualiza 0 filas.

begin;

update acertium_v2.actividad
set cotejo_fuente = 'Las empresas de seguridad, los despachos de detectives y el personal de seguridad privada deberán comunicar a las Fuerzas y Cuerpos de Seguridad competentes, tan pronto como sea posible, cualesquiera circunstancias o informaciones relevantes para la prevención, el mantenimiento o restablecimiento de la seguridad ciudadana, así como todo hecho delictivo del que tuviesen conocimiento en el ejercicio de su actividad o funciones, poniendo a su disposición a los presuntos delincuentes, así como los instrumentos, efectos y pruebas relacionadas con los mismos.'
where concepto_id = 'SP-013'
  and cotejo_fuente like '%restablecimiento de la seguridad ciudadana.';

update acertium_v2.actividad
set cotejo_fuente = 'Transcurridos seis meses desde el cumplimiento de la sanción si se tratara de faltas leves, o uno y tres años, según se trate de faltas graves o muy graves no sancionadas con separación del servicio, respectivamente, se acordará de oficio la cancelación de aquellas anotaciones, siempre que durante aquel tiempo no hubiese sido sancionado el interesado por hechos cometidos en esos mismos períodos.'
where concepto_id = 'DISC-026'
  and cotejo_fuente like '%cancelación de aquellas anotaciones.';

-- Comprobación: las dos filas deben salir con ok = true.
select concepto_id,
       cotejo_fuente like '%pruebas relacionadas con los mismos.' as ok
from acertium_v2.actividad where concepto_id = 'SP-013'
union all
select concepto_id,
       cotejo_fuente like '%en esos mismos períodos.' as ok
from acertium_v2.actividad where concepto_id = 'DISC-026';

commit;
