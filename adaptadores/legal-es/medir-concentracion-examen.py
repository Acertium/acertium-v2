# -*- coding: utf-8 -*-
"""¿Se concentra el examen oficial en unos pocos temas y artículos, o es plano?

    python3 adaptadores/legal-es/medir-concentracion-examen.py

Lee  datos/legal-es/pn-oficial-examenes-600.csv   (600 preguntas, 6 exámenes)
     datos/legal-es/pn-examenes-600-trazado.csv   (la traza a norma+artículo)
No escribe nada: imprime las mediciones que sostienen `docs/anchura-y-profundidad.md`.

POR QUÉ EXISTE
--------------
La regla 6 del proyecto —cubrir todo el temario sin saltar por frecuencia de examen—
se puso para que a ningún opositor le salga algo que no estuviera en Acertium. La duda
razonable es si eso sobredimensiona el cerebro: si el tribunal, como cualquier
examinador, se concentrara en un núcleo pequeño (el famoso 80/20), cubrir la cola
larga sería trabajo tirado.

Esto lo mide en vez de opinarlo, por tres vías independientes:

1. CONCENTRACIÓN POR TEMA. ¿En cuántos temas cae el 80 % de las preguntas?
2. REPETICIÓN POR ARTÍCULO. De los artículos preguntados, ¿cuántos repiten entre
   convocatorias? Un núcleo estable se delata repitiendo.
3. CURVA DE DESCUBRIMIENTO. Cuántos artículos NUEVOS aporta cada examen que añades,
   promediado sobre los 6! órdenes posibles para que no dependa de cuál mires primero.
   Si hubiera núcleo, la curva satura. Si es una recta, se está muestreando de una
   bolsa mucho mayor que lo visto.

Y sobre (3) se calcula CHAO2, el estimador de riqueza por incidencia que se usa en
ecología para preguntar «cuántas especies hay en el bosque» partiendo de cuántas se
vieron una sola vez. Aquí: cuántos artículos preguntables existen, vistos seis exámenes.

    Chao2 = S + ((m-1)/m) · Q1² / (2·Q2)

con S artículos observados, Q1 los que salen en un solo examen, Q2 en dos, m exámenes.
Supone que el tribunal muestrea de forma parecida cada año y que la bolsa es estable;
ninguna de las dos se puede comprobar, así que la cifra es un orden de magnitud. Lo que
NO depende del estimador —y es lo que de verdad decide— es el reparto crudo de Q1/Q2.

LÍMITES
-------
Seis convocatorias, 593 preguntas clasificadas por tema (7 sin clasificar). El análisis
por artículo solo alcanza a las trazas fiables del trazador (ALTA+MEDIA), que son un
tercio de las preguntas; el resto no sale de normas o no se pudo localizar. Y
`tema_numero` lo etiquetamos nosotros, no viene del BOE.
"""
import csv, collections, itertools, statistics
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
EXAMENES = RAIZ / "datos/legal-es/pn-oficial-examenes-600.csv"
TRAZADO = RAIZ / "datos/legal-es/pn-examenes-600-trazado.csv"

# Tres trazas del T27 (Protocolo contra la tortura) que el trazador manda al art. 6 del
# RD 207/2024 por engancharse al nombre del instrumento citado dentro. Verificadas a mano
# como falsas; ver el docstring de trazar-examenes.py.
FALSAS = {"pn-of41-p57", "pn-of41-p77", "pn-of42-p56"}

TOTAL_TEMAS = 45


def main():
    ent = list(csv.DictReader(open(EXAMENES, encoding="utf-8")))
    tra = {r["external_id"]: r for r in csv.DictReader(open(TRAZADO, encoding="utf-8"))}

    # ---- 1. Concentración por tema -------------------------------------------------
    c = collections.Counter(int(e["tema_numero"] or 0) for e in ent)
    sin_clasificar, tot = c.pop(0, 0), 0
    tot = sum(c.values())
    print(f"=== 1. CONCENTRACIÓN POR TEMA ({tot} preguntas clasificadas, "
          f"{sin_clasificar} sin tema, {TOTAL_TEMAS} temas) ===")
    acum = 0
    for i, (_, n) in enumerate(c.most_common(), 1):
        acum += n
        if acum >= 0.8 * tot:
            print(f"  el 80 % del examen cae en {i} temas = el "
                  f"{100*i/TOTAL_TEMAS:.0f} % del temario")
            break
    top5 = c.most_common(5)
    print("  top 5: " + ", ".join(f"T{t}={n}" for t, n in top5)
          + f"  = {100*sum(n for _, n in top5)/tot:.0f} % del examen")
    print(f"  temas sin ninguna pregunta en 6 exámenes: "
          f"{sorted(set(range(1, TOTAL_TEMAS+1)) - set(c)) or 'ninguno'}")
    print(f"  temas con 3 preguntas o menos: {sorted(t for t, n in c.items() if n <= 3)}")

    # ---- 2 y 3. Artículos ----------------------------------------------------------
    por_ex = collections.defaultdict(set)
    for e in ent:
        r = tra[e["external_id"]]
        if r["confianza"] in ("ALTA", "MEDIA") and e["external_id"] not in FALSAS:
            por_ex[e["external_id"].split("-p")[0]].add((r["referencia_boe"], r["articulo"]))
    exs = sorted(por_ex)

    inc = collections.Counter()
    for e in exs:
        for a in por_ex[e]:
            inc[a] += 1
    Q = collections.Counter(inc.values())
    S, m = len(inc), len(exs)

    print(f"\n=== 2. REPETICIÓN POR ARTÍCULO ({S} artículos distintos, {m} exámenes) ===")
    for k in sorted(Q):
        print(f"  sale en {k} examen(es): {Q[k]:>3}  ({100*Q[k]/S:>2.0f} %)")
    print(f"  → repiten en 2 o más convocatorias: {S-Q[1]} de {S} ({100*(S-Q[1])/S:.0f} %)")

    print(f"\n=== 3. CURVA DE DESCUBRIMIENTO (media de los {m}! órdenes) ===")
    prev = 0
    for k in range(1, m + 1):
        med = statistics.mean(len(set().union(*[por_ex[e] for e in combo]))
                              for combo in itertools.combinations(exs, k))
        print(f"  {k} examen(es): {med:>5.0f} artículos acumulados"
              + (f"   (+{med-prev:.0f} nuevos)" if k > 1 else ""))
        prev = med

    if Q[2]:
        chao2 = S + ((m - 1) / m) * (Q[1] ** 2) / (2 * Q[2])
        print(f"\n=== 4. CHAO2 ===")
        print(f"  S={S} · Q1={Q[1]} · Q2={Q[2]} · m={m}")
        print(f"  universo estimado de artículos preguntables: {chao2:.0f}")
        print(f"  visto en 6 convocatorias: {100*S/chao2:.0f} %")
        print("  (orden de magnitud, no cifra fina: supone muestreo homogéneo y bolsa estable)")


if __name__ == "__main__":
    main()
