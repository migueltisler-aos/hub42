// Auswertung der Reichweitenmessung für das Dashboard.
//
// Liest ausschließlich die SQL-Views (analytics_daily, analytics_sources,
// analytics_context, analytics_funnel, analytics_deck_depth) – nie
// analytics_events direkt. Die Views aggregieren serverseitig; sonst zieht
// diese Datei irgendwann zehntausende Rohzeilen in den Node-Prozess, nur um
// sie hier zu zählen.
import { getSupabaseAdmin } from "./supabase-admin";
import { DECK_SECTIONS } from "./analytics-types";

export type Zeitraum = 7 | 30 | 90;
export const ZEITRAEUME: Zeitraum[] = [7, 30, 90];

/** ISO-Datum (YYYY-MM-DD) von vor n Tagen – Filtergrenze für die Views. */
function abDatum(tage: Zeitraum): string {
  const d = new Date();
  d.setDate(d.getDate() - (tage - 1));
  return d.toISOString().slice(0, 10);
}

export interface Kennzahlen {
  aufrufe: number;
  sessions: number;
  /**
   * Durchschnittliche Tages-Unique-Besucher.
   *
   * Bewusst NICHT "unique Besucher im Zeitraum": visitor_hash rotiert täglich
   * (Datenschutz-Design), ein Wert über 30 Tage würde denselben Menschen bis
   * zu 30-mal zählen. Der Tagesdurchschnitt ist die Zahl, die stimmt.
   */
  besucherProTag: number;
  avgDauerSek: number;
  conversions: number;
}

export interface TagesPunkt {
  tag: string;
  aufrufe: number;
  besucher: number;
}

export interface SeitenZeile {
  path: string;
  aufrufe: number;
  besucher: number;
  avgDauerSek: number;
}

export interface QuellenZeile {
  quelle: string;
  sessions: number;
}

export interface KontextZeile {
  wert: string;
  sessions: number;
}

export interface TrichterStufe {
  label: string;
  sessions: number;
  hinweis: string;
}

export interface DeckTiefeZeile {
  key: string;
  label: string;
  positionPct: number;
  sessions: number;
  anteilPct: number;
}

export interface AnalyticsUebersicht {
  zeitraum: Zeitraum;
  hatDaten: boolean;
  kennzahlen: Kennzahlen;
  tage: TagesPunkt[];
  seiten: SeitenZeile[];
  quellen: QuellenZeile[];
  geraete: KontextZeile[];
  laender: KontextZeile[];
  trichter: TrichterStufe[];
  deckTiefe: DeckTiefeZeile[];
}

function summe(zahlen: number[]): number {
  return zahlen.reduce((s, n) => s + n, 0);
}

/** Absteigend sortieren und auf die Top n kürzen. */
function topN<T extends { sessions: number }>(zeilen: T[], n: number): T[] {
  return [...zeilen].sort((a, b) => b.sessions - a.sessions).slice(0, n);
}

