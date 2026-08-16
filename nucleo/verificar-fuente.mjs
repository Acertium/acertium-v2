// Acertium — pipeline / puerta de FUENTE (adaptadores no-BOE, temas 27-41)
//
// Implementa `docs/contrato-fuentes-no-boe.md` §1-§3. Las otras puertas dan por
// hecho que la fuente es una norma citable literalmente. Fuera del BOE eso solo
// vale a veces, y el contrato define un gradiente:
//
//   oficial    tratado, resolución ONU, texto oficial citable  → cita literal
//   autoridad  obra de referencia única (RAE, INCIBE, ISO)     → cita literal
//   consenso   concepto académico sin fuente única (T28-33)    → paráfrasis fiel
//
// Los dos primeros pueden quedar `verificado`. El tercero **no**: se carga como
// `pendiente_revision` y no se sirve hasta que un humano lo promueve. Esa es la
// red de seguridad del contrato, y esta puerta la hace cumplir en las dos
// direcciones: un `consenso` que venga marcado `verificado` se RECHAZA.
//
// Devuelve el mismo formato que las otras puertas: { ok, resumen, rechazos, avisos }.

import { esEjecucionDirecta } from "./ejecucion-directa.mjs";
import { normalizarNumeros } from "./verificador-cotejo.mjs";

export const TIPOS_FUENTE = ["oficial", "autoridad", "consenso"];

// Qué estado le toca a un lote según su tipo de fuente. Fuente única de verdad:
// la usa también `cargar.mjs` al insertar, para que la puerta y el cargador no
// puedan discrepar.
export function estadoSegunTipoFuente(tipoFuente) {
  return tipoFuente === "consenso" ? "pendiente_revision" : "verificado";
}

const vacio = (s) => !String(s ?? "").trim();

// Una referencia sirve si nombra la obra Y apunta a un sitio concreto (URL,
// apartado, artículo, página o BOE). "INCIBE" a secas no es una referencia.
function referenciaConcreta(texto) {
  const t = String(texto ?? "");
  if (vacio(t)) return false;
  return /https?:\/\/|BOE-[A-Z]-\d{4}-\d+|\b(art\.|artículo|apartado|secci[óo]n|cap[íi]tulo|p[áa]g\.|§)/i.test(t);
}

function textoFuente(meta) {
  const bruto = meta?.referencia_fuente ?? meta?.referencia_fuentes ?? meta?.referencia_boe;
  if (!bruto) return "";
  return (Array.isArray(bruto) ? bruto : [bruto]).map(String).join(" \n ");
}

// El check literal es EXACTAMENTE el de `verificar-lote.mjs` (contrato §3:
// "aplica el check literal de legal-es"). Se reutiliza `normalizarNumeros`, que
// además de tildes y caja ignora la puntuación y convierte número↔palabra. Una
// normalización propia, aunque parezca equivalente, no lo es: la primera versión
// de esta puerta conservaba la puntuación y rechazaba 7 actividades de CEDH,
// SOST, DROGA y SO que la puerta de contenido ya había dado por buenas. Dos
// puertas que miden lo mismo con distinta regla es una fuente de falsos
// rechazos, no una verificación más dura.
const norm = (s) => normalizarNumeros(String(s ?? ""));

/**
 * verificarFuente(lote) → { ok, resumen, rechazos, avisos, estadoDestino }
 *
 * `estadoDestino` es el `estado_verificacion` con el que debe cargarse el lote.
 */
