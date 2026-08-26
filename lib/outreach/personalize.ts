import Anthropic from "@anthropic-ai/sdk";

/**
 * Generiert den ersten Satz einer Kaltakquise-Mail automatisch per Claude
 * Haiku — auf Basis der bereits in pipeline_brands vorhandenen Daten
 * (Website, Instagram, Kategorie, Produkt, Notizen). Kein Copy-Paste aus
 * einem Chat-Fenster, sondern ein direkter API-Call beim Import.
 */

export interface BrandContext {
  name: string;
  website?: string | null;
  instagram?: string | null;
  kategorie?: string | null;
  produkt?: string | null;
  preisrange?: string | null;
  standort?: string | null;
  notizen?: string | null;
}

function hasContext(brand: BrandContext): boolean {
  return Boolean(
    brand.website || brand.instagram || brand.kategorie || brand.produkt || brand.notizen
  );
}

function buildFactSheet(brand: BrandContext): string {
  return [
    brand.website && `Website: ${brand.website}`,
    brand.instagram && `Instagram: ${brand.instagram}`,
    brand.kategorie && `Kategorie: ${brand.kategorie}`,
    brand.produkt && `Produkt: ${brand.produkt}`,
    brand.preisrange && `Preisrange: ${brand.preisrange}`,
    brand.standort && `Standort: ${brand.standort}`,
    brand.notizen && `Notizen: ${brand.notizen}`,
  ]
    .filter(Boolean)
    .join("\n");
}

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ENV ANTHROPIC_API_KEY fehlt");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/**
 * Gibt null zurück, wenn zu wenig über die Marke bekannt ist, um einen
 * ehrlich spezifischen (statt generischen) Satz zu schreiben — dann muss der
 * Satz manuell nachgetragen werden, bevor die Marke gequeued wird.
 */
export async function generatePersoSatz(brand: BrandContext): Promise<string | null> {
  if (!hasContext(brand)) return null;

  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: `Schreibe GENAU EINEN Satz auf Deutsch als ersten Satz einer Kaltakquise-E-Mail an die Marke "${brand.name}". Der Satz muss konkret und erkennbar persönlich sein — etwas Spezifisches an der Marke ansprechen (Produkt, Stil, Positionierung), NICHT generisch und NICHT wie eine Vorlage klingen. Keine Anrede, kein Grußwort, nur der eine Satz, ohne Anführungszeichen.

Bekannte Fakten zur Marke:
${buildFactSheet(brand)}`,
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join(" ")
    .trim();

  return text || null;
}
