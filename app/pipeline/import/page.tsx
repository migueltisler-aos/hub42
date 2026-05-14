import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { importBrands, type AiBrand } from "@/lib/pipeline";
import ImportBox from "../_components/ImportBox";
import CopyButton from "../_components/CopyButton";

function sanitizeAndParseJson(raw: string): AiBrand[] {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let s = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

  // Strip Perplexity inline citations appended after closing quotes: "value " [label](url)
  s = s.replace(/"(\s*\[[^\]]*\]\([^)]*\))+/g, '"');

  // If it doesn't start with '[', wrap it (AI sometimes returns bare objects/list)
  if (!s.startsWith("[")) s = `[${s}]`;

  // Remove trailing commas before ] or } (common AI output issue)
  s = s.replace(/,(\s*[}\]])/g, "$1");

  const parsed = JSON.parse(s);
  if (!Array.isArray(parsed)) throw new Error("Kein Array");
  return parsed;
}

async function runImport(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";
  const gefunden_via = (formData.get("gefunden_via") as string) || "KI-Tool";
  const raw = formData.get("json") as string;

  let brands: AiBrand[];
  try {
    brands = sanitizeAndParseJson(raw);
  } catch {
    redirect("/pipeline/import?error=json");
  }

  const result = await importBrands(brands!, gefunden_via, currentUser);
  const summary = `imported=${result.imported}&dupes=${result.duplicates.length}&errors=${result.errors.length}`;
  redirect(`/pipeline?${summary}`);
}

const PROMPTS = [
  {
    label: "Standard – Emerging Brands Deutschland",
    tool: "Perplexity / Gemini / ChatGPT",
    text: `Finde 10 kleine, aufstrebende deutsche Consumer-Brands die noch wachsen – KEINE etablierten Marken.

HARTE AUSSCHLUSSKRITERIEN (alle müssen erfüllt sein):
- NICHT bei Zalando, Amazon, DM, Rossmann, Rewe, Edeka, Douglas oder Müller gelistet
- KEIN Promi-Founder / Celebrity-Brand (keine Influencer mit über 500.000 Followern)
- KEINE eigenen stationären Stores oder Flagship-Filialen
- Max. 50.000 Instagram-Follower
- Noch KEIN überregional bekanntes Massenprodukt

Suchkriterien:
- Preisrange 15–60 €
- Eigener Online-Shop + aktiver Instagram-Account
- Founder-geführt mit echter persönlicher Geschichte
- Physisches Produkt (Food, Drinks, Kosmetik/Beauty, Lifestyle oder Home)
- DACH-Standort (Deutschland bevorzugt)
- Herstellt selbst oder lässt produzieren – kein Reseller

Antworte NUR als JSON-Array, kein Text davor oder danach:
[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "notizen": "Founder-Name, warum emerging, ca. Follower-Zahl"
}]`,
  },
  {
    label: "Berlin-Fokus – lokale Emerging Brands",
    tool: "Perplexity",
    text: `Finde 10 kleine Berliner Brands die physische Produkte herstellen – noch unbekannt, wachsend.

HARTE AUSSCHLUSSKRITERIEN:
- NICHT bei Zalando, Amazon, DM, Rossmann oder Rewe gelistet
- Max. 30.000 Instagram-Follower
- Keine eigenen Filialen oder Flagship Stores
- Kein Promi-Founder

Suchkriterien:
- Eigener Webshop + Instagram vorhanden
- Founder-geführt, echte Story
- Preisrange 10–60 €
- Physisches Produkt: Food, Drinks, Kosmetik, Lifestyle oder Home
- Direkt in Berlin ansässig oder produzierend

Antworte NUR als JSON-Array:
[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "Berlin",
  "notizen": "Founder-Name, ca. Follower-Zahl, warum noch klein"
}]`,
  },
  {
    label: "Nische: Nachhaltig / Zero Waste (emerging)",
    tool: "Perplexity / ChatGPT",
    text: `Finde 10 kleine nachhaltige deutsche Brands (Nachfüllprodukte, Zero Waste, plastikfrei, regional) – noch nicht etabliert.

HARTE AUSSCHLUSSKRITERIEN:
- NICHT bei DM, Rossmann, Müller, Rewe oder Edeka im Regal
- NICHT auf Amazon oder Zalando
- Max. 40.000 Instagram-Follower
- Kein Promi-Founder

Suchkriterien:
- Preisrange 10–55 €
- Eigener Webshop + Instagram
- Founder-geführt
- Physisches Produkt mit nachhaltigem Ansatz
- DACH-Standort

Antworte NUR als JSON-Array:
[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "notizen": "Founder-Name, Nachhaltigkeitsansatz, ca. Follower-Zahl"
}]`,
  },
];

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; imported?: string; dupes?: string }>;
}) {
  const { error, imported, dupes } = await searchParams;

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/pipeline" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
            ← Pipeline
          </Link>
          <h1
            className="text-cream text-4xl tracking-widest mt-3"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            KI-Import
          </h1>
          <p className="text-stone text-sm mt-2">
            Prompt kopieren → KI öffnen → JSON-Output hier einfügen → Importieren
          </p>
        </div>

        {error === "json" && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 mb-6 text-red-400 text-sm font-mono">
            Ungültiges JSON. Stelle sicher dass der Output ein Array ist: [{"{ }"},  ...]
          </div>
        )}

        {/* Prompt-Vorlagen */}
        <div className="mb-8">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">Prompt-Vorlagen</p>
          <div className="space-y-3">
            {PROMPTS.map((p) => (
              <details key={p.label} className="border border-stone-dark group">
                <summary className="flex justify-between items-center px-4 py-3 cursor-pointer text-cream hover:text-bronze transition-colors list-none">
                  <span className="font-medium text-sm">{p.label}</span>
                  <span className="text-stone text-xs font-mono">{p.tool}</span>
                </summary>
                <div className="px-4 pb-4 border-t border-stone-dark">
                  <pre className="text-stone text-xs font-mono whitespace-pre-wrap leading-relaxed mt-3 bg-green-mid/50 p-3">
                    {p.text}
                  </pre>
                  <CopyButton text={p.text} />
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Import Form */}
        <ImportBox runImport={runImport} />
      </div>
    </div>
  );
}
