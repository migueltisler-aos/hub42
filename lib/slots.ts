import { RATES, SCHAUFENSTER_MONAT } from "./deck-economics";

export type SlotColor = "gold" | "silver" | "standard" | "base" | "window";

export interface SlotTier {
  id: string;
  name: string;
  position: string;
  /** Fixed monthly price – set for Schaufenster / Ladenfront */
  kostenMonat?: number;
  /** Per-cm monthly rate – set for Basis, Augenhöhe, Greifhöhe garantiert */
  ratePerCm?: number;
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
      "41.000 Passanten täglich",
      "QR-Code + Traverse-Karte inklusive",
      "Ideal für visuelle Produkte",
    ],
    idealFor: "Visual-Produkte, Awareness, saisonale Aktionen",
  },
  {
    id: "greifhoehe",
    name: "Greifhöhe garantiert",
    position: "Greifzone garantiert – prime conversion (+20 %)",
    ratePerCm: RATES.greifhoehe,
    color: "silver",
    empfohlen: true,
    highlights: [
      "Garantierte Greifzone = höchste Conversion",
      "QR-Code + Traverse-Karte inklusive",
      "Promo-Tag 1× pro Quartal (Fr/Sa)",
      "Pro Analytics – 1 Monat gratis",
      "Tasting Bar inklusive",
    ],
    idealFor: "Etablierte Produkte, Food & Drinks, Gifting",
  },
  {
    id: "augenhoehe",
    name: "Augenhöhe",
    position: "Augenhöhe – starke Sichtbarkeit (+10 %)",
    ratePerCm: RATES.augenhoehe,
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
    color: "base",
    empfohlen: false,
    highlights: [
      "Einstieg in den Hub42",
      "QR-Code + Traverse-Karte inklusive",
      "Monatliche Verkaufszahlen inklusive",
    ],
    idealFor: "Markttest, günstiger Einstieg, kleine Brands",
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
    label: "Handelsmarge",
    messe: "0%",
    rewe: "30–50%",
    hub42: "0%",
    hub42Highlight: true,
    note: "Du behältst deinen Verkaufspreis vollständig",
  },
  {
    label: "Einstiegskosten",
    messe: "3.000–8.000 € / Event",
    rewe: "2.000–50.000 €",
    hub42: "ab 59 €/Mo",
    hub42Highlight: true,
  },
  {
    label: "Preishoheit",
    messe: true,
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "Du setzt deinen Preis – immer",
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
    note: "Du bleibst Eigentümer – kein Abnahmezwang",
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
    name: "Brand Report",
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
