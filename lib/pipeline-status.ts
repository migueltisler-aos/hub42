// Statusleiste über der internen Pipeline: die Kette vom ersten Anschreiben bis
// zur Ware im Regal, in Zahlen, die man ohne Erklärung weitersagen kann.
//
// Leitsatz dieser Datei: jede Zahl nennt ihre Quelle, und eine Quelle, in die
// niemand schreibt, meldet das, statt stolz eine 0 zu zeigen. Sonst liest ein
// Partner die Lücke als Ergebnis.
import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { KASSE_STANDORT, standortName } from "@/lib/sumup-model";

/** Stufen, die als „im Gespräch“ zählen: nach der Antwort, vor dem Abschluss. */
const IM_GESPRAECH = ["Interesse", "Gespräch", "Angebot"];

/** Stufen, die gar nicht erst mitzählen. */
const RAUS = ["Gesperrt"];

export type StatusZahl = {
  /** Kurzer Name, so wie man ihn im Gespräch sagt. */
  label: string;
  wert: number;
  /** Einheit hinter der Zahl, etwa „cm“ oder „€“. */
  einheit?: string;
  /** Woher die Zahl kommt, ein Halbsatz. Steht als Fußnote unter der Kachel. */
  quelle: string;
  /** Anteil am vorigen Schritt der Kette, in Prozent. */
  quote?: number;
  /** Aufteilung auf die Läden, ein Halbsatz. Nur bei Zahlen, die sich auf
      mehrere Standorte summieren — sonst liest ein Partner die Summe als
      einen Laden. */
  aufteilung?: string;
  /** Gesetzt, wenn die Quelle leer ist: dann ist die 0 kein Ergebnis, sondern eine Lücke. */
  luecke?: string;
};

export type StatusDaten = {
  /** Zeitpunkt der Abfrage, ISO, für die Stand-Zeile. */
  stand: string;
  kette: StatusZahl[];
  abschluss: StatusZahl[];
};

const prozent = (teil: number, ganz: number) => (ganz > 0 ? Math.round((teil / ganz) * 100) : 0);

/** Eindeutige brand_id aus einer Liste von Zeilen. */
const marken = (zeilen: { brand_id: string | null }[]) =>
  new Set(zeilen.map((z) => z.brand_id).filter((id): id is string => Boolean(id))).size;

