import { getSupabaseClient } from "./supabase";

export const HEDONIC_FACES = ["😖", "😞", "🙁", "😕", "😐", "🙂", "😊", "😄", "🤩"];

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  store: string | null;
  shelf_code: string | null;
  batch: string | null;
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

export interface AnswerInput {
  questionId: string;
  valueNumeric?: number | null;
  valueText?: string | null;
}

export interface RatingInput {
  panelId: string;
  productId: string;
  hedonic: number;
  answers: AnswerInput[];
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

export async function createProduct(
  input: ProductInput,
  questionSetIds: string[] = []
): Promise<Product> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  const product = data as Product;

  if (questionSetIds.length > 0) {
    const { error: linkError } = await getSupabaseClient()
      .from("feedback_product_question_sets")
      .insert(questionSetIds.map((setId) => ({ product_id: product.id, question_set_id: setId })));
    if (linkError) throw linkError;
  }

  return product;
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
  const rating = data as Rating;

  if (input.answers.length > 0) {
    const { error: answerError } = await getSupabaseClient()
      .from("feedback_answers")
      .insert(
        input.answers.map((a) => ({
          rating_id: rating.id,
          question_id: a.questionId,
          value_numeric: a.valueNumeric ?? null,
          value_text: a.valueText ?? null,
        }))
      );
    if (answerError) throw answerError;
  }

  return rating;
}

// ── Fragen-Modul ─────────────────────────────────────────────────────────
// Wiederverwendbare Fragensets (z.B. "Basis", "Verpackung"), die sich
// beliebigen Produkten zuordnen lassen. Die 9-Punkt-Hedonic-Skala und die
// Van-Westendorp-Preisfragen bleiben eigenständig (Scout-Level/Vergleich
// hängen an der Hedonic-Skala, siehe getScoutStatus/getComparisonData).

export type QuestionType = "semantic_diff" | "likert" | "text";

export interface Question {
  id: string;
  question_set_id: string;
  type: QuestionType;
  position: number;
  prompt: string | null;
  label_left: string | null;
  label_right: string | null;
  scale_max: number | null;
}

export interface QuestionWithSet extends Question {
  set_name: string;
}

export interface QuestionInput {
  questionSetId: string;
  type: QuestionType;
  position?: number;
  prompt?: string | null;
  labelLeft?: string | null;
  labelRight?: string | null;
  scaleMax?: number | null;
}

export interface QuestionSet {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
}

export async function getQuestionSets(): Promise<QuestionSetWithQuestions[]> {
  const [{ data: sets, error: setsError }, { data: questions, error: qError }] = await Promise.all([
    getSupabaseClient().from("feedback_question_sets").select("*").order("created_at", { ascending: true }),
    getSupabaseClient().from("feedback_questions").select("*").order("position", { ascending: true }),
  ]);
  if (setsError) throw setsError;
  if (qError) throw qError;
  return ((sets ?? []) as QuestionSet[]).map((s) => ({
    ...s,
    questions: ((questions ?? []) as Question[]).filter((q) => q.question_set_id === s.id),
  }));
}

export async function createQuestionSet(name: string, description: string | null): Promise<QuestionSet> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_question_sets")
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;
  return data as QuestionSet;
}

export async function createQuestion(input: QuestionInput): Promise<Question> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_questions")
    .insert({
      question_set_id: input.questionSetId,
      type: input.type,
      position: input.position ?? 0,
      prompt: input.prompt ?? null,
      label_left: input.labelLeft ?? null,
      label_right: input.labelRight ?? null,
      scale_max: input.scaleMax ?? (input.type === "likert" ? 5 : 7),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from("feedback_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllProductQuestionSetLinks(): Promise<
  { product_id: string; question_set_id: string }[]
> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_product_question_sets")
    .select("product_id, question_set_id");
  if (error) throw error;
  return (data ?? []) as { product_id: string; question_set_id: string }[];
}

export async function getAssignedQuestionSetIds(productId: string): Promise<string[]> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_product_question_sets")
    .select("question_set_id")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? []).map((r) => r.question_set_id as string);
}

export async function setProductQuestionSets(productId: string, questionSetIds: string[]): Promise<void> {
  const { error: deleteError } = await getSupabaseClient()
    .from("feedback_product_question_sets")
    .delete()
    .eq("product_id", productId);
  if (deleteError) throw deleteError;

  if (questionSetIds.length > 0) {
    const { error: insertError } = await getSupabaseClient()
      .from("feedback_product_question_sets")
      .insert(questionSetIds.map((setId) => ({ product_id: productId, question_set_id: setId })));
    if (insertError) throw insertError;
  }
}

