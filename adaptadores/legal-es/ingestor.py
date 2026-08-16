#!/usr/bin/env python3
"""Acertium — adaptador legal-es / INGESTOR (primer carril del pipeline).

Convierte un PDF de una norma del Código 600 en un JSON de artículos con el
TEXTO LITERAL, para que el generador (y cualquier agente) lo lea sin tocar el PDF.

Uso:
    python3 ingestor.py <norma.pdf> [salida.json]

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
    if re.match(r'^§\s*\d+', st):          # cabecera de sección corrida
        return True
    if re.fullmatch(r'[–\-]\s*\d+\s*[–\-]', st):   # número de página
        return True
    return False

def ingerir(pdf_path):
    raw = subprocess.run(["pdftotext", "-raw", pdf_path, "-"],
                         capture_output=True, text=True).stdout
    pages = raw.split('\f')

    # metadatos de la cabecera (página 1): § N, título, «BOE», Última modificación, Referencia
    meta = {"seccion": None, "titulo": None, "referencia_boe": None,
            "publicacion": None, "ultima_modificacion": None}
    head = [l.strip() for l in pages[0].splitlines() if l.strip()]
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
    re_art = re.compile(
        r'^Artículo\s+([A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+(?:\s+y\s+[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+)?)'
        r'(?:\s+(' + SUFIJOS + r'))?\.')
    re_stop = re.compile(r'^(TÍTULO|CAPÍTULO|Sección|SECCIÓN|Disposición|PREÁMBULO|ANEXO)')
    arts, cur, cur_suf, buf = [], None, None, []

    def flush():
        if cur is not None:
            # `numero` se mantiene como entero (compatibilidad con los JSON ya
            # versionados y con quien indexe por número). `ref` es la cita
            # canónica del artículo, que es lo que debe usar el generador.
            art = {"numero": cur,
                   "ref": f"{cur} {cur_suf}" if cur_suf else str(cur),
                   "texto": re.sub(r'\s+', ' ', " ".join(buf)).strip()}
            if cur_suf:
                art["sufijo"] = cur_suf
            arts.append(art)

    for l in lines:
        s = l.strip()
        m = re_art.match(s)
        num = palabra_a_numero(m.group(1)) if m else None
        if num is not None:
            flush(); cur = num; cur_suf = (m.group(2) or "").lower() or None; buf = []
        elif re_stop.match(s):
            flush(); cur = None; cur_suf = None; buf = []
        elif cur is not None:
            buf.append(l)
    flush()

    return {"meta": meta, "articulos": arts}

def main():
    if len(sys.argv) < 2:
        print("uso: python3 ingestor.py <norma.pdf> [salida.json]"); sys.exit(1)
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
