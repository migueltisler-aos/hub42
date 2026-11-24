import { getSupabaseAdmin } from "./supabase-admin";

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
  const { data, error } = await getSupabaseAdmin()
    .from("bestand_reichweite")
    .select("*")
    .eq("standort_id", standortId)
    .order("nachbestellung_empfohlen", { ascending: false })
    .order("artikel_name", { ascending: true });
  if (error) throw error;
  return data as BestandReichweite[];
}

export async function abgangBuchen(input: AbgangInput): Promise<void> {
  const { error } = await getSupabaseAdmin().from("bestand_bewegungen").insert({
    ean: input.ean,
    standort_id: input.standort_id,
    menge_delta: -Math.abs(input.menge),
    quelle: input.quelle,
    notiz: input.notiz,
    gebucht_von: input.gebucht_von,
  });
  if (error) throw error;
}

export interface NegativerBestand {
  ean: string;
  standort_id: string;
  artikel_name: string | null;
  brand_name: string | null;
  bestand: number;
}

/**
 * Artikel mit negativem Bestand, ueber alle Laeden.
 *
 * Ein Minus ist physikalisch unmoeglich: verkauft wurde, was nie als Zugang
 * gebucht wurde. Es heisst nicht "wenig Ware", sondern "der Wareneingang
 * fehlt" -- und solange er fehlt, ist jede Reichweite, jeder Mindestbestand
 * und jede Abverkaufsquote dieses Artikels falsch.
 *
 * Bewusst ohne Standort-Filter: die Bestandsseite zeigt immer genau einen
 * Laden, und der laufende ist seit Beeskow nicht mehr der, in dem das Minus
 * steht. Gefiltert waere die Warnung unsichtbar, genau solange sie gilt.
 */
export async function ladeNegativeBestaende(): Promise<NegativerBestand[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("bestand_aktuell")
    .select("ean, standort_id, menge")
    .lt("menge", 0)
    .order("menge", { ascending: true });
  if (error) throw error;
  const zeilen = (data ?? []) as { ean: string; standort_id: string; menge: number }[];
  if (zeilen.length === 0) return [];

  // Namen getrennt holen: bestand_aktuell ist eine View ohne Fremdschluessel,
  // PostgREST kann darueber nicht joinen.
  const { data: stamm } = await getSupabaseAdmin()
    .from("kasse_artikelstamm")
    .select("ean, standort_id, artikel_name, brand_name")
    .in("ean", zeilen.map((z) => z.ean));
  const namen = new Map(
    ((stamm ?? []) as { ean: string; standort_id: string; artikel_name: string | null; brand_name: string | null }[]).map(
      (a) => [`${a.standort_id}|${a.ean}`, a],
    ),
  );

  return zeilen.map((z) => {
    const a = namen.get(`${z.standort_id}|${z.ean}`);
    return {
      ean: z.ean,
      standort_id: z.standort_id,
      artikel_name: a?.artikel_name ?? null,
      brand_name: a?.brand_name ?? null,
      bestand: z.menge,
    };
  });
}
