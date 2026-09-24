/* ============================================================
   /neue-ui – Regalwand: Daten und Rechenregeln

   Die Preise kommen aus lib/deck-economics.ts, damit die neue UI
   nicht zur zweiten Wahrheit neben /deck und /hersteller wird.
   Gezeigt wird durchgehend die Tranche "first_mover"
   (Gründungskonditionen) – wie auf der übrigen Website.

   Nur hier drin steht, was NICHT aus dem Preismodell folgt:
   Belegung der Wand, Produktmaße in cm, Stationen des Rundgangs.
   Das ist Mockup-Material, kein Vertragsstand.
   ============================================================ */

import {
  RATES,
  RATES_BESONDERER_WERT,
  MIN_SLOT_MIETE_BESONDERER_WERT,
  ZONE_SURCHARGE_PCT,
  MIN_REGAL_CM,
  MIN_SLOT_MIETE,
} from "@/lib/deck-economics";

export type ZoneKey = "augenhoehe" | "greifhoehe" | "basis";

export interface Zone {
  name: string;
  hoehe: string;
  /** Zonenaufschlag in Prozent auf den Grundpreis je cm. */
  auf: number;
  /** Sichtbare Tiefe der Auflagefläche in px – je tiefer die Ebene, desto mehr Aufsicht. */
  deck: number;
  hint: string;
  pick?: boolean;
}

export const ZONES: Record<ZoneKey, Zone> = {
  augenhoehe: {
    name: "Augenhöhe",
    hoehe: "130–170 cm",
    auf: ZONE_SURCHARGE_PCT.augenhoehe,
    deck: 0,
    hint: "Sofort im Blickfeld",
  },
  greifhoehe: {
    name: "Greifhöhe garantiert",
    hoehe: "90–130 cm",
    auf: ZONE_SURCHARGE_PCT.greifhoehe,
    deck: 12,
    hint: "Garantierte Greifzone — höchste Conversion",
    pick: true,
  },
  basis: {
    name: "Basis",
    hoehe: "50–90 cm",
    auf: ZONE_SURCHARGE_PCT.basis,
    deck: 28,
    hint: "Einstieg, Markttest",
  },
};

/** Von oben nach unten, so wie die Wand steht. */
export const ORDER: ZoneKey[] = ["augenhoehe", "greifhoehe", "basis"];

export const MIN_CM = MIN_REGAL_CM;

/** Breite, die sich die konfigurierbare Front und ihre Nachbarin teilen. */
export const CONF_POOL = 32;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** €/cm und Monat in dieser Zone (Gründungskonditionen). */
export const rate = (zone: ZoneKey): number => RATES[zone];

/** Monatsmiete einer Front – die Mindestmiete greift bei schmalen Fronten. */
export const miete = (cm: number, zone: ZoneKey): number =>
  Math.max(MIN_SLOT_MIETE, round2(cm * rate(zone)));

/** Dasselbe für Produkte mit besonderem Wert (nur auf Bewerbung). */
export const rateBesonders = (zone: ZoneKey): number => RATES_BESONDERER_WERT[zone];
export const mieteBesonders = (cm: number, zone: ZoneKey): number =>
  Math.max(MIN_SLOT_MIETE_BESONDERER_WERT, round2(cm * rateBesonders(zone)));

export const eur = (n: number): string =>
  n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export interface BelegteFront {
  free?: false;
  id: string;
  marke: string;
  produkt: string;
  kat: string;
  herkunft: string;
  /** Regalfront in Zentimetern. */
  cm: number;
  /** Produkthöhe in Zentimetern. */
  h: number;
  img: string;
  /** Feinjustage des freigestellten Produktfotos im Frontkasten. */
  zoom: number;
  dy: string;
  crop?: boolean;
  note: string;
}

export interface FreieFront {
  free: true;
  cm: number;
  /** Die Front mit dem Ziehgriff. */
  conf?: boolean;
  /** Ihre Nachbarin – gibt ab, was der Griff nimmt. */
  buddy?: boolean;
}

export type Front = BelegteFront | FreieFront;

export const istFrei = (f: Front): f is FreieFront => f.free === true;

