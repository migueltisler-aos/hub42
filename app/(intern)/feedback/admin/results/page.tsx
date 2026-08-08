import Link from "next/link";
import {
  getPanelOverview,
  getProductInterestCounts,
  getProducts,
  getProductStats,
  type QuestionStats,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";

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

function ScaleTrack({
  label,
  left,
  right,
  mean,
  scaleMax,
}: {
  label?: string | null;
  left: string | null;
  right: string | null;
  mean: number;
  scaleMax: number;
}) {
  const pct = Math.min(100, Math.max(0, ((mean - 1) / (scaleMax - 1)) * 100));
  return (
    <div className="mb-3">
      {label && <p className="text-stone-dark text-xs mb-1">{label}</p>}
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
      <p className="text-stone-dark text-[10px] font-mono mt-1">
        ⌀ {mean.toFixed(2)} / {scaleMax}
      </p>
    </div>
  );
}

function QuestionResult({ qs }: { qs: QuestionStats }) {
  const { question: q } = qs;
  if (q.type === "text") {
    return (
      <div className="mb-3">
        <p className="text-stone-dark text-xs mb-1">
          {q.prompt} <span className="text-stone-dark/70">({qs.texts.length} Antworten)</span>
        </p>
        {qs.texts.length > 0 && (
          <ul className="text-green-dark text-sm bg-sage px-3 py-2 space-y-1">
            {qs.texts.slice(0, 5).map((t, i) => (
              <li key={i}>&quot;{t}&quot;</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (qs.mean == null) {
    return (
      <p className="text-stone-dark text-xs mb-3">
        {q.type === "semantic_diff" ? `${q.label_left} ↔ ${q.label_right}` : q.prompt} — noch keine
        Antworten
      </p>
    );
  }
  return (
    <ScaleTrack
      label={q.type === "likert" ? q.prompt : null}
      left={q.label_left}
      right={q.label_right}
      mean={qs.mean}
      scaleMax={q.scale_max ?? (q.type === "likert" ? 5 : 7)}
    />
  );
}

export default async function ResultsPage() {
  const [products, panelOverview, interestCounts] = await Promise.all([
    getProducts(),
    getPanelOverview(),
    getProductInterestCounts(),
  ]);
  const stats = await Promise.all(products.map((p) => getProductStats(p.id)));

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
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
          <a
            href="/feedback/admin/export"
            className="stamp text-bronze hover:text-bronze-light transition-colors whitespace-nowrap"
          >
            ⤓ Rohdaten (CSV)
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="field-card bg-sage-warm p-4">
            <p className="text-stone-dark text-xs font-mono uppercase tracking-widest">
              Panels (unique Nutzer)
            </p>
            <p className="text-green-dark text-3xl" style={{ fontFamily: "var(--font-bebas)" }}>
              {panelOverview.uniquePanels}
            </p>
          </div>
          <div className="field-card bg-sage-warm p-4">
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
              <div key={s.product.id} id={s.product.id} className="field-card bg-sage-warm p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h2 className="text-green-dark text-2xl" style={{ fontFamily: "var(--font-bebas)" }}>
                      {s.product.name}
                    </h2>
                    {s.product.brand && <p className="text-stone-dark text-sm">{s.product.brand}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-stone-dark text-xs font-mono">n = {s.n}</p>
                    {(interestCounts[s.product.id] ?? 0) > 0 && (
                      <p className="text-bronze-dark text-xs font-mono">
                        📬 {interestCounts[s.product.id]} Leads
                      </p>
                    )}
                  </div>
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

                    {s.questionStats.map((qs) => (
                      <QuestionResult key={qs.question.id} qs={qs} />
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
