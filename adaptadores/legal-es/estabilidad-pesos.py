#!/usr/bin/env python3
"""Cuánta confianza merece cada peso, con las promociones que hay y no más.

CONTEXTO. Los pesos de `pesos-temas.json` salen de contar cuántas preguntas
dedica cada tema en las 600 preguntas oficiales trazadas, y de meter ese conteo
en cuatro tramos respecto a la media. La nota que quedó abierta era «re-medir
cuando haya más exámenes». No los hay: seis promociones (37-42) es todo lo que se
ha podido conseguir, así que «re-medir más adelante» no es un plan.

Lo que SÍ se puede hacer con seis: preguntarle a los datos cuánto se sostiene
cada peso. Dos pruebas, ambas sobre la unidad correcta —la PROMOCIÓN, no la
pregunta—, porque las 100 preguntas de un mismo examen no son observaciones
independientes: las escribió el mismo tribunal el mismo día.

  1. LEAVE-ONE-OUT. Se recalculan los tramos seis veces, quitando cada vez una
     promoción. Un peso que sale igual las seis veces está sostenido. Uno que
     cambia según qué examen quites es una moneda al aire disfrazada de dato.

  2. BOOTSTRAP sobre promociones. Se remuestrean las seis con reemplazo muchas
     veces y se mira con qué frecuencia sale cada tramo. Da la probabilidad
     aproximada de que el tramo asignado sea el correcto.

    python3 adaptadores/legal-es/estabilidad-pesos.py
"""

import collections
import csv
import json
import os
import random
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRAZADO = os.path.join(RAIZ, "datos/legal-es/pn-examenes-600-trazado.csv")
PESOS = os.path.join(RAIZ, "adaptadores/legal-es/generador/pesos-temas.json")

# Los mismos cortes que produjeron la tabla vigente (docs/anchura-y-profundidad.md).
CORTES = [(2.5, 4), (1.5, 3), (0.75, 2)]
TEMAS = 45


def tramo(conteo, media):
    """Peso de un tema según su conteo respecto a la media."""
    if media <= 0:
        return 2
    r = conteo / media
    for umbral, peso in CORTES:
        if r >= umbral:
            return peso
    return 1


def pesos_de(filas):
    """Tabla de pesos {tema: peso} calculada sobre un conjunto de preguntas."""
    conteo = collections.Counter(f["tema"] for f in filas)
    # La media se reparte entre los 45 temas del anexo I, incluidos los que no
    # sacaron ninguna pregunta: si solo se promediaran los temas presentes, un
    # tema ausente subiría la media de los demás y falsearía los tramos.
    media = sum(conteo.values()) / TEMAS
    return {t: tramo(conteo.get(t, 0), media) for t in range(1, TEMAS + 1)}, conteo, media


def cargar():
    filas = []
    for r in csv.DictReader(open(TRAZADO, encoding="utf-8")):
        m = re.match(r"pn-of(\w+?)-p", r["external_id"])
        try:
            tema = int(r["tema_numero"])
        except (ValueError, TypeError):
            continue
        if not m or not (1 <= tema <= TEMAS):
            continue
        filas.append({"promo": m.group(1), "tema": tema})
    return filas


