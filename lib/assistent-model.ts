// Bewerbungs-Assistent: Fragen, Regel-Check, Abverkaufsschätzung und
// Einstiegsempfehlung.
//
// Rein und ohne Datenzugriff (Client und Server Action importieren beides).
// Die Fit-Regeln sind dieselben wie in /pipeline (lib/pipeline-model.ts),
// nur aus den Antworten der Marke statt aus recherchierten Feldern. Die
// Abverkaufsbasis ist der Funnel aus dem Businessplan (Anhang E.6/E.7).

import { HUB_MARGIN_PCT } from "@/lib/deck-economics";
import { mieteMonat, potenzial, type Potenzial } from "@/lib/karte-model";
import type { PreisUrteil } from "@/lib/karte-model";
import type { ZoneKey } from "@/lib/neue-ui/regal";
import type { HaltungTag, KategorieKanonisch } from "@/lib/pipeline-model";
import type { EinstiegKey } from "@/lib/treppe";

/* ── Fragen ───────────────────────────────────────────────────── */

export const VERTRIEB = {
  nur_shop: { label: "Nur eigener Shop oder Markt", hint: "online, Märkte, Direktverkauf" },
  wenige: { label: "In ein paar Läden", hint: "weniger als 10 Händler" },
  fachhandel: { label: "Im Fachhandel", hint: "10 bis 100 Händler" },
  leh_breit: { label: "Breit im Supermarkt", hint: "Ketten, Drogerien, überregional" },
} as const;
export type VertriebKey = keyof typeof VERTRIEB;

export const EIGENTUM = {
  gruender: { label: "Uns Gründern", hint: "selbst finanziert" },
  angels: { label: "Gründern mit Business Angels", hint: "kleine Beteiligungen" },
  vc: { label: "Mit Venture Capital", hint: "Finanzierungsrunden" },
  konzern: { label: "Einem Konzern", hint: "Tochter oder Mehrheitsbeteiligung" },
} as const;
export type EigentumKey = keyof typeof EIGENTUM;

/** Die drei buchbaren Regalfronten: S, M und L ab 50 cm. */
export const BREITEN = [13, 25, 50] as const;

/** Die eine Frage, die keine Website beantwortet: Was willst du erreichen?
    Jedes Ziel zeigt auf die Stufe der Treppe, die genau das liefert. */
export const ZIELE = {
  sichtbarkeit: { label: "Sichtbar werden", hint: "Menschen sollen meine Marke im Laden entdecken", einstieg: "standardregal" },
  testen: { label: "Testen, ob es sich verkauft", hint: "echter Abverkauf statt Bauchgefühl", einstieg: "testen" },
  retail_ready: { label: "Retail ready werden", hint: "EAN, Etikett, Kalkulation, Lieferfähigkeit prüfen", einstieg: "testen" },
  beweis: { label: "Abverkauf beweisen", hint: "Zahlen für Händler, Investoren, Marktplätze", einstieg: "beweisen" },
  verstehen: { label: "Verstehen, wer kauft", hint: "Zielgruppe, Preis, Packung", einstieg: "studie" },
  listung: { label: "Listung im Handel vorbereiten", hint: "den Einkauf mit Daten überzeugen", einstieg: "studie" },
} as const satisfies Record<string, { label: string; hint: string; einstieg: EinstiegKey }>;
export type ZielKey = keyof typeof ZIELE;

/** Füllfragen, während die KI liest – beide brauchen wir fürs Onboarding. */
export const STARTS = {
  eroeffnung: { label: "Zur Eröffnung im März 2027", hint: "Preis 12 Monate vertraglich fest" },
  spaeter: { label: "Später in 2027", hint: "wenn die Ware oder das Budget so weit ist" },
  offen: { label: "Weiß ich noch nicht", hint: "erst mal schauen, was sich rechnet" },
} as const;
export type StartKey = keyof typeof STARTS;

