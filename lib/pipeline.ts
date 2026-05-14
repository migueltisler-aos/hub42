import { supabase } from "./supabase";

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
  notizen: string | null;
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
}

export interface ImportResult {
  imported: number;
  duplicates: Array<{ name: string; existing_by: string | null }>;
  errors: string[];
}

export interface FitCheckData {
  website?: string | null;
  instagram?: string | null;
  preisrange?: string | null;
  standort?: string | null;
  notizen?: string | null;
  kategorie?: string | null;
}

export interface FitCriterion {
  id: string;
  label: string;
  hint: string;
  /** Hard gate: one failure → always "Eher nicht" regardless of positive score */
  disqualifier?: boolean;
  check: (b: FitCheckData) => boolean;
}

// Positive signals: brand benefits from Hub42 as a discovery platform
const POSITIVE_CRITERIA: FitCriterion[] = [
  {
    id: "eigener_shop",
    label: "Eigener Online-Shop",
    hint: "Website gesetzt",
    check: (b) => !!b.website?.trim(),
  },
  {
    id: "instagram",
    label: "Instagram-Präsenz",
    hint: "Instagram-Account gesetzt",
    check: (b) => !!b.instagram?.trim(),
  },
  {
    id: "preisrange",
    label: "Preisrange 10–60 €",
    hint: "Produkte zwischen 10 und 60 € — Alexa-Laufkundschaft",
    check: (b) => {
      if (!b.preisrange?.trim()) return false;
      const nums = (b.preisrange.match(/\d+/g) ?? []).map(Number);
      return nums.length > 0 && Math.max(...nums) <= 60;
    },
  },
  {
    id: "dach",
    label: "DACH-Standort",
    hint: "Marke sitzt in Deutschland, Österreich oder Schweiz",
    check: (b) => {
      const s = (b.standort ?? "").toLowerCase();
      return /deutschland|berlin|hamburg|münchen|köln|frankfurt|düsseldorf|austria|österreich|schweiz|germany/.test(s);
    },
  },
  {
    id: "founder",
    label: "Founder-Story erkennbar",
    hint: "Persönliche Gründergeschichte — zentral für Hub42-Curation",
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return /founder|gründer|gründerin|owner|inhaberin|inhaber|founder-geführt|founder-led/.test(n);
    },
  },
  {
    id: "kategorie",
    label: "Passendes Segment",
    hint: "Food · Drinks · Beauty / Kosmetik · Lifestyle · Home",
    check: (b) => {
      const k = (b.kategorie ?? "").toLowerCase();
      return /food|drinks|beauty|kosmetik|lifestyle|home/.test(k);
    },
  },
];

// Disqualifiers: brand already has mass distribution → doesn't need Hub42
const DISQUALIFIER_CRITERIA: FitCriterion[] = [
  {
    id: "kein_stationaer",
    label: "Kein Listing bei Rewe / DM / Rossmann / Douglas",
    hint: "Massenvertrieb stationär — Marke braucht keine Entdeckungsplattform mehr",
    disqualifier: true,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return !/\brewe\b|\bedeka\b|\bdm\b|\brossmann\b|\bmüller\b|\baldi\b|\blidl\b|\bkaufland\b|\bdouglas\b/.test(n);
    },
  },
  {
    id: "kein_online_massenvertrieb",
    label: "Kein Massenvertrieb online (Zalando, Amazon, Otto …)",
    hint: "Schon überall gelistet — kein Bedarf an einem kuratierten Channel",
    disqualifier: true,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return !/zalando|amazon|\botto\b|about.?you/.test(n);
    },
  },
  {
    id: "emerging",
    label: "Emerging Brand — noch nicht überall bekannt",
    hint: "Millionen-Follower-Brands oder Celebrity-Labels brauchen Hub42 nicht zur Entdeckung",
    disqualifier: true,
    check: (b) => {
      const n = (b.notizen ?? "").toLowerCase();
      return !/million\s*follower|mio\.\s*follower|\d+\s*mio\.?\s*(instagram|follower)|eigene (filialen|stores|shop.in.shop)|bundesweit bekannt/.test(n);
    },
  },
];

export const FIT_CRITERIA: FitCriterion[] = [
  ...POSITIVE_CRITERIA,
  ...DISQUALIFIER_CRITERIA,
];

export function assessFit(brand: FitCheckData): "Top" | "Gut" | "Eher nicht" {
  // Hard gate: any disqualifier failing → automatic Eher nicht
  if (DISQUALIFIER_CRITERIA.some((c) => !c.check(brand))) return "Eher nicht";

  const passed = POSITIVE_CRITERIA.filter((c) => c.check(brand)).length;
  if (passed >= 5) return "Top";
  if (passed >= 3) return "Gut";
  return "Eher nicht";
}

export function normalizeWebsite(url: string): string {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "");
}

export async function getBrands(filter?: {
  zugewiesen?: string;
  status?: BrandStatus;
}): Promise<Brand[]> {
  let query = supabase
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
  const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from("pipeline_brands")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Brand;
  } else {
    const { data, error } = await supabase
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
  const { error } = await supabase
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

  for (const b of brands) {
    if (!b.name?.trim()) continue;

    const website_key = b.website ? normalizeWebsite(b.website) : null;

    if (website_key) {
      const { data: existing } = await supabase
        .from("pipeline_brands")
        .select("name, zugewiesen")
        .eq("website_key", website_key)
        .maybeSingle();

      if (existing) {
        result.duplicates.push({
          name: b.name,
          existing_by: (existing as { zugewiesen: string | null }).zugewiesen,
        });
        continue;
      }
    }

    const hub42_fit = assessFit(b);

    const { error } = await supabase.from("pipeline_brands").insert({
      name: b.name,
      website: b.website ?? null,
      website_key,
      instagram: b.instagram ?? null,
      kategorie: b.kategorie ?? null,
      produkt: b.produkt ?? null,
      preisrange: b.preisrange ?? null,
      standort: b.standort ?? null,
      notizen: b.notizen ?? null,
      gefunden_via,
      hub42_fit,
      status: "Neu",
      created_by,
      zugewiesen: created_by,
    });

    if (error) {
      if (error.code === "23505") {
        result.duplicates.push({ name: b.name, existing_by: null });
      } else {
        result.errors.push(`${b.name}: ${error.message}`);
      }
    } else {
      result.imported++;
    }
  }

  return result;
}
