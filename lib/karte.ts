import "server-only";

/**
 * Baut aus der Website einer Marke den Entwurf ihrer Regalkarte: Logo,
 * Farben, Produkte mit Preis und Bild, dazu Claim, Story und drei Fakten.
 *
 * Die Adresse kommt von einem fremden Menschen aus dem Bewerbungsformular,
 * deshalb ist safeFetch streng: nur http(s) auf Port 80/443, keine privaten
 * Adressen (auch nicht nach einer Weiterleitung), harte Timeouts und eine
 * Obergrenze für die Antwortgröße.
 *
 * Texte schreibt Claude nur aus dem, was auf der Seite steht. Die Marke sieht
 * den Entwurf vor dem Absenden und bestätigt ihn im Onboarding.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import Anthropic from "@anthropic-ai/sdk";
import { klemmeFaktor, type EigentumKey, type VertriebKey } from "@/lib/assistent-model";
import {
  HEX_RE,
  sichereFarben,
  type ArtikelTexte,
  type KarteEntwurf,
  type KarteProdukt,
} from "@/lib/karte-model";
import { HALTUNG_TAGS, KATEGORIEN_KANONISCH, type HaltungTag, type KategorieKanonisch } from "@/lib/pipeline-model";
import { IMPRESSUM_PATHS, UA, stripTags, toOrigin } from "@/lib/scrape";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_PRODUKTE = 24;

/* ── Sicherer Abruf ───────────────────────────────────────────── */

function privateAdresse(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return privateAdresse(v.slice(7));
    return v === "::1" || v === "::" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function erlaubt(u: URL): Promise<boolean> {
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.port && u.port !== "80" && u.port !== "443") return false;
  if (u.username || u.password) return false;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return !privateAdresse(host);
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  try {
    const ips = await lookup(host, { all: true });
    return ips.length > 0 && ips.every((x) => !privateAdresse(x.address));
  } catch {
    return false;
  }
}

