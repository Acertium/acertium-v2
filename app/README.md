# app/ — App Router (Next.js 16)

Las rutas de la app viven aquí. La app arranca en la **raíz del repo** (`package.json`, `next.config.ts`, `proxy.ts`), como en V1.

- `layout.tsx` — layout raíz: fuentes de marca (Inter + Plus Jakarta Sans) y metadatos.
- `globals.css` — tokens de color y tipografía (idénticos a V1; ver `marca/BRAND.md`).
- `page.tsx` — landing pública.
- `icon.png` · `apple-icon.png` · `opengraph-image.png` — iconos que Next detecta por nombre.

El acceso al **cerebro** (schema `acertium_v2`) va por `lib/supabase/cerebro.ts` (solo servidor). El motor y el coach se importan de `../nucleo/*.mjs`.
