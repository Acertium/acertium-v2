# -*- coding: utf-8 -*-
"""Construye el lote DEP (Ley 39/2006, de Dependencia, Tema 23).

Mismo método que build_rsp.py: los cotejos se EXTRAEN del corpus §55, y el script
aborta si alguno no es literal en la fuente o si una correcta no está literal en su cotejo.
"""
import json, sys
from pathlib import Path

RAIZ = Path("/home/user/acertium-v2")
COR = json.load(open(RAIZ / "datos/legal-es/boe-600-pn/corpus/seccion-055.json", encoding="utf-8"))
A = {a["ref"]: a["texto"] for a in COR["articulos"]}

T23 = "Tema 23 — Políticas de igualdad, protección y no discriminación: la LO 3/2007 de igualdad efectiva y la LO 1/2004 de violencia de género"

ITEMS = [
 ("DEP-001","1","Objeto de la Ley de Dependencia",
  "La Ley regula las condiciones básicas que garantizan la igualdad en el ejercicio del derecho subjetivo de ciudadanía a la promoción de la autonomía personal y atención a las personas en situación de dependencia, creando el Sistema para la Autonomía y Atención a la Dependencia.",
  "La clave es «derecho subjetivo de ciudadanía»: no es una ayuda graciable, es un derecho exigible.",
  "¿Cuál es el objeto de la Ley 39/2006, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia?",
  "La presente Ley tiene por objeto regular las condiciones básicas que garanticen la igualdad en el ejercicio del derecho subjetivo de ciudadanía a la promoción de la autonomía personal y atención a las personas en situación de dependencia",
  "regular las condiciones básicas que garanticen la igualdad en el ejercicio del derecho subjetivo de ciudadanía a la promoción de la autonomía personal y atención a las personas en situación de dependencia",
  ["regular las prestaciones asistenciales de carácter graciable que las Administraciones Públicas pueden conceder a las personas mayores y con discapacidad que carezcan de recursos económicos suficientes",
   "establecer el régimen de reconocimiento del grado de discapacidad y las medidas de acción positiva a favor de las personas con movilidad reducida en el acceso al empleo y a los servicios públicos",
   "coordinar la asistencia sanitaria y los servicios sociales prestados por las Comunidades Autónomas a las personas en situación de exclusión social o riesgo de padecerla, en condiciones de igualdad"]),

 ("DEP-002","1","Creación del Sistema para la Autonomía y Atención a la Dependencia",
  "La Ley crea el Sistema para la Autonomía y Atención a la Dependencia, con la colaboración de todas las Administraciones Públicas y la garantía estatal de un contenido mínimo común de derechos en todo el territorio.",
  "El Estado garantiza un mínimo común; las Comunidades Autónomas pueden ir por encima.",
  "La Ley 39/2006 alcanza su objeto mediante la creación de:",
  "mediante la creación de un Sistema para la Autonomía y Atención a la Dependencia, con la colaboración y participación de todas las Administraciones Públicas y la garantía por la Administración General del Estado de un contenido mínimo común de derechos para todos los ciudadanos",
  "un Sistema para la Autonomía y Atención a la Dependencia",
  ["un Consejo Nacional de la Discapacidad y la Autonomía Personal",
   "un Fondo Estatal de Atención a las Personas Mayores Dependientes",
   "una Red Pública Estatal de Centros Residenciales y de Día"]),

 ("DEP-003","2","Definición de autonomía",
  "Autonomía es la capacidad de controlar, afrontar y tomar por propia iniciativa decisiones personales sobre cómo vivir de acuerdo con las normas y preferencias propias, y de desarrollar las actividades básicas de la vida diaria.",
  "Autonomía es capacidad de decidir; dependencia es necesitar a otro. No los confundas.",
  "Según el artículo 2 de la Ley 39/2006, se entiende por autonomía:",
  "Autonomía: la capacidad de controlar, afrontar y tomar, por propia iniciativa, decisiones personales acerca de cómo vivir de acuerdo con las normas y preferencias propias así como de desarrollar las actividades básicas de la vida diaria.",
  "la capacidad de controlar, afrontar y tomar, por propia iniciativa, decisiones personales acerca de cómo vivir de acuerdo con las normas y preferencias propias",
  ["la aptitud física y mental que permite a una persona vivir en su domicilio habitual sin ayuda de terceras personas ni apoyos técnicos de ninguna clase",
   "el derecho de toda persona a elegir libremente el centro o el servicio en el que desea ser atendida por la Administración competente en cada caso",
   "la situación en que se encuentra quien conserva íntegramente la capacidad de obrar plena conforme a la legislación civil vigente en cada territorio"]),

 ("DEP-004","2","Definición de dependencia",
  "Dependencia es el estado de carácter permanente en que se encuentran las personas que, por la edad, la enfermedad o la discapacidad, y ligadas a la falta o pérdida de autonomía, precisan la atención de otras personas o ayudas importantes para las actividades básicas de la vida diaria.",
  "«De carácter permanente»: una situación transitoria no es dependencia a efectos de esta Ley.",
  "Según el artículo 2 de la Ley 39/2006, la dependencia es:",
  "Dependencia: el estado de carácter permanente en que se encuentran las personas que, por razones derivadas de la edad, la enfermedad o la discapacidad, y ligadas a la falta o a la pérdida de autonomía física, mental, intelectual o sensorial, precisan de la atención de otra u otras personas o ayudas importantes para realizar actividades básicas de la vida diaria",
  "el estado de carácter permanente en que se encuentran las personas que, por razones derivadas de la edad, la enfermedad o la discapacidad",
  ["el estado de carácter transitorio o permanente que impide a una persona incorporarse al mercado de trabajo en condiciones de igualdad efectiva",
   "la situación sobrevenida a consecuencia de un accidente o enfermedad que reduce en más de un tercio la capacidad laboral",
   "el estado de necesidad económica sobrevenida que determina el acceso a las prestaciones no contributivas de la Seguridad Social"]),

 ("DEP-005","2","Actividades básicas de la vida diaria (ABVD)",
  "Las ABVD son las tareas más elementales de la persona, que le permiten desenvolverse con un mínimo de autonomía e independencia: cuidado personal, actividades domésticas básicas, movilidad esencial, reconocer personas y objetos, orientarse y entender y ejecutar órdenes o tareas sencillas.",
  "Es la definición que sostiene todo el baremo: sin ABVD no hay grado de dependencia.",
  "¿Qué son las Actividades Básicas de la Vida Diaria (ABVD) según la Ley 39/2006?",
  "Actividades Básicas de la Vida Diaria (ABVD): las tareas más elementales de la persona, que le permiten desenvolverse con un mínimo de autonomía e independencia",
  "las tareas más elementales de la persona, que le permiten desenvolverse con un mínimo de autonomía e independencia",
  ["las tareas instrumentales que permiten a la persona participar en la vida social, laboral y comunitaria de su entorno",
   "las actividades de ocio, cultura y relación que las Administraciones deben garantizar a las personas mayores",
   "las tareas de apoyo que prestan los cuidadores no profesionales en el domicilio de la persona dependiente"]),

 ("DEP-006","2","Cuidados no profesionales",
  "Los cuidados no profesionales son la atención prestada a personas en situación de dependencia en su domicilio, por personas de la familia o de su entorno, no vinculadas a un servicio de atención profesionalizada.",
  "El rasgo que los define no es quién los presta, sino que no estén vinculados a un servicio profesionalizado.",
  "Según la Ley 39/2006, los cuidados no profesionales son:",
  "Cuidados no profesionales: la atención prestada a personas en situación de dependencia en su domicilio, por personas de la familia o de su entorno, no vinculadas a un servicio de atención profesionalizada.",
  "la atención prestada a personas en situación de dependencia en su domicilio, por personas de la familia o de su entorno, no vinculadas a un servicio de atención profesionalizada",
  ["la atención prestada a personas en situación de dependencia por voluntarios de entidades del tercer sector debidamente inscritas en el registro correspondiente",
   "la atención prestada a personas en situación de dependencia en su domicilio por empleados de hogar contratados directamente por la familia del beneficiario",
   "la atención prestada a personas en situación de dependencia por profesionales autónomos que no hayan sido acreditados por la Administración competente"]),

 ("DEP-007","2","Asistencia personal",
  "La asistencia personal es el servicio prestado por un asistente personal que realiza o colabora en tareas de la vida cotidiana de una persona en situación de dependencia, para fomentar su vida independiente y potenciar su autonomía personal.",
  "Su finalidad es la vida independiente, no solo el cuidado.",
  "Según el artículo 2 de la Ley 39/2006, la asistencia personal es el servicio prestado por un asistente personal que:",
  "Asistencia personal: servicio prestado por un asistente personal que realiza o colabora en tareas de la vida cotidiana de una persona en situación de dependencia, de cara a fomentar su vida independiente, promoviendo y potenciando su autonomía personal.",
  "realiza o colabora en tareas de la vida cotidiana de una persona en situación de dependencia, de cara a fomentar su vida independiente",
  ["sustituye al cuidador familiar durante los periodos de descanso y las vacaciones previstos en el Programa Individual de Atención",
   "supervisa el cumplimiento del Programa Individual de Atención en el domicilio de la persona beneficiaria y en el centro de día",
   "presta atención sanitaria continuada en el domicilio de la persona bajo la dirección de los servicios de salud competentes"]),

 ("DEP-008","2","El tercer sector",
  "El tercer sector son las organizaciones de carácter privado surgidas de la iniciativa ciudadana o social, con criterios de solidaridad, fines de interés general y ausencia de ánimo de lucro, que impulsan el reconocimiento y ejercicio de los derechos sociales.",
  "Tres rasgos: iniciativa ciudadana, interés general y sin ánimo de lucro.",
  "¿Cómo define la Ley 39/2006 el tercer sector?",
  "Tercer sector: organizaciones de carácter privado surgidas de la iniciativa ciudadana o social, bajo diferentes modalidades que responden a criterios de solidaridad, con fines de interés general y ausencia de ánimo de lucro",
  "organizaciones de carácter privado surgidas de la iniciativa ciudadana o social",
  ["entidades públicas de carácter instrumental creadas por las Comunidades Autónomas para gestionar servicios sociales",
   "empresas privadas acreditadas para prestar servicios de atención a la dependencia mediante concierto",
   "corporaciones de derecho público que agrupan a los profesionales de los servicios sociales y sanitarios"]),

 ("DEP-009","3","Atención integral e integrada como principio",
  "Entre los principios de la Ley está la atención a las personas en situación de dependencia de forma integral e integrada.",
  "Integral quiere decir todas sus necesidades; integrada, coordinada entre servicios. No son sinónimos.",
  "¿Cuál de los siguientes es un principio en que se inspira la Ley 39/2006?",
  "La atención a las personas en situación de dependencia de forma integral e integrada.",
  "La atención a las personas en situación de dependencia de forma integral e integrada",
  ["La atención a las personas en situación de dependencia de forma preferentemente residencial",
   "La atención a las personas en situación de dependencia con cargo exclusivo a los presupuestos autonómicos",
   "La atención a las personas en situación de dependencia mediante prestaciones económicas prioritarias"]),

 ("DEP-010","3","Permanencia en el entorno y atención preferente a la gran dependencia",
  "La Ley se inspira, entre otros principios, en la permanencia de las personas en situación de dependencia, siempre que sea posible, en el entorno en el que desarrollan su vida.",
  "Es el principio que explica por qué los servicios domiciliarios van antes que la residencia.",
  "Según los principios del artículo 3 de la Ley 39/2006, las personas en situación de dependencia deben permanecer:",
  "La permanencia de las personas en situación de dependencia, siempre que sea posible, en el entorno en el que desarrollan su vida.",
  "siempre que sea posible, en el entorno en el que desarrollan su vida",
  ["preferentemente en centros residenciales acreditados por la Comunidad Autónoma de su residencia",
   "en el municipio en el que estuvieran empadronadas en la fecha de presentación de la solicitud",
   "en el centro de día más próximo a su domicilio que disponga de plaza concertada disponible"]),

 ("DEP-011","3","Atención preferente a la gran dependencia",
  "Es principio de la Ley que las personas en situación de gran dependencia sean atendidas de manera preferente.",
  "Cierra la lista de principios y es el que ordena las prioridades del Sistema.",
  "Conforme al artículo 3 de la Ley 39/2006, las personas en situación de gran dependencia:",
  "Las personas en situación de gran dependencia serán atendidas de manera preferente.",
  "serán atendidas de manera preferente",
  ["serán atendidas exclusivamente mediante el servicio de atención residencial",
   "serán atendidas con cargo al nivel adicional de protección de cada Comunidad Autónoma",
   "serán atendidas por orden riguroso de presentación de la solicitud"]),

 ("DEP-012","5","Titulares del derecho: requisito de residencia",
  "Son titulares de los derechos de la Ley los españoles que se encuentren en situación de dependencia en alguno de los grados y residan en territorio español, habiéndolo hecho durante cinco años, dos de ellos inmediatamente anteriores a la solicitud.",
  "Cinco años en total y dos justo antes de solicitar. Es el dato que decide la pregunta.",
  "¿Qué requisito de residencia exige el artículo 5 de la Ley 39/2006 para ser titular de sus derechos?",
  "Residir en territorio español y haberlo hecho durante cinco años, de los cuales dos deberán ser inmediatamente anteriores a la fecha de presentación de la solicitud.",
  "haberlo hecho durante cinco años, de los cuales dos deberán ser inmediatamente anteriores a la fecha de presentación de la solicitud",
  ["haberlo hecho durante tres años, de los cuales uno deberá ser inmediatamente anterior a la fecha de presentación de la solicitud",
   "haberlo hecho durante diez años, de los cuales cinco deberán ser inmediatamente anteriores a la fecha de presentación de la solicitud",
   "haberlo hecho durante dos años, de los cuales uno deberá ser inmediatamente anterior a la fecha de presentación de la solicitud"]),

 ("DEP-013","5","Personas sin nacionalidad española",
  "Quienes reúnan los requisitos pero carezcan de nacionalidad española se rigen por la LO 4/2000 sobre derechos y libertades de los extranjeros en España, los tratados internacionales y los convenios con el país de origen.",
  "Es el puente entre este tema y el bloque de extranjería.",
  "Las personas que, reuniendo los requisitos del artículo 5, carezcan de la nacionalidad española se regirán por:",
  "se regirán por lo establecido en la Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social, en los tratados internacionales y en los convenios que se establezcan con el país de origen",
  "la Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social",
  ["la Ley Orgánica 2/2009, de reforma del régimen sancionador en materia de extranjería y su normativa de desarrollo",
   "el Real Decreto 1155/2024, por el que se aprueba el Reglamento de la Ley Orgánica sobre derechos y libertades de los extranjeros",
   "la Ley 12/2009, reguladora del derecho de asilo y de la protección subsidiaria, y sus convenios de aplicación"]),

 ("DEP-014","6","El Sistema como red de utilización pública",
  "El Sistema para la Autonomía y Atención a la Dependencia se configura como una red de utilización pública que integra, de forma coordinada, centros y servicios públicos y privados.",
  "Que un centro entre en el Sistema no cambia de quién es: lo dice el propio artículo.",
  "Según el artículo 6.2 de la Ley 39/2006, el Sistema para la Autonomía y Atención a la Dependencia se configura como:",
  "El Sistema se configura como una red de utilización pública que integra, de forma coordinada, centros y servicios, públicos y privados.",
  "una red de utilización pública que integra, de forma coordinada, centros y servicios, públicos y privados",
  ["una red exclusivamente pública que integra centros y servicios de titularidad estatal, autonómica y local",
   "un organismo autónomo dependiente del Ministerio competente en materia de servicios sociales y dependencia",
   "un fondo de compensación interterritorial destinado a financiar los servicios sociales de las Comunidades Autónomas"]),

 ("DEP-015","7","Los tres niveles de protección del Sistema",
  "La protección se presta en tres niveles: el mínimo establecido por la Administración General del Estado, el acordado entre el Estado y cada Comunidad Autónoma mediante convenio, y el adicional que pueda establecer cada Comunidad Autónoma.",
  "Mínimo estatal, convenido y adicional autonómico. Van de menos a más.",
  "¿Cuáles son los niveles de protección del Sistema para la Autonomía y Atención a la Dependencia?",
  "1.º El nivel de protección mínimo establecido por la Administración General del Estado en aplicación del artículo 9. 2.º El nivel de protección que se acuerde entre la Administración General del Estado y la Administración de cada una de las Comunidades Autónomas a través de los Convenios previstos en el artículo 10. 3.º El nivel adicional de protección que pueda establecer cada Comunidad Autónoma.",
  "El nivel de protección mínimo establecido por la Administración General del Estado",
  ["El nivel de protección básico establecido por cada Comunidad Autónoma en su ámbito territorial",
   "El nivel de protección universal establecido por el Consejo Territorial mediante acuerdo",
   "El nivel de protección obligatorio establecido por las Entidades Locales en su municipio"]),

 ("DEP-016","14","Naturaleza de las prestaciones de atención a la dependencia",
  "Las prestaciones de atención a la dependencia pueden tener la naturaleza de servicios y de prestaciones económicas, destinadas a la promoción de la autonomía personal y a atender las necesidades de quienes tienen dificultades para las actividades básicas de la vida diaria.",
  "Dos naturalezas: servicios y prestaciones económicas. Los servicios van primero.",
  "Según el artículo 14.1 de la Ley 39/2006, las prestaciones de atención a la dependencia podrán tener la naturaleza de:",
  "Las prestaciones de atención a la dependencia podrán tener la naturaleza de servicios y de prestaciones económicas",
  "servicios y de prestaciones económicas",
  ["servicios y de ayudas técnicas de apoyo a la autonomía personal",
   "prestaciones económicas y de beneficios fiscales para la unidad familiar",
   "servicios sanitarios y de prestaciones farmacéuticas complementarias"]),

 ("DEP-017","14","Carácter prioritario de los servicios del catálogo",
  "Los servicios del Catálogo del artículo 15 tienen carácter prioritario y se prestan a través de la oferta pública de la Red de Servicios Sociales de las Comunidades Autónomas, mediante centros y servicios públicos o privados concertados debidamente acreditados.",
  "El servicio siempre va antes que el dinero: la prestación económica es subsidiaria.",
  "Conforme al artículo 14.2 de la Ley 39/2006, los servicios del Catálogo del artículo 15:",
  "Los servicios del Catálogo del artículo 15 tendrán carácter prioritario y se prestarán a través de la oferta pública de la Red de Servicios Sociales por las respectivas Comunidades Autónomas",
  "tendrán carácter prioritario y se prestarán a través de la oferta pública de la Red de Servicios Sociales",
  ["tendrán carácter subsidiario respecto de las prestaciones económicas reconocidas en el Programa Individual de Atención",
   "tendrán carácter voluntario para las Comunidades Autónomas en función de su disponibilidad presupuestaria",
   "tendrán carácter complementario de los servicios prestados por las Entidades Locales y el tercer sector"]),

 ("DEP-018","14","Prioridad en el acceso a los servicios",
  "La prioridad en el acceso a los servicios viene determinada por el grado de dependencia y, a igual grado, por la capacidad económica del solicitante.",
  "Primero el grado; el dinero solo desempata.",
  "Según el artículo 14.6 de la Ley 39/2006, la prioridad en el acceso a los servicios vendrá determinada por:",
  "La prioridad en el acceso a los servicios vendrá determinada por el grado de dependencia y, a igual grado, por la capacidad económica del solicitante.",
  "el grado de dependencia y, a igual grado, por la capacidad económica del solicitante",
  ["la capacidad económica del solicitante y, a igual capacidad, por su grado de dependencia",
   "la fecha de presentación de la solicitud y, en caso de empate, por la edad del solicitante",
   "el orden que establezca el Programa Individual de Atención elaborado por los servicios sociales"]),

 ("DEP-019","14","Inembargabilidad de las prestaciones económicas",
  "Las prestaciones económicas establecidas en virtud de esta Ley son inembargables, salvo el supuesto previsto en el artículo 608 de la Ley de Enjuiciamiento Civil.",
  "La excepción del art. 608 LEC es la pensión de alimentos.",
  "Según el artículo 14.8 de la Ley 39/2006, las prestaciones económicas establecidas en virtud de esta Ley son:",
  "Las prestaciones económicas establecidas en virtud de esta Ley son inembargables, salvo para el supuesto previsto en el artículo 608 de la Ley de Enjuiciamiento Civil.",
  "inembargables, salvo para el supuesto previsto en el artículo 608 de la Ley de Enjuiciamiento Civil",
  ["embargables únicamente en la parte que exceda del salario mínimo interprofesional vigente en cada momento",
   "inembargables en todo caso, sin excepción alguna de las previstas en la legislación procesal civil vigente",
   "embargables únicamente para el pago de las deudas contraídas con la Administración Pública competente"]),

 ("DEP-020","15","Los servicios del Catálogo",
  "El Catálogo comprende los servicios de prevención y promoción de la autonomía personal, teleasistencia, ayuda a domicilio, centro de día y de noche, y atención residencial.",
  "La prevención abre el catálogo y la atención residencial lo cierra. Ese orden se pregunta.",
  "¿Qué servicio abre el Catálogo de servicios del artículo 15 de la Ley 39/2006?",
  "Los servicios de prevención de las situaciones de dependencia y los de promoción de la autonomía personal.",
  "Los servicios de prevención de las situaciones de dependencia y los de promoción de la autonomía personal",
  ["Los servicios de atención residencial de carácter permanente y temporal en centros debidamente acreditados",
   "Los servicios de valoración del grado de dependencia y los de elaboración del programa individual de atención",
   "Los servicios de información, orientación y asesoramiento a las familias y a los cuidadores no profesionales"]),

 ("DEP-021","17","Cuándo se reconoce la prestación económica vinculada al servicio",
  "La prestación económica vinculada al servicio tiene carácter periódico y se reconoce únicamente cuando no sea posible el acceso a un servicio público o concertado de atención y cuidado.",
  "«Únicamente cuando no sea posible»: confirma que el servicio va primero.",
  "La prestación económica vinculada al servicio del artículo 17 de la Ley 39/2006 se reconocerá:",
  "se reconocerá, en los términos que se establezca, únicamente cuando no sea posible el acceso a un servicio público o concertado de atención y cuidado",
  "únicamente cuando no sea posible el acceso a un servicio público o concertado de atención y cuidado",
  ["siempre que el beneficiario opte expresamente por ella en su Programa Individual de Atención",
   "cuando el beneficiario resida en un municipio de menos de veinte mil habitantes de derecho",
   "cuando así lo acuerde el órgano de valoración de la Comunidad Autónoma competente en cada caso"]),

 ("DEP-022","17","La prestación vinculada está atada a comprar un servicio",
  "Esta prestación económica de carácter personal está, en todo caso, vinculada a la adquisición de un servicio.",
  "No es dinero libre: la Administración supervisa que se gaste en el servicio.",
  "La prestación económica del artículo 17 de la Ley 39/2006 está, en todo caso:",
  "Esta prestación económica de carácter personal estará, en todo caso, vinculada a la adquisición de un servicio.",
  "vinculada a la adquisición de un servicio",
  ["vinculada al mantenimiento del beneficiario en su entorno familiar habitual",
   "vinculada a la contratación de un asistente personal debidamente acreditado",
   "vinculada al pago de la aportación del beneficiario al coste del servicio público"]),

 ("DEP-023","18","La prestación por cuidados en el entorno familiar es excepcional",
  "Excepcionalmente, cuando el beneficiario esté siendo atendido por su entorno familiar y se reúnan las condiciones establecidas, se reconocerá una prestación económica para cuidados familiares.",
  "La palabra «excepcionalmente» abre el artículo y es lo que se pregunta.",
  "Según el artículo 18.1 de la Ley 39/2006, la prestación económica para cuidados en el entorno familiar se reconocerá:",
  "Excepcionalmente, cuando el beneficiario esté siendo atendido por su entorno familiar, y se reúnan las condiciones establecidas en el artículo 14.4, se reconocerá una prestación económica para cuidados familiares.",
  "Excepcionalmente, cuando el beneficiario esté siendo atendido por su entorno familiar",
  ["Preferentemente, cuando el beneficiario manifieste su voluntad de permanecer en el domicilio",
   "Automáticamente, cuando el beneficiario tenga reconocido el grado de gran dependencia",
   "Subsidiariamente, cuando el beneficiario haya renunciado al servicio de ayuda a domicilio"]),

 ("DEP-024","18","Obligaciones del cuidador no profesional",
  "El cuidador debe ajustarse a las normas sobre afiliación, alta y cotización a la Seguridad Social que se determinen reglamentariamente.",
  "El cuidador familiar tiene encuadramiento en Seguridad Social: no es trabajo informal.",
  "Conforme al artículo 18.3 de la Ley 39/2006, el cuidador no profesional deberá ajustarse a las normas sobre:",
  "El cuidador deberá ajustarse a las normas sobre afiliación, alta y cotización a la Seguridad Social que se determinen reglamentariamente.",
  "afiliación, alta y cotización a la Seguridad Social",
  ["formación continua y habilitación profesional en materia de atención sociosanitaria",
   "acreditación y registro como entidad prestadora de servicios de atención a la dependencia",
   "inscripción en el registro autonómico de cuidadores y evaluación periódica de su desempeño"]),

 ("DEP-025","19","Finalidad de la prestación de asistencia personal",
  "La prestación económica de asistencia personal tiene como finalidad la promoción de la autonomía de las personas en situación de dependencia, en cualquiera de sus grados.",
  "Ojo: «en cualquiera de sus grados», no solo en la gran dependencia.",
  "La prestación económica de asistencia personal del artículo 19 de la Ley 39/2006 tiene como finalidad la promoción de la autonomía de las personas en situación de dependencia:",
  "La prestación económica de asistencia personal tiene como finalidad la promoción de la autonomía de las personas en situación de dependencia, en cualquiera de sus grados.",
  "en cualquiera de sus grados",
  ["únicamente en el grado III de gran dependencia",
   "en los grados II y III, cuando así lo prevea el Programa Individual de Atención",
   "en el grado que determine el órgano de valoración de la Comunidad Autónoma"]),

 ("DEP-026","22","El servicio de Teleasistencia",
  "La Teleasistencia facilita asistencia mediante el uso de tecnologías de la comunicación y de la información, con apoyo de los medios personales necesarios, en respuesta inmediata ante situaciones de emergencia, inseguridad, soledad y aislamiento.",
  "Puede ser servicio independiente o complementario del de ayuda a domicilio.",
  "¿En qué consiste el servicio de Teleasistencia del artículo 22 de la Ley 39/2006?",
  "El servicio de Teleasistencia facilita asistencia a los beneficiarios mediante el uso de tecnologías de la comunicación y de la información, con apoyo de los medios personales necesarios, en respuesta inmediata ante situaciones de emergencia, o de inseguridad, soledad y aislamiento.",
  "facilita asistencia a los beneficiarios mediante el uso de tecnologías de la comunicación y de la información",
  ["facilita atención sanitaria a domicilio mediante la coordinación permanente de los servicios de salud y sociales",
   "facilita el traslado del beneficiario al centro de día o de noche mediante medios de transporte adaptados",
   "facilita el seguimiento del Programa Individual de Atención mediante visitas periódicas al domicilio del beneficiario"]),

 ("DEP-027","22","A quién se presta la Teleasistencia",
  "El servicio de Teleasistencia se presta a las personas que no reciban servicios de atención residencial y así lo establezca su Programa Individual de Atención.",
  "Incompatible con la atención residencial, por razones obvias.",
  "Según el artículo 22.2 de la Ley 39/2006, el servicio de Teleasistencia se prestará a las personas que:",
  "Este servicio se prestará a las personas que no reciban servicios de atención residencial y así lo establezca su Programa Individual de Atención.",
  "no reciban servicios de atención residencial y así lo establezca su Programa Individual de Atención",
  ["residan solas en su domicilio habitual y tengan reconocido al menos el grado II de dependencia severa",
   "hayan cumplido sesenta y cinco años de edad y carezcan de apoyo familiar alguno en su entorno próximo",
   "reciban el servicio de ayuda a domicilio y así lo soliciten expresamente ante la Administración competente"]),

 ("DEP-028","23","El servicio de Ayuda a Domicilio",
  "La ayuda a domicilio es el conjunto de actuaciones llevadas a cabo en el domicilio de las personas en situación de dependencia para atender sus necesidades de la vida diaria, prestadas por entidades o empresas acreditadas para esta función.",
  "Las tareas domésticas solo pueden prestarse junto con la atención personal, salvo excepción motivada.",
  "El servicio de ayuda a domicilio del artículo 23 de la Ley 39/2006 lo constituye:",
  "El servicio de ayuda a domicilio lo constituye el conjunto de actuaciones llevadas a cabo en el domicilio de las personas en situación de dependencia con el fin de atender sus necesidades de la vida diaria, prestadas por entidades o empresas, acreditadas para esta función",
  "el conjunto de actuaciones llevadas a cabo en el domicilio de las personas en situación de dependencia",
  ["el conjunto de prestaciones económicas destinadas a sufragar los gastos del hogar de la persona beneficiaria",
   "el conjunto de adaptaciones y de ayudas técnicas instaladas en la vivienda habitual del beneficiario",
   "el conjunto de actuaciones de apoyo prestadas por los cuidadores no profesionales del entorno familiar"]),

 ("DEP-029","25","El servicio de Atención Residencial",
  "El servicio de atención residencial ofrece, desde un enfoque biopsicosocial, servicios continuados de carácter personal y sanitario, y puede tener carácter permanente o temporal.",
  "El carácter temporal cubre convalecencias, vacaciones y descanso del cuidador.",
  "Según el artículo 25.1 de la Ley 39/2006, el servicio de atención residencial ofrece:",
  "El servicio de atención residencial ofrece, desde un enfoque biopsicosocial, servicios continuados de carácter personal y sanitario.",
  "servicios continuados de carácter personal y sanitario",
  ["servicios puntuales de carácter asistencial y de acompañamiento",
   "servicios continuados de carácter exclusivamente sanitario y rehabilitador",
   "servicios de alojamiento y manutención sin prestación sanitaria asociada"]),

 ("DEP-030","26","Grado I: dependencia moderada",
  "El Grado I, dependencia moderada, se da cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria, al menos una vez al día, o tiene necesidades de apoyo intermitente o limitado para su autonomía personal.",
  "La frecuencia es la clave: una vez al día en el Grado I.",
  "Según el artículo 26 de la Ley 39/2006, ¿cuándo se está en Grado I de dependencia moderada?",
  "Grado I. Dependencia moderada: cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria, al menos una vez al día o tiene necesidades de apoyo intermitente o limitado para su autonomía personal.",
  "cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria, al menos una vez al día",
  ["cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria dos o tres veces a lo largo del día",
   "cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria varias veces a lo largo del día",
   "cuando la persona necesita ayuda para realizar alguna actividad básica de la vida diaria de forma ocasional o esporádica"]),

 ("DEP-031","26","Grado II: dependencia severa",
  "El Grado II, dependencia severa, se da cuando la persona necesita ayuda para varias actividades básicas de la vida diaria dos o tres veces al día, pero no quiere el apoyo permanente de un cuidador, o tiene necesidades de apoyo extenso.",
  "Dos o tres veces al día, y sin apoyo permanente. Es el grado intermedio.",
  "El Grado II de dependencia severa concurre cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria:",
  "Grado II. Dependencia severa: cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria dos o tres veces al día, pero no quiere el apoyo permanente de un cuidador o tiene necesidades de apoyo extenso para su autonomía personal.",
  "dos o tres veces al día, pero no quiere el apoyo permanente de un cuidador",
  ["al menos una vez al día, con necesidades de apoyo intermitente o limitado",
   "varias veces al día, con necesidad del apoyo indispensable y continuo de otra persona",
   "de forma continuada, con necesidades de apoyo generalizado para su autonomía personal"]),

 ("DEP-032","26","Grado III: gran dependencia",
  "El Grado III, gran dependencia, se da cuando la persona necesita ayuda para varias actividades básicas de la vida diaria varias veces al día y, por su pérdida total de autonomía, necesita el apoyo indispensable y continuo de otra persona, o tiene necesidades de apoyo generalizado.",
  "Es el grado que la Ley manda atender de manera preferente.",
  "¿Cómo define el artículo 26 de la Ley 39/2006 el Grado III de gran dependencia?",
  "Grado III. Gran dependencia: cuando la persona necesita ayuda para realizar varias actividades básicas de la vida diaria varias veces al día y, por su pérdida total de autonomía física, mental, intelectual o sensorial, necesita el apoyo indispensable y continuo de otra persona",
  "necesita el apoyo indispensable y continuo de otra persona",
  ["necesita el apoyo intermitente o limitado de otra persona para su autonomía personal",
   "necesita el apoyo extenso de un cuidador durante el periodo diurno o nocturno",
   "necesita el apoyo puntual de otra persona en situaciones de emergencia o inseguridad"]),

 ("DEP-033","27","El baremo y la referencia de la OMS",
  "Los grados de dependencia se determinan mediante el baremo acordado en el Consejo Territorial y aprobado por el Gobierno por real decreto, que tiene entre sus referentes la Clasificación Internacional del Funcionamiento, la Discapacidad y la Salud (CIF) de la OMS.",
  "Y la Ley cierra la puerta: no cabe determinar el grado por otro procedimiento.",
  "El baremo con el que se determinan los grados de dependencia tendrá entre sus referentes:",
  "Dicho baremo tendrá entre sus referentes la Clasificación Internacional del Funcionamiento, la Discapacidad y la Salud (CIF) adoptada por la Organización Mundial de la Salud.",
  "la Clasificación Internacional del Funcionamiento, la Discapacidad y la Salud (CIF) adoptada por la Organización Mundial de la Salud",
  ["la Clasificación Internacional de Enfermedades (CIE) adoptada por la Organización Mundial de la Salud en su última revisión",
   "el Baremo de Valoración de la Discapacidad aprobado por el Real Decreto 888/2022, de 18 de octubre, y sus anexos",
   "la Clasificación Internacional de Deficiencias, Discapacidades y Minusvalías adoptada por las Naciones Unidas"]),

 ("DEP-034","27","No cabe otro procedimiento para determinar el grado",
  "No es posible determinar el grado de dependencia mediante otros procedimientos distintos a los establecidos por el baremo.",
  "Es una prohibición expresa, y por eso se pregunta.",
  "Según el artículo 27.2 de la Ley 39/2006, respecto de la determinación del grado de dependencia:",
  "No será posible determinar el grado de dependencia mediante otros procedimientos distintos a los establecidos por este baremo.",
  "No será posible determinar el grado de dependencia mediante otros procedimientos distintos a los establecidos por este baremo",
  ["Será posible determinar el grado de dependencia mediante informe médico del servicio público de salud competente",
   "Será posible determinar el grado de dependencia mediante los baremos propios que apruebe cada Comunidad Autónoma",
   "Será posible determinar el grado de dependencia mediante dictamen del órgano de valoración sin aplicar el baremo"]),

 ("DEP-035","28","Inicio del procedimiento y validez de la resolución",
  "El procedimiento se inicia a instancia de la persona que pueda estar afectada por algún grado de dependencia o de quien ostente su representación; el reconocimiento se hace por resolución de la Administración Autonómica de su residencia y tiene validez en todo el territorio del Estado.",
  "Nunca de oficio. Y la resolución vale en toda España, aunque la dicte una Comunidad.",
  "El procedimiento para el reconocimiento de la situación de dependencia se iniciará:",
  "El procedimiento se iniciará a instancia de la persona que pueda estar afectada por algún grado de dependencia o de quien ostente su representación",
  "a instancia de la persona que pueda estar afectada por algún grado de dependencia o de quien ostente su representación",
  ["de oficio por los servicios sociales del municipio en que resida la persona que pueda estar afectada",
   "a instancia del médico de atención primaria que venga atendiendo a la persona que pueda estar afectada",
   "de oficio por el órgano de valoración de la Comunidad Autónoma correspondiente a su residencia"]),

 ("DEP-036","28","Validez territorial de la resolución",
  "El reconocimiento de la situación de dependencia se efectúa mediante resolución expedida por la Administración Autonómica correspondiente a la residencia del solicitante y tiene validez en todo el territorio del Estado.",
  "La dicta una Comunidad pero vale en toda España; el cambio de residencia solo cambia qué servicios te tocan.",
  "La resolución de reconocimiento de la situación de dependencia:",
  "El reconocimiento de la situación de dependencia se efectuará mediante resolución expedida por la Administración Autonómica correspondiente a la residencia del solicitante y tendrá validez en todo el territorio del Estado.",
  "tendrá validez en todo el territorio del Estado",
  ["tendrá validez únicamente en el territorio de la Comunidad Autónoma que la dicte",
   "tendrá validez durante dos años, transcurridos los cuales deberá renovarse de oficio",
   "tendrá validez en todo el territorio del Estado previa homologación por el Consejo Territorial"]),

 ("DEP-037","29","El Programa Individual de Atención",
  "Los servicios sociales del sistema público establecen un programa individual de atención en el que se determinan las modalidades de intervención más adecuadas a las necesidades de la persona, con su participación y, en su caso, la de su familia.",
  "El PIA es lo que traduce el grado reconocido en servicios concretos.",
  "En el Programa Individual de Atención del artículo 29 de la Ley 39/2006 se determinarán:",
  "los servicios sociales correspondientes del sistema público establecerán un programa individual de atención en el que se determinarán las modalidades de intervención más adecuadas a sus necesidades",
  "las modalidades de intervención más adecuadas a sus necesidades",
  ["la cuantía exacta de las prestaciones económicas que corresponden al beneficiario",
   "el grado de dependencia y los intervalos de puntuación obtenidos en el baremo",
   "el centro residencial concreto en el que será atendido el beneficiario"]),

 ("DEP-038","29","Cuándo se revisa el Programa Individual de Atención",
  "El programa individual de atención se revisa a instancia del interesado y de sus representantes legales, de oficio en la forma y periodicidad que prevea la normativa autonómica, y con motivo del cambio de residencia a otra Comunidad Autónoma.",
  "Se revisa a instancia del interesado, de oficio, y al mudarse de Comunidad Autónoma.",
  "¿En cuál de los siguientes casos se revisa el Programa Individual de Atención?",
  "Con motivo del cambio de residencia a otra Comunidad Autónoma.",
  "Con motivo del cambio de residencia a otra Comunidad Autónoma",
  ["Con motivo del cambio de domicilio dentro del mismo término municipal",
   "Con motivo del cumplimiento de sesenta y cinco años por el beneficiario",
   "Con motivo de la revisión anual obligatoria del grado de dependencia"]),
]

