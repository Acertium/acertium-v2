# Contrato de fuentes — adaptadores NO-BOE (temas 27-41)

Decidido por Jonathan (03/08/2026): para el contenido que no es cita literal de una norma se acepta
el modelo **"fuente reconocida + revisión humana reforzada"**. Este contrato adapta el grounding de
`legal-es` a fuentes no normativas, reutilizando el núcleo (concepto/grafo/BKT/actividad) y las puertas
de metadatos y de calidad de distractores SIN cambios.

## 1. Gradiente de fiabilidad de la fuente (`tipo_fuente`)
Cada concepto lleva un campo `tipo_fuente` y su `fuente` (nombre + referencia/URL + fecha):

- **`oficial`** — instrumento o texto oficial citable literalmente (tratado en BOE, Agenda 2030, CP, INE…).
  Grounding = IGUAL que legal-es: la opción correcta es **cita literal** del `cotejo`, que es texto
  literal de la fuente. Puerta literal aplicable. → puede quedar `verificado` si pasa las puertas.
- **`autoridad`** — obra de referencia única e indiscutible (RAE, estándar ISO/IEC, glosario INCIBE,
  RFC). Grounding = **cita literal de la obra** (regla RAE, definición INCIBE, etc.), con referencia a
  la sección/entrada. Puerta literal aplicable. → puede quedar `verificado` si pasa las puertas.
- **`consenso`** — concepto académico/sociológico sin fuente única (Grupo C: T28-33 en su mayoría).
  Grounding = **afirmación respaldada por una fuente reconocida citada**: cita textual cuando exista;
  si es conocimiento de consenso, **paráfrasis fiel** con referencia. La puerta literal NO puede
  exigir substring. → se carga como **`pendiente_revision`**, NO se sirve hasta revisión humana.

## 2. Estado de verificación (workflow de revisión humana)
Se usa el campo existente `actividad.estado_verificacion` (y equivalente en concepto):
- `oficial`/`autoridad` que pasan las puertas → `verificado` (la app los sirve).
- `consenso` → se cargan como **`pendiente_revision`**; el runtime **solo sirve `verificado`**, así que
  no llegan al usuario hasta que un humano (Jonathan o el futuro revisor) los promueve a `verificado`.
- Regla de oro: **ningún concepto `consenso` se sirve sin revisión humana.** El generador nunca marca
  `verificado` un `consenso`.

## 3. Puerta adaptada (`verificar-fuente.mjs`, nueva; complementa a las existentes)
- Todos: exige `fuente` (nombre + referencia/URL + fecha) y `tipo_fuente` válido presentes y no vacíos.
- `oficial`/`autoridad`: aplica el check literal de `legal-es` (correcta ⊂ cotejo; cotejo ⊂ fuente).
- `consenso`: NO exige substring literal; exige (a) `cotejo` con la cita/paráfrasis + referencia
  concreta (obra + apartado/página o URL), (b) `estado_verificacion = 'pendiente_revision'`,
  (c) marca `revision_humana: pendiente`. Rechaza si un `consenso` viene marcado `verificado`.
- Las puertas de **metadatos** (familia↔materia↔tema) y de **calidad de distractores** (Capa 2, ≤35%)
  se aplican IGUAL que en legal-es a los tres tipos.

## 4. Materia/tema y familias
Cada tema no-BOE es una o varias familias (prefijo de id), registradas en `registro-materias.json`
igual que las normas. `referencia_boe` se sustituye por `referencia_fuente` (URL/obra) cuando no hay
BOE; para las `oficial` que sí están en BOE (T27, CP, etc.), se usa el `BOE-A-...` normal.

## 5. Cadencia de re-verificación
Las fuentes con datos vivos (Informe OEDA de drogas, estadísticas INE, tendencias de ciberamenazas)
llevan `fecha` y caducan; re-verificación periódica como los datos normativos. Las estables
(RAE, tratados de DDHH, modelo OSI) no.

## 6. Orden de construcción
1. Piloto `oficial`/`autoridad` (máxima fiabilidad, gate literal): **T27 DDHH**, **T36/37 RAE**, **T40/41 INCIBE**.
2. Técnicos y mixtos: T38/39, T34, T35.
3. `consenso` (T28-33) con el workflow `pendiente_revision` + revisión humana.

## Pendiente de Code (pipeline)
- Añadir estado `pendiente_revision` al flujo y garantizar que el runtime **solo sirve `verificado`**
  (probablemente ya lo hace el selector; confirmar y, si no, filtrar).
- Crear `verificar-fuente.mjs` (§3) y engancharlo al flujo de los adaptadores no-BOE.
- Un mini panel/consulta para que Jonathan promueva `pendiente_revision → verificado` (se solapa con el
  panel de admin de reportes; pueden ser la misma pantalla).
