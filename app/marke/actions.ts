"use server";

import { SPIELREGELN_VERSION, VERKAUFSTEAM_FRAGEN } from "@/lib/spielregeln";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseMarke } from "@/lib/supabase-marke";
import { BRAND_COOKIE, ladeKonditionen, requireMarke } from "@/lib/marke";
import {
  eanGueltig,
  GUTSCHRIFT_ZUSTIMMUNG_VERSION,
  ibanGueltig,
  ustIdPlausibel,
} from "@/lib/abrechnung-model";
import { teamBenachrichtigen } from "@/lib/marke-benachrichtigung";
import { artikelFreigeben } from "@/lib/marken-admin";

export interface FormStatus {
  ok: boolean;
  meldung: string;
  felder?: Record<string, string>;
  /** Eingaben zurück an das Formular, damit sie nach einem Fehler stehen bleiben. */
  werte?: Record<string, string | boolean>;
  stamp: number;
}

const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

// ── Login ───────────────────────────────────────────────────────────────────

async function herkunft() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function loginAnfordern(_prev: FormStatus | null, fd: FormData): Promise<FormStatus> {
  const email = s(fd, "email")?.toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, meldung: "Bitte eine gültige E-Mail-Adresse eingeben.", stamp: Date.now() };
  }
  const sb = await getSupabaseMarke();
  // shouldCreateUser: false – nur eingeladene Adressen bekommen einen Link.
  await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${await herkunft()}/marke/auth/confirm` },
  });
  // Immer dieselbe Antwort, damit niemand ausprobieren kann, welche Adressen es gibt.
  return {
    ok: true,
    meldung: "Wenn die Adresse bei uns hinterlegt ist, kommt in wenigen Minuten ein Login-Link. Bitte auch im Spam-Ordner nachsehen.",
    stamp: Date.now(),
  };
}

export async function markeWaehlen(fd: FormData) {
  const m = await requireMarke();
  const id = s(fd, "brand_id");
  if (id && m.alle.some((a) => a.brandId === id)) {
    (await cookies()).set(BRAND_COOKIE, id, { path: "/marke", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  }
  revalidatePath("/marke", "layout");
}

// ── Stammdaten ──────────────────────────────────────────────────────────────

export async function stammdatenSpeichern(_prev: FormStatus | null, fd: FormData): Promise<FormStatus> {
  const m = await requireMarke();
  const einreichen = fd.get("aktion") === "einreichen";
  const alt = await ladeKonditionen(m.brandId);
  const felder: Record<string, string> = {};

  const iban = s(fd, "iban")?.replace(/\s+/g, "").toUpperCase() ?? null;
  const ust = s(fd, "ust_idnr")?.replace(/\s+/g, "").toUpperCase() ?? null;
  const zustimmung = fd.get("gutschrift_zustimmung") === "on";
  const regeln = fd.get("spielregeln_zustimmung") === "on";
  const tasting = s(fd, "vt_tasting");
  const verkaufsteam: Record<string, string | boolean | null> = {
    tasting: tasting === "ja" ? true : tasting === "nein" ? false : null,
    ...Object.fromEntries(VERKAUFSTEAM_FRAGEN.map((q) => [q.key, s(fd, `vt_${q.key}`)])),
  };

  if (iban && !ibanGueltig(iban)) felder.iban = "Die IBAN stimmt nicht, bitte die Prüfziffer kontrollieren.";
  if (ust && !ustIdPlausibel(ust)) felder.ust_idnr = "Eine deutsche USt-IdNr. hat die Form DE123456789.";

  const daten = {
    brand_id: m.brandId,
    firma: s(fd, "firma"),
    strasse: s(fd, "strasse"),
    plz: s(fd, "plz"),
    ort: s(fd, "ort"),
    land: s(fd, "land") ?? "DE",
    rechnungs_email: s(fd, "rechnungs_email"),
    ansprechpartner: s(fd, "ansprechpartner"),
    telefon: s(fd, "telefon"),
    logistik_kontakt: s(fd, "logistik_kontakt"),
    nachschub_email: s(fd, "nachschub_email"),
    ust_idnr: ust,
    steuernummer: s(fd, "steuernummer"),
    iban,
    bic: s(fd, "bic")?.toUpperCase() ?? null,
    kontoinhaber: s(fd, "kontoinhaber"),
    gutschrift_zustimmung_am: zustimmung ? alt?.gutschrift_zustimmung_am ?? new Date().toISOString() : null,
    gutschrift_zustimmung_version: zustimmung ? alt?.gutschrift_zustimmung_version ?? GUTSCHRIFT_ZUSTIMMUNG_VERSION : null,
    // Neue Fassung der Spielregeln = neue Zustimmung, sonst bleibt das erste Datum
    spielregeln_angenommen_am: regeln
      ? alt?.spielregeln_version === SPIELREGELN_VERSION ? alt.spielregeln_angenommen_am ?? new Date().toISOString() : new Date().toISOString()
      : null,
    spielregeln_version: regeln ? SPIELREGELN_VERSION : null,
    verkaufsteam,
    updated_at: new Date().toISOString(),
  };

  if (einreichen || alt?.status === "freigegeben") {
    const pflicht: [keyof typeof daten, string][] = [
      ["firma", "Firma fehlt."],
      ["strasse", "Straße fehlt."],
      ["plz", "PLZ fehlt."],
      ["ort", "Ort fehlt."],
      ["rechnungs_email", "E-Mail für Abrechnungen fehlt."],
      ["iban", "IBAN fehlt."],
      ["kontoinhaber", "Kontoinhaber fehlt."],
    ];
    for (const [k, t] of pflicht) if (!daten[k] && !felder[k]) felder[k] = t;
    if (!ust && !daten.steuernummer) felder.steuernummer = "USt-IdNr. oder Steuernummer angeben, eins von beiden ist Pflicht.";
    if (!zustimmung) felder.gutschrift_zustimmung = "Ohne Zustimmung können wir keine Gutschrift ausstellen.";
    if (!regeln) felder.spielregeln_zustimmung = "Bitte die Spielregeln lesen und annehmen.";
    // Artikel kommen nach den Stammdaten (eigener Schritt), deshalb hier keine Pflicht mehr.
  }

  if (Object.keys(felder).length) {
    const werte: Record<string, string | boolean> = {
      gutschrift_zustimmung: zustimmung,
      spielregeln_zustimmung: regeln,
    };
    for (const [k, v] of fd.entries()) if (typeof v === "string" && !(k in werte) && !k.startsWith("$")) werte[k] = v;
    return { ok: false, meldung: "Bitte die markierten Felder prüfen.", felder, werte, stamp: Date.now() };
  }

  // Ohne Freigabe: Einreichen macht die Stammdaten sofort gültig. Danach ist jedes Speichern ein Einreichen.
  const status = einreichen || alt?.status === "freigegeben" || alt?.status === "eingereicht" ? "freigegeben" : "entwurf";
  // Einzige Kontrolle: eine nachträglich geänderte IBAN (Schutz vor gekapertem Login)
  const ibanNeu = Boolean(alt?.iban && iban && alt.iban !== iban && alt.status !== "entwurf");
  const jetzt = new Date().toISOString();
  const { error } = await getSupabaseAdmin()
    .from("brand_konditionen")
    .upsert(
      {
        ...daten,
        status,
        eingereicht_am: status === "freigegeben" ? alt?.eingereicht_am ?? jetzt : null,
        ...(status === "freigegeben" && alt?.status !== "freigegeben" ? { freigegeben_von: "Marke", freigegeben_am: jetzt } : {}),
        ...(ibanNeu ? { iban_geaendert_am: jetzt } : {}),
        // Unser Prüfhinweis hat sich mit dem Speichern erledigt
        ...(status === "freigegeben" ? { pruef_notiz: null } : {}),
      },
      { onConflict: "brand_id" }
    );
  if (error) return { ok: false, meldung: `Nicht gespeichert: ${error.message}`, stamp: Date.now() };

  if (ibanNeu) {
    await teamBenachrichtigen(`Marken-Portal: ${m.brandName} hat die IBAN geändert. Vor der nächsten Auszahlung bitte prüfen.`);
  } else if (status === "freigegeben" && alt?.status !== "freigegeben") {
    await teamBenachrichtigen(`Marken-Portal: ${m.brandName} hat die Stammdaten eingetragen.`);
  }
  revalidatePath("/marke", "layout");
  return {
    ok: true,
    meldung: status === "freigegeben" ? "Gespeichert." : "Zwischengespeichert.",
    stamp: Date.now(),
  };
}

// ── Artikel ─────────────────────────────────────────────────────────────────

export async function artikelHinzufuegen(_prev: FormStatus | null, fd: FormData): Promise<FormStatus> {
  const m = await requireMarke();
  const felder: Record<string, string> = {};
  // Artikel im Regal: Schlüssel bleibt fest (EAN oder TK-Nummer), die Änderung geht als Antrag in die Prüfung
  const regalEan = s(fd, "regal_ean");
  const antragId = s(fd, "antrag_id");
  const ean = regalEan ?? s(fd, "ean")?.replace(/\s+/g, "") ?? "";
  const name = s(fd, "artikel_name");
  // "5,99 €", "5.99", " 5,99" – Währung und Leerzeichen weg, Komma als Dezimalzeichen
  const vk = Number(String(fd.get("vk_brutto") ?? "").replace(/[€\s]/g, "").replace(",", "."));
  const satz = Number(fd.get("mwst_satz"));

  if (ean && !regalEan && !eanGueltig(ean)) felder.ean = "Die EAN stimmt nicht: 8 oder 13 Ziffern, die letzte ist eine Prüfziffer. Bitte vom Barcode abschreiben.";
  if (!name) felder.artikel_name = "Name fehlt.";
  if (!(vk > 0) || vk > 10000) felder.vk_brutto = "Verkaufspreis in Euro, z. B. 5,99.";
  if (![0, 7, 19].includes(satz)) felder.mwst_satz = "MwSt-Satz wählen.";
  const bild = fd.get("bild");
  const hatBild = bild instanceof File && bild.size > 0;
  if (hatBild && (!bild.type.startsWith("image/") || bild.size > 4 * 1024 * 1024)) {
    felder.bild = "Bitte ein Bild (JPG, PNG, WebP) bis 4 MB.";
  }
  if (Object.keys(felder).length) return { ok: false, meldung: "Artikel nicht gespeichert.", felder, stamp: Date.now() };

  let bild_pfad: string | null = null;
  if (hatBild) {
    const endung = (bild.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    bild_pfad = `produktbilder/${m.brandId}/${Date.now()}.${endung}`;
    const up = await getSupabaseAdmin().storage.from("marken").upload(bild_pfad, bild, { contentType: bild.type });
    if (up.error) return { ok: false, meldung: `Bild nicht gespeichert: ${up.error.message}`, stamp: Date.now() };
  }

  const zeile = {
    brand_id: m.brandId,
    // Ohne EAN: NULL, die Freigabe vergibt dann eine interne Nummer
    ean: ean || null,
    ...(bild_pfad ? { bild_pfad } : {}),
    artikel_name: name,
    vk_brutto: Math.round(vk * 100) / 100,
    mwst_satz: satz,
    inhalt: s(fd, "inhalt"),
    status: "eingereicht",
    entschieden_am: null,
  };
  // Bestehender Antrag (Vorschlag, eingereicht, abgelehnt): genau diese Zeile ändern, nur eigene, nie freigegebene
  const db = getSupabaseAdmin();
  const { data: gespeichert, error } = antragId
    ? await db.from("brand_artikel_antrag").update(zeile).eq("id", antragId).eq("brand_id", m.brandId).neq("status", "freigegeben").select("id").single()
    : await db.from("brand_artikel_antrag").upsert({ ...zeile, ...(regalEan ? { quelle: "aenderung" } : {}) }, { onConflict: "brand_id,ean" }).select("id").single();
  if (error || !gespeichert) return { ok: false, meldung: `Nicht gespeichert: ${error?.message ?? "Artikel nicht gefunden"}`, stamp: Date.now() };

  // Ohne Freigabe: direkt in den Kassenstamm. Was in SumUp zu tun ist, landet auf der Team-Liste.
  const k = await ladeKonditionen(m.brandId);
  try {
    const { hinweis } = await artikelFreigeben({ antragId: gespeichert.id, brandId: m.brandId, kassenName: name!, regalLage: k?.regal_lage ?? null });
    if (hinweis) await teamBenachrichtigen(`SumUp: ${m.brandName} – ${hinweis}`);
  } catch (e) {
    return { ok: false, meldung: `Gespeichert, aber nicht in die Kasse übernommen: ${e instanceof Error ? e.message : e}`, stamp: Date.now() };
  }
  revalidatePath("/marke/artikel");
  return { ok: true, meldung: `${name} gespeichert, gilt ab sofort.`, stamp: Date.now() };
}

export async function artikelEntfernen(fd: FormData) {
  const m = await requireMarke();
  const id = s(fd, "id");
  if (!id) return;
  // Nur eigene, noch nicht freigegebene Anträge
  await getSupabaseAdmin()
    .from("brand_artikel_antrag")
    .delete()
    .eq("id", id)
    .eq("brand_id", m.brandId)
    .neq("status", "freigegeben");
  revalidatePath("/marke/artikel");
}
