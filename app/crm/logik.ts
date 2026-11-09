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

/* ── Aufgaben-App: Suche, Stimmen, Zuweisungsvorschlag ─────────────────── */

type Suchbar = { titel: string; link?: string | null; notiz?: string | null; bereich?: string | null; verantwortlich: Person };

const klein = (s: string) => s.toLocaleLowerCase("de-DE");

/** Jedes Suchwort steht irgendwo in Titel, Link, Notiz, Bereich oder Person. */
export function passtZurSuche(a: Suchbar, suche: string) {
  const woerter = klein(suche).split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return true;
  const heuhaufen = klein([a.titel, a.link, a.notiz, a.bereich, a.verantwortlich].filter(Boolean).join(" "));
  return woerter.every((w) => heuhaufen.includes(w));
}

/** Summe der Stimmen: wartet drauf +1, unwichtig -1. */
export const punkte = (stimmen: { wert: number }[]) => stimmen.reduce((s, x) => s + x.wert, 0);

/** Mehr Wartende zuerst, Unwichtiges ans Ende; bei Gleichstand bleibt die Datumsfolge. */
export function nachStimmen<T extends { stimmen: { wert: number }[] }>(liste: T[]) {
  return [...liste].sort((x, y) => punkte(y.stimmen) - punkte(x.stimmen));
}

const FUELLWOERTER = new Set([
  "der", "die", "das", "und", "oder", "für", "fuer", "mit", "von", "vom", "zum", "zur", "den", "dem",
  "des", "ein", "eine", "einen", "auf", "aus", "bei", "nach", "noch", "bis", "an", "am", "im", "in",
  "zu", "ist", "sind", "wir", "ich", "machen", "erledigen", "checken", "prüfen",
]);

/** Wortstämme eines Titels: klein, ohne Füllwörter, ab vier Zeichen, auf sechs gekürzt. */
function staemme(titel: string) {
  return new Set(
    klein(titel)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 4 && !FUELLWOERTER.has(w))
      .map((w) => w.slice(0, 6))
  );
}

export type Vorschlag = { wer: Person; grund: string };

type Erfahrung = { titel: string; bereich: string | null; wer: Person };

/** Wer die Aufgabe übernehmen sollte: wer Ähnliches schon erledigt hat und den
    Bereich macht, abzüglich dessen, was er offen hat. Ohne Ähnlichkeit oder
    Bereich kein Vorschlag, denn die Last allein ist kein Grund. */
export function vorschlagFuer(
  titel: string,
  bereich: string | null,
  erledigt: Erfahrung[],
  offen: { verantwortlich: Person }[]
): Vorschlag | null {
  const eigene = staemme(titel);
  if (eigene.size === 0 && !bereich) return null;

  const stand = new Map<Person, { aehnlich: number; bereich: number; offen: number }>(
    PERSONEN.map((p) => [p, { aehnlich: 0, bereich: 0, offen: 0 }])
  );
  for (const e of erledigt) {
    const s = stand.get(e.wer);
    if (!s) continue;
    const treffer = [...staemme(e.titel)].some((w) => eigene.has(w));
    if (treffer) s.aehnlich += 1;
    if (bereich && e.bereich === bereich) s.bereich += 1;
  }
  for (const o of offen) {
    const s = stand.get(o.verantwortlich);
    if (s) s.offen += 1;
  }

  let best: { wer: Person; wert: number } | null = null;
  for (const [wer, s] of stand) {
    if (s.aehnlich === 0 && s.bereich === 0) continue;
    const wert = s.aehnlich * 3 + Math.min(s.bereich, 3) - s.offen * 0.5;
    if (!best || wert > best.wert) best = { wer, wert };
  }
  if (!best) return null;

  const s = stand.get(best.wer)!;
  const teile = [
    s.aehnlich > 0 && `${s.aehnlich} ähnliche erledigt`,
    s.aehnlich === 0 && s.bereich > 0 && `macht ${bereich}`,
    `${s.offen} offen`,
  ].filter(Boolean);
  return { wer: best.wer, grund: teile.join(" · ") };
}
