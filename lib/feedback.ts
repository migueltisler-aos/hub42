import { getSupabaseClient } from "./supabase";

export interface DifferentialPair {
  left: string;
  right: string;
}

export const HEDONIC_FACES = ["😖", "😞", "🙁", "😕", "😐", "🙂", "😊", "😄", "🤩"];

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  store: string | null;
  shelf_code: string | null;
  batch: string | null;
  attributes: DifferentialPair[];
  price_enabled: boolean;
  created_at: string;
}

export type ProductInput = Omit<Product, "id" | "created_at">;

export interface Panel {
  id: string;
  consent_at: string | null;
  age_range: string | null;
  gender: string | null;
  household_size: string | null;
  shopping_frequency: string | null;
  contact_email: string | null;
  contact_opt_in_at: string | null;
  contact_interests: string[];
  created_at: string;
}

export interface PanelConsentInput {
  ageRange: string;
  gender: string;
  householdSize: string;
  shoppingFrequency: string;
}

export interface RatingInput {
  panelId: string;
  productId: string;
  hedonic: number;
  semDiff: number[];
  priceTooCheap?: number | null;
  priceCheap?: number | null;
  priceExpensive?: number | null;
  priceTooExpensive?: number | null;
  storeContext?: string | null;
  shelfContext?: string | null;
  batchContext?: string | null;
}

export interface Rating {
  id: string;
  panel_id: string;
  product_id: string;
  hedonic: number;
  sem_diff: number[];
  price_too_cheap: number | null;
  price_cheap: number | null;
  price_expensive: number | null;
  price_too_expensive: number | null;
  scanned_at: string;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Product;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function createPanel(): Promise<Panel> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_panels")
    .insert({})
    .select()
    .single();
  if (error) throw error;
  return data as Panel;
}

export async function getPanel(id: string): Promise<Panel | null> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_panels")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Panel;
}

