# BOE-600 · Normativa PN — corpus por norma

Cada PDF = una norma (§) del Código electrónico 600, más el comienzo oficial (portada, sumario, índice, §1). Fuente bruta completa en `../_fuentes-brutas/`. El comienzo oficial (páginas 1-34) lo aportó Jonathan partido fino; sustituyó a una extracción provisional mía (movida a `../_fuentes-brutas/_descartes/`).

**Meta: el 100% de este corpus dentro del cerebro (una familia de conceptos por norma).** La columna **Estado** rastrea la cobertura: ✓ = extraído y cargado en la BD · ⏳ = pendiente · ⚠ = revisar.

**Este índice se mantiene solo** (desde el 03/08/2026): `marcarCobertura()` en `cargar.mjs` localiza la norma por su `referencia_boe`, la marca ✓ con la fecha y su familia, y recalcula la línea de resumen contando la propia tabla. §1 (Introducción) no es una norma y no cuenta en el total.

**Desde el 16/08/2026 la marca ✓ exige confirmación de la base.** Antes se ponía al *emitir* el SQL, así que bastaba con que nadie ejecutara ese SQL para que el índice diera por cargadas normas con cero filas (pasó con FE, PRLP, PRLAGE y RDP). Ahora `cargar.mjs` inserta con el cliente service-role, comprueba el error de cada operación y **relee los conteos**; solo entonces se marca. Para auditar el índice contra la base en cualquier momento: `node adaptadores/legal-es/generador/reconciliar-indice.mjs` (con `--aplicar` corrige). La comprobación dura sigue siendo `asercion-post-carga.sql`.

Resumen: **52 de 52 normas extraídas · 0 pendientes**.