export const HANDELSREIFE = {
  ean: "EAN-Barcode auf dem Produkt",
  etikett: "Deutsches Pflichtetikett",
  rechnung: "Rechnung mit Umsatzsteuer",
  liefern: "Nachlieferung innerhalb einer Woche",
} as const;
export type ReifeKey = keyof typeof HANDELSREIFE;

/** Höchstens so viele Produkte wählt die Marke im Assistenten. */
export const MAX_PRODUKTE = 5;
/** So viel Front braucht ein Produkt mindestens. */
export const CM_JE_PRODUKT = 5;

export interface AssistentAntworten {
  /** Was die Marke erreichen will (Mehrfachwahl). */
  ziele: ZielKey[];
  start: StartKey | "";
  /** Was die Marke für den Handel schon hat. */
  handelsreife: ReifeKey[];
  kategorie: KategorieKanonisch | "";
  vertrieb: VertriebKey | "";
  eigentum: EigentumKey | "";
  haltung: HaltungTag[];
  /** Was das Produkt besonders macht (für 4,64 €/cm). */
  besonders: string;
  cm: number;
  zone: ZoneKey;
  /** KI-Einschätzung, wie gut das Produkt im Laden läuft (0,5–1,5). */
  faktor: number;
  faktorGrund: string;
}

/* ── Regeln ───────────────────────────────────────────────────── */

export interface Regel {
  label: string;
  ok: boolean | null; // null = noch nicht beantwortet
  text: string;
}


export function regeln(a: AssistentAntworten, preis: number | null, urteil: PreisUrteil | null = null) {
  // Unser erster Grundsatz: ins Regal kommt, was überzeugt, nicht wer am
  // meisten zahlt. Endgültig prüfen wir das am Produkt selbst.
  const belegt = a.besonders.trim().length >= 20 || a.haltung.length > 0;
  const qualitaet: Regel = {
    label: "Qualität vor Preis",
    ok: belegt ? true : null,
    text: belegt
      ? "Bei uns zählt das Produkt, nicht das Budget. Probieren und prüfen wir im Onboarding persönlich."
      : "Bei uns zählt das Produkt, nicht das Budget. Erzähl uns, was es besonders macht, und wir probieren es im Onboarding.",
  };
  // Auch etablierte Marken und Konzerne sind willkommen, mit Neuprodukten.
  // Deshalb kein ✕, sondern eine Einladung; Eigentum fragen wir gar nicht.
  const nichtUeberall: Regel = {
    label: "Neu im Handel",
    ok: a.vertrieb === "leh_breit" ? null : a.vertrieb ? true : null,
    text:
      a.vertrieb === "leh_breit"
        ? "Du bist schon breit im Handel? Dann bring uns dein Neuprodukt: Was noch nirgends steht, testen wir gern als Erste."
        : a.vertrieb
          ? "Genau dafür ist Hub42 da: entdeckt werden, bevor du überall stehst."
          : "Ob neu oder schon bekannt: Wir testen, was noch nicht überall steht.",
  };
  const fairerPreis: Regel = {
    label: "Preis passt zum Angebot",
    ok: urteil ? urteil.fair : null,
    text: urteil
      ? urteil.grund
      : preis == null
        ? "Sobald wir dein Produkt kennen, schauen wir auf Preis und Leistung."
        : "Preis und Leistung schauen wir uns im Onboarding gemeinsam an.",
  };
  // Handelsreife bremst nie aus: Was fehlt, ist genau das, was Stufe 1 prüft.
  const fehlt = (Object.keys(HANDELSREIFE) as ReifeKey[]).filter((k) => !a.handelsreife.includes(k));
  const reife: Regel = {
    label: "Handelsreife",
    ok: fehlt.length === 0 ? true : null,
    text:
      fehlt.length === 0
        ? "Barcode, Etikett, Rechnung, Nachlieferung: du bist retail ready."
        : `Fehlt noch: ${fehlt.map((k) => HANDELSREIFE[k]).join(", ")}. Genau das prüft der Handelsreife-Check in Stufe 1.`,
  };
  const haltung: Regel = {
    label: "Haltung erkennbar",
    ok: a.haltung.length > 0,
    text: a.haltung.length ? a.haltung.join(" · ") : "Wofür stehst du? Das zeigen wir am Regal.",
  };

  const passt = [nichtUeberall, fairerPreis].every((r) => r.ok !== false);
  return { liste: [qualitaet, nichtUeberall, fairerPreis, reife, haltung], passt };
}

