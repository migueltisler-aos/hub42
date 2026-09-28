"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { pruefeBewerbung, type BewerbungPayload } from "@/lib/bewerbung-model";
import { BUNDESLAENDER } from "@/lib/beratung";
import { ZONES } from "@/lib/neue-ui/regal";
import { SHOW_BAFA } from "@/lib/site-flags";
import { EINSTIEGE, mitRegalwahl, type EinstiegKey } from "@/lib/treppe";

const janein = (v: boolean | null) => (v === null ? "–" : v ? "ja" : "nein");

/** Telegram erwartet HTML – Nutzereingaben dürfen dort kein Markup erzeugen. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function submitBewerbung(p: BewerbungPayload): Promise<{ ok: boolean }> {
  // Bot im Honeypot: so tun, als wäre alles gut, aber nichts speichern.
  if (p.firma2) return { ok: true };
  if (Object.keys(pruefeBewerbung(p)).length > 0) return { ok: false };

  const einstieg = p.einstieg as EinstiegKey; // von pruefeBewerbung garantiert
  // Stufe 3 bis 5: Regal inklusive, also keine Zone, Breite, Sonderkondition.
  const regalwahl = mitRegalwahl(einstieg);
  const besondererWert = regalwahl && p.besondererWert;
  const zone = regalwahl && p.zone && p.zone in ZONES ? p.zone : null;
  const cm = zone && p.cm && p.cm >= 5 && p.cm <= 84 ? Math.round(p.cm) : null;
  const beratung = SHOW_BAFA ? p.beratungInteresse : null;
  const bundesland =
    beratung && (BUNDESLAENDER as readonly string[]).includes(p.bundesland) ? p.bundesland : null;

  const basis = {
    name: p.name.trim(),
    email: p.email.trim(),
    marke: p.marke.trim(),
    produkt: p.produkt.trim(),
    website: p.website.trim() || null,
    zone,
    cm,
    besonderer_wert: besondererWert,
    begruendung: besondererWert ? p.begruendung.trim() : null,
    nachricht: p.nachricht.trim() || null,
  };
  const neu = {
    einstieg,
    stationaer_gelistet: p.stationaerGelistet,
    online_handel: p.onlineHandel,
    beratung_interesse: beratung,
    bundesland,
  };

  const db = getSupabaseAdmin().from("bewerbungen");
  let { error } = await db.insert({ ...basis, ...neu });

  // Migration bewerbungen_treppe_migration.sql noch nicht gelaufen (Spalte
  // fehlt): Bewerbung trotzdem speichern, die neuen Angaben in die Nachricht.
  if (error?.code === "PGRST204") {
    console.error("bewerbungen: Treppe-Spalten fehlen, Fallback:", error.message);
    const extra = [
      `Einstieg: ${EINSTIEGE[einstieg]}`,
      `Stationär gelistet: ${janein(neu.stationaer_gelistet)}`,
      `Online-Handel: ${janein(neu.online_handel)}`,
      SHOW_BAFA ? `Beratung: ${janein(beratung)}${bundesland ? `, ${bundesland}` : ""}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    ({ error } = await db.insert({
      ...basis,
      nachricht: [extra, basis.nachricht].filter(Boolean).join("\n\n"),
    }));
  }

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
      `<b>Einstieg:</b> ${EINSTIEGE[einstieg]}`,
      `<b>Stationär gelistet:</b> ${janein(p.stationaerGelistet)}`,
      `<b>Onlineshop/Marktplätze:</b> ${janein(p.onlineHandel)}`,
      SHOW_BAFA
        ? `<b>Geförderte Beratung:</b> ${janein(beratung)}${bundesland ? ` (${bundesland})` : ""}`
        : "",
      `<b>Front:</b> ${zone ? `${ZONES[zone].name}${cm ? `, ${cm} cm` : ""}` : "–"}`,
      besondererWert ? `\n<b>⭐ Antrag 59-€-Kondition:</b>\n${esc(p.begruendung)}` : "",
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
