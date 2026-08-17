#!/usr/bin/env python3
"""Acertium — adaptador legal-es / INGESTOR (primer carril del pipeline).

Convierte un PDF de una norma del Código 600 en un JSON de artículos con el
TEXTO LITERAL, para que el generador (y cualquier agente) lo lea sin tocar el PDF.

Uso:
    # 1) Una norma por PDF (como se recorta en el PC)
    python3 ingestor.py <norma.pdf> [salida.json]

    # 2) El Código 600 en trozos de N páginas (cuando no se puede recortar por
    #    norma). Cada trozo trae VARIAS normas y puede partir una por la mitad,
    #    así que primero se acumula el texto crudo por sección y se parsea al
    #    final, cuando ya están todos los trozos:
    python3 ingestor.py --codigo <trozo.pdf> <dir_acumulado>     # por cada trozo
    python3 ingestor.py --consolidar <dir_acumulado> <dir_salida>  # una vez al final

Regla de oro (Doc 006): el generador consume ESTE JSON, nunca el PDF.
"""
import sys, re, json, subprocess, unicodedata, os

FOOT_MARK = "NORMATIVA PARA INGRESO EN LA POLICÍA NACIONAL"

def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')

# --- Numeración de artículos en palabra (leyes antiguas: "Artículo primero",
#     "Artículo treinta y uno") además de dígitos ("Artículo 5"). ---
_ORD = {"primero": 1, "segundo": 2, "tercero": 3, "cuarto": 4, "quinto": 5,
        "sexto": 6, "septimo": 7, "octavo": 8, "noveno": 9, "decimo": 10,
        "undecimo": 11, "duodecimo": 12}
_CARD = {"cero": 0, "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
         "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10, "once": 11,
         "doce": 12, "trece": 13, "catorce": 14, "quince": 15, "dieciseis": 16,
         "diecisiete": 17, "dieciocho": 18, "diecinueve": 19, "veinte": 20,
         "veintiuno": 21, "veintiun": 21, "veintidos": 22, "veintitres": 23,
         "veinticuatro": 24, "veinticinco": 25, "veintiseis": 26,
         "veintisiete": 27, "veintiocho": 28, "veintinueve": 29,
         "treinta": 30, "cuarenta": 40, "cincuenta": 50, "sesenta": 60,
         "setenta": 70, "ochenta": 80, "noventa": 90, "cien": 100, "ciento": 100}

def palabra_a_numero(tok):
    """'primero'→1, 'treinta y uno'→31, '5'→5. Devuelve None si no es número."""
    s = strip_accents(str(tok).lower().strip()).rstrip(".").strip()
    if s.isdigit():
        return int(s)
    if s in _ORD:
        return _ORD[s]
    if s in _CARD:
        return _CARD[s]
    if " y " in s:  # decenas + unidad: "treinta y uno"
        a, b = s.split(" y ", 1)
        if a.strip() in _CARD and b.strip() in _CARD:
            n = _CARD[a.strip()] + _CARD[b.strip()]
            if n <= 99:
                return n
    return None

def es_pie(linea):
    st = linea.strip()
    if not st:
        return False
    if FOOT_MARK in st:
        return True
    if st in ("EJECUTIVA", "ESCALAS BÁSICA Y EJECUTIVA"):
        return True
    # Pie del formato «Legislación Consolidada» del BOE (el de una norma suelta
    # descargada de boe.es, distinto del Código 600). Son tres líneas sueltas que
    # se repiten en cada página; sin descartarlas se cuelan DENTRO del texto del
    # artículo que atraviesa el salto de página y el cotejo literal deja de
    # coincidir. (17/08/2026: 665 líneas en la LECrim consolidada, que ensuciaban
    # 32 de los 121 artículos que el Código 600 ya traía.)
    if st in ("BOLETÍN OFICIAL DEL ESTADO", "LEGISLACIÓN CONSOLIDADA"):
        return True
    if re.fullmatch(r'Página\s+\d+', st):
        return True
    # Línea del ÍNDICE del PDF consolidado ("Artículo 1. Objeto de la Ley. . . . . . 5").
    # Casa con la regex de cabecera, así que sin descartarla cada artículo se abría
    # DOS veces: una con la rúbrica y los puntos suspensivos del índice y otra con el
    # texto real. (17/08/2026: 42 duplicados en el RD 39/1997 y 48 en la Ley 39/2006;
    # el CP y la LECrim no traen índice y por eso no estaban afectados.)
    # Se exigen SEIS puntos para no confundirlo con el marcador «[ . . . ]» que el
    # Código 600 usa para señalar lo que omite de una inclusión parcial.
    if re.search(r'(?:\.\s){5}\.', st):
        return True
    if re.match(r'^§\s*\d+', st):          # cabecera de sección corrida
        return True
    if re.fullmatch(r'[–\-]\s*\d+\s*[–\-]', st):   # número de página
        return True
    return False

