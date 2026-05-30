import { getSupabaseClient } from "./supabase";

export type BrandStatus =
  | "Neu"
  | "Kontaktiert"
  | "Antwort"
  | "Gespräch"
  | "Angebot"
  | "Onboarded"
  | "Abgelehnt"
  | "Später"
  | "Inaktiv";

export interface Brand {
  id: string;
  name: string;
  website: string | null;
  website_key: string | null;
  instagram: string | null;
  email: string | null;
  linkedin: string | null;
  ansprechpartner: string | null;
  kategorie: string | null;
  produkt: string | null;
  preisrange: string | null;
  standort: string | null;
  gefunden_via: string | null;
  zugewiesen: string | null;
  status: BrandStatus;
  kanal: string | null;
  datum_erstkontakt: string | null;
  datum_letzte_aktion: string | null;
  naechste_aktion: string | null;
  datum_naechste_aktion: string | null;
  feedback: string | null;
  hub42_fit: string | null;
  hub42_potenzial: string | null;
  notizen: string | null;
  follower_ca: number | null;
  created_at: string;
  created_by: string | null;
}

export type BrandInput = Omit<Brand, "id" | "created_at">;

export interface AiBrand {
  name: string;
  website?: string;
  instagram?: string;
  kategorie?: string;
  produkt?: string;
  preisrange?: string;
  standort?: string;
  notizen?: string;
  follower_ca?: number;
}

export interface ImportResult {
  imported: number;
  duplicates: Array<{ name: string; existing_by: string | null; reason: "website" | "instagram" | "name" }>;
  errors: string[];
}

export interface FitCheckData {
  website?: string | null;
  instagram?: string | null;
  preisrange?: string | null;
  standort?: string | null;
  notizen?: string | null;
  kategorie?: string | null;
  follower_ca?: number | null;
}

export interface FitCriterion {
  id: string;
  label: string;
  hint: string;
  /** Hard gate: one failure → always "Eher nicht" */
  gate?: boolean;
  /** Points contributed when passed (scored criteria only) */
  weight?: number;
  check: (b: FitCheckData) => boolean;
}

// Hard gates based on hub42_v17.docx admission criteria
const GATE_CRITERIA: FitCriterion[] = [
  {
    id: "kein_konzern",
    label: "Kein Konzern / Corporate Brand",
    hint: "Großkonzern braucht Hub42 nicht — und passt nicht zur Curation",
    gate: true,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return !/\bkonzern\b|\b(ag|se)\b|unilever|p&g|nestl[eé]|henkel|beiersdorf/.test(n);
    },
  },
  {
    id: "kein_leh_konflikt",
    label: "Keine LEH-Preisbindungskonflikte (Rewe, DM, Rossmann …)",
    hint: "Stationärer Massenvertrieb → Marke hat keinen Bedarf an Entdeckungsplattform",
    gate: true,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return !/\brewe\b|\bedeka\b|\bdm\b|\brossmann\b|\bmüller\b|\baldi\b|\blidl\b|\bkaufland\b|\bdouglas\b/.test(n);
    },
  },
  {
    id: "kein_online_mass",
    label: "Kein Massenvertrieb online (Zalando, Amazon, Otto …)",
    hint: "Schon überall gelistet — kein Bedarf an kuratierten Channel",
    gate: true,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return !/zalando|amazon|\botto\b|about.?you/.test(n);
    },
  },
];

// Weighted positive criteria — max 8 points total
const SCORED_CRITERIA: FitCriterion[] = [
  {
    id: "erklaerbare_story",
    label: "Erkennbare Founder-Story",
    hint: "Persönliche Gründergeschichte in Notizen eintragen",
    weight: 3,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return /founder|gründer|gründerin|owner|inhaberin|inhaber|founder-geführt|founder-led/.test(n);
    },
  },
  {
    id: "fairer_preis",
    label: "Fairer Preis (10–60 €)",
    hint: "Preisrange setzen — Zahlen bis max. 60",
    weight: 2,
    check: (b) => {
      if (!b.preisrange?.trim()) return false;
      const nums = (b.preisrange.match(/\d+/g) ?? []).map(Number);
      return nums.length > 0 && Math.max(...nums) <= 60;
    },
  },
  {
    id: "eigener_kanal",
    label: "Eigene Discovery-Kanäle (Shop + Instagram)",
    hint: "Beide Felder müssen gesetzt sein",
    weight: 2,
    check: (b) => !!b.website?.trim() && !!b.instagram?.trim(),
  },
  {
    id: "entdeckbar",
    label: "DACH-Emerging Brand",
    hint: "Standort (DACH) setzen; unter 500.000 Follower",
    weight: 1,
    check: (b) => {
      const s = (b.standort ?? "").toLowerCase();
      const n = (b.notizen ?? "").toLowerCase();
      const isDach = /deutschland|berlin|hamburg|münchen|köln|frankfurt|düsseldorf|austria|österreich|schweiz|germany/.test(s);
      // follower_ca wenn vorhanden, sonst Regex-Fallback auf notizen
      const isMassFollower = b.follower_ca != null
        ? b.follower_ca > 500_000
        : /million\s*follower|mio\.\s*follower|\d+\s*mio\.?\s*(instagram|follower)|bundesweit bekannt/.test(n);
      return isDach && !isMassFollower;
    },
  },
];

export const FIT_CRITERIA: FitCriterion[] = [
  ...GATE_CRITERIA,
  ...SCORED_CRITERIA,
];

