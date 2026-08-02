import "server-only";
import { createCerebroClient } from "@/lib/supabase/cerebro";

// -----------------------------------------------------------------------------
// PROFESOR (recuperación, sin LLM todavía) — busca en los conceptos verificados
// del cerebro los más relevantes a la pregunta del alumno y devuelve su
// explicación pedagógica y su fuente oficial (artículo + enlace al BOE).
//
// Es RECUPERACIÓN pura, no generación: no inventa nada, solo localiza y muestra
// lo que ya está en el temario. Todo el acceso pasa por el cliente service-role
// del cerebro (nunca desde el navegador). Cuando llegue el LLM, esta función
// será la fase de "retrieval" que le da contexto.
// -----------------------------------------------------------------------------

export type RespuestaProfesor = {
  conceptoId: string;
  titulo: string;
  explicacion: string | null;
  articulo: string | null;
  boeUrl: string | null;
  tema: string | null;
};

// Enlace al texto consolidado del BOE, con ancla al artículo (#aN). Misma
// convención que el adaptador legal de lib/cerebro.ts (se replica aquí para no
// depender de un símbolo no exportado).
function boeUrl(
  referencia: string | null,
  articulo: string | null,
): string | null {
  if (!referencia) return null;
  const base = `https://www.boe.es/buscar/act.php?id=${referencia}`;
  const m = articulo?.match(/(\d+)/);
  return m ? `${base}#a${m[1]}` : base;
}

// Palabras vacías del español que no aportan señal de búsqueda. Se descartan
// junto con los términos de menos de 3 letras.
const VACIAS = new Set([
  "que", "cual", "cuales", "como", "por", "para", "los", "las", "una", "unos",
  "unas", "del", "con", "sin", "sobre", "entre", "hay", "son", "esta", "este",
  "estos", "estas", "mas", "menos", "muy", "pero", "porque", "cuando", "donde",
  "quien", "the", "and", "diferencia", "explica", "explicame", "dime", "que",
  "articulo", "articulos", "tema", "temas", "significa", "cuando",
]);

// Extrae las palabras clave de la pregunta: minúsculas, sin acentos ni signos,
// sin palabras vacías ni muy cortas. Duplicados eliminados.
function palabrasClave(pregunta: string): string[] {
  const normal = pregunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes/diacríticos
    .replace(/[^a-z0-9ñ\s]/g, " "); // deja solo letras/números/espacios
  const vistas = new Set<string>();
  for (const p of normal.split(/\s+/)) {
    if (p.length >= 3 && !VACIAS.has(p)) vistas.add(p);
  }
  return [...vistas];
}

// Cuenta cuántas palabras clave distintas aparecen en un texto (señal de
// relevancia sencilla, sin tf-idf). Compara sobre texto sin acentos.
function puntuar(texto: string | null, claves: string[]): number {
  if (!texto) return 0;
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  let n = 0;
  for (const c of claves) if (t.includes(c)) n += 1;
  return n;
}

export async function preguntarProfesor(
  pregunta: string,
): Promise<RespuestaProfesor[]> {
  const claves = palabrasClave(pregunta);
  if (claves.length === 0) return [];

  const db = createCerebroClient();

  // Filtro OR de PostgREST: cada palabra clave contra titulo/resumen/explicacion.
  // Las palabras clave ya están saneadas (solo [a-z0-9ñ]), así que no rompen la
  // sintaxis de coma del .or().
  const orFiltro = claves
    .flatMap((c) => [
      `titulo.ilike.%${c}%`,
      `resumen.ilike.%${c}%`,
      `explicacion.ilike.%${c}%`,
    ])
    .join(",");

  const { data: candidatos, error } = await db
    .from("concepto")
    .select("id, materia, titulo, resumen, explicacion")
    .or(orFiltro)
    .limit(30);
  if (error || !candidatos || candidatos.length === 0) return [];

  // Ranking en memoria: el título pesa más que resumen/explicación.
  const ordenados = candidatos
    .map((c) => {
      const score =
        puntuar(c.titulo as string, claves) * 3 +
        puntuar(c.resumen as string | null, claves) * 2 +
        puntuar(c.explicacion as string | null, claves);
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.c);

  if (ordenados.length === 0) return [];

  const ids = ordenados.map((c) => c.id as string);

  // Fuentes (artículo + referencia BOE) y temas del overlay, en lote (sin N+1).
  const [{ data: fuentes }, { data: overlay }] = await Promise.all([
    db
      .from("concepto_fuente")
      .select("concepto_id, articulo, referencia_boe")
      .in("concepto_id", ids),
    db
      .from("overlay_entrada")
      .select("concepto_id, tema")
      .in("concepto_id", ids),
  ]);

  const fuenteDe = new Map<string, { articulo: string | null; ref: string | null }>();
  for (const f of fuentes ?? []) {
    // Nos quedamos con la primera fuente de cada concepto (la principal).
    if (!fuenteDe.has(f.concepto_id as string)) {
      fuenteDe.set(f.concepto_id as string, {
        articulo: (f.articulo ?? null) as string | null,
        ref: (f.referencia_boe ?? null) as string | null,
      });
    }
  }
  const temaDe = new Map<string, string>();
  for (const o of overlay ?? []) {
    if (!temaDe.has(o.concepto_id as string)) {
      temaDe.set(o.concepto_id as string, o.tema as string);
    }
  }

  return ordenados.map((c) => {
    const id = c.id as string;
    const f = fuenteDe.get(id);
    return {
      conceptoId: id,
      titulo: c.titulo as string,
      explicacion: (c.explicacion ?? null) as string | null,
      articulo: f?.articulo ?? null,
      boeUrl: boeUrl(f?.ref ?? null, f?.articulo ?? null),
      tema: temaDe.get(id) ?? null,
    };
  });
}
