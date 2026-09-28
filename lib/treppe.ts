/* ============================================================
   Die Treppe: fünf Stufen vom ersten Test bis zur Listung.

   Eine Quelle für die Startseite (#treppe, #preise, Formular) und
   /hersteller. Preise kommen aus lib/deck-economics.ts, hier steht
   nur, was eine Stufe ist und leistet.

   Rein und ohne Datenzugriff, damit Client-Komponenten und die
   Server Action dieselben Werte importieren.
   ============================================================ */

import { HUB_MARGIN_PCT, RATES, REGAL_INKLUSIVE_CM, STUFE_PREIS } from "@/lib/deck-economics";

export type StufeKey = keyof typeof STUFE_PREIS;
export type ZielgruppeKey = "gruender" | "online" | "hersteller";

export interface Stufe {
  key: StufeKey;
  nr: number;
  name: string;
  /** Die Frage, die die Marke mit dieser Stufe beantwortet. */
  frage: string;
  dauer: string;
  /** Laufzeit in Monaten, wo die Dauer in Monaten angegeben ist (fürs Rechenbeispiel). */
  monate: number | null;
  preis: number;
  empfohlenFuer: string;
  zielgruppen: ZielgruppeKey[];
  /** Was gegenüber der Stufe darunter dazukommt. */
  neu: string[];
  /** Hinweis "Beratung dazu kann gefördert werden" (nur mit SHOW_BAFA). */
  beratung: boolean;
}

/** Steckt in jeder Stufe. */
export const ALLE_STUFEN: string[] = [
  "Regalplatz mit Tagesticker",
  "Verkauf durch das Store-Team auf Kommission",
  "QR-Feedback am Regal",
  "Kategorie-Benchmark gegen den Hausdurchschnitt",
  "Daten anonymisiert in die Referenzbasis",
];

/* Kumulativ: Jede Stufe enthält alles aus den Stufen darunter, "neu" ist
   nur, was dazukommt. */
export const STUFEN: Stufe[] = [
  {
    key: "testen",
    nr: 1,
    name: "Testen",
    frage: "Verkauft sich das überhaupt?",
    dauer: "3 Monate",
    monate: 3,
    preis: STUFE_PREIS.testen,
    empfohlenFuer: "junge Startups",
    zielgruppen: ["gruender"],
    neu: [
      "1 Produkt",
      "Abverkaufs-Dashboard",
      "Handelsreife-Check: EAN, LMIV, Kalkulation, Lieferfähigkeit",
      "Fotos „im Handel erhältlich“",
      "Kurzbericht",
    ],
    beratung: false,
  },
  {
    key: "beweisen",
    nr: 2,
    name: "Beweisen",
    frage: "Wer kauft im Laden, und warum?",
    dauer: "3 Monate",
    monate: 3,
    preis: STUFE_PREIS.beweisen,
    empfohlenFuer: "Online-Marken, Startups nach Stufe 1",
    zielgruppen: ["online", "gruender"],
    neu: [
      "3 Tasting-Samstage mit mehreren Marken",
      "Demografisches Profil der Käufer",
      "Screen gegen Regal: Wirkung der Packung",
      "Online-Offline-Vergleich der Käufer (nur aggregierte Daten)",
      "Ladenpreis-Check",
      "Market Evidence Passport",
      "Paket „Jetzt auch im Handel“ für Shop und Marktplätze",
      "Bericht",
    ],
    beratung: true,
  },
  {
    key: "spark",
    nr: 3,
    name: "Discovery Spark",
    frage: "Was muss ich ändern?",
    dauer: "8 Wochen",
    monate: null,
    preis: STUFE_PREIS.spark,
    empfohlenFuer: "etablierte Hersteller, Startups nach Stufe 2",
    zielgruppen: ["hersteller", "gruender"],
    neu: [
      "1 Produkt",
      "Interview am PoS",
      "Say-Do-Index",
      "3 Fokusfragen",
      "Bericht mit Ergebnisgespräch",
    ],
    beratung: true,
  },
  {
    key: "focus",
    nr: 4,
    name: "Decision Focus",
    frage: "Welcher Preis, welche Zielgruppe?",
    dauer: "12 Wochen",
    monate: null,
    preis: STUFE_PREIS.focus,
    empfohlenFuer: "etablierte Hersteller",
    zielgruppen: ["hersteller"],
    neu: [
      "1 bis 3 Produkte",
      "Warenkorbanalyse",
      "Segmentierung",
      "10 Fokusfragen",
      "2 Fokusgruppen im Laden",
      "Preiskorridor mit beiden Optima",
      "Echte Preis- und Platzierungswechsel",
      "Wiederkauf über pseudonyme Panel-ID",
      "Bericht mit Executive Summary und Workshop",
    ],
    beratung: false,
  },
  {
    key: "powerhouse",
    nr: 5,
    name: "Premium Powerhouse",
    frage: "Wie überzeuge ich den Einkauf?",
    dauer: "6 Monate",
    monate: null,
    preis: STUFE_PREIS.powerhouse,
    empfohlenFuer: "etablierte Hersteller, Portfolio",
    zielgruppen: ["hersteller"],
    neu: [
      "Portfolio statt Einzelprodukt",
      "Monatliche Fokusgruppen",
      "25 Fokusfragen",
      "Wettbewerbsvergleich im selben Regal",
      "Handelsunterlage, geprüft von ehemaligen Einkäufern",
      "Presse- und Bildpaket",
      "Executive Reporting mit festem Ansprechpartner",
    ],
    beratung: false,
  },
];