/* ── Abverkauf ────────────────────────────────────────────────── */

/** Funnel: Center-Zahl als Rahmen, gerechnet wird ab der Ladentür.
    Stand Geschäftsführung 2026-10-20: 41.000 Besucher am Tag zählt das
    Alexa-Center, im Laden rechnet Hub42 mit 400 bis 500 am Tag (Annahme,
    gerechnet mit dem Mittelwert). Übrige Quoten aus dem Businessplan V17,
    Anhang E.6/E.7. */
export const FUNNEL = {
  centerTag: 41_000, // Besucher am Tag im Alexa-Center, nicht im Laden
  ladenTagVon: 400, // Besucher am Tag im Laden, Annahme
  ladenTagBis: 500,
  ladenTag: 450, // Mittelwert der Annahme, damit wird gerechnet
  probieren: 0.22, // scannen QR oder probieren
  kaufen: 0.21, // Tasting-to-Buy
  warenkorb: 22, // € je Einkauf
  // Annahmen für die Verteilung auf Produkte (nicht im Businessplan, prüfen):
  artikelJeEinkauf: 2, // 22 € Warenkorb bei rund 11 € Ø-Preis
  produkteImLaden: 300, // 80–120 Marken (Anhang E.7) × rund 3 Produkte
};
/** Verkaufstage im Monat, eine Basis für Sichtbarkeit, Abverkauf und
    Rechnung (Geschäftsführung 2026-10-21, Annahme). */
export const VERKAUFSTAGE = 25;
export const STORE_BESUCHER_MONAT = FUNNEL.ladenTag * VERKAUFSTAGE;
/** Einkäufe im Monat laut Funnel: rund 21 am Verkaufstag. */
export const EINKAEUFE_MONAT = STORE_BESUCHER_MONAT * FUNNEL.probieren * FUNNEL.kaufen;
/* Verteilt wird je Produkt, nicht je Zentimeter: Kunden greifen zu
   Produkten. Je cm verteilt bekäme eine 10-cm-Marke nur 1/714 aller
   Verkäufe, obwohl der Plan mit rund 70 cm je Marke rechnet – das machte
   kleine Marken künstlich schlecht. Summe bleibt der Plan-Umsatz. */
/** Verkäufe je Produkt und Monat bei Faktor 1: rund 3,5. */
export const STUECK_PRO_PRODUKT = (EINKAEUFE_MONAT * FUNNEL.artikelJeEinkauf) / FUNNEL.produkteImLaden;
const PROBIERER_PRO_PRODUKT = (STORE_BESUCHER_MONAT * FUNNEL.probieren) / FUNNEL.produkteImLaden;

export const klemmeFaktor = (f: number) => (Number.isFinite(f) ? Math.min(1.5, Math.max(0.5, f)) : 1);

export interface Schaetzung {
  /** Verkäufe pro Monat: vorsichtig, erwartet, gut. */
  stueck: { tief: number; mitte: number; hoch: number };
  umsatzMonat: number;
  probiererMonat: number;
  storeBesucherMonat: number;
  rechnung: Potenzial;
}

/** vk = Ø-Ladenpreis der gewählten Produkte, anzahl = wie viele es sind. */
export function schaetzung(a: AssistentAntworten, vk: number, anzahl = 1): Schaetzung {
  const f = klemmeFaktor(a.faktor);
  const mitte = Math.max(1, Math.round(STUECK_PRO_PRODUKT * Math.max(1, anzahl) * f));
  return {
    stueck: { tief: Math.max(1, Math.round(mitte * 0.7)), mitte, hoch: Math.round(mitte * 1.3) },
    umsatzMonat: mitte * vk,
    probiererMonat: Math.round(PROBIERER_PRO_PRODUKT * Math.max(1, anzahl) * f),
    storeBesucherMonat: STORE_BESUCHER_MONAT,
    rechnung: potenzial({ vk, verkaeufeMonat: mitte, zone: a.zone, cm: a.cm }),
  };
}

