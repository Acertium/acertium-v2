# Marca — Acertium

Identidad visual **compartida con V1** (Acertium es la misma marca; V2 es la evolución del producto, no un rebranding). La fuente de verdad es **`BRAND.md`** (personalidad, tono de voz, paleta light+dark, tipografía, uso del logo).

## Assets (`assets/`)

| Archivo | Uso |
|---------|-----|
| `acertium-logo.svg` | Logo horizontal (anillo + check + wordmark). Cabeceras/pies. Mínimo 120px; embeber **inline** para que use Plus Jakarta Sans. |
| `acertium-symbol.svg` / `acertium-symbol-dark.svg` | Solo el símbolo (anillo + check), claro / oscuro. Avatares, badges, espacios pequeños. |
| `acertium-icon.svg` | Icono de app (fondo verde sólido). Favicons, PWA, stores. |
| `icon-192/512.png`, `apple-icon.png`, `acertium-icon-1024.png`, `acertium-og.png` | Iconos PWA/Apple y Open Graph. |

## Cómo aterriza en la app

- **Color y tipografía → `app/globals.css`** como tokens (`@theme inline`), idénticos a V1: primary `#1D9E75`, bg `#F4F2EC`, etc. Modo oscuro por `prefers-color-scheme`, sin JS.
- **Fuentes → `next/font/google`**: Inter (`--font-inter`, cuerpo) + Plus Jakarta Sans (`--font-jakarta`, títulos/logo).
- **Iconos de app → `app/`**: `icon.png`, `apple-icon.png`, `opengraph-image.png` (Next los detecta por nombre).

## Reglas duras (de BRAND.md)
- Tuteo siempre, frases cortas, honestidad por encima de la venta, **sin gamificación ruidosa** (nada de confetti/medallas).
- No recolorear, estirar, rotar ni rellenar los círculos huecos del logo.
- Al acertar: sobrio (check verde). Al fallar: neutro y útil ("Era la B." + explicación). Nunca "¡no pasa nada!".

Cualquier cambio de marca pasa antes por `BRAND.md`.
