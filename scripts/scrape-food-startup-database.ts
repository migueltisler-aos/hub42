import dotenv from "dotenv";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeBrandName } from "@/lib/pipeline";
import { generatePersoSatz } from "@/lib/outreach/personalize";
import {
  REQUEST_DELAY_MS,
  fetchText,
  findContactEmail,
  normalizeOrigin,
  sleep,
  stripTags,
} from "@/lib/scrape";

dotenv.config({ path: ".env.local" });

/**
 * Scraped eine öffentliche Startup-Verzeichnis-Seite (Default: swyytr.com
 * Food-Startup-Datenbank) und reichert `pipeline_brands` mit Name/Website/
 * Beschreibung an. Sucht zusätzlich auf der markeneigenen Website nach einer
 * Kontakt-E-Mail (Startseite, dann /kontakt, /contact, /impressum, /imprint).
 *
 * Heuristisch, kein offizielles API — die Verzeichnis-Seite ist Webflow-CMS,
 * die Extraktion (Titel/Description/erster externer Link) beruht auf dem
 * aktuell beobachteten Markup. Ändert swyytr das Seitenlayout grundlegend,
 * muss extractName/extractTaglineAndDescription/extractExternalWebsite
 * nachgezogen werden.
 *
 * WICHTIG: Setzt NIE outreach_status oder prio. Jede gescrapte Marke landet
 * als normale "Neu"-CRM-Zeile in pipeline_brands — sie kommt erst nach
 * manueller Prio-Vergabe im /pipeline für den Cold-Outreach-Versand infrage.
 * Kein ungeprüfter Scraping-Treffer wird automatisch zum Versand freigegeben.
 *
 * Rate-Limiting: sequenziell, 400ms Pause zwischen Requests, identifizierender
 * User-Agent (kein Browser-Spoofing) — kein aggressives Scraping.
 *
 * Aufruf:
 *   pnpm scrape:swyytr                              (Default-URL, alle Treffer)
 *   pnpm scrape:swyytr --limit=20                    (nur die ersten 20, zum Testen)
 *   pnpm scrape:swyytr --dry-run                     (nur loggen, nichts in Supabase schreiben)
 *   pnpm scrape:swyytr https://www.swyytr.com/... --limit=20 --dry-run
 */

const DEFAULT_LISTING_URL = "https://www.swyytr.com/databases/food-startups";

function extractSlugs(listingHtml: string): string[] {
  const slugs = new Set<string>();
  for (const m of listingHtml.matchAll(/href="\/food-startup\/([a-z0-9\-]+)"/gi)) {
    slugs.add(m[1]);
  }
  return [...slugs];
}

