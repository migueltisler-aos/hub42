import Anthropic from "@anthropic-ai/sdk";
import { HALTUNG_TAGS, KATEGORIEN_KANONISCH } from "@/lib/pipeline";

/**
 * Liest aus dem Text der markeneigenen Seiten (Startseite, Über-uns,
 * Händlerseite) die zwei Dinge heraus, die bisher nur als Prosa in `notizen`
 * standen und deshalb bei jeder Brand nachrecherchiert werden mussten:
 *
 *   1. SCOPE   — Vertriebsbreite als Stufe 1–5, plus die Belege dafür
 *   2. HALTUNG — ein Satz "wofür sie stehen" + Tags + Quell-URL
 *
 * Bewusst kein Raten: jedes Feld darf null sein, wenn die Seiten dazu nichts
 * sagen. Ein falsch geratener Wert ist schlimmer als eine sichtbare Lücke —
 * eine Lücke wird zu hub42_fit='Unbewertet' und damit zur Aufgabe, ein
 * geratener Wert zu einem Urteil, dem niemand traut. generatePersoSatz in
 * ./personalize.ts folgt derselben Regel (gibt null zurück statt generisch
 * zu werden).
 */

export interface ClassifyBrandContext {
  name: string;
  website?: string | null;
  instagram?: string | null;
  kategorie?: string | null;
  produkt?: string | null;
  preisrange?: string | null;
  standort?: string | null;
  notizen?: string | null;
  follower_ca?: number | null;
}

/** Eine gelesene Seite der Marke — url wird als haltung_quelle zitierbar. */
export interface ClassifySource {
  url: string;
  text: string;
}

export interface Classification {
  groesse: number | null;
  groesse_begruendung: string | null;
  haendler_ca: number | null;
  retail_listung: boolean | null;
  eigene_filialen: boolean | null;
  funding: string | null;
  haltung_satz: string | null;
  haltung_tags: string[];
  haltung_quelle: string | null;
  kategorie_kanonisch: string | null;
}

const MODEL = "claude-opus-5";

/** Wie viel Seitentext pro Marke ins Prompt geht (Zeichen, nicht Token). */
const MAX_TEXT_PRO_SEITE = 6_000;
const MAX_TEXT_GESAMT = 24_000;

const SCHEMA = {
  type: "object",
  properties: {
    groesse: {
      // anyOf statt type:[integer,null]+enum — die API weist enum-Werte ab,
      // die nicht zu EINEM deklarierten Typ passen.
      anyOf: [{ type: "integer", enum: [1, 2, 3, 4, 5] }, { type: "null" }],
      description:
        "Vertriebsbreite: 1 Manufaktur (Hand-/Kleinserie, nur eigener Shop), " +
        "2 Klein (eigene Produktion/Lohnfertigung, unter 10 Händler), " +
        "3 Wachsend (Fachhandel-Distribution, 10-100 Händler), " +
        "4 Etabliert (überregional, Retail-Listung oder eigene Filialen), " +
        "5 Groß/Konzern (LEH-Regal, Konzerntochter, PE/VC-Runden). " +
        "null, wenn die Seiten keinen Hinweis auf die Vertriebsbreite geben.",
    },
    groesse_begruendung: {
      type: ["string", "null"],
      description:
        "Kurz (max. 100 Zeichen): welche konkrete Stelle auf den Seiten die Stufe belegt.",
    },
    haendler_ca: {
      type: ["integer", "null"],
      description:
        "Anzahl genannter Handelspartner/Verkaufsstellen, falls die Seiten eine Zahl oder Liste nennen.",
    },
    retail_listung: {
      type: ["boolean", "null"],
      description:
        "true nur, wenn die Seiten selbst eine Listung im Lebensmittel-/Drogerie-Einzelhandel " +
        "(Rewe, Edeka, dm, Rossmann, Müller, Aldi, Lidl, Kaufland, Douglas) behaupten. " +
        "false, wenn sie ausdrücklich sagen, dass es sie dort NICHT gibt. null, wenn nichts dazu steht.",
    },
    eigene_filialen: {
      type: ["boolean", "null"],
      description:
        "true, wenn die Marke eigene Ladengeschäfte/Flagship Stores hat (nicht: Marktstand, Pop-up).",
    },
    funding: {
      type: ["string", "null"],
      description:
        "Genannte Investoren/Finanzierungsrunden, wörtlich kurz. null, wenn nichts dazu steht.",
    },
    haltung_satz: {
      type: ["string", "null"],
      description:
        "EIN Satz auf Deutsch, max. 120 Zeichen: wofür diese Marke steht — die Werte oder die " +
        "Idee, die sie selbst vertritt. So nah wie möglich an der eigenen Formulierung der Seite. " +
        "KEINE Produktbeschreibung, KEIN Marketing-Superlativ. null, wenn die Seiten keine " +
        "erkennbare Haltung ausdrücken, sondern nur Produkte verkaufen.",
    },
    haltung_tags: {
      type: "array",
      items: { type: "string", enum: [...HALTUNG_TAGS] },
      description:
        "Nur Tags, die durch den Seitentext gedeckt sind. Leeres Array, wenn keiner passt.",
    },
    haltung_quelle: {
      type: ["string", "null"],
      description:
        "Die URL aus der Liste der gelesenen Seiten, auf der der haltung_satz steht. " +
        "null, wenn haltung_satz null ist.",
    },
    kategorie_kanonisch: {
      anyOf: [{ type: "string", enum: [...KATEGORIEN_KANONISCH] }, { type: "null" }],
      description: "Produktkategorie der Marke.",
    },
  },
  required: [
    "groesse",
    "groesse_begruendung",
    "haendler_ca",
    "retail_listung",
    "eigene_filialen",
    "funding",
    "haltung_satz",
    "haltung_tags",
    "haltung_quelle",
    "kategorie_kanonisch",
  ],
  additionalProperties: false,
} as const;

