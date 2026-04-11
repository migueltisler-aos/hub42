"use server";

export interface ContactPayload {
  name: string;
  email: string;
  brand: string;
  typ: string;
  nachricht: string;
}

export async function submitContact(payload: ContactPayload): Promise<{ ok: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set");
    return { ok: false };
  }

  const text = [
    `<b>📬 Neue Hub42-Anfrage</b>`,
    ``,
    `<b>Name:</b> ${payload.name}`,
    `<b>E-Mail:</b> ${payload.email}`,
    `<b>Brand:</b> ${payload.brand || "–"}`,
    `<b>Typ:</b> ${payload.typ}`,
    ``,
    `<b>Nachricht:</b>`,
    payload.nachricht,
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  return { ok: res.ok };
}
