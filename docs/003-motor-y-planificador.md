# Acertium — Documento 003: Motor de absorción y Planificador

> Cómo Acertium mide el conocimiento de cada usuario y cómo decide qué estudiar. Es la parte "viva" del Cerebro (§3 del Doc 001).
> Fecha: 2026-08-01 · Estado: diseño cerrado para el MVP.

Dos capas, separadas a propósito:
1. **Motor de absorción** — estima cuánto domina el usuario cada concepto y cuándo lo olvidará. (BKT + olvido.)
2. **Planificador (coach)** — decide, cada sesión, la mezcla entre **avanzar** (conceptos nuevos) y **afianzar** (repaso), según el tiempo al examen y la disponibilidad del usuario.

El Planificador va **encima** del Motor. Cambiar uno no rompe el otro.

---

## PARTE A — Motor de absorción (BKT + olvido)

### A.1 Qué resuelve
Dos trabajos que se suelen confundir, aquí unificados en un solo estado:
- **Dominio:** ¿cuánto sabe del concepto? (0-100%) → la "absorción".
- **Repaso:** ¿cuándo hay que volver a sacárselo? → sale del mismo modelo.

### A.2 Estado (por usuario × concepto)
- `L` — P(dominado): creencia de que lo sabe (0-1).
- `tau` (τ) — estabilidad: "vida media" de la memoria; crece con repasos exitosos espaciados.
- `last_seen` — fecha del último intento sobre ese concepto.
- Parámetros `p_L0, p_T, p_S, p_G` — **globales** en el MVP (mismos para todos los conceptos); se pasan a por-concepto cuando haya datos.

### A.3 Actualización en cada respuesta (momento t, acierto ∈ {sí, no})
1. **Olvidar (decae por tiempo):**
   `Δt = t − last_seen` · retención `r = objetivo^(Δt / tau)` · `L⁻ = L · r`
   → con esta forma, **`tau` = días hasta que la retención baja al objetivo (90%) = el propio intervalo de repaso.** Interpretable y limpio.
2. **Observar (Bayes con slip/guess):**
   - Acierta: `L⁺ = L⁻(1−p_S) / [ L⁻(1−p_S) + (1−L⁻)·p_G ]`
   - Falla:   `L⁺ = L⁻·p_S / [ L⁻·p_S + (1−L⁻)(1−p_G) ]`
3. **Aprender (transición):** `L = L⁺ + (1−L⁺)·p_T` (se aplica siempre: también al fallar se aprende al ver la solución).
4. **Actualizar estabilidad (sensible al espaciado):**
   - Acierta: `g = 1 + (m−1)·(1−r)/(1−objetivo)`, con tope `gcap`; `tau ← tau · g`.
     A tiempo (`r=objetivo`) → `g=m`; empollado (`r≈1`) → `g≈1` (**no premia el atracón**); tarde (`r<objetivo`) → bonus por dificultad deseable.
   - Falla: `tau ← max(tau₀, tau · penal)`.
5. `last_seen = t`.

### A.4 Lo que ve el usuario ("absorción en vivo")
`absorcion(ahora) = L · objetivo^((ahora − last_seen) / tau)`
Un porcentaje por concepto que **decae con el tiempo** hasta que se repasa. Ej.: *"Art. 9: 72% · repasar en 2 días."*

### A.5 Repaso (el "cuándo"), gratis del mismo modelo
Como `tau` = días hasta bajar al objetivo, el **próximo repaso toca en `Δt = tau`**. Más estabilidad → intervalo más largo. Un solo motor hace dominio + programación (sabor FSRS con estado BKT).

### A.6 Parámetros por defecto (MVP; se afinan con datos)
`p_L0 = 0,20` · `p_T = 0,15` · `p_S = 0,10` · `tau₀ = 1 día` · objetivo `0,90` · `m = 2,2` (multiplicador de `tau` en un repaso a tiempo) · `penal = 0,4` (al fallar) · `gcap = 4` (tope de crecimiento).
**Adivinar (`p_G`) por formato:** test 4 opciones `0,25` · V/F `0,50` (evidencia débil: una V/F acertada apenas mueve el dominio) · huecos/corta `0,05`.

### A.7 Validación e implementación
Motor implementado y probado en `nucleo/motor-bkt.mjs` (`node motor-bkt.mjs` ejecuta las pruebas). Comportamiento verificado: escalera de intervalos espaciados (1 → 2,2 → 4,8 → 10,6 → 23 → 51 → 113 días), empollar no genera durabilidad (τ se queda en ~1 día), y un fallo hunde L y τ. La **persistencia** (`estado_dominio`) se conecta cuando exista la app; el motor es puro y recomputable desde el log de eventos.

---

## PARTE B — Planificador (el coach)

