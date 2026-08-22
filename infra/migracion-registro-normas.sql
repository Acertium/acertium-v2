-- Acertium V2 — el cerebro estrena reloj: registro de normas (G7)
-- 23/08/2026.
--
-- QUÉ PASABA
-- La regla 7 de CLAUDE.md dice que los datos normativos caducan y hay que
-- re-verificarlos contra fuente oficial ante cambios de BOE. Para eso existe
-- `acertium_v2.norma`, con `volatilidad`, `ultima_modificacion`, `last_verified`
-- y `cadencia_revision`.
--
-- Medido el 23/08/2026: la tabla tenía **UNA fila** (la Constitución) y el banco
-- citaba **61 normas**. O sea, la regla 7 no tenía dónde apoyarse: si mañana se
-- reforma el Código Penal o la LO 4/2015, nada en el sistema sabe que hay 378 y
-- 45 conceptos colgando de ellas, ni cuándo se miraron por última vez.
--
-- QUÉ HACE ESTO, Y QUÉ NO
-- Registra las 61 normas con lo único que hoy consta de verdad: su identidad.
-- `id` y `nombre` salen de `adaptadores/legal-es/generador/registro-materias.json`,
-- que es la fuente de verdad materia↔norma↔BOE del proyecto, y `referencia_boe`
-- es el BOE-A que ya citan las fuentes.
--
-- **NO inventa fechas ni clasificaciones.** `ultima_modificacion`,
-- `last_verified`, `cadencia_revision` y `volatilidad` quedan en NULL porque no
-- se saben: averiguarlas es abrir el texto consolidado de cada norma en el BOE y
-- leer su «Última actualización», una por una. Poner ahí una fecha plausible
-- sería exactamente lo que la regla 7 prohíbe — y peor que no tenerla, porque
-- parecería verificada.
--
-- Por eso se afloja el NOT NULL de `volatilidad`: el esquema obligaba a declarar
-- una volatilidad que nadie ha medido, así que la única forma de registrar una
-- norma era inventarse su clasificación. Con NULL, «sin clasificar» se puede
-- decir, y la barrera G7 lo cuenta.
--
-- RESULTADO EN EL PANEL: «G7 · norma citada sin registrar» pasa de 60 a 0, y
-- «G7 · norma sin volatilidad/last_verified» pasa de 0 a 60 — que no es un
-- empeoramiento sino la verdad saliendo a la superficie: antes daba 0 porque
-- solo había una norma registrada. Ahora es una cola de trabajo de 60 entradas.
--
-- DOS NORMAS QUE EL REGISTRO NO TENÍA
-- `BOE-A-2010-8504` y `BOE-A-2021-7554` — los Protocolos 14 y 15 del CEDH, que
-- 15 fuentes de la familia CEDH citan. No estaban en `registro-materias.json`
-- porque ese fichero está indexado por FAMILIA y CEDH ya apunta al Convenio; una
-- familia que cita varias normas no cabe en ese modelo. Se registran aquí y
-- queda anotado como límite del registro.

begin;

-- Una volatilidad que no se ha medido debe poder decirse. Ver arriba.
alter table acertium_v2.norma alter column volatilidad drop not null;

