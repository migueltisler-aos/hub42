"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { anfrageAbgeschickt } from "@/lib/ki-anfragen";
import { pruefeBewerbung, type BewerbungPayload } from "@/lib/bewerbung-model";
import { BUNDESLAENDER } from "@/lib/beratung";
import { EIGENTUM, HANDELSREIFE, STARTS, VERTRIEB, ZIELE, klemmeFaktor } from "@/lib/assistent-model";
import type { AssistentErgebnis } from "@/lib/bewerbung-model";
import { sichereFarben, type ArtikelTexte, type KarteAuswahl, type KarteProdukt } from "@/lib/karte-model";
import { HALTUNG_TAGS, KATEGORIEN_KANONISCH } from "@/lib/pipeline-model";
import { ZONES } from "@/lib/neue-ui/regal";
import { MAX_REGAL_CM, MIN_REGAL_CM } from "@/lib/deck-economics";
import { SHOW_BAFA } from "@/lib/site-flags";
import { EINSTIEGE, mitRegalwahl, type EinstiegKey } from "@/lib/treppe";

const janein = (v: boolean | null) => (v === null ? "–" : v ? "ja" : "nein");

/** Telegram erwartet HTML – Nutzereingaben dürfen dort kein Markup erzeugen. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const url = (s: unknown): string | null =>
  typeof s === "string" && /^https?:\/\//i.test(s) ? s.slice(0, 600) : null;
const txt = (s: unknown, max: number): string => (typeof s === "string" ? s.slice(0, max) : "");

/** Die Karte kommt vom Client: nur bekannte Felder, gekürzt, Farben geprüft. */
function saubereKarte(k: KarteAuswahl | null | undefined): KarteAuswahl | null {
  if (!k || typeof k !== "object" || !k.entwurf || !k.produkt) return null;
  const e = k.entwurf;
  return {
    entwurf: {
      marke: txt(e.marke, 60),
      ort: txt(e.ort, 40),
      claim: txt(e.claim, 60),
      story: txt(e.story, 480),
      fakten: (Array.isArray(e.fakten) ? e.fakten : [])
        .slice(0, 3)
        .map((f) => ({ wert: txt(f?.wert, 18), text: txt(f?.text, 60) })),
      farben: sichereFarben(e.farben ?? {}),
      logo: url(e.logo),
      hero: url(e.hero),
      web: txt(e.web, 80),
      wer: txt(e.wer, 80),
      zitat: txt(e.zitat, 180),
      zitatVon: txt(e.zitatVon, 60),
    },
    artikel: sauberArtikel(k.artikel),
    produkt: sauberesProdukt(k.produkt),
    weitere: (Array.isArray(k.weitere) ? k.weitere : [])
      .slice(0, 4)
      .filter((w) => w && typeof w === "object" && w.produkt)
      .map((w) => ({ produkt: sauberesProdukt(w.produkt), artikel: sauberArtikel(w.artikel) })),
  };
}

function sauberesProdukt(x: KarteProdukt) {
  return {
    titel: txt(x.titel, 120),
    preis: typeof x.preis === "number" && x.preis > 0 && x.preis < 1000 ? Math.round(x.preis * 100) / 100 : null,
    bild: url(x.bild),
    url: url(x.url),
  };
}

function sauberArtikel(x: ArtikelTexte | null | undefined): ArtikelTexte | null {
  if (!x || typeof x !== "object") return null;
  return {
    head: txt(x.head, 60),
    why: (Array.isArray(x.why) ? x.why : []).slice(0, 3).map((w) => txt(w, 70)),
    know: txt(x.know, 260),
    tip: txt(x.tip, 140),
    chips: (Array.isArray(x.chips) ? x.chips : []).slice(0, 3).map((c) => txt(c, 30)),
    preis: x.preis && typeof x.preis === "object" ? { fair: x.preis.fair !== false, grund: txt(x.preis.grund, 160) } : null,
  };
}

/** Antworten aus dem Assistenten: nur bekannte Felder, Länge begrenzt. */
function sauberAssistent(x: AssistentErgebnis | null | undefined) {
  if (!x || typeof x !== "object") return null;
  const wahl = <T extends string>(v: unknown, erlaubt: readonly T[]) =>
    typeof v === "string" && (erlaubt as readonly string[]).includes(v) ? (v as T) : null;
  return {
    ziele: (Array.isArray(x.ziele) ? x.ziele : []).filter((z) => z in ZIELE),
    start: typeof x.start === "string" && x.start in STARTS ? x.start : null,
    handelsreife: (Array.isArray(x.handelsreife) ? x.handelsreife : []).filter((z) => z in HANDELSREIFE),
    kategorie: wahl(x.kategorie, KATEGORIEN_KANONISCH),
    vertrieb: wahl(x.vertrieb, Object.keys(VERTRIEB)),
    eigentum: wahl(x.eigentum, Object.keys(EIGENTUM)),
    haltung: (Array.isArray(x.haltung) ? x.haltung : []).filter((h) => (HALTUNG_TAGS as readonly string[]).includes(h)),
    besonders: txt(x.besonders, 600),
    cm: typeof x.cm === "number" ? Math.round(x.cm) : null,
    faktor: typeof x.faktor === "number" ? klemmeFaktor(x.faktor) : null,
    faktor_grund: txt(x.faktorGrund, 200),
    schaetzung_monat: typeof x.schaetzungMonat === "number" ? Math.round(x.schaetzungMonat) : null,
    passt: x.passt === true,
    instagram: txt(x.instagram, 60).replace(/[^@A-Za-z0-9_.]/g, ""),
    instagram_freigabe: x.instagramFreigabe === true,
  };
}

