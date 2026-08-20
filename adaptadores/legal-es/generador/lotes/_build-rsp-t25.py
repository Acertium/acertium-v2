# -*- coding: utf-8 -*-
"""Construye el lote RSP (RD 39/1997, Reglamento de los Servicios de Prevención, Tema 25).

Los cotejos se EXTRAEN del corpus §54, no se escriben a mano: así la literalidad está
garantizada por construcción y no por revisión. El script aborta si algún cotejo no está
literal en la fuente o si alguna opción correcta no está literal en su cotejo.
"""
import json, sys, unicodedata, collections
from pathlib import Path

RAIZ = Path("/home/user/acertium-v2")
COR = json.load(open(RAIZ / "datos/legal-es/boe-600-pn/corpus/seccion-054.json", encoding="utf-8"))
A = {a["ref"]: a["texto"] for a in COR["articulos"]}

T25 = "Tema 25 — Marco normativo básico de prevención de riesgos laborales: la Ley 31/1995 de Prevención de Riesgos Laborales"

# (id, art, titulo, resumen, explicacion, enunciado, cotejo, correcta, [3 distractores])
ITEMS = [
 ("RSP-001","1","Integración de la prevención en el sistema general de gestión",
  "La prevención de riesgos laborales debe integrarse en el sistema general de gestión de la empresa, en todas sus actividades y en todos sus niveles jerárquicos, mediante un plan de prevención.",
  "No es un departamento aparte: la prevención se integra en cómo se gestiona la empresa entera.",
  "Según el artículo 1.1 del RD 39/1997, la prevención de riesgos laborales deberá integrarse:",
  "deberá integrarse en su sistema general de gestión, comprendiendo tanto al conjunto de las actividades como a todos sus niveles jerárquicos",
  "en su sistema general de gestión, comprendiendo tanto al conjunto de las actividades como a todos sus niveles jerárquicos",
  ["en el departamento de recursos humanos, que coordinará las actividades preventivas de todos los centros de trabajo de la empresa",
   "en el comité de seguridad y salud, que la trasladará al conjunto de las actividades y a todos sus niveles jerárquicos",
   "en el servicio de prevención constituido al efecto, con independencia del sistema general de gestión de la empresa"]),

 ("RSP-002","1","Cómo se desarrolla la actividad preventiva",
  "La actividad preventiva de la empresa se desarrolla a través de alguna de las modalidades previstas en el capítulo III del Reglamento.",
  "El capítulo III es el que las enumera; la empresa elige entre ellas, pero no puede prescindir de todas.",
  "Conforme al artículo 1.3 del RD 39/1997, la actividad preventiva de la empresa se desarrollará:",
  "La actividad preventiva de la empresa se desarrollará a través de alguna de las modalidades previstas en el capítulo III de este real decreto.",
  "a través de alguna de las modalidades previstas en el capítulo III de este real decreto",
  ["a través de la modalidad que en cada caso determine la autoridad laboral competente por razón del territorio",
   "a través del servicio de prevención ajeno con el que obligatoriamente se concierte la prestación",
   "a través de los delegados de prevención designados por los representantes de los trabajadores"]),

 ("RSP-003","2","El plan de prevención: qué es y quién lo aprueba",
  "El Plan de prevención es la herramienta con la que se integra la actividad preventiva en el sistema general de gestión. Lo aprueba la dirección de la empresa, lo asume toda la estructura organizativa y lo conocen todos los trabajadores.",
  "Tres verbos distintos y tres sujetos distintos: aprueba la dirección, asume la estructura, conoce el trabajador.",
  "Según el artículo 2.1 del RD 39/1997, el Plan de prevención de riesgos laborales debe ser:",
  "El Plan de prevención de riesgos laborales debe ser aprobado por la dirección de la empresa, asumido por toda su estructura organizativa, en particular por todos sus niveles jerárquicos, y conocido por todos sus trabajadores.",
  "aprobado por la dirección de la empresa, asumido por toda su estructura organizativa, en particular por todos sus niveles jerárquicos, y conocido por todos sus trabajadores",
  ["aprobado por el comité de seguridad y salud, asumido por la dirección de la empresa y conocido por los delegados de prevención y por el servicio de prevención",
   "aprobado por la autoridad laboral competente, asumido por la dirección de la empresa y conocido por todos sus niveles jerárquicos y por sus trabajadores",
   "aprobado por el servicio de prevención, asumido por todos los niveles jerárquicos de la empresa y conocido por los representantes de los trabajadores"]),

 ("RSP-004","2","El plan se refleja en un documento y a disposición de quién",
  "El Plan de prevención se refleja en un documento que se conserva a disposición de la autoridad laboral, de las autoridades sanitarias y de los representantes de los trabajadores.",
  "Tres destinatarios: autoridad laboral, autoridades sanitarias y representantes de los trabajadores.",
  "El documento en el que se refleja el Plan de prevención de riesgos laborales se conservará a disposición de:",
  "habrá de reflejarse en un documento que se conservará a disposición de la autoridad laboral, de las autoridades sanitarias y de los representantes de los trabajadores",
  "la autoridad laboral, de las autoridades sanitarias y de los representantes de los trabajadores",
  ["la autoridad laboral, de la Inspección de Trabajo y Seguridad Social y del comité de seguridad y salud de la empresa",
   "las autoridades sanitarias, de los delegados de prevención y del servicio de prevención ajeno concertado",
   "la Inspección de Trabajo y Seguridad Social, de los representantes de los trabajadores y de las mutuas colaboradoras"]),

 ("RSP-005","2","Los dos instrumentos esenciales del plan",
  "Los instrumentos esenciales para la gestión y aplicación del Plan de prevención son la evaluación de riesgos y la planificación de la actividad preventiva.",
  "Si te preguntan «los instrumentos esenciales», son exactamente dos y en este orden.",
  "Según el artículo 2.3 del RD 39/1997, los instrumentos esenciales para la gestión y aplicación del Plan de prevención de riesgos laborales son:",
  "Los instrumentos esenciales para la gestión y aplicación del Plan de prevención de riesgos laborales son la evaluación de riesgos y la planificación de la actividad preventiva",
  "la evaluación de riesgos y la planificación de la actividad preventiva",
  ["la vigilancia de la salud y la formación de los trabajadores en materia preventiva",
   "la auditoría del sistema de prevención y la memoria anual del servicio de prevención",
   "la investigación de los daños a la salud y el control periódico de las condiciones de trabajo"]),

 ("RSP-006","2","Documento único para empresas de hasta 50 trabajadores",
  "Las empresas de hasta 50 trabajadores que no desarrollen actividades del anexo I pueden reflejar en un único documento el plan de prevención, la evaluación de riesgos y la planificación de la actividad preventiva.",
  "Ojo al doble requisito: hasta 50 trabajadores Y sin actividades del anexo I.",
  "¿Qué empresas pueden reflejar en un único documento el plan de prevención, la evaluación de riesgos y la planificación de la actividad preventiva?",
  "Las empresas de hasta 50 trabajadores que no desarrollen actividades del anexo I podrán reflejar en un único documento el plan de prevención de riesgos laborales, la evaluación de riesgos y la planificación de la actividad preventiva.",
  "Las empresas de hasta 50 trabajadores que no desarrollen actividades del anexo I",
  ["Las empresas de hasta 25 trabajadores que dispongan de un único centro de trabajo",
   "Las empresas de hasta 10 trabajadores en las que el empresario asuma personalmente la prevención",
   "Las empresas de hasta 100 trabajadores que hayan concertado un servicio de prevención ajeno"]),

 ("RSP-007","3","Definición de evaluación de los riesgos laborales",
  "La evaluación de los riesgos laborales es el proceso dirigido a estimar la magnitud de aquellos riesgos que no hayan podido evitarse, para que el empresario pueda decidir si adopta medidas preventivas y de qué tipo.",
  "Fíjate: solo se evalúa lo que NO se ha podido evitar. Evitar va primero.",
  "Según el artículo 3.1 del RD 39/1997, la evaluación de los riesgos laborales es el proceso dirigido a:",
  "La evaluación de los riesgos laborales es el proceso dirigido a estimar la magnitud de aquellos riesgos que no hayan podido evitarse",
  "estimar la magnitud de aquellos riesgos que no hayan podido evitarse",
  ["eliminar en su origen aquellos riesgos que resulten incompatibles con la salud de los trabajadores",
   "identificar los puestos de trabajo en los que concurran riesgos que hayan podido ser evitados",
   "determinar la responsabilidad del empresario por los daños a la salud que ya se hayan producido"]),

 ("RSP-008","4","Alcance de la evaluación inicial",
  "La evaluación inicial de los riesgos que no hayan podido evitarse debe extenderse a cada uno de los puestos de trabajo de la empresa en que concurran dichos riesgos.",
  "La unidad de la evaluación es el puesto de trabajo, no el centro ni la plantilla.",
  "¿A qué debe extenderse la evaluación inicial de los riesgos que no hayan podido evitarse?",
  "La evaluación inicial de los riesgos que no hayan podido evitarse deberá extenderse a cada uno de los puestos de trabajo de la empresa en que concurran dichos riesgos.",
  "a cada uno de los puestos de trabajo de la empresa en que concurran dichos riesgos",
  ["a cada uno de los centros de trabajo de la empresa en los que se desarrollen actividades del anexo I",
   "a cada uno de los trabajadores especialmente sensibles por sus características personales o estado biológico",
   "a cada una de las actividades de la empresa que impliquen la utilización de equipos de trabajo o productos químicos"]),

 ("RSP-009","5","Qué hacer en caso de duda al evaluar",
  "El procedimiento de evaluación debe proporcionar confianza sobre su resultado y, en caso de duda, deben adoptarse las medidas preventivas más favorables desde el punto de vista de la prevención.",
  "La duda se resuelve siempre a favor de la prevención, nunca a favor de no actuar.",
  "Según el artículo 5.2 del RD 39/1997, cuando exista duda sobre el resultado de la evaluación:",
  "En caso de duda deberán adoptarse las medidas preventivas más favorables, desde el punto de vista de la prevención.",
  "deberán adoptarse las medidas preventivas más favorables, desde el punto de vista de la prevención",
  ["deberá repetirse la evaluación mediante la intervención de un servicio de prevención ajeno acreditado",
   "deberá solicitarse informe a la Inspección de Trabajo y Seguridad Social antes de adoptar medida alguna",
   "deberán adoptarse las medidas preventivas menos gravosas desde el punto de vista económico y organizativo"]),

 ("RSP-010","6","Cuándo se revisa la evaluación inicial",
  "La evaluación de los puestos afectados debe revisarse cuando se hayan detectado daños a la salud de los trabajadores o cuando los controles periódicos revelen que las actividades de prevención pueden ser inadecuadas o insuficientes.",
  "Un daño a la salud obliga siempre a revisar la evaluación del puesto afectado.",
  "¿En qué caso debe revisarse, en todo caso, la evaluación correspondiente a los puestos de trabajo afectados?",
  "se deberá revisar la evaluación correspondiente a aquellos puestos de trabajo afectados cuando se hayan detectado daños a la salud de los trabajadores o se haya apreciado a través de los controles periódicos, incluidos los relativos a la vigilancia de la salud, que las actividades de prevención pueden ser inadecuadas o insuficientes",
  "cuando se hayan detectado daños a la salud de los trabajadores",
  ["cuando lo solicite el comité de seguridad y salud de la empresa por mayoría de sus miembros",
   "cuando haya transcurrido un año desde la realización de la evaluación inicial de riesgos",
   "cuando se incorpore a la empresa un nuevo servicio de prevención propio o ajeno"]),

 ("RSP-011","8","Cuándo hay que planificar la actividad preventiva",
  "Cuando el resultado de la evaluación ponga de manifiesto situaciones de riesgo, el empresario planificará la actividad preventiva conforme a un orden de prioridades en función de su magnitud y del número de trabajadores expuestos.",
  "El orden de prioridades no es libre: magnitud del riesgo y número de expuestos.",
  "Cuando el resultado de la evaluación pusiera de manifiesto situaciones de riesgo, el empresario planificará la actividad preventiva conforme a un orden de prioridades en función de:",
  "conforme a un orden de prioridades en función de su magnitud y número de trabajadores expuestos a los mismos",
  "su magnitud y número de trabajadores expuestos a los mismos",
  ["su coste económico y la disponibilidad de recursos humanos y materiales de la empresa",
   "la antigüedad de los puestos afectados y la frecuencia de la siniestralidad registrada",
   "el criterio que fije el servicio de prevención y el calendario acordado con la autoridad laboral"]),

 ("RSP-012","9","Programa anual cuando la planificación pasa de un año",
  "La actividad preventiva se planifica para un período determinado y, si ese período es superior a un año, debe establecerse un programa anual de actividades.",
  "El umbral es exactamente un año.",
  "En el caso de que el período en que se desarrolle la actividad preventiva sea superior a un año:",
  "En el caso de que el período en que se desarrolle la actividad preventiva sea superior a un año, deberá establecerse un programa anual de actividades.",
  "deberá establecerse un programa anual de actividades",
  ["deberá someterse la planificación a auditoría externa con carácter previo a su ejecución",
   "deberá comunicarse la planificación a la autoridad laboral del territorio antes de su inicio",
   "deberá constituirse un servicio de prevención propio para su seguimiento y control periódico"]),

 ("RSP-013","10","Las cuatro modalidades de organización preventiva",
  "El empresario organiza los recursos para la actividad preventiva asumiéndola personalmente, designando trabajadores, constituyendo un servicio de prevención propio o recurriendo a uno ajeno.",
  "Hay que sabérselas de memoria y en este orden: personal, designados, propio y ajeno.",
  "¿Cuáles son las modalidades de organización de los recursos para el desarrollo de las actividades preventivas del artículo 10 del RD 39/1997?",
  "a) Asumiendo personalmente tal actividad. b) Designando a uno o varios trabajadores para llevarla a cabo. c) Constituyendo un servicio de prevención propio. d) Recurriendo a un servicio de prevención ajeno.",
  "Asumiendo personalmente tal actividad. b) Designando a uno o varios trabajadores para llevarla a cabo. c) Constituyendo un servicio de prevención propio. d) Recurriendo a un servicio de prevención ajeno.",
  ["Asumiendo personalmente tal actividad. b) Designando a un delegado de prevención. c) Constituyendo un comité de seguridad y salud. d) Recurriendo a un servicio de prevención ajeno.",
   "Designando a uno o varios trabajadores. b) Constituyendo un servicio de prevención propio. c) Constituyendo un servicio mancomunado. d) Concertando con una mutua colaboradora.",
   "Asumiendo personalmente tal actividad. b) Designando a uno o varios trabajadores. c) Constituyendo un servicio de prevención propio. d) Recurriendo a la Inspección de Trabajo."]),

 ("RSP-014","10","Carácter interdisciplinario de los servicios de prevención",
  "Los servicios de prevención tienen carácter interdisciplinario, entendido como la conjunción coordinada de dos o más disciplinas técnicas o científicas en materia de prevención.",
  "Interdisciplinario = dos o más disciplinas coordinadas, no una sola por muy completa que sea.",
  "El carácter interdisciplinario de los servicios de prevención se entiende como:",
  "Los servicios de prevención tendrán carácter interdisciplinario, entendiendo como tal la conjunción coordinada de dos o más disciplinas técnicas o científicas en materia de prevención de riesgos laborales.",
  "la conjunción coordinada de dos o más disciplinas técnicas o científicas en materia de prevención de riesgos laborales",
  ["la intervención sucesiva de las cuatro especialidades preventivas legalmente previstas en la empresa",
   "la colaboración entre el servicio de prevención propio y el servicio de prevención ajeno concertado",
   "la participación conjunta de los técnicos de prevención y de los representantes de los trabajadores"]),

 ("RSP-015","11","Asunción personal por el empresario: límites de plantilla",
  "El empresario puede desarrollar personalmente la actividad preventiva si se trata de una empresa de hasta diez trabajadores, o de hasta veinticinco si dispone de un único centro de trabajo.",
  "Dos umbrales distintos: 10 sin más, o 25 con un solo centro de trabajo.",
  "¿En qué empresas puede el empresario desarrollar personalmente la actividad de prevención, conforme al artículo 11.1 del RD 39/1997?",
  "Que se trate de empresa de hasta diez trabajadores; o que, tratándose de empresa que ocupe hasta veinticinco trabajadores, disponga de un único centro de trabajo.",
  "empresa de hasta diez trabajadores; o que, tratándose de empresa que ocupe hasta veinticinco trabajadores, disponga de un único centro de trabajo",
  ["empresa de hasta veinticinco trabajadores; o que, tratándose de empresa que ocupe hasta cincuenta trabajadores, disponga de un único centro de trabajo",
   "empresa de hasta quince trabajadores; o que, tratándose de empresa que ocupe hasta treinta trabajadores, disponga de un único centro de trabajo",
   "empresa de hasta diez trabajadores; o que, tratándose de empresa que ocupe hasta cincuenta trabajadores, no desarrolle actividades del anexo I"]),

 ("RSP-016","11","Lo que el empresario nunca puede asumir personalmente",
  "El empresario puede desarrollar personalmente la actividad de prevención con excepción de las actividades relativas a la vigilancia de la salud de los trabajadores.",
  "La vigilancia de la salud siempre queda fuera: exige personal sanitario.",
  "Aun cumpliendo todos los requisitos, ¿qué actividad NO puede asumir personalmente el empresario?",
  "El empresario podrá desarrollar personalmente la actividad de prevención, con excepción de las actividades relativas a la vigilancia de la salud de los trabajadores",
  "las actividades relativas a la vigilancia de la salud de los trabajadores",
  ["las actividades relativas a la evaluación inicial de los riesgos de cada puesto de trabajo",
   "las actividades relativas a la formación e información de los trabajadores en materia preventiva",
   "las actividades relativas a la planificación de las medidas de emergencia y primeros auxilios"]),

 ("RSP-017","14","Servicio de prevención propio: el umbral de los 500",
  "El empresario debe constituir un servicio de prevención propio cuando se trate de empresas que cuenten con más de 500 trabajadores.",
  "Más de 500, no 500 o más. Es el supuesto que más cae.",
  "Según el artículo 14 del RD 39/1997, el empresario deberá constituir un servicio de prevención propio cuando se trate de empresas que cuenten con:",
  "Que se trate de empresas que cuenten con más de 500 trabajadores.",
  "más de 500 trabajadores",
  ["más de 250 trabajadores", "más de 1.000 trabajadores", "más de 100 trabajadores"]),

 ("RSP-018","14","Servicio de prevención propio: de 250 a 500 con anexo I",
  "También debe constituirse servicio de prevención propio en empresas de entre 250 y 500 trabajadores que desarrollen alguna de las actividades incluidas en el anexo I.",
  "Entre 250 y 500 no basta la plantilla: hace falta además actividad del anexo I.",
  "Las empresas de entre 250 y 500 trabajadores deberán constituir un servicio de prevención propio cuando:",
  "Que, tratándose de empresas de entre 250 y 500 trabajadores, desarrollen alguna de las actividades incluidas en el anexo I.",
  "desarrollen alguna de las actividades incluidas en el anexo I",
  ["dispongan de más de un centro de trabajo en distintas comunidades autónomas",
   "hayan registrado siniestralidad grave en los dos ejercicios inmediatamente anteriores",
   "no hayan concertado la actividad preventiva con una entidad especializada acreditada"]),

 ("RSP-019","14","Plazo cuando lo decide la autoridad laboral",
  "Cuando es la autoridad laboral la que impone constituir un servicio de prevención propio, su resolución fija un plazo no superior a un año para constituirlo.",
  "El plazo máximo es de un año, y entre tanto la actividad se concierta con una entidad ajena.",
  "Cuando la autoridad laboral decide que una empresa debe constituir un servicio de prevención propio, su resolución fijará un plazo:",
  "la resolución de la autoridad laboral fijará un plazo, no superior a un año, para que, en el caso de que se optase por un servicio de prevención propio, la empresa lo constituya en dicho plazo",
  "no superior a un año",
  ["no superior a seis meses", "no superior a dos años", "no superior a tres meses"]),

 ("RSP-020","15","El servicio de prevención propio es unidad organizativa específica",
  "El servicio de prevención propio constituye una unidad organizativa específica y sus integrantes dedican de forma exclusiva su actividad en la empresa a esa finalidad.",
  "Dedicación exclusiva: no se puede compaginar con otro puesto de la empresa.",
  "Según el artículo 15.1 del RD 39/1997, el servicio de prevención propio:",
  "El servicio de prevención propio constituirá una unidad organizativa específica y sus integrantes dedicarán de forma exclusiva su actividad en la empresa a la finalidad del mismo.",
  "constituirá una unidad organizativa específica y sus integrantes dedicarán de forma exclusiva su actividad en la empresa a la finalidad del mismo",
  ["se integrará en el departamento de recursos humanos y sus miembros compatibilizarán esta actividad con las funciones propias de su puesto",
   "constituirá una unidad organizativa específica y sus integrantes podrán compartir su actividad con otras empresas del mismo grupo empresarial",
   "dependerá directamente del comité de seguridad y salud y sus integrantes dedicarán a esta finalidad al menos la mitad de su jornada"]),

 ("RSP-021","15","Especialidades mínimas del servicio de prevención propio",
  "El servicio de prevención propio ha de contar como mínimo con dos de las especialidades o disciplinas preventivas previstas en el artículo 34 del Reglamento.",
  "Dos en el propio; cuatro en el ajeno; tres en el mancomunado. Es la trampa clásica.",
  "¿Con cuántas especialidades o disciplinas preventivas debe contar, como mínimo, un servicio de prevención propio?",
  "El servicio de prevención habrá de contar, como mínimo, con dos de las especialidades o disciplinas preventivas previstas en el artículo 34 de la presente disposición",
  "dos de las especialidades o disciplinas preventivas",
  ["tres de las especialidades o disciplinas preventivas",
   "cuatro de las especialidades o disciplinas preventivas",
   "una de las especialidades o disciplinas preventivas"]),

 ("RSP-022","15","Memoria y programación anual del servicio de prevención",
  "La empresa debe elaborar anualmente y mantener a disposición de las autoridades laborales y sanitarias y del comité de seguridad y salud la memoria y programación anual del servicio de prevención.",
  "Es anual y va a tres destinatarios, uno de ellos interno: el comité de seguridad y salud.",
  "La memoria y programación anual del servicio de prevención debe mantenerse a disposición de:",
  "mantener a disposición de las autoridades laborales y sanitarias competentes y del comité de seguridad y salud la memoria y programación anual del servicio de prevención",
  "las autoridades laborales y sanitarias competentes y del comité de seguridad y salud",
  ["la Inspección de Trabajo y Seguridad Social y de los delegados de prevención de cada centro",
   "las autoridades laborales competentes y de la entidad auditora del sistema de prevención",
   "las autoridades sanitarias competentes y de la mutua colaboradora con la Seguridad Social"]),

 ("RSP-023","18","Especialidades que debe tener un servicio de prevención ajeno",
  "Las entidades acreditadas como servicios de prevención ajenos deben contar con las especialidades de medicina del trabajo, seguridad en el trabajo, higiene industrial, y ergonomía y psicosociología aplicada.",
  "Todas, sin excepción: son las mismas disciplinas preventivas que el Reglamento usa para clasificar las funciones.",
  "¿Con qué especialidades o disciplinas preventivas deben contar, en todo caso, los servicios de prevención ajenos?",
  "Contar con las especialidades o disciplinas preventivas de medicina del trabajo, seguridad en el trabajo, higiene industrial, y ergonomía y psicosociología aplicada.",
  "medicina del trabajo, seguridad en el trabajo, higiene industrial, y ergonomía y psicosociología aplicada",
  ["medicina del trabajo, seguridad en el trabajo, higiene industrial y formación de los trabajadores",
   "seguridad en el trabajo, higiene industrial, ergonomía y psicosociología aplicada y vigilancia de la salud",
   "medicina del trabajo, seguridad industrial, higiene alimentaria, y ergonomía y psicosociología aplicada"]),

 ("RSP-024","20","El concierto con el servicio de prevención ajeno es por escrito",
  "Cuando el empresario deba desarrollar la actividad preventiva a través de uno o varios servicios de prevención ajenos, debe concertar por escrito la prestación.",
  "Por escrito y con el contenido mínimo que enumera el propio artículo.",
  "Cuando el empresario deba desarrollar la actividad preventiva a través de servicios de prevención ajenos, la prestación:",
  "deberá concertar por escrito la prestación",
  "deberá concertar por escrito la prestación",
  ["deberá autorizarse previamente por la autoridad laboral competente por razón del territorio",
   "deberá acordarse en el seno del comité de seguridad y salud por mayoría de sus miembros",
   "deberá comunicarse a la Inspección de Trabajo dentro de los treinta días siguientes a su inicio"]),

 ("RSP-025","21","Cuándo pueden constituirse servicios de prevención mancomunados",
  "Pueden constituirse servicios de prevención mancomunados entre empresas que desarrollen simultáneamente actividades en un mismo centro de trabajo, edificio o centro comercial.",
  "También por negociación colectiva entre empresas de un mismo sector, grupo o polígono industrial.",
  "Según el artículo 21.1 del RD 39/1997, podrán constituirse servicios de prevención mancomunados entre aquellas empresas que desarrollen simultáneamente actividades en:",
  "Podrán constituirse servicios de prevención mancomunados entre aquellas empresas que desarrollen simultáneamente actividades en un mismo centro de trabajo, edificio o centro comercial",
  "un mismo centro de trabajo, edificio o centro comercial",
  ["un mismo término municipal, comarca o área metropolitana",
   "una misma comunidad autónoma, provincia o demarcación de la autoridad laboral",
   "un mismo sector productivo, grupo empresarial o centro de trabajo de más de 500 trabajadores"]),

 ("RSP-026","21","Especialidades mínimas del servicio mancomunado",
  "Los servicios de prevención mancomunados tienen la consideración de servicios propios de las empresas que los constituyen y han de contar con, al menos, tres especialidades o disciplinas preventivas.",
  "Tres: el punto intermedio entre las dos del propio y las cuatro del ajeno.",
  "Los servicios de prevención mancomunados habrán de contar con, al menos:",
  "tendrán la consideración de servicios propios de las empresas que los constituyan y habrán de contar con, al menos, tres especialidades o disciplinas preventivas",
  "tres especialidades o disciplinas preventivas",
  ["dos especialidades o disciplinas preventivas",
   "cuatro especialidades o disciplinas preventivas",
   "las mismas especialidades que tuviera la empresa de mayor plantilla"]),

 ("RSP-027","21","Quién no puede formar parte de un mancomunado sectorial",
  "Las empresas obligadas legalmente a disponer de servicio de prevención propio no pueden formar parte de servicios mancomunados constituidos para las empresas de un determinado sector, aunque sí de los constituidos para empresas del mismo grupo.",
  "La excepción del grupo empresarial es lo que decide la pregunta.",
  "Las empresas que tengan obligación legal de disponer de un servicio de prevención propio:",
  "Las empresas que tengan obligación legal de disponer de un servicio de prevención propio no podrán formar parte de servicios de prevención mancomunados constituidos para las empresas de un determinado sector, aunque sí de los constituidos para empresas del mismo grupo.",
  "no podrán formar parte de servicios de prevención mancomunados constituidos para las empresas de un determinado sector, aunque sí de los constituidos para empresas del mismo grupo",
  ["no podrán formar parte de ningún servicio de prevención mancomunado, cualquiera que sea el criterio con el que se haya constituido",
   "podrán formar parte de cualquier servicio de prevención mancomunado siempre que quede garantizada la operatividad y eficacia del servicio",
   "podrán formar parte de servicios mancomunados de sector, pero no de los constituidos para empresas de un mismo grupo empresarial"]),

 ("RSP-028","21","Ámbito de la actividad del servicio mancomunado",
  "La actividad preventiva de los servicios mancomunados se limita a las empresas participantes.",
  "No pueden prestar servicio a terceros: para eso está el servicio de prevención ajeno acreditado.",
  "La actividad preventiva de los servicios de prevención mancomunados:",
  "La actividad preventiva de los servicios mancomunados se limitará a las empresas participantes.",
  "se limitará a las empresas participantes",
  ["se extenderá a todas las empresas del polígono industrial o área geográfica limitada",
   "podrá concertarse con terceros previa acreditación como servicio de prevención ajeno",
   "se limitará a las empresas del mismo sector productivo o grupo empresarial"]),

 ("RSP-029","22 bis","Cuándo es necesaria la presencia de los recursos preventivos",
  "La presencia de los recursos preventivos en el centro de trabajo es necesaria, entre otros casos, cuando la requiera la Inspección de Trabajo y Seguridad Social si las condiciones de trabajo detectadas lo exigen.",
  "Tres supuestos: concurrencia de operaciones, actividades peligrosas del apartado b) y requerimiento de la Inspección.",
  "Además de la concurrencia de operaciones y de las actividades con riesgos especiales, ¿en qué otro caso es necesaria la presencia de los recursos preventivos en el centro de trabajo?",
  "Cuando la necesidad de dicha presencia sea requerida por la Inspección de Trabajo y Seguridad Social, si las circunstancias del caso así lo exigieran debido a las condiciones de trabajo detectadas.",
  "Cuando la necesidad de dicha presencia sea requerida por la Inspección de Trabajo y Seguridad Social",
  ["Cuando la necesidad de dicha presencia sea acordada por el comité de seguridad y salud de la empresa",
   "Cuando la necesidad de dicha presencia sea apreciada por el servicio de prevención ajeno concertado",
   "Cuando la necesidad de dicha presencia sea solicitada por los delegados de prevención del centro"]),

 ("RSP-030","22 bis","Qué es la presencia de recursos preventivos",
  "La presencia de recursos preventivos es una medida preventiva complementaria cuya finalidad es vigilar el cumplimiento de las actividades preventivas en relación con los riesgos que determinan su necesidad.",
  "Complementaria: no sustituye a ninguna de las obligaciones del empresario.",
  "Según el artículo 22 bis.4 del RD 39/1997, la presencia de los recursos preventivos es:",
  "La presencia es una medida preventiva complementaria que tiene como finalidad vigilar el cumplimiento de las actividades preventivas en relación con los riesgos derivados de la situación que determine su necesidad",
  "una medida preventiva complementaria que tiene como finalidad vigilar el cumplimiento de las actividades preventivas",
  ["una medida preventiva sustitutiva que releva al empresario de la obligación de evaluar los riesgos del puesto",
   "una modalidad de organización preventiva adicional a las cuatro previstas en el artículo 10 del Reglamento",
   "una medida disciplinaria dirigida a controlar el cumplimiento de las instrucciones por los trabajadores"]),

 ("RSP-031","34","Los tres niveles de funciones preventivas",
  "A efectos de las capacidades y aptitudes necesarias, las funciones preventivas se clasifican en funciones de nivel básico, de nivel intermedio y de nivel superior.",
  "El nivel superior es el que se corresponde con las especialidades preventivas.",
  "¿En qué grupos clasifica el artículo 34 del RD 39/1997 las funciones a realizar en materia preventiva?",
  "a) Funciones de nivel básico. b) Funciones de nivel intermedio. c) Funciones de nivel superior, correspondientes a las especialidades y disciplinas preventivas de medicina del trabajo, seguridad en el trabajo, higiene industrial, y ergonomía y psicosociología aplicada.",
  "Funciones de nivel básico. b) Funciones de nivel intermedio. c) Funciones de nivel superior",
  ["Funciones de nivel elemental. b) Funciones de nivel medio. c) Funciones de nivel especializado",
   "Funciones de nivel básico. b) Funciones de nivel avanzado. c) Funciones de nivel de dirección",
   "Funciones de nivel general. b) Funciones de nivel intermedio. c) Funciones de nivel técnico superior"]),

 ("RSP-032","35","Formación del nivel básico: 50 o 30 horas",
  "La formación mínima para las funciones de nivel básico tiene una duración no inferior a 50 horas si la empresa desarrolla actividades del anexo I, y de 30 horas en los demás casos.",
  "Dos cifras y un criterio: el anexo I es lo que sube de 30 a 50.",
  "¿Cuál es la duración mínima de la formación para desempeñar las funciones de nivel básico en una empresa que desarrolle alguna de las actividades incluidas en el anexo I?",
  "cuyo desarrollo tendrá una duración no inferior a 50 horas, en el caso de empresas que desarrollen alguna de las actividades incluidas en el anexo I, o de 30 horas en los demás casos",
  "no inferior a 50 horas",
  ["no inferior a 30 horas", "no inferior a 100 horas", "no inferior a 300 horas"]),

 ("RSP-033","35","Experiencia que sustituye a la formación de nivel básico",
  "También puede desempeñar funciones de nivel básico quien acredite una experiencia no inferior a dos años en una empresa, institución o Administración pública con responsabilidades equivalentes.",
  "Dos años, y con la obligación de mejorar progresivamente la cualificación.",
  "¿Qué experiencia permite desempeñar las funciones de nivel básico sin la formación mínima del anexo IV?",
  "Acreditar una experiencia no inferior a dos años en una empresa, institución o Administración pública que lleve consigo el desempeño de niveles profesionales de responsabilidad equivalentes o similares",
  "una experiencia no inferior a dos años",
  ["una experiencia no inferior a un año", "una experiencia no inferior a cinco años",
   "una experiencia no inferior a tres años"]),

 ("RSP-034","36","Formación del nivel intermedio: 300 horas",
  "Para desempeñar las funciones de nivel intermedio es preciso poseer una formación mínima con el contenido del anexo V y una duración no inferior a 300 horas.",
  "El intermedio se queda en estas horas; el superior exige bastantes más. No los confundas.",
  "¿Cuál es la duración mínima de la formación exigida para desempeñar las funciones de nivel intermedio?",
  "cuyo desarrollo tendrá una duración no inferior a 300 horas y una distribución horaria adecuada a cada proyecto formativo",
  "no inferior a 300 horas",
  ["no inferior a 600 horas", "no inferior a 200 horas", "no inferior a 50 horas"]),

 ("RSP-035","37","Requisitos del nivel superior: titulación universitaria y 600 horas",
  "Para desempeñar las funciones de nivel superior es preciso contar con una titulación universitaria oficial y una formación mínima acreditada por una universidad de duración no inferior a seiscientas horas.",
  "Dos requisitos acumulativos: la titulación y las seiscientas horas acreditadas por universidad.",
  "Para desempeñar las funciones de nivel superior en materia de prevención de riesgos laborales será preciso:",
  "será preciso contar con una titulación universitaria oficial y poseer una formación mínima acreditada por una universidad con el contenido especificado en el programa a que se refiere el anexo VI, cuyo desarrollo tendrá una duración no inferior a seiscientas horas",
  "contar con una titulación universitaria oficial y poseer una formación mínima acreditada por una universidad",
  ["contar con una titulación universitaria oficial o, alternativamente, acreditar cinco años de experiencia en funciones de nivel intermedio",
   "contar con el título de técnico superior de formación profesional y una formación acreditada por un servicio de prevención",
   "contar con una titulación universitaria oficial y la habilitación expresa de la autoridad laboral competente"]),

 ("RSP-036","37","Quién ejerce la vigilancia y control de la salud",
  "Las funciones de vigilancia y control de la salud de los trabajadores son desempeñadas por personal sanitario con competencia técnica, formación y capacidad acreditada.",
  "Es la única función preventiva reservada a personal sanitario.",
  "Las funciones de vigilancia y control de la salud de los trabajadores serán desempeñadas por:",
  "Las funciones de vigilancia y control de la salud de los trabajadores señaladas en el párrafo e) del apartado 1 serán desempeñadas por personal sanitario con competencia técnica, formación y capacidad acreditada",
  "personal sanitario con competencia técnica, formación y capacidad acreditada",
  ["personal técnico de nivel superior con la especialidad de ergonomía y psicosociología aplicada",
   "personal de la mutua colaboradora con la Seguridad Social a la que esté asociada la empresa",
   "personal técnico de nivel intermedio bajo la supervisión de un especialista de nivel superior"]),
]

