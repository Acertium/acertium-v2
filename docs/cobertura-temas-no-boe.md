# Cobertura de los temas NO-BOE (27-41) — tracker

Análogo al `datos/legal-es/boe-600-pn/00-indice.md` del corpus BOE. Estado al **2026-08-04**.
Leyenda: ✅ generado y en cola de carga · 🟡 generado, falta 2ª pasada (huecos) · ⛔ bloqueado (necesita módulo) · ⏳ pendiente de generar.

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
