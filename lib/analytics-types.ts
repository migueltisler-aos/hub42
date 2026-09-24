// Gemeinsame Typen und Konstanten der Reichweitenmessung.
//
// Rein und ohne Datenzugriff, weil sowohl das Client-Snippet
// (components/Analytics.tsx) als auch die Schreibroute (app/api/track) das
// hier importieren – die beiden Seiten dürfen nicht auseinanderlaufen.
//
// Nicht zu verwechseln mit "Pro Analytics" in lib/slots.ts und lib/angebote.ts:
// das ist das an Brands verkaufte Reporting-Produkt, nicht diese Messung.

/** Erlaubte Event-Typen. Die Route verwirft alles andere. */
export const EVENT_TYPES = [
  "pageview", // Seitenaufruf
  "leave", // Verlassen der Seite, trägt duration_ms
  "section", // Deck-Sektion erreicht
  "interaction", // gezielte Nutzung, z. B. Rechner-Slider
  "conversion", // Kontaktformular abgeschickt
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Was der Browser an POST /api/track schickt. Mehr akzeptiert die Route nicht. */
export interface TrackPayload {
  event_type: EventType;
  path: string;
  referrer_host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  link_token?: string | null;
  duration_ms?: number | null;
  scroll_pct?: number | null;
  section?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Pfade, die nicht gemessen werden.
 *
 * Bewusst als Blockliste im Root-Layout statt als Einbau pro Public-Layout:
 * so wird keine neu angelegte öffentliche Route vergessen. Der Preis ist, dass
 * diese Liste gepflegt werden muss, wenn ein interner Bereich dazukommt.
 */
export const NICHT_MESSEN = [
  "/pipeline",
  "/wareneingang",
  "/bestand",
  "/feedback/admin",
  "/feedback/leads",
  "/admin",
  "/api",
] as const;

/**
 * Präfix für interne UI-Prototypen (/neue-ui, /neue-offer, …). Die Routen sind
 * öffentlich erreichbar, damit man sie teilen kann, werden aber fast nur vom
 * Team aufgerufen und verzerren sonst Seiten-Tabelle und Verweildauer.
 */
const PROTOTYP_PRAEFIX = "/neue-";

export function pfadWirdGemessen(pathname: string): boolean {
  if (pathname.startsWith(PROTOTYP_PRAEFIX)) return false;
  return !NICHT_MESSEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Die Deck-Sektionen in ihrer Reihenfolge – Reihenfolge = Lesetiefe.
 *
 * Muss zu den data-deck-section-Attributen in app/deck/page.tsx passen.
 * Der Index liefert position_pct, damit die Auswertung die Tiefe ohne
 * Kenntnis der Sektionsnamen sortieren kann (siehe analytics_brand_engagement).
 */
export const DECK_SECTIONS = [
  { key: "hero", label: "Cover" },
  { key: "problem", label: "Das Problem" },
  { key: "modell", label: "Das Modell" },
  { key: "rechner", label: "Kostenrechner" },
  { key: "standort", label: "Standort" },
  { key: "erlebnis", label: "Erlebnis" },
  { key: "funnel", label: "Funnel" },
  { key: "brands", label: "Brands" },
  { key: "roadmap", label: "Roadmap" },
  { key: "partner", label: "Partner" },
  { key: "faq", label: "FAQ" },
  { key: "kontakt", label: "Kontakt" },
] as const;

export type DeckSectionKey = (typeof DECK_SECTIONS)[number]["key"];

/** Position einer Sektion im Deck in Prozent (0 = Cover, 100 = letzte Sektion). */
export function sektionPositionPct(key: string): number | null {
  const i = DECK_SECTIONS.findIndex((s) => s.key === key);
  if (i < 0) return null;
  return Math.round((i / (DECK_SECTIONS.length - 1)) * 100);
}