/** Liest Text bis MAX_BYTES; Weiterleitungen werden einzeln neu geprüft. */
async function safeFetch(url: string, accept = "text/html"): Promise<string | null> {
  let ziel: URL;
  try {
    ziel = new URL(url);
  } catch {
    return null;
  }
  for (let sprung = 0; sprung < 4; sprung++) {
    if (!(await erlaubt(ziel))) return null;
    let res: Response;
    try {
      res = await fetch(ziel, {
        headers: { "User-Agent": UA, Accept: accept },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      ziel = new URL(loc, ziel);
      continue;
    }
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const teile: Uint8Array[] = [];
    let groesse = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      groesse += value.byteLength;
      if (groesse > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      teile.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(teile));
  }
  return null;
}

async function safeJson<T>(url: string): Promise<T | null> {
  const text = await safeFetch(url, "application/json");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/* ── HTML-Helfer ──────────────────────────────────────────────── */

const absolut = (src: string | null | undefined, basis: string): string | null => {
  if (!src) return null;
  try {
    const u = new URL(src.trim().replace(/^\/\//, "https://"), basis);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};

function meta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2]).trim() : null;
}

const entities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

/** Logo-Kandidaten in der Reihenfolge, in der sie meistens stimmen. */
function logoKandidaten(html: string, basis: string): string[] {
  const funde: string[] = [];
  for (const m of html.matchAll(/"logo"\s*:\s*(?:\{[^}]*"url"\s*:\s*)?"([^"]+)"/g)) funde.push(m[1]);
  for (const m of html.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0];
    if (!/logo/i.test(tag)) continue;
    const src = tag.match(/\s(?:data-)?src=["']([^"']+)["']/i)?.[1];
    if (src && !src.startsWith("data:")) funde.push(src);
  }
  const touch = html.match(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i);
  if (touch) funde.push(touch[1]);
  return [...new Set(funde.map((f) => absolut(entities(f), basis)).filter((f): f is string => !!f))].slice(0, 6);
}

/** Häufigste Farben aus Inline-CSS und dem ersten Stylesheet, ohne Grautöne. */
async function farbKandidaten(html: string, basis: string): Promise<string[]> {
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  css += [...html.matchAll(/style=["']([^"']+)["']/gi)].map((m) => m[1]).join("\n");
  const sheet = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const sheetUrl = absolut(sheet ? entities(sheet) : null, basis);
  if (sheetUrl) css += (await safeFetch(sheetUrl, "text/css")) ?? "";

  const zaehler = new Map<string, number>();
  for (const m of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let h = m[1].toLowerCase();
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    if (Math.max(r, g, b) - Math.min(r, g, b) < 24) continue; // grau, weiß, schwarz
    zaehler.set(`#${h}`, (zaehler.get(`#${h}`) ?? 0) + 1);
  }
  const theme = meta(html, "theme-color");
  const sortiert = [...zaehler.entries()].sort((a, b) => b[1] - a[1]).map(([h]) => h);
  return [...new Set([...(theme && HEX_RE.test(theme) ? [theme.toLowerCase()] : []), ...sortiert])].slice(0, 12);
}

/** Erster Instagram-Account, auf den die Seite verlinkt (keine Posts/Reels). */
function instagram(html: string): string {
  const frei = new Set(["p", "reel", "reels", "explore", "stories", "tv", "accounts", "sharer"]);
  for (const m of html.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/g)) {
    if (!frei.has(m[1].toLowerCase())) return "@" + m[1].replace(/\.$/, "");
  }
  return "";
}

/* ── Produkte: Shopify, WooCommerce, sonst schema.org ─────────── */

type ShopifyProdukte = {
  products?: { title: string; handle: string; images?: { src: string }[]; variants?: { price: string }[] }[];
};
type WooProdukt = {
  name: string;
  permalink: string;
  images?: { src: string }[];
  prices?: { price: string; currency_minor_unit: number };
};

async function produkte(origin: string, html: string): Promise<KarteProdukt[]> {
  const shopify = await safeJson<ShopifyProdukte>(`${origin}/products.json?limit=${MAX_PRODUKTE}`);
  if (shopify?.products?.length) {
    return shopify.products.map((p) => ({
      titel: entities(p.title),
      preis: p.variants?.[0]?.price ? Number(p.variants[0].price) || null : null,
      bild: absolut(p.images?.[0]?.src, origin),
      url: `${origin}/products/${p.handle}`,
    }));
  }

  const woo = await safeJson<WooProdukt[]>(`${origin}/wp-json/wc/store/v1/products?per_page=${MAX_PRODUKTE}`);
  if (Array.isArray(woo) && woo.length) {
    return woo.map((p) => ({
      titel: entities(stripTags(p.name)),
      preis: p.prices ? Number(p.prices.price) / 10 ** p.prices.currency_minor_unit || null : null,
      bild: absolut(p.images?.[0]?.src, origin),
      url: absolut(p.permalink, origin),
    }));
  }

  // schema.org Product im JSON-LD der Startseite
  const funde: KarteProdukt[] = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const daten = JSON.parse(m[1]);
      const liste = ([] as unknown[]).concat(daten?.["@graph"] ?? daten);
      for (const d of liste as Record<string, unknown>[]) {
        if (d?.["@type"] !== "Product" || typeof d.name !== "string") continue;
        const angebot = ([] as Record<string, unknown>[]).concat((d.offers as never) ?? [])[0];
        const bild = ([] as unknown[]).concat(d.image ?? [])[0];
        funde.push({
          titel: entities(d.name),
          preis: angebot?.price ? Number(angebot.price) || null : null,
          bild: absolut(typeof bild === "string" ? bild : null, origin),
          url: absolut(typeof d.url === "string" ? d.url : null, origin),
        });
      }
    } catch {
      /* kaputtes JSON-LD ist häufig – einfach überspringen */
    }
  }
  return funde;
}

/* ── Über-uns-Text ────────────────────────────────────────────── */

const UEBER_PFADE = ["/pages/about", "/pages/ueber-uns", "/pages/about-us", "/ueber-uns", "/about", "/about-us", "/unsere-geschichte"];

async function ueberUns(origin: string, html: string): Promise<string> {
  // Erst ein Link von der Startseite, der nach "über uns" aussieht …
  const link = html.match(/<a[^>]+href=["']([^"'#]+)["'][^>]*>\s*(?:über uns|ueber uns|about|unsere geschichte|wir sind|story)\s*</i)?.[1];
  const kandidaten = [link ? absolut(entities(link), origin) : null, ...UEBER_PFADE.map((p) => origin + p)];
  for (const url of kandidaten) {
    if (!url || new URL(url).origin !== origin) continue;
    const seite = await safeFetch(url);
    const text = seite ? stripTags(seite) : "";
    if (text.length > 400) return text.slice(0, 7000);
  }
  return "";
}

/** Impressum: Rechtsform, Gesellschafter, Konzernzugehörigkeit. */
async function impressumText(origin: string): Promise<string> {
  for (const pfad of IMPRESSUM_PATHS.slice(0, 2)) {
    const seite = await safeFetch(origin + pfad);
    const text = seite ? stripTags(seite) : "";
    if (text.length > 200) return text.slice(0, 3000);
  }
  return "";
}

