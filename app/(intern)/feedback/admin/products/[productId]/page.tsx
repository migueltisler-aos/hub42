import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getAssignedQuestionSetIds,
  getProduct,
  getQuestionSets,
  setProductQuestionSets,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";

async function updateQuestionSetsAction(formData: FormData) {
  "use server";
  const productId = formData.get("product_id") as string;
  if (!productId) return;
  const questionSetIds = formData.getAll("question_sets").map((v) => v as string);
  await setProductQuestionSets(productId, questionSetIds);
  redirect("/feedback/admin");
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [product, questionSets, assignedIds] = await Promise.all([
    getProduct(productId),
    getQuestionSets(),
    getAssignedQuestionSetIds(productId),
  ]);

  if (!product) {
    return (
      <div className="min-h-screen bg-green-dark px-4 py-10">
        <p className="text-cream">Produkt nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/feedback/admin" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
          ← Produkte
        </Link>
        <h1
          className="text-cream text-4xl tracking-widest mt-3 mb-1"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {product.name}
        </h1>
        {product.brand && <p className="text-stone text-sm mb-8">{product.brand}</p>}

        <form action={updateQuestionSetsAction} className="bg-green-mid border border-stone-dark p-6">
          <input type="hidden" name="product_id" value={product.id} />
          <p className="text-stone text-xs font-mono uppercase tracking-widest mb-4">
            Zugeordnete Fragensets
          </p>
          {questionSets.length === 0 ? (
            <p className="text-stone-dark text-sm mb-4">
              Noch keine Fragensets angelegt.{" "}
              <Link href="/feedback/admin/questions" className="text-bronze underline">
                Jetzt anlegen →
              </Link>
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 mb-6">
              {questionSets.map((set) => (
                <label
                  key={set.id}
                  className="flex items-start gap-2 bg-green-dark border border-stone-dark px-3 py-2 text-sm text-stone"
                >
                  <input
                    type="checkbox"
                    name="question_sets"
                    value={set.id}
                    defaultChecked={assignedIds.includes(set.id)}
                    className="accent-bronze mt-0.5"
                  />
                  <span>
                    <span className="text-cream">{set.name}</span>
                    <span className="text-stone-dark text-xs block">
                      {set.questions.length} Frage{set.questions.length === 1 ? "" : "n"}
                      {set.description ? ` · ${set.description}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <button
            type="submit"
            className="bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
          >
            Speichern →
          </button>
        </form>
      </div>
    </div>
  );
}
