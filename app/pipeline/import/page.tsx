import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { importBrands, type AiBrand } from "@/lib/pipeline";
import ImportBox from "../_components/ImportBox";
import CopyButton from "../_components/CopyButton";

function sanitizeAndParseJson(raw: string): AiBrand[] {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let s = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

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
    label: "Standard – unabhängige Deutsche Brands",
    tool: "Perplexity / Gemini / ChatGPT",
    text: `Finde 10 unabhängige deutsche Consumer-Brands (Food, Drinks, Kosmetik, Lifestyle, Home).
Kriterien:
- Preisrange 10–60 €
- Kein Supermarkt-Listing (kein Rewe, Edeka, DM, Rossmann)
- Eigener Online-Shop oder starke Instagram-Präsenz
- Founder-geführt, echte Story dahinter

Antworte NUR als JSON-Array, kein Text davor oder danach:
[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "notizen": ""
}]`,
  },
  {
    label: "Berlin-Fokus – lokale Hersteller",
    tool: "Perplexity",
    text: `Finde 10 Berliner Brands die physische Produkte herstellen und verkaufen.
Kriterien: nicht in großen Ketten gelistet, eigene Community oder Newsletter, founder-geführt.

Antworte NUR als JSON-Array:
[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "Berlin",
  "notizen": ""
}]`,
  },
  {
    label: "Nische: Nachhaltig / Zero Waste",
    tool: "Perplexity / ChatGPT",
    text: `Finde 10 nachhaltige deutsche Brands (Nachfüllprodukte, Zero Waste, plastikfrei, regional).
Preisrange 8–50 €, nicht bei DM oder Rossmann, eigener Webshop.

Antworte NUR als JSON-Array:
[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "notizen": ""
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
