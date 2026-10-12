/**
 * Reine Datenlogik für die SumUp-Kasse (/kasse) – ohne Netz, ohne DB.
 *
 * Absichtlich neutral (weder "server-only" noch "use client"), damit die
 * Client-Komponente die Konstanten nutzen kann, ohne lib/sumup.ts (Secret Key,
 * Service-Role) ins Browser-Bundle zu ziehen – gleiche Aufteilung wie
 * lib/pipeline-model.ts.
 */

export const KASSE_STANDORT = "alexa-berlin";
export const KASSE_ID_SUMUP = "sumup-app";

// Gleiche Werte wie der Kassen-Kern (kassensystem/core/bon.py), plus "d".
export const GESCHLECHTER = [
  { value: "w", label: "weiblich" },
  { value: "m", label: "männlich" },
  { value: "d", label: "divers" },
] as const;

export const ALTERSGRUPPEN = ["<20", "20-29", "30-39", "40-49", "50-59", "60+"] as const;

export type Geschlecht = (typeof GESCHLECHTER)[number]["value"];
export type Altersgruppe = (typeof ALTERSGRUPPEN)[number];

export interface SumUpProdukt {
  name: string;
  menge: number;
  einzelpreis_brutto: number;
  mwst_satz: number;
  summe_brutto: number;
}

/** Was wir von einer SumUp-Transaktion behalten – ohne Karte/GPS/Auth-Code. */
export interface SumUpZahlung {
  id: string;
  transaction_code: string | null;
  zeitstempel: string;
  betrag: number;
  mwst: number | null;
  trinkgeld: number;
  gebuehr: number | null;
  erstattet: number;
  status: string;
  zahlart: "karte" | "bar" | "sonstige";
  zahlweise: string | null;
  benutzer: string | null;
  produkte: SumUpProdukt[];
}

/** Zeile aus sumup_transaktionen. */
export interface GespeicherteZahlung extends SumUpZahlung {
  nicht_zugeordnet: string[];
  verkaeufe_gebucht: boolean;
}

export interface KassenZahlung extends GespeicherteZahlung {
  umfrage: { geschlecht: string | null; alter_gruppe: string | null } | null;
}

export interface ArtikelRef {
  ean: string;
  artikel_name: string;
  brand_id: string | null;
}

const zahl = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const zahlOderNull = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : zahl(v);

/** Detail-Antwort von GET /v2.1/merchants/{code}/transactions?id=… → SumUpZahlung. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ausApiDetail(d: any): SumUpZahlung {
  const produkte: SumUpProdukt[] = (Array.isArray(d.products) ? d.products : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => ({
      name: String(p.name ?? "").trim(),
      menge: zahl(p.quantity) || 1,
      einzelpreis_brutto: zahl(p.price_with_vat ?? p.price),
      mwst_satz: zahl(p.vat_rate),
      summe_brutto: zahl(p.total_with_vat ?? p.total_price),
    })
  );

  // Gebühr steht in den Auszahlungs-Events – vor der Abrechnung noch leer.
  const events: unknown[] = Array.isArray(d.events) ? d.events : [];
  const gebuehren = events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => e?.fee_amount)
    .filter((f) => typeof f === "number") as number[];

  const typ = String(d.payment_type ?? "").toUpperCase();
  return {
    id: String(d.id),
    transaction_code: d.transaction_code ?? null,
    zeitstempel: String(d.timestamp),
    betrag: zahl(d.amount),
    mwst: zahlOderNull(d.vat_amount),
    trinkgeld: zahl(d.tip_amount),
    gebuehr: gebuehren.length ? Math.round(gebuehren.reduce((a, b) => a + b, 0) * 100) / 100 : null,
    erstattet: zahl(d.refunded_amount),
    status: String(d.status ?? "UNKNOWN").toUpperCase(),
    zahlart: typ === "CASH" ? "bar" : typ === "POS" || typ === "ECOM" ? "karte" : "sonstige",
    zahlweise: d.entry_mode ? String(d.entry_mode).toLowerCase() : null,
    benutzer: d.username ?? d.user ?? null,
    produkte,
  };
}

/** Vergleichsschlüssel für Artikelnamen: Groß/klein, Akzente, Mehrfach-Leerzeichen egal. */
export function normalisiereName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // Akzente (kombinierende Zeichen) entfernen
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

export interface Zuordnung {
  index: number;
  produkt: SumUpProdukt;
  artikel: ArtikelRef | null;
}

/**
 * SumUp liefert pro Position nur den Namen – keine EAN/SKU. Zuordnung daher
 * über den normalisierten Namen. Ist ein Name im Artikelstamm doppelt, wird
 * NICHT geraten: lieber "nicht zugeordnet" als eine falsche Brand abrechnen.
 */
export function ordneZu(produkte: SumUpProdukt[], artikel: ArtikelRef[]): Zuordnung[] {
  const nachName = new Map<string, ArtikelRef | "mehrdeutig">();
  for (const a of artikel) {
    const k = normalisiereName(a.artikel_name);
    nachName.set(k, nachName.has(k) ? "mehrdeutig" : a);
  }
  return produkte.map((produkt, index) => {
    const treffer = nachName.get(normalisiereName(produkt.name));
    return { index, produkt, artikel: treffer && treffer !== "mehrdeutig" ? treffer : null };
  });
}

/** Nur erfolgreiche, nicht (voll) erstattete Zahlungen werden als Verkauf gebucht. */
export function istBuchbar(z: Pick<SumUpZahlung, "status" | "betrag" | "erstattet">): boolean {
  return z.status === "SUCCESSFUL" && z.erstattet < z.betrag;
}
