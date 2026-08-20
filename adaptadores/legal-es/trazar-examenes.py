# -*- coding: utf-8 -*-
"""Traza cada pregunta de examen oficial al artículo de norma que la sostiene.

    python3 adaptadores/legal-es/trazar-examenes.py

Lee  datos/legal-es/pn-oficial-examenes-600.csv  (600 preguntas de seis exámenes
oficiales de Policía Nacional, Escala Básica, 37ª a 42ª promoción)
Escribe datos/legal-es/pn-examenes-600-trazado.csv  con la traza de cada una.

POR QUÉ EXISTE
--------------
El plan de contenido se venía dirigiendo con `docs/cobertura-epigrafes.md`, que cruza
el temario con el banco por léxico y se equivoca en los dos sentidos. Las preguntas
oficiales son mejor guía: cada una apunta a un apartado concreto que el tribunal SÍ
preguntó. Pero para usarlas hay que saber a qué artículo apunta cada una, y el campo
`fuente_normativa` del CSV solo trae un par norma+artículo extraíble en el 17 % de los
casos; el resto es una nota descriptiva.

CÓMO LO HACE, Y POR QUÉ NO INVENTA NADA
---------------------------------------
No deduce la norma: la LOCALIZA. Para cada pregunta busca, entre los 4.980 artículos
del corpus, aquel cuyo texto CONTIENE LITERALMENTE el fragmento más largo de la
pregunta (enunciado + opción correcta). Es la misma disciplina del cotejo del
generador, aplicada al revés, y deja como prueba el fragmento común para poder
auditarlo a mano.

Dos refinamientos que salieron de medir:

1. RESTRICCIÓN POR NORMA NOMBRADA. Muchas preguntas citan la norma en el propio
   enunciado («Según el art. 197.2 de la Ley Orgánica 10/1995…»). Cuando eso ocurre,
   la búsqueda se limita a esa norma. Sin esto el trazador se iba a normas con
   redacción paralela: la LO 4/2000 sobre infracciones acababa apuntando al RD
   203/1995, que dice casi lo mismo con otras palabras.

2. ETIQUETA DE CONFIANZA en vez de dar todas las trazas por buenas:
     ALTA      fragmento >= 120 car., o >= 60 con la norma nombrada por la pregunta
     MEDIA     fragmento >= 60 car.
     BAJA      fragmento 25-60 car.  — no fiarse: a esa longitud ya entra el relleno
                                       («podrán obtener una autorización de residencia»)
     SIN TRAZA fragmento < 25 car.

PRECISIÓN MEDIDA (20/08/2026)
-----------------------------
Contrastando contra las preguntas cuyo `fuente_normativa` SÍ traía una cita limpia:
concordancia del 89 % en las de confianza ALTA (n=18) y del 90 % en ALTA+MEDIA (n=21).
La muestra es corta y el intervalo ancho (±14 puntos). Los dos únicos fallos aciertan
la NORMA y fallan el artículo por uno (art. 12 en vez del 7; art. 52 en vez del 53),
que es el modo de fallo preferible: la traza deja al revisor en la página correcta.

EL MODO DE FALLO QUE SÍ DUELE, Y CÓMO SE AVISA
----------------------------------------------
Hay un fallo peor que equivocarse de artículo: acertar las palabras y errar el asunto.
Ocurre cuando la norma de la que sale la pregunta NO está en el corpus, pero su NOMBRE
sí aparece citado dentro de algún artículo. El trazador, que siempre devuelve su mejor
candidato, se engancha a esa cita. Medido: tres preguntas del T27 sobre el Protocolo
facultativo a la Convención contra la tortura acabaron en el art. 6 del RD 207/2024,
porque es el único sitio del corpus donde aparece «contra la tortura y otros tratos o
penas crueles, inhumanos o degradantes». 76 caracteres de coincidencia literal, norma
equivocada. Ni la frecuencia (el fragmento sale UNA vez en todo el corpus) ni la
longitud lo delatan.

Lo que sí lo delata es el ARTÍCULO IMÁN: un artículo que atrae preguntas de tres o más
temas distintos. Un artículo real sirve a uno o dos. Por eso la columna `aviso` marca
esos casos para revisión humana en vez de intentar arreglarlos a ciegas: en el único
grupo imán de esta tirada, 3 de 8 trazas eran falsas y 5 eran buenas, así que
descartarlo entero habría costado más de lo que salva.

LO QUE NO HACE
--------------
No dice si el banco cubre la pregunta —eso es `docs/cobertura-vs-examen-oficial.md`—
ni sustituye al criterio humano en las trazas BAJA o SIN TRAZA, que son el 67 %.
Muchas de esas no tienen artículo porque la pregunta no sale de una norma: pesa sobre
psicología, geografía, ortografía o estructura orgánica descrita en otra fuente.
"""
import json, glob, csv, re, unicodedata, collections, sys
from difflib import SequenceMatcher
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CORPUS = RAIZ / "datos/legal-es/boe-600-pn/corpus"
ENTRADA = RAIZ / "datos/legal-es/pn-oficial-examenes-600.csv"
SALIDA = RAIZ / "datos/legal-es/pn-examenes-600-trazado.csv"
NGRAMA = 5

