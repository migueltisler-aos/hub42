// Marken-Portal: wer ist eingeloggt, und alle Daten genau dieser Marke.
//
// Jede Funktion hier bekommt die brand_id aus requireMarke() – nie aus einem
// Formular oder einer URL. Das ist die Mandantentrennung: der Admin-Client
// umgeht RLS, deshalb filtert JEDE Abfrage selbst auf brand_id bzw. auf die
// EANs dieser Marke.
import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase-admin";
import { getSupabaseMarke } from "./supabase-marke";
import { abgleichWennNoetig } from "./sumup-abgleich";
import {
  aktuellerZeitraum,
  berechneAbrechnung,
  inCent,
  mieteImMonat,
  monatsGrenzen,
  type Abrechnung,
  type ProvisionBasis,
  type VerkaufZeile,
} from "./abrechnung-model";

export const BRAND_COOKIE = "marke_brand";
export const N_FEEDBACK = 5;
export const N_KAEUFER = 10;

export interface MarkeSession {
  userId: string;
  email: string;
  brandId: string;
  brandName: string;
  alle: { brandId: string; brandName: string }[];
}

export interface Konditionen {
  brand_id: string;
  firma: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  rechnungs_email: string | null;
  ansprechpartner: string | null;
  telefon: string | null;
  logistik_kontakt: string | null;
  nachschub_email: string | null;
  ust_idnr: string | null;
  steuernummer: string | null;
  kleinunternehmer: boolean;
  iban: string | null;
  bic: string | null;
  kontoinhaber: string | null;
  gutschrift_zustimmung_am: string | null;
  gutschrift_zustimmung_version: string | null;
  konditionen_bestaetigt_am: string | null;
  provision_pct: number;
  provision_basis: ProvisionBasis;
  miete_netto_monat: number;
  vertragsbeginn: string | null;
  laufzeit_monate: number | null;
  kuendigungsfrist: string | null;
  regal_cm: number | null;
  regal_lage: string | null;
  status: "entwurf" | "eingereicht" | "freigegeben";
  eingereicht_am: string | null;
  freigegeben_am: string | null;
  pruef_notiz: string | null;
}

/** Eingeloggte Marke oder null. Mehrere Marken je Login: Auswahl per Cookie. */
export async function aktuelleMarke(): Promise<MarkeSession | null> {
  const sb = await getSupabaseMarke();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const { data: zeilen, error } = await getSupabaseAdmin()
    .from("brand_nutzer")
    .select("brand_id, pipeline_brands(name)")
    .eq("user_id", user.id);
  if (error) throw error;
  const alle = (zeilen ?? []).map((z) => ({
    brandId: z.brand_id as string,
    brandName: ((z.pipeline_brands as unknown as { name: string } | null)?.name ?? "Marke") as string,
  }));
  if (alle.length === 0) return null;

  const gewuenscht = (await cookies()).get(BRAND_COOKIE)?.value;
  const aktiv = alle.find((a) => a.brandId === gewuenscht) ?? alle[0];
  return { userId: user.id, email: user.email ?? "", brandId: aktiv.brandId, brandName: aktiv.brandName, alle };
}

export async function requireMarke(): Promise<MarkeSession> {
  const m = await aktuelleMarke();
  if (!m) redirect("/marke/login");
  return m;
}

// ── Stammdaten ──────────────────────────────────────────────────────────────

export async function ladeKonditionen(brandId: string): Promise<Konditionen | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("brand_konditionen")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw error;
  return data as Konditionen | null;
}

export interface ArtikelAntrag {
  id: string;
  ean: string;
  artikel_name: string;
  vk_brutto: number;
  mwst_satz: number;
  inhalt: string | null;
  status: "eingereicht" | "freigegeben" | "abgelehnt";
}

