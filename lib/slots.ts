import { RATES, SCHAUFENSTER_MONAT, type ZoneId } from "./deck-economics";

export type SlotColor = "gold" | "silver" | "standard" | "base" | "window";

export interface SlotTier {
  id: string;
  name: string;
  position: string;
  /** Fixed monthly price – set for Schaufenster / Ladenfront */
  kostenMonat?: number;
  /** Per-cm monthly rate (Regalfront L) – set for Basis, Augenhöhe, Greifhöhe garantiert */
  ratePerCm?: number;
  /** Zone for the package prices S, M, L */
  zone?: ZoneId;
  color: SlotColor;
  empfohlen?: boolean;
  highlights: string[];
  idealFor: string;
}

export const SLOTS: SlotTier[] = [
  {
    id: "schaufenster",
    name: "Schaufenster",
    position: "Ladenfront – Außensichtbarkeit",
    kostenMonat: SCHAUFENSTER_MONAT,
    color: "window",
    empfohlen: false,
    highlights: [
      "Sichtbar von außen – ohne Betreten",
      "Alexa-Center: rund 15 Mio. Besuche/Jahr",
      "QR-Code + Traverse-Karte inklusive",
      "Ideal für visuelle Produkte",
    ],
    idealFor: "Visual-Produkte, Awareness, saisonale Aktionen",
  },
  {
    id: "greifhoehe",
    name: "Greifhöhe garantiert",
    position: "Greifhöhe garantiert (+20 % Aufschlag)",
    ratePerCm: RATES.greifhoehe,
    zone: "greifhoehe",
    color: "silver",
    empfohlen: true,
    highlights: [
      "Garantiert auf Greifhöhe, 90 bis 130 cm",
      "QR-Code + Traverse-Karte inklusive",
      "Promo-Tag 1× pro Quartal (Fr/Sa)",
      "Tasting Bar inklusive",
    ],
    idealFor: "Etablierte Produkte, Food & Drinks, Gifting",
  },
  {
    id: "augenhoehe",
    name: "Augenhöhe",
    position: "Augenhöhe – starke Sichtbarkeit (+10 %)",
    ratePerCm: RATES.augenhoehe,
    zone: "augenhoehe",
    color: "standard",
    empfohlen: false,
    highlights: [
      "Augenhöhe – sofort im Blickfeld",
      "QR-Code + Traverse-Karte inklusive",
      "Monatliche Verkaufszahlen",
    ],
    idealFor: "Einstieg, Nischenprodukte, erster Markttest",
  },
  {
    id: "basis",
    name: "Basis",
    position: "Grundpreis – Einstiegsebene",
    ratePerCm: RATES.basis,
    zone: "basis",
    color: "base",
    empfohlen: false,
    highlights: [
      "Einstieg in den Hub42",
      "QR-Code + Traverse-Karte inklusive",
      "Monatliche Verkaufszahlen inklusive",
    ],
    idealFor: "Markttest, günstiger Einstieg, kleine Marken",
  },
];

export interface ComparisonRow {
  label: string;
  messe: string | boolean;
  rewe: string | boolean;
  hub42: string | boolean;
  hub42Highlight?: boolean;
  note?: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Was du abgibst",
    messe: "Standmiete je Event",
    rewe: "Handelsspanne + Listung",
    hub42: "Miete + 7 % je Verkauf",
    hub42Highlight: true,
    note: "Keine Handelsmarge, keine Listungsgebühr. Du setzt deine eigene UVP.",
  },
  {
    label: "Einstiegskosten",
    messe: "3.000–8.000 € / Event",
    rewe: "2.000–50.000 €",
    hub42: "ab 59 €/Mo netto",
    hub42Highlight: true,
  },
  {
    label: "Preishoheit",
    messe: true,
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "Du setzt deinen Preis, immer.",
  },
  {
    label: "Kundendaten",
    messe: "Nur vor Ort",
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "Monatlicher Verkaufsbericht inklusive",
  },
  {
    label: "Warenrisiko",
    messe: "Mitnahme",
    rewe: "Rücknahmekosten",
    hub42: "Konsignation",
    hub42Highlight: true,
    note: "Du bleibst Eigentümer, kein\u00A0Abnahmezwang.",
  },
  {
    label: "Try It / Tasting",
    messe: true,
    rewe: false,
    hub42: true,
    hub42Highlight: true,
  },
  {
    label: "Mindestmenge",
    messe: "Flexibel",
    rewe: "Vollpaletten",
    hub42: "Flexibel",
    hub42Highlight: true,
  },
  {
    label: "Entscheidungszeit",
    messe: "6–12 Mo Anmeldung",
    rewe: "6–18 Monate",
    hub42: "1–2 Wochen",
    hub42Highlight: true,
  },
  {
    label: "Werbung am Stand / Regal",
    messe: true,
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "QR-Code + Traverse-Karte mit deiner Story",
  },
  {
    label: "Sichtbarkeitsdauer",
    messe: "3 Tage / Event",
    rewe: "Ganzjährig",
    hub42: "Ganzjährig",
    hub42Highlight: true,
  },
];

export interface AnalyticsPaket {
  name: string;
  preis: number | null;
  beschreibung: string;
  features: string[];
  inkludiert: boolean;
}

export const ANALYTICS_PAKETE: AnalyticsPaket[] = [
  {
    name: "Basis",
    preis: null,
    beschreibung: "Monatliche Verkaufszahlen",
    features: [
      "Monatlicher Verkaufsbericht",
      "Gesamtumsatz pro Monat",
      "Verfügbar im Dashboard",
    ],
    inkludiert: true,
  },
  {
    name: "Pro",
    preis: 49,
    beschreibung: "Vollständiger Funnel + Tageszeit + QR-Scans",
    features: [
      "Tagesgenaue Verkaufsdaten",
      "QR-Scan Heatmap",
      "Kaufzeitanalyse",
      "Conversion-Funnel",
      "Wochenvergleich",
    ],
    inkludiert: false,
  },
  {
    name: "Marken-Report",
    preis: 29,
    beschreibung: "Monatlicher PDF mit Handlungsempfehlungen",
    features: [
      "Kuratierter PDF-Report",
      "Konkrete Handlungsempfehlungen",
      "Preisstrategie-Analyse",
      "Wettbewerbskontext",
    ],
    inkludiert: false,
  },
];
