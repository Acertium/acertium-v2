-- Acertium V2 — `actividad.justificacion` pasa a ser OPCIONAL
-- 23/08/2026. Encargo de Jonathan: «no quiero relleno, solo información que
-- valga la pena saber».
--
-- QUÉ CAMBIA
-- La columna era NOT NULL, así que TODA actividad tenía que llevar algo. Como
-- casi nunca hay algo que enseñar sobre una pregunta concreta, lo que se
-- rellenó fue la referencia: «Art. 15 LO 4/2010.». Medido sobre las 3.434
-- actividades del banco:
--
--   · longitud mediana ................................ 22 caracteres
--   · que el runtime YA ocultaba por heurística ....... 3.333 (97 %)
--   · que llegaban al opositor ..........................  101
--   · de esas, que de verdad enseñan algo (leídas a mano)   45
--
-- Es decir: el campo era obligatorio y su contenido era, en el 99 % de los
-- casos, una copia de lo que ya sale en pantalla como «Ver fuente · art. 15».
--
-- A partir de aquí NULL es la respuesta normal, no una carencia que rellenar,
-- y el runtime deja de adivinar: pinta la justificación si no es NULL.
--
-- POR QUÉ LA SELECCIÓN FINAL SE HIZO A MANO
-- `nucleo/verificar-justificacion.mjs` detecta si un texto ARRANCA como cita.
-- Eso separa bien «Art. 15 LO 4/2010.» de «El encubrimiento aquí es por
-- OMISIÓN: basta con callar», y es lo que decide para el contenido NUEVO.
-- Pero no sabe distinguir «enseña» de «repite la respuesta»: «Art. 17.2 CE: la
-- detención dura un máximo de setenta y dos horas» no es una cita y tampoco
-- aporta — es el enunciado otra vez. Por eso las 101 supervivientes se leyeron
-- una a una. Se conservan 45:
--
--   DISC-*   (23)  escritas a mano con la regla 10 del motor; enseñan la
--                  distinción que se prueba
--   CEDH-*   (14)  qué Protocolo modificó qué artículo, con su BOE-A. Es
--                  procedencia que NO está guardada en ningún otro campo
--   ITC-018   (1)  «en la redacción de la Orden INT/291/2025» — ídem, y hace
--                  falta para la regla 7 (caducidad)
--   PJ-002, PJ-012 (2)  resuelven una anáfora del artículo («'estos últimos'
--                  son los superiores policiales»)
--   CE-T1-057 (1)  dos artículos distintos que remiten a lo mismo
--   %distractores% (4)  ACTIT-002, ACTIT-010, ETICA-011, SEGT-002: dicen por
--                  qué las otras tres opciones son falsas
--
-- Se retiran las 56 restantes: localizadores («ITC 2, apartado 1 (…)», los 15
-- de RDP-*), marcas de procedencia («Paráfrasis fiel; …») y paráfrasis que
-- repiten la respuesta (CE-T1-018, CE-T1-022, INMIG-015…).
--
-- REVERSIBLE. Nada se borra: todo lo retirado queda en
-- `acertium_v2.justificacion_retirada` con su actividad y su fecha.

begin;

-- 1) Copia de seguridad. No es histórico decorativo: es lo que permite
--    deshacer esto si alguna de las 3.389 resulta que sí valía.
create table if not exists acertium_v2.justificacion_retirada (
  actividad_id uuid primary key references acertium_v2.actividad(id) on delete cascade,
  concepto_id  text        not null,
  texto        text        not null,
  retirada_en  timestamptz not null default now(),
  motivo       text        not null
);

-- 2) La columna deja de ser obligatoria.
alter table acertium_v2.actividad alter column justificacion drop not null;

-- 3) Se copia lo que se va. Esta tabla ES la lista de trabajo del paso 4, así
--    que no hay forma de retirar nada sin haberlo guardado antes.
--    `aporta` es el puerto SQL de `justificacionAporta()`; `se_queda` le suma
--    la curación a mano.
insert into acertium_v2.justificacion_retirada (actividad_id, concepto_id, texto, motivo)
with x as (
  select id, concepto_id, btrim(justificacion) as t
  from acertium_v2.actividad
  where justificacion is not null
), y as (
  select id, concepto_id, t,
    -- ARRANQUES_DE_CITA de nucleo/verificar-justificacion.mjs
    (   t ~* '^(arts?|artículos?)\M'
     or t ~* '^(anexo|ap(artado|do)?|cap(ítulo|\.)?|secc(ión|\.)?|punto|t[íi]tulo|disp(osición|\.)|preámbulo|resumen ejecutivo)\M'
     or t ~  '^[A-ZÁÉÍÓÚÑ][[:alnum:]_ÁÉÍÓÚÑáéíóúñ.-]*([[:space:]]+[yA-ZÁÉÍÓÚÑ][[:alnum:]_ÁÉÍÓÚÑáéíóúñ.-]*){0,3}[[:space:]]*[,(«—-]'
     or t ~  '^[A-Z]/[A-Z]+/'
     or t ~  '^[A-ZÁÉÍÓÚÑ]{2,}\M[[:space:]]*[,:]'
    ) as arranca_como_cita,
    -- lo que queda tras la primera frase (el equivalente de `resto` en JS)
    btrim(case when t ~ '\.[[:space:]]' then regexp_replace(t, '^.*?\.[[:space:]]+', '') else '' end) as resto
  from x
), z as (
  select id, concepto_id, t,
    not ((arranca_como_cita and length(resto) < 45) or length(t) < 45) as aporta
  from y
), w as (
  select id, concepto_id, t, aporta,
    aporta and (
         concepto_id like 'DISC-%'
      or concepto_id like 'CEDH-%'
      or concepto_id in ('PJ-002', 'PJ-012', 'ITC-018', 'CE-T1-057')
      or t ilike '%distractores%'
    ) as se_queda
  from z
)
-- El motivo se distingue: no es lo mismo «era una cita» que «pasaba la
-- heurística pero al leerla no enseñaba nada».
select id, concepto_id, t,
       case when aporta then 'curación a mano 23/08/2026: localizador o paráfrasis de la respuesta'
            else 'solo una cita: la referencia ya sale en «Ver fuente»' end
from w
where not se_queda
on conflict (actividad_id) do nothing;

-- 4) Y se retira, tomando como lista exactamente lo que se acaba de copiar.
update acertium_v2.actividad
   set justificacion = null
 where id in (select actividad_id from acertium_v2.justificacion_retirada);

-- 5) Aserciones. Si alguna salta, la transacción se cae entera.
do $$
declare quedan int; copiadas int;
begin
  select count(*) into quedan from acertium_v2.actividad where justificacion is not null;
  if quedan <> 45 then
    raise exception 'esperaba 45 justificaciones vivas, hay %', quedan;
  end if;

  select count(*) into copiadas from acertium_v2.justificacion_retirada;
  if copiadas <> 3389 then
    raise exception 'esperaba 3389 copias de seguridad, hay %', copiadas;
  end if;

  -- Nada vivo puede ser una cadena vacía ni un espacio: o hay frase o hay NULL.
  if exists (select 1 from acertium_v2.actividad where justificacion is not null and btrim(justificacion) = '') then
    raise exception 'hay justificaciones vacías que deberían ser NULL';
  end if;
end $$;

commit;