export async function getQuestionsForProduct(productId: string): Promise<QuestionWithSet[]> {
  const { data: links, error: linksError } = await getSupabaseClient()
    .from("feedback_product_question_sets")
    .select("question_set_id")
    .eq("product_id", productId);
  if (linksError) throw linksError;
  const setIds = (links ?? []).map((l) => l.question_set_id as string);
  if (setIds.length === 0) return [];

  const [{ data: sets, error: setsError }, { data: questions, error: qError }] = await Promise.all([
    getSupabaseClient().from("feedback_question_sets").select("id, name, created_at").in("id", setIds),
    getSupabaseClient().from("feedback_questions").select("*").in("question_set_id", setIds),
  ]);
  if (setsError) throw setsError;
  if (qError) throw qError;

  const orderedSets = [...(sets ?? [])].sort((a, b) =>
    (a.created_at as string).localeCompare(b.created_at as string)
  );
  const setOrder = new Map(orderedSets.map((s, i) => [s.id as string, i]));
  const setName = new Map(orderedSets.map((s) => [s.id as string, s.name as string]));

  return ((questions ?? []) as Question[])
    .map((q) => ({ ...q, set_name: setName.get(q.question_set_id) ?? "" }))
    .sort(
      (a, b) =>
        (setOrder.get(a.question_set_id) ?? 0) - (setOrder.get(b.question_set_id) ?? 0) ||
        a.position - b.position
    );
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

export interface QuestionStats {
  question: QuestionWithSet;
  mean: number | null; // semantic_diff/likert
  n: number;
  texts: string[]; // text-Antworten
}

export interface ProductStats {
  product: Product;
  n: number;
  hedonicMean: number;
  hedonicSd: number;
  hedonicDistribution: number[]; // index 0 = count of "1", ... index 8 = count of "9"
  questionStats: QuestionStats[];
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

  const [{ data, error }, questions] = await Promise.all([
    getSupabaseClient().from("feedback_ratings").select("*").eq("product_id", productId),
    getQuestionsForProduct(productId),
  ]);
  if (error) throw error;
  const ratings = (data ?? []) as Rating[];

  const hedonicValues = ratings.map((r) => r.hedonic);
  const hedonicDistribution = Array(9).fill(0);
  hedonicValues.forEach((v) => {
    if (v >= 1 && v <= 9) hedonicDistribution[v - 1]++;
  });

  const answersByQuestion = new Map<string, { numeric: number[]; texts: string[] }>();
  if (questions.length > 0 && ratings.length > 0) {
    const { data: answers, error: ansError } = await getSupabaseClient()
      .from("feedback_answers")
      .select("*")
      .in(
        "rating_id",
        ratings.map((r) => r.id)
      );
    if (ansError) throw ansError;
    for (const a of answers ?? []) {
      const bucket = answersByQuestion.get(a.question_id as string) ?? { numeric: [], texts: [] };
      if (a.value_numeric != null) bucket.numeric.push(Number(a.value_numeric));
      if (a.value_text != null) bucket.texts.push(a.value_text as string);
      answersByQuestion.set(a.question_id as string, bucket);
    }
  }

  const questionStats: QuestionStats[] = questions.map((q) => {
    const bucket = answersByQuestion.get(q.id) ?? { numeric: [], texts: [] };
    return {
      question: q,
      mean: bucket.numeric.length > 0 ? mean(bucket.numeric) : null,
      n: bucket.numeric.length > 0 ? bucket.numeric.length : bucket.texts.length,
      texts: bucket.texts,
    };
  });

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
    questionStats,
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

// ── Pro-Produkt-Kontakt-Opt-in ──────────────────────────────────────────────
// Unabhängig vom Scout-Level-Opt-in (Newsletter/Jury): direkt nach einer
// Bewertung fragen, ob jemand zu GENAU DIESEM Produkt informiert werden will.
// PII (E-Mail/WhatsApp) — nie auf der öffentlichen Results-Seite ausgeben,
// nur Aggregat-Zähler. Die echte Leadliste liegt hinter pipeline_auth.

export interface ProductInterestInput {
  panelId: string;
  productId: string;
  email?: string | null;
  whatsapp?: string | null;
}

export async function submitProductInterest(input: ProductInterestInput): Promise<void> {
  const { error } = await getSupabaseClient().from("feedback_product_interest").upsert(
    {
      panel_id: input.panelId,
      product_id: input.productId,
      email: input.email || null,
      whatsapp: input.whatsapp || null,
    },
    { onConflict: "panel_id,product_id" }
  );
  if (error) throw error;
}

export async function hasProductInterest(panelId: string, productId: string): Promise<boolean> {
  const { data } = await getSupabaseClient()
    .from("feedback_product_interest")
    .select("id")
    .eq("panel_id", panelId)
    .eq("product_id", productId)
    .maybeSingle();
  return Boolean(data);
}

export async function getProductInterestCounts(): Promise<Record<string, number>> {
  const { data, error } = await getSupabaseClient().from("feedback_product_interest").select("product_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.product_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export interface ProductInterestLead {
  id: string;
  product_id: string;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
}

export async function getProductInterestLeads(): Promise<
  (ProductInterestLead & { product_name: string })[]
> {
  const { data, error } = await getSupabaseClient()
    .from("feedback_product_interest")
    .select("*, feedback_products(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const product = Array.isArray(row.feedback_products)
      ? row.feedback_products[0]
      : row.feedback_products;
    return { ...row, product_name: (product as { name: string } | null)?.name ?? "Unbekannt" };
  }) as (ProductInterestLead & { product_name: string })[];
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

// ── Rohdaten-Export ──────────────────────────────────────────────────────
// Für BiFi: zeigt, dass Hub42 die Rohdaten wirklich rausgibt, nicht nur
// hübsche Dashboards. Eine Zeile pro Bewertung, eine Spalte pro Frage
// (Frage-Label als Spaltenüberschrift), Panels bleiben pseudonym.

function questionLabel(q: Question): string {
  if (q.type === "semantic_diff") return `${q.label_left} ↔ ${q.label_right}`;
  return q.prompt ?? q.id;
}

export async function getExportRows(): Promise<{ headers: string[]; rows: string[][] }> {
  const [{ data: ratings, error: ratingsError }, { data: allQuestions, error: qError }] = await Promise.all([
    getSupabaseClient()
      .from("feedback_ratings")
      .select("*, feedback_products(name, brand), feedback_panels(age_range, gender, household_size, shopping_frequency)")
      .order("scanned_at", { ascending: true }),
    getSupabaseClient().from("feedback_questions").select("*"),
  ]);
  if (ratingsError) throw ratingsError;
  if (qError) throw qError;

  const questions = (allQuestions ?? []) as Question[];
  const questionColumns = [...new Set(questions.map(questionLabel))].sort();
  const labelById = new Map(questions.map((q) => [q.id, questionLabel(q)]));

  const ratingIds = (ratings ?? []).map((r) => r.id as string);
  const { data: answers, error: ansError } =
    ratingIds.length > 0
      ? await getSupabaseClient().from("feedback_answers").select("*").in("rating_id", ratingIds)
      : { data: [], error: null };
  if (ansError) throw ansError;

  const answersByRating = new Map<string, Map<string, string>>();
  for (const a of answers ?? []) {
    const label = labelById.get(a.question_id as string);
    if (!label) continue;
    const bucket = answersByRating.get(a.rating_id as string) ?? new Map<string, string>();
    bucket.set(label, a.value_numeric != null ? String(a.value_numeric) : String(a.value_text ?? ""));
    answersByRating.set(a.rating_id as string, bucket);
  }

  const headers = [
    "rating_id",
    "scanned_at",
    "panel_id",
    "age_range",
    "gender",
    "household_size",
    "shopping_frequency",
    "product_name",
    "product_brand",
    "store_context",
    "shelf_context",
    "batch_context",
    "hedonic_1_9",
    "price_too_cheap",
    "price_cheap",
    "price_expensive",
    "price_too_expensive",
    ...questionColumns,
  ];

  const rows = (ratings ?? []).map((r) => {
    const product = Array.isArray(r.feedback_products) ? r.feedback_products[0] : r.feedback_products;
    const panel = Array.isArray(r.feedback_panels) ? r.feedback_panels[0] : r.feedback_panels;
    const answerMap = answersByRating.get(r.id as string) ?? new Map<string, string>();
    return [
      r.id as string,
      r.scanned_at as string,
      r.panel_id as string,
      panel?.age_range ?? "",
      panel?.gender ?? "",
      panel?.household_size ?? "",
      panel?.shopping_frequency ?? "",
      product?.name ?? "",
      product?.brand ?? "",
      r.store_context ?? "",
      r.shelf_context ?? "",
      r.batch_context ?? "",
      String(r.hedonic ?? ""),
      r.price_too_cheap != null ? String(r.price_too_cheap) : "",
      r.price_cheap != null ? String(r.price_cheap) : "",
      r.price_expensive != null ? String(r.price_expensive) : "",
      r.price_too_expensive != null ? String(r.price_too_expensive) : "",
      ...questionColumns.map((col) => answerMap.get(col) ?? ""),
    ];
  });

  return { headers, rows };
}

export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
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