def main():
    filas = cargar()
    promos = sorted({f["promo"] for f in filas})
    print(f"{len(filas)} preguntas con tema válido · {len(promos)} promociones: "
          f"{', '.join(promos)}\n")

    base, conteo, media = pesos_de(filas)
    print(f"Media de preguntas por tema: {media:.1f}\n")

    # --- ¿coincide la tabla en producción con la que sale de los datos? ------
    # La comparación es contra la tabla ENCOGIDA, no contra el conteo bruto: la
    # tabla vigente es la corregida, así que comparar con la bruta daría un aviso
    # permanente por un desvío que es deliberado.
    guardado = json.load(open(PESOS, encoding="utf-8"))
    enProduccion = {t: guardado["meta"]["por_defecto"] for t in range(1, TEMAS + 1)}
    for tr in guardado["tramos"]:
        for t in tr["temas"]:
            enProduccion[t] = tr["peso"]

    enc, mediaEnc = encoger(conteo, len(promos))
    encogida = {t: tramo(enc[t][0], mediaEnc) for t in range(1, TEMAS + 1)}

    difs = sorted(t for t in enProduccion if enProduccion[t] != encogida[t])
    if difs:
        print("⚠ pesos-temas.json NO coincide con lo que sale de los datos:")
        for t in difs:
            print(f"   T{t}: en producción {enProduccion[t]}, según los datos {encogida[t]}")
        print()
    else:
        print("✓ pesos-temas.json coincide con la tabla encogida\n")

    brutoVsEncogido = sorted(t for t in base if base[t] != encogida[t])
    if brutoVsEncogido:
        print("   (el conteo bruto daría otra cosa en "
              + ", ".join(f"T{t}: {base[t]}→{encogida[t]}" for t in brutoVsEncogido)
              + " — ese es el efecto del encogimiento)\n")

    # --- 1. Leave-one-out ----------------------------------------------------
    loo = {t: set() for t in base}
    for fuera in promos:
        sub = [f for f in filas if f["promo"] != fuera]
        p, _, _ = pesos_de(sub)
        for t in p:
            loo[t].add(p[t])

    estables = [t for t in base if len(loo[t]) == 1]
    inestables = sorted(t for t in base if len(loo[t]) > 1)

    print("1) LEAVE-ONE-OUT — quitar una promoción y recalcular")
    print(f"   {len(estables)}/{TEMAS} temas mantienen su peso quitando "
          f"cualquiera de las {len(promos)} promociones.")
    if inestables:
        print(f"   {len(inestables)} cambian:")
        for t in inestables:
            print(f"     T{t:<2} peso {base[t]} · con 5 promociones puede ser "
                  f"{sorted(loo[t])}  (preguntas: {conteo.get(t, 0)} en 600)")
    print()

    # --- 2. Bootstrap sobre promociones -------------------------------------
    random.seed(42)  # reproducible: el mismo dato tiene que dar el mismo informe
    N = 5000
    porPromo = collections.defaultdict(list)
    for f in filas:
        porPromo[f["promo"]].append(f)

    votos = {t: collections.Counter() for t in base}
    for _ in range(N):
        muestra = []
        for _ in range(len(promos)):
            muestra.extend(porPromo[random.choice(promos)])
        p, _, _ = pesos_de(muestra)
        for t in p:
            votos[t][p[t]] += 1

    print(f"2) BOOTSTRAP — {N} remuestreos de las {len(promos)} promociones")
    print("   Probabilidad de que el peso asignado sea el que sale:\n")
    print("   Tema  Preg.  Peso  Confianza  Alternativas")
    filas_out = []
    for t in sorted(base):
        conf = votos[t][base[t]] / N
        alt = ", ".join(
            f"{p}:{c/N:.0%}" for p, c in votos[t].most_common() if p != base[t] and c / N >= 0.05
        )
        filas_out.append((t, conteo.get(t, 0), base[t], conf, alt))
    # Los menos fiables primero: es lo que hay que mirar.
    for t, n, w, conf, alt in sorted(filas_out, key=lambda x: x[3]):
        marca = "  ← flojo" if conf < 0.80 else ""
        print(f"   T{t:<4} {n:<6} {w:<5} {conf:>6.0%}    {alt or '—'}{marca}")

    flojos = [x for x in filas_out if x[3] < 0.80]
    print(f"\n   {len(filas_out) - len(flojos)}/{TEMAS} pesos con confianza ≥ 80 %.")
    if flojos:
        print(f"   {len(flojos)} por debajo: "
              f"{', '.join('T%d' % x[0] for x in sorted(flojos, key=lambda y: y[0]))}")
    return 0


