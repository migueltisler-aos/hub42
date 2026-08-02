import { getSupabaseClient } from "./supabase";

export interface Sendung {
  id: string;
  standort_id: string;
  brand_id: string | null;
  dhl_tracking_nr: string | null;
  eingegangen_am: string;
  eingegangen_von: string | null;
}

export interface Charge {
  id: string;
  sendung_id: string;
  charge_code: string;
  ean: string;
  artikel_name: string | null;
  menge: number;
  mhd: string | null;
}

export interface SendungMitBrand extends Sendung {
  brand: { name: string } | null;
}

export interface SendungMitChargen extends Sendung {
  chargen: Charge[];
}

export interface ChargeMitSendung extends Charge {
  sendung: Sendung;
}

export interface ArtikelZeile {
  ean: string;
  artikel_name: string | null;
  menge: number;
  mhd: string | null;
}

export interface SendungInput {
  standort_id: string;
  brand_id: string | null;
  dhl_tracking_nr: string | null;
  eingegangen_von: string;
  artikel: ArtikelZeile[];
}

export interface NachbestellungInput {
  charge_id: string;
  brand_id: string | null;
  ean: string;
  artikel_name: string | null;
  menge_angefragt: number | null;
  nachschub_email: string | null;
  ausgeloest_von: string;
}

function generiereChargeCode(standortId: string): string {
  const datum = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const zufall = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WE-${standortId}-${datum}-${zufall}`;
}

export async function erfasseSendung(input: SendungInput): Promise<Sendung> {
  const supabase = getSupabaseClient();

  const { data: sendung, error: sendungError } = await supabase
    .from("wareneingang_sendungen")
    .insert({
      standort_id: input.standort_id,
      brand_id: input.brand_id,
      dhl_tracking_nr: input.dhl_tracking_nr,
      eingegangen_von: input.eingegangen_von,
    })
    .select()
    .single();
  if (sendungError) throw sendungError;

  const chargenZeilen = input.artikel.map((a) => ({
    sendung_id: sendung.id,
    charge_code: generiereChargeCode(input.standort_id),
    ean: a.ean,
    artikel_name: a.artikel_name,
    menge: a.menge,
    mhd: a.mhd,
  }));
  const { error: chargenError } = await supabase.from("wareneingang_chargen").insert(chargenZeilen);
  if (chargenError) throw chargenError;

  return sendung as Sendung;
}

export async function ladeSendungen(): Promise<SendungMitBrand[]> {
  const { data, error } = await getSupabaseClient()
    .from("wareneingang_sendungen")
    .select("*, brand:pipeline_brands(name)")
    .order("eingegangen_am", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as unknown as SendungMitBrand[];
}

export async function ladeSendungMitChargen(id: string): Promise<SendungMitChargen | null> {
  const { data, error } = await getSupabaseClient()
    .from("wareneingang_sendungen")
    .select("*, chargen:wareneingang_chargen(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as SendungMitChargen;
}

export async function ladeChargeMitSendung(id: string): Promise<ChargeMitSendung | null> {
  const { data, error } = await getSupabaseClient()
    .from("wareneingang_chargen")
    .select("*, sendung:wareneingang_sendungen(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as ChargeMitSendung;
}

export async function ladeNachschubEmail(brandId: string): Promise<string | null> {
  const { data, error } = await getSupabaseClient()
    .from("pipeline_angebote")
    .select("nachschub_email")
    .eq("brand_id", brandId)
    .not("nachschub_email", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.nachschub_email as string | null;
}

export async function nachbestellungAusloesen(input: NachbestellungInput): Promise<void> {
  const { error } = await getSupabaseClient().from("wareneingang_nachbestellungen").insert(input);
  if (error) throw error;
}

// Verhindert doppelte Nachbestellungen: gesperrt, solange seit der letzten
// Ausloesung fuer diese ean/standort_id weder Ware eingegangen ist noch
// 3 Werktage vergangen sind (siehe nachbestellung_gesperrt()-Funktion in Supabase).
export async function pruefeNachbestellungGesperrt(ean: string, standortId: string): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc("nachbestellung_gesperrt", {
    p_ean: ean,
    p_standort_id: standortId,
  });
  if (error) throw error;
  return Boolean(data);
}
