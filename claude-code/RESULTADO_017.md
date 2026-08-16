# RESULTADO_017 — Grupo C oleada 2 (GLOB, ACTIT, SEGT)

Ejecutado el **2026-08-16**. Estado: **completado**. Los tres lotes entraron con el desglose exacto
que preveía el encargo. **Pero la nota final del encargo no es correcta: el temario NO queda
completo** — faltan cuatro temas. Lo detallo en §5, que es lo más importante de este resultado.

## 1. Familias registradas

`GLOB`, `ACTIT` y `SEGT`, con las `norma`/`tema` exactas de los lotes (las del encargo venían
abreviadas y la puerta compara cadena literal).

**El aviso del §1 sobre dominios volvió a hacer falta, y otra vez por el BOE.** El registro propuesto
para SEGT pedía `https://www.boe.es`, pero el lote **no cita boe.es**: nombra la LO 4/2015 y la Ley
5/2014 por su id `BOE-A-…`, y en cambio sí cita `un.org` (la DUDH, art. 3), que el encargo no
listaba. Ajustado a lo que el lote cita de verdad: dominios exigidos **`un.org`, `dle.rae.es` y
`britannica.com`**, con las dos leyes nombradas por id sin URL. Mismo criterio que ETICA en el
PROMPT_016. GLOB y ACTIT sí coincidían con lo propuesto.

## 2. Un control mío que rechazaba contenido bueno — corregido

`globalizacion.json` fue **rechazado de entrada**, con 17 rechazos: sus 17 conceptos de `autoridad`
vienen marcados `estado_verificacion: "pendiente_revision"`, contradiciendo su propio `tipo_fuente`.

El control que lo tumbó lo añadí yo en el PROMPT_016 y **estaba mal planteado**: comparaba con `!==`,
o sea, en los dos sentidos. Lo que hay que impedir es que un lote reclame **más** confianza de la que
su fuente sostiene (un `consenso` diciéndose `verificado`); que reclame **menos** no es peligroso,
solo cauteloso, y rechazarlo es rechazar contenido bueno. Ahora el control es **asimétrico**: rechaza
el exceso, avisa del defecto.

**Y sobre quién manda para cargar:** el `tipo_fuente`, que es la regla del contrato
(`docs/contrato-fuentes-no-boe.md` §2: "`oficial`/`autoridad` que pasan las puertas → `verificado`").
No es una decisión que me haya inventado, pero conviene que Cowork la confirme, porque afecta a 17
preguntas:

- **GLOB es el único de los seis lotes del Grupo C** que marca `pendiente_revision` en conceptos de
  `autoridad`; los otros cinco lo declaran coherente con su tipo (o no lo declaran). Sumado a que
  también pone `revision_humana: "pendiente"` en los 23, parece un bloque copiado, no una decisión.
- El encargo, además, espera "17 autoridad + 6 consenso" y pide verificar `verificado` vs
  `pendiente_revision`, lo que solo cuadra si mandan los `tipo_fuente`.
- **Si Cowork quería de verdad revisar los 23**, se arregla en un comando:
  `node revision-pendientes.mjs` no sirve para degradar, pero un `update` de esos 17 a
  `pendiente_revision` los devuelve a la cola sin tocar nada más.

## 3. Carga — los tres lotes

Conteos **releídos de la base**:

| Familia | Conceptos | `verificado` | `pendiente_revision` | Actividades | `verificado` | `pendiente_revision` |
|---|---|---|---|---|---|---|
| **GLOB** | 23 | **17** (autoridad: DLE, FMI, FSM) | **6** (consenso) | 25 | **18** | **7** |
| **ACTIT** | 14 | **6** (autoridad DLE) | **8** (consenso) | 26 | **9** | **17** |
| **SEGT** | 21 | **10** (7 oficial + 3 autoridad) | **11** (consenso) | 23 | **11** | **12** |