# ---------------------------------------------------------------------------
# ENCOGIMIENTO (Gamma-Poisson) — la alternativa a poner una etiqueta de aviso.
#
# El problema de fondo no es que los pesos estén mal: es que salen de un conteo
# bruto tratado como si midiera la verdad. Con seis exámenes, un tema que sacó 20
# preguntas puede ser un tema de 20 o uno de 14 que tuvo un buen año.
#
# La corrección es encoger cada estimación hacia la media general en proporción a
# su propio ruido. PERO EL MODELO IMPORTA, y aquí me equivoqué a la primera: con
# un modelo normal de varianza común, T8 salía como el tema MENOS fiable (B=0,48)
# justo cuando el bootstrap le da un 99 %. La contradicción era el aviso de que el
# modelo estaba mal especificado: en conteos, el ruido CRECE con el tamaño —un
# tema de 9 preguntas por examen varía naturalmente ±3, uno de 1 varía ±1—, así
# que penalizar la varianza bruta castiga a los temas grandes por ser grandes.
#
# El modelo correcto para conteos es Gamma-Poisson (binomial negativa):
#
#   nᵢ | λᵢ ~ Poisson(k·λᵢ)        k = nº de promociones
#   λᵢ      ~ Gamma(a, s)          la dispersión REAL entre temas
#   E[λᵢ | nᵢ] = (a + nᵢ) · s/(1 + k·s)
#
# a y s se estiman por momentos sobre los conteos: la parte de la varianza que
# supera a la media es la dispersión verdadera; el resto es ruido de muestreo.
# Encoge mucho los conteos pequeños (T24, con 1 pregunta) y poco los grandes y
# consistentes (T8), que es justo lo que debe hacer.
# ---------------------------------------------------------------------------


def encoger(conteo, k):
    n = [conteo.get(t, 0) for t in range(1, TEMAS + 1)]
    m = sum(n) / TEMAS
    v = sum((x - m) ** 2 for x in n) / (TEMAS - 1)

    # Si la varianza no supera a la media no hay dispersión real que separar:
    # todo es ruido de muestreo y la mejor estimación de cada tema es la media.
    if v <= m:
        return {t: (m, 0.0) for t in range(1, TEMAS + 1)}, m

    s = (v - m) / (k * m)          # escala de la Gamma
    a = m / (k * s)                # forma de la Gamma
    factor = s / (1 + k * s)
    out = {}
    for t in range(1, TEMAS + 1):
        est = k * (a + conteo.get(t, 0)) * factor
        # Cuánto se le cree al dato del propio tema frente a la media general.
        peso_dato = conteo.get(t, 0) / (conteo.get(t, 0) + a) if (conteo.get(t, 0) + a) else 0
        out[t] = (est, peso_dato)
    return out, m


def informe_encogido():
    filas = cargar()
    promos = sorted({f["promo"] for f in filas})
    base, conteo, media = pesos_de(filas)
    enc, mediaEnc = encoger(conteo, len(promos))

    print("\n3) ENCOGIMIENTO Gamma-Poisson — conteo corregido por el ruido\n")
    print("   Tema  Bruto  Encogido  Se cree al dato  Peso")
    nuevo, cambios = {}, []
    for t in range(1, TEMAS + 1):
        val, cred = enc[t]
        nuevo[t] = tramo(val, mediaEnc)
        if nuevo[t] != base[t]:
            cambios.append((t, conteo.get(t, 0), base[t], nuevo[t]))
    for t in sorted(range(1, TEMAS + 1), key=lambda x: -enc[x][0]):
        val, cred = enc[t]
        flecha = f"{base[t]} → {nuevo[t]}" if nuevo[t] != base[t] else str(base[t])
        print(f"   T{t:<4} {conteo.get(t,0):<6} {val:>7.1f}   {cred:>13.0%}    {flecha}")

    print(f"\n   Media: {mediaEnc:.1f}")
    if cambios:
        print(f"   {len(cambios)} temas cambiarían de peso:")
        for t, n, a, b in cambios:
            print(f"     T{t:<3} ({n} preguntas)  {a} → {b}")
    else:
        print("   Ningún tema cambia de peso: la tabla vigente aguanta el encogimiento.")
    rep = collections.Counter(nuevo.values())
    print("   Reparto: " + " · ".join(f"peso {p}: {rep[p]} temas" for p in sorted(rep, reverse=True)))


if __name__ == "__main__":
    main()
    informe_encogido()
