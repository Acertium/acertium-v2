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

## 1. Estado del cerebro (verificado por MCP el 19/08)
- **3.040 conceptos · 2.954 preguntas servibles · 56 en cola de revisión (`pendiente_revision`) · 0 islas.**
- **Corpus BOE-600: 52/52 normas cargadas**, más 6 secciones que NO son del Código 600 (§54 a §59;
  ver `datos/legal-es/boe-600-pn/corpus/README.md`). El directorio tiene 58 ficheros y 4.980 artículos.
  Índice autogestionado en
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
   - **T20** — **CERRADO** (17/08/2026): 93 conceptos en cuatro lotes. La parte de la LECrim cubre
     **los 39 artículos** del bloque 588 bis a – 588 octies, sin hueco.
     - `cp-t20-delitos-informaticos.json` — CP arts. 197, 249, 264 y 189 bis (25).
     - `lecrim-t20-prueba-digital.json` — LECrim arts. 588 bis a – 588 octies (35): principios
       rectores, interceptación de comunicaciones, grabación de conversaciones orales, seguimiento y
       localización, registro de dispositivos de almacenamiento masivo, registro remoto y orden de
       conservación de datos.
     - `cp-t20-acceso-sistemas.json` — los **7 artículos que desbloqueó el CP consolidado** (16):
       197 bis (acceso ilícito e interceptación de transmisiones), 197 ter, 197 quater,
       197 quinquies, 264 bis (obstaculización del funcionamiento), 264 ter y 264 quater.
     - `lecrim-t20-garantias.json` — los huecos del bloque 588 (17): control de la medida
       (588 bis g), afectación de terceros (588 bis h), descubrimientos casuales (588 bis i),
       terminal de tercero (588 ter c), soportes y sellado (588 ter f), prórroga (588 ter h),
       resolución y control de la grabación oral (588 quater c y d), garantías del registro de
       dispositivos (588 sexies c) y deber de colaboración en el registro remoto (588 septies b).
     Los dos últimos lotes se desbloquearon al ingerir los textos consolidados: ver §35 y §37 del
     corpus. Queda fuera a propósito el **art. 588** (apertura de la correspondencia postal): no es
     prueba digital y el enunciado del tema no lo pide.
   - **T18** — **CERRADO** (16/08/2026): 45 conceptos, arts. 234-256 del CP salvo el 249, que vive
     en el T20. Dos lotes: `cp-t18-defraudaciones.json` (8) y `cp-t18-usurpacion-apropiacion.json`
     (21: llaves falsas del 239, usurpación 245-247, otras defraudaciones 251 y 251 bis,
     administración desleal 252, apropiación indebida 253 y apropiación de cosa mueble 254).
     El tema se reetiquetó ese mismo día al enunciado oficial: estaba como «Delitos contra el
     patrimonio: hurto y robo», que con las defraudaciones dentro habría sido falso.
     **Lección del incidente:** los 8 conceptos de `cp-t18-defraudaciones.json` se cargaron por error
     dentro del lote del T20 y hubo que reasignarlos. El temario pone las defraudaciones —«estafas;
     apropiación indebida; defraudaciones de fluido eléctrico y análogo»— en el T18, no en el T20.
     Como `overlay_entrada` tiene PK `(convocatoria, concepto)`, un concepto vive en UN solo tema:
     comprobar el temario ANTES de asignar, no después.
   - **T17** — **CERRADO** (17/08/2026): 151 conceptos en cuatro bloques, y es el tema más grande
     del CP. Cubre **73 de los 74 artículos** que el corpus tiene entre el 138 y el 194 bis; el
     único que falta es el **189 bis**, que vive en el T20 (un concepto = un solo tema).
     - `cp-t17-libertad.json` — arts. 163-172 quater (34).
     - `cp-t17-integridad-moral.json` — arts. 173-177 bis (23), con la trata de seres humanos.
     - `cp-t17-libertad-sexual.json` — arts. 178-194 bis (38): agresión sexual y definición legal
       de consentimiento, violación, circunstancias del 180, actos sexuales con menor de dieciséis
       años y cláusula de proximidad del 183 bis, grooming, acoso sexual, exhibicionismo,
       prostitución, pornografía infantil y disposiciones comunes.
     - `cp-t17-homicidio-lesiones.json` — los huecos del bloque de homicidio, aborto y lesiones
       (40): 140 bis, 141, 142 bis, 143 bis, 145 bis, 151, 152, 152 bis, 153, 154, 155, 156,
       156 bis/ter/quater/quinquies y 157-162 (lesiones al feto y manipulación genética).
     El tema se reetiquetó al enunciado oficial: antes decía solo «homicidio, aborto y lesiones».
     Fuera del tema a propósito: el **195** (omisión del deber de socorro), que es de otro título.
   - **T24** — **CERRADO**: **45 conceptos** (19/08/2026). Ya no queda ningún epígrafe sin fuente.
     - `insst-t24-trabajo-y-salud.json` (15, **19/08/2026**) cierra los dos epígrafes doctrinales que
       quedaban —*concepto general de trabajo* y *el trabajo y la salud*— y añade el bloque de
       *daños a la salud*, que el temario pide y que la LPRL solo define en abstracto. Fuente: el
       manual del **INSST** «Curso de capacitación para el desempeño de funciones de nivel básico»
       (marzo 2019), `tipo_fuente: autoridad` → entra `verificado` y se sirve. Entra la
       interrelación trabajo-salud, la triple dimensión de la salud, el alcance de las condiciones
       de trabajo, el **accidente de trabajo** en su concepto legal y en el técnico-preventivo, los
       **in itinere**, la regla de que la insolación y el rayo nunca son fuerza mayor extraña al
       trabajo, la **enfermedad profesional** y su cuadro, la enfermedad relacionada con el trabajo,
       las «otras patologías» (fatiga, estrés, insatisfacción) y los costes directos e indirectos.
       **Esta familia NO tiene corpus** y es correcto: la regla de `corpus/README.md` reserva el
       corpus a las normas, así que el texto literal viaja en el bloque `fuentes` del lote. En la
       auditoría aparecerá como «no auditable», que es lo esperado, no un fallo.
       - **Ojo con una trampa**: el manual cita la definición de salud de la OMS como «el estado de
         bienestar físico, mental y social completo y no meramente la ausencia de daño o
         enfermedad», que **no** es el texto auténtico del preámbulo. No se ha construido ninguna
         pregunta sobre esa frase; la definición se pregunta en `OMS-001`, contra el auténtico.
       - Lo que **no** se ha duplicado, a propósito: las definiciones de la LPRL que el manual
         reproduce (ya son PRL-004, PRL-005, PRL-033 y PRL-008) y las cuatro disciplinas preventivas
         (ya son PRLAGE-023, en el T25). Se enlazan por relación.
     - `oms-t24-concepto-salud.json` (12, **19/08/2026**) cierra el epígrafe **concepto de salud**,
       que este parte daba por bloqueado. Jonathan aportó el BOE núm. 116, de 15/05/1973, que publica
       la **Constitución de la OMS**: es §59 del corpus y familia `OMS`, con `tipo_fuente: oficial`
       (tratado en BOE, §1 del contrato de fuentes no-BOE), así que va a `verificado` y se sirve.
       Entran los nueve principios del preámbulo —empezando por la definición de salud como «estado
       de completo bienestar físico, mental y social y no solamente la ausencia de afecciones o
       enfermedades»—, la declaración inicial, la fórmula de aceptación y el artículo 1 (finalidad).
       Enganchado al T24 ya cargado por `OMS-001 → PRL-005`, `OMS-001 → PRL-001` y `OMS-002 → PRL-011`.
       **§59 cambió de fuente el mismo día**, y conviene saberlo: se ingirió primero del facsímil del
       BOE de 1973 —transcrito a mano contra la imagen, con la errata «Organización *Mundical* de la
       Salud» incluida— y se sustituyó después por el **texto español auténtico que publica la OMS**
       (*Documentos básicos*, 49.ª ed., 2020), porque el **artículo 74** de la propia Constitución
       declara auténtico el texto español y el BOE solo era su republicación. Los dos textos difieren
       en ortografía y comas («trasmisibles»/«transmisibles», «Organismo»/«organismo»…), nada
       sustantivo, pero eso **rompe la literalidad**: las doce actividades ya cargadas se regeneraron
       y se actualizaron en base. §59 pasó de 12 a **93 entradas** (preámbulo + artículos 1 a 82).
     - Lo de abajo es el estado anterior (17/08), que sigue siendo válido salvo en lo que corrigen
       este bloque y el del INSST.
     - `prl-t24-accion-preventiva.json` (11) cierra el epígrafe *principios generales de la actividad
       preventiva*: el art. 15 LPRL entero, con los nueve principios de la lista y los apartados 2 a
       5 (capacidades profesionales, acceso a zonas de riesgo grave y específico, previsión de
       distracciones e imprudencias no temerarias, riesgos adicionales de las propias medidas y
       operaciones de seguro). Antes solo había dos conceptos sobre ese artículo.
     - Ya estaban cubiertos por corpus: *riesgo laboral* (art. 4.2), *daños derivados del trabajo* =
       consecuencia de los riesgos (art. 4.3), *condición de trabajo* (art. 4.7), *prevención*
       (art. 4.1) y *procesos potencialmente peligrosos* (art. 4.5).
     - Las **cuatro disciplinas preventivas** (art. 8 c) RD 67/2010) **ya están cargadas**, pero en
       el **T25** (`PRLAGE-023`), que es donde el temario sitúa esa norma. No se duplican aquí: un
       concepto vive en un solo tema.
     - ~~**Lo único que falta** son los tres epígrafes doctrinales~~ — **superado**: los tres se
       cerraron el 19/08. *Concepto de salud* con la Constitución de la OMS; *concepto general de
       trabajo* y *el trabajo y la salud*, con el manual del INSST. El T24 no tiene ya ningún
       epígrafe sin fuente.
   - **T42** — **79 conceptos** (19/08/2026), tras `itc-t42-instrucciones-tecnicas.json` (21).
     Las **ITC 1 a 5** no estaban en el corpus porque no son artículos del RD 137/1993: se aprobaron
     por el artículo segundo del **RD 726/2020** y se publicaron como anexos suyos, donde el ingestor
     corta. Ahora son el **§58** del corpus y la familia `ITC`. Lo que entra:
     - **ITC 5 — Tarjeta Europea de Armas de Fuego** (4): objeto, quién fija sus características
       (Dirección General de la Guardia Civil), formato plegable en un único impreso DIN-A4 y la
       fotografía del titular. Es el epígrafe *documentación que ampara la tenencia y porte*.
     - **ITC 3 — armas de alarma y señales** (5): la clave es que las que **no** cumplen las
       especificaciones «serán clasificadas como armas de fuego en su correspondiente categoría».
     - **ITC 2 — inutilización** (7): quién puede inutilizar y la excepción de las armas de guerra y
       **de dotación de la Policía Nacional** (Centros del Ministerio de Defensa o Servicios de
       Armamento), certificado en castellano y en inglés, marcado que conserva el número de serie, y
       las armas seccionadas para enseñanza.
     - **ITC 4 — marcado y componentes esenciales** (5): tamaño de letra de 1,6 mm y la
       **profundidad mínima de 0,0762 mm** que introdujo la Orden INT/291/2025.
     - **Lo que sigue sin fuente en el T42 no cambia**: *origen de las armas de fuego*,
       *funcionamiento* y *balística forense*. Las ITC no los tocan.
   - **T42 (ampliación anterior)** — (17/08/2026): de 30 a 58 conceptos con
     `arm-t42-prohibidas-definiciones.json` (28). El parte daba este tema por «bloque técnico
     no-BOE», y era falso: el §50 del corpus es el **Reglamento de Armas con 174 artículos** y los
     dos epígrafes más preguntados estaban cubiertos con **un solo concepto por artículo**.
     Ahora entran las definiciones del art. 2 que faltaban (repetición, un solo tiro, blanca,
     asimilada, alarma y señales, avancarga, **munición y sus componentes** —que es el «cartucho:
     definición y componentes» del temario—, balas expansiva y perforante, imitación, reproducción,
     Flobert, acústica, armero y corredor) y las **dos listas de armas prohibidas** desglosadas:
     art. 4 (puñal de hoja menor de 11 cm con dos filos y punta, armas disimuladas y culatines,
     defensas y rompecabezas, excepción de museos) y art. 5 (capacidad de carga 21/11, cargadores
     de más de 20/10, recortadas y culata plegable, sprays, defensas eléctricas y extensibles,
     silenciadores, municiones dum-dum, imitaciones y navajas de más de 11 cm).
     **Lo que sigue sin fuente en el T42** es solo lo técnico-doctrinal: *origen de las armas de
     fuego*, *funcionamiento* y *balística forense*. Eso sí es no-BOE.
   - **T45** — **ARRANCADO** (17/08/2026): 27 conceptos, cuando estaba **entero a cero**. Jonathan
     aportó los dos RD que le faltaban y son su primera fuente BOE (§56 y §57 del corpus).
     - `epi-t45-proteccion-individual.json` (14, RD 773/1997): definición de EPI, criterio de último
       recurso frente a la protección colectiva, condiciones que deben reunir, elección y su
       revisión, utilización conforme al fabricante, carácter personal del uso, información previa
       y obligaciones del trabajador.
     - `eqt-t45-equipos-trabajo.json` (13, RD 1215/1997): el **vehículo policial es un equipo de
       trabajo** (art. 2 a), y de ahí cuelgan el deber de mantenimiento (art. 3.5) y el régimen de
       comprobaciones (art. 4), que es lo que fundamenta el «mantenimiento preventivo del vehículo
       prioritario» del temario.
     ⚠ **Ojo al art. 2.2 c) del RD 773/1997**: excluye de su definición «los equipos de protección
     individual de los militares, de los **policías** y de las personas de los servicios de
     mantenimiento del orden», y la letra d) los de «los medios de transporte por carretera».
     Está cargado como concepto propio (`EPI-003`) porque es el matiz que decide la pregunta.
     **Corrección (17/08/2026):** al cerrar el T45 se anotó aquí que por esa exclusión el epígrafe
     «EPI del conductor y pasajeros de vehículos policiales» quedaba **sin fuente**. Era falso. La
     cadena está completa y ya cargada: la Ley 31/1995 excluye a la policía «en aquellas actividades
     cuyas particularidades lo impidan» y remite a normativa específica (art. 3.2, `PRL-003`), y esa
     normativa es el **RD 2/2006, cuyo art. 6.2 dice literalmente que «La Administración
     proporcionará a los funcionarios del Cuerpo Nacional de Policía equipos de protección individual
     adecuados para el desempeño de sus funciones y velará por su uso efectivo y correcto»**
     (§45 del corpus, concepto `PRLP-014`, cargado en el **T25** porque ahí sitúa el temario esa
     norma). No se duplica en el T45: un concepto vive en un solo tema. En su lugar, `EPI-003`
     **remite** a `PRLP-014` y a `PRL-003`, que es para lo que está el grafo.
     Lo único que no existe como norma publicada es la **dotación concreta** (qué EPI lleva de hecho
     un conductor policial): eso es una instrucción interna de la DGP, no citable literalmente.
     Siguen sin fuente los factores del tráfico (humano, ambiental y vehículo) y la siniestralidad
     vial: son **no-BOE**, y la vía es un manual de la DGT.
   - **T44** — 41 conceptos cargados (familia `VCD`). Lo que falta —*seguridad activa y pasiva*,
     sistemas en turismo y motocicleta— es técnico y no sale del corpus: **no-BOE**.

   ⚠ **HUECOS DEL CÓDIGO 600 detectados al mapear el T20 (16/08/2026).** El Código 600 incluye el CP
   y la LECrim en **[Inclusión parcial]**, y lo que deja fuera afecta de lleno a este tema. Verificado
   sección a sección sobre `corpus/`, no de memoria:
   - ~~**LECrim**: el corpus llega al art. 328…~~ **RESUELTO el 17/08/2026**: Jonathan aportó el
     texto consolidado íntegro y el §37 pasó de 121 a 1.037 artículos. Al ingerirlo aparecieron dos
     fallos del ingestor (numeración con letra tipo «588 bis a» y pie del formato «Legislación
     Consolidada»), ya corregidos. Protocolo para sustituir otras secciones: `corpus/README.md`.
   - ~~**CP**: el corpus no tiene 197 bis/ter/quater/quinquies ni 264 bis/ter/quater…~~ **RESUELTO el
     17/08/2026**: entró el texto consolidado y el §35 pasó de 268 a 723 artículos. Los siete
     artículos ya están **cargados en el T20** (`cp-t20-acceso-sistemas.json`).

   **Ya no queda ningún hueco de fuente BOE.** Las dos únicas normas que el temario citaba por su
   nombre y que el Código 600 no incluía —RD 39/1997 y Ley 39/2006— se ingirieron el 17/08/2026 como
   §54 y §55. Antes de sustituir o añadir una sección, leer el protocolo de `corpus/README.md`: hay
   que comprobar que el consolidado contiene lo que ya traía el Código y que `auditar-corpus` sobre el
   banco entero no empeora ningún contador que bloquee.
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

