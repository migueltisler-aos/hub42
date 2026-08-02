import { getSupabaseClient } from "./supabase";
import { SLOTS } from "./slots";
import { MIN_SLOT_MIETE } from "./deck-economics";

/* ============================================================
   Hub42 Angebots-CRM – Datenmodell + Berechnung
   Angebote hängen an einer Pipeline-Brand (brand_id) und bestehen
   aus Positionen (Slot-Tarife, Add-ons, freie Zeilen) sowie einer
   Deliverables-Checkliste ("was ich von dir brauche").
   ============================================================ */

export const MWST_PCT = 19;

/* ── Flächenpreis ─────────────────────────────────────────────────
   Miete = belegte Fläche (m²) × Preis/m² – mit Mindestmiete.
   Fläche je Ebene = Breite (cm) × Regaltiefe (60 cm).
   PREIS_PRO_QM ist die EINE Stellschraube für den m²-Preis. */
export const PREIS_PRO_QM = 4.64; // €/m²/Monat
export const REGAL_TIEFE_CM = 60;
export const MINDESTMIETE_MONAT = 59; // €/Monat
export const MINDESTLAUFZEIT_MONATE = 3; // anpassbar je Angebot
export const KUENDIGUNG_VORLAUF_MONATE = 1;

/** Eine gemietete Regalebene: Name/Höhe + Breite in cm. */
export interface Ebene {
  name: string;
  cm: number;
}

/** Fläche einer Ebene in m² (Breite × 60 cm Tiefe). */
export function ebeneM2(e: Ebene): number {
  return (Math.max(0, e.cm) * REGAL_TIEFE_CM) / 10_000;
}

/** Gesamte belegte Fläche aller Ebenen in m². */
export function flaecheM2(ebenen: Ebene[]): number {
  return ebenen.reduce((s, e) => s + ebeneM2(e), 0);
}

/** Gesamte Regalbreite in cm (Summe aller Ebenen). */
export function gesamtBreiteCm(ebenen: Ebene[]): number {
  return ebenen.reduce((s, e) => s + Math.max(0, e.cm), 0);
}

/** Monatliche Flächenmiete: max(Mindestmiete, Fläche × Preis/m²). 0 ohne Fläche. */
export function flaechenMieteMonat(ebenen: Ebene[]): number {
  const m2 = flaecheM2(ebenen);
  if (m2 <= 0) return 0;
  return Math.max(MINDESTMIETE_MONAT, Math.round(m2 * PREIS_PRO_QM * 100) / 100);
}

// ── Alt-Lagerfläche (Bestückung/Nachschub – nur intern) ──────────
export const LAGER_TIEFE_CM = REGAL_TIEFE_CM;
export function regalflaecheCm2(breiteCm: number): number {
  return Math.max(0, breiteCm) * LAGER_TIEFE_CM;
}
export function lagerGesamtCm2(breiteCm: number): number {
  return regalflaecheCm2(breiteCm) * 2;
}

/** Anzahl Tasting-Muster = aufgerundete % der Bestückung. */
export function tastingMenge(maxArtikel: number, pct: number): number {
  return Math.ceil((Math.max(0, maxArtikel) * Math.max(0, pct)) / 100);
}

/** cm² → m², auf 2 Nachkommastellen. */
export function cm2ToM2(cm2: number): number {
  return Math.round((cm2 / 10_000) * 100) / 100;
}

export type AngebotStatus =
  | "Entwurf"
  | "Versendet"
  | "Angenommen"
  | "Abgelehnt"
  | "Abgelaufen";

export const ANGEBOT_STATUSES: AngebotStatus[] = [
  "Entwurf",
  "Versendet",
  "Angenommen",
  "Abgelehnt",
  "Abgelaufen",
];

export type PositionTyp = "slot" | "addon" | "frei";

export interface Position {
  typ: PositionTyp;
  label: string;
  /** Anzahl Einheiten (bei Slots/Add-ons i.d.R. 1, bei freien Zeilen frei) */
  menge: number;
  /** Anzeige-Einheit: "Monat", "Stk", "pauschal" … */
  einheit: string;
  /** Netto-Einzelpreis pro Monat (bzw. pro Einheit bei einmalig) */
  einzelpreisMonat: number;
  /** true = einmalige Position (nicht × Laufzeit), z.B. Setup-Gebühr */
  einmalig?: boolean;
}