function extractName(html: string): string | null {
  const m = /<title>([^<]*)<\/title>/i.exec(html);
  if (!m) return null;
  const cleaned = m[1]
    .replace(/^[^\w]*/u, "") // führendes Emoji o. ä.
    .replace(/\s*[–-]\s*Das Food Startup im Fokus.*$/i, "")
    .replace(/\s*\|\s*swyytr\.com\s*$/i, "")
    .trim();
  return cleaned || null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTaglineAndDescription(
  plainText: string,
  name: string,
): { tagline: string | null; description: string | null } {
  const taglineRe = new RegExp(`${escapeRegExp(name)}\\s+(.{3,80}?)\\s+Mehr erfahren`, "i");
  const taglineMatch = taglineRe.exec(plainText);
  const tagline = taglineMatch ? taglineMatch[1].trim() : null;

  const descRe = /\bDescription\s+(.{20,1200}?)(?:\s+Du möchtest|\s+Ergänze|\s+Quelle:|$)/i;
  const descMatch = descRe.exec(plainText);
  const description = descMatch ? descMatch[1].trim() : null;

  return { tagline, description };
}

const BLOCKED_HOST_RE =
  /swyytr\.com|swyytr\.beehiiv\.com|beehiiv\.com|website-files\.com|fonts\.googleapis|fonts\.gstatic|canva\.com|instagram\.com|facebook\.com|linkedin\.com|twitter\.com|x\.com|tiktok\.com|youtube\.com/i;

function extractExternalWebsite(html: string): string | null {
  const hrefs = [...html.matchAll(/href="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]);
  const candidate = hrefs.find((h) => !BLOCKED_HOST_RE.test(h));
  return candidate ? normalizeOrigin(candidate) : null;
}

interface ScrapedProfile {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
}

async function scrapeProfile(slug: string, baseUrl: string): Promise<ScrapedProfile | null> {
  const url = new URL(`/food-startup/${slug}`, baseUrl).toString();
  const html = await fetchText(url);
  if (!html) return null;

  const name = extractName(html);
  if (!name) return null;

  const plainText = stripTags(html);
  const { tagline, description } = extractTaglineAndDescription(plainText, name);
  const website = extractExternalWebsite(html);

  return { slug, name, tagline, description, website };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const listingUrl = args.find((a) => !a.startsWith("--")) ?? DEFAULT_LISTING_URL;
  const baseUrl = new URL(listingUrl).origin;

  console.log(`Lade Verzeichnis: ${listingUrl}${dryRun ? "  [DRY RUN]" : ""}`);
  const listingHtml = await fetchText(listingUrl);
  if (!listingHtml) throw new Error("Verzeichnis-Seite konnte nicht geladen werden.");

  let slugs = extractSlugs(listingHtml);
  console.log(`${slugs.length} Profile im Verzeichnis gefunden.`);
  if (limit) slugs = slugs.slice(0, limit);

  const sb = getSupabaseAdmin();
  const { data: existingBrands, error } = await sb.from("pipeline_brands").select("name");
  if (error) throw error;
  const existingNames = new Set((existingBrands ?? []).map((b) => normalizeBrandName(b.name)));

  let inserted = 0;
  let skippedExisting = 0;
  let failed = 0;
  let emailsFound = 0;

  for (const [i, slug] of slugs.entries()) {
    process.stdout.write(`[${i + 1}/${slugs.length}] ${slug} … `);

    const profile = await scrapeProfile(slug, baseUrl);
    await sleep(REQUEST_DELAY_MS);
    if (!profile) {
      console.log("übersprungen (Profil nicht ladbar)");
      failed++;
      continue;
    }

    const nameKey = normalizeBrandName(profile.name);
    if (existingNames.has(nameKey)) {
      console.log(`"${profile.name}" — schon in pipeline_brands, übersprungen`);
      skippedExisting++;
      continue;
    }

    let email: string | null = null;
    if (profile.website) {
      email = await findContactEmail(profile.website);
      if (email) emailsFound++;
    }

    const notizen = [profile.description, `Quelle: swyytr.com Food-Startup-Datenbank (${new Date().toISOString().slice(0, 10)})`]
      .filter(Boolean)
      .join("\n\n");

    let personaSatz: string | null = null;
    try {
      personaSatz = await generatePersoSatz({
        name: profile.name,
        website: profile.website,
        produkt: profile.tagline,
        notizen,
      });
    } catch (err) {
      console.warn(`  Persona-Satz-Generierung fehlgeschlagen: ${err}`);
    }

    console.log(
      `"${profile.name}" — Website: ${profile.website ?? "–"}, E-Mail: ${email ?? "–"}${
        personaSatz ? ", Persona-Satz ✓" : ""
      }`,
    );

    if (!dryRun) {
      const { error: insertError } = await sb.from("pipeline_brands").insert({
        name: profile.name,
        website: profile.website,
        email,
        produkt: profile.tagline,
        notizen,
        perso_satz: personaSatz,
        status: "Neu",
        ko_flag: false,
        gefunden_via: "swyytr_datenbank_scrape",
      });
      if (insertError) {
        console.warn(`  Insert fehlgeschlagen: ${insertError.message}`);
        failed++;
      } else {
        inserted++;
      }
    }

    existingNames.add(nameKey);
  }

  console.log(
    `\nFertig: ${inserted} neu angelegt, ${skippedExisting} schon vorhanden übersprungen, ${failed} fehlgeschlagen, ${emailsFound} E-Mails gefunden.`,
  );
  console.log(
    "Wichtig: outreach_status/prio wurden NICHT gesetzt — im /pipeline erst Prio vergeben, bevor eine Marke für den Versand infrage kommt.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
