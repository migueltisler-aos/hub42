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

const JSON_TEMPLATE = `[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "follower_ca": 0,
  "notizen": "Founder-Name, warum emerging"
}]`;

const OUTPUT_RULES = `AUSGABE-REGELN (strikt einhalten):
- Antworte NUR als JSON-Array, kein Text davor oder danach
- Wenn du dir bei einem Wert nicht sicher bist: Feld leer lassen ("") statt zu raten
- website: nur die echte, existierende Domain (z. B. brandname.de) – kein Raten, lieber leer
- instagram: nur der Handle ohne @ (z. B. brandname) – kein Raten, lieber leer
- follower_ca: geschätzte Instagram-Follower als Zahl (z. B. 8500), 0 wenn unbekannt`;

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

${OUTPUT_RULES}

${JSON_TEMPLATE}`,
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

${OUTPUT_RULES}

[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "Berlin",
  "follower_ca": 0,
  "notizen": "Founder-Name, warum noch klein"
}]`,
  },
  {
    label: "Meta Ad Library – CAC-gepresste Brands (High Intent)",
    tool: "Comet Browser",
    text: `Öffne https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=DE&media_type=all

Suche nacheinander nach folgenden Begriffen und notiere jeweils die aktivsten deutschen Brands:
- "Bio Snack"
- "Functional Drink"
- "nachhaltige Kosmetik"
- "Craft Gin"
- "Matcha"
- "Superfoods"
- "vegane Kosmetik"
- "Craft Bier Berlin"

FILTER (unbedingt setzen):
- Land: Deutschland
- Status: Aktiv
- Zeitraum: Zuletzt gesehen in den letzten 14 Tagen

HARTE AUSSCHLUSSKRITERIEN:
- NICHT bei Zalando, Amazon, DM, Rossmann oder Rewe gelistet
- Max. 30.000 Instagram-Follower
- Keine eigenen Filialen oder Flagship Stores
- Kein Promi-Founder / Influencer-Brand

Was eine Brand qualifiziert (alle Punkte):
- Schaltet aktiv Meta-Anzeigen (= leidet unter CAC-Druck → High Intent Lead für Hub42)
- Eigener Webshop vorhanden
- Founder-geführt, physisches Produkt
- Preisrange 10–60 €
- Berlin oder DACH-Standort bevorzugt

Gib mir 10 Brands. Füge im Feld "notizen" hinzu: welches Ad-Suchwort sie gefunden hat + geschätztes tägliches Ad-Budget wenn erkennbar.

${OUTPUT_RULES}

[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "follower_ca": 0,
  "notizen": "Gefunden via Ad-Suchwort: X | Est. Ad-Budget: Y €/Tag"
}]`,
  },
  {
    label: "Höhle der Löwen Alumni – Post-Hype Phase",
    tool: "Perplexity / ChatGPT",
    text: `Suche Teilnehmer aus der Höhle der Löwen (Staffeln die VOR 2024 ausgestrahlt wurden – also mindestens 2 Jahre her).

WARUM diese Quelle: TV-Bounce ist vorbei, viele Deals wurden nie umgesetzt, Marke hat Awareness aufgebaut aber kämpft wieder mit normalem CAC. Perfekter Moment für Hub42.

HARTE AUSSCHLUSSKRITERIEN:
- NICHT bei Zalando, Amazon, DM, Rossmann, Rewe oder Edeka gelistet
- Kein eigenes Filialnetz oder stationärer Flagship Store
- Keine Konzerntöchter oder Private-Equity-Übernahmen nach der Show
- Max. 100.000 Instagram-Follower (kein Massenprodukt)

Suchkriterien:
- Staffeln 1–13 (ca. 2014–2023), bevorzugt Staffeln 10–13
- Physisches Produkt (Food, Drinks, Kosmetik, Lifestyle, Home) – kein SaaS, kein Service
- Preisrange 10–60 €
- Founder noch aktiv, eigener Webshop + Instagram vorhanden
- DACH-Standort

Ergänze im Feld "notizen": Staffel + Jahr der Ausstrahlung + ob Deal zustande kam.

${OUTPUT_RULES}

[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "follower_ca": 0,
  "notizen": "HdL Staffel X (Jahr) | Deal: Ja/Nein | Founder-Name"
}]`,
  },
  {
    label: "Startup Events & Demo Days – Berlin / DACH",
    tool: "Perplexity / ChatGPT",
    text: `Suche Consumer-Brand-Startups die in den letzten 3 Jahren bei folgenden Events oder Programmen aufgetreten sind:

Events & Programme:
- Tech Open Air (TOA) Berlin
- APX Accelerator Demo Day (Axel Springer / Porsche)
- German Accelerator Demo Day
- EXIST-Gründerstipendium Absolventen
- Startup World Cup (DACH-Qualifier)
- Founders' Day Berlin
- NOAH Conference Berlin/London
- Bits & Pretzels München
- Impact Festival Frankfurt
- Startupnight Berlin

HARTE AUSSCHLUSSKRITERIEN:
- NICHT bei Zalando, Amazon, DM, Rossmann oder Rewe gelistet
- Kein reines SaaS/Tech/Service Startup – muss physisches Produkt haben
- Kein Promi-Founder / Corporate Spin-off
- Max. 50.000 Instagram-Follower

Suchkriterien:
- Physisches Consumer-Produkt (Food, Drinks, Kosmetik, Lifestyle, Home, Pet)
- Preisrange 10–60 €
- Founder-geführt, eigener Webshop + Instagram
- DACH-Standort, bevorzugt Berlin

Ergänze im Feld "notizen": Event/Programm + Jahr + Programm-Stage (Seed/Early/Growth).

${OUTPUT_RULES}

[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "follower_ca": 0,
  "notizen": "Gefunden via: [Event/Programm] [Jahr] | Stage: Seed/Early"
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

${OUTPUT_RULES}

[{
  "name": "",
  "website": "",
  "instagram": "",
  "kategorie": "",
  "produkt": "",
  "preisrange": "",
  "standort": "",
  "follower_ca": 0,
  "notizen": "Founder-Name, Nachhaltigkeitsansatz"
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
