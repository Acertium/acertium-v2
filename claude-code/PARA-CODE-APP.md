# PARA-CODE-APP — Punto de continuación (traspaso de Cowork)

> Nota de traspaso escrita por Claude (Cowork) el **2026-08-16** para el Claude Code que trabaje
> desde la app/nube. Empieza por aquí, luego lee `CLAUDE.md`. Todo dato de estado de aquí abajo se
> verificó contra la base (Supabase MCP) o contra `git`, no de memoria.

## 0. Reglas que mandan (no negociables)
- **No inventes, no alucines, verifica.** Ningún dato normativo sin fuente. Si la fuente no lo
  sostiene, NO se pone. Nunca re-verifiques de memoria ni contra blogs: contra BOE / fuente autorizada.
- **Nunca leas `.env`, `.env.*` ni `secrets/`** por ninguna vía.
- **El runtime solo sirve `estado_verificacion = 'verificado'`.** Lo `pendiente_revision` (consenso)
  no llega al usuario hasta que Jonathan lo aprueba en `/admin`.
- Canal de trabajo: cada encargo es `claude-code/PROMPT_NNN.md`; ejecutas el pendiente de número más
  bajo, escribes `RESULTADO_NNN.md` y añades línea a `EJECUCIONES.md`. Jonathan solo dispara.

## 1. Estado del cerebro (verificado por MCP el 16/08, tras PROMPT_017)
- **2.634 conceptos · 2.542 preguntas servibles · 56 en cola de revisión (`pendiente_revision`) · 0 islas.**
- **Corpus BOE-600: 52/52 normas cargadas.** Índice autogestionado en
  `datos/legal-es/boe-600-pn/00-indice.md` (la marca ✓ exige confirmación de la base desde el 16/08;
  auditar con `node adaptadores/legal-es/generador/reconciliar-indice.mjs`).
- **Temas no-BOE:** todos los citables (oficial/autoridad) cargados y verificados; el Grupo C
  (temas 28-33) cargado con "estado por concepto" (citable→verificado, consenso→pendiente_revision).
- **Módulos montados y probados:** puertas `verificar-lote` / `verificar-meta` / `verificar-calidad`
  + `verificar-fuente` (consenso); módulo de ortografía (dic RLA-ES + nspell, apagado por defecto);
  panel `/admin` (cookie `ADMIN_TOKEN`, fail-closed 404). ADMIN_TOKEN ya fijado en Vercel.

## 2. Lo que falta — por prioridad
1. **Generar los 4 temas que faltan (cero conceptos): 19, 20, 24, 45.** ⚠ VER §3 antes de intentarlo.
   - ~~**T19**~~ — **HECHO** (16/08/2026): 33 conceptos, arts. 550-570 CP, `lotes/cp-t19-orden-publico.json`.
   - **T20** — **PARCIALMENTE HECHO** (16/08/2026): 25 conceptos cargados y verificados,
     `lotes/cp-t20-delitos-informaticos.json` (CP arts. 197, 249, 264 y 189 bis), enlazados a
     CE 18.1/18.3/18.4 (T2), LOPD7-006 (T26), IC-006 (T15) y CIBER-010/012 (T41).
     **Falta el tercer bloque del enunciado: "la prueba digital en el proceso penal"** — ver el aviso
     de abajo, no se puede generar con lo que hay en el repo.
   - **T18** — **CERRADO** (16/08/2026): 45 conceptos, arts. 234-256 del CP salvo el 249, que vive
     en el T20. Dos lotes: `cp-t18-defraudaciones.json` (8) y `cp-t18-usurpacion-apropiacion.json`
     (21: llaves falsas del 239, usurpación 245-247, otras defraudaciones 251 y 251 bis,
     administración desleal 252, apropiación indebida 253 y apropiación de cosa mueble 254).
     Antes de esto era **AMPLIADO** de 16 a 24 conceptos y **reetiquetado** al enunciado oficial
     (`lotes/cp-t18-defraudaciones.json`, arts. 248, 250, 255 y 256). Esos 8 conceptos se cargaron
     por error dentro del lote del T20 y se reasignaron el mismo día: el temario pone las
     defraudaciones —«estafas; apropiación indebida; defraudaciones de fluido eléctrico y análogo»—
     en el T18, no en el T20. El art. 249 se queda en el T20 por ser estafa informática y fraude con
     instrumentos de pago. Como `overlay_entrada` tiene PK `(convocatoria, concepto)`, un concepto
     vive en UN solo tema: comprobar el temario ANTES de asignar, no después.
     Sigue faltando del T18: usurpación (arts. 245-247) y apropiación indebida (arts. 252-254),
     ambos **ya en el corpus** — no hace falta descargar nada.
   - **T24** — **PARCIALMENTE HECHO**: 7 conceptos. Falta el remate doctrinal (concepto de trabajo y
     concepto de salud); necesita fuente de autoridad tipo INSST/OMS, no sale de la Ley 31/1995.
     Sí están ya cubiertos por corpus: *consecuencia de los riesgos* = art. 4.3 LPRL («daños derivados
     del trabajo») y las cuatro disciplinas preventivas = art. 8 c) RD 67/2010.
   - **T45** — PRL en seguridad vial (factores del tráfico, factor humano/ambiental/vehículo, EPI).
     Fuente probable **no-BOE** (autoridad/consenso). Pendiente entero.

   ⚠ **HUECOS DEL CÓDIGO 600 detectados al mapear el T20 (16/08/2026).** El Código 600 incluye el CP
   y la LECrim en **[Inclusión parcial]**, y lo que deja fuera afecta de lleno a este tema. Verificado
   sección a sección sobre `corpus/`, no de memoria:
   - **LECrim**: el corpus llega al art. 328 (más 787 bis/ter y 988 bis). **No contiene los arts.
     588 bis y ss.**, que son justamente la prueba digital (interceptación, registro de dispositivos,
     datos de tráfico). Sin el PDF consolidado de la LECrim ese bloque **no se puede fundamentar**.
   - **CP**: el corpus tiene el art. 197 (apartados 1 a 7) y el 264, pero **no** 197 bis/ter/quater/
     quinquies ni 264 bis/ter/quater — el acceso ilícito a sistemas y las modalidades autónomas de
     daños informáticos. No es un fallo del ingestor: la compilación los omite y marca `[ . . . ]`.
   No inventar esos artículos ni traerlos de memoria: o entra el PDF consolidado, o el tema queda
   con la cobertura que permite el Código 600, que es el material oficial de la convocatoria.