/* ── Claude: Texte und Farbwahl ──────────────────────────────── */

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ENV ANTHROPIC_API_KEY fehlt");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["marke", "ort", "claim", "story", "fakten", "farben", "logo_index", "haltung", "besonders", "faktor", "faktor_grund", "wer", "zitat", "zitat_von", "kategorie", "vertrieb", "eigentum", "erkannt_grund"],
  properties: {
    marke: { type: "string" },
    ort: { type: "string" },
    claim: { type: "string" },
    story: { type: "string" },
    fakten: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["wert", "text"],
        properties: { wert: { type: "string" }, text: { type: "string" } },
      },
    },
    farben: {
      type: "object",
      additionalProperties: false,
      required: ["c", "bg"],
      properties: { c: { type: "string" }, bg: { type: "string" } },
    },
    logo_index: { type: "integer" },
    haltung: { type: "array", items: { type: "string", enum: [...HALTUNG_TAGS] } },
    besonders: { type: "string" },
    faktor: { type: "number" },
    faktor_grund: { type: "string" },
    wer: { type: "string" },
    zitat: { type: "string" },
    zitat_von: { type: "string" },
    kategorie: { type: "string", enum: [...KATEGORIEN_KANONISCH] },
    vertrieb: { type: "string", enum: ["nur_shop", "wenige", "fachhandel", "leh_breit", "unklar"] },
    eigentum: { type: "string", enum: ["gruender", "angels", "vc", "konzern", "unklar"] },
    erkannt_grund: { type: "string" },
  },
} as const;

type KiAntwort = {
  marke: string;
  ort: string;
  claim: string;
  story: string;
  fakten: { wert: string; text: string }[];
  farben: { c: string; bg: string };
  logo_index: number;
  haltung: HaltungTag[];
  besonders: string;
  faktor: number;
  faktor_grund: string;
  wer: string;
  zitat: string;
  zitat_von: string;
  kategorie: KategorieKanonisch;
  vertrieb: VertriebKey | "unklar";
  eigentum: EigentumKey | "unklar";
  erkannt_grund: string;
};

