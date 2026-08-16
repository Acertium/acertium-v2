-- Acertium — corrección de cotejos truncados (16/08/2026)
--
-- ✅ APLICADO EN PRODUCCIÓN el 16/08/2026. Las 6 filas quedaron con el texto
--    corregido: md5 idéntico al del lote del repo en las seis, las seis siguen
--    en `verificado` y en las seis la opción correcta aparece literal dentro del
--    nuevo cotejo. Aserciones (a), (b) y (c) de `asercion-post-carga.sql`: 0
--    filas. Se deja el script porque es idempotente: volver a correrlo actualiza
--    0 filas y sirve de comprobación.
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

-- Convenio Europeo de Derechos Humanos (ddhh-cedh.json). Mismo patrón: la cita
-- cortaba antes de completar la regla.
--   CEDH-012 (art. 9.1)  omitía la libertad de MANIFESTAR la religión.
--   CEDH-013 (art. 10.1) omitía la cláusula de no injerencia de las autoridades.
--   CEDH-017 (art. 14)   cortaba la LISTA de motivos de discriminación en
--                        "religión", presentándola como si terminara ahí.

update acertium_v2.actividad
set cotejo_fuente = '1. Toda persona tiene derecho a la libertad de pensamiento, de conciencia y de religión; este derecho implica la libertad de cambiar de religión o de convicciones, así como la libertad de manifestar su religión o sus convicciones individual o colectivamente, en público o en privado, por medio del culto, la enseñanza, las prácticas y la observancia de los ritos.'
where concepto_id = 'CEDH-012'
  and cotejo_fuente like '%libertad de cambiar de religión o de convicciones.';

update acertium_v2.actividad
set cotejo_fuente = '1. Toda persona tiene derecho a la libertad de expresión. Este derecho comprende la libertad de opinión y la libertad de recibir o de comunicar informaciones o ideas sin que pueda haber injerencia de autoridades públicas y sin consideración de fronteras.'
where concepto_id = 'CEDH-013'
  and cotejo_fuente like '%comunicar informaciones o ideas.';

update acertium_v2.actividad
set cotejo_fuente = 'El goce de los derechos y libertades reconocidos en el presente Convenio ha de ser asegurado sin distinción alguna, especialmente por razones de sexo, raza, color, lengua, religión, opiniones políticas u otras, origen nacional o social, pertenencia a una minoría nacional, fortuna, nacimiento o cualquier otra situación.'
where concepto_id = 'CEDH-017'
  and cotejo_fuente like '%lengua, religión.';

-- MININT-014 (RD 207/2024, art. 2.5). Caso distinto: no truncaba, ENGARZABA. El
-- cotejo listaba "a) …Infraestructuras y Medios para la Seguridad. b) …Sistemas
-- de Información…" como si fueran seguidos, cuando en la norma cada apartado
-- lleva detrás su descripción de funciones. La frase resultante parecía literal
-- y no existe. Se sustituye por el tramo literal del artículo, que sigue
-- sosteniendo la respuesta correcta.

update acertium_v2.actividad
set cotejo_fuente = '5. Asimismo dependen de la persona titular de la Secretaría de Estado los siguientes órganos con nivel orgánico de subdirección general: a) La Subdirección General de Planificación y Gestión de Infraestructuras y Medios para la Seguridad, a la que corresponde, sin perjuicio de las competencias legalmente atribuidas al organismo autónomo Gerencia de Infraestructuras y Equipamiento de la Seguridad del Estado, el desarrollo de las siguientes funciones:'
where concepto_id = 'MININT-014'
  and cotejo_fuente like '%Comunicaciones para la Seguridad.';

-- NO se toca CEDH-031 (art. 35), aunque la auditoría también lo marque: su texto
-- íntegro dice "en el plazo de seis meses", y el Protocolo n.º 15 —cargado en
-- ddhh-cedh-2— lo rebajó a cuatro meses. Restaurar la cita entera METERÍA el
-- plazo derogado en una pregunta que se sirve. El truncamiento la deja correcta.

-- Comprobación: las filas deben salir con ok = true.
select concepto_id,
       cotejo_fuente like '%pruebas relacionadas con los mismos.' as ok
from acertium_v2.actividad where concepto_id = 'SP-013'
union all
select concepto_id,
       cotejo_fuente like '%en esos mismos períodos.' as ok
from acertium_v2.actividad where concepto_id = 'DISC-026'
union all
select concepto_id,
       cotejo_fuente like '%la observancia de los ritos.' as ok
from acertium_v2.actividad where concepto_id = 'CEDH-012'
union all
select concepto_id,
       cotejo_fuente like '%sin consideración de fronteras.' as ok
from acertium_v2.actividad where concepto_id = 'CEDH-013'
union all
select concepto_id,
       cotejo_fuente like '%o cualquier otra situación.' as ok
from acertium_v2.actividad where concepto_id = 'CEDH-017'
union all
select concepto_id,
       cotejo_fuente like '%el desarrollo de las siguientes funciones:' as ok
from acertium_v2.actividad where concepto_id = 'MININT-014';

commit;