export async function ladeArtikelAntraege(brandId: string): Promise<ArtikelAntrag[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("brand_artikel_antrag")
    .select("id, ean, artikel_name, vk_brutto, mwst_satz, inhalt, status")
    .eq("brand_id", brandId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as ArtikelAntrag[];
}

export interface Artikel {
  ean: string;
  artikel_name: string;
  verkaufspreis: number;
  mwst_satz: number | null;
  regal_lage: string | null;
}

/** Artikel im Kassen-Artikelstamm, je EAN die jüngste gültige Zeile. */
export async function ladeArtikel(brandId: string): Promise<Artikel[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("kasse_artikelstamm")
    .select("ean, artikel_name, verkaufspreis, mwst_satz, regal_lage, gueltig_ab")
    .eq("brand_id", brandId)
    .order("gueltig_ab", { ascending: false });
  if (error) throw error;
  const jeEan = new Map<string, Artikel>();
  for (const z of data ?? []) if (!jeEan.has(z.ean)) jeEan.set(z.ean, z as Artikel);
  return [...jeEan.values()].sort((a, b) => a.artikel_name.localeCompare(b.artikel_name, "de"));
}

// ── Verkäufe ────────────────────────────────────────────────────────────────

export interface Verkauf {
  ean: string;
  menge: number;
  einzelpreis: number;
  zeitstempel: string;
  sumup_transaktion_id: string | null;
}

export async function ladeVerkaeufe(brandId: string, vonIso: string, bisIso?: string): Promise<Verkauf[]> {
  let q = getSupabaseAdmin()
    .from("kasse_verkaeufe")
    .select("ean, menge, einzelpreis, zeitstempel, sumup_transaktion_id")
    .eq("brand_id", brandId)
    .gte("zeitstempel", vonIso)
    .order("zeitstempel", { ascending: true })
    .limit(20000);
  if (bisIso) q = q.lt("zeitstempel", bisIso);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Verkauf[];
}

export function alsVerkaufZeilen(verkaeufe: Verkauf[], artikel: Artikel[]): VerkaufZeile[] {
  const a = new Map(artikel.map((x) => [x.ean, x]));
  return verkaeufe.map((v) => ({
    ean: v.ean,
    artikel_name: a.get(v.ean)?.artikel_name ?? v.ean,
    menge: v.menge,
    einzelpreis_brutto: Number(v.einzelpreis),
    mwst_satz: a.get(v.ean)?.mwst_satz ?? null,
  }));
}

/** Offener Vortrag aus dem letzten finalen Monat vor `zeitraum`. */
export async function ladeVortrag(brandId: string, zeitraum: string): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("abrechnungen")
    .select("vortrag_neu_ct")
    .eq("brand_id", brandId)
    .lt("zeitraum", zeitraum)
    .in("status", ["final", "bezahlt"])
    .order("zeitraum", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return Number(data?.vortrag_neu_ct ?? 0);
}

/** Abrechnung für einen Monat – live (laufender Monat) oder als Entwurf. */
export async function rechneMonat(brandId: string, zeitraum: string): Promise<{
  abrechnung: Abrechnung;
  konditionen: Konditionen | null;
}> {
  const { von, bis } = monatsGrenzen(zeitraum);
  const [konditionen, artikel, verkaeufe, vortrag] = await Promise.all([
    ladeKonditionen(brandId),
    ladeArtikel(brandId),
    ladeVerkaeufe(brandId, von, bis),
    ladeVortrag(brandId, zeitraum),
  ]);
  const abrechnung = berechneAbrechnung(
    alsVerkaufZeilen(verkaeufe, artikel),
    {
      provision_pct: Number(konditionen?.provision_pct ?? 7),
      provision_basis: konditionen?.provision_basis ?? "netto",
      kleinunternehmer: konditionen?.kleinunternehmer ?? false,
      miete_netto_ct: mieteImMonat(Number(konditionen?.miete_netto_monat ?? 0), konditionen?.vertragsbeginn ?? null, zeitraum),
    },
    vortrag
  );
  return { abrechnung, konditionen };
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface Kennzahl {
  stueck: number;
  umsatz_ct: number;
}

export interface Dashboard {
  heute: Kennzahl;
  sieben: Kennzahl;
  monat: Kennzahl;
  jeArtikel: { ean: string; name: string; heute: number; sieben: number; monat: number; dreissig: number }[];
  zeitraum: string;
  vorschau: Abrechnung;
  letzterSync: string | null;
}

const berlinTag = (iso: string | Date) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }).slice(0, 10);

