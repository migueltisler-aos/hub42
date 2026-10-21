// Regalkarte aus der Website der Marke: geteilte Typen und die
// Potenzial-Rechnung.
//
// Rein und ohne Datenzugriff, damit das Formular (Client) und die Server
// Actions dieselben Regeln importieren können (vgl. lib/bewerbung-model.ts).
// Alle Euro-Werte kommen aus lib/deck-economics.ts, nichts wird hier neu
// angenommen.

import {
  DEFAULTS,
  HUB_MARGIN_PCT,
  MIN_REGAL_CM,
  PAKETE,
  paketMiete,
  compute,
  netLEH,
} from "@/lib/deck-economics";
import type { ZoneKey } from "@/lib/neue-ui/regal";
import type { HaltungTag, KategorieKanonisch } from "@/lib/pipeline-model";
import type { EigentumKey, VertriebKey } from "@/lib/assistent-model";

export interface KarteProdukt {
  titel: string;
  /** Bruttopreis in €, null wenn der Shop keinen verrät. */
  preis: number | null;
  bild: string | null;
  url: string | null;
}

/** Texte der A6-Artikelkarte zum gewählten Produkt. */
export interface ArtikelTexte {
  head: string;
  why: string[];
  know: string;
  tip: string;
  chips: string[];
  /** Passt der Preis zum Angebot? Urteil der KI, null wenn unklar. */
  preis: PreisUrteil | null;
}

export interface PreisUrteil {
  fair: boolean;
  grund: string;
}

export interface KarteFarben {
  /** Hauptfarbe (Band) */
  c: string;
  /** Text auf c */
  on: string;
  /** Akzent für Fakten und Zitat */
  acc: string;
  /** Seitenton */
  bg: string;
}

export interface KarteEntwurf {
  marke: string;
  ort: string;
  claim: string;
  story: string;
  fakten: { wert: string; text: string }[];
  farben: KarteFarben;
  logo: string | null;
  /** Großes Bild, falls kein Produktbild gewählt ist (og:image). */
  hero: string | null;
  web: string;
  /** Wer dahintersteht und ein wörtliches Zitat, beides nur wenn belegt. */
  wer: string;
  zitat: string;
  zitatVon: string;
  produkte: KarteProdukt[];
  /** Von der KI erkannt, die Marke bestätigt oder korrigiert im Ergebnis.
      Leerer String = nicht erkennbar. */
  kategorie: KategorieKanonisch | "";
  vertrieb: VertriebKey | "";
  eigentum: EigentumKey | "";
  erkanntGrund: string;
  /** Instagram-Handle von der Website, z. B. "@crazybastardsauce", sonst leer. */
  instagram: string;
  /** Vorschläge für den Assistenten, die Marke bestätigt sie. */
  haltung: HaltungTag[];
  besonders: string;
  faktor: number;
  faktorGrund: string;
}

/** Was mit der Bewerbung gespeichert wird: Entwurf plus die Wahl der Marke. */
export interface KarteAuswahl {
  entwurf: Omit<KarteEntwurf, "produkte" | "haltung" | "besonders" | "faktor" | "faktorGrund" | "kategorie" | "vertrieb" | "eigentum" | "erkanntGrund" | "instagram">;
  produkt: KarteProdukt;
  artikel: ArtikelTexte | null;
  /** Weitere gewählte Produkte, jedes mit eigener Artikelkarte. */
  weitere?: { produkt: KarteProdukt; artikel: ArtikelTexte | null }[];
}

export const HEX_RE = /^#[0-9a-f]{6}$/i;

/* ── Kontrast ─────────────────────────────────────────────────── */

function luminanz(hex: string): number {
  const kanal = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(1) + 0.7152 * kanal(3) + 0.0722 * kanal(5);
}

