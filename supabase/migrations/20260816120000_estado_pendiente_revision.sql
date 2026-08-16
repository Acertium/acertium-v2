-- Acertium — PROMPT_011: estado `pendiente_revision` para el contenido de consenso.
--
-- El contrato docs/contrato-fuentes-no-boe.md §2 exige que el contenido
-- `tipo_fuente = consenso` (temas 28-33: globalización, valores, ética, delitos
-- de odio, inmigración, geografía/demografía, teorías de la delincuencia) se
-- cargue SIN servirse, hasta que un humano lo promueva. El enum solo tenía
-- {verificado, pendiente, rechazado}: `pendiente` ya significa "aún no pasó las
-- puertas", que no es lo mismo que "pasó las puertas pero necesita ojo humano".
--
-- El runtime sirve exclusivamente `verificado` — lo filtran las cuatro
-- funciones de selección (`siguiente_actividad_test`, `simulacro_muestra`,
-- `actividad_de_concepto` y `practicar_estado`) —, así que un
-- `pendiente_revision` no llega al usuario.
--
-- Aplicada en producción el 16/08/2026. Idempotente.

alter type acertium_v2.estado_verificacion add value if not exists 'pendiente_revision';