export async function setPanelConsent(
  id: string,
  input: PanelConsentInput
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("feedback_panels")
    .update({
      consent_at: new Date().toISOString(),
      age_range: input.ageRange,
      gender: input.gender,
      household_size: input.householdSize,
      shopping_frequency: input.shoppingFrequency,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function getRatingForPanelProduct(
  panelId: string,
  productId: string
): Promise<Rating | null> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .select("*")
    .eq("panel_id", panelId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Rating;
}

export async function createRating(input: RatingInput): Promise<Rating> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .insert({
      panel_id: input.panelId,
      product_id: input.productId,
      hedonic: input.hedonic,
      sem_diff: input.semDiff,
      price_too_cheap: input.priceTooCheap ?? null,
      price_cheap: input.priceCheap ?? null,
      price_expensive: input.priceExpensive ?? null,
      price_too_expensive: input.priceTooExpensive ?? null,
      store_context: input.storeContext ?? null,
      shelf_context: input.shelfContext ?? null,
      batch_context: input.batchContext ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Rating;
}

interface RatedProductRow {
  product_id: string;
  product: { name: string } | { name: string }[] | null;
}

export async function getPanelProgress(
  panelId: string
): Promise<{ count: number; productNames: string[] }> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .select("product_id, product:feedback_products(name)")
    .eq("panel_id", panelId)
    .order("scanned_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as unknown as RatedProductRow[];
  const productNames = rows.map((r) => {
    const p = Array.isArray(r.product) ? r.product[0] : r.product;
    return p?.name ?? "Unbekanntes Produkt";
  });
  return { count: rows.length, productNames };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export interface ProductStats {
  product: Product;
  n: number;
  hedonicMean: number;
  hedonicSd: number;
  hedonicDistribution: number[]; // index 0 = count of "1", ... index 8 = count of "9"
  semDiffMeans: number[]; // one mean per attribute pair
  priceStats: {
    tooCheap: number;
    cheap: number;
    expensive: number;
    tooExpensive: number;
    n: number;
  } | null;
}

export async function getProductStats(productId: string): Promise<ProductStats | null> {
  const product = await getProduct(productId);
  if (!product) return null;

  const { data, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .select("*")
    .eq("product_id", productId);
  if (error) throw error;
  const ratings = (data ?? []) as Rating[];

  const hedonicValues = ratings.map((r) => r.hedonic);
  const hedonicDistribution = Array(9).fill(0);
  hedonicValues.forEach((v) => {
    if (v >= 1 && v <= 9) hedonicDistribution[v - 1]++;
  });

  const axisCount = product.attributes.length;
  const semDiffMeans = Array.from({ length: axisCount }, (_, axis) =>
    mean(ratings.map((r) => r.sem_diff[axis]).filter((v) => v != null))
  );

  const priceRows = ratings.filter((r) => r.price_too_cheap != null);
  const priceStats = product.price_enabled
    ? {
        tooCheap: mean(priceRows.map((r) => r.price_too_cheap as number)),
        cheap: mean(priceRows.map((r) => r.price_cheap as number)),
        expensive: mean(priceRows.map((r) => r.price_expensive as number)),
        tooExpensive: mean(priceRows.map((r) => r.price_too_expensive as number)),
        n: priceRows.length,
      }
    : null;

  return {
    product,
    n: ratings.length,
    hedonicMean: mean(hedonicValues),
    hedonicSd: stddev(hedonicValues),
    hedonicDistribution,
    semDiffMeans,
    priceStats,
  };
}

export async function getPanelOverview(): Promise<{
  uniquePanels: number;
  avgProductsPerPanel: number;
}> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .select("panel_id");
  if (error) throw error;
  const panelIds = (data ?? []).map((r) => r.panel_id as string);
  const uniquePanels = new Set(panelIds).size;
  const avgProductsPerPanel = uniquePanels > 0 ? panelIds.length / uniquePanels : 0;
  return { uniquePanels, avgProductsPerPanel };
}

export async function getRatingsTodayCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .select("id", { count: "exact", head: true })
    .gte("scanned_at", startOfDay.toISOString());
  if (error) throw error;
  return count ?? 0;
}

// ── Einstellungen ────────────────────────────────────────────────────────
// Alle Schwellen (Scout-Level, Spiel-Ticket-Intervall, Vergleichs-Meilenstein)
// sind über /feedback/admin/settings ohne Code-Deploy einstellbar.

export interface Settings {
  scout_bronze_threshold: number;
  scout_silver_threshold: number;
  scout_gold_threshold: number;
  game_ticket_interval: number;
  comparison_reveal_threshold: number;
}

const DEFAULT_SETTINGS: Settings = {
  scout_bronze_threshold: 3,
  scout_silver_threshold: 6,
  scout_gold_threshold: 10,
  game_ticket_interval: 3,
  comparison_reveal_threshold: 10,
};

export async function getSettings(): Promise<Settings> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return data as Settings;
}

export async function updateSettings(input: Settings): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("feedback_settings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
}

// ── Scout-Level ──────────────────────────────────────────────────────────
// Zwei unabhängige Belohnungs-Schienen: Scout-Level (Status/Newsletter/Jury,
// kumulativ) und Spiel-Tickets (wiederkehrend alle N Bewertungen, siehe unten).

export interface ScoutTier {
  key: "bronze" | "silber" | "gold";
  label: string;
  threshold: number;
  colorVar: string;
  reward: "newsletter" | "jury" | null;
}

export function getScoutTiers(settings: Settings): ScoutTier[] {
  return [
    { key: "bronze", label: "Bronze Scout", threshold: settings.scout_bronze_threshold, colorVar: "var(--color-bronze-dark)", reward: null },
    { key: "silber", label: "Silber Scout", threshold: settings.scout_silver_threshold, colorVar: "var(--color-stone)", reward: "newsletter" },
    { key: "gold", label: "Gold Scout", threshold: settings.scout_gold_threshold, colorVar: "var(--color-bronze-light)", reward: "jury" },
  ];
}

export interface ScoutStatus {
  current: ScoutTier | null;
  next: ScoutTier | null;
  justReached: ScoutTier | null;
  count: number;
  tiers: ScoutTier[];
}

export function getScoutStatus(count: number, settings: Settings): ScoutStatus {
  const tiers = getScoutTiers(settings);
  const current = [...tiers].reverse().find((t) => count >= t.threshold) ?? null;
  const next = tiers.find((t) => count < t.threshold) ?? null;
  const justReached = tiers.find((t) => t.threshold === count) ?? null;
  return { current, next, justReached, count, tiers };
}

export interface ComparisonRow {
  product: Product;
  myHedonic: number;
  storeMean: number;
}

export async function getComparisonData(panelId: string): Promise<ComparisonRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_ratings")
    .select("product_id, hedonic, product:feedback_products(*)")
    .eq("panel_id", panelId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    product_id: string;
    hedonic: number;
    product: Product | Product[] | null;
  }[];

  return Promise.all(
    rows.map(async (r) => {
      const product = Array.isArray(r.product) ? r.product[0] : r.product!;
      const stats = await getProductStats(r.product_id);
      return { product, myHedonic: r.hedonic, storeMean: stats?.hedonicMean ?? r.hedonic };
    })
  );
}

export async function submitContactOptIn(
  panelId: string,
  email: string,
  interests: string[]
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("feedback_panels")
    .update({
      contact_email: email,
      contact_opt_in_at: new Date().toISOString(),
      contact_interests: interests,
    })
    .eq("id", panelId);
  if (error) throw error;
}

export interface ProductWithPanelStatus {
  product: Product;
  rated: boolean;
  hedonic: number | null;
}

export async function getProductsWithPanelStatus(
  panelId: string
): Promise<ProductWithPanelStatus[]> {
  const [products, { data: ratings, error }] = await Promise.all([
    getProducts(),
    getSupabaseClient()
      .from("feedback_ratings")
      .select("product_id, hedonic")
      .eq("panel_id", panelId),
  ]);
  if (error) throw error;
  const byProduct = new Map<string, number>();
  (ratings ?? []).forEach((r) => byProduct.set(r.product_id as string, r.hedonic as number));
  return products.map((product) => ({
    product,
    rated: byProduct.has(product.id),
    hedonic: byProduct.get(product.id) ?? null,
  }));
}

// ── Spiel-Tickets ────────────────────────────────────────────────────────
// Alle 3 Bewertungen (3, 6, 9 …) schaltet ein Panel ein physisches Mini-Game
// im Store frei (Münze ins Aquarium-Glas o.ä.). Der Code wird an der Station
// eingelöst; ein Panel kann pro Meilenstein nur genau ein Ticket bekommen
// (unique panel_id+milestone), verhindert Doppel-Ausstellung bei Reloads.

export interface GameToken {
  id: string;
  panel_id: string;
  milestone: number;
  code: string;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  outcome: "gewonnen" | "verloren" | null;
}

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // ohne 0/O/1/I

function generateGameCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function ensureGameTokenForMilestone(
  panelId: string,
  milestone: number
): Promise<GameToken> {
  const { data: existing } = await getSupabaseClient()
    .from("feedback_game_tokens")
    .select("*")
    .eq("panel_id", panelId)
    .eq("milestone", milestone)
    .maybeSingle();
  if (existing) return existing as GameToken;

  const { data, error } = await getSupabaseClient()
    .from("feedback_game_tokens")
    .insert({ panel_id: panelId, milestone, code: generateGameCode() })
    .select()
    .single();
  if (error) throw error;
  return data as GameToken;
}

export async function getGameTokensForPanel(panelId: string): Promise<GameToken[]> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_game_tokens")
    .select("*")
    .eq("panel_id", panelId)
    .order("milestone", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GameToken[];
}

export async function findGameToken(code: string): Promise<GameToken | null> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_game_tokens")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();
  if (error || !data) return null;
  return data as GameToken;
}

export async function redeemGameToken(
  code: string,
  redeemedBy: string,
  outcome: "gewonnen" | "verloren"
): Promise<GameToken | null> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_game_tokens")
    .update({ redeemed_at: new Date().toISOString(), redeemed_by: redeemedBy, outcome })
    .eq("code", code.toUpperCase().trim())
    .is("redeemed_at", null)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as GameToken | null;
}

export async function getRecentRedemptions(limit = 20): Promise<GameToken[]> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_game_tokens")
    .select("*")
    .not("redeemed_at", "is", null)
    .order("redeemed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as GameToken[];
}
