"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  artikelAblehnen,
  artikelFreigeben,
  konditionenSetzen,
  mwstSetzen,
  regalfotoHochladen,
  stammdatenEntscheiden,
  sumupErledigt,
  zugangEinladen,
  zugangEntziehen,
} from "@/lib/marken-admin";

const t = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const wer = async () => (await cookies()).get("pipeline_user")?.value ?? "Team";
const zurueck = (brandId: string, meldung: string): never => {
  revalidatePath(`/admin/marken/${brandId}`);
  redirect(`/admin/marken/${brandId}?m=${encodeURIComponent(meldung)}`);
};

async function siteUrl() {
  if (process.env.MARKEN_PORTAL_URL) return process.env.MARKEN_PORTAL_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

export async function einladen(fd: FormData) {
  const brandId = t(fd, "brand_id");
  const email = t(fd, "email");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) zurueck(brandId, "Keine gültige E-Mail-Adresse.");
  const r = await zugangEinladen({ brandId, email, kontaktId: t(fd, "kontakt_id") || null, von: await wer(), siteUrl: await siteUrl() });
  zurueck(
    brandId,
    r.mailFehler
      ? `Zugang angelegt, aber die Login-Mail ging nicht raus: ${r.mailFehler}`
      : `Zugang für ${email} angelegt, Login-Link ist unterwegs.`
  );
}

export async function entziehen(fd: FormData) {
  const brandId = t(fd, "brand_id");
  await zugangEntziehen(brandId, t(fd, "user_id"));
  zurueck(brandId, "Zugang entzogen.");
}

export async function konditionenSpeichern(fd: FormData) {
  const brandId = t(fd, "brand_id");
  const zahl = (k: string) => {
    const n = Number(t(fd, k).replace(",", "."));
    return t(fd, k) === "" || !Number.isFinite(n) ? null : n;
  };
  const basis = t(fd, "provision_basis") === "brutto" ? "brutto" : "netto";
  await konditionenSetzen(brandId, {
    provision_pct: zahl("provision_pct") ?? 7,
    provision_basis: basis,
    miete_netto_monat: zahl("miete_netto_monat") ?? 0,
    vertragsbeginn: t(fd, "vertragsbeginn") || null,
    laufzeit_monate: zahl("laufzeit_monate"),
    kuendigungsfrist: t(fd, "kuendigungsfrist") || null,
    regal_cm: zahl("regal_cm"),
    regal_lage: t(fd, "regal_lage") || null,
  });
  zurueck(brandId, "Konditionen gespeichert.");
}

export async function stammdatenFreigeben(fd: FormData) {
  const brandId = t(fd, "brand_id");
  await stammdatenEntscheiden(brandId, true, await wer(), null);
  zurueck(brandId, "Stammdaten freigegeben.");
}

export async function stammdatenZurueck(fd: FormData) {
  const brandId = t(fd, "brand_id");
  const notiz = t(fd, "pruef_notiz");
  if (!notiz) zurueck(brandId, "Bitte schreiben, was die Marke ändern soll.");
  await stammdatenEntscheiden(brandId, false, await wer(), notiz);
  zurueck(brandId, "Zurück an die Marke, mit Hinweis.");
}

export async function artikelEntscheiden(fd: FormData) {
  const brandId = t(fd, "brand_id");
  const id = t(fd, "antrag_id");
  if (t(fd, "entscheidung") === "ablehnen") {
    await artikelAblehnen(id, brandId);
    zurueck(brandId, "Artikel abgelehnt.");
  }
  await artikelFreigeben({ antragId: id, brandId, kassenName: t(fd, "kassen_name"), regalLage: t(fd, "regal_lage") || null });
  zurueck(brandId, "Artikel ist im Kassen-Artikelstamm.");
}

export async function satzSetzen(fd: FormData) {
  const brandId = t(fd, "brand_id");
  const satz = Number(t(fd, "mwst_satz"));
  if (![0, 7, 19].includes(satz)) zurueck(brandId, "MwSt-Satz wählen.");
  await mwstSetzen(t(fd, "artikel_id"), brandId, satz);
  zurueck(brandId, "MwSt-Satz gespeichert.");
}

export async function fotoHochladen(fd: FormData) {
  const brandId = t(fd, "brand_id");
  const datei = fd.get("foto");
  if (!(datei instanceof File) || datei.size === 0) zurueck(brandId, "Kein Foto ausgewählt.");
  const f = datei as File;
  if (!f.type.startsWith("image/") || f.size > 4 * 1024 * 1024) zurueck(brandId, "Nur Bilder bis 4 MB (Vercel-Grenze). Am Handy ggf. kleinere Auflösung wählen.");
  await regalfotoHochladen(brandId, f, await wer());
  zurueck(brandId, "Regalfoto hochgeladen, die Marke sieht es sofort.");
}

export async function sumupErledigtAktion(fd: FormData) {
  const id = t(fd, "artikel_id");
  const zurueckZu = t(fd, "zurueck");
  await sumupErledigt(id);
  revalidatePath("/admin/marken");
  if (zurueckZu.startsWith("/admin/marken")) redirect(zurueckZu);
}

export async function ibanGeprueft(fd: FormData) {
  const brandId = t(fd, "brand_id");
  await konditionenSetzen(brandId, { iban_geaendert_am: null });
  zurueck(brandId, "IBAN als geprüft markiert.");
}
