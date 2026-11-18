// Kommissionsabrechnung je Marke und Monat – reine Rechnung, kein Datenzugriff.
//
// Modell (Entscheidung 17.11.2026):
//   1. Gutschrift Marke → Hub42 (§14 Abs. 2 UStG): Entgelt für die verkaufte Ware
//      = Verkaufserlös − Provision, je Steuersatz getrennt. Kleinunternehmer
//      (§19 UStG) bekommen keine USt ausgewiesen.
//   2. Rechnung Hub42 → Marke: Regalmiete des Monats + 19 % USt.
//   3. Auszahlung = Gutschrift brutto − Rechnung brutto − offener Vortrag.
//      Negativ → nichts überweisen, Rest als Vortrag in den Folgemonat.
//
// Tasting (muster_entnahme) und Abschrift sind keine Verkäufe und tauchen hier
// nicht auf: die Funktion bekommt nur kasse_verkaeufe.
//
// Alle Beträge in ganzen Cent, gerundet wird je Steuersatz (kaufmännisch).

export type ProvisionBasis = "netto" | "brutto";

export interface VerkaufZeile {
  ean: string;
  artikel_name: string;
  menge: number;
  einzelpreis_brutto: number; // Euro, wie in kasse_verkaeufe
  mwst_satz: number | null; // 0 | 7 | 19, null = im Artikelstamm nicht gepflegt
}

export interface Konditionen {
  provision_pct: number; // 7
  provision_basis: ProvisionBasis;
  kleinunternehmer: boolean;
  miete_netto_ct: number;
}

export interface SatzSumme {
  satz: number;
  brutto_ct: number; // Verkaufserlös brutto
  netto_ct: number; // Verkaufserlös netto
  provision_ct: number; // Provision netto
  gs_netto_ct: number;
  gs_ust_ct: number;
  gs_brutto_ct: number;
}

export interface Position {
  ean: string;
  artikel_name: string;
  satz: number;
  menge: number;
  brutto_ct: number;
}

export interface Abrechnung {
  saetze: SatzSumme[];
  positionen: Position[];
  umsatz_brutto_ct: number;
  provision_ct: number;
  gs_netto_ct: number;
  gs_ust_ct: number;
  gs_brutto_ct: number;
  miete_netto_ct: number;
  rg_ust_ct: number;
  rg_brutto_ct: number;
  vortrag_alt_ct: number;
  auszahlung_ct: number;
  vortrag_neu_ct: number;
  /** Artikel ohne gepflegten MwSt-Satz – mit Ersatzsatz gerechnet, nicht finalisierbar. */
  fehlender_satz: string[];
}

export const MIETE_UST = 19;
/** Ersatzsatz für die Live-Vorschau, solange ein Artikel keinen Satz hat (Lebensmittel). */
export const ERSATZ_SATZ = 7;

const rund = (x: number) => Math.round(x + Number.EPSILON * Math.sign(x));
export const inCent = (euro: number) => rund(euro * 100);

export function berechneAbrechnung(
  verkaeufe: VerkaufZeile[],
  k: Konditionen,
  vortragAltCt = 0
): Abrechnung {
  const p = k.provision_pct / 100;
  const fehlend = new Set<string>();

  // Positionen je Artikel und Satz verdichten
  const posMap = new Map<string, Position>();
  for (const v of verkaeufe) {
    const satz = v.mwst_satz ?? ERSATZ_SATZ;
    if (v.mwst_satz == null) fehlend.add(v.artikel_name || v.ean);
    const key = `${v.ean}|${satz}`;
    const pos = posMap.get(key) ?? { ean: v.ean, artikel_name: v.artikel_name, satz, menge: 0, brutto_ct: 0 };
    pos.menge += v.menge;
    pos.brutto_ct += inCent(v.einzelpreis_brutto * v.menge);
    posMap.set(key, pos);
  }
  const positionen = [...posMap.values()].sort((a, b) => a.artikel_name.localeCompare(b.artikel_name, "de"));

  // je Steuersatz
  const bruttoJeSatz = new Map<number, number>();
  for (const pos of positionen) bruttoJeSatz.set(pos.satz, (bruttoJeSatz.get(pos.satz) ?? 0) + pos.brutto_ct);

  const saetze: SatzSumme[] = [...bruttoJeSatz.entries()]
    .sort(([a], [b]) => a - b)
    .map(([satz, brutto_ct]) => {
      const s = satz / 100;
      const netto_ct = rund(brutto_ct / (1 + s));
      let gs_netto_ct: number;
      if (k.provision_basis === "netto") {
        gs_netto_ct = netto_ct - rund(netto_ct * p);
      } else {
        const gsBrutto = brutto_ct - rund(brutto_ct * p);
        gs_netto_ct = rund(gsBrutto / (1 + s));
      }
      const gs_ust_ct = k.kleinunternehmer ? 0 : rund(gs_netto_ct * s);
      return {
        satz,
        brutto_ct,
        netto_ct,
        provision_ct: netto_ct - gs_netto_ct,
        gs_netto_ct,
        gs_ust_ct,
        gs_brutto_ct: gs_netto_ct + gs_ust_ct,
      };
    });

  const sum = (f: (s: SatzSumme) => number) => saetze.reduce((a, s) => a + f(s), 0);
  const gs_brutto_ct = sum((s) => s.gs_brutto_ct);
  const miete_netto_ct = Math.max(0, k.miete_netto_ct);
  const rg_ust_ct = rund((miete_netto_ct * MIETE_UST) / 100);
  const rg_brutto_ct = miete_netto_ct + rg_ust_ct;

  const saldo = gs_brutto_ct - rg_brutto_ct - Math.max(0, vortragAltCt);
  return {
    saetze,
    positionen,
    umsatz_brutto_ct: sum((s) => s.brutto_ct),
    provision_ct: sum((s) => s.provision_ct),
    gs_netto_ct: sum((s) => s.gs_netto_ct),
    gs_ust_ct: sum((s) => s.gs_ust_ct),
    gs_brutto_ct,
    miete_netto_ct,
    rg_ust_ct,
    rg_brutto_ct,
    vortrag_alt_ct: Math.max(0, vortragAltCt),
    auszahlung_ct: Math.max(0, saldo),
    vortrag_neu_ct: Math.max(0, -saldo),
    fehlender_satz: [...fehlend],
  };
}

