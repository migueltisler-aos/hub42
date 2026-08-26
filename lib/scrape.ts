/**
 * Gemeinsame HTTP-/HTML-Helfer für die Skripte, die markeneigene Webseiten
 * lesen (scripts/scrape-food-startup-database.ts und
 * scripts/backfill-scope-haltung.ts).
 *
 * Bewusst zurückhaltend: sequenzielle Requests mit Pause, identifizierender
 * User-Agent, kein Browser-Spoofing, harte Timeouts.
 */

export const UA =
  "Mozilla/5.0 (compatible; Hub42LeadResearch/1.0; +https://tryhub42.de)";

export const REQUEST_DELAY_MS = 400;

/** Pfade, auf denen Marken üblicherweise Kontakt und Selbstbeschreibung ablegen. */
export const CONTACT_PATHS = [
  "/kontakt",
  "/contact",
  "/impressum",
  "/imprint",
  "/about",
  "/ueber-uns",
];

/** Nur die Seiten, auf denen eine Adresse rechtlich stehen muss bzw. üblich ist. */
export const IMPRESSUM_PATHS = ["/impressum", "/imprint", "/kontakt", "/contact"];

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Liest nur echte `mailto:`-Links — kein Raten aus Fließtext. Schließt
 * Share-Link-Templates wie `mailto:?subject=…` aus (kein @ direkt nach mailto:).
 */
export function extractEmails(html: string): string[] {
  const matches = [...html.matchAll(/mailto:([^"'?\s]+@[^"'?\s]+)/gi)].map((m) =>
    m[1].toLowerCase()
  );
  return [...new Set(matches)].filter((e) => EMAIL_RE.test(e));
}

/** Bevorzugt allgemeine Postfächer vor persönlichen Adressen. */
export function pickBestEmail(emails: string[]): string {
  const priorityPrefixes = ["info@", "kontakt@", "hallo@", "hello@", "contact@"];
  for (const prefix of priorityPrefixes) {
    const hit = emails.find((e) => e.startsWith(prefix));
    if (hit) return hit;
  }
  return emails[0];
}

/**
 * Sucht auf der Startseite und dann auf den Kontakt-/Impressum-Pfaden nach
 * einer Adresse. Findet die Marke nur ein Kontaktformular, bleibt das
 * Ergebnis null — es wird nichts geraten.
 */
export async function findContactEmail(websiteOrigin: string): Promise<string | null> {
  const homeHtml = await fetchText(websiteOrigin);
  if (homeHtml) {
    const emails = extractEmails(homeHtml);
    if (emails.length > 0) return pickBestEmail(emails);
  }
  for (const path of CONTACT_PATHS) {
    await sleep(REQUEST_DELAY_MS);
    const html = await fetchText(`${websiteOrigin}${path}`);
    if (!html) continue;
    const emails = extractEmails(html);
    if (emails.length > 0) return pickBestEmail(emails);
  }
  return null;
}

export function normalizeOrigin(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Baut aus einem Website-Wert aus pipeline_brands (mal "brand.de", mal
 * "https://www.brand.de/shop") eine Origin-URL.
 */
export function toOrigin(website: string | null | undefined): string | null {
  if (!website?.trim()) return null;
  const raw = website.trim();
  return normalizeOrigin(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
}
