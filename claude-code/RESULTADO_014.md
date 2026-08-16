# RESULTADO_014 — El cargador ya inserta de verdad; contenido cargado y confirmado

Ejecutado el **2026-08-16**. Estado: **completado**, con tres cosas que dejo sin hacer y explico al
final. El diagnóstico del encargo era correcto: **yo mismo había provocado el falso positivo** una
hora antes, al ejecutar los PROMPT_002-006 con el cargador viejo. Generé el SQL, `marcarCobertura()`
marcó ✓ en el índice, y el SQL nunca llegó a la base.

---

## 1. `cargar.mjs` inserta y confirma

Nueva función **`cargarLote(db, v, meta, registro)`**, que sustituye a `loteASql` como camino de
carga. Usa el cliente service-role (schema `acertium_v2`), el mismo que la app, y por cada lote:

1. **Guard de reejecución.** `actividad` no tiene clave natural, así que un segundo pase la
   duplicaría en silencio. Si ya hay actividades de esa familia, aborta sin tocar nada.
2. `concepto` → upsert por `id`, ignorando duplicados.
3. `concepto_fuente` → upsert por su PK `(concepto_id, norma, articulo)`.
4. `overlay_entrada` → upsert por `(convocatoria_id, concepto_id)`, **solo para conceptos releídos
   de la base** (el SQL viejo hacía `select … from concepto where id in (…)`; ahora se consulta).
5. `actividad` → insert, con la misma baraja de opciones de antes (posición de la correcta repartida).
6. `relacion_concepto` → se consulta qué extremos existen y se insertan solo las aristas cuyos dos
   extremos están; el resto sale como `noResueltas` en el informe.
7. **Confirmación**: relee de la base los conteos de las cuatro tablas y los compara con el lote. Si
   no cuadran, el lote se marca como fallido.

**Cada operación comprueba su `error`**: el primero aborta el lote, no se sigue insertando y **no se
marca el índice**. `loteASql` se conserva para inspeccionar el SQL sin tocar nada
(`node generar.mjs lote.json --sql`).

Nuevo `cliente-cerebro.mjs`: espejo en Node puro de `lib/supabase/cerebro.ts` (que no se puede
importar desde el generador porque lleva `import "server-only"` y es TypeScript). Lee `.env.local`
con un parser mínimo —no hay dependencia `dotenv` en el proyecto— y **nunca imprime su contenido**.
No se ha creado ninguna función `exec_sql` ni nada parecido en producción, como pedía el encargo.

## 2. `marcarCobertura()` solo tras confirmación

El cambio no está en `marcarCobertura()` sino en **quién la llama y cuándo**: `generar.mjs` ahora la
invoca después de `cargarLote()` y solo si `res.ok` (insert sin errores + conteos releídos que
cuadran). Si la carga falla, sale con código 1 y el índice no se toca.

## 3. Índice reconciliado — nuevo `reconciliar-indice.mjs`

Arreglar el cargador evita el problema hacia adelante, pero no detecta un índice ya mentiroso. Nuevo
script que **contrasta cada fila con la base**: una norma es ✓ solo si su familia tiene conceptos en
`acertium_v2.concepto`; si está ✓ con 0 filas vuelve a ⏳, y si está ⏳ pero cargada la marca ✓.
Regenera además la sección "Pendientes (⏳)" y la línea de resumen.

    node adaptadores/legal-es/generador/reconciliar-indice.mjs            # informe
    node adaptadores/legal-es/generador/reconciliar-indice.mjs --aplicar  # corrige

Corrió al final: **0 falsos positivos** (todo lo marcado estaba cargado de verdad) y arregló la
sección de pendientes, que llevaba desfasada desde el 03/08 y seguía listando 16 normas ya extraídas
—`marcarCobertura()` recalcula el resumen pero nunca tocó esa lista—.

**El corpus BOE-600 queda al 100%: 52 de 52 normas, 0 pendientes, 0 a revisar.**

## 4. Carga real — 26 lotes, 1.135 conceptos

Todos pasaron las tres puertas con **0 rechazos** y sesgo de longitud por debajo del 35 % del
estándar. Conteos **releídos de la base**, no del lote:

| Familia | Conceptos | Actividades | Overlay | Encargo |
|---|---|---|---|---|
| PRLP | 44 | 44 | 44 | 002 |
| PRLAGE | 35 | 35 | 35 | 002 |
| RDP | 15 | 15 | 15 | 002 |
| FE | 30 | 30 | 30 | 002 |
| UNI | 50 | 50 | 50 | 003 |
| CDPN | 44 | 44 | 44 | 003 |
| CPOL | 62 | 62 | 62 | 003 |
| PJ | 46 | 46 | 46 | 003 |
| EXTR | **345** | 345 | 345 | 004+005+006 (7 lotes) |
| ENC | 34 | 34 | 34 | 004 |
| RGV | 24 | 24 | 24 | 004 |
| VCD | 41 | 41 | 41 | 004 |
| DPSF | 50 | 50 | 50 | 004 |
| DUDH | 39 | 39 | 39 | 007 |
| TORT | 25 | 26 | 25 | 007 |
| CEDH | 34 | 34 | 34 | 008 |
| CIBER | 22 | 22 | 22 | 008 |
| INTEL | 12 | 27 | 12 | 008 |
| ORTO | 32 | 32 | 32 | 008 |
| SOST | 26 | 26 | 26 | 010 |
| DROGA | 33 | 33 | 33 | 010 |
| REDES | 29 | 29 | 29 | 010 |
| GRAM | 33 | 33 | 33 | 010 |
| SO | 30 | 30 | 30 | 010 |

