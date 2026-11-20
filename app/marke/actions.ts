"use server";

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
    updated_at: new Date().toISOString(),
  };

  if (einreichen) {
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
    const { count } = await getSupabaseAdmin()
      .from("brand_artikel_antrag")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", m.brandId)
      .in("status", ["eingereicht", "freigegeben"]);
    const { count: imStamm } = await getSupabaseAdmin()
      .from("kasse_artikelstamm")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", m.brandId);
    if (!count && !imStamm) felder.artikel = "Bitte mindestens einen Artikel eintragen.";
  }

  if (Object.keys(felder).length) {
    const werte: Record<string, string | boolean> = {
      gutschrift_zustimmung: zustimmung,
    };
    for (const [k, v] of fd.entries()) if (typeof v === "string" && !(k in werte) && !k.startsWith("$")) werte[k] = v;
    return { ok: false, meldung: "Bitte die markierten Felder prüfen.", felder, werte, stamp: Date.now() };
  }

  // Jede Änderung nach der Freigabe geht erneut in die Prüfung (IBAN, Steuerdaten).
  const status = einreichen || alt?.status === "freigegeben" || alt?.status === "eingereicht" ? "eingereicht" : "entwurf";
  const { error } = await getSupabaseAdmin()
    .from("brand_konditionen")
    .upsert(
      { ...daten, status, eingereicht_am: status === "eingereicht" ? new Date().toISOString() : alt?.eingereicht_am ?? null },
      { onConflict: "brand_id" }
    );
  if (error) return { ok: false, meldung: `Nicht gespeichert: ${error.message}`, stamp: Date.now() };

  if (status === "eingereicht") {
    await teamBenachrichtigen(
      alt?.status === "freigegeben"
        ? `Marken-Portal: ${m.brandName} hat Stammdaten geändert, bitte prüfen.`
        : `Marken-Portal: ${m.brandName} hat das Onboarding eingereicht.`
    );
  }
  revalidatePath("/marke", "layout");
  return {
    ok: true,
    meldung: status === "eingereicht" ? "Eingereicht. Wir prüfen die Angaben und melden uns." : "Zwischengespeichert.",
    stamp: Date.now(),
  };
}

// ── Artikel ─────────────────────────────────────────────────────────────────

export async function artikelHinzufuegen(_prev: FormStatus | null, fd: FormData): Promise<FormStatus> {
  const m = await requireMarke();
  const felder: Record<string, string> = {};
  const ean = s(fd, "ean")?.replace(/\s+/g, "") ?? "";
  const name = s(fd, "artikel_name");
  // "5,99 €", "5.99", " 5,99" – Währung und Leerzeichen weg, Komma als Dezimalzeichen
  const vk = Number(String(fd.get("vk_brutto") ?? "").replace(/[€\s]/g, "").replace(",", "."));
  const satz = Number(fd.get("mwst_satz"));

  if (ean && !eanGueltig(ean)) felder.ean = "Die EAN stimmt nicht: 8 oder 13 Ziffern, die letzte ist eine Prüfziffer. Bitte vom Barcode abschreiben.";
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
  // Von uns vorbereiteter Vorschlag: genau diese Zeile übernehmen, nur eigene, nur im Status "vorschlag"
  const vorschlagId = s(fd, "vorschlag_id");
  const { error } = vorschlagId
    ? await getSupabaseAdmin().from("brand_artikel_antrag").update(zeile).eq("id", vorschlagId).eq("brand_id", m.brandId).eq("status", "vorschlag")
    : await getSupabaseAdmin().from("brand_artikel_antrag").upsert(zeile, { onConflict: "brand_id,ean" });
  if (error) return { ok: false, meldung: `Nicht gespeichert: ${error.message}`, stamp: Date.now() };
  revalidatePath("/marke/artikel");
  return { ok: true, meldung: vorschlagId ? `${name} übernommen, wir prüfen ihn.` : `${name} eingetragen.`, stamp: Date.now() };
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