export interface Deliverable {
  label: string;
  status: "offen" | "erhalten";
  notiz?: string;
}

export interface Angebot {
  id: string;
  angebot_nr: string;
  brand_id: string | null;
  empfaenger_name: string | null;
  ansprechpartner: string | null;
  titel: string | null;
  status: AngebotStatus;
  laufzeit_monate: number;
  start_datum: string | null;
  gueltig_bis: string | null;
  tasting: boolean;
  tasting_pct: number;
  gemietete_breite_cm: number | null;
  max_artikel: number | null;
  nachschub_email: string | null;
  ebenen: Ebene[];
  positionen: Position[];
  deliverables: Deliverable[];
  notiz: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export type AngebotInput = Omit<Angebot, "id" | "created_at" | "updated_at">;

/* ── Standard-Deliverables ("was ich von dir brauche") ─────────── */
export const DEFAULT_DELIVERABLES: string[] = [
  "Logo (vektorisiert, SVG/EPS)",
  "Produktbilder (freigestellt, hochauflösend)",
  "Founder-Story / Markentext (für QR-Landingpage)",
  "Produktmuster für Regal & Tasting",
  "Preisliste / UVP je Artikel",
  "EAN / Barcode je Artikel",
  "Lieferadresse & Ansprechpartner Logistik",
];

export function defaultDeliverables(): Deliverable[] {
  return DEFAULT_DELIVERABLES.map((label) => ({ label, status: "offen" }));
}

/* ── Preise: Add-ons (aus Pro-Analytics-Modell) ───────────────── */
export interface AddonOption {
  id: string;
  label: string;
  preisMonat: number;
}

export const ADDONS: AddonOption[] = [
  { id: "pro-analytics", label: "Pro Analytics", preisMonat: 49 },
  { id: "brand-report", label: "Brand Report (PDF)", preisMonat: 29 },
];

/**
 * Baut eine Slot-Position. Für €/cm-Slots gilt die Mindestmiete
 * (MIN_SLOT_MIETE) pro Slot – identisch zur /deck-Logik.
 */
export function slotPosition(slotId: string, regalCm: number): Position | null {
  const slot = SLOTS.find((s) => s.id === slotId);
  if (!slot) return null;

  if (slot.kostenMonat != null) {
    // Fixpreis-Slot (Schaufenster / Ladenfront)
    return {
      typ: "slot",
      label: `${slot.name} – ${slot.position}`,
      menge: 1,
      einheit: "Monat",
      einzelpreisMonat: slot.kostenMonat,
    };
  }

  if (slot.ratePerCm != null) {
    const cm = Math.max(1, Math.round(regalCm));
    const monatlich = Math.max(MIN_SLOT_MIETE, cm * slot.ratePerCm);
    return {
      typ: "slot",
      label: `${slot.name}-Slot · ${cm} cm Regalfront (${slot.ratePerCm.toFixed(2)} €/cm)`,
      menge: 1,
      einheit: "Monat",
      einzelpreisMonat: Math.round(monatlich * 100) / 100,
    };
  }

  return null;
}

export function addonPosition(addonId: string): Position | null {
  const a = ADDONS.find((x) => x.id === addonId);
  if (!a) return null;
  return {
    typ: "addon",
    label: a.label,
    menge: 1,
    einheit: "Monat",
    einzelpreisMonat: a.preisMonat,
  };
}

/* ── Summen-Berechnung ─────────────────────────────────────────── */
export interface AngebotSummary {
  flaechenMonat: number; // Flächenmiete / Monat
  positionenMonat: number; // laufende Zusatzleistungen / Monat
  monatlichNetto: number; // Fläche + laufende Positionen / Monat
  einmaligNetto: number; // Summe der einmaligen Positionen
  gesamtNetto: number; // monatlich × Laufzeit + einmalig
  mwst: number;
  gesamtBrutto: number;
}

export function positionMonatlich(p: Position): number {
  return p.einmalig ? 0 : p.menge * p.einzelpreisMonat;
}

export function positionEinmalig(p: Position): number {
  return p.einmalig ? p.menge * p.einzelpreisMonat : 0;
}

export function computeAngebot(
  positionen: Position[],
  laufzeitMonate: number,
  ebenen: Ebene[] = []
): AngebotSummary {
  const flaechenMonat = flaechenMieteMonat(ebenen);
  const positionenMonat = positionen.reduce((s, p) => s + positionMonatlich(p), 0);
  const monatlichNetto = flaechenMonat + positionenMonat;
  const einmaligNetto = positionen.reduce((s, p) => s + positionEinmalig(p), 0);
  const gesamtNetto = monatlichNetto * Math.max(0, laufzeitMonate) + einmaligNetto;
  const mwst = gesamtNetto * (MWST_PCT / 100);
  return {
    flaechenMonat,
    positionenMonat,
    monatlichNetto,
    einmaligNetto,
    gesamtNetto,
    mwst,
    gesamtBrutto: gesamtNetto + mwst,
  };
}

export function formatEUR(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ── CRUD ──────────────────────────────────────────────────────── */

export async function getAngebote(): Promise<Angebot[]> {
  const { data, error } = await getSupabaseClient()
    .from("pipeline_angebote")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Angebot[];
}

export async function getAngebot(id: string): Promise<Angebot | null> {
  const { data, error } = await getSupabaseClient()
    .from("pipeline_angebote")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Angebot;
}

export async function getAngeboteForBrand(brandId: string): Promise<Angebot[]> {
  const { data, error } = await getSupabaseClient()
    .from("pipeline_angebote")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Angebot[];
}

/** Fortlaufende Angebotsnummer pro Jahr: AG-2026-001 */
export async function generateAngebotNr(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await getSupabaseClient()
    .from("pipeline_angebote")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  return `AG-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function upsertAngebot(
  id: string | null,
  input: Partial<AngebotInput>
): Promise<Angebot> {
  const sb = getSupabaseClient();
  if (id) {
    const { data, error } = await sb
      .from("pipeline_angebote")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Angebot;
  } else {
    const angebot_nr = input.angebot_nr ?? (await generateAngebotNr());
    const { data, error } = await sb
      .from("pipeline_angebote")
      .insert({ ...input, angebot_nr })
      .select()
      .single();
    if (error) throw error;
    return data as Angebot;
  }
}

export async function updateAngebotStatus(
  id: string,
  status: AngebotStatus
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("pipeline_angebote")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

/** FormData → AngebotInput (Positionen/Deliverables kommen als JSON-Strings). */
export function parseAngebotForm(formData: FormData): Partial<AngebotInput> {
  let positionen: Position[] = [];
  let deliverables: Deliverable[] = [];
  let ebenen: Ebene[] = [];
  try {
    positionen = JSON.parse((formData.get("positionen") as string) || "[]");
  } catch {
    positionen = [];
  }
  try {
    deliverables = JSON.parse((formData.get("deliverables") as string) || "[]");
  } catch {
    deliverables = [];
  }
  try {
    ebenen = JSON.parse((formData.get("ebenen") as string) || "[]");
  } catch {
    ebenen = [];
  }
  return {
    brand_id: (formData.get("brand_id") as string) || null,
    empfaenger_name: (formData.get("empfaenger_name") as string) || null,
    ansprechpartner: (formData.get("ansprechpartner") as string) || null,
    titel: (formData.get("titel") as string) || null,
    status: ((formData.get("status") as string) || "Entwurf") as AngebotStatus,
    laufzeit_monate: Math.max(1, Number(formData.get("laufzeit_monate")) || 1),
    start_datum: (formData.get("start_datum") as string) || null,
    gueltig_bis: (formData.get("gueltig_bis") as string) || null,
    tasting: formData.get("tasting") === "on",
    tasting_pct: Math.max(0, Number(formData.get("tasting_pct")) || 10),
    gemietete_breite_cm: ebenen.length ? gesamtBreiteCm(ebenen) : numOrNull(formData.get("gemietete_breite_cm")),
    max_artikel: numOrNull(formData.get("max_artikel")),
    nachschub_email: (formData.get("nachschub_email") as string) || null,
    ebenen,
    positionen,
    deliverables,
    notiz: (formData.get("notiz") as string) || null,
  };
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v as string)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function deleteAngebot(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("pipeline_angebote")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