(TORT e INTEL tienen más actividades que conceptos: sus lotes traen varias preguntas por concepto.
Es lo que dicen los lotes, no un descuadre.)

**Estado global de la base:** 2.481 conceptos · **2.419 preguntas tipo test verificadas** ·
2.801 aristas · 12 remisiones pendientes. Antes de este encargo: 1.346 conceptos.

## 5. Aserciones e integridad — todas a 0

| Comprobación | Filas |
|---|---|
| (a) familia repartida entre dos materias | 0 |
| (b) familia con dos referencias BOE | 0 |
| (c) materia con dos normas | 0 |
| correcta ⊄ opciones (banco tipo test entero) | 0 |
| conceptos isla | 0 |

Con un matiz que conviene saber: hay **6 actividades antiguas** (CE-TP-001/007/010, CE-T1-011/013/016,
cargadas el 1-2/08) cuyo `respuesta` no tiene clave `correcta` y cuyo `opciones` es `null` o
`["Verdadero","Falso"]`. No son `tipo='test'`, no las sirve el banco de test y **no vienen de esta
carga**, pero ahí siguen. Merecen un vistazo aparte.

## 6. Ajuste de `verificar-meta` para fuentes no-BOE (PROMPT_007 §1)

Hecho, y algo más estricto de lo que pedía el encargo. La puerta ahora exige `referencia_boe`
**o** `referencia_fuente`, nunca ninguna de las dos. Para lotes BOE **no se relaja nada**.

El encargo preveía `referencia_fuentes` (plural) como campo aparte, pero **los generadores metieron
la lista dentro de `referencia_fuente` como array**. Se aceptan las dos formas y string suelto.

Lo que no quería perder: la puerta existe porque tres lotes se cargaron con el meta de la
Constitución. Aceptar cualquier `referencia_fuente` no vacía habría dejado a las familias no-BOE sin
ese anclaje. Solución: el registro declara la fuente canónica y la puerta comprueba que **los
dominios de esa fuente aparezcan de verdad en las referencias del lote**. Un lote de la RAE no puede
colarse con el meta de INCIBE. Las cadenas completas no se comparan (el registro guarda el puntero,
el lote la lista de citas con fecha: nunca van a ser iguales).

Self-test añadido, **5/5**: no-BOE citando su fuente PASA · sin ninguna referencia RECHAZA · citando
otra fuente RECHAZA · familia con BOE registrado y meta sin BOE RECHAZA · lote BOE normal PASA.

Además, `referencia_boe` vacía se guarda como **NULL** en `concepto_fuente`, no como cadena vacía:
con `""` la aserción (b) contaría "" como una referencia BOE más.

## 7. Enlaces cruzados — nuevo `enlaces-cruzados.mjs`

Las aristas entre familias que especifican los PROMPT_002-010 estaban sin insertar. Nuevo script
declarativo, idempotente, con informe antes de escribir (`--aplicar` para insertar):

- **86 aristas con id concreto en los dos extremos: las 86 resuelven.** Ninguna rota.
- **10 remisiones** a artículos citados por el encargo pero aún no segmentados (FE→CP arts.
  305/305 bis/306/308/570 bis; PJ→FCS art. 30, LOPJ arts. 443-446 y 549, LECrim art. 288;
  CPOL→FCS art. 26) → `remision_pendiente`, que se resolverán solas cuando esos artículos entren.
- **21 aristas declaradas sin id ni artículo concreto: NO se han inventado destinos.** Van listadas
  abajo para que Cowork las concrete.

Dos tipos de arista los he decidido yo porque el encargo no los fijaba, y los dejo dichos por si hay
que corregirlos: **RGV→TRAF** va como `remite` (son dos reglamentos hermanos, y `remite` es el tipo
objetivo "el texto de A cita a B" según `docs/004`), y **DPSF→SEL** como `desarrolla` (la Orden
INT/632/2024 es literalmente la norma de desarrollo del RD 853/2022).

## 8. Correcciones de catálogo

- **§7**: no es "Guardia Europea de Fronteras" sino la **LO 9/2021 de la Fiscalía Europea**. Lote
  renombrado a `lo-9-2021-fiscalia-europea.json` (con `git mv`) e índice corregido, anotando que el
  nombre del PDF es el equivocado.
- **§16**: era "anexo suelto"; ahora **Orden INT/632/2024**, BOE-A-2024-12811, familia DPSF.
- **§51**: le faltaba la referencia **BOE-A-1999-1826** (el PDF parcial no la imprime).
- **§11**: resuelto y fuera de "A revisar" (ver salvedad 2).
- **§23**: ya no es "1ª tanda": 7 lotes, Títulos I-XV, 345 conceptos.

