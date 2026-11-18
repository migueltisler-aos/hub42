// Hinweis ans Team per Telegram (wie bei neuen Bewerbungen). Ein Fehler hier
// darf nie eine Speicherung kosten.
import "server-only";

export async function teamBenachrichtigen(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: `🏷️ ${text}` }),
  }).catch((e) => console.error("telegram:", e));
}
