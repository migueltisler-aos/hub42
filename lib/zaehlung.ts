// Laden-Funnel: Zählung des Teams (/zaehler) und Auswertung je Marke.
import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";
import { KASSE_STANDORT } from "./sumup-model";

export type ZaehlArt = "besucher" | "regal" | "gekostet";

const berlinTag = (iso: string | Date) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }).slice(0, 10);

/** Beginn des heutigen Tages in Berliner Zeit als ISO-Zeitpunkt. */
function heuteBeginn(): string {
  const jetzt = new Date();
  const lokal = new Date(jetzt.toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }).replace(" ", "T") + "Z");
  const versatz = lokal.getTime() - jetzt.getTime();
  const mitternacht = Date.UTC(lokal.getUTCFullYear(), lokal.getUTCMonth(), lokal.getUTCDate());
  return new Date(mitternacht - versatz).toISOString();
}

export interface MarkeImRegal {
  id: string;
  name: string;
}

/** Marken mit mindestens einem Artikel im Kassenstamm dieses Standorts. */
export async function markenImRegal(): Promise<MarkeImRegal[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("kasse_artikelstamm").select("brand_id").eq("standort_id", KASSE_STANDORT).not("brand_id", "is", null);
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((d) => d.brand_id as string))];
  if (!ids.length) return [];
  const { data: marken, error: e2 } = await db.from("pipeline_brands").select("id, name").in("id", ids);
  if (e2) throw e2;
  return (marken ?? []).sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export interface HeuteStand {
  besucher: number;
  jeMarke: Record<string, { regal: number; gekostet: number }>;
}

export async function heuteStand(): Promise<HeuteStand> {
  const { data, error } = await getSupabaseAdmin()
    .from("laden_zaehlung")
    .select("art, brand_id")
    .eq("standort_id", KASSE_STANDORT)
    .gte("ts", heuteBeginn())
    .limit(20000);
  if (error) throw error;
  const stand: HeuteStand = { besucher: 0, jeMarke: {} };
  for (const z of data ?? []) {
    if (z.art === "besucher") stand.besucher++;
    else if (z.brand_id) {
      const m = (stand.jeMarke[z.brand_id] ??= { regal: 0, gekostet: 0 });
      if (z.art === "regal") m.regal++;
      else if (z.art === "gekostet") m.gekostet++;
    }
  }
  return stand;
}

export async function zaehlen(art: ZaehlArt, brandId: string | null, von: string): Promise<void> {
  if ((art === "besucher") !== (brandId === null)) throw new Error("Besucher ohne Marke, Regal und Gekostet mit Marke.");
  const { error } = await getSupabaseAdmin()
    .from("laden_zaehlung")
    .insert({ standort_id: KASSE_STANDORT, art, brand_id: brandId, gezaehlt_von: von });
  if (error) throw error;
}

/** Nimmt die letzte eigene Zählung der letzten 10 Minuten zurück. */
export async function rueckgaengig(von: string): Promise<{ art: ZaehlArt; brand_id: string | null } | null> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("laden_zaehlung")
    .select("id, art, brand_id")
    .eq("gezaehlt_von", von)
    .gte("ts", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { error } = await db.from("laden_zaehlung").delete().eq("id", data.id);
  if (error) throw error;
  return { art: data.art as ZaehlArt, brand_id: data.brand_id };
}

// ── Auswertung für das Marken-Portal ────────────────────────────────────────

export interface Funnel {
  tage: number; // Zeitraum
  zaehltage: number; // Tage, an denen gezählt wurde
  besucher: number;
  regal: number;
  gekostet: number;
  gekauft: number; // Bons mit mindestens einem Artikel der Marke
}

/**
 * Alle vier Stufen nur über Tage, an denen das Team gezählt hat – sonst
 * stünden Käufe von ungezählten Tagen gegen Besucher von gezählten.
 */
export async function ladeFunnel(brandId: string, tage = 30): Promise<Funnel> {
  const db = getSupabaseAdmin();
  const von = new Date(Date.now() - tage * 864e5).toISOString();
  const [{ data: z, error }, { data: v, error: e2 }] = await Promise.all([
    db.from("laden_zaehlung").select("art, brand_id, ts").eq("standort_id", KASSE_STANDORT).gte("ts", von).limit(50000),
    db.from("kasse_verkaeufe").select("zeitstempel, sumup_transaktion_id, bon_nr, zeilen_uuid").eq("brand_id", brandId).eq("standort_id", KASSE_STANDORT).gte("zeitstempel", von).limit(20000),
  ]);
  if (error) throw error;
  if (e2) throw e2;

  const zaehltage = new Set((z ?? []).map((x) => berlinTag(x.ts)));
  let besucher = 0, regal = 0, gekostet = 0;
  for (const x of z ?? []) {
    if (x.art === "besucher") besucher++;
    else if (x.brand_id === brandId && x.art === "regal") regal++;
    else if (x.brand_id === brandId && x.art === "gekostet") gekostet++;
  }
  const bons = new Set(
    (v ?? [])
      .filter((x) => zaehltage.has(berlinTag(x.zeitstempel)))
      .map((x) => x.sumup_transaktion_id ?? (x.bon_nr != null ? `bon:${x.bon_nr}:${berlinTag(x.zeitstempel)}` : x.zeilen_uuid))
  );
  return { tage, zaehltage: zaehltage.size, besucher, regal, gekostet, gekauft: bons.size };
}