export async function getUebersicht(zeitraum: Zeitraum): Promise<AnalyticsUebersicht> {
  const sb = getSupabaseAdmin();
  const ab = abDatum(zeitraum);

  const [daily, visitors, sources, context, funnel, depth] = await Promise.all([
    sb.from("analytics_daily").select("*").gte("tag", ab),
    // Exakte Tages-Uniques. Getrennte View, weil count(distinct) sich nicht aus
    // den pfadweisen Zahlen von analytics_daily rekonstruieren laesst.
    sb.from("analytics_daily_visitors").select("*").gte("tag", ab),
    sb.from("analytics_sources").select("*").gte("tag", ab),
    sb.from("analytics_context").select("*").gte("tag", ab),
    sb.from("analytics_funnel").select("*").gte("tag", ab),
    // Lesetiefe bewusst ohne Zeitfilter: die View aggregiert über alle
    // Sessions, und bei kleinen Zahlen ist die Gesamtsicht aussagekräftiger
    // als ein 7-Tage-Ausschnitt mit drei Sessions.
    sb.from("analytics_deck_depth").select("*"),
  ]);

  const fehler = [daily, visitors, sources, context, funnel, depth].find((r) => r.error);
  if (fehler?.error) throw fehler.error;

  type DailyZeile = {
    tag: string;
    path: string;
    aufrufe: number;
    besucher: number;
    sessions: number;
    avg_dauer_ms: number | null;
    dauer_messungen: number;
  };
  const dailyZeilen = (daily.data ?? []) as DailyZeile[];

  type VisitorZeile = { tag: string; besucher: number; sessions: number; aufrufe: number };
  const visitorZeilen = (visitors.data ?? []) as VisitorZeile[];
  const besucherProTagMap = new Map(visitorZeilen.map((z) => [z.tag, z.besucher]));

  // ── Tagesreihe ────────────────────────────────────────────────────────────
  // Lückenlos auffüllen: ein Tag ohne Besucher ist eine Information und soll
  // als Null-Balken sichtbar sein, nicht aus dem Diagramm verschwinden.
  const proTag = new Map<string, { aufrufe: number; besucher: number }>();
  for (const z of dailyZeilen) {
    const e = proTag.get(z.tag) ?? { aufrufe: 0, besucher: 0 };
    e.aufrufe += z.aufrufe;
    // Besucherzahl kommt aus analytics_daily_visitors, NICHT aus z.besucher:
    // das ist per Pfad distinct, summiert waere es zu hoch und das Maximum zu
    // niedrig. Nur count(distinct) ueber den ganzen Tag ist korrekt.
    e.besucher = besucherProTagMap.get(z.tag) ?? 0;
    proTag.set(z.tag, e);
  }
  const tage: TagesPunkt[] = [];
  for (let i = zeitraum - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tag = d.toISOString().slice(0, 10);
    const e = proTag.get(tag);
    tage.push({ tag, aufrufe: e?.aufrufe ?? 0, besucher: e?.besucher ?? 0 });
  }

  // ── Seiten ────────────────────────────────────────────────────────────────
  // Dauern gewichtet mitteln: Summe(avg x Messungen) / Summe(Messungen).
  // Ein ungewichteter Mittelwert von Tagesmittelwerten laesst einen Tag mit
  // einem Aufruf so schwer wiegen wie einen mit hundert.
  const proPfad = new Map<
    string,
    { aufrufe: number; besucher: number; dauerSumme: number; messungen: number }
  >();
  for (const z of dailyZeilen) {
    const e = proPfad.get(z.path) ?? { aufrufe: 0, besucher: 0, dauerSumme: 0, messungen: 0 };
    e.aufrufe += z.aufrufe;
    e.besucher += z.besucher;
    if (z.avg_dauer_ms && z.dauer_messungen) {
      e.dauerSumme += z.avg_dauer_ms * z.dauer_messungen;
      e.messungen += z.dauer_messungen;
    }
    proPfad.set(z.path, e);
  }
  const seiten: SeitenZeile[] = [...proPfad.entries()]
    .map(([path, e]) => ({
      path,
      aufrufe: e.aufrufe,
      besucher: e.besucher,
      avgDauerSek: e.messungen ? Math.round(e.dauerSumme / e.messungen / 1000) : 0,
    }))
    .sort((a, b) => b.aufrufe - a.aufrufe);

  // ── Quellen ───────────────────────────────────────────────────────────────
  type SourceZeile = { quelle: string; utm_source: string | null; sessions: number };
  const proQuelle = new Map<string, number>();
  for (const z of (sources.data ?? []) as SourceZeile[]) {
    // UTM schlägt Referrer: eine Kampagne ist die genauere Auskunft.
    const key = z.utm_source ? `utm:${z.utm_source}` : z.quelle;
    proQuelle.set(key, (proQuelle.get(key) ?? 0) + z.sessions);
  }
  const quellen = topN(
    [...proQuelle.entries()].map(([quelle, sessions]) => ({ quelle, sessions })),
    8
  );

  // ── Geräte und Länder ─────────────────────────────────────────────────────
  type ContextZeile = { device: string; country: string; sessions: number };
  const proGeraet = new Map<string, number>();
  const proLand = new Map<string, number>();
  for (const z of (context.data ?? []) as ContextZeile[]) {
    proGeraet.set(z.device, (proGeraet.get(z.device) ?? 0) + z.sessions);
    proLand.set(z.country, (proLand.get(z.country) ?? 0) + z.sessions);
  }
  const geraete = topN(
    [...proGeraet.entries()].map(([wert, sessions]) => ({ wert, sessions })),
    4
  );
  const laender = topN(
    [...proLand.entries()].map(([wert, sessions]) => ({ wert, sessions })),
    6
  );

  // ── Trichter ──────────────────────────────────────────────────────────────
  // Sequenziell: jede Stufe ist eine Teilmenge der vorherigen, zeitlich
  // geordnet (siehe View analytics_funnel). Direkt-Anfragen ohne vorheriges
  // Brand-Interesse fallen hier bewusst raus – die stehen in der KPI-Kachel.
  type FunnelZeile = {
    sessions: number;
    interesse: number;
    start: number | null;
    hersteller: number;
    deck: number;
    kontakt: number;
    conversions: number;
    anfragen: number;
  };
  const f = (funnel.data ?? []) as FunnelZeile[];
  const trichter: TrichterStufe[] = [
    {
      label: "Alle Besuche",
      sessions: summe(f.map((z) => z.sessions)),
      hinweis: "Sessions mit Seitenaufruf",
    },
    {
      label: "Brand-Interesse",
      sessions: summe(f.map((z) => z.interesse)),
      hinweis: `/ ${summe(f.map((z) => z.start ?? 0))} · /hersteller ${summe(
        f.map((z) => z.hersteller)
      )} · /deck ${summe(
        f.map((z) => z.deck)
      )}`,
    },
    {
      label: "Bewerbung / Kontakt",
      sessions: summe(f.map((z) => z.kontakt)),
      hinweis: "danach Bewerbung begonnen oder /kontakt erreicht",
    },
    {
      label: "Bewerbung / Anfrage gesendet",
      sessions: summe(f.map((z) => z.conversions)),
      hinweis: "danach Formular abgeschickt",
    },
  ];

  // ── Lesetiefe im Deck ─────────────────────────────────────────────────────
  type DepthZeile = { section: string; position_pct: number | null; sessions: number };
  const tiefeMap = new Map(
    ((depth.data ?? []) as DepthZeile[]).map((z) => [z.section, z.sessions])
  );
  // Reihenfolge kommt aus DECK_SECTIONS, nicht aus der DB: sonst würde eine
  // nie erreichte Sektion einfach fehlen, statt als Abbruchpunkt sichtbar zu
  // sein – und genau der ist die interessante Information.
  const hoechste = Math.max(1, ...DECK_SECTIONS.map((s) => tiefeMap.get(s.key) ?? 0));
  const deckTiefe: DeckTiefeZeile[] = DECK_SECTIONS.map((s, i) => {
    const sessions = tiefeMap.get(s.key) ?? 0;
    return {
      key: s.key,
      label: s.label,
      positionPct: Math.round((i / (DECK_SECTIONS.length - 1)) * 100),
      sessions,
      anteilPct: Math.round((sessions / hoechste) * 100),
    };
  });

  // ── Kennzahlen ────────────────────────────────────────────────────────────
  const tageMitDaten = visitorZeilen.length || 1;
  const dauerSumme = summe(
    dailyZeilen.map((z) => (z.avg_dauer_ms && z.dauer_messungen ? z.avg_dauer_ms * z.dauer_messungen : 0))
  );
  const dauerMessungen = summe(dailyZeilen.map((z) => z.dauer_messungen ?? 0));

  const kennzahlen: Kennzahlen = {
    aufrufe: summe(dailyZeilen.map((z) => z.aufrufe)),
    sessions: summe(f.map((z) => z.sessions)),
    // Nur ueber Tage MIT Daten mitteln: sonst druecken messfreie Tage am
    // Anfang des Zeitraums den Wert kuenstlich nach unten.
    besucherProTag: Math.round(summe(visitorZeilen.map((z) => z.besucher)) / tageMitDaten),
    avgDauerSek: dauerMessungen ? Math.round(dauerSumme / dauerMessungen / 1000) : 0,
    conversions: summe(f.map((z) => z.anfragen)),
  };

  return {
    zeitraum,
    hatDaten: dailyZeilen.length > 0,
    kennzahlen,
    tage,
    seiten,
    quellen,
    geraete,
    laender,
    trichter,
    deckTiefe,
  };
}

/** Sekunden als "4:20" bzw. "18 s". */
export function dauerLabel(sek: number): string {
  if (sek <= 0) return "–";
  if (sek < 60) return `${sek} s`;
  const m = Math.floor(sek / 60);
  const s = sek % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