2. **Revisar/aprobar las 56 de consenso en `/admin`** (acción de Jonathan).
3. **Calidad pendiente** (de RESULTADO_016/017): arts. 22.4ª y 510 del CP en `remision_pendiente`
   (aristas de ETICA); *Crime as a Service* del T41; 21 aristas sin id concreto del PROMPT_014;
   2ª pasadas menores en T34/T35/T36; afinar distractores de CIBER-2 (43%) y CEDH-2 (47%), que pasan
   la puerta dura (55%) pero superan el objetivo de Capa 2 (35%).
4. ~~**Enchufar el planificador/BKT en `/practicar`**~~ — **ya está hecho** (corregido por Code el
   16/08 al ejecutar el PROMPT_019; la nota decía que `/practicar` seguía con `order by random()`).
   Lo hizo el PROMPT_001: `lib/cerebro.ts` importa `planDia` de `nucleo/planificador.mjs` y
   `absorcion` de `nucleo/motor-bkt.mjs`, y `siguienteActividad()` decide con el RPC
   `practicar_estado(conv, usuario)`. El `order by random()` solo queda como **red de seguridad**
   (`siguiente_actividad_test()`, `lib/cerebro.ts:197`) para que el usuario nunca se quede sin
   pregunta si algo falla. Verificado en el código, no de memoria. Ver `RESULTADO_001.md` §3.
   Lo que sí sigue abierto de ese frente: el horizonte del planificador está fijo en 180 días porque
   `convocatoria` no guarda fecha de examen (`HORIZONTE_DIAS` en `lib/cerebro.ts`).
