# Ley 31/1995, de 8 de noviembre, de Prevención de Riesgos Laborales

**Qué es.** Extracto del código electrónico del BOE *«Normativa para ingreso en
la Policía Nacional Escalas Básica y Ejecutiva»* (el «Código 600»), sección
**44**. Así lo declara el propio PDF en sus metadatos (`Title`), y el prefijo
numérico del fichero coincide con `seccion-044.json` del corpus.

- **Referencia BOE de la norma**: `BOE-A-1995-24292`
- **Páginas**: 38
- **sha256**: `c642ad6bbe50a04d52fa0688e5e9b98877d4b07811ad6227841fbe92d8614f83`
- **Tipo de fuente**: `oficial`

**Edición o versión.** El PDF **no la declara**. Lo que sí consta, y es lo que
sirve de ancla: la sección correspondiente del corpus registra
`ultima_modificacion: "9 de abril de 2026"`, tomada del texto consolidado de boe.es en la
ingesta. Esa fecha es la que está en `acertium_v2.norma.ultima_modificacion`.

**De dónde salió.** Ya estaba en el repositorio, en `datos/legal-es/ley-31-1995-prl/`,
pero **git no lo veía**: `.gitignore` excluía `datos/**/*.pdf`. Al retirar esa
línea el 23/08/2026 (regla de Jonathan: de cada PDF se guarda copia versionada)
apareció y se movió aquí, que es la ubicación que fija `datos/fuentes/README.md`.
Los metadatos del PDF datan su generación el **2026-08-02**.

**Fecha de consulta.** No consta. El 2026-08-02 de los metadatos es cuándo se
generó el PDF, que es una cota inferior, no una fecha de consulta. Se dice
en vez de rellenarla con algo verosímil.

**Qué se ingirió.** La sección `seccion-044.json` tiene **55 epígrafes** y
declara `procedencia: ingesta` — se extrajo de este documento, no de los lotes.
Queda por establecer si el extracto del Código 600 recoge la norma **íntegra** o
una selección: son 38 páginas, y eso no se puede decidir sin cotejar contra el
consolidado completo del BOE.