export async function ladeDashboard(brandId: string): Promise<Dashboard> {
  const jetzt = new Date();
  const dreissigVorher = new Date(jetzt.getTime() - 31 * 864e5);
  const zeitraum = aktuellerZeitraum(jetzt);
  const monatVon = monatsGrenzen(zeitraum).von;
  const von = monatVon < dreissigVorher.toISOString() ? monatVon : dreissigVorher.toISOString();
  await abgleichWennNoetig();

  const [artikel, verkaeufe, { abrechnung }, sync] = await Promise.all([
    ladeArtikel(brandId),
    ladeVerkaeufe(brandId, von),
    rechneMonat(brandId, zeitraum),
    getSupabaseAdmin().from("sumup_transaktionen").select("aktualisiert_am").order("aktualisiert_am", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const heuteTag = berlinTag(jetzt);
  const siebenTag = berlinTag(new Date(jetzt.getTime() - 6 * 864e5));
  const dreissigTag = berlinTag(new Date(jetzt.getTime() - 29 * 864e5));
  const leer = (): Kennzahl => ({ stueck: 0, umsatz_ct: 0 });
  const heute = leer(), sieben = leer(), monat = leer();
  const jeArtikel = new Map(
    artikel.map((a) => [a.ean, { ean: a.ean, name: a.artikel_name, heute: 0, sieben: 0, monat: 0, dreissig: 0 }])
  );

  for (const v of verkaeufe) {
    const tag = berlinTag(v.zeitstempel);
    const ct = inCent(Number(v.einzelpreis) * v.menge);
    const zeile = jeArtikel.get(v.ean) ?? { ean: v.ean, name: v.ean, heute: 0, sieben: 0, monat: 0, dreissig: 0 };
    jeArtikel.set(v.ean, zeile);
    if (tag === heuteTag) { heute.stueck += v.menge; heute.umsatz_ct += ct; zeile.heute += v.menge; }
    if (tag >= siebenTag) { sieben.stueck += v.menge; sieben.umsatz_ct += ct; zeile.sieben += v.menge; }
    if (tag.slice(0, 7) === zeitraum) { monat.stueck += v.menge; monat.umsatz_ct += ct; zeile.monat += v.menge; }
    if (tag >= dreissigTag) zeile.dreissig += v.menge;
  }

  return {
    heute,
    sieben,
    monat,
    jeArtikel: [...jeArtikel.values()].sort((a, b) => b.dreissig - a.dreissig || a.name.localeCompare(b.name, "de")),
    zeitraum,
    vorschau: abrechnung,
    letzterSync: (sync.data?.aktualisiert_am as string | undefined) ?? null,
  };
}

// ── Bestand und Warenkonto ──────────────────────────────────────────────────

export interface BestandZeile {
  ean: string;
  artikel_name: string;
  bestand: number;
  verkauf_pro_tag: number;
  reichweite_tage: number | null;
  nachbestellung_empfohlen: boolean;
  nachschub_menge: number;
  konto: { geliefert: number; verkauft: number; tasting: number; abschrift: number; korrektur: number };
}

export interface Bewegung {
  erstellt_am: string;
  ean: string;
  artikel_name: string;
  quelle: string;
  menge_delta: number;
  notiz: string | null;
}

/** Nachschub für zwei Wochen Reichweite, aufgerundet. */
const NACHSCHUB_TAGE = 14;

export async function ladeBestand(brandId: string): Promise<{ zeilen: BestandZeile[]; bewegungen: Bewegung[] }> {
  const artikel = await ladeArtikel(brandId);
  const eans = artikel.map((a) => a.ean);
  if (eans.length === 0) return { zeilen: [], bewegungen: [] };
  const db = getSupabaseAdmin();
  const [{ data: reichweite, error: e1 }, { data: bew, error: e2 }] = await Promise.all([
    db.from("bestand_reichweite").select("*").in("ean", eans),
    db
      .from("bestand_bewegungen")
      .select("erstellt_am, ean, quelle, menge_delta, notiz")
      .in("ean", eans)
      .order("erstellt_am", { ascending: false })
      .limit(5000),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const name = new Map(artikel.map((a) => [a.ean, a.artikel_name]));
  const rw = new Map<string, { bestand: number; verkauf_pro_tag: number; nachbestellung_empfohlen: boolean }>();
  for (const r of reichweite ?? []) {
    const alt = rw.get(r.ean);
    rw.set(r.ean, {
      bestand: (alt?.bestand ?? 0) + Number(r.bestand ?? 0),
      verkauf_pro_tag: (alt?.verkauf_pro_tag ?? 0) + Number(r.verkauf_pro_tag ?? 0),
      nachbestellung_empfohlen: (alt?.nachbestellung_empfohlen ?? false) || Boolean(r.nachbestellung_empfohlen),
    });
  }

  const konten = new Map<string, BestandZeile["konto"]>();
  for (const b of bew ?? []) {
    const k = konten.get(b.ean) ?? { geliefert: 0, verkauft: 0, tasting: 0, abschrift: 0, korrektur: 0 };
    const m = Number(b.menge_delta);
    if (b.quelle === "wareneingang") k.geliefert += m;
    else if (b.quelle === "verkauf") k.verkauft += -m;
    else if (b.quelle === "muster_entnahme") k.tasting += -m;
    else if (b.quelle === "abschrift") k.abschrift += -m;
    else k.korrektur += m;
    konten.set(b.ean, k);
  }

  const zeilen: BestandZeile[] = artikel.map((a) => {
    const r = rw.get(a.ean);
    const konto = konten.get(a.ean) ?? { geliefert: 0, verkauft: 0, tasting: 0, abschrift: 0, korrektur: 0 };
    const bestand = r?.bestand ?? konto.geliefert - konto.verkauft - konto.tasting - konto.abschrift + konto.korrektur;
    const vpt = r?.verkauf_pro_tag ?? 0;
    return {
      ean: a.ean,
      artikel_name: a.artikel_name,
      bestand,
      verkauf_pro_tag: vpt,
      reichweite_tage: vpt > 0 ? Math.floor(bestand / vpt) : null,
      nachbestellung_empfohlen: r?.nachbestellung_empfohlen ?? false,
      nachschub_menge: vpt > 0 ? Math.max(0, Math.ceil(vpt * NACHSCHUB_TAGE - bestand)) : 0,
      konto,
    };
  });

  const bewegungen: Bewegung[] = (bew ?? []).slice(0, 200).map((b) => ({
    erstellt_am: b.erstellt_am,
    ean: b.ean,
    artikel_name: name.get(b.ean) ?? b.ean,
    quelle: b.quelle,
    menge_delta: Number(b.menge_delta),
    notiz: b.quelle === "abschrift" || b.quelle === "muster_entnahme" || b.quelle === "korrektur" ? b.notiz : null,
  }));
  return { zeilen, bewegungen };
}

// ── Feedback der Kundinnen ──────────────────────────────────────────────────

export interface FeedbackProdukt {
  id: string;
  name: string;
  n: number;
  hedonik_mittel: number | null;
  verteilung: number[]; // 1..9
  kommentare: { text: string; datum: string }[];
}

export async function ladeFeedback(brandId: string): Promise<FeedbackProdukt[]> {
  const db = getSupabaseAdmin();
  const { data: produkte, error } = await db
    .from("feedback_products")
    .select("id, name")
    .eq("brand_id", brandId)
    .order("name");
  if (error) throw error;
  if (!produkte?.length) return [];

  const ids = produkte.map((p) => p.id);
  const { data: ratings, error: e2 } = await db
    .from("feedback_ratings")
    .select("id, product_id, hedonic, scanned_at")
    .in("product_id", ids)
    .limit(20000);
  if (e2) throw e2;

  const ratingIds = (ratings ?? []).map((r) => r.id);
  const textAntworten: { rating_id: string; value_text: string; created_at: string }[] = [];
  for (let i = 0; i < ratingIds.length; i += 300) {
    const { data, error: e3 } = await db
      .from("feedback_answers")
      .select("rating_id, value_text, created_at")
      .in("rating_id", ratingIds.slice(i, i + 300))
      .not("value_text", "is", null);
    if (e3) throw e3;
    textAntworten.push(...((data ?? []) as typeof textAntworten));
  }
  const produktJeRating = new Map((ratings ?? []).map((r) => [r.id, r.product_id]));

  return produkte.map((p) => {
    const eigene = (ratings ?? []).filter((r) => r.product_id === p.id && r.hedonic != null);
    const n = eigene.length;
    const verteilung = Array.from({ length: 9 }, (_, i) => eigene.filter((r) => r.hedonic === i + 1).length);
    const freigegeben = n >= N_FEEDBACK;
    return {
      id: p.id,
      name: p.name,
      n,
      hedonik_mittel: freigegeben ? eigene.reduce((a, r) => a + Number(r.hedonic), 0) / n : null,
      verteilung: freigegeben ? verteilung : [],
      kommentare: freigegeben
        ? textAntworten
            .filter((t) => produktJeRating.get(t.rating_id) === p.id && t.value_text.trim().length > 2)
            .map((t) => ({ text: t.value_text.trim(), datum: t.created_at }))
            .sort((a, b) => b.datum.localeCompare(a.datum))
            .slice(0, 50)
        : [],
    };
  });
}

// ── Wer und wann kauft ──────────────────────────────────────────────────────

export interface Kaeufer {
  n: number;
  freigegeben: boolean;
  alter: { gruppe: string; anteil: number }[];
  geschlecht: { wert: string; anteil: number }[];
  /** [wochentag 0=Mo][stunde 8..20] Stück */
  heatmap: number[][];
  stunden: number[];
  tage: number;
}

const ALTER_REIHE = ["<20", "20-29", "30-39", "40-49", "50-59", "60+"];

export async function ladeKaeufer(brandId: string, tage = 90): Promise<Kaeufer> {
  const von = new Date(Date.now() - tage * 864e5).toISOString();
  const verkaeufe = await ladeVerkaeufe(brandId, von);

  const stunden = Array.from({ length: 13 }, (_, i) => 8 + i);
  const heatmap = Array.from({ length: 7 }, () => stunden.map(() => 0));
  for (const v of verkaeufe) {
    const lokal = new Date(new Date(v.zeitstempel).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }).replace(" ", "T") + "Z");
    const wt = (lokal.getUTCDay() + 6) % 7;
    const h = Math.min(20, Math.max(8, lokal.getUTCHours()));
    heatmap[wt][h - 8] += v.menge;
  }

  const txIds = [...new Set(verkaeufe.map((v) => v.sumup_transaktion_id).filter(Boolean))] as string[];
  const beob: { geschlecht: string | null; alter_gruppe: string | null }[] = [];
  for (let i = 0; i < txIds.length; i += 300) {
    const { data, error } = await getSupabaseAdmin()
      .from("kasse_beobachtungen")
      .select("geschlecht, alter_gruppe")
      .in("sumup_transaktion_id", txIds.slice(i, i + 300));
    if (error) throw error;
    beob.push(...(data ?? []));
  }
  const n = beob.length;
  const freigegeben = n >= N_KAEUFER;
  const anteil = (k: number, gesamt: number) => (gesamt ? k / gesamt : 0);
  const mitAlter = beob.filter((b) => b.alter_gruppe);
  const mitGeschlecht = beob.filter((b) => b.geschlecht);

  return {
    n,
    freigegeben,
    alter: freigegeben
      ? ALTER_REIHE.map((g) => ({ gruppe: g, anteil: anteil(mitAlter.filter((b) => b.alter_gruppe === g).length, mitAlter.length) }))
      : [],
    geschlecht: freigegeben
      ? [...new Set(mitGeschlecht.map((b) => b.geschlecht!))].map((w) => ({
          wert: w,
          anteil: anteil(mitGeschlecht.filter((b) => b.geschlecht === w).length, mitGeschlecht.length),
        }))
      : [],
    heatmap,
    stunden,
    tage,
  };
}

// ── Vertrag, Regalfoto, Abrechnungen ────────────────────────────────────────

export interface Zusage {
  produkt: string | null;
  klasse: string | null;
  regal_cm: number | null;
  laufzeit_monate: number | null;
  monat_netto: number | null;
  gebucht_am: string | null;
  status: string;
}

export async function ladeVertrag(brandId: string) {
  const db = getSupabaseAdmin();
  const [konditionen, { data: zusagen, error }, { data: foto, error: e2 }] = await Promise.all([
    ladeKonditionen(brandId),
    db
      .from("crm_zusagen")
      .select("produkt, klasse, regal_cm, laufzeit_monate, monat_netto, gebucht_am, status")
      .eq("brand_id", brandId)
      .in("status", ["gebucht", "live"])
      .order("gebucht_am", { ascending: false }),
    db
      .from("brand_regalfotos")
      .select("pfad, aufgenommen_am")
      .eq("brand_id", brandId)
      .order("aufgenommen_am", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (e2) throw e2;
  let fotoUrl: string | null = null;
  if (foto?.pfad) {
    const { data } = await db.storage.from("marken").createSignedUrl(foto.pfad, 60 * 30);
    fotoUrl = data?.signedUrl ?? null;
  }
  return {
    konditionen,
    zusagen: (zusagen ?? []) as Zusage[],
    foto: foto ? { url: fotoUrl, aufgenommen_am: foto.aufgenommen_am as string } : null,
  };
}

export interface AbrechnungZeile {
  id: string;
  zeitraum: string;
  status: "entwurf" | "final" | "bezahlt";
  gs_nr: string | null;
  rg_nr: string | null;
  umsatz_brutto_ct: number;
  gs_brutto_ct: number;
  rg_brutto_ct: number;
  auszahlung_ct: number;
  vortrag_neu_ct: number;
  gs_pdf_pfad: string | null;
  rg_pdf_pfad: string | null;
  bezahlt_am: string | null;
}

/** Für die Marke nur finale und bezahlte Abrechnungen. */
export async function ladeAbrechnungen(brandId: string): Promise<AbrechnungZeile[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("abrechnungen")
    .select("id, zeitraum, status, gs_nr, rg_nr, umsatz_brutto_ct, gs_brutto_ct, rg_brutto_ct, auszahlung_ct, vortrag_neu_ct, gs_pdf_pfad, rg_pdf_pfad, bezahlt_am")
    .eq("brand_id", brandId)
    .in("status", ["final", "bezahlt"])
    .order("zeitraum", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    umsatz_brutto_ct: Number(d.umsatz_brutto_ct),
    gs_brutto_ct: Number(d.gs_brutto_ct),
    rg_brutto_ct: Number(d.rg_brutto_ct),
    auszahlung_ct: Number(d.auszahlung_ct),
    vortrag_neu_ct: Number(d.vortrag_neu_ct),
  })) as AbrechnungZeile[];
}