const SYSTEM = `Du wertest die eigenen Webseiten einer Consumer-Brand aus, damit ein Entdecker-Store entscheiden kann, ob die Marke ins Regal passt.

Zwei Regeln, die über allem stehen:

1. RATE NICHT. Jedes Feld darf null bzw. leer sein. Wenn die Seiten zu einem Feld nichts sagen, ist null die richtige Antwort — nicht der plausibelste Wert. Eine sichtbare Lücke ist brauchbar, ein geratener Wert ist Schaden.

2. UNTERSCHEIDE BEHAUPTUNG VON AUSSCHLUSS. Wenn eine Seite schreibt "nicht bei dm oder Rossmann erhältlich", ist retail_listung FALSE, nicht true. Ein erwähnter Händlername ist kein Beweis für eine Listung dort.

Zum haltung_satz: gesucht ist die Haltung, nicht das Produkt. "Bio-Dattelpralinen ohne Zuckerzusatz" ist eine Produktbeschreibung und damit falsch. "Direktbezug von Kleinbauern in Peru, fairer Handel ohne Zwischenhändler" ist eine Haltung. Verkauft die Marke erkennbar nur Produkte, ohne eine Idee zu vertreten, ist null die ehrliche Antwort — das ist ein verwertbares Ergebnis, keine Niederlage.`;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ENV ANTHROPIC_API_KEY fehlt");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

function buildFactSheet(brand: ClassifyBrandContext): string {
  return [
    `Marke: ${brand.name}`,
    brand.website && `Website: ${brand.website}`,
    brand.instagram && `Instagram: ${brand.instagram}`,
    brand.kategorie && `Bisherige Kategorie-Notiz: ${brand.kategorie}`,
    brand.produkt && `Produkt: ${brand.produkt}`,
    brand.preisrange && `Preisrange: ${brand.preisrange}`,
    brand.standort && `Standort: ${brand.standort}`,
    brand.follower_ca != null && `Instagram-Follower (ca.): ${brand.follower_ca}`,
    brand.notizen && `Interne Notizen (unstrukturiert, können falsch sein): ${brand.notizen}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSourceBlock(sources: ClassifySource[]): string {
  let budget = MAX_TEXT_GESAMT;
  const blocks: string[] = [];
  for (const s of sources) {
    if (budget <= 0) break;
    const text = s.text.slice(0, Math.min(MAX_TEXT_PRO_SEITE, budget)).trim();
    if (!text) continue;
    budget -= text.length;
    blocks.push(`--- Seite: ${s.url} ---\n${text}`);
  }
  return blocks.join("\n\n");
}

function coerce(raw: unknown): Classification | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

  const groesseRaw = num(r.groesse);
  const groesse = groesseRaw != null && groesseRaw >= 1 && groesseRaw <= 5
    ? Math.round(groesseRaw)
    : null;

  // Tags gegen die geschlossene Liste filtern — der DB-Check-Constraint
  // würde sonst den ganzen Datensatz abweisen.
  const tags = Array.isArray(r.haltung_tags)
    ? r.haltung_tags.filter(
        (t): t is string => typeof t === "string" && (HALTUNG_TAGS as readonly string[]).includes(t)
      )
    : [];

  const kategorie = str(r.kategorie_kanonisch);
  const haltung_satz = str(r.haltung_satz);

  return {
    groesse,
    groesse_begruendung: str(r.groesse_begruendung),
    haendler_ca: num(r.haendler_ca),
    retail_listung: bool(r.retail_listung),
    eigene_filialen: bool(r.eigene_filialen),
    funding: str(r.funding),
    haltung_satz,
    haltung_tags: tags,
    // Ohne Satz keine Quelle — und ohne Quelle ist der Satz nicht belegbar
    // und wird verworfen, statt als Behauptung in der DB zu landen.
    haltung_quelle: haltung_satz ? str(r.haltung_quelle) : null,
    kategorie_kanonisch:
      kategorie && (KATEGORIEN_KANONISCH as readonly string[]).includes(kategorie)
        ? kategorie
        : null,
  };
}

/**
 * Gibt null zurück, wenn keine Seite lesbar war — dann bleibt die Brand
 * unbewertet, statt aus den internen Notizen heraus geraten zu werden.
 */
export async function classifyBrand(
  brand: ClassifyBrandContext,
  sources: ClassifySource[]
): Promise<Classification | null> {
  const sourceBlock = buildSourceBlock(sources);
  if (!sourceBlock) return null;

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> },
    },
    messages: [
      {
        role: "user",
        content: `${buildFactSheet(brand)}

Gelesene Seiten der Marke:

${sourceBlock}`,
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) return null;

  try {
    return coerce(JSON.parse(text));
  } catch {
    return null;
  }
}
