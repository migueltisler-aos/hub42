"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { pruefeBewerbung, type BewerbungPayload } from "@/lib/bewerbung-model";
import { ZONES } from "@/lib/neue-ui/regal";

/** Telegram erwartet HTML – Nutzereingaben dürfen dort kein Markup erzeugen. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function submitBewerbung(p: BewerbungPayload): Promise<{ ok: boolean }> {
  // Bot im Honeypot: so tun, als wäre alles gut, aber nichts speichern.
  if (p.firma2) return { ok: true };
  if (Object.keys(pruefeBewerbung(p)).length > 0) return { ok: false };

  const zone = p.zone && p.zone in ZONES ? p.zone : null;
  const cm = zone && p.cm && p.cm >= 5 && p.cm <= 84 ? Math.round(p.cm) : null;

  const { error } = await getSupabaseAdmin()
    .from("bewerbungen")
    .insert({
      name: p.name.trim(),
      email: p.email.trim(),
      marke: p.marke.trim(),
      produkt: p.produkt.trim(),
      website: p.website.trim() || null,
      zone,
      cm,
      besonderer_wert: p.besondererWert,
      begruendung: p.besondererWert ? p.begruendung.trim() : null,
      nachricht: p.nachricht.trim() || null,
    });

  if (error) {
    console.error("bewerbungen insert:", error.message);
    return { ok: false };
  }

  // Zähler "x von 5 frei" auf der Startseite sofort nachziehen.
  revalidatePath("/");

  // Benachrichtigung ans Team – ein Fehler hier kostet keine Bewerbung,
  // die liegt schon in der Tabelle.
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const text = [
      `<b>🧾 Neue Hub42-Bewerbung</b>`,
      ``,
      `<b>Marke:</b> ${esc(p.marke)}`,
      `<b>Produkt:</b> ${esc(p.produkt)}`,
      `<b>Name:</b> ${esc(p.name)}`,
      `<b>E-Mail:</b> ${esc(p.email)}`,
      `<b>Website:</b> ${esc(p.website) || "–"}`,
      `<b>Front:</b> ${zone ? `${ZONES[zone].name}${cm ? `, ${cm} cm` : ""}` : "–"}`,
      p.besondererWert ? `\n<b>⭐ Antrag 59-€-Kondition:</b>\n${esc(p.begruendung)}` : "",
      p.nachricht ? `\n<b>Nachricht:</b>\n${esc(p.nachricht)}` : "",
    ].join("\n");

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    }).catch((e) => console.error("telegram:", e));
  }

  return { ok: true };
}
