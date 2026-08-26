import dotenv from "dotenv";
import { getGmailClient } from "@/lib/outreach/gmail";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

dotenv.config({ path: ".env.local" });

/**
 * Registriert (oder erneuert) den Gmail-Pub/Sub-Watch fürs Sende-Postfach.
 * Läuft nach ~7 Tagen ab — muss regelmäßig wiederholt werden (z. B. als
 * wöchentlicher Reminder, bis wir das ggf. selbst per Cron automatisieren).
 *
 * Aufruf: pnpm gmail:watch projects/<PROJECT_ID>/topics/<TOPIC_NAME>
 */
async function main() {
  const topicName = process.argv[2];
  if (!topicName) {
    console.error("Nutzung: pnpm gmail:watch projects/<PROJECT_ID>/topics/<TOPIC_NAME>");
    process.exit(1);
  }

  const gmail = getGmailClient();
  const { data } = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
    },
  });

  if (!data.historyId) {
    throw new Error("Gmail-API hat keine historyId zurückgegeben");
  }

  await getSupabaseAdmin()
    .from("outreach_sync_state")
    .update({ last_history_id: data.historyId, updated_at: new Date().toISOString() })
    .eq("id", true);

  const expiration = data.expiration ? new Date(Number(data.expiration)).toISOString() : "unbekannt";
  console.log(`Watch aktiv. Läuft ab: ${expiration}`);
  console.log(`Start-historyId in outreach_sync_state gespeichert: ${data.historyId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
