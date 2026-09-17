/* ============================================================
   Hub42 · "Regalbeweis 90" – das gebündelte Markenangebot
   ------------------------------------------------------------
   Warum diese Datei existiert:
   /hersteller verkauft einen TARIF (€/cm). Tarife laden zum
   Vergleichen ein. /regalbeweis verkauft ein ERGEBNIS – den
   Abverkaufsbeweis, den eine Marke im Handelsgespräch braucht –
   und die Regalfläche ist darin nur die Lieferform.

   Die Regalmiete bleibt intern die Rechengröße (deck-economics.ts,
   Kapitel 7 Finanzplanung bleiben unberührt). Nach außen wird sie
   nicht mehr einzeln ausgepreist, sondern ist Position 1 eines
   Pakets.

   ENTSCHEIDUNGSBEDÜRFTIG vor Live-Gang (Gründerrunde):
     - PAKETPREIS                    → Vorschlag, nicht beschlossen
     - GARANTIE_SCHWELLE_EINHEITEN   → Platzhalter ohne Datenbasis
     - KOHORTE.bewerbungsschluss     → Datum abstimmen
   Diese drei sind unten einzeln markiert.
   ============================================================ */

import { RATES, MIN_SLOT_MIETE, HUB_MARGIN_PCT } from "./deck-economics";

/* ── Zuschnitt des Pakets ─────────────────────────────────── */

/** Regalfront im Paket. 15 cm entspricht rund 3 Facings eines üblichen F&B-Produkts. */
export const SLOT_CM = 15;

/** Laufzeit in Tagen. 90 Tage = ein voller Quartalszyklus inklusive Wiederkaufsfenster. */
export const LAUFZEIT_TAGE = 90;
export const LAUFZEIT_MONATE = 3;

/** Zone des Pakets – Augenhöhe, nicht Basis: der Beweis ist nur belastbar,
    wenn das Produkt auch tatsächlich gesehen wurde. */
export const PAKET_ZONE = "augenhoehe" as const;

/** Tatsächliche Monatsmiete dieser Fläche nach dem reguären Tarifmodell. */
export const MIETE_MONAT = Math.max(
  MIN_SLOT_MIETE,
  Math.round(SLOT_CM * RATES.augenhoehe * 100) / 100,
);

/** Mietanteil über die Paketlaufzeit – Position 1 im Wertstack, direkt aus dem Tarif. */
export const MIETE_LAUFZEIT = Math.round(MIETE_MONAT * LAUFZEIT_MONATE);

/* ── ENTSCHEIDUNG 1: Paketpreis ───────────────────────────────
   Vorschlag, nicht beschlossen. Logik: Der Preis muss (a) über der
   Signalschwelle liegen, ab der eine Marke das Angebot als
   Distributionskanal und nicht als Marktstand liest, und (b) die
   Akquise tragen – bei rund 80 €/Marke/Monat braucht Store 1
   über 400 Marken für Vollbelegung, in Paketlogik etwa ein
   Viertel davon. Die Zahl gehört in die Gründerrunde. */
export const PAKETPREIS = 1290;

/** Laufende Vermittlungsprovision – unverändert, wird offen ausgewiesen. */
export const PROVISION_PCT = HUB_MARGIN_PCT;

/* ── Der Wertstack ────────────────────────────────────────────
   Jede Position beantwortet einen konkreten Einwand. `wert` ist der
   Einzelpreis, zu dem die Leistung separat verkauft würde;
   Position 1 ist der echte Tarifwert, alle weiteren sind
   kalkulierte Einzelpreise. */

export interface StackPosition {
  nr: string;
  titel: string;
  /** Der Einwand, den diese Position beantwortet. */
  einwand: string;
  beschreibung: string;
  wert: number;
}