/* ── Rechnung: ab wann sich die Regalfront selbst bezahlt ────────
   Gerechnet netto: Ladenpreis ohne Umsatzsteuer, minus 7 % Provision auf
   den Bruttopreis (so rechnet die Provision im Vertrag und in karte-model).
   Die Miete ist netto. Umsatzsteuer vereinfacht nach Kategorie
   (Geschäftsführung 2026-10-21); hier ändern, wenn der Steuerberater es
   anders sieht. Unbekannte Kategorie: Regelsatz. */
export const UST_REGELSATZ_PCT = 19;
export const UST_PCT_NACH_KATEGORIE: Record<KategorieKanonisch, number> = {
  Food: 7,
  Drinks: 19,
  Beauty: 19,
  Lifestyle: 19,
  Home: 19,
  Sonstiges: 19,
};

export const ustPct = (kategorie: KategorieKanonisch | ""): number =>
  kategorie ? (UST_PCT_NACH_KATEGORIE[kategorie] ?? UST_REGELSATZ_PCT) : UST_REGELSATZ_PCT;

/** Was der Marke je Verkauf netto bleibt, vor Wareneinsatz. */
export const nettoJeVerkauf = (vk: number, kategorie: KategorieKanonisch | ""): number =>
  vk / (1 + ustPct(kategorie) / 100) - vk * (HUB_MARGIN_PCT / 100);

export interface Rechnung {
  besucherMonat: number;
  miete: number;
  kostenJe1000: number;
  /** Verkäufe im Monat, ab denen der Erlös nach Provision die Miete deckt. */
  schwelle: number;
  /** schwelle je Verkaufstag, auf eine Nachkommastelle, aus der gerundeten Monatszahl. */
  schwelleTag: number;
  anteilMin: number;
  anteilMax: number;
  /** Lage der Schätzung zur Schwelle. */
  fall: "darunter" | "dazwischen" | "darueber";
}

export function rechnung(a: AssistentAntworten, vk: number, s: Schaetzung): Rechnung {
  const miete = mieteMonat(a.zone, a.cm);
  const netto = nettoJeVerkauf(vk, a.kategorie);
  const schwelle = netto > 0 ? Math.ceil(miete / netto) : Infinity;
  const schwelleTag = Math.round((schwelle / VERKAUFSTAGE) * 10) / 10;
  const anteil = (n: number) => (miete > 0 ? Math.round(((n * netto) / miete) * 100) : 0);
  const { tief, hoch } = s.stueck;
  return {
    besucherMonat: STORE_BESUCHER_MONAT,
    miete,
    kostenJe1000: miete > 0 ? (miete / STORE_BESUCHER_MONAT) * 1000 : 0,
    schwelle,
    schwelleTag,
    anteilMin: anteil(tief),
    anteilMax: anteil(hoch),
    fall: hoch < schwelle ? "darunter" : tief < schwelle ? "dazwischen" : "darueber",
  };
}

/* ── Einstieg ─────────────────────────────────────────────────── */

/** Die höchste Stufe, die eines der Ziele braucht. Ohne Ziel wie bisher aus dem Vertrieb. */
export function empfohlenerEinstieg(a: AssistentAntworten, hatOnlineshop: boolean): EinstiegKey {
  if (a.vertrieb === "leh_breit" || a.eigentum === "konzern") return "studie";
  const rang: EinstiegKey[] = ["standardregal", "testen", "beweisen", "studie"];
  if (a.ziele.length) {
    return a.ziele.map((z) => ZIELE[z].einstieg as EinstiegKey).sort((x, y) => rang.indexOf(y) - rang.indexOf(x))[0];
  }
  if (a.vertrieb === "fachhandel") return "studie";
  if (a.vertrieb === "nur_shop" && hatOnlineshop) return "beweisen";
  return "testen";
}

