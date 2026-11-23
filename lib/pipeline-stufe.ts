// Der einzige Schreibweg für die Stufe einer Marke.
//
// Warum eine eigene Datei und nicht upsertBrand(): upsertBrand rechnet bei
// jedem Schreibzugriff das Fit-Label neu (lib/pipeline.ts). Ein Stufenwechsel
// darf das nicht auslösen — er sagt nichts über die Passung der Marke, und
// ein Lauf über alle Marken hat schon einmal 43 Labels verdorben.
//
// Zwei Constraints stehen auf der Tabelle und sind `NOT VALID`: sie
// überspringen den Altbestand, prüfen aber jedes neue UPDATE. Darum wird hier
// vorher geprüft, sonst liefert Postgres 23514 und der Screen einen 500er.
import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";
import { STUFEN, VERLUST_GRUENDE, type Stufe, type VerlustGrund } from "./crm-heute-model";

export type StufeWechsel = {
  stufe: Stufe;
  /** Pflicht bei „Verloren“, sonst null. */
  verlust_grund: VerlustGrund | null;
  /** Pflicht bei „Später“, JJJJ-MM-TT, sonst null. */
  wiedervorlage: string | null;
  /** Freitext, landet als Notiz in der Historie. Optional. */
  notiz: string | null;
};

const heute = () => new Date().toISOString().slice(0, 10);

/** Liest das Formular, ohne zu prüfen. */
export function parseStufeForm(fd: FormData): StufeWechsel {
  const text = (k: string) => {
    const v = fd.get(k);
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  };
  return {
    stufe: (text("stufe") ?? "Recherche") as Stufe,
    verlust_grund: text("verlust_grund") as VerlustGrund | null,
    wiedervorlage: text("wiedervorlage"),
    notiz: text("notiz"),
  };
}

/**
 * Prüft einen Wechsel gegen die Constraints der Tabelle.
 * Gibt den Fehlertext zurück oder null, wenn er zulässig ist.
 */
export function pruefeStufe(w: StufeWechsel, bisher: Stufe): string | null {
  if (!STUFEN.includes(w.stufe)) return `„${w.stufe}“ ist keine gültige Stufe.`;
  if (w.stufe === bisher) return `Die Marke steht schon auf „${bisher}“.`;

  if (w.stufe === "Verloren") {
    if (!w.verlust_grund) return "Verloren braucht einen Grund.";
    if (!(VERLUST_GRUENDE as readonly string[]).includes(w.verlust_grund)) {
      return `„${w.verlust_grund}“ ist kein zulässiger Verlustgrund.`;
    }
  }

  if (w.stufe === "Später") {
    if (!w.wiedervorlage) return "Später braucht ein Datum für die Wiedervorlage.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(w.wiedervorlage)) return "Die Wiedervorlage ist kein Datum.";
    if (w.wiedervorlage < heute()) return "Die Wiedervorlage liegt in der Vergangenheit.";
  }

  return null;
}

/**
 * Schreibt die Stufe. Setzt voraus, dass pruefeStufe() null ergeben hat.
 *
 * Nicht mitgeschrieben wird der Eintrag in die Historie: den legt der Trigger
 * crm_stufe_protokoll an, und crm_stufe_seit setzt stufe_seit. Eine Notiz aus
 * dem Formular kommt als eigene Zeile dazu, mit Namen — die Trigger-Zeile
 * kennt keinen Urheber.
 */
export async function setzeStufe(id: string, w: StufeWechsel, wer: string): Promise<void> {
  const db = getSupabaseAdmin();

  // Felder, die nicht mehr zur Stufe passen, werden geleert: ein Verlustgrund
  // an einer wiederbelebten Marke ist später nicht von einem echten zu
  // unterscheiden.
  const { error } = await db
    .from("pipeline_brands")
    .update({
      stufe: w.stufe,
      verlust_grund: w.stufe === "Verloren" ? w.verlust_grund : null,
      wiedervorlage: w.stufe === "Später" ? w.wiedervorlage : null,
      datum_letzte_aktion: heute(),
    })
    .eq("id", id);
  if (error) throw new Error(`Stufe nicht gespeichert: ${error.message}`);

  if (w.notiz) {
    const { error: notizFehler } = await db.from("crm_aktivitaeten").insert({
      brand_id: id,
      typ: "Notiz",
      titel: `Stufe auf ${w.stufe}`,
      inhalt: w.notiz,
      wann: new Date().toISOString(),
      wer,
    });
    // Die Stufe steht schon. Eine verlorene Notiz darf den Wechsel nicht
    // zurücknehmen, sie wird nur gemeldet.
    if (notizFehler) console.error("Notiz zum Stufenwechsel nicht gespeichert", notizFehler);
  }
}
