# AcertiumV2 — el SO del conocimiento

Un núcleo que convierte cualquier corpus verificable en un cerebro que enseña, mide la absorción y guía el estudio. Hoy: vertical de oposiciones (Constitución / Policía Nacional). Mañana: cualquier corpus, vendible a instituciones. Ver `docs/006-vision-de-plataforma.md`.

> **Regla que gobierna el repo:** cada pieza o es **núcleo agnóstico** (`nucleo/`, vale para cualquier corpus) o es un **adaptador por dominio** (`adaptadores/`, propio de cómo entra o se cita ese corpus). Nada específico de un dominio entra en el núcleo. Test: *¿esto vale igual para una ley, un libro de mates y un manual de empresa?*

## Mapa de carpetas

| Carpeta | Qué contiene | Capa (Doc 006) |
|---------|--------------|----------------|
| `docs/` | Diseño y estándares (001-006). Empezar por 001 y 006. | — |
| `nucleo/` | **Agnóstico.** `verificador-cotejo.mjs`, `motor-bkt.mjs`, `planificador.mjs`. | núcleo |
| `adaptadores/<dominio>/` | **Por dominio.** Ingestor, gramática de citas, frescura, plantillas. Hoy: `legal-es/`. | adaptador |
| `datos/<dominio>/<norma>/` | Corpus: fuente bruta + recorte + `<norma>-articulos.json` de trabajo. | datos |
| `infra/` | Transversal. `barreras.sql` (integridad). | transversal |
| `marca/` | Identidad visual (compartida con V1): `BRAND.md` + `assets/` (logo, símbolo, iconos). | — |
| `prototipos/` | Demos desechables (el profesor). `_descartes/` = basura movida. | — |
| `app/`, `lib/`, `proxy.ts`, `package.json`… | **La app (Next.js 16 / Vercel)** vive en la raíz, como en V1. `app/` = App Router; `lib/` = código de app; `lib/supabase/cerebro.ts` accede a `acertium_v2`. | producto |

## La app (Next.js)

Andamiaje clonado de V1: Next 16 · React 19 · `@supabase/ssr` · Tailwind v4 · pnpm. Tokens de marca en `app/globals.css`. Arranque: `pnpm install && pnpm dev`.

**Gate de infra pendiente para conectar el cerebro:** el schema `acertium_v2` debe **exponerse a la API** en Supabase (Settings → API → Exposed schemas) para que la app lo lea vía `lib/supabase/cerebro.ts`. Hasta entonces, la landing y la marca funcionan; las pantallas con datos esperan ese paso.

## Dónde va cada cosa nueva

- ¿Lógica que vale para cualquier corpus (dominio, memoria, verificación, plan)? → `nucleo/`.
- ¿Cómo se lee/cita/vigila un corpus concreto? → `adaptadores/<dominio>/`.
- ¿Un corpus (PDF, JSON de trabajo)? → `datos/<dominio>/<norma>/`.
- ¿Comprobaciones de integridad, migraciones, ops? → `infra/`.
- ¿Un documento de diseño? → `docs/NNN-slug.md`.

## El cerebro (datos) vive en la nube

Las tablas y el contenido (conceptos, grafo, normas, actividades, eventos, absorción) están en **Supabase**, proyecto `Acertium-prod`, schema **`acertium_v2`** — app independiente de V1 (schema `public`). Este repo es el **código y el diseño**; los datos son cloud.

## Pruebas

```
node nucleo/motor-bkt.mjs       # motor de absorción (BKT + olvido)
node nucleo/planificador.mjs    # el coach (reparto nuevo/repaso)
node nucleo/verificador-cotejo.mjs
# infra/barreras.sql se ejecuta contra el schema acertium_v2 tras cada carga
```
