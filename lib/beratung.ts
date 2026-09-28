/* Geförderte Beratung (BAFA "Förderung von Unternehmensberatungen für KMU").
   Nur sichtbar mit SHOW_BAFA (lib/site-flags.ts). Förderung nie als sicher
   darstellen: immer "kann gefördert werden" bzw. "bis zu". */

/** Bemessungsgrundlage je Beratung, netto. */
export const BAFA_BEMESSUNG_NETTO = 3500;

/** Zuschuss in Prozent, je nach Firmensitz. Berlin zählt zu den alten Ländern. */
export const BAFA_ZUSCHUSS_PCT = { neu: 80, alt: 50 } as const;

export const eigenanteil = (pct: number) => Math.round(BAFA_BEMESSUNG_NETTO * (1 - pct / 100));

export const BERATUNG_THEMEN = [
  "Listungsvorbereitung",
  "Kalkulation mit Handelsspanne",
  "Finanzierung von Produktion und Ware",
  "Logistik: Paletten, Anlieferung, Lager",
];

export const BERATUNG_HINWEISE = [
  "Der Förderantrag muss vor Beginn der Beratung gestellt werden.",
  "Unternehmen, die jünger als ein Jahr sind, brauchen vorher ein Informationsgespräch bei einem Regionalpartner.",
  "Die Beratung ist unabhängig von Regalplatz und Treppe buchbar und wird separat vertraglich vereinbart.",
  "Über die Förderung entscheidet das BAFA.",
];

/** Für das Formularfeld "Sitz deiner Firma". */
export const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;
