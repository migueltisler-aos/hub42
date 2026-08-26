// Datenzugriff auf pipeline_brands. Läuft über den Service-Role-Key und ist
// damit serverseitig-only. Reine Logik liegt in ./pipeline-model.
import { getSupabaseAdmin } from "./supabase-admin";
import type { AiBrand, Brand, BrandInput, BrandStatus, FitCheckData, HaltungTag, ImportResult } from "./pipeline-model";
import { HALTUNG_TAGS, assessFit, deriveKoFlag, normalizeBrandName, normalizeInstagram, normalizeKategorie, normalizeWebsite, suggestHaltungTags } from "./pipeline-model";

// Re-Export, damit bestehende Server-Importe aus "@/lib/pipeline" unverändert
// weiterfunktionieren.
export * from "./pipeline-model";

export async function getBrands(filter?: {
  zugewiesen?: string;
  status?: BrandStatus;
}): Promise<Brand[]> {
  let query = getSupabaseAdmin()
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
  const { data, error } = await getSupabaseAdmin()
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
  const sb = getSupabaseAdmin();

  // Fit wird bei JEDEM Write serverseitig aus der zusammengeführten Zeile neu
  // gerechnet. Vorher kam das Label aus einem versteckten Formularfeld und
  // Schreibpfade ohne Formular (z. B. Mail-Versand) ließen es unangetastet —
  // 43 von 202 gespeicherten Labels passten deshalb nicht mehr zu ihren
  // eigenen Daten.
  const bestand = id ? await getBrand(id) : null;
  const merged = { ...(bestand ?? {}), ...input } as FitCheckData;
  const fit = assessFit(merged);
  const koFlag = deriveKoFlag(fit);

  // website_key nur anfassen, wenn der Patch überhaupt eine Website enthält.
  // Vorher wurde er bei jedem Teil-Update auf null gesetzt (z. B. beim
  // Mail-Versand) — der Dedup-Key verschwand und die Marke ließ sich erneut
  // importieren; 6 Zeilen im Bestand hat das bereits getroffen.
  const payload = {
    ...input,
    ...("website" in input
      ? { website_key: input.website ? normalizeWebsite(input.website) : null }
      : {}),
    hub42_fit: fit.label,
    fit_grund: fit.grund,
    ko_flag: koFlag,
  };

  if (id) {
    const { data, error } = await sb
      .from("pipeline_brands")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Brand;
  } else {
    const { data, error } = await sb
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
  const { error } = await getSupabaseAdmin()
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
  const sb = getSupabaseAdmin();

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

    // Haltungs-Tags: nur übernehmen, was in der geschlossenen Liste steht;
    // fehlen sie ganz, aus den Notizen vorschlagen (markiert nichts als
    // geprüft — groesse_quelle bleibt 'auto').
    const gelieferteTags = (b.haltung_tags ?? []).filter(
      (t): t is HaltungTag => (HALTUNG_TAGS as readonly string[]).includes(t)
    );
    const haltung_tags = gelieferteTags.length > 0
      ? gelieferteTags
      : suggestHaltungTags(b.notizen);

    const groesse = typeof b.groesse === "number" && b.groesse >= 1 && b.groesse <= 5
      ? b.groesse
      : null;

    const row = {
      name: b.name,
      website: b.website?.trim() || null,
      website_key,
      instagram: b.instagram?.trim() || null,
      kategorie: b.kategorie ?? null,
      kategorie_kanonisch:
        normalizeKategorie(b.kategorie_kanonisch) ?? normalizeKategorie(b.kategorie),
      produkt: b.produkt ?? null,
      preisrange: b.preisrange ?? null,
      standort: b.standort ?? null,
      notizen: b.notizen ?? null,
      follower_ca: b.follower_ca ?? null,
      groesse,
      groesse_quelle: groesse != null ? ("auto" as const) : null,
      haendler_ca: b.haendler_ca ?? null,
      retail_listung: b.retail_listung ?? null,
      eigene_filialen: b.eigene_filialen ?? null,
      funding: b.funding ?? null,
      haltung_satz: b.haltung_satz?.trim() || null,
      haltung_tags: haltung_tags.length > 0 ? haltung_tags : null,
      haltung_quelle: b.haltung_quelle?.trim() || null,
      haltung_stand: null,
      gefunden_via,
      status: "Neu",
      created_by,
      zugewiesen: created_by,
    };

    const fit = assessFit(row);

    const { error } = await sb.from("pipeline_brands").insert({
      ...row,
      hub42_fit: fit.label,
      fit_grund: fit.grund,
      ko_flag: deriveKoFlag(fit),
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
