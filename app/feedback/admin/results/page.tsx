import Link from "next/link";
import { getPanelOverview, getProducts, getProductStats } from "@/lib/feedback";

function HedonicBars({ distribution }: { distribution: number[] }) {
  const max = Math.max(1, ...distribution);
  return (
    <div className="flex items-end gap-1 h-20">
      {distribution.map((count, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <div
            className="w-full bg-bronze"
            style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? "2px" : 0 }}
          />
          <span className="text-stone-dark text-[10px] font-mono mt-1">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

function SemDiffTrack({
  left,
  right,
  mean,
}: {
  left: string;
  right: string;
  mean: number;
}) {
  const pct = Math.min(100, Math.max(0, ((mean - 1) / 6) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-stone-dark text-xs mb-1">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="relative h-2 bg-sage rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-bronze"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <p className="text-stone-dark text-[10px] font-mono mt-1">⌀ {mean.toFixed(2)} / 7</p>
    </div>
  );
}

export default async function ResultsPage() {
  const [products, panelOverview] = await Promise.all([getProducts(), getPanelOverview()]);
  const stats = await Promise.all(products.map((p) => getProductStats(p.id)));

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link
            href="/feedback/admin"
            className="text-stone text-xs font-mono hover:text-bronze transition-colors"
          >
            ← Produkte
          </Link>
          <h1
            className="text-cream text-4xl tracking-widest mt-3"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Auswertung
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-sage-warm p-4">
            <p className="text-stone-dark text-xs font-mono uppercase tracking-widest">
              Panels (unique Nutzer)
            </p>
            <p className="text-green-dark text-3xl" style={{ fontFamily: "var(--font-bebas)" }}>
              {panelOverview.uniquePanels}
            </p>
          </div>
          <div className="bg-sage-warm p-4">
            <p className="text-stone-dark text-xs font-mono uppercase tracking-widest">
              Ø Produkte pro Panel
            </p>
            <p className="text-green-dark text-3xl" style={{ fontFamily: "var(--font-bebas)" }}>
              {panelOverview.avgProductsPerPanel.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {stats.filter(Boolean).map((s) => {
            if (!s) return null;
            return (
              <div key={s.product.id} id={s.product.id} className="bg-sage-warm p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h2 className="text-green-dark text-2xl" style={{ fontFamily: "var(--font-bebas)" }}>
                      {s.product.name}
                    </h2>
                    {s.product.brand && <p className="text-stone-dark text-sm">{s.product.brand}</p>}
                  </div>
                  <p className="text-stone-dark text-xs font-mono">n = {s.n}</p>
                </div>

                {s.n === 0 ? (
                  <p className="text-stone-dark text-sm">Noch keine Bewertungen.</p>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-stone-dark text-xs font-mono uppercase tracking-widest mb-2">
                        Gesamteindruck (9-Punkt-hedonisch) — ⌀ {s.hedonicMean.toFixed(2)}, SD{" "}
                        {s.hedonicSd.toFixed(2)}
                      </p>
                      <HedonicBars distribution={s.hedonicDistribution} />
                    </div>

                    {s.product.attributes.map((pair, i) => (
                      <SemDiffTrack
                        key={i}
                        left={pair.left}
                        right={pair.right}
                        mean={s.semDiffMeans[i] ?? 0}
                      />
                    ))}

                    {s.priceStats && (
                      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: "zu billig", value: s.priceStats.tooCheap },
                          { label: "günstig", value: s.priceStats.cheap },
                          { label: "teuer", value: s.priceStats.expensive },
                          { label: "zu teuer", value: s.priceStats.tooExpensive },
                        ].map((f) => (
                          <div key={f.label} className="bg-sage p-2">
                            <p className="text-stone-dark text-[10px] font-mono uppercase">{f.label}</p>
                            <p className="text-green-dark text-sm font-semibold">
                              {f.value.toFixed(2)} €
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {products.length === 0 && (
            <p className="text-stone text-sm">Noch keine Produkte angelegt.</p>
          )}
        </div>
      </div>
    </div>
  );
}
