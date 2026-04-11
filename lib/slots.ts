export type SlotColor = "gold" | "silver" | "standard" | "base" | "window";

export interface SlotTier {
  id: string;
  name: string;
  position: string;
  kostenMonat: number;
  kostenTag: number;
  anzahlSlots: number;
  color: SlotColor;
  empfohlen?: boolean;
  highlights: string[];
  idealFor: string;
}

export const SLOTS: SlotTier[] = [
  {
    id: "hero-wall",
    name: "Hero Wall",
    position: "Ladenfront – maximale Sichtbarkeit",
    kostenMonat: 490,
    kostenTag: 16.33,
    anzahlSlots: 8,
    color: "gold",
    empfohlen: false,
    highlights: [
      "Prominenteste Platzierung im Store",
      "Großflächige Produktpräsentation",
      "Ideal für Launches & Kampagnen",
      "Inklusive Tasting-Slot",
      "Brand Storytelling Fläche",
    ],
    idealFor: "Launch-Kampagnen, Saisonartikel, Brand Awareness",
  },
  {
    id: "schaufenster",
    name: "Schaufenster",
    position: "Außensichtbarkeit – Laufkundschaft",
    kostenMonat: 149,
    kostenTag: 4.97,
    anzahlSlots: 4,
    color: "window",
    empfohlen: false,
    highlights: [
      "Sichtbar von außen – ohne Betreten",
      "41.000 Passanten täglich",
      "Ideal für visuelle Produkte",
      "Traverse-Karte mit Story",
    ],
    idealFor: "Visual-Produkte, Awareness, saisonale Aktionen",
  },
  {
    id: "premium",
    name: "Premium",
    position: "Augenhöhe – prime conversion",
    kostenMonat: 149,
    kostenTag: 4.97,
    anzahlSlots: 50,
    color: "silver",
    empfohlen: true,
    highlights: [
      "Augenhöhe = höchste Conversion",
      "QR-Code mit Tracking",
      "Tasting Bar Integration möglich",
      "Monatliche Verkaufsanalyse",
    ],
    idealFor: "Etablierte Produkte, Food & Drinks, Gifting",
  },
  {
    id: "standard",
    name: "Standard",
    position: "Mitte – solide Performance",
    kostenMonat: 89,
    kostenTag: 2.97,
    anzahlSlots: 70,
    color: "standard",
    empfohlen: false,
    highlights: [
      "Sichtbare Regalposition",
      "QR-Code Integration",
      "Monatliche Verkaufszahlen",
    ],
    idealFor: "Einstieg, Nischenprodukte, erster Markttest",
  },
  {
    id: "basis",
    name: "Basis",
    position: "Einstiegsebene",
    kostenMonat: 55,
    kostenTag: 1.83,
    anzahlSlots: 80,
    color: "base",
    empfohlen: false,
    highlights: [
      "Einstieg in den Hub42",
      "Konsignationsmodell",
      "Monatliche Abrechnung",
    ],
    idealFor: "Markttest, günstiger Einstieg, kleine Brands",
  },
];

export interface ComparisonRow {
  label: string;
  rewe: string | boolean;
  hub42: string | boolean;
  hub42Highlight?: boolean;
  note?: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Handelsmarge",
    rewe: "30–50%",
    hub42: "0%",
    hub42Highlight: true,
    note: "Du behältst deinen Verkaufspreis vollständig",
  },
  {
    label: "Listungsgebühr",
    rewe: "2.000–50.000 €",
    hub42: "Ab 55 €/Monat",
    hub42Highlight: true,
  },
  {
    label: "Preishoheit",
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "Du setzt deinen Preis – immer",
  },
  {
    label: "Kundendaten",
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "Tägliches Kaufverhalten vollständig an dich",
  },
  {
    label: "Warenrisiko",
    rewe: "Rücknahmekosten",
    hub42: "Konsignation",
    hub42Highlight: true,
    note: "Du bleibst Eigentümer – kein Abnahmezwang",
  },
  {
    label: "Try It / Tasting",
    rewe: false,
    hub42: true,
    hub42Highlight: true,
  },
  {
    label: "Mindestmenge",
    rewe: "Vollpaletten",
    hub42: "Flexibel",
    hub42Highlight: true,
  },
  {
    label: "Entscheidungszeit",
    rewe: "6–18 Monate",
    hub42: "1–2 Wochen",
    hub42Highlight: true,
  },
  {
    label: "Werbung am Regal",
    rewe: false,
    hub42: true,
    hub42Highlight: true,
    note: "QR-Code, Postkarte zum Selbstgestalten, Traverse-Karte mit deiner Story",
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
