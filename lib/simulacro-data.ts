import "server-only";
import { createCerebroClient } from "@/lib/supabase/cerebro";
import { DEMO_USUARIO_ID, CONVOCATORIA_PN } from "@/lib/cerebro";
import {
  ALTERNATIVAS,
  PREGUNTAS_SIMULACRO,
  type PreguntaSimulacro,
  type RespuestaUsuario,
  type DetallePregunta,
  type ResumenSimulacro,
} from "@/lib/simulacro-formato";

// ---------------------------------------------------------------------------
// MODO SIMULACRO — acceso a datos (SOLO servidor). El formato del examen
// (nº de preguntas, tiempo, alternativas, tipos) vive en `simulacro-formato.ts`
// porque el runner cliente también lo necesita; aquí queda todo lo que toca la
// base de datos con el cliente service-role del cerebro.
//
// El banco (tabla `actividad`) guarda 4 opciones; el examen usa 3. Por cada
// pregunta se construyen 3 alternativas = la correcta + 2 distractores al azar,
// barajadas. NUNCA se revela cuál es la correcta al montar el examen: la
// corrección ocurre en el servidor al finalizar (corregirSimulacro), comparando
// por TEXTO (los índices originales ya no sirven tras barajar).
// ---------------------------------------------------------------------------

// Re-exportadas por comodidad para el código de servidor que ya las importaba
// desde aquí (page.tsx, simulacro-actions.ts).
export * from "@/lib/simulacro-formato";

// Enlace al texto consolidado del BOE, con ancla al artículo (#aN). Réplica del
// helper de cerebro.ts (allí es privado): base verificada, el ancla degrada sin
// romperse.
function boeUrl(
  referencia: string | null,
  articulo: string | null,
): string | null {
  if (!referencia) return null;
  const base = `https://www.boe.es/buscar/act.php?id=${referencia}`;
  const m = articulo?.match(/(\d+)/);
  return m ? `${base}#a${m[1]}` : base;
}

// Mezcla in-place (Fisher–Yates). Sirve para muestrear preguntas y barajar
// alternativas al azar sin depender de RANDOM() de Postgres (PostgREST no lo
// expone sin RPC).
function mezclar<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A partir de las 4 (o N) opciones del banco y la opción correcta, construye las
// 3 alternativas del examen: correcta + 2 distractores al azar, todas barajadas.
function construirAlternativas(
  opciones: string[],
  correcta: string | null,
): string[] {
  const textos = opciones.filter((o) => typeof o === "string" && o.length > 0);
  // Correcta segura: la que dice `respuesta`, o la primera si faltara el dato.
  const textoCorrecto =
    correcta && textos.includes(correcta) ? correcta : (correcta ?? textos[0]);
  const distractores = mezclar(textos.filter((o) => o !== textoCorrecto));
  const elegidas = [textoCorrecto, ...distractores.slice(0, ALTERNATIVAS - 1)];
  return mezclar(elegidas);
}

// Fila que devuelve acertium_v2.simulacro_muestra(). El cliente de Supabase no
// tiene tipos generados para las funciones del schema del cerebro, así que la
// describimos aquí.
type FilaMuestra = {
  id: string;
  concepto_id: string;
  enunciado: string;
  opciones: unknown[] | null;
  respuesta: { correcta?: string | null } | null;
};

// Monta un simulacro: n actividades verificadas (tipo test) de la convocatoria
// PN, al azar, con 3 alternativas barajadas y SIN marcar la correcta. Si hay
// menos de n verificadas, usa las que haya.
export async function iniciarSimulacro(
  n: number = PREGUNTAS_SIMULACRO,
): Promise<PreguntaSimulacro[]> {
  const db = createCerebroClient();

  // 1+2) muestreo aleatorio de n actividades verificadas tipo test de la
  //   convocatoria, hecho EN LA BASE (order by random() limit n): traemos solo
  //   ~n filas en vez de todo el banco. `respuesta` no sale nunca del servidor.
  //   Pedimos un pequeño margen (n+10) por si alguna se descarta más abajo.
  //   Ver función acertium_v2.simulacro_muestra(conv, n).
  const { data, error: eActs } = await db.rpc("simulacro_muestra", {
    conv: CONVOCATORIA_PN,
    n: n + 10,
  });
  const acts = (data ?? []) as FilaMuestra[];
  if (eActs || acts.length === 0) return [];

  // 3) descartar actividades sin al menos 2 opciones válidas (necesitamos
  //    correcta + 1 distractor como mínimo)
  const validas = acts.filter(
    (a) =>
      Array.isArray(a.opciones) &&
      a.opciones.filter((o) => typeof o === "string" && o.length > 0).length >=
        2,
  );

  // 4) muestreo aleatorio de n + construcción de las 3 alternativas
  return mezclar(validas)
    .slice(0, n)
    .map((a) => ({
      actividadId: a.id,
      conceptoId: a.concepto_id,
      enunciado: a.enunciado,
      opciones: construirAlternativas(
        (a.opciones ?? []) as string[],
        a.respuesta?.correcta ?? null,
      ),
    }));
}

