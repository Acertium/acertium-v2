# Mapa de la documentación — qué manda dónde

> Escrito el 20/08/2026 tras leer entera la documentación del repo, a raíz de un palo de ciego:
> se documentó como «hallazgo» que `overlay_entrada.peso` está cableado al planificador y sin usar,
> cuando el Doc 003 lo tenía escrito desde el 01/08 —incluido el plan de afinarlo con exámenes
> pasados—. Este fichero existe para que el siguiente agente sepa **qué leer antes de tocar qué**.

## Cómo usarlo

**Antes de escribir código o contenido, lee la fila que corresponde.** No basta con `CLAUDE.md`:
manda las reglas, pero no dice dónde está el diseño.

| Vas a tocar… | Lee primero | Por qué |
|---|---|---|
| Cualquier cosa | `CLAUDE.md` · `README.md` · este fichero | Reglas y mapa de carpetas |
| Motor, coach, repaso, `peso`, horizonte | **`docs/003-motor-y-planificador.md`** | Fórmulas, parámetros, ventana de 19 días, triaje. **Trae el plan de evolución: mira la tabla de la Parte D antes de proponer nada** |
| Tablas, campos, qué es caché y qué es verdad | **`docs/004-estructura-de-datos.md`** | El log de `evento` es la fuente de verdad; `estado_dominio` es derivado |
| Pipeline, carriles, barreras, «hecho» | **`docs/005-estandar-de-proceso.md`** | Los 8 carriles, las 7 barreras G1-G7, la definición de hecho |
| Dónde va una pieza nueva | `docs/006-vision-de-plataforma.md` | El test núcleo/adaptador |
| Generar un lote | `contrato-generacion.md` + `contrato-calidad-preguntas.md` + `generador/README.md` | Las reglas 0 a 0-quater y la Capa 2 |
| Contenido no-BOE (T27-41) | `docs/contrato-fuentes-no-boe.md` | `tipo_fuente` y el workflow `pendiente_revision` |
| Formato del examen o el temario | **`datos/legal-es/convocatoria/BOE-A-2026-15055-bases-examen.md`** | La convocatoria vigente, con su PDF al lado y el diff contra la anterior |
| El corpus, ingerir o sustituir una norma | **`datos/legal-es/boe-600-pn/corpus/README.md`** | Qué NO trae el corpus y el protocolo de sustitución |
| Estado real del proyecto | **`claude-code/PARA-CODE-APP.md`** | El parte de traspaso. **Es el documento más desactualizable y el más útil** |
| Historia de una decisión | `claude-code/RESULTADO_NNN.md` · `EJECUCIONES.md` | Por qué se hizo algo así |

## Los cuatro documentos que más se ignoran, y lo que cuesta ignorarlos

1. **Doc 003, Parte D.** Tiene una tabla «MVP ahora → Futuro con datos» que ya anticipa casi todo lo
   que un agente puede creer que está descubriendo: parámetros por concepto, FSRS, DKT, y
   **«Peso de temas: Estimado/manual → Analizado de exámenes oficiales pasados»**.
2. **Doc 004, §Parámetros.** Dice que los parámetros del motor viven en código, no en tabla, y por qué.
3. **`corpus/README.md`, §«Lo que NO trae».** Que un artículo no esté en el corpus **no** significa que
   no exista: el Código 600 es una recopilación con inclusiones parciales, corta en disposiciones y
   preámbulos, y **no trae los anexos**. Ya hizo perder tiempo con las ITC del Reglamento de Armas.
4. **`PARA-CODE-APP.md` §1 bis.** Cuantifica la deuda de profundidad: **~263 artículos de más de 1.500
   caracteres con una sola pregunta**, y avisa de que la unidad de cobertura correcta es el **epígrafe
   del temario**, no el artículo.

---

# Divergencias detectadas al leerlo todo

Verificadas contra el código y contra la base el 20/08/2026, no de memoria.

## 1. Los docs del motor van por detrás del código (el código está bien)

| | Dice | Realidad |
|---|---|---|
| Doc 003 §A.6 | «test 4 opciones `0,25`» | `nucleo/motor-bkt.mjs:31` usa **`1/3`** |
| Doc 004 §Parámetros | `p_G=0.25` | igual |

**El código tiene razón y los docs no.** La app sirve **3 alternativas** en las dos pantallas —
`lib/cerebro.ts:31-43` reduce las 4 opciones guardadas a 3 para practicar, y `lib/simulacro-data.ts:65`
hace lo propio en el simulacro—, así que acertar al azar es 1/3 y el motor ya lo refleja.

Cuidado al leer los contratos de generación: cuando dicen «las 4 opciones» hablan del **banco**, que
guarda 4. El usuario siempre ve 3. Las dos cosas son correctas y conviene no «arreglar» ninguna.

