# Acertium — Identidad visual

> **Versión 1.0** — Guía de marca de Acertium
> Última actualización: mayo 2026

---

## Índice

1. Personalidad
2. Tono de voz
3. Paleta de color
4. Tipografía
5. Logo y uso

---

## 1. Personalidad

**Calma profesional**. Moderno y cercano, pero sin infantilismo. Una herramienta seria que cuida al opositor.

Acertium **no es**:

- Una app gamificada con confetti, fuegos artificiales o medallas brillantes cada dos clics.
- Una academia formal con tono institucional, mayúsculas y emoticonos corporativos.
- Una herramienta de productividad ascética y fría que trata al opositor como una métrica.

Acertium **sí es**:

- Una herramienta de trabajo cuidada, con espacios respirados y jerarquía clara.
- Una compañía discreta: te acompaña cuando aciertas y cuando fallas, sin sermonear.
- Una marca que respeta el tiempo del opositor: cero ruido visual innecesario, cero notificaciones que no aporten.

---

## 2. Tono de voz

Cercano pero respetuoso (**tutea**), claro y directo, motivador sin ser cargante, **honesto**.

### Ejes

- **Tuteo siempre.** Nunca usted, nunca corporate plural ("ofrecemos…").
- **Frases cortas.** Si una frase no cabe en una respiración, parte en dos.
- **Honestidad por encima de la venta.** Si algo no funciona, se dice. Si algo es premium, se dice por qué merece la pena, no se oculta.
- **Sin jerga vacía.** Nada de "experiencia transformadora" o "viaje de aprendizaje".
- **Motivar sin condescender.** El opositor no necesita un coach que le diga "¡tú puedes!" en cada pantalla.

### Cómo SÍ escribir

> "Llevas 3 días seguidos haciendo tests. Bien hecho."

> "Has fallado esta pregunta 4 veces. Vamos a verla con calma."

> "Esta explicación es para usuarios Premium. La oposición es larga; cuando quieras saber por qué la respuesta correcta es esa, te esperamos."

> "Acertium llega pronto. Estamos puliendo los últimos detalles para que prepares tu oposición desde el móvil sin complicarte."

### Cómo NO escribir

> ❌ "¡Increíble! ¡Has completado tu primer test! 🎉🎉🎉"

> ❌ "Estimado usuario, le agradecemos su confianza en nuestra plataforma."

> ❌ "Desbloquea tu potencial con Acertium Premium, la experiencia definitiva para opositores comprometidos."

> ❌ "Ha cometido un error en su respuesta. Por favor, revise el material de estudio."

### Voz de la app en momentos concretos

- **Cuando aciertas:** sobrio. Un check verde, contador sube. Nada de "¡EXCELENTE!".
- **Cuando fallas:** neutro y útil. "Era la B." + explicación si tienes acceso. Sin frases tipo "no pasa nada".
- **Cuando termina un test:** datos + siguiente paso. "9 de 10. ¿Repasamos las que has fallado?".
- **Cuando intentas algo Premium siendo gratuito:** transparente, sin presión. Explica qué te perderías y por qué cuesta lo que cuesta, sin urgencias falsas.

---

## 3. Paleta de color

### Modo claro

| Token semántico               | Variable CSS               | Hex      | Uso                                              |
| ----------------------------- | -------------------------- | -------- | ------------------------------------------------ |
| Principal                     | `--color-primary`          | #1D9E75  | Botones primarios, iconos de marca, acentos      |
| Principal oscuro              | `--color-primary-dark`     | #0F6E56  | Texto sobre fondo claro con énfasis, logotipo    |
| Principal suave               | `--color-primary-soft`     | #E1F5EE  | Fondos sutiles, badges, hover states             |
| Fondo base                    | `--color-bg`               | #F4F2EC  | Fondo de la app                                  |
| Superficie / tarjetas         | `--color-surface`          | #FFFFFF  | Tarjetas, modales, áreas elevadas                |
| Texto principal               | `--color-fg`               | #2C2C2A  | Cuerpo de texto                                  |
| Texto secundario              | `--color-muted`            | #6B6A64  | Texto auxiliar, descripciones, metadatos         |
| Acierto                       | `--color-success`          | #2E9E6B  | Indicador de respuesta correcta                  |
| Acierto (fondo)               | `--color-success-bg`       | #E5F4EC  | Fondo de la tarjeta de pregunta acertada         |
| Fallo                         | `--color-danger`           | #D9694B  | Indicador de respuesta incorrecta                |
| Fallo (fondo)                 | `--color-danger-bg`        | #FAEAE4  | Fondo de la tarjeta de pregunta fallada          |
| Fallo (texto)                 | `--color-danger-fg`        | #A33D26  | Texto en zonas de error                          |

### Modo oscuro