def texto_pdf(pdf_path):
    return subprocess.run(["pdftotext", "-raw", pdf_path, "-"],
                          capture_output=True, text=True).stdout


# El inicio de una norma dentro del Código es una línea que contiene SOLO "§ N".
# El encabezado corrido de página es "§ 2 Código Civil [parcial]", con texto
# detrás — y las entradas del sumario son "§ 2. Real Decreto... 3". Solo la
# primera forma abre norma; por eso el patrón está anclado por los dos extremos.
RE_SECCION = re.compile(r'^§\s*(\d+)\s*$')


def trocear_codigo(raw):
    """Parte el texto de un trozo del Código en [(seccion|None, texto)].

    El primer tramo lleva `seccion=None` cuando el trozo empieza a mitad de una
    norma (viene del trozo anterior) o cuando es la portada + sumario del tomo.
    Se conservan los saltos de página: `parsear` los necesita para la cabecera.
    """
    tramos, seccion, buf = [], None, []
    for linea in raw.split('\n'):
        m = RE_SECCION.match(linea.strip())
        if m:
            tramos.append((seccion, '\n'.join(buf)))
            seccion, buf = int(m.group(1)), [linea]
        else:
            buf.append(linea)
    tramos.append((seccion, '\n'.join(buf)))
    return [(s, t) for s, t in tramos if t.strip()]


