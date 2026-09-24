// Reine Angebots-Logik: Konstanten, Flächen-/Preisrechnung, Positionen,
// Deliverables, Formular-Parsing. Kein Datenzugriff, keine Seiteneffekte.
//
// Bewusst getrennt von lib/angebote.ts: diese Datei wird auch von Client-
// Components importiert (AngebotForm, AngeboteClient), und lib/angebote.ts
// zieht über lib/supabase-admin.ts den Service-Role-Key herein, der nie in
// ein Browser-Bundle darf. Gleiches Muster wie lib/deck-economics.ts.
import { SLOTS } from "./slots";
import {
  BASE_RATE_BESONDERER_WERT,
  BASE_RATE_PER_CM,
  MIN_SLOT_MIETE,
  MIN_SLOT_MIETE_BESONDERER_WERT,
} from "./deck-economics";
export const MWST_PCT = 19;

/* ── Flächenpreis ─────────────────────────────────────────────────
   Miete = belegte Fläche (m²) × Preis/m² – mit Mindestmiete.
   Fläche je Ebene = Breite (cm) × Regaltiefe (60 cm).
   Zwei Preisklassen wie auf der Website (deck-economics.ts): Standard und
   "besonderer Wert" (nur auf Bewerbung) – je Angebot per Schalter. */
export const PREIS_PRO_QM = BASE_RATE_PER_CM; // €/m²/Monat, Standard
export const PREIS_PRO_QM_BESONDERER_WERT = BASE_RATE_BESONDERER_WERT;
export const REGAL_TIEFE_CM = 60;
export const MINDESTMIETE_MONAT = MIN_SLOT_MIETE; // €/Monat – aus deck-economics, nicht doppelt pflegen
export const MINDESTMIETE_BESONDERER_WERT = MIN_SLOT_MIETE_BESONDERER_WERT;

/** Preis/m² und Mindestmiete der Preisklasse eines Angebots. */
export function mietKlasse(besondererWert: boolean): { preisProQm: number; mindestmiete: number } {
  return besondererWert
    ? { preisProQm: PREIS_PRO_QM_BESONDERER_WERT, mindestmiete: MINDESTMIETE_BESONDERER_WERT }
    : { preisProQm: PREIS_PRO_QM, mindestmiete: MINDESTMIETE_MONAT };
}
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
export function flaechenMieteMonat(ebenen: Ebene[], besondererWert = false): number {
  const m2 = flaecheM2(ebenen);
  if (m2 <= 0) return 0;
  const { preisProQm, mindestmiete } = mietKlasse(besondererWert);
  return Math.max(mindestmiete, Math.round(m2 * preisProQm * 100) / 100);
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
  /** Preisklasse "besonderer Wert" (4,64 €, min. 59 €) statt Standard. */
  besonderer_wert: boolean;
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
  ebenen: Ebene[] = [],
  besondererWert = false
): AngebotSummary {
  const flaechenMonat = flaechenMieteMonat(ebenen, besondererWert);
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
    besonderer_wert: formData.get("besonderer_wert") === "on",
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