| Token semántico               | Variable CSS               | Hex      | Notas                                            |
| ----------------------------- | -------------------------- | -------- | ------------------------------------------------ |
| Principal                     | `--color-primary`          | #5DCAA5  | Verde más claro y luminoso para fondo oscuro     |
| Principal oscuro              | `--color-primary-dark`     | #5DCAA5  | En oscuro coincide con principal (suficiente contraste) |
| Principal suave               | `--color-primary-soft`     | #04342C  | Verde muy oscuro, para badges sobre superficie   |
| Fondo base                    | `--color-bg`               | #1F1F1D  | Fondo de la app                                  |
| Superficie / tarjetas         | `--color-surface`          | #2A2A28  | Tarjetas elevadas sobre el fondo                 |
| Texto principal               | `--color-fg`               | #E1F5EE  | Cuerpo de texto con leve tinte verde para coherencia |
| Texto secundario              | `--color-muted`            | #9FA29B  | Texto auxiliar                                   |
| Acierto                       | `--color-success`          | #4CC38A  | Algo más saturado que el principal para diferenciar |
| Acierto (fondo)               | `--color-success-bg`       | #0F3A28  | Verde profundo para tarjeta correcta             |
| Fallo                         | `--color-danger`           | #E89178  | Coral suavizado, legible sobre fondo oscuro      |
| Fallo (fondo)                 | `--color-danger-bg`        | #3A1810  | Marrón rojizo profundo                           |
| Fallo (texto)                 | `--color-danger-fg`        | #FAEAE4  | Crema claro sobre fondo de fallo                 |

Los valores derivados del modo oscuro (success, danger y sus pares de fondo/texto) son un punto de partida razonable; pueden ajustarse tras pruebas reales en pantalla.

### Estrategia técnica de modo oscuro

Tailwind v4 con `prefers-color-scheme: dark`. Sin JavaScript, sin clase manual, sin flash. Sigue la preferencia del sistema operativo del usuario. Para añadir un toggle manual más adelante, basta con declarar `@custom-variant dark (&:where(.dark, .dark *));` en `globals.css` y conmutar la clase desde un componente cliente.

---

## 4. Tipografía

| Familia               | Pesos típicos | Uso                                    | CSS                       |
| --------------------- | ------------- | -------------------------------------- | ------------------------- |
| **Inter**             | 400, 500, 600 | Cuerpo de texto, UI                    | `font-family: var(--font-sans)` |
| **Plus Jakarta Sans** | 600, 700      | Titulares, logotipo, números destacados | `font-family: var(--font-display)` |

Ambas se cargan via `next/font/google` para optimización automática (subset latin, swap display, self-hosting). Las variables CSS se exponen como `--font-inter` y `--font-jakarta`, y se mapean a los tokens semánticos `--font-sans` y `--font-display` para que Tailwind genere las utilidades `font-sans` y `font-display`.

### Reglas rápidas

- Cuerpo de texto: Inter 400 / 500.
- H1–H2: Plus Jakarta Sans 700.
- H3–H4: Plus Jakarta Sans 600 o Inter 600 (consistencia local primero).
- Números grandes (puntuaciones, contadores): Plus Jakarta Sans 700 con `font-variant-numeric: tabular-nums` para alineación.

---

## 5. Logo y uso

### Activos

Todos los archivos viven en `public/brand/`.

| Archivo                       | Forma         | Cuándo usar                                                                |
| ----------------------------- | ------------- | -------------------------------------------------------------------------- |
| `acertium-logo.svg`           | Horizontal    | Cabeceras, pies, marca completa en superficies amplias.                    |
| `acertium-symbol.svg`         | Símbolo solo  | Espacios pequeños o cuadrados (avatares, badges), modo claro.              |
| `acertium-symbol-dark.svg`    | Símbolo solo  | Igual que el anterior pero con stroke #5DCAA5 para modo oscuro.            |
| `acertium-icon.svg`           | Icono de app  | Favicons, iconos de PWA, app stores, atajos del SO. Fondo verde sólido.    |

### Guía de uso

- **Mínimo recomendado del horizontal:** 120 px de ancho. Por debajo, usa el símbolo.
- **Área de respeto:** dejar un margen libre alrededor del logo equivalente, al menos, al diámetro del círculo interior (≈ 16 px en el viewBox 64×64).
- **Color:** no recolorear el logo fuera de las variantes provistas. Si necesitas un color plano, usa `acertium-icon.svg`.
- **Fondo:** evitar fondos ruidosos. El logo está pensado para superficies neutras (la paleta de Acertium o blanco/gris).
- **No hacer:** estirar, rotar, añadir sombras, gradientes o efectos. Tampoco rellenar los círculos huecos.

### Detalle técnico del logo horizontal

El texto "Acertium" en `acertium-logo.svg` usa `font-family="'Plus Jakarta Sans', system-ui, ...sans-serif"`. Cuando el SVG se renderiza **inline en el DOM** (por ejemplo, embebido como JSX) tiene acceso a la Plus Jakarta Sans cargada por `next/font` y se renderiza correctamente. Cuando se usa **como `<img>` externa**, el navegador no resuelve webfonts dentro del SVG y caerá al fallback (`system-ui`). Para usos donde la fidelidad tipográfica importe, embebe el SVG inline.

---

*Cualquier cambio en marca, color o voz debe pasar por este documento antes de aplicarse al producto.*