def parsear(raw):
    pages = raw.split('\f')

    # metadatos de la cabecera (página 1): § N, título, «BOE», Última modificación, Referencia
    meta = {"seccion": None, "titulo": None, "referencia_boe": None,
            "publicacion": None, "ultima_modificacion": None}
    # La cabecera se busca en la primera página CON contenido, no en pages[0]:
    # al trocear el Código, la sección arranca con un salto de página pegado a
    # la marca ("\f§ 2"), así que pages[0] queda vacía y el meta salía a null.
    portada = next((p for p in pages if p.strip()), "")
    head = [l.strip() for l in portada.splitlines() if l.strip()]
    for i, l in enumerate(head[:15]):
        m = re.match(r'^§\s*(\d+)\s*$', l)
        if m and meta["seccion"] is None:
            meta["seccion"] = int(m.group(1))
            # El título puede ocupar VARIAS líneas ("Real Decreto de 14 de
            # septiembre de 1882 por el que se aprueba la / Ley de Enjuiciamiento
            # Criminal. [Inclusión parcial]"). Se acumula hasta el primer dato de
            # cabecera (órgano emisor, boletín, fecha o referencia); quedarse con
            # la primera línea truncaba el título de las normas de nombre largo.
            titulo = []
            for t in head[i + 1:i + 6]:
                if (t.startswith("Ministerio") or t.startswith("«")
                        or t.startswith("Jefatura") or t.startswith("Cortes")
                        or t.startswith("Última modificación") or t.startswith("Referencia:")):
                    break
                titulo.append(t)
            meta["titulo"] = " ".join(titulo) or None
        # El boletín no siempre es el «BOE»: las normas antiguas salieron en la
        # «Gaceta de Madrid» (p. ej. la LECrim de 1882).
        if l.startswith("«") and not meta["publicacion"]:
            meta["publicacion"] = l
        if l.startswith("Última modificación") and not meta["ultima_modificacion"]:
            meta["ultima_modificacion"] = l.split(":", 1)[-1].strip()
        if l.startswith("Referencia:"):
            meta["referencia_boe"] = l.split(":", 1)[-1].strip()

    # limpiar pies/cabeceras corridos y cortar hasta 'Referencia: ...'
    lines = []
    for p in pages:
        for l in p.splitlines():
            if not es_pie(l):
                lines.append(l.rstrip())
    for i, l in enumerate(lines):
        if l.strip().startswith("Referencia:"):
            lines = lines[i + 1:]
            break

    # Captura el "número" tras "Artículo": dígitos, ordinal en palabra
    # ("primero") o decena+unidad ("treinta y uno"). Se valida convirtiéndolo.
    # El número va SEGUIDO DE PUNTO en una cabecera real ("Artículo 5." /
    # "Artículo treinta y uno."); una referencia cruzada ("Artículo 126 de la
    # Constitución") no lleva punto tras el número, así que no matchea.
    # Un artículo puede llevar SUFIJO ORDINAL latino ("Artículo 31 bis.",
    # "Artículo 156 quinquies."). Sin capturarlo, su cabecera no matcheaba, no se
    # cerraba el artículo en curso y su texto se acumulaba en el ANTERIOR: el
    # art. 557 acababa conteniendo el 557 bis y el 557 ter, y el 31 se comía del
    # 31 bis al 31 quinquies. Es contaminación de la fuente literal, no una
    # omisión: rompe el grounding de cualquier cotejo que salga de ahí.
    # (Detectado el 16/08/2026: 28 artículos afectados en el CP, 12 en la LECrim.)
    # OJO: sin IGNORECASE. La cabecera real siempre es "Artículo" con mayúscula;
    # activarlo hacía que una línea que empieza por "artículo 149." en mitad de
    # una frase se tomara por cabecera (la Ley 31/1995 arrancaba en el art. 149).
    SUFIJOS = "bis|ter|quater|quáter|quinquies|sexies|septies|octies|nonies|decies"
    # La LETRA final ("Artículo 588 bis a.", "Artículo 588 ter m.") es la forma
    # que usa la LECrim para los capítulos añadidos en bloque: un mismo número
    # con sufijo se subdivide de la a) a la m). Sin capturarla, la cabecera no
    # casaba, el artículo no hacía flush y su texto se acumulaba dentro del
    # ANTERIOR — la misma contaminación silenciosa que los bis/ter de agosto.
    # (17/08/2026: 43 artículos afectados en la LECrim consolidada, entre ellos
    # TODO el bloque 588 bis a – 588 octies, que es la prueba digital del T20.)
    # Solo se admite la letra DETRÁS de un sufijo, que es como aparece siempre;
    # admitirla suelta abriría la puerta a falsos positivos.
    re_art = re.compile(
        r'^Artículo\s+([A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+(?:\s+y\s+[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+)?)'
        r'(?:\s+(' + SUFIJOS + r')(?:\s+([a-z]))?)?\.')
    re_stop = re.compile(r'^(TÍTULO|CAPÍTULO|Sección|SECCIÓN|Disposición|PREÁMBULO|ANEXO)')
    # "Artículo único." es cabecera real, pero "único" no es un número, así que
    # `palabra_a_numero` lo rechazaba y su texto se acumulaba en el artículo
    # ANTERIOR — la misma contaminación que causaban los bis/ter. Aparece 9 veces
    # en el Código, siempre en la norma que aprueba un reglamento ("Artículo
    # único. Se aprueba el Reglamento de…"). No se le asigna número: comparte
    # documento con los artículos 1, 2, 3… del reglamento aprobado y numerarlo
    # como 1 chocaría con el suyo. Se identifica por `ref`.
    re_unico = re.compile(r'^Artículo\s+único\.', re.IGNORECASE)
    arts, cur, cur_suf, cur_let, cur_rub, buf = [], None, None, None, None, []

    def flush():
        if cur is not None:
            # `numero` se mantiene como entero (compatibilidad con los JSON ya
            # versionados y con quien indexe por número). `ref` es la cita
            # canónica del artículo, que es lo que debe usar el generador.
            unico = cur == "único"
            ref = "único" if unico else str(cur)
            if not unico and cur_suf:
                ref += f" {cur_suf}" + (f" {cur_let}" if cur_let else "")
            art = {"numero": None if unico else cur,
                   "ref": ref,
                   "texto": re.sub(r'\s+', ' ', " ".join(buf)).strip()}
            if cur_suf:
                art["sufijo"] = cur_suf
            if cur_let:
                art["letra"] = cur_let
            if cur_rub:
                art["rubrica"] = cur_rub
            arts.append(art)

    for l in lines:
        s = l.strip()
        mu = re_unico.match(s)
        m = None if mu else re_art.match(s)
        num = "único" if mu else (palabra_a_numero(m.group(1)) if m else None)
        if num is not None:
            flush()
            cur = num
            cur_suf = None if mu else ((m.group(2) or "").lower() or None)
            cur_let = None if mu else ((m.group(3) or "").lower() or None)
            # La RÚBRICA (el título del artículo) va en la MISMA línea que la
            # cabecera: "Artículo 53. Requisitos para la obtención...". Antes se
            # descartaba con el resto de la línea, así que el corpus no la tenía
            # y cualquier lote que la citara parecía estar inventándosela.
            # (16/08/2026: en el §23 la llevan las 250 cabeceras.) Se guarda
            # aparte Y se abre el texto con ella, para que el artículo quede
            # completo tal como está impreso.
            cur_rub = s[(mu or m).end():].strip() or None
            buf = [cur_rub] if cur_rub else []
        elif re_stop.match(s):
            flush(); cur = None; cur_suf = None; cur_let = None; cur_rub = None; buf = []
        elif cur is not None:
            buf.append(l)
    flush()

    # DEDUPLICACIÓN por `ref`. Dentro de una norma un artículo aparece UNA vez; si
    # sale dos, la de más es ruido del índice del PDF consolidado, cuyas entradas
    # ("Artículo 1. Objeto de la Ley. . . . . 5") casan con la regex de cabecera.
    # `es_pie` descarta las que llevan los puntos en la propia línea, pero cuando la
    # rúbrica es larga y envuelve, los puntos caen en la línea siguiente y la entrada
    # sobrevive. Nos quedamos con la ocurrencia de TEXTO MÁS LARGO, que es el artículo
    # de verdad: una entrada de índice solo tiene la rúbrica.
    # No altera las normas sin índice —el CP y la LECrim salen byte a byte iguales—
    # porque ahí no hay ningún `ref` repetido.
    por_ref = {}
    for a in arts:
        prev = por_ref.get(a["ref"])
        if prev is None or len(a["texto"]) > len(prev["texto"]):
            por_ref[a["ref"]] = a
    descartados = len(arts) - len(por_ref)
    arts = [a for a in arts if a is por_ref[a["ref"]]]
    if descartados:
        print(f"  · {descartados} entradas duplicadas descartadas (índice del PDF)", file=sys.stderr)

    return {"meta": meta, "articulos": arts}