**Y tampoco trae los anexos.** El ingestor corta en `ANEXO`, así que lo que una norma aprueba como
anexo se queda fuera aunque sea contenido de examen. Es lo que pasaba con las **ITC del Reglamento
de Armas**: existían desde 2020 y no estaban en ninguna parte porque no son artículos del RD
137/1993. Se ingieren aparte (§58). Antes de dar por inexistente algo de una norma que sí está en el
corpus, mira si vive en un anexo.

### Arreglo del 19/08 en `cargar.mjs` (camino `--sql`)
El camino JS guardaba `concepto_fuente.referencia_boe` como **NULL** cuando la fuente no es del BOE
(`|| null`), pero el camino `--sql` escribía **cadena vacía**. No es cosmético: la aserción (b) de
`asercion-post-carga.sql` cuenta las referencias BOE distintas de una familia y `''` le cuenta como
una más. Solo se manifiesta al cargar por SQL una familia sin `BOE-A`, y la primera fue `OMS` (la
Constitución de la OMS se publicó en un BOE de 1973 en facsímil, que no lleva identificador). Ahora
el emisor usa `qN()`, que escribe `null`, y además respeta el `norma`/`referencia_boe` propio del
concepto igual que hacía el camino JS.

## 4. Dónde mirar
- Manual y reglas: `CLAUDE.md` (raíz).
- Últimos partes con el detalle fino: `claude-code/RESULTADO_017.md` (los 4 temas que faltan, GLOB) y
  `RESULTADO_018.md` (el límite del corpus, §4).
- Contratos de contenido: `adaptadores/legal-es/generador/contrato-generacion.md`,
  `contrato-calidad-preguntas.md`, `docs/contrato-fuentes-no-boe.md`.
- Temario oficial (para asignar `tema`, nunca inventar números): `datos/legal-es/boe-600-pn/temario-oficial.md`.