async function texte(q: {
  markeHinweis: string;
  titel: string;
  beschreibung: string;
  start: string;
  ueber: string;
  impressum: string;
  farben: string[];
  logos: string[];
  produkte: KarteProdukt[];
}): Promise<KiAntwort | null> {
  const quelle = [
    `Seitentitel: ${q.titel}`,
    `Meta-Beschreibung: ${q.beschreibung}`,
    `Markenname laut Formular: ${q.markeHinweis || "–"}`,
    `Produkte: ${q.produkte.slice(0, 12).map((p) => p.titel).join(" · ") || "–"}`,
    `Farben aus dem CSS (häufigste zuerst): ${q.farben.join(", ") || "–"}`,
    `Logo-Kandidaten (Index: URL):\n${q.logos.map((l, i) => `${i}: ${l}`).join("\n") || "–"}`,
    `Startseite (Text):\n${q.start}`,
    `Über-uns-Seite (Text):\n${q.ueber || "–"}`,
    `Impressum (Text):\n${q.impressum || "–"}`,
  ].join("\n\n");

  const res = await client().messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: `Du schreibst für Hub42, einen Laden in Berlin, der Regalfronten an junge Marken vermietet, den Entwurf einer Regalkarte (A5) für eine Marke. Quelle ist ausschließlich der Text ihrer eigenen Website, den du bekommst.

Regeln:
- Nur Fakten, die im Quelltext stehen. Nichts erfinden, nicht schätzen, keine Superlative ohne Beleg. Lieber zwei Fakten als ein ausgedachter.
- Deutsch, klar, warm, ohne Werbesprech. Keine Gender-Doppelpunkte („Kunden“, nicht „Kund:innen“).
- marke: der Markenname in der Schreibweise der Marke.
- ort: Stadt oder Region der Marke, wenn genannt, sonst leer.
- claim: höchstens 6 Wörter, was die Marke macht oder wofür sie steht.
- story: 3 bis 4 Sätze, höchstens 420 Zeichen: wer dahintersteht, warum es die Marke gibt, was das Produkt besonders macht.
- fakten: bis zu 3 Paare. wert ist kurz und groß gesetzt (z. B. „seit 2013“, „Bali“, „ohne Zucker“, höchstens 14 Zeichen), text erklärt ihn in höchstens 45 Zeichen.
- farben: wähle aus den CSS-Farben die Markenfarbe c, die man mit der Marke verbindet (nicht das Standard-Linkblau eines Shop-Themes), und einen sehr hellen Seitenton bg, der zu c passt (darf abgeleitet sein). Beides als #rrggbb.
- logo_index: Index des Kandidaten, der am ehesten das Hauptlogo ist, oder -1.
- haltung: die Tags aus der Liste, die die Website belegt. Im Zweifel weglassen.
- besonders: 1 bis 2 Sätze in Ich-/Wir-Form der Marke, was ihr Produkt besonders macht (Handwerk, Herkunft oder Mission), höchstens 300 Zeichen. Nur Belegtes; leer, wenn die Seite nichts davon hergibt.
- faktor: wie gut sich das Produkt im Laden spontan verkauft, verglichen mit einem typischen Hub42-Produkt (= 1,0). Zwischen 0,5 und 1,5. Höher bei Preis unter 15 €, gut probierbar, auffällige Packung, Geschenk- oder Berlin-Bezug. Niedriger bei hohem Preis, Erklärungsbedarf, Großgebinde oder schwer probierbar. Sei zurückhaltend; 1,0 ist der Normalfall.
- wer: wer hinter der Marke steht, z. B. „Gründerin: Leonie Tessenow“ oder „Gründer: Kaly und Pranav Bihari“. Nur Namen, die auf der Seite stehen, sonst leer.
- zitat: ein wörtliches Zitat einer Person der Marke, das so auf der Seite steht (höchstens 160 Zeichen), sonst leer. Nie umformulieren, nie erfinden. zitat_von: wer es sagt, sonst leer.
- kategorie: die passende Kategorie aus der Liste.
- vertrieb: wo man die Marke heute kaufen kann. nur_shop = nur eigener Shop, Märkte, Direktverkauf; wenige = in einzelnen Läden (unter 10 Händler); fachhandel = 10 bis 100 Händler, Bio- oder Feinkostketten; leh_breit = breit in Supermarkt- oder Drogerieketten (REWE, EDEKA, dm, Rossmann …) überregional gelistet. Achte auf Händlerlisten, „erhältlich bei“, Store-Finder. Ein einzelner REWE-Markt ist noch nicht leh_breit. unklar, wenn die Seite nichts dazu sagt.
- eigentum: aus Impressum und Über-uns. gruender = Gründer bzw. inhabergeführt; angels = Business Angels erwähnt; vc = Venture-Capital- bzw. Finanzierungsrunden; konzern = Tochter oder Marke eines Konzerns. unklar, wenn nicht erkennbar.
- erkannt_grund: ein kurzer Satz, woran du Vertrieb und Eigentum erkennst, höchstens 140 Zeichen.
- faktor_grund: ein Satz an die Marke, höchstens 140 Zeichen, warum dieser Faktor (z. B. „Unter 10 €, gut probierbar und mit Berlin-Geschichte: das greift man spontan.“).`,
    messages: [{ role: "user", content: quelle }],
  });

  if (res.stop_reason === "refusal") return null;
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    return JSON.parse(text) as KiAntwort;
  } catch {
    return null;
  }
}

/* ── Zusammenbau ──────────────────────────────────────────────── */

export async function karteAusWebsite(website: string, markeHinweis: string): Promise<KarteEntwurf | null> {
  const origin = toOrigin(website);
  if (!origin) return null;
  const html = await safeFetch(origin);
  if (!html) return null;

  const [prods, ueber, farben, impressum] = await Promise.all([
    produkte(origin, html),
    ueberUns(origin, html),
    farbKandidaten(html, origin),
    impressumText(origin),
  ]);
  const logos = logoKandidaten(html, origin);
  const titel = entities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "");

  const ki = await texte({
    markeHinweis,
    titel,
    beschreibung: entities(meta(html, "og:description") ?? meta(html, "description") ?? ""),
    start: stripTags(html).slice(0, 6000),
    ueber,
    impressum,
    farben,
    logos,
    produkte: prods,
  });
  if (!ki) return null;

  return {
    marke: (ki.marke || markeHinweis || meta(html, "og:site_name") || titel).slice(0, 60),
    ort: ki.ort.slice(0, 40),
    claim: ki.claim.slice(0, 60),
    story: ki.story.slice(0, 480),
    fakten: ki.fakten.slice(0, 3).map((f) => ({ wert: f.wert.slice(0, 18), text: f.text.slice(0, 60) })),
    farben: sichereFarben(ki.farben),
    logo: logos[ki.logo_index] ?? logos[0] ?? null,
    hero: absolut(meta(html, "og:image"), origin),
    web: new URL(origin).host.replace(/^www\./, ""),
    produkte: prods.filter((p) => p.titel).slice(0, MAX_PRODUKTE),
    haltung: ki.haltung.filter((h) => (HALTUNG_TAGS as readonly string[]).includes(h)),
    besonders: ki.besonders.slice(0, 300),
    faktor: klemmeFaktor(ki.faktor),
    faktorGrund: ki.faktor_grund.slice(0, 160),
    kategorie: ki.kategorie,
    vertrieb: ki.vertrieb === "unklar" ? "" : ki.vertrieb,
    eigentum: ki.eigentum === "unklar" ? "" : ki.eigentum,
    erkanntGrund: ki.erkannt_grund.slice(0, 160),
    instagram: instagram(html),
    wer: ki.wer.slice(0, 80),
    zitat: ki.zitat.slice(0, 180),
    zitatVon: ki.zitat ? ki.zitat_von.slice(0, 60) : "",
  };
}