export const STACK: StackPosition[] = [
  {
    nr: "01",
    titel: `Regalfront ${SLOT_CM} cm, Augenhöhe, ${LAUFZEIT_TAGE} Tage`,
    einwand: "Ich komme im Handel nicht rein.",
    beschreibung:
      "Feste Fläche auf Augenhöhe im Hub42 Berlin – kein Restplatz, kein Sockelbrett. Deine Ware bleibt auf Konsignation dein Eigentum.",
    wert: MIETE_LAUFZEIT,
  },
  {
    nr: "02",
    titel: "Regal-Ready-Check vor dem Start",
    einwand: "Mein Karton sieht im Regal nicht aus.",
    beschreibung:
      "Wir prüfen Front, Facing-Breite, Lesbarkeit auf 1,5 Meter, Preisauszeichnung und Blockbildung – bevor die erste Lieferung rollt. Mit schriftlicher Empfehlung.",
    wert: 390,
  },
  {
    nr: "03",
    titel: "Betrieb vollständig übernommen",
    einwand: "Ich habe keine Zeit, ein Regal zu pflegen.",
    beschreibung:
      "Wareneingang, Einräumen, Nachräumen, Bestandsführung, Nachschub-Alarm bevor die Lücke entsteht. Du lieferst an – mehr nicht.",
    wert: 540,
  },
  {
    nr: "04",
    titel: "Tagesgenaue Verkaufsdaten, 3 Monate",
    einwand: "Ich sehe nie, was offline wirklich passiert.",
    beschreibung:
      "Pro-Analytics im Dashboard: Verkäufe pro Tag, Kaufzeitpunkte, QR-Scans am Regal, Wochenvergleich. Nicht am Monatsende – laufend.",
    wert: 147,
  },
  {
    nr: "05",
    titel: "Feedback-Panel direkt am Regal",
    einwand: "Ich weiß nicht, warum Leute nicht kaufen.",
    beschreibung:
      "QR-Code am Slot, strukturierte Bewertung auf 9-Punkt-Skala, Antworten mit Kontext zum Kaufmoment. Das, wofür Marktforschung fünfstellig abrechnet.",
    wert: 1200,
  },
  {
    nr: "06",
    titel: "Ein Aktionstag mit unserem Personal",
    einwand: "Niemand probiert mein Produkt.",
    beschreibung:
      "Verkostung oder Aktionsfläche an einem Freitag oder Samstag – gefahren von unserem Team, nicht von dir. Inklusive Auswertung, was am Stand funktioniert hat.",
    wert: 600,
  },
  {
    nr: "07",
    titel: `Das Regalbeweis-Dossier an Tag ${LAUFZEIT_TAGE}`,
    einwand: "Der Einkäufer fragt: wie dreht das Produkt?",
    beschreibung:
      "Rotation pro Woche und pro Meter Regal, Abverkaufskurve, Kaufzeitfenster, Panel-Ergebnisse. Das Dokument, das du in den Termin mitnimmst.",
    wert: 1500,
  },
  {
    nr: "08",
    titel: "Handelsgespräch-Briefing",
    einwand: "Ich kann die Zahlen selbst nicht einordnen.",
    beschreibung:
      "Wir übersetzen dein Dossier in die Sprache eines Category Managers – und sagen dir ehrlich, welche Zahl trägt und welche du besser nicht zeigst.",
    wert: 450,
  },
  {
    nr: "09",
    titel: "Kohorten-PR und Bildmaterial",
    einwand: "Ein Laden ist noch keine Geschichte.",
    beschreibung:
      "Gemeinsame Eröffnungs-PR der Gründungskohorte, Presse-Kit, professionelle Regalfotos deiner Marke zur freien Verwendung in deinem eigenen Marketing.",
    wert: 380,
  },
  {
    nr: "10",
    titel: "Preis-Lock über 12 Monate",
    einwand: "Und danach zieht ihr den Preis an.",
    beschreibung:
      "Deine Einstiegsrate ist vertraglich für zwölf Monate fixiert – auch wenn der Store in eine höhere Auslastungstranche wechselt und alle nach dir mehr zahlen.",
    wert: 300,
  },
];

export const STACK_GESAMTWERT = STACK.reduce((summe, p) => summe + p.wert, 0);

