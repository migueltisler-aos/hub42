// Reine Ableitungen für den Screen „Heute“: wer sieht was, was ist
// überfällig, in welcher Reihenfolge. Keine Abfrage, nur die Fixture.

import {
  AUFGABEN,
  HEUTE,
  ICH,
  MEILENSTEINE,
  SLA,
  type Aufgabe,
  type MeilensteinFaellig,
  type Person,
  type SlaVerstoss,
} from "./fixture";

export const PERSONEN: Person[] = ["Ralf", "Anke", "Miguel", "Oliver"];
export type Wer = Person | "Alle";

export function werAus(param: string | string[] | undefined): Wer {
  const v = Array.isArray(param) ? param[0] : param;
  if (v === "Alle") return "Alle";
  return PERSONEN.find((p) => p === v) ?? ICH;
}

const TAG_MS = 86_400_000;
const utc = (iso: string) => {
  const [j, m, t] = iso.split("-").map(Number);
  return Date.UTC(j, m - 1, t);
};

/** Tage von `iso` bis HEUTE: positiv = liegt zurück. */
export const tageSeit = (iso: string) => Math.round((utc(HEUTE) - utc(iso)) / TAG_MS);

const WOCHENTAG = new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: "UTC" });
const TAG_MONAT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** „Di 03.11.“ */
export function kurzDatum(iso: string) {
  const d = new Date(utc(iso));
  return `${WOCHENTAG.format(d).replace(".", "")} ${TAG_MONAT.format(d)}`;
}

/** „Montag, 2. November 2026“ */
export const langDatum = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(utc(iso)));

/** Die beiden SLA-Arten, die der Plan „rot“ nennt. */
export const SLA_ROT: SlaVerstoss["art"][] = ["antwort_ungeordnet", "interesse_ohne_termin"];
/** Zusatzwort aus dem Plan, Abschnitt SLAs. */
export const SLA_WORT: Partial<Record<SlaVerstoss["art"], string>> = {
  angebot_stockt: "stockt",
  haengt: "hängt",
};

export type Lage = {
  ueberfaellig: Aufgabe[];
  heute: Aufgabe[];
  demnaechst: Aufgabe[];
  sla: SlaVerstoss[];
  meilensteine: MeilensteinFaellig[];
};

const fuer = (wer: Wer, p: Person) => wer === "Alle" || wer === p;

export function lageFuer(wer: Wer, erledigt: Record<string, boolean>): Lage {
  const meine = AUFGABEN.filter((a) => fuer(wer, a.verantwortlich));
  const fertig = (a: Aufgabe) => erledigt[a.id] ?? a.erledigt;
  const nachDatum = (x: { faellig: string }, y: { faellig: string }) => utc(x.faellig) - utc(y.faellig);

  return {
    ueberfaellig: meine.filter((a) => tageSeit(a.faellig) > 0).sort(nachDatum),
    heute: meine.filter((a) => tageSeit(a.faellig) === 0),
    // Erledigtes, das noch nicht dran ist, braucht hier niemand.
    demnaechst: meine.filter((a) => tageSeit(a.faellig) < 0 && !fertig(a)).sort(nachDatum),
    sla: SLA.filter((s) => fuer(wer, s.besitzer)).sort((x, y) => {
      const rx = SLA_ROT.includes(x.art) ? 0 : 1;
      const ry = SLA_ROT.includes(y.art) ? 0 : 1;
      return rx - ry || y.seit_tagen - x.seit_tagen;
    }),
    meilensteine: MEILENSTEINE.filter((m) => fuer(wer, m.verantwortlich)).sort(nachDatum),
  };
}
