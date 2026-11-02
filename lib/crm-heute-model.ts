// Typen und Texte für den CRM-Screen „Heute“. Ohne Datenzugriff, damit die
// Client-Komponente sie importieren darf (der Lader steht in lib/crm-heute.ts).

export const PERSONEN = ["Ralf", "Anke", "Miguel", "Oliver"] as const;
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
};

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
