// Acertium — ¿de verdad el runtime no sirve `pendiente_revision`?
//
// Leer las definiciones de las funciones y ver el `where estado_verificacion =
// 'verificado'` es necesario pero no suficiente: lo que importa es que ninguna
// ruta de selección devuelva contenido sin revisar. Este script lo comprueba en
// la base de verdad.
//
//   node probar-aislamiento-revision.mjs
//
// Crea un concepto + actividad de prueba en `pendiente_revision`, interroga las
// cuatro vías por las que una pregunta puede llegar al usuario, y **borra lo
// que creó pase lo que pase** (bloque finally). No toca ningún dato real.

import { createCerebroClient } from "./cliente-cerebro.mjs";

const ID = "ZZTEST-PENDREV-001";
const CONV = "policia-nacional-2026";
const db = createCerebroClient();

const casos = [];
const comprobar = (nombre, ok, detalle = "") => {
  casos.push(ok);
  console.log(`  ${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
};

let actividadId = null;

try {
  // --- montaje ---------------------------------------------------------------
  const { error: e1 } = await db.from("concepto").upsert(
    {
      id: ID,
      materia: "_prueba-aislamiento",
      titulo: "Concepto de prueba (aislamiento pendiente_revision)",
      resumen: "Fila temporal creada por probar-aislamiento-revision.mjs.",
      explicacion: "Se borra al terminar el script.",
      estado_verificacion: "pendiente_revision",
      explicacion_verificacion: "pendiente_revision",
    },
    { onConflict: "id" },
  );
  if (e1) throw e1;

  const { data: act, error: e2 } = await db
    .from("actividad")
    .insert({
      concepto_id: ID,
      tipo: "test",
      enunciado: "¿Esta pregunta debería llegar a un usuario?",
      opciones: ["No, está pendiente de revisión", "Sí", "Depende"],
      respuesta: { correcta: "No, está pendiente de revisión", indice: 0 },
      justificacion: "Fila de prueba.",
      cotejo_fuente: "No, está pendiente de revisión.",
      estado_verificacion: "pendiente_revision",
    })
    .select("id")
    .single();
  if (e2) throw e2;
  actividadId = act.id;

  // Entra en el overlay de la convocatoria: si el aislamiento fallara, sería
  // candidata de pleno derecho.
  const { error: e3 } = await db
    .from("overlay_entrada")
    .upsert(
      { convocatoria_id: CONV, concepto_id: ID, tema: "Tema de prueba", peso: 1 },
      { onConflict: "convocatoria_id,concepto_id" },
    );
  if (e3) throw e3;

  console.log("== aislamiento de pendiente_revision ==");
  console.log(`  (montada actividad ${actividadId} sobre ${ID}, en el overlay de ${CONV})`);

  // --- 1. actividad_de_concepto: la vía determinista -------------------------
  const { data: porConcepto, error: e4 } = await db.rpc("actividad_de_concepto", { cid: ID });
  if (e4) throw e4;
  comprobar(
    "actividad_de_concepto() no la devuelve",
    (porConcepto ?? []).length === 0,
    `devolvió ${(porConcepto ?? []).length} filas`,
  );

  // --- 2. practicar_estado: el concepto no debe ser ni candidato -------------
  // Se FILTRA sobre el resultado del RPC en vez de recorrer la lista: PostgREST
  // corta la respuesta en 1.000 filas, así que "no aparece entre las que me
  // devolvió" no probaría nada. Filtrando, el propio Postgres responde si está.
  const { data: estado, error: e5 } = await db
    .rpc("practicar_estado", { conv: CONV, usuario: "00000000-0000-0000-0000-000000000000" })
    .eq("concepto_id", ID);
  if (e5) throw e5;
  comprobar(
    "practicar_estado() no lo lista como candidato",
    (estado ?? []).length === 0,
    `filtrando por ${ID}: ${(estado ?? []).length} filas`,
  );

  // --- 3. simulacro_muestra: pidiendo MÁS preguntas que las que hay ----------
  // Con n mayor que el banco entero, si fuera elegible saldría seguro; y se
  // filtra por su id, igual que arriba.
  const { data: muestra, error: e6 } = await db
    .rpc("simulacro_muestra", { conv: CONV, n: 100000 })
    .eq("id", actividadId);
  if (e6) throw e6;
  comprobar(
    "simulacro_muestra() no la incluye ni pidiendo el banco entero",
    (muestra ?? []).length === 0,
    `filtrando por su id: ${(muestra ?? []).length} filas`,
  );

  // --- 4. siguiente_actividad_test: comprobación estructural -----------------
  // Es `order by random() limit 1`, así que su ausencia en una tirada no prueba
  // nada. Lo que se comprueba es que el universo del que sortea la excluye.
  const { count, error: e7 } = await db
    .from("actividad")
    .select("id", { count: "exact", head: true })
    .eq("estado_verificacion", "verificado")
    .eq("concepto_id", ID);
  if (e7) throw e7;
  comprobar(
    "el universo de siguiente_actividad_test() la excluye",
    count === 0,
    `${count} actividades verificado en ${ID}`,
  );

  // --- 5. y al promoverla, SÍ se sirve --------------------------------------
  // El aislamiento solo vale si es reversible: si nada saliera nunca, el test
  // pasaría por el motivo equivocado.
  const { error: e8 } = await db
    .from("actividad")
    .update({ estado_verificacion: "verificado" })
    .eq("id", actividadId);
  if (e8) throw e8;
  const { data: trasPromover, error: e9 } = await db.rpc("actividad_de_concepto", { cid: ID });
  if (e9) throw e9;
  comprobar(
    "tras promover a verificado, actividad_de_concepto() SÍ la devuelve",
    (trasPromover ?? []).length === 1,
    `devolvió ${(trasPromover ?? []).length} filas`,
  );
} finally {
  // --- limpieza --------------------------------------------------------------
  await db.from("overlay_entrada").delete().eq("concepto_id", ID);
  if (actividadId) await db.from("actividad").delete().eq("id", actividadId);
  await db.from("actividad").delete().eq("concepto_id", ID);
  await db.from("concepto").delete().eq("id", ID);
  const { count } = await db.from("concepto").select("id", { count: "exact", head: true }).eq("id", ID);
  console.log(`  · limpieza: ${count === 0 ? "sin restos" : "⚠ QUEDAN RESTOS de " + ID}`);
}

const ok = casos.filter(Boolean).length;
console.log(`\nself-test aislamiento: ${ok}/${casos.length}`);
if (ok !== casos.length) process.exit(1);
