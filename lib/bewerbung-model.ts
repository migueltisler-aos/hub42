// Bewerbung um eine Regalfront – geteilte Konstanten und Typen.
//
// Rein und ohne Datenzugriff, damit das Formular (Client) und die Server
// Action dieselben Regeln importieren können (vgl. lib/angebote-model.ts).

import type { ZoneKey } from "@/lib/neue-ui/regal";

/** Wie viele Brands wir pro Woche ins Regal holen. */
export const ONBOARDINGS_PRO_WOCHE = 5;

/** Regalwand → Formular: die gewählte Front vorbelegen. */
export const FRONT_EVENT = "hub42:front";
export type FrontDetail = { zone: ZoneKey; cm: number };

export interface BewerbungPayload {
  name: string;
  email: string;
  marke: string;
  produkt: string;
  website: string;
  zone: ZoneKey | "";
  cm: number | null;
  besondererWert: boolean;
  begruendung: string;
  nachricht: string;
  /** Honeypot – bleibt bei Menschen leer. */
  firma2: string;
}

export type BewerbungFehler = Partial<Record<keyof BewerbungPayload, string>>;

export function pruefeBewerbung(p: BewerbungPayload): BewerbungFehler {
  const e: BewerbungFehler = {};
  if (!p.name.trim()) e.name = "Pflichtfeld";
  if (!p.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Gültige E-Mail erforderlich";
  if (!p.marke.trim()) e.marke = "Pflichtfeld";
  if (!p.produkt.trim()) e.produkt = "Pflichtfeld";
  if (p.besondererWert && p.begruendung.trim().length < 20)
    e.begruendung = "Erzähl uns in ein, zwei Sätzen, was dein Produkt besonders macht";
  return e;
}

/** Montag 00:00 der laufenden Woche in Berlin, als ISO-Zeitpunkt (UTC). */
export function wochenbeginnBerlin(jetzt = new Date()): string {
  // Kalenderdatum und Wochentag in Berlin bestimmen …
  const teile = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(jetzt);
  const t = (typ: string) => teile.find((x) => x.type === typ)!.value;
  const wochentag = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(t("weekday"));
  const montag = new Date(Date.UTC(+t("year"), +t("month") - 1, +t("day") - wochentag));

  // … und Berliner Mitternacht in UTC umrechnen (Offset +1 h bzw. +2 h).
  const offsetStd =
    new Date(montag.toLocaleString("en-US", { timeZone: "Europe/Berlin" })).getTime() -
    new Date(montag.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(montag.getTime() - offsetStd).toISOString();
}