RELACIONES = [
 ("RSP-001","PRL-003","desarrolla"), ("RSP-003","RSP-001","desarrolla"),
 ("RSP-005","RSP-003","desarrolla"), ("RSP-007","RSP-005","desarrolla"),
 ("RSP-008","RSP-007","desarrolla"), ("RSP-010","RSP-008","limita"),
 ("RSP-011","RSP-007","prerrequisito"), ("RSP-012","RSP-011","desarrolla"),
 ("RSP-013","RSP-002","desarrolla"), ("RSP-014","RSP-013","desarrolla"),
 ("RSP-015","RSP-013","desarrolla"), ("RSP-016","RSP-015","limita"),
 ("RSP-017","RSP-013","desarrolla"), ("RSP-018","RSP-017","desarrolla"),
 ("RSP-019","RSP-017","desarrolla"), ("RSP-020","RSP-017","desarrolla"),
 ("RSP-021","RSP-020","desarrolla"), ("RSP-022","RSP-020","desarrolla"),
 ("RSP-023","RSP-013","desarrolla"), ("RSP-024","RSP-023","desarrolla"),
 ("RSP-025","RSP-013","desarrolla"), ("RSP-026","RSP-025","desarrolla"),
 ("RSP-027","RSP-025","limita"), ("RSP-028","RSP-025","limita"),
 ("RSP-029","RSP-013","remite"), ("RSP-030","RSP-029","desarrolla"),
 ("RSP-031","RSP-021","prerrequisito"), ("RSP-032","RSP-031","desarrolla"),
 ("RSP-033","RSP-032","limita"), ("RSP-034","RSP-031","desarrolla"),
 ("RSP-035","RSP-031","desarrolla"), ("RSP-036","RSP-035","desarrolla"),
 ("RSP-021","RSP-026","limita"), ("RSP-023","RSP-021","limita"),
 ("RSP-004","RSP-003","desarrolla"), ("RSP-006","RSP-004","limita"),
 ("RSP-009","RSP-007","desarrolla"),
]