5. Averiguar qué deja huérfano el `.git/index.lock` (aparece cuando dos agentes escriben a la vez).
6. **PENDIENTE DE REVISAR — lo que destapa `auditar-corpus.mjs`** (16/08/2026). La lista viva sale de
   `node adaptadores/legal-es/generador/auditar-corpus.mjs`; aquí solo el resumen y el criterio.
   Ya corregidas en el repo **y aplicadas en la base el 16/08/2026** vía
   `correccion-cotejos-truncados.sql`: SP-013, DISC-026, CEDH-012, CEDH-013, CEDH-017 y MININT-014.
   Verificado tras aplicarlo: md5 del cotejo idéntico al del lote en las seis, las seis en
   `verificado`, la opción correcta literal dentro del nuevo cotejo en las seis, y aserciones (a),
   (b) y (c) de `asercion-post-carga.sql` a 0 filas.
   - **(C) ~62 frases con ELISIÓN** en bloques `fuentes`. No hay texto inventado: se une texto
     saltándose una cláusula intermedia sin marcarlo, y la frase resultante parece literal sin serlo
     (*"…a la persona titular de la Dirección General existirá un Gabinete Técnico"* cuando la norma
     dice *"…Dirección General, **para facilitarle el despacho y la coordinación…**, existirá un
     Gabinete Técnico"*). Se concentran en EXTR (Reglamento de extranjería), ASI/ASIR y ACOG.
     **Casi ninguna llega al usuario**: el `fuentes` sirve para verificar, no se sirve. Al revisarlas,
     comprobar primero si algún `cotejo` depende de la frase elidida; si no, es deuda de fidelidad.
   - **(A) ~18 citas truncadas**, estas sí en cotejos servidos. Sin triar una por una: hay que mirar,
     como en SP-013 y DISC-026, si la cláusula omitida cambia lo que se pregunta.
   - **(D) 7 citas reformuladas** (recorte a mitad de frase o recapitalización).
   - **NO tocar CEDH-031** aunque salga marcado: su texto íntegro dice "en el plazo de seis meses" y
     el Protocolo n.º 15 lo rebajó a cuatro. Restaurar la cita metería el plazo derogado. Ni **DP-002**:
     el BOE escribe "del senado" en minúscula y el lote lo puso en mayúscula; no se alinea un lote
     con lo que parece una errata de la fuente.

## 3. ⚠ LÍMITE para trabajar desde la nube (aviso de RESULTADO_018, confirmado)
**El corpus fuente (PDFs) NO está en el repo — es deliberado.** El `.gitignore` excluye
`datos/**/*.pdf` ("corpus pesado: fuente local; el runtime lee el cerebro desde Supabase"). En el PC
hay ~56 PDFs (~21 MB) del BOE-600 + ~1,9 MB en `_fuentes-brutas/`; en `origin/main` hay 0.

Consecuencia práctica:
- **Desde la nube SÍ se puede:** cargar lotes en Supabase, tocar código, y revisar/aprobar contenido.
- **Desde la nube NO se puede generar contenido nuevo con fidelidad**, porque generar exige leer la
  fuente. Los temas 19 y 20 salen del **Código Penal**, cuyo PDF es uno de los excluidos. Un agente
  que lo intente encontrará el fichero ausente o (peor) tirará de memoria — prohibido por `CLAUDE.md`.

**Decisión pendiente de Jonathan** (tiene coste, no la tomes tú): (1) versionar el corpus (~23 MB,
Git lo aguanta) cambiando el criterio del `.gitignore` y anotando por qué; (2) Git LFS para los PDF;
(3) dejarlo como está y generar contenido solo desde el PC. Hasta que se decida, **la generación de
los 4 temas se hace desde el PC**, no desde la app.

### ⚠ TODO LO ANTERIOR DE ESTE §3 ESTÁ SUPERADO (16/08/2026) — no lo sigas
Se deja arriba para que se entienda por qué el repo estuvo montado así, pero **la premisa era
incorrecta y el límite ya no existe**:

- **El generador nunca lee el PDF, por diseño.** Lo dice el propio `ingestor.py` citando el Doc 006:
  *"el generador consume ESTE JSON, nunca el PDF"*. El PDF es la entrada del INGESTOR y muere ahí.
  Lo que hace falta para generar no es el PDF: es el texto ingerido.
- **El Código 600 está versionado** en `datos/legal-es/boe-600-pn/corpus/` (46 normas y 3.094
  artículos a esta fecha; ver su `README.md` y `indice.json`). Los PDFs siguen fuera del control de
  versiones y no hacen falta.
- Por tanto **generar desde la nube sí se puede**, con la fuente literal delante. Lo único que exige
  un PDF nuevo es ingerir una norma que aún no esté en el corpus, y basta con adjuntarlo:
  `ingestor.py --codigo` lo trocea aunque llegue en tandas de páginas con varias normas dentro.
  **Ingerir no consume contexto**: lo hace `pdftotext` + regex, no el modelo.

**Lo que el corpus NO trae**, y conviene mirar antes de dar algo por inexistente: disposiciones y
preámbulos; las secciones que no van por artículos (§34, la Estrategia de Ciberseguridad, va en
anexo); y las inclusiones parciales del propio Código. Que un artículo no esté **no** significa que
no exista en la norma: significa que el Código 600 no lo recoge. Caso real: el **art. 510 CP**
(delitos de odio) no aparece ni una sola vez en el PDF oficial del §35, así que la remisión
`ETICA→CP art. 510` que el PROMPT_016 dejó esperando **no se resolverá nunca** desde este corpus.

## 4. Dónde mirar
- Manual y reglas: `CLAUDE.md` (raíz).
- Últimos partes con el detalle fino: `claude-code/RESULTADO_017.md` (los 4 temas que faltan, GLOB) y
  `RESULTADO_018.md` (el límite del corpus, §4).
- Contratos de contenido: `adaptadores/legal-es/generador/contrato-generacion.md`,
  `contrato-calidad-preguntas.md`, `docs/contrato-fuentes-no-boe.md`.
- Temario oficial (para asignar `tema`, nunca inventar números): `datos/legal-es/boe-600-pn/temario-oficial.md`.