/* ── Artikelkarte (A6): Texte zum gewählten Produkt ──────────── */

const ARTIKEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["head", "why", "know", "tip", "chips", "preis_fair", "preis_grund"],
  properties: {
    head: { type: "string" },
    why: { type: "array", items: { type: "string" } },
    know: { type: "string" },
    tip: { type: "string" },
    chips: { type: "array", items: { type: "string" } },
    preis_fair: { type: "boolean" },
    preis_grund: { type: "string" },
  },
} as const;

/** Liest die Produktseite (falls bekannt) und schreibt die Texte der A6-Karte. */
export async function artikelAusWebsite(
  produkt: KarteProdukt,
  marke: { marke: string; story: string; web: string },
): Promise<ArtikelTexte | null> {
  let seite = "";
  if (produkt.url && toOrigin(produkt.url) === toOrigin(marke.web)) {
    const html = await safeFetch(produkt.url);
    if (html) seite = stripTags(html).slice(0, 6000);
  }

  const res = await client().messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: { type: "json_schema", schema: ARTIKEL_SCHEMA } },
    system: `Du schreibst für Hub42, einen Laden in Berlin, die Texte einer A6-Artikelkarte, die neben dem Produkt im Regal steht. Quelle ist nur, was du über Marke und Produkt bekommst.

Regeln:
- Nur Belegtes. Nichts erfinden. Keine Heilsversprechen oder Gesundheitswirkungen (HCVO), auch nicht angedeutet.
- Deutsch, klar, kurz. Keine Gender-Doppelpunkte.
- head: Aufhänger, höchstens 45 Zeichen, z. B. „Wie Kaffee. Nur aus Mate.“
- why: genau 3 Gründe, warum sich dieses Produkt lohnt, je höchstens 55 Zeichen.
- know: „Gut zu wissen“, 1 bis 2 Sätze zu Herkunft, Herstellung oder Marke, höchstens 220 Zeichen.
- tip: ein Verwendungstipp, höchstens 110 Zeichen; leer, wenn nichts Sinnvolles belegt ist.
- chips: 2 bis 3 kurze Merkmale der Marke, je höchstens 24 Zeichen, z. B. „Neukölln seit 2013“, „Vegan“.
- preis_fair: Passt der Ladenpreis zu dem, was man bekommt (Menge bzw. Grundpreis, Qualität, Zutaten, Herkunft, Handarbeit), verglichen mit ähnlichen Produkten im Fach- und Feinkosthandel? Ein hoher Preis ist fair, wenn das Angebot ihn trägt. Im Zweifel true.
- preis_grund: ein Satz an die Marke, höchstens 140 Zeichen, warum, z. B. „8,75 € für fünf handbestäubte Bali-Schoten liegt im Rahmen guter Feinkost.“`,
    messages: [
      {
        role: "user",
        content: [
          `Marke: ${marke.marke}`,
          `Über die Marke: ${marke.story}`,
          `Produkt: ${produkt.titel}${produkt.preis ? `, ${produkt.preis} €` : ""}`,
          `Produktseite (Text):\n${seite || "–"}`,
        ].join("\n\n"),
      },
    ],
  });
  if (res.stop_reason === "refusal") return null;
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    const a = JSON.parse(text) as Omit<ArtikelTexte, "preis"> & { preis_fair: boolean; preis_grund: string };
    return {
      head: a.head.slice(0, 60),
      why: a.why.slice(0, 3).map((w) => w.slice(0, 70)),
      know: a.know.slice(0, 260),
      tip: a.tip.slice(0, 140),
      chips: a.chips.slice(0, 3).map((c) => c.slice(0, 30)),
      preis: produkt.preis ? { fair: a.preis_fair !== false, grund: a.preis_grund.slice(0, 160) } : null,
    };
  } catch {
    return null;
  }
}
