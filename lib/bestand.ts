import { getSupabaseClient } from "./supabase";

export interface BestandReichweite {
  ean: string;
  standort_id: string;
  artikel_name: string | null;
  brand_name: string | null;
  bestand: number;
  verkauf_pro_tag: number;
  mindestbestand: number;
  nachbestellung_gesperrt: boolean;
  nachbestellung_empfohlen: boolean;
}

export type AbgangQuelle = "muster_entnahme" | "abschrift" | "korrektur";

export interface AbgangInput {
  ean: string;
  standort_id: string;
  menge: number;
  quelle: AbgangQuelle;
  notiz: string | null;
  gebucht_von: string;
}

export async function ladeBestandReichweite(standortId: string): Promise<BestandReichweite[]> {
  const { data, error } = await getSupabaseClient()
    .from("bestand_reichweite")
    .select("*")
    .eq("standort_id", standortId)
    .order("nachbestellung_empfohlen", { ascending: false })
    .order("artikel_name", { ascending: true });
  if (error) throw error;
  return data as BestandReichweite[];
}

export async function abgangBuchen(input: AbgangInput): Promise<void> {
  const { error } = await getSupabaseClient().from("bestand_bewegungen").insert({
    ean: input.ean,
    standort_id: input.standort_id,
    menge_delta: -Math.abs(input.menge),
    quelle: input.quelle,
    notiz: input.notiz,
    gebucht_von: input.gebucht_von,
  });
  if (error) throw error;
}
