# Cobertura de los temas NO-BOE (27-41) — tracker

Análogo al `datos/legal-es/boe-600-pn/00-indice.md` del corpus BOE. Estado al **2026-08-04**.
Leyenda: ✅ generado y en cola de carga · 🟡 generado, falta 2ª pasada (huecos) · ⛔ bloqueado (necesita módulo) · ⏳ pendiente de generar.

> ## ⚠ DOCUMENTO HISTÓRICO — no lo uses como estado (nota del 20/08/2026)
>
> Esta tabla es del **04/08/2026** y describe una foto que ya no existe. En concreto, marca
> los temas **28-33 como ⛔ bloqueados** y están **todos cargados** desde entonces:
>
> | Tema | Conceptos | Preguntas servibles | En cola `pendiente_revision` |
> |---|---|---|---|
> | 28 | 23 | 18 | 7 |
> | 29 | 14 | 9 | **17** |
> | 30 | 25 | 20 | 8 |
> | 31 | 21 | 20 | 6 |
> | 32 | 23 | 22 | 3 |
> | 33 | 21 | 11 | **12** |
>
> Lo que sí sigue vivo es **otra cosa**: los conceptos `consenso` se cargaron como
> `pendiente_revision` y **el runtime no los sirve** hasta que un humano los apruebe en
> `/admin` (`docs/contrato-fuentes-no-boe.md` §2). Son **53 actividades sobre 40 conceptos**,
> y las 53 están en estos seis temas. No es un bloqueo del pipeline: es la revisión humana
> que el contrato exige, esperando a Jonathan.
>
> Se conserva por lo que explica —el mapa de fuentes por tema y las segundas pasadas
> anotadas—, no por lo que dice del estado. **Para el estado: consulta la base.**

| Tema | Materia | Familia(s) | tipo_fuente | Lote(s) | En PROMPT | Estado |
|------|---------|-----------|-------------|---------|-----------|--------|
| 27 | Derechos Humanos | DUDH, TORT, CEDH | oficial | ddhh-declaracion-universal, ddhh-tortura, ddhh-cedh | 007, 008 | 🟡 (falta Protocolo 15/14 del CEDH) |
| 28 | Globalización / antiglobalización | — | consenso | — | — | ⛔ (espera módulo consenso, PROMPT_011) |
| 29 | Actitudes y valores sociales | — | consenso | — | — | ⛔ |
| 30 | Ética / valores / delitos de odio | — | consenso (+ancla CP 22.4/510) | — | — | ⛔ |
| 31 | Inmigración / migraciones | — | consenso (+ancla OIM/INE) | — | — | ⛔ |
| 32 | Geografía humana / demografía | — | consenso (+ancla INE) | — | — | ⛔ |
| 33 | Seguridad / teorías de la delincuencia | — | consenso | — | — | ⛔ |
| 34 | Drogodependencias | DROGA | oficial | drogas-oms-oeda | 010 | 🟡 (falta politoxicomanía) |
| 35 | Desarrollo sostenible | SOST | oficial | sostenible-agenda2030 | 010 | 🟡 (falta Brundtland literal + gestión ambiental) |
| 36 | Gramática | GRAM | autoridad (RAE) | gramatica-rae | 010 | 🟡 (revisor: cotejar `fuentes` con RAE) |
| 37 | Ortografía | ORTO | autoridad (RAE) | ortografia-rae | 008 | 🟡 (reglas hechas; faltan preguntas de grafía → módulo PROMPT_009) |
| 38 | Sistemas operativos | SO | autoridad | sistemas-operativos | 010 | 🟡 (falta iOS/Android/UNIX/MS-DOS/Windows/ext4/HFS+) |
| 39 | Redes informáticas | REDES | autoridad | redes-osi-tcpip | 010 | ✅ |
| 40 | Inteligencia | INTEL | autoridad | inteligencia-osint | 008 | 🟡 (dato/surface web/darknet sin def. literal aislada) |
| 41 | Ciberdelincuencia | CIBER | autoridad | ciber-incibe | 008 | 🟡 (faltan XSS y CaaS) |

## Resumen
- **Generados (1ª pasada):** 27, 34, 35, 36, 37, 38, 39, 40, 41 (9 temas). En cola de carga (PROMPT_007/008/010).
- **Bloqueados por el módulo de consenso (PROMPT_011):** 28, 29, 30, 31, 32, 33 (Grupo C).
- **Segundas pasadas (huecos anotados):** 27 (protocolos CEDH), 34 (politoxicomanía), 35 (Brundtland + gestión ambiental), 38 (SO móviles/UNIX/MS-DOS/Windows + ext4/HFS+), 40 (defs. aisladas), 41 (XSS, CaaS).
- **Ortografía de grafía/acentuación:** depende del módulo de ortografía (PROMPT_009).

## Notas de fuente
Estos temas no están en el corpus BOE; sus fuentes se traen de su origen autoritativo (ONU, OMS/PNSD,
INCIBE/CNI, RAE, fabricantes técnicos). Ver `docs/plan-temas-no-boe.md` y `docs/contrato-fuentes-no-boe.md`.
