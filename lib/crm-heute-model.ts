// Typen und Texte für den CRM-Screen „Heute“. Ohne Datenzugriff, damit die
// Client-Komponente sie importieren darf (der Lader steht in lib/crm-heute.ts).

export const PERSONEN = ["Ralf", "Anke", "Miguel", "Oliver", "Leon"] as const;
export type Person = (typeof PERSONEN)[number];

export type Segment = "Startup" | "Enterprise" | "Partner" | null;
export type Stufe =
  | "Recherche" | "In Sequenz" | "Antwort" | "Interesse" | "Gespräch"
  | "Angebot" | "Kunde" | "Später" | "Verloren" | "Gesperrt";

export type BrandKurz = { id: string; name: string; stufe: Stufe; segment: Segment };

export type Aufgabe = {
  id: string;
  titel: string;
  faellig: string | null; // JJJJ-MM-TT, null = ohne Datum
  verantwortlich: Person;
  erledigt: boolean;
  brand: BrandKurz;
  quelle: "hand" | "bewerbung" | "migration" | "meilenstein";
};

export type SlaVerstoss = {
  id: string;
  art: "antwort_ungeordnet" | "interesse_ohne_termin" | "angebot_stockt" | "haengt";
  seit_tagen: number;
  besitzer: Person;
  brand: BrandKurz;
};

export type MeilensteinFaellig = {
  id: string;
  projekt: string;
  titel: string;
  faellig: string;
  verantwortlich: Person;
};

export type HeuteDaten = {
  heute: string; // JJJJ-MM-TT in Europe/Berlin
  aufgaben: Aufgabe[];
  sla: SlaVerstoss[];
  meilensteine: MeilensteinFaellig[];
  /** Auswahl beim Anlegen: alle Marken außer Gesperrt, nach Name. */
  marken: { id: string; name: string }[];
};

/* ── Allgemeine Aufgaben: ohne Marke, mit Bereich ─────────────────────── */

export const BEREICHE = ["Vertrieb", "Marketing", "Finanzen", "Betrieb", "Sonstiges"] as const;
export type Bereich = (typeof BEREICHE)[number];

export type AllgemeineAufgabe = {
  id: string;
  titel: string;
  faellig: string | null;
  verantwortlich: Person;
  erledigt: boolean;
  bereich: Bereich | null;
};

/** Eine erledigte Aufgabe in der Historie, mit Nachweis. Allgemein oder mit Marke. */
export type ErledigteAufgabe = {
  id: string;
  titel: string;
  verantwortlich: Person;
  erledigtAm: string;
  erledigtVon: string | null;
  notiz: string | null;
  link: string | null;
  marke: string | null;
  bereich: Bereich | null;
};

/** Optionaler Nachweis beim Abhaken. */
export type Nachweis = { notiz: string; link: string };

export type AufgabenDaten = { heute: string; aufgaben: AllgemeineAufgabe[]; historie: ErledigteAufgabe[] };

/* ── Pipeline-Dashboard: Trichter und Kunden ──────────────────────────── */

export const TRICHTER_STUFEN: Stufe[] = ["Recherche", "In Sequenz", "Antwort", "Interesse", "Gespräch", "Angebot", "Kunde"];

/** Ziel aus FeFa_Stand, Reiter Cockpit-Ziele (Stand 2026-11-03). */
export const ZIEL = { jahrSoll: 40_000, frist: "2027-03-28", wocheSoll: 1_559 } as const;

export type Trichter = {
  stufen: { stufe: Stufe; anzahl: number }[];
  spaeter: number;
  verloren: number;
  /** Gebuchte Zusagen (crm_zusagen, ohne storniert). */
  zusagen: { anzahl: number; vertragswert: number; monat: number; regalCm: number };
  /** Vertragswert der Zusagen, gebucht seit Wochen- bzw. Monatsbeginn. */
  wertWoche: number;
  wertMonat: number;
  /** Angebote mit Status Versendet oder Angefragt. */
  offeneAngebote: number;
};

export type Zusage = {
  id: string;
  produkt: string;
  klasse: string | null;
  regalCm: number | null;
  laufzeitMonate: number | null;
  monatNetto: number | null;
  vertragswert: number | null;
  gebuchtAm: string | null;
  status: string;
};

export type Kunde = {
  id: string;
  name: string;
  segment: Segment;
  besitzer: Person;
  kundeSeit: string | null;
  /** Gebuchte Regalplätze aus crm_zusagen. */
  zusagen: Zusage[];
  /** Was wir zugesagt haben: aus dem angenommenen oder letzten Angebot. */
  angebot: {
    nr: string;
    status: string;
    start: string | null;
    laufzeitMonate: number | null;
    breiteCm: number | null;
    tasting: boolean;
    positionen: string[];
  } | null;
  meilensteine: { id: string; titel: string; faellig: string | null; erledigt: boolean }[];
  updates: { id: string; text: string; wann: string; wer: string | null }[];
};

export type PipelineDaten = { trichter: Trichter; kunden: Kunde[] };

export const SLA_TEXT: Record<SlaVerstoss["art"], string> = {
  antwort_ungeordnet: "Antwort seit über einem Werktag nicht eingeordnet",
  interesse_ohne_termin: "Interesse ohne Terminvorschlag",
  angebot_stockt: "Angebot ohne Aktivität seit 14 Tagen",
  haengt: "Keine offene Aufgabe",
};

/** Kürzel, die in `zugewiesen` und `wer` stehen (Stand 02.11.2026). */
const KUERZEL: Record<string, Person> = { oli: "Oliver", "migueltisler-aos": "Miguel" };

/** Freitext aus `zugewiesen`/`wer` auf eine Person; Unbekanntes landet bei Miguel wie im Routing. */
export function personAus(wert: string | null | undefined): Person {
  const v = wert?.trim().toLowerCase() ?? "";
  return PERSONEN.find((p) => p.toLowerCase() === v) ?? KUERZEL[v] ?? "Miguel";
}
