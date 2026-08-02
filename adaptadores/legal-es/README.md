# Adaptadores — dominio `legal-es` (normativa española)

Todo lo específico de cómo entra y se cita la normativa española. El núcleo (`nucleo/`) no sabe de esto.

Piezas (algunas viven hoy como pasos del pipeline y se extraerán a módulo cuando toque):
- **Ingestor BOE** — recorta un código/norma del BOE a `datos/legal-es/<norma>/` (PDF + `<norma>-articulos.json`). Hoy: proceso con `pdftotext` + parser.
- **Extractor de remisiones** — gramática de citas legales ("artículo 55 remite al 116") → aristas `remite` / pendientes. Hoy: script; pendiente de fijar como `extractor-remisiones.mjs`.
- **Modelo de frescura** — normas por BOE, con volatilidad y vigilancia (tabla `norma` en el schema).
- **Plantillas de actividad** — tipos de ejercicio que pegan a texto legal (test, huecos, V/F, corta).

Contrato de cada pieza: ver `docs/006-vision-de-plataforma.md` §4.
