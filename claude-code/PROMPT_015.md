# PROMPT_015 — Desbloquear los 3 lotes de relleno rechazados (CIBER-2, SO-2, CEDH-2)

En PROMPT_010/014 se rechazaron 3 lotes de 2ª pasada porque la puerta de metadatos exige que la
referencia citada coincida con la del registro, y estos citan fuentes autorizadas adicionales o (CEDH)
otro instrumento. **El rechazo es correcto tal como está la puerta hoy; hay que refinarla, no relajarla
a ciegas.** Sigue `CLAUDE.md`. NUNCA leas `.env`. Al terminar: `RESULTADO_015.md` + `EJECUCIONES.md`.

## 1. Refinar `verificar-meta` para familias `tipo_fuente: autoridad`
Una familia `autoridad` (RAE, INCIBE, técnicas) puede citar **varias** fuentes solventes; encadenarla a
una única `referencia_fuente` del registro es demasiado estricto. Cambia la puerta para que, cuando
`tipo_fuente = "autoridad"`, **NO exija coincidencia exacta** de la referencia con el registro: basta
con que (a) exista `referencia_fuente` no vacía, y (b) familia/materia/tema cuadren. Los `oficial` con
`referencia_boe` siguen ESTRICTOS (no toques eso). Documenta el porqué en el propio módulo.

## 2. CEDH-2 (`oficial`, Protocolos 14 y 15)
CEDH es familia multi-instrumento (como TORT). Añade a su entrada del registro un `referencia_fuentes`
(array) que incluya los BOE-A de los **Protocolos nº 14 y nº 15 al CEDH** además del principal
(BOE-A-1979-24010). Si no puedes confirmar esos BOE-A con seguridad, NO cargues cedh-2, déjalo pendiente
y anótalo (no inventes ids).

## 3. Comprobar integridad de los 3 lotes ANTES de cargar
El agente que generó estos `-2` se cortó a media por un límite de uso; puede que alguno quedara
incompleto o corrupto. Para cada uno (`lotes/ciber-incibe-2.json`, `lotes/sistemas-operativos-2.json`,
`lotes/ddhh-cedh-2.json`): valida que es JSON bien formado, con sus conceptos/actividades/relaciones
completos y `indice_correcto` en rango. **Si alguno está a medias, NO lo cargues**, anótalo para
regenerar (lo hará Cowork con agentes).

## 4. Cargar los que pasen (con el `cargar.mjs` ya arreglado)
Los `-2` SUMAN a sus familias existentes (CIBER, SO, CEDH), con ids en su rango reservado. Corre las 3
puertas + `cargar.mjs` (inserción confirmada) + `asercion-post-carga.sql` (= 0).

## 5. Verificación
Deja en `RESULTADO_015.md` los conteos por familia ANTES y DESPUÉS (CIBER, SO, CEDH) leídos de la base,
y cuáles de los 3 lotes entraron y cuáles quedaron pendientes y por qué. Cowork cruza por MCP.
