// Acertium — núcleo / verificador de lote (la "puerta" del generador)
// Comprueba, de forma DETERMINISTA (sin IA), un lote generado contra el texto
// literal de sus artículos. Lo que no pasa se RECHAZA (no se carga). Es lo que
// convierte "una IA que propone" en "contenido de fiar".
//
//   import { verificarLote } from './verificar-lote.mjs'
//
// Entrada (el "contrato"):
//   {
//     fuentes: { "art. 66": "<texto literal del artículo>", ... },
//     conceptos: [{ id, titulo, resumen, explicacion, articulo }],
//     actividades: [{ concepto_id, articulo, tipo:'test',
//                     enunciado, opciones:[4 strings], indice_correcto,
//                     cotejo, justificacion }]
//   }

import { normalizarNumeros } from "./verificador-cotejo.mjs";
import { cifrasSinRespaldo } from "./verificar-cifras.mjs";
import { esEjecucionDirecta } from "./ejecucion-directa.mjs";

const norm = (s) => normalizarNumeros(String(s ?? ""));
const contiene = (fuente, frag) => norm(fuente).includes(norm(frag));
const numeros = (s) => (norm(s).match(/\d+/g) || []);

export function verificarLote(lote) {
  const F = lote.fuentes || {};
  const rechazos = [];
  const avisos = [];
  const conceptosOK = [];
  const actividadesOK = [];

  for (const c of lote.conceptos || []) {
    const src = F[c.articulo];
    const errs = [];
    if (!src) errs.push(`sin fuente para ${c.articulo}`);
    if (!c.titulo || !c.resumen) errs.push("falta titulo o resumen");
    // Aviso (no bloquea): la explicación mete cifras que no están en la fuente.
    // No se rechaza porque una explicación puede citar un año o contexto real
    // (p. ej. "abdicación de 2014"); se marca para revisión.
    //
    // Son DOS comprobaciones, y la segunda existe porque la primera no ve los
    // enteros pequeños: como el BOE numera los apartados "1. 2. 3.", la cifra
    // pelada está en el artículo pase lo que pase (42 % de los casos, medido).
    // `cifrasSinRespaldo` mira el PAR cifra+unidad, que el andamiaje no puede
    // fabricar. Se unen en la MISMA lista para no inventar otro formato de
    // declaración: el autor sigue declarando por cifra en el campo `cifras`.
    if (c.explicacion && src) {
      const fuera = [
        ...new Set([
          ...numeros(c.explicacion).filter((n) => !numeros(src).includes(n)),
          ...cifrasSinRespaldo(c.explicacion, src),
        ]),
      ];
      if (fuera.length)
        avisos.push({ tipo: "concepto", id: c.id, aviso: `explicación con cifras ajenas a la fuente: ${fuera.join(", ")}` });
    }
    if (errs.length) rechazos.push({ tipo: "concepto", id: c.id, motivos: errs });
    else conceptosOK.push(c);
  }

  for (const a of lote.actividades || []) {
    const src = F[a.articulo];
    const ops = a.opciones || [];
    const errs = [];
    if (!src) errs.push(`sin fuente para ${a.articulo}`);
    if (a.tipo !== "test") errs.push("en el MVP solo se auto-verifica 'test'");
    if (ops.length !== 4) errs.push(`deben ser 4 opciones (hay ${ops.length})`);
    if (!(a.indice_correcto >= 0 && a.indice_correcto < ops.length))
      errs.push("indice_correcto fuera de rango");
    if (!a.cotejo) errs.push("falta cotejo");
    if (src && a.cotejo && !contiene(src, a.cotejo))
      errs.push("el cotejo NO es texto literal del artículo");
    const correcta = ops[a.indice_correcto];
    if (a.cotejo && correcta && !contiene(a.cotejo, correcta))
      errs.push("la opción correcta no está sostenida por el cotejo");
    // Anti-fuga: la opción correcta no debe ser trivialmente la única larga, etc.
    // (heurística simple: todas las opciones no vacías)
    if (ops.some((o) => !o || !String(o).trim())) errs.push("hay opciones vacías");

    if (errs.length)
      rechazos.push({
        tipo: "actividad",
        concepto: a.concepto_id,
        enunciado: String(a.enunciado || "").slice(0, 60),
        motivos: errs,
      });
    else actividadesOK.push(a);
  }

  // Relaciones (grafo): valida tipo, no-autobucle y extremos no vacíos. La
  // EXISTENCIA de los extremos en la base se comprueba al cargar (join en SQL).
  const TIPOS_REL = new Set(["prerrequisito", "desarrolla", "limita", "remite"]);
  const relacionesOK = [];
  for (const rel of lote.relaciones || []) {
    const errs = [];
    if (!rel.origen || !rel.destino) errs.push("falta origen o destino");
    if (rel.origen === rel.destino) errs.push("auto-bucle (origen=destino)");
    if (!TIPOS_REL.has(rel.tipo)) errs.push(`tipo inválido: ${rel.tipo}`);
    if (errs.length)
      rechazos.push({ tipo: "relacion", concepto: `${rel.origen}→${rel.destino}`, motivos: errs });
    else relacionesOK.push(rel);
  }

  // Barrera anti-islas: todo concepto del lote debe aparecer en al menos una
  // relación (como origen o destino). Si no, se avisa (posible isla).
  const enRelacion = new Set();
  for (const rel of relacionesOK) { enRelacion.add(rel.origen); enRelacion.add(rel.destino); }
  for (const c of conceptosOK) {
    if (!enRelacion.has(c.id))
      avisos.push({ tipo: "isla", id: c.id, aviso: "concepto sin relación en el lote (posible isla): añade una arista que lo conecte" });
  }

  return {
    conceptosOK,
    actividadesOK,
    relacionesOK,
    rechazos,
    avisos,
    resumen: `${conceptosOK.length} conceptos, ${actividadesOK.length} actividades y ${relacionesOK.length} relaciones pasan la puerta · ${rechazos.length} rechazadas · ${avisos.length} avisos`,
  };
}

