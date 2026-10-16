import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  alsKontext,
  createRating,
  getPanel,
  getProduct,
  getQuestionsForProduct,
  getRatingForPanelProduct,
  getRatingsTodayCount,
  getSettings,
  questionsFor,
} from "@/lib/feedback";
import RatingForm from "@/components/feedback/RatingForm";
import FieldFrame from "@/components/feedback/FieldFrame";

export const dynamic = "force-dynamic";

const PANEL_COOKIE = "feedback_panel";

async function submitRatingAction(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const panelId = cookieStore.get(PANEL_COOKIE)?.value;
  const productId = formData.get("product_id") as string;
  if (!panelId || !productId) {
    redirect(`/feedback/onboarding?next=${encodeURIComponent(`/feedback/r/${productId}`)}`);
  }

  const settings = await getSettings();
  const kontext = settings.event_mode ? alsKontext(formData.get("kontext")) : null;
  const questions = questionsFor(await getQuestionsForProduct(productId), settings.event_mode, kontext ?? "tasting");
  const priceWtpRaw = formData.get("price_wtp");
  const answers = questions
    .map((q) => {
      const raw = formData.get(`answer_${q.id}`);
      if (raw == null || raw === "") return null;
      return q.type === "text"
        ? { questionId: q.id, valueText: raw as string }
        : { questionId: q.id, valueNumeric: Number(raw) };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const priceTooCheap = formData.get("price_too_cheap");
  const priceCheap = formData.get("price_cheap");
  const priceExpensive = formData.get("price_expensive");
  const priceTooExpensive = formData.get("price_too_expensive");
  const hedonic = Number(formData.get("hedonic"));

  try {
    await createRating({
      panelId,
      productId,
      hedonic,
      answers,
      priceTooCheap: priceTooCheap ? Number(priceTooCheap) : null,
      priceCheap: priceCheap ? Number(priceCheap) : null,
      priceExpensive: priceExpensive ? Number(priceExpensive) : null,
      priceTooExpensive: priceTooExpensive ? Number(priceTooExpensive) : null,
      storeContext: (formData.get("product_store") as string) || null,
      shelfContext: (formData.get("product_shelf") as string) || null,
      batchContext: (formData.get("product_batch") as string) || null,
      kontext,
      priceWtp: priceWtpRaw ? Number(priceWtpRaw) : null,
    });
  } catch (err) {
    // 23505 = unique_violation — Panel hat dieses Produkt (z.B. durch Doppel-Klick) bereits bewertet
    if ((err as { code?: string })?.code !== "23505") throw err;
  }

  redirect(`/feedback/thanks?product=${productId}&hedonic=${hedonic}`);
}

export default async function RatingPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { productId } = await params;
  const { k } = await searchParams;
  // aus dem QR-Code: /t = tasting, /q = angeschaut; ohne Kontext wählt der Scout selbst
  const initialKontext = alsKontext(k);
  const selbst = `/feedback/r/${productId}${initialKontext ? `?k=${initialKontext}` : ""}`;
  const cookieStore = await cookies();
  const panelId = cookieStore.get(PANEL_COOKIE)?.value;

  const panel = panelId ? await getPanel(panelId) : null;
  if (!panel || !panel.consent_at) {
    redirect(`/feedback/onboarding?next=${encodeURIComponent(selbst)}`);
  }

  const existingRating = panelId ? await getRatingForPanelProduct(panelId, productId) : null;
  if (existingRating) {
    redirect(`/feedback/thanks?product=${productId}&hedonic=${existingRating.hedonic}`);
  }

  const [product, ratingsToday, questions, settings] = await Promise.all([
    getProduct(productId),
    getRatingsTodayCount(),
    getQuestionsForProduct(productId),
    getSettings(),
  ]);

  if (!product) {
    return (
      <FieldFrame>
        <div className="flex items-center justify-center min-h-[70vh]">
          <p className="text-cream">Dieses Produkt wurde nicht gefunden.</p>
        </div>
      </FieldFrame>
    );
  }

  return (
    <FieldFrame>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="stamp text-bronze">Deine Stimme für Hub42</span>
          {ratingsToday > 0 && (
            <span className="text-bronze/80 text-[10px] font-mono uppercase tracking-widest text-right">
              🔥 {ratingsToday} heute
            </span>
          )}
        </div>
        <h1
          className="text-cream text-4xl tracking-widest mb-1"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {product.name}
        </h1>
        {product.brand && <p className="text-stone text-sm mb-3">{product.brand}</p>}
        {(product.store || product.shelf_code) && (
          <p className="inline-block field-card bg-green-mid/40 text-stone-dark text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 mb-8">
            📍 {[product.store, product.shelf_code].filter(Boolean).join(" · ")}
          </p>
        )}

        <RatingForm
          productId={product.id}
          questions={questions}
          priceEnabled={product.price_enabled}
          productStore={product.store ?? ""}
          productShelf={product.shelf_code ?? ""}
          productBatch={product.batch ?? ""}
          eventMode={settings.event_mode}
          price={product.price ?? null}
          initialKontext={initialKontext}
          action={submitRatingAction}
        />

        {settings.event_mode ? (
          <p className="text-stone-dark text-xs text-center mt-6">
            Ab {settings.raffle_threshold} bewerteten Produkten bist du im{" "}
            <span className="text-bronze">Lostopf</span>.
          </p>
        ) : (
          <p className="text-stone-dark text-xs text-center mt-6">
            Top-Produkte schaffen es in die Auswahl für{" "}
            <span className="text-bronze">Marke des Monats</span>.
          </p>
        )}
      </div>
    </FieldFrame>
  );
}