/* ── ENTSCHEIDUNG 2: Garantieschwelle ─────────────────────────
   ACHTUNG – kaufmännisch bindend, sobald die Seite live ist.
   90 Einheiten in 90 Tagen = ein Verkauf pro Tag. Bewusst niedrig
   angesetzt, aber ohne eigene Rotationsdaten geschätzt: Store 1
   ist noch nicht eröffnet. Vor Live-Gang entweder mit echten
   Zahlen ersetzen oder die Garantie rein qualitativ formulieren.

   Warum die Garantie in Fläche zahlt und nicht in Geld: unter
   60 % Auslastung kostet uns ein zusätzliches Regalquartal fast
   nichts, ein Cash-Refund dagegen den vollen Deckungsbeitrag. */
export const GARANTIE_SCHWELLE_EINHEITEN = 90;

export const GARANTIE = {
  name: "Die Ergebnis-Garantie",
  kern: `Dreht dein Produkt in ${LAUFZEIT_TAGE} Tagen weniger als ${GARANTIE_SCHWELLE_EINHEITEN} Einheiten, bekommst du das Folgequartal mietfrei – und zwar auf Greifhöhe statt Augenhöhe.`,
  zusatz:
    "Dazu eine Ursachenanalyse aus den Panel-Daten: an welcher Stelle der Kaufentscheidung dein Produkt verloren hat. Du gehst aus diesen 90 Tagen in keinem Fall ohne verwertbares Ergebnis – entweder mit Abverkauf oder mit dem Grund.",
} as const;

/* ── ENTSCHEIDUNG 3: Kohorte ─────────────────────────────────
   Kohorte statt Dauerangebot: ein echtes Startdatum erzeugt eine
   Frist ohne erfundenen Countdown, 12 Plätze sind physisch wahr,
   und Kohorte 1 wird die Referenz, mit der Kohorte 2 verkauft
   wird – genau der Nachfragebeleg, der in den BPW-Gutachten
   gefehlt hat. Bewerbungsschluss bitte abstimmen. */
export const KOHORTE = {
  nummer: 1,
  name: "Gründungskohorte",
  plaetze: 12,
  start: "Oktober 2026",
  ort: "Hub42 Berlin · Alexanderplatz",
  bewerbungsschluss: "TODO_DATUM",
} as const;

/* ── Wertanker: was die Alternativen kosten ──────────────────
   Quellenlage wie bei COMPARISON_ROWS in lib/slots.ts – Spannen,
   keine Punktwerte, damit nichts behauptet wird, was im
   Nachfragen nicht hält. */
export interface AnkerZeile {
  weg: string;
  kosten: string;
  haken: string;
}

export const ANKER: AnkerZeile[] = [
  {
    weg: "Listung im LEH",
    kosten: "2.000 – 50.000 €",
    haken:
      "WKZ und Listungsgebühr im Voraus, 6–18 Monate Entscheidungsweg – und die Frage nach der Rotation kommt trotzdem.",
  },
  {
    weg: "Marktforschung / Panel-Test",
    kosten: "fünfstellig",
    haken:
      "Befragte im Testraum, nicht Käufer am Regal. Aussagen über Absicht, nicht über Abverkauf.",
  },
  {
    weg: "Messestand",
    kosten: "3.000 – 8.000 €",
    haken: "Drei Tage Sichtbarkeit, Fachpublikum statt Endkunde, keine Wiederkaufsdaten.",
  },
  {
    weg: "Eigener Pop-up-Store",
    kosten: "ab 15.000 €",
    haken: "Mietvertrag, Personal, Kasse, Genehmigungen – für eine einzige Marke.",
  },
];

/* ── Disqualifikation ────────────────────────────────────────
   Steht bewusst auf der Seite: Wer aussortiert, verkauft besser –
   und wir sparen uns Erstgespräche, die ohnehin scheitern. */
