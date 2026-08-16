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

-- ---------------------------------------------------------------------------
-- SEGUNDA TANDA (triaje del 16/08/2026, con el Código 600 ya completo en el
-- corpus). ✅ APLICADA EN PRODUCCIÓN. Los cuatro eran ELISIONES: unían texto
-- saltándose una cláusula intermedia sin marcarlo, así que la frase parecía
-- literal sin serlo. En los cuatro la respuesta era correcta; lo que fallaba
-- era la cita. Se repone el tramo contiguo real de la norma.
--
--   MF-025   (Ley 50/1981, art. 17) — se saltaba "sin perjuicio de las demás
--            que le atribuya este Estatuto…" entre "funciones" y "a) Sustituirá".
--   CDPN-010 (RD 49/2024, art. 5)  — empalmaba el apartado a) con el c)
--            OMITIENDO EL b) ENTERO, sin marca alguna.
--   IC-016   (Ley 8/2011, art. 5)  — se comía el inciso "(en adelante, el Sistema)".
--   ACOG-035 (RD 220/2022, art. 29) — se comía "en los términos de lo dispuesto
--            en el capítulo V del título II de este reglamento".
--
-- Verificado tras aplicar: md5 idéntico al del lote en los cuatro, los cuatro en
-- `verificado`, y la opción correcta sostenida por el cotejo (CDPN-010 solo
-- ignorando mayúsculas: la norma escribe "la Jefatura" y la opción "La
-- Jefatura"; `verificar-lote` normaliza el caso, así que su puerta lo acepta).

update acertium_v2.actividad set cotejo_fuente = 'El Teniente Fiscal del Tribunal Supremo desempeñará las siguientes funciones, sin perjuicio de las demás que le atribuya este Estatuto o el reglamento que lo desarrolle, o que pueda delegarle el Fiscal General del Estado: a) Sustituirá al Fiscal General del Estado en caso de ausencia, imposibilidad o vacante.' where concepto_id = 'MF-025';
update acertium_v2.actividad set cotejo_fuente = 'La persona titular de la Jefatura de Régimen Interior asumirá las siguientes funciones: a) Proponer a la persona titular de la Dirección del centro docente la actualización o modificación de las normas de régimen interior relativas a la actividad del centro. b) Supervisar al personal adscrito al centro, el seguimiento de la aptitud de los alumnos y las actividades del centro que no sean específicamente docentes. c) Planificar y supervisar la seguridad del centro y la correcta utilización de sus instalaciones.' where concepto_id = 'CDPN-010';
update acertium_v2.actividad set cotejo_fuente = 'El Sistema de Protección de Infraestructuras Críticas (en adelante, el Sistema) se compone de una serie de instituciones, órganos y empresas, procedentes tanto del sector público como del privado' where concepto_id = 'IC-016';
update acertium_v2.actividad set cotejo_fuente = 'Los centros de acogida de protección internacional son centros abiertos, de alojamiento colectivo, destinados a proporcionar, en los términos de lo dispuesto en el capítulo V del título II de este reglamento, acogida a las personas destinatarias' where concepto_id = 'ACOG-035';

-- NO se toca PJ-020, que la auditoría marca y seguirá marcando: el texto oficial
-- del RD 769/1987 dice "a la Unidades" (sin la «s») y "Comisión Provincial
-- Coordinación" (sin el «de»), y el lote corrigió ambas erratas. Alinear el lote
-- con la errata sería empeorar lo que lee el opositor.

-- ---------------------------------------------------------------------------
-- REASIGNACIÓN DE TEMA (16/08/2026). ✅ APLICADA. No corrige un cotejo: corrige
-- a qué tema pertenece un concepto ya cargado.
--
-- El Tema 24 (introducción a la PRL) figuraba con CERO conceptos, pero su
-- contenido no faltaba: estaba cargado bajo el Tema 25. Y como la PK de
-- `overlay_entrada` es (convocatoria_id, concepto_id), un concepto solo puede
-- estar en UN tema — no bastaba con etiquetarlo también como 24.
--
-- Se mueven los cinco que por temario son del 24 sin discusión. Duplicarlos
-- habría sido peor: el opositor vería la misma pregunta en dos temas y rompería
-- "una idea = un concepto". El progreso no se pierde: `estado_dominio` va por
-- concepto, no por tema.
--
--   PRL-004 riesgo laboral            → "Concepto general de riesgos laborales"
--   PRL-005 daños derivados del trabajo → "Daños a la salud"
--   PRL-008 condición de trabajo      → "Concepto de salud y condiciones de trabajo"
--   PRL-013 principios de la acción preventiva → "Principios generales de la
--   PRL-014 prioridad de la protección colectiva   actividad preventiva"
--
-- Se quedan en el 25 los tres dudosos (PRL-006 riesgo grave e inminente,
-- PRL-007 equipo de trabajo, PRL-009 EPI): encajan igual de bien en el 25
-- operativo y moverlos era discutible.

update acertium_v2.overlay_entrada
set tema = 'Tema 24 — Introducción a la prevención de riesgos laborales: trabajo y salud, riesgos laborales, principios de la actividad preventiva y daños a la salud'
where convocatoria_id = 'policia-nacional-2026'
  and concepto_id in ('PRL-004','PRL-005','PRL-008','PRL-013','PRL-014')
  and tema like 'Tema 25 —%';
