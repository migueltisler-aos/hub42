// SumUp-Abgleich ohne Cron: wer das Marken-Portal öffnet, stößt höchstens
// alle ABSTAND_MS einen Abgleich an. Grund: Vercel-Crons im Minutentakt gibt
// es nur im Pro-Tarif; /api/cron/sumup steht trotzdem bereit.
import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";
import { synchronisiereZahlungen } from "./sumup";

const ABSTAND_MS = 5 * 60 * 1000;
let letzterVersuch = 0;

export async function abgleichWennNoetig(): Promise<void> {
  if (!process.env.SUMUP_API_KEY) return;
  if (Date.now() - letzterVersuch < ABSTAND_MS) return;
  letzterVersuch = Date.now();
  try {
    const { data } = await getSupabaseAdmin()
      .from("sumup_transaktionen")
      .select("aktualisiert_am")
      .order("aktualisiert_am", { ascending: false })
      .limit(1)
      .maybeSingle();
    const zuletzt = data?.aktualisiert_am ? new Date(data.aktualisiert_am).getTime() : 0;
    // Ein Lauf schreibt nur Neues; ohne neue Zahlung bleibt der Zeitstempel stehen,
    // deshalb zusätzlich das In-Memory-Intervall oben.
    if (Date.now() - zuletzt < 60 * 1000) return;
    await synchronisiereZahlungen({ limit: 50 });
  } catch (e) {
    console.error("sumup-abgleich:", e instanceof Error ? e.message : e);
  }
}
