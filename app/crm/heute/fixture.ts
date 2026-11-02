// Testdaten für den Screen „Heute“ während der Design-Challenge.
// Alle Marken und Personen außer dem Team sind erfunden. Form wie die
// Tabellen crm_aufgaben, pipeline_brands und crm_projekte; die echte
// Abfrage ersetzt diese Datei, sobald ein Look gewählt ist.

export type Person = "Miguel" | "Ralf" | "Oliver" | "Anke";
export type Segment = "Startup" | "Enterprise" | "Partner" | null;
export type Stufe =
  | "Recherche" | "In Sequenz" | "Antwort" | "Interesse" | "Gespräch"
  | "Angebot" | "Kunde" | "Später" | "Verloren" | "Gesperrt";

export const HEUTE = "2026-11-02";
export const ICH: Person = "Ralf";

export type Aufgabe = {
  id: string;
  titel: string;
  faellig: string; // JJJJ-MM-TT
  verantwortlich: Person;
  erledigt: boolean;
  brand: { id: string; name: string; stufe: Stufe; segment: Segment };
  quelle: "hand" | "bewerbung" | "migration" | "meilenstein";
};

export type SlaVerstoss = {
  id: string;
  art: "antwort_ungeordnet" | "interesse_ohne_termin" | "angebot_stockt" | "haengt";
  seit_tagen: number;
  besitzer: Person;
  brand: { id: string; name: string; stufe: Stufe; segment: Segment };
};

export type MeilensteinFaellig = {
  id: string;
  projekt: string;
  titel: string;
  faellig: string;
  verantwortlich: Person;
};

const b = (id: string, name: string, stufe: Stufe, segment: Segment) => ({ id, name, stufe, segment });

export const AUFGABEN: Aufgabe[] = [
  { id: "a1", titel: "Bewerbung prüfen", faellig: "2026-10-29", verantwortlich: "Ralf", erledigt: false, brand: b("b1", "Nordkorn", "Interesse", "Startup"), quelle: "bewerbung" },
  { id: "a2", titel: "Termin für Regalgespräch vorschlagen", faellig: "2026-10-31", verantwortlich: "Ralf", erledigt: false, brand: b("b2", "Hafermond", "Interesse", "Startup"), quelle: "hand" },
  { id: "a3", titel: "Antwort einordnen", faellig: "2026-11-02", verantwortlich: "Ralf", erledigt: false, brand: b("b3", "Salzwerk Drinks", "Antwort", "Startup"), quelle: "hand" },
  { id: "a4", titel: "Angebot nachfassen", faellig: "2026-11-02", verantwortlich: "Ralf", erledigt: false, brand: b("b4", "Kleine Rösterei Lenz", "Angebot", "Startup"), quelle: "hand" },
  { id: "a5", titel: "Muster anfordern", faellig: "2026-11-02", verantwortlich: "Ralf", erledigt: true, brand: b("b5", "Fermentwerk", "Gespräch", "Startup"), quelle: "hand" },
  { id: "a6", titel: "Nach Sequenz anrufen", faellig: "2026-11-03", verantwortlich: "Ralf", erledigt: false, brand: b("b6", "Grünzeug Snacks", "In Sequenz", "Startup"), quelle: "migration" },
  { id: "a7", titel: "Wiedervorlage: meldet sich nach der Messe", faellig: "2026-11-05", verantwortlich: "Ralf", erledigt: false, brand: b("b7", "Bergquell Kombucha", "Später", "Startup"), quelle: "migration" },
  { id: "a8", titel: "Studienangebot abstimmen", faellig: "2026-10-30", verantwortlich: "Anke", erledigt: false, brand: b("b8", "Molkerei Talgrund", "Gespräch", "Enterprise"), quelle: "hand" },
  { id: "a9", titel: "Bewerbung prüfen", faellig: "2026-11-02", verantwortlich: "Anke", erledigt: false, brand: b("b9", "Vitalis Lebensmittel", "Interesse", "Enterprise"), quelle: "bewerbung" },
  { id: "a10", titel: "Fläche Bahnhofsviertel besichtigen", faellig: "2026-11-04", verantwortlich: "Miguel", erledigt: false, brand: b("b10", "Stadtwerke Immobilien", "Gespräch", "Partner"), quelle: "hand" },
  { id: "a11", titel: "Vertrag gegenlesen", faellig: "2026-11-02", verantwortlich: "Oliver", erledigt: false, brand: b("b11", "Kleine Rösterei Lenz", "Angebot", "Startup"), quelle: "hand" },
];

export const SLA: SlaVerstoss[] = [
  { id: "s1", art: "antwort_ungeordnet", seit_tagen: 3, besitzer: "Ralf", brand: b("b12", "Ölmühle Sander", "Antwort", "Startup") },
  { id: "s2", art: "interesse_ohne_termin", seit_tagen: 1, besitzer: "Ralf", brand: b("b2", "Hafermond", "Interesse", "Startup") },
  { id: "s3", art: "angebot_stockt", seit_tagen: 16, besitzer: "Ralf", brand: b("b4", "Kleine Rösterei Lenz", "Angebot", "Startup") },
  { id: "s4", art: "haengt", seit_tagen: 9, besitzer: "Ralf", brand: b("b13", "Pfefferhaus", "Gespräch", "Startup") },
  { id: "s5", art: "haengt", seit_tagen: 22, besitzer: "Anke", brand: b("b14", "Feinkost Bremer", "Interesse", "Enterprise") },
];

export const MEILENSTEINE: MeilensteinFaellig[] = [
  { id: "m1", projekt: "Fermentwerk · Regal Q4", titel: "Ware eingegangen", faellig: "2026-11-03", verantwortlich: "Ralf" },
  { id: "m2", projekt: "Molkerei Talgrund · Studie", titel: "Feedback-Panel aktiv", faellig: "2026-11-02", verantwortlich: "Anke" },
];

export const SLA_TEXT: Record<SlaVerstoss["art"], string> = {
  antwort_ungeordnet: "Antwort seit über einem Werktag nicht eingeordnet",
  interesse_ohne_termin: "Interesse ohne Terminvorschlag",
  angebot_stockt: "Angebot ohne Aktivität seit 14 Tagen",
  haengt: "Keine offene Aufgabe",
};