insert into acertium_v2.norma (id, nombre, referencia_boe) values
('constitucion-espanola', 'Constitución Española', 'BOE-A-1978-31229'),
('lo-2-1986-fcse', 'Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad', 'BOE-A-1986-6859'),
('lo-4-2015-seguridad-ciudadana', 'Ley Orgánica 4/2015, de protección de la seguridad ciudadana', 'BOE-A-2015-3442'),
('lo-10-1995-codigo-penal', 'Ley Orgánica 10/1995, del Código Penal', 'BOE-A-1995-25444'),
('ley-5-2014-seguridad-privada', 'Ley 5/2014, de Seguridad Privada', 'BOE-A-2014-3649'),
('ley-4-2015-estatuto-victima', 'Ley 4/2015, del Estatuto de la víctima del delito', 'BOE-A-2015-4606'),
('lo-4-2010-regimen-disciplinario', 'Ley Orgánica 4/2010, del Régimen disciplinario del Cuerpo Nacional de Policía', 'BOE-A-2010-8115'),
('lo-4-2000-extranjeria', 'Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros en España y su integración social', 'BOE-A-2000-544'),
('lo-3-2018-proteccion-datos', 'Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales', 'BOE-A-2018-16673'),
('rd-137-1993-reglamento-armas', 'Real Decreto 137/1993, por el que se aprueba el Reglamento de Armas', 'BOE-A-1993-6202'),
('ley-40-2015-sector-publico', 'Ley 40/2015, de Régimen Jurídico del Sector Público', 'BOE-A-2015-10566'),
('ley-50-1997-gobierno', 'Ley 50/1997, del Gobierno', 'BOE-A-1997-25336'),
('rdleg-5-2015-ebep', 'Real Decreto Legislativo 5/2015, texto refundido de la Ley del Estatuto Básico del Empleado Público', 'BOE-A-2015-11719'),
('lo-9-2015-personal-policia-nacional', 'Ley Orgánica 9/2015, de Régimen de Personal de la Policía Nacional', 'BOE-A-2015-8468'),
('ley-12-2009-asilo', 'Ley 12/2009, reguladora del derecho de asilo y de la protección subsidiaria', 'BOE-A-2009-17242'),
('lo-1-2004-violencia-genero', 'Ley Orgánica 1/2004, de Medidas de Protección Integral contra la Violencia de Género', 'BOE-A-2004-21760'),
('lo-3-2007-igualdad', 'Ley Orgánica 3/2007, para la igualdad efectiva de mujeres y hombres', 'BOE-A-2007-6115'),
('ley-31-1995-prl', 'Ley 31/1995, de Prevención de Riesgos Laborales', 'BOE-A-1995-24292'),
('ley-8-2011-infraestructuras-criticas', 'Ley 8/2011, por la que se establecen medidas para la protección de las infraestructuras críticas', 'BOE-A-2011-7630'),
('rd-704-2011-reglamento-infraestructuras-criticas', 'Real Decreto 704/2011, por el que se aprueba el Reglamento de protección de las infraestructuras críticas', 'BOE-A-2011-8849'),
('lo-6-1985-poder-judicial', 'Ley Orgánica 6/1985, del Poder Judicial', 'BOE-A-1985-12666'),
('lecrim-1882', 'Real Decreto de 14 de septiembre de 1882, Ley de Enjuiciamiento Criminal', 'BOE-A-1882-6036'),
('ley-50-1981-ministerio-fiscal', 'Ley 50/1981, por la que se regula el Estatuto Orgánico del Ministerio Fiscal', 'BOE-A-1982-837'),
('lo-6-1984-habeas-corpus', 'Ley Orgánica 6/1984, reguladora del procedimiento de Habeas Corpus', 'BOE-A-1984-11620'),
('lo-2-1979-tribunal-constitucional', 'Ley Orgánica 2/1979, del Tribunal Constitucional', 'BOE-A-1979-23709'),
('lo-3-1981-defensor-del-pueblo', 'Ley Orgánica 3/1981, del Defensor del Pueblo', 'BOE-A-1981-10325'),
('codigo-civil-titulo-preliminar', 'Real Decreto de 24 de julio de 1889, Código Civil', 'BOE-A-1889-4763'),
('lo-4-1981-estados-alarma-excepcion-sitio', 'Ley Orgánica 4/1981, de los estados de alarma, excepción y sitio', 'BOE-A-1981-12774'),
('lo-7-2021-datos-penales', 'Ley Orgánica 7/2021, de protección de datos personales tratados para fines de prevención, detección, investigación y enjuiciamiento de infracciones penales', 'BOE-A-2021-8806'),
('ley-4-2023-trans-lgtbi', 'Ley 4/2023, para la igualdad real y efectiva de las personas trans y para la garantía de los derechos de las personas LGTBI', 'BOE-A-2023-5366'),
('rd-240-2007-libre-circulacion-ue', 'Real Decreto 240/2007, sobre entrada, libre circulación y residencia en España de ciudadanos de los Estados miembros de la UE y de otros Estados parte en el Acuerdo sobre el EEE', 'BOE-A-2007-4184'),
('rd-1428-2003-reglamento-circulacion', 'Real Decreto 1428/2003, por el que se aprueba el Reglamento General de Circulación', 'BOE-A-2003-23514'),
('orden-int-859-2023-estructura-dgp', 'Orden INT/859/2023, por la que se desarrolla la estructura orgánica y funciones de los servicios centrales y territoriales de la Dirección General de la Policía', 'BOE-A-2023-17072'),
('rd-207-2024-estructura-ministerio-interior', 'Real Decreto 207/2024, por el que se desarrolla la estructura orgánica básica del Ministerio del Interior', 'BOE-A-2024-3793'),
('rd-853-2022-procesos-selectivos-pn', 'Real Decreto 853/2022, por el que se regulan los procesos selectivos y la formación en las Escalas Básica y Ejecutiva de la Policía Nacional', 'BOE-A-2022-16582'),
('rd-203-1995-reglamento-asilo', 'Real Decreto 203/1995, por el que se aprueba el Reglamento de aplicación de la Ley reguladora del derecho de asilo', 'BOE-A-1995-5542'),
('rd-865-2001-reglamento-apatrida', 'Real Decreto 865/2001, por el que se aprueba el Reglamento de reconocimiento del estatuto de apátrida', 'BOE-A-2001-14166'),
('rd-1325-2003-proteccion-temporal', 'Real Decreto 1325/2003, por el que se aprueba el Reglamento sobre régimen de protección temporal en caso de afluencia masiva de personas desplazadas', 'BOE-A-2003-19714'),
('rd-220-2022-acogida-proteccion-internacional', 'Real Decreto 220/2022, por el que se aprueba el Reglamento por el que se regula el sistema de acogida en materia de protección internacional', 'BOE-A-2022-4978'),
('rd-2-2006-prl-policia', 'Real Decreto 2/2006, por el que se establecen normas sobre prevención de riesgos laborales en la actividad de los funcionarios del Cuerpo Nacional de Policía', 'BOE-A-2006-624'),
('rd-67-2010-prl-age', 'Real Decreto 67/2010, de 29 de enero, de adaptación de la legislación de Prevención de Riesgos Laborales a la Administración General del Estado', 'BOE-A-2010-2161'),
('reglamento-defensor-del-pueblo', 'Reglamento de Organización y Funcionamiento del Defensor del Pueblo', 'BOE-A-1983-10613'),
('lo-9-2021-fiscalia-europea', 'Ley Orgánica 9/2021, de 1 de julio, de aplicación del Reglamento (UE) 2017/1939 del Consejo, de 12 de octubre de 2017, por el que se establece una cooperación reforzada para la creación de la Fiscalía Europea', 'BOE-A-2021-10957'),
('orden-int-430-2014-uniformidad', 'Orden INT/430/2014, de 10 de marzo, por la que se regula la uniformidad en el Cuerpo Nacional de Policía', 'BOE-A-2014-2997'),
('rd-49-2024-centros-docentes-pn', 'Real Decreto 49/2024, por el que se aprueba el Reglamento de los centros docentes de la Policía Nacional', 'BOE-A-2024-814'),
('rd-555-2011-regimen-electoral-consejo-policia', 'Real Decreto 555/2011, de 20 de abril, por el que se establece el régimen electoral del Consejo de Policía', 'BOE-A-2011-7173'),
('rd-769-1987-policia-judicial', 'Real Decreto 769/1987, de 19 de junio, sobre regulación de la Policía Judicial', 'BOE-A-1987-14578'),
('rd-1155-2024-reglamento-extranjeria', 'Real Decreto 1155/2024, de 19 de noviembre, por el que se aprueba el Reglamento de la Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social', 'BOE-A-2024-24099'),
('orden-pci-487-2019-estrategia-nacional-ciberseguridad', 'Orden PCI/487/2019, por la que se publica la Estrategia Nacional de Ciberseguridad 2019', 'BOE-A-2019-6347'),
('rd-2822-1998-reglamento-vehiculos', 'Real Decreto 2822/1998, por el que se aprueba el Reglamento General de Vehículos', 'BOE-A-1999-1826'),
('orden-int-2573-2015-vehiculos-conduccion-detenidos', 'Orden INT/2573/2015, de 30 de noviembre, por la que se determinan las especificaciones técnicas que deben reunir los vehículos destinados a la conducción de detenidos, presos y penados', 'BOE-A-2015-13138'),
('orden-int-632-2024-desarrollo-procesos-selectivos-pn', 'Orden INT/632/2024, de 20 de junio, por la que se establecen normas para la aplicación y desarrollo del Reglamento de procesos selectivos y formación de la Policía Nacional, aprobado por el Real Decreto 853/2022, de 11 de octubre', 'BOE-A-2024-12811'),
('convencion-contra-la-tortura', 'Convención contra la Tortura (1984), Protocolo facultativo (2002) y MNP del Defensor del Pueblo', 'BOE-A-1987-25053'),
('convenio-europeo-derechos-humanos', 'Convenio Europeo para la Protección de los Derechos Humanos y de las Libertades Fundamentales (Roma, 4 de noviembre de 1950)', 'BOE-A-1979-24010'),
('rd-773-1997-epi', 'Real Decreto 773/1997, sobre utilización por los trabajadores de equipos de protección individual', 'BOE-A-1997-12735'),
('rd-1215-1997-equipos-trabajo', 'Real Decreto 1215/1997, sobre utilización por los trabajadores de los equipos de trabajo', 'BOE-A-1997-17824'),
('itc-reglamento-armas', 'Instrucciones técnicas complementarias del Reglamento de Armas (ITC 1 a ITC 5), aprobadas por el Real Decreto 726/2020', 'BOE-A-2020-9134'),
('rd-39-1997-reglamento-servicios-prevencion', 'Real Decreto 39/1997, de 17 de enero, por el que se aprueba el Reglamento de los Servicios de Prevención', 'BOE-A-1997-1853'),
('ley-39-2006-dependencia', 'Ley 39/2006, de 14 de diciembre, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia', 'BOE-A-2006-21990'),
('cedh-protocolo-14', 'Protocolo n.º 14 al Convenio para la Protección de los Derechos Humanos y de las Libertades Fundamentales (Estrasburgo, 13 de mayo de 2004)', 'BOE-A-2010-8504'),
('cedh-protocolo-15', 'Protocolo n.º 15 de enmienda al Convenio para la Protección de los Derechos Humanos y de las Libertades Fundamentales (Estrasburgo, 24 de junio de 2013)', 'BOE-A-2021-7554')
on conflict do nothing;

-- Aserciones.
do $$
declare sin_registrar int; registradas int;
begin
  select count(distinct f.referencia_boe) into sin_registrar
    from acertium_v2.concepto_fuente f
   where coalesce(f.referencia_boe,'') <> ''
     and not exists (select 1 from acertium_v2.norma nm where nm.referencia_boe = f.referencia_boe);
  if sin_registrar <> 0 then
    raise exception 'quedan % normas citadas sin registrar', sin_registrar;
  end if;

  select count(*) into registradas from acertium_v2.norma;
  if registradas <> 61 then raise exception 'esperaba 61 normas registradas, hay %', registradas; end if;

  -- La Constitución ya estaba registrada CON sus datos: no se ha pisado.
  if not exists (select 1 from acertium_v2.norma
                  where id = 'constitucion-espanola' and last_verified is not null and volatilidad is not null) then
    raise exception 'se ha perdido el reloj de la Constitución';
  end if;
end $$;

commit;
