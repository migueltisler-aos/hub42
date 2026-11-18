// Absender auf Gutschrift und Rechnung, Auftraggeber der SEPA-Überweisung.
// Aus Env-Vars, damit Steuer- und Bankdaten nicht im Repo stehen.
import "server-only";

export interface Firma {
  name: string;
  strasse: string;
  ort: string;
  ustIdNr: string | null;
  steuernummer: string | null;
  iban: string | null;
  bic: string | null;
  kontoinhaber: string;
  email: string | null;
}

export function hub42Firma(): Firma {
  const e = process.env;
  return {
    name: e.HUB42_FIRMA ?? "Hub42 UG (haftungsbeschränkt)",
    strasse: e.HUB42_STRASSE ?? "Spreeinsel 6",
    ort: e.HUB42_ORT ?? "15848 Beeskow",
    ustIdNr: e.HUB42_UST_IDNR || null,
    steuernummer: e.HUB42_STEUERNUMMER || null,
    iban: e.HUB42_IBAN?.replace(/\s+/g, "") || null,
    bic: e.HUB42_BIC || null,
    kontoinhaber: e.HUB42_KONTOINHABER ?? e.HUB42_FIRMA ?? "Hub42 UG (haftungsbeschränkt)",
    email: e.HUB42_ABRECHNUNG_EMAIL || null,
  };
}

/** Was fehlt, bevor Belege rechtssicher erzeugt werden können. */
export function firmaLuecken(f: Firma): string[] {
  const l: string[] = [];
  if (!f.ustIdNr && !f.steuernummer) l.push("HUB42_UST_IDNR oder HUB42_STEUERNUMMER");
  if (!f.iban) l.push("HUB42_IBAN (für die SEPA-Datei)");
  return l;
}