/** Miete eines Monats: voll, sobald der Vertrag im Monat begonnen hat. */
export function mieteImMonat(mieteNettoEuro: number, vertragsbeginn: string | null, zeitraum: string): number {
  if (!mieteNettoEuro) return 0;
  if (vertragsbeginn && vertragsbeginn.slice(0, 7) > zeitraum) return 0;
  return inCent(mieteNettoEuro);
}

export function monatsGrenzen(zeitraum: string): { von: string; bis: string } {
  const [j, m] = zeitraum.split("-").map(Number);
  // Europe/Berlin: Monatsgrenze in lokaler Zeit; Supabase vergleicht timestamptz.
  const von = new Date(Date.UTC(j, m - 1, 1));
  const bis = new Date(Date.UTC(j, m, 1));
  const off = (d: Date) => {
    const s = d.toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
    const lokal = new Date(s.replace(" ", "T") + "Z");
    return lokal.getTime() - d.getTime();
  };
  return {
    von: new Date(von.getTime() - off(von)).toISOString(),
    bis: new Date(bis.getTime() - off(bis)).toISOString(),
  };
}

export const euro = (ct: number) =>
  (ct / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function aktuellerZeitraum(d = new Date()): string {
  const s = d.toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
  return s.slice(0, 7);
}

// ── Prüfungen für das Onboarding ────────────────────────────────────────────

/** IBAN-Prüfziffer (ISO 13616, mod 97). */
export function ibanGueltig(roh: string): boolean {
  const iban = roh.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  if (iban.startsWith("DE") && iban.length !== 22) return false;
  const umgestellt = iban.slice(4) + iban.slice(0, 4);
  const ziffern = umgestellt.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const ch of ziffern) rest = (rest * 10 + Number(ch)) % 97;
  return rest === 1;
}

/** EAN-8/EAN-13/GTIN-14 Prüfziffer. */
export function eanGueltig(roh: string): boolean {
  const ean = roh.replace(/\s+/g, "");
  if (!/^(\d{8}|\d{12,14})$/.test(ean)) return false;
  const ziffern = ean.split("").map(Number);
  const pruef = ziffern.pop()!;
  const summe = ziffern
    .reverse()
    .reduce((a, z, i) => a + z * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (summe % 10)) % 10 === pruef;
}

/** Deutsche USt-IdNr. grob: DE + 9 Ziffern. Andere Länder: 2 Buchstaben + 2–12 Zeichen. */
export function ustIdPlausibel(roh: string): boolean {
  const u = roh.replace(/\s+/g, "").toUpperCase();
  if (u.startsWith("DE")) return /^DE\d{9}$/.test(u);
  return /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(u);
}

export const GUTSCHRIFT_ZUSTIMMUNG_VERSION = "2026-11-18";
export const GUTSCHRIFT_ZUSTIMMUNG_TEXT =
  "Wir sind damit einverstanden, dass Hub42 über die in Kommission verkaufte Ware monatlich im " +
  "Gutschriftverfahren (§ 14 Abs. 2 Satz 2 UStG) abrechnet. Die Gutschrift gilt als unsere Rechnung. " +
  "Wir prüfen sie und widersprechen innerhalb von 14 Tagen, wenn etwas nicht stimmt. " +
  "Änderungen an Firma, Anschrift, Steuernummer oder USt-IdNr. teilen wir sofort mit.";
