# Plan de fuentes — Temas 27-41 (contenido NO-BOE)

Estado: **borrador de estructura** (03/08/2026). Los temas 1-26 del temario PN salen del corpus
BOE-600 (ya cubierto). Los **temas 27-41** son Ciencias Sociales (27-35) y Técnico-Científicas
(36-41) y **no se basan en una norma del BOE**, así que el modelo de grounding cambia.

## 1. El cambio de modelo (importante)

- **Temas 1-26 (legal-es):** grounding = la opción correcta es **cita literal de la norma** del BOE;
  la puerta `verificar-lote` lo comprueba (correcta ⊂ cotejo literal). Fiabilidad máxima.
- **Temas 27-41:** no hay una "norma" única citable. La puerta literal **no aplica igual**. Hace falta
  uno o varios **adaptadores nuevos** que reutilicen el núcleo (concepto / grafo / BKT / actividad)
  pero con un **contrato de fuente distinto**. Esto encaja con la arquitectura núcleo-agnóstico + adaptador.

## 2. Arquitectura propuesta
Nuevos adaptadores, mismo núcleo:
- `adaptadores/ddhh-es/` → T27 (instrumentos internacionales, muchos publicados en BOE → grounding literal como legal-es).
- `adaptadores/tecnico-es/` → T36-T41 (RAE, estándares técnicos, glosario INCIBE).
- `adaptadores/ciencias-sociales-es/` → T28-T33 (el grupo difícil, sin fuente única).
- T34 (drogas) y T35 (sostenible) caen entre "oficial citable" y "consenso"; ver grupos.

## 3. Mapa de fuentes por grupo

### GRUPO A — Instrumentos oficiales citables (grounding literal SÍ, como el BOE)
- **T27 Derechos Humanos:**
  - Declaración Universal de DDHH (1948, ONU) — texto canónico.
  - Convenio Europeo de DDHH (CEDH, 1950; BOE 1979) y su mecanismo (Protocolo 11, BOE-A-1998-15127).
  - Convención contra la Tortura (Nueva York, 1984; instrumento en BOE) + **Protocolo facultativo (BOE-A-2006-11128)**.
  - Convenio Europeo para la prevención de la tortura (Estrasburgo 1987; **BOE-A-1989-15618**).
  - **MNP** (Mecanismo Nacional de Prevención de la Tortura) del Defensor del Pueblo → LO 3/1981 (DA única) + Reglamento (§49, familia **RDP** ya extraída).
  - → Pipeline igual que legal-es: cita literal del instrumento. Alta fiabilidad.
- **T35 Desarrollo sostenible:** Agenda 2030 y los 17 ODS (ONU); definición canónica del Informe Brundtland ("desarrollo que satisface las necesidades del presente sin comprometer…"); instrumentos de gestión ambiental = normativa (p. ej. Ley 21/2013 de evaluación ambiental). Grounding: cita de Agenda 2030 + definiciones canónicas.
- **T34 Drogodependencias (mixto):** definiciones OMS/UNODC (droga, dependencia, tolerancia, adicción, politoxicomanía); clasificación vía convenios internacionales (estupefacientes 1961 / psicotrópicos 1971); "últimas tendencias" = **Informe OEDA / DGPNSD** (Plan Nacional sobre Drogas), con fecha. Grounding: definiciones citables + informe oficial fechado (caduca → re-verificar).

### GRUPO B — Autoridad de referencia única (grounding = cita de la obra autoritativa)
- **T36 Gramática / T37 Ortografía:** **RAE** — Nueva Gramática de la Lengua Española y Ortografía de la lengua española (2010). Autoridad indiscutible; grounding = regla citada de la RAE.
- **T38 Sistemas operativos / T39 Redes:** estándares técnicos — **modelo OSI (ISO/IEC 7498)**, pila TCP/IP (RFCs de IETF), definiciones de dispositivos (hub/switch/router/firewall/DNS/DHCP/proxy), IPv4/IPv6. Grounding: estándar + glosario técnico reconocido.
- **T40 Inteligencia / T41 Ciberdelincuencia:** **Glosario de ciberseguridad de INCIBE** (oficial español, verificado) + CCN-CERT + ENISA; ciclo de inteligencia y OSINT (doctrina CNI/OTAN); surface/deep/dark web. Grounding: definición del glosario INCIBE (cita) para cada término (Botnet, Cryptojacking, Phishing, Ransomware, Spoofing, APT, Cyber Kill Chain…).

### GRUPO C — Ciencias sociales sin fuente única (EL RETO)
Temas: **28** globalización/antiglobalización · **29** actitudes y valores (estereotipos, prejuicios, personalidad autoritaria, grupos) · **30** ética/valores/socialización + **delitos de odio** · **31** inmigración/migraciones · **32** geografía humana/demografía/medio ambiente · **33** seguridad + **teorías de la delincuencia**.
- No hay norma ni obra única; la fuente real del examen es el **manual de academia** + obras de referencia por concepto. Anclas citables parciales:
  - **T32 demografía** → **INE** (definiciones de densidad, tasas de natalidad/mortalidad, crecimiento vegetativo). Citable.
  - **T30 delitos de odio** → **Código Penal** (art. 22.4 agravante, art. 510) + Fiscalía (memoria/circular de delitos de odio). Parcialmente citable.
  - **T31 inmigración** → definiciones OIM/ONU de migración + datos INE.
  - **T33 seguridad / teorías de la delincuencia** → criminología académica (sin fuente oficial única).
  - **T28/T29/T30 (valores)** → conceptos sociológicos de consenso (sin fuente oficial).
- Aquí el grounding literal **no es posible** para buena parte → máximo riesgo de invención (YMYL).

## 4. Adaptación del grounding / verificación
- **Grupos A y B:** misma puerta que legal-es (correcta = cita literal de la fuente citada). Fiable.
- **Grupo C:** puerta adaptada — "afirmación **respaldada por una fuente reconocida citada** (cita textual cuando exista; si es concepto de consenso, paráfrasis fiel + referencia)". Marca `tipo_fuente: consenso` + **revisión humana reforzada**. Es el punto donde hay que decidir política antes de generar nada.

## 5. Prioridad sugerida
1. **Piloto de alta fiabilidad:** T27 (DDHH, citable como BOE), T36/T37 (RAE), T40/T41 (INCIBE). Fuentes claras, valor alto.
2. Después T35, T34, T38/T39.
3. Al final el **Grupo C (28-33)**, ya con la política de verificación y (idealmente) un revisor definidos.

## 6. ~~Decisión pendiente de Jonathan~~ — TOMADA el 03/08/2026

> **Resuelta:** se aceptó el modelo «fuente reconocida + revisión humana reforzada». Está
> escrito en `docs/contrato-fuentes-no-boe.md`, que es el contrato vigente. El Grupo C se
> generó y cargó con ese modelo. Lo de abajo es la pregunta original, ya contestada.
Para el Grupo C: ¿aceptamos el modelo "fuente reconocida + revisión humana reforzada" (sin cita normativa literal), o nos ceñimos primero a lo citable (A/B) y dejamos C para cuando haya revisor? De esto depende cómo se diseña el contrato del adaptador `ciencias-sociales-es`.
