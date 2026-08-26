import dotenv from "dotenv";
import { isWithinSendWindow, startOfBerlinDay } from "@/lib/outreach/time";
import { getDailyCap } from "@/lib/outreach/cap";
import { randomIntervalMinutes } from "@/lib/outreach/throttle";
import { selectNextLead } from "@/lib/outreach/select-lead";
import { sendOutreachStep } from "@/lib/outreach/send-step";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

dotenv.config({ path: ".env.local" });

/**
 * Manueller Batch-Versand — läuft lokal, kein Cron/Inngest nötig. Sendet
 * fällige Mails mit 6–18-Minuten-Zufallspausen dazwischen, bis: Tages-Cap
 * erreicht, Sendefenster vorbei, keine fälligen Leads mehr, oder die
 * optionale Obergrenze aus dem Aufruf erreicht ist.
 *
 * Muss laufen, solange der Batch dauert (Terminal offen lassen) — auf
 * Vercel könnte eine Funktion mit stundenlangen Wartezeiten nicht laufen,
 * deshalb bewusst als lokales Skript statt als Server-Route gebaut.
 *
 * Aufruf: pnpm send-batch [max-anzahl]
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countSentToday(now: Date): Promise<number> {
  const sb = getSupabaseAdmin();
  const dayStart = startOfBerlinDay(now);
  const { count, error } = await sb
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("type", "sent")
    .gte("created_at", dayStart.toISOString());
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  const maxArg = process.argv[2];
  const maxThisRun = maxArg ? Number(maxArg) : Infinity;
  if (maxArg && (!Number.isFinite(maxThisRun) || maxThisRun <= 0)) {
    console.error("Nutzung: pnpm send-batch [max-anzahl]");
    process.exit(1);
  }

  const isDryRun = process.env.DRY_RUN === "true";
  if (isDryRun) console.log("DRY_RUN aktiv — es wird nichts wirklich versendet.\n");

  let sentThisRun = 0;
  const skippedIds = new Set<string>();

  while (sentThisRun < maxThisRun) {
    const now = new Date();

    if (!isWithinSendWindow(now)) {
      console.log("Außerhalb des Sendefensters (Di–Do, 9–11 & 13–16 Uhr Europe/Berlin). Stoppe.");
      break;
    }

    const cap = getDailyCap();
    const sentToday = await countSentToday(now);
    if (sentToday >= cap) {
      console.log(`Tages-Cap erreicht (${sentToday}/${cap}). Stoppe.`);
      break;
    }

    const lead = await selectNextLead(now);
    if (!lead) {
      console.log("Keine fälligen Leads mehr. Fertig.");
      break;
    }

    if (skippedIds.has(lead.id)) {
      console.log(
        `"${lead.name}" wurde in diesem Lauf schon übersprungen und kommt erneut zurück — breche ab, um keine Endlosschleife zu riskieren.`
      );
      break;
    }

    const result = await sendOutreachStep(lead, now);

    if (result.skipped) {
      skippedIds.add(lead.id);
      console.log(`Übersprungen: ${lead.name} (${result.reason})`);
      continue;
    }

    sentThisRun++;
    console.log(
      `[${sentThisRun}${maxThisRun !== Infinity ? `/${maxThisRun}` : ""}] Gesendet an ${lead.name} (${lead.email}), Schritt ${result.step}. Heute insgesamt: ${sentToday + 1}/${cap}.`
    );

    if (sentThisRun >= maxThisRun) break;

    const waitMinutes = randomIntervalMinutes();
    console.log(`Warte ${waitMinutes.toFixed(1)} Minuten bis zur nächsten Mail (Strg+C zum Abbrechen)...`);
    await sleep(waitMinutes * 60_000);
  }

  console.log(`\nLauf beendet. ${sentThisRun} Mail(s) in diesem Lauf gesendet.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