export async function submitBewerbung(p: BewerbungPayload): Promise<{ ok: boolean }> {
  // Bot im Honeypot: so tun, als wäre alles gut, aber nichts speichern.
  if (p.firma2) return { ok: true };
  if (Object.keys(pruefeBewerbung(p)).length > 0) return { ok: false };

  const einstieg = p.einstieg as EinstiegKey; // von pruefeBewerbung garantiert
  // Stufe 3 bis 5: Regal inklusive, also keine Zone und keine Breite.
  // Einen besonderen Wert als Preisklasse gibt es nicht mehr (Mischform
  // 2026-10-20): die Spalte bleibt für Altdaten, neue Bewerbungen tragen false.
  const regalwahl = mitRegalwahl(einstieg);
  const zone = regalwahl && p.zone && p.zone in ZONES ? p.zone : null;
  // Online buchbar: Regalplatz S ab 13 cm bis eine Ebene (84 cm).
  const cm = zone && p.cm && p.cm >= MIN_REGAL_CM && p.cm <= MAX_REGAL_CM ? Math.round(p.cm) : null;
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
    besonderer_wert: false,
    begruendung: p.begruendung.trim() || null,
    nachricht: p.nachricht.trim() || null,
  };
  const neu = {
    einstieg,
    stationaer_gelistet: p.stationaerGelistet,
    online_handel: p.onlineHandel,
    beratung_interesse: beratung,
    bundesland,
  };

  const karte = saubereKarte(p.karte);
  const regalkarte = { bildrechte: p.bildrechte === true, karte, assistent: sauberAssistent(p.assistent) };

  const db = getSupabaseAdmin().from("bewerbungen");
  let { error } = await db.insert({ ...basis, ...neu, ...regalkarte });

  // Migration bewerbungen_karte_migration.sql noch nicht gelaufen: ohne Karte
  // speichern, das Wichtigste daraus in die Nachricht.
  if (error?.code === "PGRST204") {
    console.error("bewerbungen: Karte-Spalten fehlen, Fallback:", error.message);
    const kartenText = karte
      ? `Regalkarte: ${karte.produkt.titel}${karte.produkt.preis ? `, ${karte.produkt.preis} €` : ""}, Bildrechte: ${janein(regalkarte.bildrechte)}`
      : regalkarte.bildrechte
        ? "Bildrechte: ja"
        : "";
    basis.nachricht = [kartenText, basis.nachricht].filter(Boolean).join("\n\n") || null;
    ({ error } = await db.insert({ ...basis, ...neu }));
  }

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

  // KI-Anfrage als abgeschickt markieren (Outreach sieht sonst einen Abbrecher).
  if (p.assistent?.anfrageId) await anfrageAbgeschickt(p.assistent.anfrageId, null);

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
      karte
        ? `<b>🪧 Regalkarte:</b> ${esc([karte.produkt, ...(karte.weitere ?? []).map((w) => w.produkt)].map((x) => x.titel).join(" · "))}${karte.produkt.preis ? ` · ${karte.produkt.preis.toFixed(2).replace(".", ",")} €` : ""} · Bildrechte ${janein(regalkarte.bildrechte)}`
        : `<b>Bildrechte:</b> ${janein(regalkarte.bildrechte)}`,
      regalkarte.assistent
        ? `<b>🧭 Assistent:</b> ${regalkarte.assistent.passt ? "passt" : "⚠️ passt laut Regeln nicht"} · Ziel: ${regalkarte.assistent.ziele.map((z) => ZIELE[z as keyof typeof ZIELE].label).join(", ") || "–"} · ${regalkarte.assistent.vertrieb ?? "–"} · Schätzung ${regalkarte.assistent.schaetzung_monat ?? "–"} Stk./Monat${regalkarte.assistent.instagram ? ` · Insta ${esc(regalkarte.assistent.instagram)}${regalkarte.assistent.instagram_freigabe ? " (Repost ok)" : ""}` : ""}`
        : "",
      p.begruendung.trim() ? `\n<b>Was es besonders macht:</b>\n${esc(p.begruendung.trim())}` : "",
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