export function kontrast(a: string, b: string): number {
  const [x, y] = [luminanz(a), luminanz(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Schrift auf der Hauptfarbe: das, was lesbarer ist. */
export const textAuf = (hex: string) =>
  kontrast(hex, "#FFFFFF") >= kontrast(hex, "#1A1A1A") ? "#FFFFFF" : "#1A1A1A";

/** Fängt unlesbare oder kaputte Paletten ab, statt sie zu drucken. */
export function sichereFarben(f: Partial<KarteFarben>): KarteFarben {
  const c = f.c && HEX_RE.test(f.c) ? f.c : "#26392E";
  const on = f.on && HEX_RE.test(f.on) && kontrast(c, f.on) >= 4.5 ? f.on : textAuf(c);
  const bg = f.bg && HEX_RE.test(f.bg) && luminanz(f.bg) > 0.75 ? f.bg : "#F6F3EB";
  // Akzent steht als Text auf bg. Aus der Hauptfarbe abgeleitet, nicht aus dem
  // CSS gewählt: dort gewinnt sonst gern das Standard-Linkblau des Shop-Themes.
  // Abdunkeln, bis er lesbar ist – so sind auch die handgebauten Karten gemacht.
  const acc = f.acc && HEX_RE.test(f.acc) && kontrast(f.acc, bg) >= 4.5 ? f.acc : abdunkeln(c, bg);
  return { c, on, acc, bg };
}

function abdunkeln(hex: string, bg: string): string {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let faktor = 1; faktor > 0.1; faktor -= 0.05) {
    const neu = "#" + rgb.map((v) => Math.round(v * faktor).toString(16).padStart(2, "0")).join("");
    if (kontrast(neu, bg) >= 4.5) return neu;
  }
  return "#1E241D";
}

/* ── Potenzial ────────────────────────────────────────────────── */

export interface PotenzialEingabe {
  vk: number;
  verkaeufeMonat: number;
  zone: ZoneKey | "";
  cm: number | null;
}

export interface Potenzial {
  mieteMonat: number;
  /** Was der Marke je Stück bleibt (vor Wareneinsatz). */
  proStueck: { hub: number; leh: number; online: number; amazon: number };
  /** Mehr als im Supermarkt, je Monat und aufs Jahr. */
  mehrMonat: number;
  mehrJahr: number;
  /** Mehr als über den eigenen Onlineshop bzw. Amazon, aufs Jahr. */
  mehrJahrOnline: number;
  mehrJahrAmazon: number;
  /** Ab so vielen Verkäufen im Monat bleibt bei Hub42 mehr als im LEH. */
  abVerkaeufenBesserAlsLEH: number | null;
}

/** Amazon.de mit Versand durch Amazon (FBA). Grobe Annahmen, Stand 10/2026,
    vor jeder Veröffentlichung gegen die aktuelle Gebührenliste prüfen:
    Verkaufsgebühr 15 % (Lebensmittel und Beauty 8 % bis 10 € Verkaufspreis),
    FBA-Versand für kleine Artikel rund 3,50 € je Stück, Verkäuferkonto
    „Professionell“ 39 € im Monat. Werbung (Amazon Ads) bewusst nicht
    eingerechnet – zugunsten von Amazon. */
export const AMAZON = { provisionPct: 15, provisionPctGuenstig: 8, guenstigBis: 10, fba: 3.5, kontoMonat: 39 };

export function netAmazon(vk: number, n: number): number {
  const pct = vk <= AMAZON.guenstigBis ? AMAZON.provisionPctGuenstig : AMAZON.provisionPct;
  return vk - vk * (pct / 100) - AMAZON.fba - AMAZON.kontoMonat / Math.max(1, n);
}

/** Monatsmiete nach Regalfront S, M oder L. Eine Zwischenbreite von 26 bis
    49 cm (etwa aus einem alten Entwurf) rechnet mit L ab 50 cm, dem nächsten
    buchbaren Platz; Eingaben sind ohnehin auf 13, 25 und ab 50 cm begrenzt. */
export function mieteMonat(zone: ZoneKey | "", cm: number | null): number {
  const z: ZoneKey = zone || "basis";
  const breite = Math.max(MIN_REGAL_CM, cm ?? MIN_REGAL_CM);
  return paketMiete(breite, z) ?? paketMiete(PAKETE.L.abCm, z) ?? 0;
}

export function potenzial(e: PotenzialEingabe): Potenzial {
  const miete = mieteMonat(e.zone, e.cm);
  const n = Math.max(1, e.verkaeufeMonat);
  const provision = e.vk * (HUB_MARGIN_PCT / 100);
  const hub = e.vk - provision - miete / n;
  const leh = netLEH(e.vk);
  const online = e.vk - compute({ ...DEFAULTS, vk: e.vk, sales: n }).onlinePerSale;
  const amazon = netAmazon(e.vk, n);

  // hub > leh  ⇔  miete/n < vk − provision − leh
  const luft = e.vk - provision - leh;
  const ab = luft > 0 ? Math.floor(miete / luft) + 1 : null;

  const mehrMonat = (hub - leh) * n;
  return {
    mieteMonat: miete,
    proStueck: { hub, leh, online, amazon },
    mehrMonat,
    mehrJahr: mehrMonat * 12,
    mehrJahrOnline: (hub - online) * n * 12,
    mehrJahrAmazon: (hub - amazon) * n * 12,
    abVerkaeufenBesserAlsLEH: ab,
  };
}

/** Was von der Karte gespeichert wird: ohne Produktliste und Vorschläge. */
export function nurEntwurf(k: KarteEntwurf): KarteAuswahl["entwurf"] {
  const { marke, ort, claim, story, fakten, farben, logo, hero, web, wer, zitat, zitatVon } = k;
  return { marke, ort, claim, story, fakten, farben, logo, hero, web, wer, zitat, zitatVon };
}