/** Belegung der Regalwand A: drei Ebenen à 84 cm. */
export const WALL: Record<ZoneKey, Front[]> = {
  augenhoehe: [
    {
      id: "tekoha",
      marke: "Tekoha",
      produkt: "Matekaffee",
      kat: "Kaffee",
      herkunft: "Berlin / Paraguay",
      cm: 18,
      h: 18,
      img: "/brands/tekoha-matekaffee.jpg",
      zoom: 1.28,
      dy: "22%",
      note: "100 % pulverisierter Mate-Extrakt in Sticks. Koffein wie Kaffee, ohne die Säure.",
    },
    {
      id: "sixspice",
      marke: "Berlin Oats",
      produkt: "Crunchy Six Spice Granola",
      kat: "Granola",
      herkunft: "Berlin",
      cm: 22,
      h: 24,
      img: "/brands/berlin-oats-sixspice.png",
      zoom: 1.34,
      dy: "17%",
      note: "320 g Knuspermüsli mit sechs Gewürzen, ohne künstliche Zusätze.",
    },
    { free: true, cm: 20 },
    { free: true, cm: 24 },
  ],
  greifhoehe: [
    {
      id: "crazy",
      marke: "Crazy Bastard Sauce",
      produkt: "7 Pot Tropical",
      kat: "Hot Sauce",
      herkunft: "Berlin Neukölln",
      cm: 14,
      h: 17,
      img: "/brands/crazy-bastard-7pot.png",
      zoom: 1.42,
      dy: "14%",
      note: "Seit 2013 in Neukölln handgemacht, rund 1.200 Flaschen am Tag. Geröstete Chilis, kein Zuckerzusatz.",
    },
    {
      id: "matcha",
      marke: "Berlin Oats",
      produkt: "Crunchy Matcha Granola",
      kat: "Granola",
      herkunft: "Berlin",
      cm: 22,
      h: 24,
      img: "/brands/berlin-oats-matcha.png",
      zoom: 1.34,
      dy: "19%",
      note: "Knuspermüsli mit Matcha-Grüntee. Die Sorte, die an der Theke am häufigsten leer wird.",
    },
    {
      id: "green",
      marke: "Green Naturals",
      produkt: "Ashwagandha 2.500 mg",
      kat: "Supplements",
      herkunft: "Deutschland",
      cm: 16,
      h: 19,
      img: "/brands/green-naturals-ashwagandha.png",
      zoom: 1.36,
      dy: "10%",
      note: "180 Kapseln, vegan. Nahrungsergänzung, die sonst nur online zu finden ist.",
    },
    { free: true, cm: 20, conf: true },
    { free: true, cm: 12, buddy: true },
  ],
  basis: [
    {
      id: "auteniq",
      marke: "auteniQ",
      produkt: "Bio-Olivenöl Arbequina, 3 l",
      kat: "Feinkost",
      herkunft: "Katalonien / Deutschland",
      cm: 20,
      h: 25,
      img: "/brands/auteniq-olivenoel.png",
      zoom: 1.12,
      dy: "8%",
      crop: true,
      note: "Natives Olivenöl extra vom Erzeuger, 3-Liter-Kanister. Venda de proximitat, IFS Food.",
    },
    { free: true, cm: 24 },
    { free: true, cm: 28 },
    /* 12 × 7,00 € = 84 € → Mindestmiete 89 € greift */
    { free: true, cm: 12 },
  ],
};

/** Maßband: fünf Produkte auf einer Zentimeterskala. */
export interface MassbandProdukt {
  cm: number;
  h: number;
  img: string;
  zoom: number;
  dy: string;
  crop?: boolean;
}

export const HERO: MassbandProdukt[] = [
  { cm: 14, h: 17, img: "/brands/crazy-bastard-7pot.png", zoom: 1.42, dy: "14%" },
  { cm: 22, h: 24, img: "/brands/berlin-oats-matcha.png", zoom: 1.34, dy: "19%" },
  { cm: 16, h: 19, img: "/brands/green-naturals-ashwagandha.png", zoom: 1.36, dy: "10%" },
  { cm: 18, h: 18, img: "/brands/tekoha-matekaffee.jpg", zoom: 1.28, dy: "22%" },
  { cm: 20, h: 25, img: "/brands/auteniq-olivenoel.png", zoom: 1.12, dy: "8%", crop: true },
];

/** Abstand zwischen zwei Produkten auf dem Maßband, in Zentimetern. */
export const GAP_CM = 6;

/** Rundgang: Stationen im Konzeptfoto und im Grundriss. */
export interface Station {
  id: string;
  t: string;
  /** Position des Pins im Foto. */
  x: string;
  y: string;
  d: string;
}

export const STOPS: Station[] = [
  {
    id: "schaufenster",
    t: "Schaufenster",
    x: "6%",
    y: "34%",
    d: "6,5 m Glasfront zum Alexa-Hauptgang. 41.000 Menschen gehen täglich vorbei, 140 € im Monat.",
  },
  {
    id: "tasting",
    t: "Verkostung",
    x: "16%",
    y: "62%",
    d: "Theke direkt am Fenster. Vier Marken pro Woche, freitags mit dem Hersteller.",
  },
  {
    id: "gondelA",
    t: "Gondel A",
    x: "40%",
    y: "48%",
    d: "Freistehend, doppelseitig, auf Rollen. Kopfkarte oben trägt den Markennamen.",
  },
  {
    id: "gondelB",
    t: "Gondel B",
    x: "62%",
    y: "48%",
    d: "Zweite Gondel im Mittelgang. Wechselt monatlich das Thema.",
  },
  {
    id: "wandB",
    t: "Regalwand B",
    x: "50%",
    y: "30%",
    d: "Rückwand mit Schwerlastregal und Wortmarke. Neuheiten der Woche.",
  },
  {
    id: "markenwand",
    t: "Markenwand",
    x: "84%",
    y: "28%",
    d: "Gerahmte Markengeschichten an der rechten Wand. Wer macht das, und warum.",
  },
  {
    id: "kasse",
    t: "Kasse",
    x: "89%",
    y: "58%",
    d: "QR-Bon statt Papier. Jede Marke sieht ihre Verkäufe im Monatsbericht.",
  },
];