def norm(s):
    return " ".join(str(s).replace("«",'"').replace("»",'"').replace("–","-").replace("—","-").split())

def main():
    errores = []
    conceptos, actividades, fuentes = [], [], {}
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
        for ch in correcta + " ".join(distr) + enun:
            if ord(ch) > 0x24F and ch not in "—–«»“”‘’·º ª€":
                errores.append(f"{cid}: carácter no latino {ch!r}")
        fuentes[ref] = fuente
        conceptos.append({"id": cid, "articulo": ref, "titulo": tit, "resumen": res, "explicacion": exp})
        actividades.append({"concepto_id": cid, "articulo": ref, "tipo": "test", "enunciado": enun,
                            "opciones": [correcta] + distr, "indice_correcto": 0,
                            "cotejo": cotejo, "justificacion": f"RD 39/1997, {ref}."})
    ids = {c["id"] for c in conceptos}
    for o, d, t in RELACIONES:
        if o not in ids:
            errores.append(f"relación con origen desconocido: {o}")
    if errores:
        print("✗ NO se emite el lote:\n  " + "\n  ".join(errores)); sys.exit(1)

    largas = sum(1 for a in actividades if len(a["opciones"][0]) == max(len(o) for o in a["opciones"]))
    print(f"conceptos {len(conceptos)} · actividades {len(actividades)} · "
          f"correcta la más larga en {largas}/{len(actividades)} = {100*largas/len(actividades):.0f} %")

    lote = {"meta": {"materia": "rd-39-1997-reglamento-servicios-prevencion",
                     "norma": "Real Decreto 39/1997, de 17 de enero, por el que se aprueba el Reglamento de los Servicios de Prevención",
                     "referencia_boe": "BOE-A-1997-1853",
                     "convocatoria": "policia-nacional-2026", "tema": T25},
            "fuentes": fuentes, "conceptos": conceptos, "actividades": actividades,
            "relaciones": [{"origen": o, "destino": d, "tipo": t} for o, d, t in RELACIONES]}
    sal = RAIZ / "adaptadores/legal-es/generador/lotes/rsp-t25-servicios-prevencion.json"
    json.dump(lote, open(sal, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("→", sal)

main()