export async function ladeStatus(): Promise<StatusDaten> {
  const db = getSupabaseAdmin();

  const [brands, mails, sendungen, zusagen, artikel] = await Promise.all([
    db.from("pipeline_brands").select("id, stufe"),
    db.from("pipeline_email_log").select("brand_id, antwort_am"),
    db.from("wareneingang_sendungen").select("brand_id, eingegangen_am"),
    db.from("crm_zusagen").select("regal_cm, monat_netto, vertragswert_netto, status, standort_id"),
    db.from("kasse_artikelstamm").select("brand_id, standort_id"),
  ]);

  for (const r of [brands, mails, sendungen, zusagen, artikel]) {
    if (r.error) throw new Error(`Pipeline-Status: ${r.error.message}`);
  }

  const brandZeilen = (brands.data ?? []).filter((b) => !RAUS.includes(b.stufe as string));
  const mailZeilen = (mails.data ?? []) as { brand_id: string | null; antwort_am: string | null }[];
  const sendungZeilen = (sendungen.data ?? []) as { brand_id: string | null }[];
  const artikelZeilen = (artikel.data ?? []) as {
    brand_id: string | null;
    standort_id: string | null;
  }[];
  const zusageZeilen = ((zusagen.data ?? []) as {
    regal_cm: number | null;
    monat_netto: string | number | null;
    vertragswert_netto: string | number | null;
    status: string;
    standort_id: string;
  }[]).filter((z) => z.status !== "storniert");

  const erfasst = brandZeilen.length;
  const angeschrieben = marken(mailZeilen);
  const geantwortet = marken(mailZeilen.filter((m) => m.antwort_am));
  const imGespraech = brandZeilen.filter((b) => IM_GESPRAECH.includes(b.stufe as string)).length;
  const kunden = brandZeilen.filter((b) => b.stufe === "Kunde").length;
  const warenMarken = marken(sendungZeilen);
  const artikelMarken = marken(artikelZeilen);

  const summe = (feld: "regal_cm" | "monat_netto" | "vertragswert_netto") =>
    zusageZeilen.reduce((n, z) => n + Number(z[feld] ?? 0), 0);

  /** Die Läden in der Reihenfolge ihres Beitrags, größter zuerst. */
  const standorte = [...new Set(zusageZeilen.map((z) => z.standort_id))];

  /**
   * Aufteilung einer Summe auf die Läden, als Halbsatz. Seit Beeskow
   * dazugekommen ist, summieren diese Zahlen über zwei Häuser: 1.092 cm sind
   * nicht eine Regalwand, sondern zwei. Ein Nullbeitrag wird als „kostenlos“
   * benannt statt als 0 — Beeskow ist ein Probelauf ohne Miete, keine
   * verlorene Fläche.
   */
  const aufteilung = (
    feld: "regal_cm" | "monat_netto" | "vertragswert_netto",
    einheit: string,
  ) => {
    if (standorte.length < 2) return undefined;
    const teile = standorte
      .map((s) => ({
        name: standortName(s),
        wert: zusageZeilen
          .filter((z) => z.standort_id === s)
          .reduce((n, z) => n + Number(z[feld] ?? 0), 0),
      }))
      .sort((a, b) => b.wert - a.wert);
    return teile
      .map((t) =>
        t.wert === 0 && einheit === "€"
          ? `${t.name} kostenlos`
          : `${t.name} ${Math.round(t.wert).toLocaleString("de-DE")} ${einheit}`,
      )
      .join(" · ");
  };

  const markenJeStandort = (s: string) =>
    zusageZeilen.filter((z) => z.standort_id === s).length;

  const artikelZaehlung = new Map<string, number>();
  for (const a of artikelZeilen) {
    const s = a.standort_id ?? "ohne Standort";
    artikelZaehlung.set(s, (artikelZaehlung.get(s) ?? 0) + 1);
  }
  const artikelJeStandort = [...artikelZaehlung.entries()].sort((a, b) => b[1] - a[1]);
  const artikelImLaufendenLaden = artikelZaehlung.get(KASSE_STANDORT) ?? 0;

  const kette: StatusZahl[] = [
    {
      label: "Marken erfasst",
      wert: erfasst,
      quelle: "Markenverzeichnis, ohne gesperrte",
    },
    {
      label: "Angeschrieben",
      wert: angeschrieben,
      quote: prozent(angeschrieben, erfasst),
      quelle: "Marken mit mindestens einer Nachricht im Mail-Log",
    },
    {
      label: "Geantwortet",
      wert: geantwortet,
      quote: prozent(geantwortet, angeschrieben),
      quelle: "Mail-Log, Antwort eingetragen",
    },
    {
      label: "Im Gespräch",
      wert: imGespraech,
      quote: prozent(imGespraech, geantwortet),
      quelle: "Stufe Interesse, Gespräch oder Angebot",
    },
    {
      // Abschlüsse kommen auch aus Messen, Events und Telefonaten, nie nur aus
      // der Mail-Sequenz. Darum wäre eine Quote auf die Antworten hier größer
      // als 100 Prozent und damit irreführend: dann lieber keine Quote.
      label: "Onboarded",
      wert: kunden,
      quote: kunden <= geantwortet ? prozent(kunden, geantwortet) : undefined,
      quelle:
        kunden > geantwortet
          ? "Stufe Kunde, mehr als die Antworten aus dem Mail-Log: ein Teil kam über Events und Telefon"
          : "Stufe Kunde",
    },
    {
      label: "Ware eingegangen",
      wert: warenMarken,
      quote: prozent(warenMarken, kunden),
      quelle: "Erfasste Sendungen im Wareneingang",
      luecke:
        sendungZeilen.length === 0
          ? `Noch kein Paket erfasst. ${artikelMarken} Marken haben bereits Artikel im Kassenstamm, der Eingang wird aber unter /wareneingang gebucht.`
          : undefined,
    },
  ];

  const abschluss: StatusZahl[] = [
    {
      label: "Regal gebucht",
      wert: summe("regal_cm"),
      einheit: "cm",
      quelle:
        standorte.length > 1
          ? `${zusageZeilen.length} aktive Zusagen in ${standorte.length} Läden`
          : `${zusageZeilen.length} aktive Zusagen`,
      aufteilung: aufteilung("regal_cm", "cm"),
    },
    {
      label: "Monatlich netto",
      wert: Math.round(summe("monat_netto")),
      einheit: "€",
      quelle: "Summe der Monatspreise aller aktiven Zusagen",
      aufteilung: aufteilung("monat_netto", "€"),
    },
    {
      label: "Vertragswert netto",
      wert: Math.round(summe("vertragswert_netto")),
      einheit: "€",
      quelle: "Monatspreis mal Laufzeit, über alle aktiven Zusagen",
      aufteilung: aufteilung("vertragswert_netto", "€"),
    },
    {
      label: "Marken im Regal",
      wert: zusageZeilen.length,
      quelle: "Aktive Zusagen, eine Marke kann in beiden Läden stehen",
      aufteilung:
        standorte.length > 1
          ? standorte
              .map((s) => `${standortName(s)} ${markenJeStandort(s)}`)
              .sort()
              .join(" · ")
          : undefined,
    },
    {
      label: "Artikel im Laden",
      wert: artikelZeilen.length,
      quelle: `Kassenstamm, ${artikelMarken} Marken`,
      // Der laufende Laden ist der, auf den es ankommt: was im Alexa liegt,
      // verkauft in Beeskow nichts.
      aufteilung: artikelJeStandort
        .map(([s, n]) => `${standortName(s)} ${n}`)
        .join(" · "),
      luecke:
        artikelImLaufendenLaden === 0
          ? `Kein einziger Artikel für ${standortName(KASSE_STANDORT)}. Ohne Artikel mit EAN, Preis und Steuersatz kann die Kasse dort nichts verkaufen, und es entstehen weder Bestand noch Abverkaufszahlen.`
          : undefined,
    },
  ];

  return { stand: new Date().toISOString(), kette, abschluss };
}