export function assessFit(brand: FitCheckData): "Top" | "Gut" | "Eher nicht" {
  if (GATE_CRITERIA.some((c) => !c.check(brand))) return "Eher nicht";
  const score = SCORED_CRITERIA.filter((c) => c.check(brand))
    .reduce((sum, c) => sum + (c.weight ?? 1), 0);
  if (score >= 6) return "Top";
  if (score >= 3) return "Gut";
  return "Eher nicht";
}

export function normalizeWebsite(url: string): string {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "");
}

export function normalizeInstagram(handle: string): string {
  return handle
    .toLowerCase()
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "")
    .split("?")[0]; // strip query params
}

export function normalizeBrandName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+(gmbh|ug|ag|gbr|e\.k\.|& co\. kg|kg|ohg|e\.v\.)\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getBrands(filter?: {
  zugewiesen?: string;
  status?: BrandStatus;
}): Promise<Brand[]> {
  let query = getSupabaseClient()
    .from("pipeline_brands")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter?.zugewiesen) {
    query = query.eq("zugewiesen", filter.zugewiesen);
  }
  if (filter?.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Brand[];
}

export async function getBrand(id: string): Promise<Brand | null> {
  const { data, error } = await getSupabaseClient()
    .from("pipeline_brands")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Brand;
}

export async function upsertBrand(
  id: string | null,
  input: Partial<BrandInput>
): Promise<Brand> {
  const payload = {
    ...input,
    website_key: input.website ? normalizeWebsite(input.website) : null,
  };

  if (id) {
    const { data, error } = await getSupabaseClient()
      .from("pipeline_brands")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Brand;
  } else {
    const { data, error } = await getSupabaseClient()
      .from("pipeline_brands")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Brand;
  }
}

export async function updateStatus(
  id: string,
  status: BrandStatus
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("pipeline_brands")
    .update({ status, datum_letzte_aktion: new Date().toISOString().split("T")[0] })
    .eq("id", id);
  if (error) throw error;
}

export async function importBrands(
  brands: AiBrand[],
  gefunden_via: string,
  created_by: string
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, duplicates: [], errors: [] };
  const sb = getSupabaseClient();

  // Einmalig alle bestehenden Keys laden (1 Query für den ganzen Batch)
  const { data: existing } = await sb
    .from("pipeline_brands")
    .select("name, website_key, instagram, zugewiesen");

  const existingBrands = (existing ?? []) as Array<{
    name: string;
    website_key: string | null;
    instagram: string | null;
    zugewiesen: string | null;
  }>;

  const existingWebsiteKeys = new Set(
    existingBrands.map((b) => b.website_key).filter(Boolean)
  );
  const existingInstagramKeys = new Set(
    existingBrands
      .map((b) => (b.instagram ? normalizeInstagram(b.instagram) : null))
      .filter(Boolean)
  );
  const existingNameKeys = new Map(
    existingBrands.map((b) => [normalizeBrandName(b.name), b.zugewiesen])
  );

  for (const b of brands) {
    if (!b.name?.trim()) continue;

    const website_key = b.website?.trim() ? normalizeWebsite(b.website) : null;
    const instagram_key = b.instagram?.trim() ? normalizeInstagram(b.instagram) : null;
    const name_key = normalizeBrandName(b.name);

    // Dedup 1: website_key
    if (website_key && existingWebsiteKeys.has(website_key)) {
      const match = existingBrands.find((e) => e.website_key === website_key);
      result.duplicates.push({ name: b.name, existing_by: match?.zugewiesen ?? null, reason: "website" });
      continue;
    }

    // Dedup 2: instagram handle
    if (instagram_key && existingInstagramKeys.has(instagram_key)) {
      const match = existingBrands.find(
        (e) => e.instagram && normalizeInstagram(e.instagram) === instagram_key
      );
      result.duplicates.push({ name: b.name, existing_by: match?.zugewiesen ?? null, reason: "instagram" });
      continue;
    }

    // Dedup 3: normalisierter Name
    if (existingNameKeys.has(name_key)) {
      result.duplicates.push({ name: b.name, existing_by: existingNameKeys.get(name_key) ?? null, reason: "name" });
      continue;
    }

    const hub42_fit = assessFit(b);

    const { error } = await sb.from("pipeline_brands").insert({
      name: b.name,
      website: b.website?.trim() || null,
      website_key,
      instagram: b.instagram?.trim() || null,
      kategorie: b.kategorie ?? null,
      produkt: b.produkt ?? null,
      preisrange: b.preisrange ?? null,
      standort: b.standort ?? null,
      notizen: b.notizen ?? null,
      follower_ca: b.follower_ca ?? null,
      gefunden_via,
      hub42_fit,
      status: "Neu",
      created_by,
      zugewiesen: created_by,
    });

    if (error) {
      if (error.code === "23505") {
        result.duplicates.push({ name: b.name, existing_by: null, reason: "name" });
      } else {
        result.errors.push(`${b.name}: ${error.message}`);
      }
    } else {
      result.imported++;
      // Neu importierte Brand für spätere Dedup-Checks in dieser Batch-Session registrieren
      if (website_key) existingWebsiteKeys.add(website_key);
      if (instagram_key) existingInstagramKeys.add(instagram_key);
      existingNameKeys.set(name_key, created_by);
    }
  }

  return result;
}
