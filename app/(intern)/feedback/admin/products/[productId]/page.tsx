import Link from "next/link";
import {
  getAssignedQuestionSetIds,
  getProduct,
  getQuestionSets,
} from "@/lib/feedback";
import { EmptyState, PageShell, Panel, Stamp } from "@/app/(intern)/_components/ui/surfaces";
import ProductForm, { type SetOption } from "../../_components/ProductForm";

export const dynamic = "force-dynamic";

/**
 * Einzelnes Produkt bearbeiten. In der Liste geht das inline; diese Seite
 * bleibt als Deep-Link-Ziel bestehen und kann alles, was die Karte kann.
 */
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
      <PageShell title="Produkt nicht gefunden" back={{ href: "/feedback/admin", label: "Produkte" }}>
        <EmptyState
          titel="Dieses Produkt gibt es nicht (mehr)."
          text="Vielleicht wurde es gelöscht. Die Liste zeigt alle aktiven und archivierten Produkte."
        />
      </PageShell>
    );
  }

  const setOptions: SetOption[] = questionSets.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    fragen: s.questions.length,
  }));

  return (
    <PageShell
      eyebrow={product.brand ?? "Produkt"}
      title={product.name}
      back={{ href: "/feedback/admin", label: "Produkte" }}
      actions={
        product.archived_at ? (
          <Stamp tone="stone" tilt>
            archiviert
          </Stamp>
        ) : (
          <Link
            href={`/feedback/admin/results#${product.id}`}
            className="text-bronze text-sm hover:text-bronze-light transition-colors"
          >
            Auswertung →
          </Link>
        )
      }
    >
      <Panel title="Stammdaten & Fragensets" nummer="01">
        <ProductForm
          produkt={{
            id: product.id,
            name: product.name,
            brand: product.brand,
            store: product.store,
            shelf_code: product.shelf_code,
            batch: product.batch,
            price_enabled: product.price_enabled,
            setIds: assignedIds,
          }}
          questionSets={setOptions}
        />
      </Panel>
    </PageShell>
  );
}