export function verificarFuente(lote) {
  const meta = lote?.meta ?? {};
  const rechazos = [];
  const avisos = [];
  const tipo = meta.tipo_fuente;

  if (!TIPOS_FUENTE.includes(tipo)) {
    return {
      ok: false,
      resumen: `fuente: tipo_fuente inválido (${JSON.stringify(tipo)})`,
      rechazos: [
        {
          concepto: "(meta)",
          motivo: `tipo_fuente debe ser uno de ${TIPOS_FUENTE.join(" | ")}; llegó ${JSON.stringify(tipo)}`,
        },
      ],
      avisos,
      estadoDestino: null,
    };
  }

  // Referencia de la fuente: obligatoria para los tres tipos. Para `oficial` con
  // BOE, el propio BOE-A-… vale como referencia.
  const referencia = textoFuente(meta);
  if (vacio(referencia))
    rechazos.push({
      concepto: "(meta)",
      motivo: "falta referencia_fuente (nombre/URL + fecha); para `oficial` del BOE vale referencia_boe",
    });

  const estadoDestino = estadoSegunTipoFuente(tipo);

  // El lote no puede autoproclamarse verificado si es consenso.
  // Mismo criterio asimétrico que abajo: solo se rechaza reclamar MÁS confianza.
  const estadoDeclarado = meta.estado_verificacion;
  if (estadoDeclarado && estadoDeclarado !== estadoDestino) {
    if (estadoDeclarado === "verificado")
      rechazos.push({
        concepto: "(meta)",
        motivo:
          `el lote se declara estado_verificacion="verificado" pero un lote ${tipo} ` +
          `debe cargarse como "${estadoDestino}"` +
          (tipo === "consenso" ? " (un consenso NUNCA se carga verificado)" : ""),
      });
    else
      avisos.push({
        concepto: "(meta)",
        aviso: `el lote se declara "${estadoDeclarado}" siendo ${tipo}: manda el tipo_fuente`,
      });
  }

  // PROMPT_016: LOTES MIXTOS. Los del Grupo C traen su `tipo_fuente` POR
  // CONCEPTO: "inmigración" son 13 definiciones de la OIM y 3 del INE (citables
  // literalmente) junto a 5 de consenso. Juzgar las 21 con el tipo del lote
  // sería un error en los dos sentidos: exigiría substring a las de consenso, o
  // —lo que de verdad pasaba— eximiría del check literal a las citables.
  // Cada actividad se juzga por el tipo de SU concepto; el del lote es el
  // respaldo cuando el concepto no dice nada.
  const tipoPorConcepto = new Map(
    (lote.conceptos || []).map((c) => [c.id, TIPOS_FUENTE.includes(c.tipo_fuente) ? c.tipo_fuente : null]),
  );
  const cuenta = { oficial: 0, autoridad: 0, consenso: 0 };

  const F = lote.fuentes || {};
  for (const a of lote.actividades || []) {
    const id = a.concepto_id;
    const ops = a.opciones || [];
    const correcta = ops[a.indice_correcto];
    const tipoAct =
      (TIPOS_FUENTE.includes(a.tipo_fuente) ? a.tipo_fuente : null) ?? tipoPorConcepto.get(id) ?? tipo;
    cuenta[tipoAct] = (cuenta[tipoAct] ?? 0) + 1;

    if (vacio(a.cotejo)) {
      rechazos.push({ concepto: id, motivo: "falta cotejo" });
      continue;
    }

    if (tipoAct === "oficial" || tipoAct === "autoridad") {
      // Check literal, igual que legal-es: la correcta ⊂ cotejo, y el cotejo ⊂
      // el texto de la fuente cuando el lote lo trae.
      if (correcta && !norm(a.cotejo).includes(norm(correcta)))
        rechazos.push({ concepto: id, motivo: `la opción correcta no está sostenida por el cotejo (${tipoAct})` });
      const src = F[a.articulo];
      if (src && !norm(src).includes(norm(a.cotejo)))
        rechazos.push({ concepto: id, motivo: "el cotejo NO es texto literal de la fuente" });
    } else {
      // consenso: no se exige substring (una paráfrasis fiel no lo cumple), pero
      // sí que se diga DE DÓNDE sale, con precisión suficiente para revisarlo.
      const concepto = (lote.conceptos || []).find((c) => c.id === id);
      const ref = a.referencia_fuente ?? a.referencia ?? concepto?.referencia_fuente ?? concepto?.fuente ?? referencia;
      if (!referenciaConcreta(ref))
        rechazos.push({
          concepto: id,
          motivo:
            "un consenso exige referencia concreta (obra + apartado/página o URL): " +
            `«${String(ref).slice(0, 60)}» no lo es`,
        });
      if (a.revision_humana && a.revision_humana !== "pendiente")
        rechazos.push({
          concepto: id,
          motivo: `revision_humana="${a.revision_humana}"; un consenso se carga como "pendiente"`,
        });
      // Aviso: si además es cita literal, mejor; se anota para el revisor.
      if (correcta && norm(a.cotejo).includes(norm(correcta)))
        avisos.push({ concepto: id, aviso: "la correcta sí es literal del cotejo: revisión más rápida" });
    }
  }

  // Un concepto no puede autoproclamarse `verificado` si es de consenso (contrato
  // §3), aplicado al nivel donde ahora vive el tipo de fuente.
  //
  // El control es ASIMÉTRICO a propósito. Lo que hay que impedir es que un lote
  // reclame MÁS confianza de la que su fuente sostiene; que reclame MENOS no es
  // peligroso, solo cauteloso. La primera versión comparaba `!==` y tumbó el
  // lote de globalización entero: sus 17 conceptos de `autoridad` venían
  // marcados `pendiente_revision`, contradiciendo su propio `tipo_fuente` —los
  // otros cinco lotes del Grupo C lo declaran coherente, así que parece un
  // bloque copiado, no una decisión—. Rechazar por exceso de prudencia es
  // rechazar contenido bueno.
  //
  // Quien manda para cargar es el `tipo_fuente`, que es la regla del contrato;
  // la discrepancia se avisa para que se revise el lote.
  for (const c of lote.conceptos || []) {
    const t = tipoPorConcepto.get(c.id) ?? tipo;
    const destino = estadoSegunTipoFuente(t);
    if (!c.estado_verificacion || c.estado_verificacion === destino) continue;
    if (c.estado_verificacion === "verificado")
      rechazos.push({
        concepto: c.id,
        motivo: `el concepto se declara "verificado" pero siendo ${t} debe cargarse como "${destino}"`,
      });
    else
      avisos.push({
        concepto: c.id,
        aviso:
          `se declara "${c.estado_verificacion}" siendo ${t} (que iría a "${destino}"): ` +
          "se carga según su tipo_fuente; revisa si la declaración del lote es la intencionada",
      });
  }

  const mixto = new Set([...Object.entries(cuenta).filter(([, n]) => n > 0).map(([t]) => t)]);
  const desglose = Object.entries(cuenta)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${t}`)
    .join(" · ");

  return {
    ok: rechazos.length === 0,
    resumen:
      `fuente: lote=${tipo}${mixto.size > 1 ? " (MIXTO)" : ""} · ${(lote.actividades || []).length} actividades (${desglose}) · ` +
      `${rechazos.length} rechazos · ${avisos.length} avisos`,
    rechazos,
    avisos,
    // Estado del lote *en su conjunto*: sirve para el aviso de "esto no se
    // servirá". El estado real lo fija `cargar.mjs` concepto a concepto.
    estadoDestino,
    mixto: mixto.size > 1,
    porTipo: cuenta,
  };
}

// --- self-test: node nucleo/verificar-fuente.mjs -----------------------------
if (esEjecucionDirecta(import.meta.url)) {
  const casos = [];
  const comprobar = (nombre, real, esperado) => {
    const ok = real === esperado;
    casos.push(ok);
    console.log(`  ${ok ? "✓" : "✗"} ${nombre}${ok ? "" : ` (esperaba ${esperado}, dio ${real})`}`);
  };

  const actLiteral = {
    concepto_id: "ORTO-001",
    articulo: "regla 1",
    opciones: ["llevan tilde", "no llevan tilde", "llevan diéresis", "llevan guion"],
    indice_correcto: 0,
    cotejo: "Las palabras esdrújulas llevan tilde siempre.",
  };

  console.log("== oficial / autoridad: cita literal, quedan verificado ==");
  const rAut = verificarFuente({
    meta: { tipo_fuente: "autoridad", referencia_fuente: "RAE-ASALE, Ortografía 2.4.1 — https://www.rae.es/…" },
    actividades: [actLiteral],
    fuentes: { "regla 1": "Las palabras esdrújulas llevan tilde siempre." },
  });
  comprobar("autoridad con correcta literal PASA", rAut.ok, true);
  comprobar("…y su estado destino es verificado", rAut.estadoDestino, "verificado");

  const rNoLiteral = verificarFuente({
    meta: { tipo_fuente: "autoridad", referencia_fuente: "https://www.rae.es/…" },
    actividades: [{ ...actLiteral, opciones: ["llevan siempre acento gráfico", "b", "c", "d"] }],
  });
  comprobar("autoridad sin substring literal RECHAZA", rNoLiteral.ok, false);

  console.log("== consenso: sin substring, pero con fuente concreta ==");
  const actConsenso = {
    concepto_id: "GLOB-001",
    opciones: ["un proceso de interdependencia creciente", "b", "c", "d"],
    indice_correcto: 0,
    cotejo: "La globalización se entiende como la creciente interdependencia de las economías del mundo.",
    referencia_fuente: "FMI, «La globalización: ¿amenaza u oportunidad?», sección 2 — https://www.imf.org/…",
  };
  const rCons = verificarFuente({
    meta: { tipo_fuente: "consenso", referencia_fuente: "https://www.imf.org/…" },
    actividades: [actConsenso],
  });
  comprobar("consenso con paráfrasis + fuente concreta PASA", rCons.ok, true);
  comprobar("…y su estado destino es pendiente_revision", rCons.estadoDestino, "pendiente_revision");

  const rConsVago = verificarFuente({
    meta: { tipo_fuente: "consenso", referencia_fuente: "varios autores" },
    actividades: [{ ...actConsenso, referencia_fuente: "varios autores" }],
  });
  comprobar("consenso con referencia vaga RECHAZA", rConsVago.ok, false);

  const rConsVerificado = verificarFuente({
    meta: { tipo_fuente: "consenso", referencia_fuente: "https://www.imf.org/…", estado_verificacion: "verificado" },
    actividades: [actConsenso],
  });
  comprobar("consenso marcado verificado RECHAZA", rConsVerificado.ok, false);

  console.log("== meta ==");
  comprobar("tipo_fuente inválido RECHAZA", verificarFuente({ meta: { tipo_fuente: "wikipedia" }, actividades: [] }).ok, false);
  comprobar(
    "sin referencia RECHAZA",
    verificarFuente({ meta: { tipo_fuente: "autoridad" }, actividades: [] }).ok,
    false,
  );
  comprobar("estadoSegunTipoFuente(consenso)", estadoSegunTipoFuente("consenso"), "pendiente_revision");
  comprobar("estadoSegunTipoFuente(oficial)", estadoSegunTipoFuente("oficial"), "verificado");

  const ok = casos.filter(Boolean).length;
  console.log(`\nself-test verificar-fuente: ${ok}/${casos.length}`);
  if (ok !== casos.length) process.exit(1);
}
