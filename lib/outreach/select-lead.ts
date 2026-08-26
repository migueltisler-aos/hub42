import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface OutreachLead {
  id: string;
  name: string;
  email: string | null;
  ansprechpartner: string | null;
  perso_satz: string | null;
  prio: string | null;
  outreach_status: string;
  status: string;
  thread_id: string | null;
  gmail_message_id: string | null;
  last_step: number;
  next_action_at: string | null;
  datum_erstkontakt: string | null;
}

const PRIO_RANK: Record<string, number> = { hoch: 0, mittel: 1 };

/**
 * Nächster fälliger Lead: entweder frisch 'queued', oder ein Follow-up, dessen
 * next_action_at erreicht ist. 'hoch' vor 'mittel', sonst FIFO nach
 * created_at (die DB-Query liefert bereits in dieser Reihenfolge, Array.sort
 * ist stabil und ändert die Reihenfolge innerhalb eines Prio-Rangs nicht).
 * Suppression wird hier UND direkt vor dem Versand geprüft (Race-Schutz).
 */
export async function selectNextLead(now: Date = new Date()): Promise<OutreachLead | null> {
  const sb = getSupabaseAdmin();
  const nowIso = now.toISOString();

  const [{ data: candidates, error }, { data: suppressed, error: suppError }] = await Promise.all([
    sb
      .from("pipeline_brands")
      .select(
        "id, name, email, ansprechpartner, perso_satz, prio, outreach_status, status, thread_id, gmail_message_id, last_step, next_action_at, datum_erstkontakt"
      )
      // Nur echte Marken: in derselben Tabelle liegen auch Nicht-Marken
      // (Forschungspartner o. ä.). Die dürfen nie in die Kaltakquise geraten —
      // strukturell, nicht nur solange niemand prio setzt.
      .eq("typ", "Brand")
      .eq("ko_flag", false)
      .or(
        `outreach_status.eq.queued,and(outreach_status.eq.contacted,next_action_at.lte.${nowIso},last_step.lt.3)`
      )
      .order("created_at", { ascending: true })
      .limit(200),
    sb.from("suppression").select("email"),
  ]);

  if (error) throw error;
  if (suppError) throw suppError;

  const suppressedSet = new Set((suppressed ?? []).map((s) => s.email));

  const eligible = (candidates ?? []).filter(
    (lead) => lead.email && !suppressedSet.has(lead.email.toLowerCase().trim())
  );

  eligible.sort((a, b) => {
    const rankA = PRIO_RANK[a.prio ?? ""] ?? 2;
    const rankB = PRIO_RANK[b.prio ?? ""] ?? 2;
    return rankA - rankB;
  });

  return eligible[0] ?? null;
}