## 2. Trackers no-BOE caducados

- **`docs/cobertura-temas-no-boe.md`** (04/08) marca los temas **28-33 como ⛔ bloqueados**. Están
  cargados: T28=23 · T29=14 · T30=25 · T31=21 · T32=23 · T33=21 conceptos. Lo confirma
  `PARA-CODE-APP.md §1` («el Grupo C cargado con estado por concepto»).
- **`docs/plan-temas-no-boe.md` §6** deja una «decisión pendiente de Jonathan» sobre el Grupo C que
  **ya se tomó** el 03/08: es `docs/contrato-fuentes-no-boe.md`.

Los dos son útiles como historia, pero **no se pueden usar como estado**.

## 3. Dos normas ingeridas y nunca explotadas — con su causa mecánica

De las seis secciones que **no** vienen del Código 600 (`corpus/README.md`), cuatro se explotaron y
dos siguen a cero:

| § | Familia | Norma | Tema | Artículos en corpus | Conceptos |
|---|---|---|---|---|---|
| 54 | `RSP` | RD 39/1997, Reglamento de los Servicios de Prevención | 25 | 42 | **0** |
| 55 | `DEP` | Ley 39/2006, de Dependencia | 23 | 48 | **0** |
| 56 | `EPI` | RD 773/1997 | 45 | 10 | 14 |
| 57 | `EQT` | RD 1215/1997 | 45 | 6 | 13 |
| 58 | `ITC` | ITC 1-5 del Reglamento de Armas | 42 | 5 | 21 |
| 59 | `OMS` | Constitución de la OMS | 24 | 93 | 12 |

**La causa está localizada: `RSP` y `DEP` no están en `registro-materias.json`** (80 familias
registradas, ninguna es esa). Sin familia registrada, `verificar-meta.mjs` rechaza el lote y no emite
SQL — funcionando exactamente como debe. Se ingirieron el 17/08 y ahí se quedaron.

No es teoría: **las dos han caído en examen** (RD 39/1997 art. 14 y Ley 39/2006 art. 1, ver
`docs/articulos-que-pregunta-el-tribunal.md`). **Primer paso concreto: registrar ambas familias.**

## 4. Lo que yo redescubrí estando ya escrito

Para que quede el registro del error:

| Lo presenté como hallazgo | Ya estaba en |
|---|---|
| `overlay_entrada.peso` cableado al planificador y clavado a 1 | Doc 003 §B.1, §D y §E · Doc 004 §Capa 2 |
| `HORIZONTE_DIAS = 180` por no haber fecha de examen | `PARA-CODE-APP.md §2.4` |
| La deuda de profundidad (1 pregunta por concepto) | `PARA-CODE-APP.md §1 bis` (263 artículos, 19/08) |
| Las elisiones y cotejos truncados | `PARA-CODE-APP.md §2.6` |

Lo que **sí** era nuevo y no estaba en ningún sitio: qué artículos pregunta el tribunal de verdad
(trazado desde los seis exámenes), que el examen es plano (80/64, 88 % de artículos sin repetir), y
las dos normas a cero de arriba. La diferencia entre unos y otros es que los primeros se podían haber
leído y los segundos había que medirlos.

## 5. Deuda declarada que sigue abierta

Recogida de todos los documentos, en un solo sitio:

| Qué | Dónde está escrito |
|---|---|
| ~62 elisiones · ~18 cotejos truncados · 7 reformulados | `PARA-CODE-APP.md §2.6` |
| No tocar `CEDH-031` (plazo derogado) ni `DP-002` (errata del BOE) | `PARA-CODE-APP.md §2.6` |
| `remision_pendiente`: CP arts. 22.4ª y 510 nunca resolverán desde este corpus | `PARA-CODE-APP.md §3` |
| Distractores de `CIBER-2` (43 %) y `CEDH-2` (47 %): pasan la puerta, fallan el objetivo de Capa 2 | `PARA-CODE-APP.md §2.3` |
| Cola de revisión de `consenso` en `/admin` (acción de Jonathan) | `contrato-fuentes-no-boe.md §2` |
| Módulo de ortografía: falta el lote ORTO de grafía/acentuación | `docs/modulo-ortografia.md §Pendiente` |
| Vigilante de frescura y tabla `norma` (G7): diseñado, no construido | `docs/005 §9` |
| `.git/index.lock` huérfano con dos agentes a la vez | `PARA-CODE-APP.md §2.5` |

## Regla que propongo para no repetirlo

**Antes de escribir un `docs/` nuevo que afirme un hallazgo sobre el motor, el planificador o el
esquema, hay que poder decir en qué documento se comprobó que no estaba ya.** Cuesta cinco minutos y
habría evitado los cuatro casos de §4.