// Self-test: node verificar-lote.mjs
if (esEjecucionDirecta(import.meta.url)) {
  const art66 =
    "1. Las Cortes Generales representan al pueblo español y están formadas por el Congreso de los Diputados y el Senado. 2. Las Cortes Generales ejercen la potestad legislativa del Estado, aprueban sus Presupuestos, controlan la acción del Gobierno y tienen las demás competencias que les atribuya la Constitución. 3. Las Cortes Generales son inviolables.";
  const lote = {
    fuentes: { "art. 66": art66 },
    conceptos: [
      { id: "X1", titulo: "Composición de las Cortes", resumen: "Las Cortes Generales están formadas por el Congreso de los Diputados y el Senado.", explicacion: "Las Cortes son bicamerales: dos cámaras, Congreso y Senado.", articulo: "art. 66" },
    ],
    actividades: [
      // válida
      { concepto_id: "X1", articulo: "art. 66", tipo: "test", enunciado: "¿Por qué cámaras están formadas las Cortes Generales?", opciones: ["Congreso y Gobierno", "el Congreso de los Diputados y el Senado", "Senado y Consejo de Estado", "solo el Congreso"], indice_correcto: 1, cotejo: "Las Cortes Generales representan al pueblo español y están formadas por el Congreso de los Diputados y el Senado.", justificacion: "Art. 66.1 CE." },
      // DEFECTUOSA a propósito: dato inventado (no está en el artículo)
      { concepto_id: "X1", articulo: "art. 66", tipo: "test", enunciado: "¿Cuántos diputados tiene el Congreso?", opciones: ["300", "350", "400", "250"], indice_correcto: 1, cotejo: "El Congreso se compone de 350 diputados.", justificacion: "inventado" },
    ],
  };
  const r = verificarLote(lote);
  console.log(r.resumen);
  for (const x of r.rechazos) console.log("  RECHAZO:", x.concepto || x.id, "→", x.motivos.join("; "));
  for (const x of r.avisos) console.log("  aviso:", x.id, "→", x.aviso);
}