| # | Archivo | Norma | Referencia BOE | Familia | Estado |
|---|---------|-------|----------------|---------|--------|
| — | `00-portada.pdf` | Portada del Código | | — | — |
| — | `00-sumario.pdf` | Sumario (índice por §) | | — | — |
| — | `00-indice-sistematico.pdf` | Índice sistemático + anexo | | — | — |
| 1 | `01-introduccion.pdf` | Introducción | | — | — |
| 2 | `02-codigo-civil-parcial.pdf` | Código Civil [parcial] | BOE-A-1889-4763 | CC | ✓ |
| 3 | `03-constitucion-espanola.pdf` | Constitución Española | BOE-A-1978-31229 | CE | ✓ |
| 4 | `04-lo-2-1979-tribunal-constitucional.pdf` | LO 2/1979 Tribunal Constitucional | BOE-A-1979-23709 | TC | ✓ |
| 5 | `05-lo-3-1981-defensor-del-pueblo.pdf` | LO 3/1981 Defensor del Pueblo | BOE-A-1981-10325 | DP | ✓ |
| 6 | `06-lo-4-1981-estados-alarma-excepcion-sitio.pdf` | LO 4/1981 estados de alarma, excepción y sitio | BOE-A-1981-12774 | EAES | ✓ |
| 7 | `07-lo-9-2021-reglamento-ue-fronteras.pdf` | LO 9/2021, de aplicación del Reglamento (UE) 2017/1939 — Fiscalía Europea (el nombre del PDF es erróneo: no es Guardia Europea de Fronteras) | BOE-A-2021-10957 | FE | ✓ 2026-08-16 |
| 8 | `08-ley-40-2015-regimen-juridico-sector-publico.pdf` | Ley 40/2015 Régimen Jurídico del Sector Público | BOE-A-2015-10566 | AGE | ✓ |
| 9 | `09-ley-50-1997-del-gobierno.pdf` | Ley 50/1997 del Gobierno | BOE-A-1997-25336 | GOB | ✓ |
| 10 | `10-rdleg-5-2015-ebep.pdf` | RD Leg. 5/2015 (EBEP) | BOE-A-2015-11719 | EBEP | ✓ |
| 11 | `11-estructura-organica-ministerio-interior.pdf` | Estructura orgánica básica del Ministerio del Interior (= RD 207/2024, la misma norma que MININT; deroga el RD 734/2020) | BOE-A-2024-3793 | MININT | ✓ |
| 12 | `12-orden-int-859-2023-estructura-interior.pdf` | Orden INT/859/2023 (estructura Interior) | BOE-A-2023-17072 | DGP | ✓ |
| 13 | `13-lo-9-2015-regimen-personal-policia-nacional.pdf` | LO 9/2015 Régimen de Personal PN | BOE-A-2015-8468 | PPN | ✓ |
| 14 | `14-lo-4-2010-regimen-disciplinario-policia.pdf` | LO 4/2010 Régimen disciplinario CNP | BOE-A-2010-8115 | DISC | ✓ |
| 15 | `15-rd-853-2022-procesos-selectivos-formacion.pdf` | RD 853/2022 (procesos selectivos y formación) | BOE-A-2022-16582 | SEL | ✓ |
| 16 | `16-desarrollo-procesos-selectivos-formacion.pdf` | Orden INT/632/2024 (desarrollo del Reglamento de procesos selectivos y formación PN) | BOE-A-2024-12811 | DPSF | ✓ 2026-08-16 |
| 17 | `17-orden-int-430-2014.pdf` | Orden INT/430/2014 | BOE-A-2014-2997 | UNI | ✓ 2026-08-16 |
| 18 | `18-rd-49-2024.pdf` | RD 49/2024 | BOE-A-2024-814 | CDPN | ✓ 2026-08-16 |
| 19 | `19-lo-2-1986-fuerzas-cuerpos-seguridad.pdf` | LO 2/1986 Fuerzas y Cuerpos de Seguridad | BOE-A-1986-6859 | FCS | ✓ |
| 20 | `20-rd-555-2011.pdf` | RD 555/2011 | BOE-A-2011-7173 | CPOL | ✓ 2026-08-16 |
| 21 | `21-rd-769-1987-policia.pdf` | RD 769/1987 (regulación de la Policía) | BOE-A-1987-14578 | PJ | ✓ 2026-08-16 |
| 22 | `22-lo-4-2000-extranjeria.pdf` | LO 4/2000 Extranjería | BOE-A-2000-544 | EXT | ✓ |
| 23 | `23-rd-1155-2024-reglamento-extranjeria.pdf` | RD 1155/2024 (Reglamento de Extranjería) — 7 lotes, Títulos I-XV, 345 conceptos | BOE-A-2024-24099 | EXTR | ✓ 2026-08-16 |
| 24 | `24-rd-240-2007-libre-circulacion-ue.pdf` | RD 240/2007 (libre circulación UE) | BOE-A-2007-4184 | UE | ✓ |
| 25 | `25-ley-12-2009-asilo.pdf` | Ley 12/2009 derecho de asilo | BOE-A-2009-17242 | ASI | ✓ |
| 26 | `26-rd-203-1995-reglamento-asilo.pdf` | RD 203/1995 (Reglamento de asilo) | BOE-A-1995-5542 | ASIR | ✓ |
| 27 | `27-rd-865-2001-apatrida.pdf` | RD 865/2001 (estatuto de apátrida) | BOE-A-2001-14166 | APAT | ✓ 2026-08-03 |
| 28 | `28-rd-1325-2003-proteccion-temporal.pdf` | RD 1325/2003 (protección temporal) | BOE-A-2003-19714 | PTEMP | ✓ 2026-08-03 |
| 29 | `29-rd-220-2022-acogida-proteccion-internacional.pdf` | RD 220/2022 (acogida protección internacional) | BOE-A-2022-4978 | ACOG | ✓ 2026-08-03 |
| 30 | `30-ley-5-2014-seguridad-privada.pdf` | Ley 5/2014 Seguridad Privada | BOE-A-2014-3649 | SP | ✓ |
| 31 | `31-lo-4-2015-seguridad-ciudadana.pdf` | LO 4/2015 Seguridad Ciudadana | BOE-A-2015-3442 | SC | ✓ |
| 32 | `32-ley-8-2011-infraestructuras-criticas.pdf` | Ley 8/2011 (infraestructuras críticas) | BOE-A-2011-7630 | IC | ✓ |
| 33 | `33-rd-704-2011-infraestructuras-criticas.pdf` | RD 704/2011 (Reglamento IC) | BOE-A-2011-8849 | ICR | ✓ |
| 34 | `34-orden-pci-487-2019.pdf` | Orden PCI/487/2019 | BOE-A-2019-6347 | ENC | ✓ 2026-08-16 |
| 35 | `35-lo-10-1995-codigo-penal.pdf` | LO 10/1995 Código Penal | BOE-A-1995-25444 | CP | ✓ |
| 36 | `36-lo-6-1985-poder-judicial-parcial.pdf` | LO 6/1985 Poder Judicial [parcial] | BOE-A-1985-12666 | LOPJ | ✓ |
| 37 | `37-rd-1882-ley-enjuiciamiento-criminal.pdf` | LECrim (RD 14/09/1882) | BOE-A-1882-6036 | LEC | ✓ |
| 38 | `38-lo-6-1984-habeas-corpus.pdf` | LO 6/1984 (habeas corpus) | BOE-A-1984-11620 | HC | ✓ |
| 39 | `39-ley-50-1981-estatuto-ministerio-fiscal.pdf` | Ley 50/1981 (Estatuto Ministerio Fiscal) | BOE-A-1982-837 | MF | ✓ |
| 40 | `40-ley-4-2015-estatuto-victima-delito.pdf` | Ley 4/2015 Estatuto de la víctima | BOE-A-2015-4606 | VIC | ✓ |
| 41 | `41-lo-1-2004-violencia-genero.pdf` | LO 1/2004 Violencia de Género | BOE-A-2004-21760 | VG | ✓ |
| 42 | `42-lo-3-2007-igualdad-mujeres-hombres.pdf` | LO 3/2007 igualdad mujeres y hombres | BOE-A-2007-6115 | IG | ✓ |
| 43 | `43-ley-4-2023-igualdad-trans-lgtbi.pdf` | Ley 4/2023 igualdad trans y LGTBI | BOE-A-2023-5366 | LGTBI | ✓ |
| 44 | `44-ley-31-1995-prevencion-riesgos-laborales.pdf` | Ley 31/1995 Prevención de Riesgos Laborales | BOE-A-1995-24292 | PRL | ✓ |
| 45 | `45-rd-2-2006.pdf` | RD 2/2006 (PRL policía) | BOE-A-2006-624 | PRLP | ✓ 2026-08-16 |
| 46 | `46-rd-67-2010.pdf` | RD 67/2010 (PRL en la AGE) | BOE-A-2010-2161 | PRLAGE | ✓ 2026-08-16 |
| 47 | `47-lo-3-2018-proteccion-datos.pdf` | LO 3/2018 Protección de Datos (LOPDGDD) | BOE-A-2018-16673 | LOPD | ✓ |
| 48 | `48-lo-7-2021-proteccion-datos-penal.pdf` | LO 7/2021 datos ámbito penal | BOE-A-2021-8806 | LOPD7 | ✓ |
| 49 | `49-reglamento-defensor-del-pueblo.pdf` | Reglamento Organización y Funcionamiento Defensor del Pueblo | BOE-A-1983-10613 | RDP | ✓ 2026-08-16 |
| 50 | `50-rd-137-1993-reglamento-armas.pdf` | RD 137/1993 (Reglamento de Armas) | BOE-A-1993-6202 | ARM | ✓ |
| 51 | `51-reglamento-general-vehiculos-parcial.pdf` | Reglamento General de Vehículos [parcial] | BOE-A-1999-1826 | RGV | ✓ 2026-08-16 |
| 52 | `52-rd-1428-2003-reglamento-general-circulacion.pdf` | RD 1428/2003 (Reglamento General de Circulación) | BOE-A-2003-23514 | TRAF | ✓ |
| 53 | `53-orden-int-2573-2015.pdf` | Orden INT/2573/2015 | BOE-A-2015-13138 | VCD | ✓ 2026-08-16 |

## Pendientes (⏳) — 0 normas por extraer

Ninguna: el corpus está completo.

## A revisar (⚠)

Ninguna. El §11 quedó resuelto el 16/08/2026: el PDF `11-estructura-organica-ministerio-interior.pdf` **es** el RD 207/2024 (BOE-A-2024-3793), que deroga el RD 734/2020 — la misma norma de la que ya está cargada la familia **MININT** (24 conceptos). Extraer el RD 734/2020 habría sido cargar normativa derogada. Cobertura enfocada: 24 conceptos de un RD de 33 páginas; suficiente para el Tema 7 y ampliable si se quiere más detalle del organigrama.
