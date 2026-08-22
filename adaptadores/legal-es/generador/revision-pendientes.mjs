// Acertium — adaptador legal-es / generador / cola de revisión humana
//
// El contenido `tipo_fuente: consenso` (temas 28-33) se carga como
// `pendiente_revision` y NO se sirve a nadie hasta que un humano lo mira. Este
// script es el mínimo viable para hacer esa revisión desde la terminal, mientras
// llega el panel `/admin` (PROMPT_012), que hará lo mismo con pantalla.
//
//   node revision-pendientes.mjs                    resumen por familia
//   node revision-pendientes.mjs --familia GLOB     lista el detalle de una familia
//   node revision-pendientes.mjs --promover GLOB-007            promueve una
//   node revision-pendientes.mjs --promover-familia GLOB        promueve una familia entera
//   node revision-pendientes.mjs --rechazar GLOB-007            la descarta
//
// Promover = pasar a `verificado`, que es lo único que el runtime sirve. Es una
// decisión editorial: el script no la toma solo, la ejecuta cuando se le pide.

import { createCerebroClient } from "./cliente-cerebro.mjs";

const args = process.argv.slice(2);
const valor = (bandera) => {
  const i = args.indexOf(bandera);
  return i >= 0 ? args[i + 1] : null;
};

const db = createCerebroClient();
const familiaDe = (id) => String(id).split("-")[0];

async function pendientes() {
  const { data, error } = await db
    .from("actividad")
    .select("id, concepto_id, enunciado, opciones, respuesta, cotejo_fuente")
    .eq("estado_verificacion", "pendiente_revision");
  if (error) throw error;
  return data ?? [];
}

// Referencia de la fuente: vive en concepto_fuente, no en la actividad.
async function fuentesDe(conceptoIds) {
  const mapa = new Map();
  for (let i = 0; i < conceptoIds.length; i += 100) {
    const { data, error } = await db
      .from("concepto_fuente")
      .select("concepto_id, norma, articulo, referencia_boe")
      .in("concepto_id", conceptoIds.slice(i, i + 100));
    if (error) throw error;
    for (const f of data) mapa.set(f.concepto_id, f);
  }
  return mapa;
}

async function cambiarEstado(filtro, estado, etiqueta) {
  let q = db.from("actividad").update({ estado_verificacion: estado }).eq("estado_verificacion", "pendiente_revision");
  q = filtro.concepto ? q.eq("concepto_id", filtro.concepto) : q.like("concepto_id", `${filtro.familia}-%`);
  const { data, error } = await q.select("id, concepto_id");
  if (error) throw error;

  // El concepto acompaña a su actividad: si la pregunta pasa a verificado, el
  // concepto también, o el selector tendría un concepto pendiente con pregunta
  // servible.
  const conceptos = [...new Set(data.map((r) => r.concepto_id))];
  if (conceptos.length) {
    const { error: eC } = await db
      .from("concepto")
      .update({ estado_verificacion: estado, explicacion_verificacion: estado })
      .in("id", conceptos)
      .eq("estado_verificacion", "pendiente_revision");
    if (eC) throw eC;
  }

  // Rastro de la revisión (contrato-fuentes-no-BOE §2 y §5). Mismo registro que
  // escribe la pantalla /admin: sin fecha de revisión, la cadencia de
  // re-verificación no tiene desde cuándo contar, y una recarga que reaplique
  // `estadoSegunTipoFuente` borraría la revisión sin dejar constancia.
  // No bloquea: el contenido ya está promovido, dejarlo a medias sería peor.
  if (data.length) {
    const { error: eR } = await db.from("revision").insert(
      data.map((r) => ({
        actividad_id: r.id,
        concepto_id: r.concepto_id,
        estado_anterior: "pendiente_revision",
        estado_nuevo: estado,
        origen: "cli",
      })),
    );
    if (eR) console.error(`  ⚠ revisión aplicada pero SIN registrar en acertium_v2.revision: ${eR.message}`);
  }

  console.log(`✓ ${data.length} actividades y ${conceptos.length} conceptos → ${estado} (${etiqueta})`);
  return data.length;
}

// --- promover / rechazar ----------------------------------------------------
const promover = valor("--promover");
const promoverFamilia = valor("--promover-familia");
const rechazar = valor("--rechazar");

if (promover) {
  await cambiarEstado({ concepto: promover }, "verificado", promover);
  process.exit(0);
}
if (promoverFamilia) {
  await cambiarEstado({ familia: promoverFamilia }, "verificado", `familia ${promoverFamilia}`);
  process.exit(0);
}
if (rechazar) {
  await cambiarEstado({ concepto: rechazar }, "rechazado", rechazar);
  process.exit(0);
}

// --- listado ----------------------------------------------------------------
const filas = await pendientes();
if (!filas.length) {
  console.log("No hay nada en pendiente_revision. (El contenido de consenso —temas 28-33— aún no se ha generado.)");
  process.exit(0);
}

const familiaPedida = valor("--familia");
const porFamilia = new Map();
for (const f of filas) {
  const fam = familiaDe(f.concepto_id);
  if (!porFamilia.has(fam)) porFamilia.set(fam, []);
  porFamilia.get(fam).push(f);
}

console.log(`== cola de revisión: ${filas.length} actividades en pendiente_revision ==\n`);
for (const [fam, lista] of [...porFamilia].sort()) {
  console.log(`  ${fam.padEnd(8)} ${String(lista.length).padStart(4)} actividades`);
}

if (!familiaPedida) {
  console.log("\nDetalle de una familia:  node revision-pendientes.mjs --familia GLOB");
  console.log("Promover tras revisar:   node revision-pendientes.mjs --promover-familia GLOB");
  process.exit(0);
}

const lista = porFamilia.get(familiaPedida) ?? [];
const fuentes = await fuentesDe([...new Set(lista.map((f) => f.concepto_id))]);
console.log(`\n== ${familiaPedida}: ${lista.length} actividades ==`);
for (const a of lista) {
  const correcta = a.respuesta?.correcta;
  const fuente = fuentes.get(a.concepto_id);
  console.log(`\n[${a.concepto_id}] ${a.enunciado}`);
  for (const o of a.opciones ?? []) console.log(`   ${o === correcta ? "→" : " "} ${o}`);
  console.log(`   cotejo: ${String(a.cotejo_fuente ?? "").slice(0, 200)}`);
  console.log(`   fuente: ${fuente ? `${fuente.norma} · ${fuente.articulo}${fuente.referencia_boe ? ` · ${fuente.referencia_boe}` : ""}` : "(sin concepto_fuente)"}`);
}
console.log(`\nPromover la familia entera:  node revision-pendientes.mjs --promover-familia ${familiaPedida}`);