RELACIONES = [
 ("DEP-001","IG-001","desarrolla"), ("DEP-002","DEP-001","desarrolla"),
 ("DEP-003","DEP-001","prerrequisito"), ("DEP-004","DEP-003","limita"),
 ("DEP-005","DEP-004","prerrequisito"), ("DEP-006","DEP-004","desarrolla"),
 ("DEP-007","DEP-003","desarrolla"), ("DEP-008","DEP-002","desarrolla"),
 ("DEP-009","DEP-001","desarrolla"), ("DEP-010","DEP-009","desarrolla"),
 ("DEP-011","DEP-009","desarrolla"), ("DEP-012","DEP-001","limita"),
 ("DEP-013","DEP-012","limita"), ("DEP-014","DEP-002","desarrolla"),
 ("DEP-015","DEP-014","desarrolla"), ("DEP-016","DEP-002","desarrolla"),
 ("DEP-017","DEP-016","desarrolla"), ("DEP-018","DEP-017","desarrolla"),
 ("DEP-019","DEP-016","limita"), ("DEP-020","DEP-017","desarrolla"),
 ("DEP-021","DEP-017","limita"), ("DEP-022","DEP-021","desarrolla"),
 ("DEP-023","DEP-016","limita"), ("DEP-024","DEP-023","desarrolla"),
 ("DEP-025","DEP-007","desarrolla"), ("DEP-026","DEP-020","desarrolla"),
 ("DEP-027","DEP-026","limita"), ("DEP-028","DEP-020","desarrolla"),
 ("DEP-029","DEP-020","desarrolla"), ("DEP-030","DEP-004","desarrolla"),
 ("DEP-031","DEP-030","desarrolla"), ("DEP-032","DEP-031","desarrolla"),
 ("DEP-011","DEP-032","remite"), ("DEP-033","DEP-030","prerrequisito"),
 ("DEP-034","DEP-033","limita"), ("DEP-035","DEP-033","desarrolla"),
 ("DEP-036","DEP-035","desarrolla"), ("DEP-037","DEP-036","desarrolla"),
 ("DEP-038","DEP-037","desarrolla"), ("DEP-018","DEP-030","remite"),
]