export const NICHT_FUER: string[] = [
  "Marken ohne EAN und ohne LMIV-konforme Kennzeichnung. Das ist Voraussetzung, keine Formalie.",
  `Wer ausschließlich Fläche mieten und den Rest selbst machen will – dafür gibt es den regulären Slot ab ${MIN_SLOT_MIETE} €/Monat.`,
  "Wer in 90 Tagen kurzfristigen Umsatz sucht. Das hier produziert einen Beweis, keinen Umsatzsprung.",
  "Wer nicht liefern kann, wenn es läuft. Nachschub innerhalb von sieben Tagen ist Teil des Vertrags.",
];

/* ── Offene Punkte, die wir Marken gegenüber nicht verschweigen ──
   Hub42 hat zum Zeitpunkt dieses Angebots keine Abverkaufshistorie.
   Das steht auf der Seite. Ein Angebot, das seine eigene Lücke
   benennt, hält dem ersten kritischen Rückruf stand – eines, das
   sie kaschiert, nicht. */
export interface OffenerPunkt {
  frage: string;
  antwort: string;
}

export const OFFEN: OffenerPunkt[] = [
  {
    frage: "Es gibt noch keine Abverkaufszahlen aus dem Hub42.",
    antwort: `Richtig. Der Store eröffnet ${KOHORTE.start}. Genau deshalb heißt Kohorte 1 Gründungskohorte und zahlt Gründungskonditionen: ihr geht das Risiko mit, dafür bekommt ihr Preis-Lock, Augenhöhe und die Ergebnis-Garantie. Wer erst Referenzen sehen will, wartet auf Kohorte 2 und zahlt dann den Tranchenpreis.`,
  },
  {
    frage: `Was passiert nach den ${LAUFZEIT_TAGE} Tagen?`,
    antwort:
      "Nichts automatisch. Es gibt keine stillschweigende Verlängerung. Du entscheidest mit dem Dossier in der Hand, ob du verlängerst – zu deiner gelockten Rate.",
  },
  {
    frage: "Wem gehört die Ware?",
    antwort:
      "Dir. Konsignation, kein Abnahmezwang, keine Vollpalette. Was sich nicht verkauft, kommt zurück – nicht auf deine Rechnung entsorgt.",
  },
  {
    frage: `Warum zusätzlich ${PROVISION_PCT} %?`,
    antwort: `Die ${PROVISION_PCT} % Vermittlungsprovision fallen nur auf tatsächlich verkaufte Artikel an und enthalten die komplette Zahlungsabwicklung. Zum Vergleich: der LEH nimmt 30–50 % Handelsmarge und bestimmt zusätzlich deinen Endpreis. Deine UVP bleibt hier deine.`,
  },
];

/* ── Ablauf in fünf Schritten ────────────────────────────────── */
export interface Etappe {
  marke: string;
  titel: string;
  text: string;
}

export const ABLAUF: Etappe[] = [
  {
    marke: "Woche 0",
    titel: "Bewerbung und Zuschnitt",
    text: "Kurzes Gespräch, 30 Minuten. Wir prüfen Sortimentspassung, EAN und Kennzeichnung und legen deine Position im Regal fest.",
  },
  {
    marke: "Woche 1",
    titel: "Regal-Ready-Check",
    text: "Dein Auftritt am Regal wird geprüft und korrigiert, bevor Ware fließt. Danach lieferst du an – auf Konsignation.",
  },
  {
    marke: "Tag 1",
    titel: "Live im Regal",
    text: "Augenhöhe, QR-Code am Slot, Traverse-Karte mit deiner Geschichte. Ab hier laufen Abverkauf und Panel parallel.",
  },
  {
    marke: "Tag 2–89",
    titel: "Betrieb und Daten",
    text: "Wir halten das Regal voll und melden Nachschubbedarf. Du siehst die Verkäufe tagesgenau im Dashboard, nicht erst am Monatsende.",
  },
  {
    marke: `Tag ${LAUFZEIT_TAGE}`,
    titel: "Dossier und Briefing",
    text: "Du bekommst den Regalbeweis als Dokument plus das Briefing dazu. Und entscheidest frei, ob du verlängerst.",
  },
];
