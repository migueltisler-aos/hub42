// Bewerbungen – Datenzugriff (nur serverseitig).
import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ONBOARDINGS_PRO_WOCHE, wochenbeginnBerlin } from "@/lib/bewerbung-model";

/**
 * Freie Onboarding-Termine dieser Woche.
 *
 * null, wenn die Zählung nicht geht (Tabelle fehlt, Key fehlt): Die Seite
 * zeigt dann nur "5 Onboardings pro Woche", statt eine erfundene Zahl.
 */
export async function onboardingsFrei(): Promise<number | null> {
  try {
    const { count, error } = await getSupabaseAdmin()
      .from("bewerbungen")
      .select("id", { count: "exact", head: true })
      .gte("created_at", wochenbeginnBerlin())
      .neq("status", "abgelehnt");
    if (error || count === null) return null;
    return Math.max(0, ONBOARDINGS_PRO_WOCHE - count);
  } catch {
    return null;
  }
}