# Normalización agresiva: aquí NO se cita al opositor, se busca. Se puede bajar a
# minúsculas y quitar tildes sin riesgo, porque la prueba se guarda aparte.
_SUST = (("«", '"'), ("»", '"'), ("“", '"'), ("”", '"'), ("‘", "'"), ("’", "'"),
         ("–", "-"), ("—", "-"), ("º", "o"), ("ª", "a"))

def norm(s):
    s = str(s or "")
    for a, b in _SUST:
        s = s.replace(a, b)
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", re.sub(r"\s+", " ", s.lower())).strip()

def lcs(a, b):
    """Fragmento literal más largo en común. difflib va en C; en JS esto sería lento."""
    m = SequenceMatcher(None, a, b, autojunk=False).find_longest_match(0, len(a), 0, len(b))
    return m.size, a[m.a:m.a + m.size]

def cargar_corpus():
    arts, titulos = [], {}
    for f in sorted(glob.glob(str(CORPUS / "seccion-*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        m = d["meta"]
        titulos[m["seccion"]] = m.get("titulo", "?")
        for a in d["articulos"]:
            arts.append({"sec": m["seccion"], "norma": m.get("titulo", "?"),
                         "boe": m.get("referencia_boe", ""), "ref": a.get("ref"),
                         "t": norm(a.get("texto", ""))})
    return arts, titulos

def main():
    arts, titulos = cargar_corpus()
    idx, por_sec = collections.defaultdict(set), collections.defaultdict(list)
    for i, a in enumerate(arts):
        por_sec[a["sec"]].append(i)
        w = a["t"].split()
        for j in range(len(w) - NGRAMA + 1):
            idx[" ".join(w[j:j + NGRAMA])].add(i)
    print(f"corpus: {len(arts)} artículos · {len(idx)} {NGRAMA}-gramas", file=sys.stderr)

    # Las normas se reconocen por su «número/año»; la CE, el CP y la LECrim, por nombre.
    num_a_sec = {}
    for s, t in titulos.items():
        k = re.search(r"\b(\d{1,4}/\d{4})\b", t)
        if k:
            num_a_sec[k.group(1)] = s
    POR_NOMBRE = [(r"constituci[oó]n espa", 3), (r"c[oó]digo penal", 35),
                  (r"enjuiciamiento criminal", 37)]

    filas = []
    for p in csv.DictReader(open(ENTRADA, encoding="utf-8")):
        corr = {"A": "opcion_a", "B": "opcion_b", "C": "opcion_c"}.get(p["respuesta_correcta"].strip())
        crudo = p["enunciado"] + " " + (p.get(corr) or "")
        q = norm(crudo)
        pista = (crudo + " " + (p["fuente_normativa"] or "")).lower()
        secs = {num_a_sec[n] for n in re.findall(r"\b(\d{1,4}/\d{4})\b", pista) if n in num_a_sec}
        secs |= {s for pat, s in POR_NOMBRE if re.search(pat, pista)}

        if secs:
            universo, modo = [i for s in secs for i in por_sec[s]], "norma nombrada"
        else:
            w = q.split()
            c = collections.Counter()
            for j in range(len(w) - NGRAMA + 1):
                for i in idx.get(" ".join(w[j:j + NGRAMA]), ()):
                    c[i] += 1
            universo, modo = [i for i, _ in c.most_common(10)], "búsqueda abierta"

        mejor = {"sec": "", "norma": "", "articulo": "", "boe": "", "ev_len": 0, "evidencia": ""}
        for i in universo:
            n, frag = lcs(q, arts[i]["t"])
            if n > mejor["ev_len"]:
                mejor = {"sec": arts[i]["sec"], "norma": arts[i]["norma"], "articulo": arts[i]["ref"],
                         "boe": arts[i]["boe"], "ev_len": n, "evidencia": frag.strip()}
        ev = mejor["ev_len"]
        conf = ("ALTA" if ev >= 120 or (ev >= 60 and modo == "norma nombrada")
                else "MEDIA" if ev >= 60 else "BAJA" if ev >= 25 else "SIN TRAZA")
        filas.append({"external_id": p["external_id"], "tema_numero": p["tema_numero"],
                      "confianza": conf, "modo": modo, "seccion_corpus": mejor["sec"],
                      "norma": mejor["norma"], "articulo": mejor["articulo"],
                      "referencia_boe": mejor["boe"], "evidencia_caracteres": ev,
                      "evidencia_literal": mejor["evidencia"][:300], "aviso": ""})

    # Artículos imán: uno que atrae preguntas de 3+ temas distintos no está sirviendo a
    # tres materias, está capturando por una cita compartida. Ver el docstring.
    temas_por_art = collections.defaultdict(set)
    for f in filas:
        if f["confianza"] in ("ALTA", "MEDIA"):
            temas_por_art[(f["referencia_boe"], f["articulo"])].add(f["tema_numero"])
    for f in filas:
        if len(temas_por_art.get((f["referencia_boe"], f["articulo"]), ())) >= 3:
            f["aviso"] = "imán: el artículo atrae preguntas de 3+ temas — revisar a mano"

    with open(SALIDA, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)

    c = collections.Counter(f["confianza"] for f in filas)
    for k in ("ALTA", "MEDIA", "BAJA", "SIN TRAZA"):
        print(f"  {k:<10} {c[k]:>3}  ({100*c[k]/len(filas):>2.0f} %)")
    print(f"→ {SALIDA}")

if __name__ == "__main__":
    main()