Decide, en cada sesión, cómo repartir el **presupuesto** (tiempo/ítems de hoy) entre **consolidar** y **ampliar**, en función del tiempo al examen y de la capacidad del usuario.

### B.1 Inputs
- Del usuario: **fecha del examen**, **disponibilidad** (días/semana + minutos/sesión), opcional un **objetivo** (p. ej. 85% en todo lo que entra).
- Del sistema: el **peso de cada concepto/tema en el examen** (dato del overlay de convocatoria; afinable analizando exámenes pasados).

### B.2 La regla
1. **Ventana de estabilización = 19 días** (≈ la suma de los 4 primeros intervalos de repaso: 1+2,2+4,8+10,6). No es un número mágico: es lo que tarda un concepto nuevo en recibir suficientes repasos espaciados.
2. **Fecha de corte** = examen − ventana. **Pasada la fecha de corte → cero conceptos nuevos: todo a consolidar.**
3. **Antes del corte, ritmo de introducción** = `conceptos_nuevos_restantes / días_hasta_el_corte` (reparto uniforme).
4. **Gating por el grafo:** un concepto nuevo no se introduce hasta que **todos sus prerrequisitos están a `L ≥ 0,6`**. El grafo decide el orden.
5. **Reserva anti-inanición:** los repasos vencidos van primero (el olvido es el enemigo), pero se reserva hueco para nuevos (≤ 60 % del presupuesto en modo normal), para que ni repasos ni nuevos se ahoguen entre sí. Prioridad de repasos = **peso × cuánto ha decaído**; de nuevos = **peso**.

### B.3 Triaje (cuando no da tiempo) — descubierto por la simulación
Si el horizonte total (examen − hoy de inicio) **es menor que la ventana**, no hay margen sano: la regla de corte, sin más, dejaría **cero conceptos nuevos para siempre** (0 % de cobertura). Fallo real que cazó la simulación. La corrección: **modo triaje**, que introduce igualmente lo que **más pesa** (nuevos ≤ 80 % del presupuesto), asumiendo que no cuajará del todo, y **lo dice claro**.

### B.4 Dos métricas honestas (no una)
- **Dominado (≥90 %)**: peso de conceptos con memoria durable. En plazos cortos puede ser 0 %.
- **Puntuación esperada**: absorción media ponderada = fracción del temario que previsiblemente aciertas. Es la que informa en triaje (*"con tu tiempo, ~47 %: apruebas raspado, céntrate en lo que puntúa"*). Nunca prometer cobertura imposible.

### B.5 Adaptación e implementación
El plan es vivo: se **re-planifica cada día** con el estado real; un día perdido recalcula el ritmo. Implementado y probado en `nucleo/planificador.mjs` (compone con `motor-bkt.mjs`; `node planificador.mjs` corre las pruebas). Validado sobre los 86 conceptos del Título I en 4 escenarios (holgado→muy justo): los modos normal → consolidación → triaje se activan solos y la cobertura proyectada baja de forma honesta al acortar el plazo.

---

## PARTE C — La base que NO cambia: log crudo de eventos

Todo lo anterior (estado BKT, planificación) es un **cálculo por encima** de un registro crudo de interacciones:

```
evento { usuario, concepto, item, tipo_actividad, fecha, acierto, tiempo_respuesta }
```

Guardar el evento crudo es la decisión de arquitectura innegociable: permite recomputar el dominio histórico, **reajustar parámetros** y hasta **cambiar de modelo** (a FSRS, a BKT por-concepto, a DKT) **sin re-arquitectar nada**. Si solo se guardara el estado ("caja 3"), habría lock-in.

---

## PARTE D — Camino de evolución (empezar simple, subir con datos)

| Pieza | MVP (ahora) | Futuro (con datos) |
|-------|-------------|--------------------|
| Dominio | BKT + olvido, parámetros globales por defecto | Parámetros ajustados por concepto; variantes de olvido |
| Repaso | Del propio `tau` (objetivo 0,9) | FSRS afinado con los eventos reales |
| Relaciones entre conceptos | Prerrequisitos manuales del grafo | DKT / atención (aprende relaciones de los datos) |
| Peso de temas | Estimado / manual | Analizado de exámenes oficiales pasados |

Nada de ML en el MVP: son ~100 líneas de lógica sobre el log de eventos.

---

## PARTE E — Qué NO hace todavía (límites del MVP)
- No ajusta parámetros por concepto (globales).
- No modela relaciones profundas entre conceptos (solo prerrequisitos del grafo).
- No hay DKT/redes neuronales.
- El peso de cada tema en el examen empieza estimado, no analizado.

Se añaden cuando el núcleo funcione y haya datos reales — nunca antes (principio: ¿esto acerca al MVP?).