def norm(s):
    return " ".join(str(s).replace("«",'"').replace("»",'"').replace("–","-").replace("—","-").split())

def main():
    errores, conceptos, actividades, fuentes = [], [], [], {}
    for (cid, art, tit, res, exp, enun, cotejo, correcta, distr) in ITEMS:
        ref = "art. " + art
        fuente = A.get(art)
        if fuente is None:
            errores.append(f"{cid}: el corpus no tiene el art. {art}"); continue
        if norm(cotejo) not in norm(fuente):
            errores.append(f"{cid}: COTEJO no literal en el art. {art}\n    {cotejo[:110]}")
        if norm(correcta) not in norm(cotejo):
            errores.append(f"{cid}: CORRECTA no literal en el cotejo\n    {correcta[:110]}")
        if len(set([correcta] + distr)) != 4:
            errores.append(f"{cid}: opciones duplicadas")
        for ch in correcta + " ".join(distr) + enun + exp + res:
            if ord(ch) > 0x24F and ch not in "—–«»“”‘’·º ª€":
                errores.append(f"{cid}: carácter no latino {ch!r}")
        fuentes[ref] = fuente
        conceptos.append({"id": cid, "articulo": ref, "titulo": tit, "resumen": res, "explicacion": exp})
        actividades.append({"concepto_id": cid, "articulo": ref, "tipo": "test", "enunciado": enun,
                            "opciones": [correcta] + distr, "indice_correcto": 0,
                            "cotejo": cotejo, "justificacion": f"Ley 39/2006, {ref}."})
    ids = {c["id"] for c in conceptos}
    sin_arista = ids - {o for o,_,_ in RELACIONES} - {d for _,d,_ in RELACIONES}
    if sin_arista:
        errores.append(f"conceptos isla: {sorted(sin_arista)}")
    if errores:
        print("✗ NO se emite el lote:\n  " + "\n  ".join(errores)); sys.exit(1)

    largas = sum(1 for a in actividades if len(a["opciones"][0]) == max(len(o) for o in a["opciones"]))
    print(f"conceptos {len(conceptos)} · actividades {len(actividades)} · "
          f"correcta la más larga en {largas}/{len(actividades)} = {100*largas/len(actividades):.0f} %")

    lote = {"meta": {"materia": "ley-39-2006-dependencia",
                     "norma": "Ley 39/2006, de 14 de diciembre, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia",
                     "referencia_boe": "BOE-A-2006-21990",
                     "convocatoria": "policia-nacional-2026", "tema": T23},
            "fuentes": fuentes, "conceptos": conceptos, "actividades": actividades,
            "relaciones": [{"origen": o, "destino": d, "tipo": t} for o, d, t in RELACIONES]}
    sal = RAIZ / "adaptadores/legal-es/generador/lotes/dep-t23-dependencia.json"
    json.dump(lote, open(sal, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("→", sal)

main()