def ingerir(pdf_path):
    return parsear(texto_pdf(pdf_path))


def acumular(pdf, dir_acum):
    """Vuelca un trozo del Código en `dir_acum`, un fichero de texto por sección.

    Acumula en vez de parsear porque un trozo corta por número de página, no por
    norma: la última sección de un trozo casi siempre continúa en el siguiente.
    El texto que aparece ANTES de la primera marca de sección pertenece a la
    última norma del trozo anterior, que se recuerda en `_estado.json`.
    """
    os.makedirs(dir_acum, exist_ok=True)
    est_path = os.path.join(dir_acum, "_estado.json")
    estado = json.load(open(est_path, encoding="utf-8")) if os.path.exists(est_path) else {}
    ultima = estado.get("ultima_seccion")

    nuevas, continuadas = [], []
    for seccion, texto in trocear_codigo(texto_pdf(pdf)):
        if seccion is None:
            # Sin norma previa esto es la portada + sumario del tomo: se tira.
            if ultima is None:
                continue
            seccion, cont = ultima, True
        else:
            cont = False
        destino = os.path.join(dir_acum, f"seccion-{seccion:03d}.txt")
        existe = os.path.exists(destino)
        with open(destino, "a", encoding="utf-8") as fh:
            if existe:
                fh.write("\n")
            fh.write(texto)
        (continuadas if cont else nuevas).append(seccion)
        ultima = seccion

    estado["ultima_seccion"] = ultima
    json.dump(estado, open(est_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{os.path.basename(pdf)}")
    print(f"  secciones nuevas    : {', '.join('§' + str(s) for s in nuevas) or '—'}")
    print(f"  continúa de antes   : {', '.join('§' + str(s) for s in continuadas) or '—'}")
    print(f"  última (puede seguir en el trozo siguiente): §{ultima}")


def consolidar(dir_acum, dir_salida):
    """Parsea a JSON cada sección acumulada. Ejecutar cuando estén TODOS los trozos."""
    os.makedirs(dir_salida, exist_ok=True)
    fich = sorted(f for f in os.listdir(dir_acum) if f.startswith("seccion-"))
    if not fich:
        print(f"no hay secciones acumuladas en {dir_acum}"); sys.exit(1)
    # La última sección acumulada es la que estaba abierta cuando se acabó el
    # último trozo: mientras queden trozos por pasar, su texto está cortado. Se
    # marca para que nadie la versione como si fuera la norma entera.
    est_path = os.path.join(dir_acum, "_estado.json")
    abierta = (json.load(open(est_path, encoding="utf-8")).get("ultima_seccion")
               if os.path.exists(est_path) else None)
    for f in fich:
        raw = open(os.path.join(dir_acum, f), encoding="utf-8").read()
        data = parsear(raw)
        sec = data["meta"]["seccion"] or f
        if sec == abierta:
            data["meta"]["posiblemente_incompleta"] = True
        out = os.path.join(dir_salida, f"seccion-{sec:03d}-articulos.json"
                           if isinstance(sec, int) else f.replace(".txt", ".json"))
        json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        n = len(data["articulos"])
        suf = sum(1 for a in data["articulos"] if a.get("sufijo"))
        marca = "  ⚠ CORTADA (faltan trozos)" if data["meta"].get("posiblemente_incompleta") else ""
        print(f"  §{str(sec).ljust(3)} {n:4d} art ({suf} con sufijo) · {data['meta']['referencia_boe'] or 'SIN REFERENCIA'}"
              f" · {(data['meta']['titulo'] or '')[:55]}{marca}")


def indexar(dir_corpus):
    """(Re)genera `indice.json` a partir de los JSON presentes en el corpus.

    Es el mapa que consulta cualquier agente para saber qué normas hay, con qué
    referencia BOE y cuántos artículos, sin abrir un solo PDF.
    """
    entradas = []
    for f in sorted(os.listdir(dir_corpus)):
        if not f.startswith("seccion-") or not f.endswith(".json"):
            continue
        d = json.load(open(os.path.join(dir_corpus, f), encoding="utf-8"))
        m = d["meta"]
        entradas.append({
            "seccion": m.get("seccion"),
            "titulo": m.get("titulo"),
            "referencia_boe": m.get("referencia_boe"),
            "ultima_modificacion": m.get("ultima_modificacion"),
            "articulos": len(d.get("articulos", [])),
            "fichero": f,
        })
    salida = os.path.join(dir_corpus, "indice.json")
    json.dump({"normas": entradas}, open(salida, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"{salida}: {len(entradas)} normas · "
          f"{sum(e['articulos'] for e in entradas)} artículos")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--indice":
        if len(sys.argv) < 3:
            print("uso: python3 ingestor.py --indice <dir_corpus>"); sys.exit(1)
        indexar(sys.argv[2]); return
    if len(sys.argv) > 1 and sys.argv[1] == "--codigo":
        if len(sys.argv) < 4:
            print("uso: python3 ingestor.py --codigo <trozo.pdf> <dir_acumulado>"); sys.exit(1)
        acumular(sys.argv[2], sys.argv[3]); return
    if len(sys.argv) > 1 and sys.argv[1] == "--consolidar":
        if len(sys.argv) < 4:
            print("uso: python3 ingestor.py --consolidar <dir_acumulado> <dir_salida>"); sys.exit(1)
        consolidar(sys.argv[2], sys.argv[3]); return
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    pdf = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else \
        os.path.splitext(pdf)[0] + "-articulos.json"
    data = ingerir(pdf)
    json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    n = len(data["articulos"])
    rng = f"{data['articulos'][0]['ref']}-{data['articulos'][-1]['ref']}" if n else "—"
    con_sufijo = sum(1 for a in data["articulos"] if a.get("sufijo"))
    if con_sufijo:
        rng += f", {con_sufijo} con sufijo (bis/ter/…)"
    print(f"§{data['meta']['seccion']} {data['meta']['titulo']}")
    print(f"  {n} artículos ({rng}) · ref {data['meta']['referencia_boe']} · {out}")

if __name__ == "__main__":
    main()
