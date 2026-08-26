// Datenzugriff auf pipeline_angebote. Läuft über den Service-Role-Key und ist
// damit serverseitig-only. Reine Logik liegt in ./angebote-model.
import { getSupabaseAdmin } from "./supabase-admin";
import type { Angebot, AngebotInput, AngebotStatus } from "./angebote-model";

// Re-Export, damit bestehende Server-Importe aus "@/lib/angebote" unverändert
// weiterfunktionieren.
export * from "./angebote-model";


export async function getAngebote(): Promise<Angebot[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("pipeline_angebote")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Angebot[];
}

export async function getAngebot(id: string): Promise<Angebot | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("pipeline_angebote")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Angebot;
}

export async function getAngeboteForBrand(brandId: string): Promise<Angebot[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("pipeline_angebote")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Angebot[];
}

/** Fortlaufende Angebotsnummer pro Jahr: AG-2026-001 */
export async function generateAngebotNr(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await getSupabaseAdmin()
    .from("pipeline_angebote")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  return `AG-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function upsertAngebot(
  id: string | null,
  input: Partial<AngebotInput>
): Promise<Angebot> {
  const sb = getSupabaseAdmin();
  if (id) {
    const { data, error } = await sb
      .from("pipeline_angebote")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Angebot;
  } else {
    const angebot_nr = input.angebot_nr ?? (await generateAngebotNr());
    const { data, error } = await sb
      .from("pipeline_angebote")
      .insert({ ...input, angebot_nr })
      .select()
      .single();
    if (error) throw error;
    return data as Angebot;
  }
}

export async function updateAngebotStatus(
  id: string,
  status: AngebotStatus
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("pipeline_angebote")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}


export async function deleteAngebot(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("pipeline_angebote")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