**Coincide exactamente con el encargo** (17+6, 6+8, 7+3+11). Los tres pasaron las cuatro puertas con
**0 rechazos**; sesgo de longitud 28 %, 23 % y 22 %, los tres por debajo del 35 % del estándar.

Base: **2.634 conceptos** · **2.542 preguntas servibles** · **56 en cola de revisión**.

## 4. Aristas cruzadas — las 8 resuelven

- **ACTIT → ETICA**: ACTIT-004→ETICA-003, ACTIT-005→ETICA-006, ACTIT-011→ETICA-007 (`remite`) y
  ACTIT-012→ETICA-004 (`limita`). Posibles porque ETICA entró en el PROMPT_016.
- **SEGT → SC/SP**: SEGT-006→SC-004-princ, SEGT-012→SC-036-drogas, SEGT-009→SP-001, SEGT-010→SP-003.

Ninguna quedó sin resolver; no hizo falta `remision_pendiente`. GLOB no propone aristas fuera de
familia.

## 5. **El temario NO queda completo: faltan 4 temas**

La nota del encargo dice que con estos tres lotes "el temario completo (1-45) está en el cerebro".
**No es así.** Lo he comprobado cruzando el `overlay_entrada` de la convocatoria contra los 45 temas:

**41 de 45 temas tienen contenido y pregunta servible. Faltan por completo los temas 19, 20, 24
y 45** — no es que estén flojos: **tienen cero conceptos**.

| Tema | Materia | Por qué importa |
|---|---|---|
| **19** | Delitos contra el orden público: atentados contra la autoridad y sus agentes, resistencia y desobediencia; desórdenes públicos; tenencia, tráfico y depósito de armas | Es materia penal nuclear para un policía |
| **20** | Delitos informáticos; derecho a la intimidad; la prueba digital en el proceso penal | — |
| **24** | Introducción a la Prevención de Riesgos Laborales: trabajo y salud, riesgos, principios de la actividad preventiva, daños a la salud | Hay PRL cargado (PRL, PRLP, PRLAGE) pero cubre el **Tema 25**, no el 24 |
| **45** | PRL en Seguridad Vial: factores del tráfico, factor humano/ambiental/vehículo, EPI del conductor, mantenimiento del vehículo prioritario | — |

Los temas 19 y 20 son de Código Penal: la familia CP existe (48 conceptos) pero no cubre esos
títulos, igual que no cubre los arts. 22.4ª y 510 que el PROMPT_016 dejó en `remision_pendiente`.
Los temas 24 y 45 son de prevención de riesgos, y no hay lote que los aborde.

**No me he inventado contenido para taparlos.** Hace falta generarlos, y eso es trabajo de Cowork con
agentes.

## 6. Verificación

| Comprobación | Resultado |
|---|---|
| Aserciones (a), (b), (c) | **0 filas** |
| correcta ⊄ opciones · conceptos isla | **0** · **0** |
| ¿Alguna pendiente alcanzable por `simulacro_muestra`? | **0** |
| ¿Algún concepto pendiente candidato en `practicar_estado`? | **0** |
| `npm run test:motor` | verde |
| `npm run build` | verde (exit 0) |

Las **56 actividades y 52 conceptos** de consenso están en la base y **ninguno es alcanzable** por
las vías de selección.

## Pendientes / notas

- **Las 56 de consenso siguen sin revisar.** Los temas 28-33 se sirven solo con su parte citable
  hasta que Jonathan las apruebe en `/admin` (que sigue necesitando `ADMIN_TOKEN`).
- **Confirmad lo de GLOB** (§2): 17 preguntas se sirven ahora que el lote pedía revisar.
- **Faltan los temas 19, 20, 24 y 45** (§5). Es lo que impide decir que el temario está completo.
- Sigue pendiente de encargos anteriores: el lote de *Crime as a Service* (T41), las 21 aristas sin id
  concreto del PROMPT_014, y las segundas pasadas de T34/T35/T36.
