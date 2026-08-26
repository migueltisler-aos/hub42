// Brand-Attribution: pro Outreach-Link ein Token, damit später beantwortbar
// ist, WER das Deck geöffnet hat – nicht nur, dass es geöffnet wurde.
//
// Serverseitig-only (Service-Role-Key). Aufruf aus Server Components,
// Server Actions und den Mail-Bau-Modulen.
import { getSupabaseAdmin } from "./supabase-admin";

/** Basis-URL für die Links in Mails. Muss absolut sein – Mails haben keinen Host. */
const BASIS_URL = "https://tryhub42.de";

/**
 * 8 Zeichen aus einem Alphabet ohne Zwillinge (kein 0/O, 1/l/I).
 * Die Tokens landen in Mails und werden gelegentlich vorgelesen oder
 * abgetippt; Verwechslungen kosten dann eine Zuordnung.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function neuesToken(): string {
  let t = "";
  for (let i = 0; i < 8; i++) {
    t += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return t;
}

export interface BrandLink {
  token: string;
  brand_id: string;
  target: string;
  label: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Liefert den Link-Token für (Brand, Label) und legt ihn an, falls er fehlt.
 *
 * Idempotent über den Unique-Index auf (brand_id, coalesce(label,'')): derselbe
 * Outreach-Schritt derselben Brand ergibt immer denselben Token, auch wenn die
 * Mail neu gebaut oder erneut verschickt wird. Sonst hätte jede Mail einen
 * eigenen Token und die Lesezeit einer Brand wäre über mehrere Tokens
 * verstreut.
 */
export async function getOrCreateBrandLink(
  brandId: string,
  label: string | null = null,
  options: { target?: string; createdBy?: string } = {}
): Promise<BrandLink> {
  const sb = getSupabaseAdmin();
  const target = options.target ?? "/deck";

  const { data: vorhanden } = await sb
    .from("analytics_links")
    .select("*")
    .eq("brand_id", brandId)
    .eq("label", label ?? "")
    .maybeSingle();

  if (vorhanden) return vorhanden as BrandLink;

  // Kollisionen sind bei 31^8 Möglichkeiten unwahrscheinlich, aber der
  // Primary Key entscheidet, nicht die Wahrscheinlichkeit.
  for (let versuch = 0; versuch < 5; versuch++) {
    const { data, error } = await sb
      .from("analytics_links")
      .insert({ token: neuesToken(), brand_id: brandId, target, label, created_by: options.createdBy ?? null })
      .select("*")
      .single();

    if (!error && data) return data as BrandLink;

    // 23505 = unique_violation: entweder Token-Kollision (neu versuchen) oder
    // ein paralleler Aufruf war schneller (dann dessen Zeile nehmen).
    if (error?.code === "23505") {
      const { data: parallel } = await sb
        .from("analytics_links")
        .select("*")
        .eq("brand_id", brandId)
        .eq("label", label ?? "")
        .maybeSingle();
      if (parallel) return parallel as BrandLink;
      continue;
    }

    throw error;
  }

  throw new Error(`Konnte keinen Link-Token für Brand ${brandId} anlegen.`);
}

/** Fertiger Deck-Link für eine Outreach-Mail. */
export async function buildDeckLink(
  brandId: string,
  label: string | null = null,
  options: { createdBy?: string } = {}
): Promise<string> {
  const link = await getOrCreateBrandLink(brandId, label, options);
  return `${BASIS_URL}${link.target}?b=${link.token}`;
}

export interface BrandEngagement {
  brand_id: string;
  erste_oeffnung: string;
  letzte_oeffnung: string;
  sessions: number;
  aufrufe: number;
  lesezeit_ms: number;
  tiefste_pct: number | null;
  tiefste_sektion: string | null;
}

/** Deck-Aktivität einer Brand. null, wenn noch nie geöffnet. */
export async function getBrandEngagement(brandId: string): Promise<BrandEngagement | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("analytics_brand_engagement")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (error) throw error;
  return (data as BrandEngagement) ?? null;
}

/** Deck-Aktivität aller Brands, aktivste zuerst – für das Dashboard. */
export async function getAlleBrandEngagements(): Promise<
  Array<BrandEngagement & { brand_name: string | null }>
> {
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from("analytics_brand_engagement")
    .select("*")
    .order("letzte_oeffnung", { ascending: false });
  if (error) throw error;

  const zeilen = (data ?? []) as BrandEngagement[];
  if (zeilen.length === 0) return [];

  // Kein Join über die View, weil PostgREST auf Views keine
  // Fremdschlüssel-Beziehung kennt – deshalb ein zweiter, kleiner Lookup.
  const { data: brands } = await sb
    .from("pipeline_brands")
    .select("id, name")
    .in("id", zeilen.map((z) => z.brand_id));

  const namen = new Map((brands ?? []).map((b) => [b.id as string, b.name as string]));
  return zeilen.map((z) => ({ ...z, brand_name: namen.get(z.brand_id) ?? null }));
}
