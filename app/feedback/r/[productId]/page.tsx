import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createRating,
  getPanel,
  getProduct,
  getRatingForPanelProduct,
  getRatingsTodayCount,
} from "@/lib/feedback";
import RatingForm from "@/components/feedback/RatingForm";

const PANEL_COOKIE = "feedback_panel";

async function submitRatingAction(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const panelId = cookieStore.get(PANEL_COOKIE)?.value;
  const productId = formData.get("product_id") as string;
  if (!panelId || !productId) {
    redirect(`/feedback/onboarding?next=${encodeURIComponent(`/feedback/r/${productId}`)}`);
  }

  const attributeCount = Number(formData.get("attribute_count") ?? 0);
  const semDiff = Array.from({ length: attributeCount }, (_, i) =>
    Number(formData.get(`sem_${i}`) ?? 0)
  );

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
      semDiff,
      priceTooCheap: priceTooCheap ? Number(priceTooCheap) : null,
      priceCheap: priceCheap ? Number(priceCheap) : null,
      priceExpensive: priceExpensive ? Number(priceExpensive) : null,
      priceTooExpensive: priceTooExpensive ? Number(priceTooExpensive) : null,
      storeContext: (formData.get("product_store") as string) || null,
      shelfContext: (formData.get("product_shelf") as string) || null,
      batchContext: (formData.get("product_batch") as string) || null,
    });
  } catch (err) {
    // 23505 = unique_violation — Panel hat dieses Produkt (z.B. durch Doppel-Klick) bereits bewertet
    if ((err as { code?: string })?.code !== "23505") throw err;
  }

  redirect(`/feedback/thanks?product=${productId}&hedonic=${hedonic}`);
}

export default async function RatingPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const cookieStore = await cookies();
  const panelId = cookieStore.get(PANEL_COOKIE)?.value;

  const panel = panelId ? await getPanel(panelId) : null;
  if (!panel || !panel.consent_at) {
    redirect(`/feedback/onboarding?next=${encodeURIComponent(`/feedback/r/${productId}`)}`);
  }

  const existingRating = panelId ? await getRatingForPanelProduct(panelId, productId) : null;
  if (existingRating) {
    redirect(`/feedback/thanks?product=${productId}&hedonic=${existingRating.hedonic}`);
  }

  const [product, ratingsToday] = await Promise.all([
    getProduct(productId),
    getRatingsTodayCount(),
  ]);

  if (!product) {
    return (
      <div className="min-h-screen bg-green-dark flex items-center justify-center px-4">
        <p className="text-cream">Dieses Produkt wurde nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-dark px-4 py-10">
      <div className="max-w-md mx-auto">
        {ratingsToday > 0 && (
          <p className="text-bronze/80 text-xs font-mono uppercase tracking-widest mb-4">
            🔥 {ratingsToday} Scout-Stimmen heute schon dabei
          </p>
        )}
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Deine Stimme für Hub42
        </p>
        <h1
          className="text-cream text-3xl tracking-widest mb-1"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {product.name}
        </h1>
        {product.brand && <p className="text-stone text-sm mb-2">{product.brand}</p>}
        {(product.store || product.shelf_code) && (
          <p className="text-stone-dark text-xs font-mono mb-8">
            📍 {[product.store, product.shelf_code].filter(Boolean).join(" · ")}
          </p>
        )}

        <RatingForm
          productId={product.id}
          attributes={product.attributes}
          priceEnabled={product.price_enabled}
          productStore={product.store ?? ""}
          productShelf={product.shelf_code ?? ""}
          productBatch={product.batch ?? ""}
          action={submitRatingAction}
        />

        <p className="text-stone-dark text-xs text-center mt-6">
          Top-Produkte schaffen es in die Auswahl für{" "}
          <span className="text-bronze">Brand des Monats</span>.
        </p>
      </div>
    </div>
  );
}
