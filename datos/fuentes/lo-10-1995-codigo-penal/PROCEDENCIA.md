# Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal

**Qué es.** Extracto del código electrónico del BOE *«Normativa para ingreso en
la Policía Nacional Escalas Básica y Ejecutiva»* (el «Código 600»), sección
**35**. Así lo declara el propio PDF en sus metadatos (`Title`), y el prefijo
numérico del fichero coincide con `seccion-035.json` del corpus.

- **Referencia BOE de la norma**: `BOE-A-1995-25444`
- **Páginas**: 84
- **sha256**: `483bef83527715faba04e88c4015f1fb1d1df36c61c71dd0d32bee1388378502`
- **Tipo de fuente**: `oficial`

**Edición o versión.** El PDF **no la declara**. Lo que sí consta, y es lo que
sirve de ancla: la sección correspondiente del corpus registra
`ultima_modificacion: "9 de abril de 2026"`, tomada del texto consolidado de boe.es en la
ingesta. Esa fecha es la que está en `acertium_v2.norma.ultima_modificacion`.

**De dónde salió.** Ya estaba en el repositorio, en `datos/legal-es/lo-10-1995-codigo-penal/`,
pero **git no lo veía**: `.gitignore` excluía `datos/**/*.pdf`. Al retirar esa
línea el 23/08/2026 (regla de Jonathan: de cada PDF se guarda copia versionada)
apareció y se movió aquí, que es la ubicación que fija `datos/fuentes/README.md`.
Los metadatos del PDF datan su generación el **2026-08-02**.

**Fecha de consulta.** No consta. El 2026-08-02 de los metadatos es cuándo se
generó el PDF, que es una cota inferior, no una fecha de consulta. Se dice
en vez de rellenarla con algo verosímil.

**Qué se ingirió.** La sección `seccion-035.json` tiene **723 epígrafes** y
declara `procedencia: ingesta` — se extrajo de este documento, no de los lotes.
Queda por establecer si el extracto del Código 600 recoge la norma **íntegra** o
una selección: son 84 páginas, y eso no se puede decidir sin cotejar contra el
consolidado completo del BOE.