export const ZIELGRUPPEN: Record<ZielgruppeKey, { label: string; einstieg: StufeKey }> = {
  gruender: { label: "Gründer", einstieg: "testen" },
  online: { label: "Online-Marke", einstieg: "beweisen" },
  hersteller: { label: "Etablierter Hersteller", einstieg: "spark" },
};

export const NACH_JEDER_STUFE =
  "Nach jeder Stufe geht es ins Standardregal oder eine Stufe höher. Die vorherige Stufe wird voll angerechnet.";
export const NUR_NEUPRODUKTE =
  "Etablierte Hersteller kommen nur mit Neuprodukten, die nirgends flächendeckend gelistet sind.";

/** Was beim Regal in jeder Stufe gilt, kurz. */
export const REGAL_TEXT = `bis ${REGAL_INKLUSIVE_CM} cm inklusive`;

/** Zentimeter über REGAL_INKLUSIVE_CM: Zonenpreis, keine Mindestmiete. */
export const ZUSATZ_CM_TEXT = `Jeder weitere Zentimeter kostet den Zonenpreis des Standardregals, ohne Mindestmiete.`;

/** Preiszeile einer Stufe, überall gleich formuliert. */
export const preisText = (s: Stufe): string =>
  `${eur0(s.preis)} netto, Regal ${REGAL_TEXT}, + ${HUB_MARGIN_PCT} % auf Verkauf`;

/** Ganze Euro, deutsch: 3.900 €. */
export const eur0 = (n: number): string => n.toLocaleString("de-DE") + " €";

/* ── Rechenbeispiel Stufe 1 ───────────────────────────────── */
export const BEISPIEL_CM = 20;
export const BEISPIEL = (() => {
  const s = STUFEN[0];
  const zusatzCm = BEISPIEL_CM - REGAL_INKLUSIVE_CM;
  // Basiszone, Gründungskonditionen, ohne Mindestmiete
  const zusatzMonat = Math.round(zusatzCm * RATES.basis * 100) / 100;
  const monate = s.monate ?? 3;
  return { stufe: s, cm: BEISPIEL_CM, zusatzCm, rate: RATES.basis, zusatzMonat, monate };
})();

/* ── Bewerbung: Einstieg ──────────────────────────────────── */
export const EINSTIEGE = {
  testen: "Stufe 1 Testen",
  beweisen: "Stufe 2 Beweisen",
  studie: "Stufe 3 bis 5 Studie",
  standardregal: "Standardregal",
  offen: "Noch offen",
} as const;
export type EinstiegKey = keyof typeof EINSTIEGE;

/** Bei Stufe 3 bis 5 steckt das Regal im Preis: keine Zone, keine Breite. */
export const mitRegalwahl = (e: EinstiegKey | ""): boolean => e !== "studie";

export const einstiegFuerStufe = (k: StufeKey): EinstiegKey =>
  k === "testen" || k === "beweisen" ? k : "studie";

/** Treppe → Formular: "Diese Stufe anfragen" belegt den Einstieg vor. */
export const EINSTIEG_EVENT = "hub42:einstieg";