---

## Lo que NO se ha hecho / decisiones que conviene revisar

### 1. Tres lotes rechazados por la puerta de meta — y los dejo fuera a propósito

Existen en `lotes/` tres lotes que **no figuran en ningún PROMPT**: `ciber-incibe-2.json` (7
conceptos, XSS), `ddhh-cedh-2.json` (15, Protocolos 14 y 15) y `sistemas-operativos-2.json` (14, iOS,
Android, Unix, ext4, HFS+). Son exactamente las "segundas pasadas" que los PROMPT_008 §5 y 010 §4
dejaban anotadas, así que entran en el "carga todo lo generado" de este encargo. Pasan las puertas de
contenido y calidad **pero la de meta los rechaza**, con razón:

| Lote | Motivo del rechazo |
|---|---|
| `ciber-incibe-2` | Cita **CCN-CERT** (ccn-cert.cni.es, guía CCN-STIC-401); el registro solo declara incibe.es para CIBER. |
| `sistemas-operativos-2` | Cita **IBM**, `docs.redhat.com` y Apple/Monterey; el registro declara redhat.com, learn.microsoft.com y support.apple.com. |
| `ddhh-cedh-2` | `norma` = "Protocolos n.º 14 y n.º 15…" y `referencia_boe` = **BOE-A-2021-7554**, distintos de los registrados para CEDH (el Convenio, BOE-A-1979-24010). |

**No los he cargado y no he tocado la puerta para que pasen.** Hacerlo exigía relajar la barrera que
existe precisamente porque tres lotes se cargaron con el meta equivocado, y para contenido que nadie
encargó. Lo que hace falta es una decisión de Cowork, no un parche mío:

- CIBER y SO: ¿se amplía su `referencia_fuente` en el registro para admitir esas autoridades
  (CCN-CERT, IBM)? Si sí, es una línea por familia y los lotes entran.
- CEDH: ¿los Protocolos 14/15 son la **misma familia** (y entonces el registro debe declarar la lista
  de instrumentos admitidos y la puerta aceptar cualquiera de ellos) o una **familia nueva**?
  Es la decisión de fondo, no un detalle de configuración.

### 2. El §11 lo he cambiado fiándome de Cowork, no verificándolo yo

El encargo (PROMPT_006 §3) afirma "verificado (PDF + BD + BOE)". **La parte de base sí la confirmo**:
MININT son 24 conceptos con `norma` = "Real Decreto 207/2024…" y `referencia_boe` = BOE-A-2024-3793.
**La parte del PDF no la he podido verificar**: no hay `pdftotext`/poppler en la máquina y mi intento
de descomprimir los streams del PDF solo devolvió datos de fuentes. Así que he aplicado el cambio que
pedía el encargo, pero que quede dicho que descansa en la comprobación de Cowork, no en la mía.

### 3. Aristas que Cowork tiene que concretar (21)

No me invento destinos (regla del RESULTADO_001 §1). El script las lista al ejecutarlo; en resumen:

- **002:** PRLAGE-004→PRLP-\*, PRLAGE-002→AGE-\* (falta id) · FE-003/029→LECrim, FE-013→LOPJ,
  FE-010/016/022/023→MF (falta artículo).
- **003:** UNI-042…050→PPN, UNI-011→SEL, UNI-025/026→DGP, CDPN-032/041→SEL, CDPN-020→PPN,
  CDPN-040/041→DISC, CDPN-018/037→AGE (falta id) · CPOL-055→LOPJ, PJ-021/033→MF (falta artículo).
- **003 · caso particular:** `PJ-008→FCS art. 5` no es ambiguo por descuido: **el artículo 5 de la LO
  2/1986 está partido en 8 conceptos** (FCS-005-1, -arm, -cop, -ded, -det, -ob, -resp, -sec). Hay que
  decir cuál.
- **004:** VCD→FCS y VCD→TRAF · DPSF→PPN (arts. 16.3/19/29 LO 9/2015).
- **005:** las EXTR→EXT "por descripción" remiten a los RESULTADOS de los generadores, **que no están
  en el repo**. Mismo caso que el ASI del PROMPT_001.
- **008:** CEDH→CE arts. 15/24: **CE-T2-015 y CE-T2-024 no existen**. La CE está cargada con otro
  esquema de ids (CE-T1-\*, CE-T6-\*, CE-TP-\*…). Las dos aristas quedaron sin resolver en la carga
  del lote CEDH. · INTEL↔CIBER y CIBER→CP/LOPD: sin pares concretos.

### 4. Otras notas

- **`registro-materias.json` tenía la clave `ICR` duplicada** (dos veces, con el mismo contenido).
  En JSON gana la última, así que no rompía nada; **no la he tocado** para no mezclar cambios, pero
  conviene borrar una.
- La app **no se ha tocado ni construido** (`npm run build` no procede: esto es generador y datos).
  Tampoco se ha abierto `/practicar` para ver qué sirve ahora con 2.419 preguntas.
- Los PROMPT_009 (ortografía), 011 (consenso) y 012 (admin) son código y siguen su curso aparte.