// Corrige el simulacro en el servidor con la fórmula oficial. Compara por TEXTO
// (los índices barajados no coinciden con `respuesta.indice`). Persiste un
// registro en `simulacro` (con E y blancos dentro de `detalle`) y un `evento`
// por cada pregunta CONTESTADA (log = fuente de verdad, alimenta el motor BKT).
export async function corregirSimulacro(
  respuestas: RespuestaUsuario[],
): Promise<ResumenSimulacro> {
  const db = createCerebroClient();

  const total = respuestas.length;
  if (total === 0) {
    return {
      simulacroId: null,
      total: 0,
      aciertos: 0,
      errores: 0,
      blancos: 0,
      nota: 0,
      duracionMs: 0,
      detalle: [],
    };
  }

  const actividadIds = respuestas.map((r) => r.actividadId);

  // 1) enunciado + respuesta correcta de las actividades del examen
  const { data: acts } = await db
    .from("actividad")
    .select("id, concepto_id, enunciado, respuesta")
    .in("id", actividadIds);
  const actInfo = new Map(
    (acts ?? []).map((a) => [
      a.id as string,
      {
        conceptoId: a.concepto_id as string,
        enunciado: (a.enunciado ?? "") as string,
        correcta: (a.respuesta?.correcta ?? null) as string | null,
      },
    ]),
  );

  const conceptoIds = [
    ...new Set([...actInfo.values()].map((a) => a.conceptoId)),
  ];

  // 2) explicación pedagógica por concepto y su fuente principal (para el BOE)
  const { data: conceptos } = await db
    .from("concepto")
    .select("id, explicacion")
    .in("id", conceptoIds);
  const explicacionDe = new Map(
    (conceptos ?? []).map((c) => [c.id as string, c.explicacion as string | null]),
  );

  const { data: fuentes } = await db
    .from("concepto_fuente")
    .select("concepto_id, articulo, referencia_boe")
    .in("concepto_id", conceptoIds);
  const fuenteDe = new Map<string, { articulo: string | null; ref: string | null }>();
  for (const f of fuentes ?? []) {
    // primera fuente por concepto (como en cerebro.responder)
    if (!fuenteDe.has(f.concepto_id as string)) {
      fuenteDe.set(f.concepto_id as string, {
        articulo: (f.articulo ?? null) as string | null,
        ref: (f.referencia_boe ?? null) as string | null,
      });
    }
  }

  // 3) corregir pregunta a pregunta + preparar eventos (solo contestadas)
  const ahora = new Date();
  let aciertos = 0;
  let errores = 0;
  let blancos = 0;
  let duracionMs = 0;
  const detalle: DetallePregunta[] = [];
  const eventos: Record<string, unknown>[] = [];

  for (const r of respuestas) {
    const info = actInfo.get(r.actividadId);
    duracionMs += Math.max(0, r.tiempoMs || 0);

    const correcta = info?.correcta ?? null;
    const enBlanco = r.textoElegido === null;
    const acierto =
      !enBlanco && correcta !== null && r.textoElegido === correcta;

    if (enBlanco) blancos += 1;
    else if (acierto) aciertos += 1;
    else errores += 1;

    const fuente = info ? fuenteDe.get(info.conceptoId) : undefined;
    detalle.push({
      actividadId: r.actividadId,
      conceptoId: info?.conceptoId ?? "",
      enunciado: info?.enunciado ?? "",
      textoElegido: r.textoElegido,
      correcta,
      acierto,
      explicacion: info ? (explicacionDe.get(info.conceptoId) ?? null) : null,
      articulo: fuente?.articulo ?? null,
      boeUrl: boeUrl(fuente?.ref ?? null, fuente?.articulo ?? null),
    });

    // Solo las preguntas contestadas son señal para el motor (una pregunta en
    // blanco no dice nada del dominio del concepto).
    if (info && !enBlanco) {
      eventos.push({
        usuario_id: DEMO_USUARIO_ID,
        concepto_id: info.conceptoId,
        actividad_id: r.actividadId,
        fecha: ahora.toISOString(),
        acierto,
        tiempo_respuesta_ms: r.tiempoMs ?? null,
      });
    }
  }

  // Fórmula oficial: nota = [A − E/(n−1)] × 10 / P, con n = 3 → E/2.
  // No negativa (si sale < 0, se muestra 0). Redondeo a 2 decimales.
  const bruta = (aciertos - errores / (ALTERNATIVAS - 1)) * 10 / total;
  const nota = Math.max(0, Math.round(bruta * 100) / 100);

  // 4) persistir: un registro de simulacro (E y blancos van en `detalle`) + un
  //    evento por pregunta contestada
  const { data: sim } = await db
    .from("simulacro")
    .insert({
      usuario_id: DEMO_USUARIO_ID,
      convocatoria_id: CONVOCATORIA_PN,
      total,
      aciertos,
      nota,
      duracion_ms: duracionMs,
      detalle: { errores, blancos, preguntas: detalle },
    })
    .select("id")
    .single();

  if (eventos.length > 0) {
    await db.from("evento").insert(eventos);
  }

  return {
    simulacroId: (sim?.id as string) ?? null,
    total,
    aciertos,
    errores,
    blancos,
    nota,
    duracionMs,
    detalle,
  };
}
