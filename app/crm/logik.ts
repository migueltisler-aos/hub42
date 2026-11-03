// Reine Ableitungen für den Screen „Heute“: wer sieht was, was ist
// überfällig, in welcher Reihenfolge. Keine Abfrage, die Daten kommen von
// lib/crm-heute.ts.

import {
  PERSONEN,
  type Aufgabe,
  type HeuteDaten,
  type MeilensteinFaellig,
  type Person,
  type SlaVerstoss,
} from "@/lib/crm-heute-model";

export { PERSONEN };
export type Wer = Person | "Alle";

export function werAus(param: string | string[] | undefined, standard: Wer): Wer {
  const v = Array.isArray(param) ? param[0] : param;
  if (v === "Alle") return "Alle";
  return PERSONEN.find((p) => p === v) ?? standard;
}

const TAG_MS = 86_400_000;
const utc = (iso: string) => {
  const [j, m, t] = iso.split("-").map(Number);
  return Date.UTC(j, m - 1, t);
};

/** Tage von `iso` bis `heute`: positiv = liegt zurück. */
export const tageSeit = (iso: string, heute: string) => Math.round((utc(heute) - utc(iso)) / TAG_MS);

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

type Faellig = { id: string; faellig: string | null; verantwortlich: Person; erledigt: boolean };

/** Überfällig, heute, demnächst: für Sales-Aufgaben und allgemeine Aufgaben gleich. */
export function gruppiere<T extends Faellig>(liste: T[], heute: string, wer: Wer, erledigt: Record<string, boolean>) {
  const meine = liste.filter((a) => fuer(wer, a.verantwortlich));
  const fertig = (a: T) => erledigt[a.id] ?? a.erledigt;
  // Ohne Datum steht hinten: Wert unendlich.
  const zeit = (f: string | null) => (f === null ? Infinity : utc(f));
  const nachDatum = (x: { faellig: string | null }, y: { faellig: string | null }) => {
    const a = zeit(x.faellig), b = zeit(y.faellig);
    return a === b ? 0 : a < b ? -1 : 1;
  };
  const t = (a: T) => (a.faellig === null ? null : tageSeit(a.faellig, heute));

  return {
    // Heute Erledigtes mit altem Datum bleibt sichtbar, bis der Tag um ist.
    ueberfaellig: meine.filter((a) => (t(a) ?? 0) > 0).sort(nachDatum),
    heute: meine.filter((a) => t(a) === 0),
    // Künftiges und Aufgaben ohne Datum; Erledigtes, das noch nicht dran ist, braucht hier niemand.
    demnaechst: meine.filter((a) => (t(a) === null || t(a)! < 0) && !fertig(a)).sort(nachDatum),
  };
}

export function lageFuer(daten: HeuteDaten, wer: Wer, erledigt: Record<string, boolean>): Lage {
  const nachDatum = (x: { faellig: string }, y: { faellig: string }) => utc(x.faellig) - utc(y.faellig);
  return {
    ...gruppiere<Aufgabe>(daten.aufgaben, daten.heute, wer, erledigt),
    sla: daten.sla
      .filter((s) => fuer(wer, s.besitzer))
      .sort((x, y) => {
        const rx = SLA_ROT.includes(x.art) ? 0 : 1;
        const ry = SLA_ROT.includes(y.art) ? 0 : 1;
        return rx - ry || y.seit_tagen - x.seit_tagen;
      }),
    meilensteine: daten.meilensteine.filter((m) => fuer(wer, m.verantwortlich)).sort(nachDatum),
  };
}
