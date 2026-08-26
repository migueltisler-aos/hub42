import Link from "next/link";
import { Download } from "lucide-react";
import {
  HEDONIC_FACES,
  getPanelOverview,
  getProductInterestCounts,
  getProducts,
  getProductStats,
  type QuestionStats,
} from "@/lib/feedback";
import {
  Card,
  EmptyState,
  PageShell,
  SectionHead,
  Stamp,
  StatTile,
} from "@/app/(intern)/_components/ui/surfaces";

export const dynamic = "force-dynamic";

/** Unter dieser Fallzahl ist ein Mittelwert eine Anekdote, keine Aussage. */
const N_SCHWELLE = 5;

function HedonicBars({ distribution, n }: { distribution: number[]; n: number }) {
  const max = Math.max(1, ...distribution);
  return (
    <div>
      <div className="flex items-end gap-1 h-24">
        {distribution.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            {count > 0 && (
              <span className="text-stone-dark text-[10px] font-mono tabular-nums mb-0.5">
                {count}
              </span>
            )}
            <div
              className="w-full bg-bronze rounded-t-sm"
              style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? "3px" : 0 }}
            />
          </div>
        ))}
      </div>
      {/* Dieselben Gesichter, die der Scout beim Bewerten getippt hat — die
          nackten Ziffern 1–9 waren nicht auf die Erhebung zurückzuführen. */}
      <div className="flex gap-1 mt-1.5" aria-hidden>
        {HEDONIC_FACES.map((face, i) => (
          <span key={i} className="flex-1 text-center text-sm opacity-70">
            {face}
          </span>
        ))}
      </div>
      <div className="flex justify-between text-stone-dark text-[10px] mt-0.5">
        <span>gefällt gar nicht</span>
        <span className="font-mono tabular-nums">{n} Stimmen</span>
        <span>gefällt extrem gut</span>
      </div>
    </div>
  );
}

function ScaleTrack({
  label,
  left,
  right,
  mean,
  scaleMax,
  n,
}: {
  label?: string | null;
  left: string | null;
  right: string | null;
  mean: number;
  scaleMax: number;
  n: number;
}) {
  const pct = Math.min(100, Math.max(0, ((mean - 1) / (scaleMax - 1)) * 100));
  return (
    <div className="py-2.5 border-b border-stone-dark/15 last:border-0">
      {label && <p className="text-green-dark text-sm mb-1.5 leading-snug">{label}</p>}
      <div className="flex items-center gap-3">
        <span className="text-stone-dark text-xs w-24 sm:w-32 text-right shrink-0 leading-tight">
          {left}
        </span>
        <div className="relative h-1.5 bg-sage rounded-full flex-1">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-bronze ring-2 ring-sage-warm"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
        <span className="text-stone-dark text-xs w-24 sm:w-32 shrink-0 leading-tight">{right}</span>
      </div>
      <p className="text-stone-dark text-[10px] font-mono mt-1 tabular-nums">
        ⌀ {mean.toFixed(2)} / {scaleMax} · n = {n}
      </p>
    </div>
  );
}

function QuestionResult({ qs }: { qs: QuestionStats }) {
  const { question: q } = qs;

  if (q.type === "text") {
    return (
      <div className="py-2.5 border-b border-stone-dark/15 last:border-0">
        <p className="text-green-dark text-sm leading-snug">
          {q.prompt}{" "}
          <span className="text-stone-dark text-xs font-mono">
            {qs.texts.length} Antwort{qs.texts.length === 1 ? "" : "en"}
          </span>
        </p>
        {qs.texts.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {qs.texts.map((t, i) => (
              <li
                key={i}
                className="text-green-dark text-sm bg-sage rounded-sm px-3 py-1.5 leading-snug"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (qs.mean == null) {
    return (
      <p className="text-stone-dark text-xs py-2.5 border-b border-stone-dark/15 last:border-0">
        {q.type === "semantic_diff" ? `${q.label_left} ↔ ${q.label_right}` : q.prompt} — noch keine
        Antworten
      </p>
    );
  }

  return (
    <ScaleTrack
      label={q.prompt}
      left={q.label_left}
      right={q.label_right}
      mean={qs.mean}
      scaleMax={q.scale_max ?? (q.type === "likert" ? 5 : 7)}
      n={qs.n}
    />
  );
}

export default async function ResultsPage() {
  const [products, panelOverview, interestCounts] = await Promise.all([
    // Auch archivierte: die erhobenen Daten bleiben relevant, auch wenn das
    // Produkt nicht mehr im Regal steht.
    getProducts({ includeArchived: true }),
    getPanelOverview(),
    getProductInterestCounts(),
  ]);
  const stats = (await Promise.all(products.map((p) => getProductStats(p.id)))).filter(
    (s): s is NonNullable<typeof s> => s != null
  );

  const bewertungen = stats.reduce((summe, s) => summe + s.n, 0);
  const mitDaten = stats.filter((s) => s.n > 0).length;

  return (
    <PageShell
      breit
      eyebrow="Register 03"
      title="Auswertung"
      lead="Was die Scouts im Store hinterlassen haben. Rohdaten gibt es als CSV — inklusive Demografie und aller Einzelantworten."
      actions={
        <a
          href="/feedback/admin/export"
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2.5 min-h-11 rounded-sm border border-bronze/40 text-bronze hover:border-bronze hover:bg-bronze/10 transition-colors"
        >
          <Download size={15} /> Rohdaten (CSV)
        </a>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile label="Bewertungen" value={bewertungen} />
        <StatTile label="Panels (unique)" value={panelOverview.uniquePanels} />
        <StatTile
          label="⌀ Produkte / Panel"
          value={panelOverview.avgProductsPerPanel.toFixed(1)}
        />
        <StatTile
          label="Produkte mit Daten"
          value={`${mitDaten} / ${stats.length}`}
          note={mitDaten < stats.length ? `${stats.length - mitDaten} noch ohne Bewertung` : undefined}
        />
      </div>

      <SectionHead>Produkte</SectionHead>

      <div className="space-y-4">
        {stats.map((s) => {
          const duenn = s.n > 0 && s.n < N_SCHWELLE;
          return (
            <Card key={s.product.id} id={s.product.id} className="p-5 scroll-mt-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3
                    className="text-green-dark text-2xl leading-none"
                    style={{ fontFamily: "var(--font-bebas)" }}
                  >
                    {s.product.name}
                  </h3>
                  <p className="text-stone-dark text-sm mt-1">
                    {[s.product.brand, s.product.store, s.product.shelf_code, s.product.batch]
                      .filter(Boolean)
                      .join(" · ") || "kein Kontext"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-green-dark text-lg font-mono tabular-nums leading-none">
                    n = {s.n}
                  </span>
                  {(interestCounts[s.product.id] ?? 0) > 0 && (
                    <span className="text-bronze-dark text-xs font-mono tabular-nums">
                      {interestCounts[s.product.id]} Leads
                    </span>
                  )}
                  {s.product.archived_at && (
                    <Stamp tone="stone" className="!text-stone-dark">
                      archiviert
                    </Stamp>
                  )}
                </div>
              </div>

              {s.n === 0 ? (
                <p className="text-stone-dark text-sm">
                  Noch keine Bewertung.{" "}
                  <Link
                    href="/feedback/admin/print"
                    className="text-bronze-dark underline hover:no-underline"
                  >
                    QR-Etikett ans Regal?
                  </Link>
                </p>
              ) : (
                <>
                  {duenn && (
                    <p className="text-amber-800 text-xs bg-amber-500/10 border border-amber-700/25 rounded-sm px-3 py-2 mb-4 leading-relaxed">
                      Nur {s.n} Stimme{s.n === 1 ? "" : "n"} — die Zahlen unten sind eine
                      Momentaufnahme, keine belastbare Aussage. Ab {N_SCHWELLE} Stimmen wird der
                      Hinweis ausgeblendet.
                    </p>
                  )}

                  <div className="mb-5">
                    <p className="text-stone-dark text-[10px] font-mono uppercase tracking-[0.16em] mb-2">
                      Gesamteindruck · ⌀ {s.hedonicMean.toFixed(2)} von 9 · SD{" "}
                      {s.hedonicSd.toFixed(2)}
                    </p>
                    <HedonicBars distribution={s.hedonicDistribution} n={s.n} />
                  </div>

                  {s.questionStats.length > 0 && (
                    <div className="mb-4">
                      <p className="text-stone-dark text-[10px] font-mono uppercase tracking-[0.16em] mb-1">
                        Fragensets
                      </p>
                      {s.questionStats.map((qs) => (
                        <QuestionResult key={qs.question.id} qs={qs} />
                      ))}
                    </div>
                  )}

                  {s.priceStats && (
                    <div>
                      <p className="text-stone-dark text-[10px] font-mono uppercase tracking-[0.16em] mb-2">
                        Preiswahrnehmung · Mittelwerte aus {s.priceStats.n} Angabe
                        {s.priceStats.n === 1 ? "" : "n"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "zu billig", value: s.priceStats.tooCheap },
                          { label: "günstig", value: s.priceStats.cheap },
                          { label: "teuer", value: s.priceStats.expensive },
                          { label: "zu teuer", value: s.priceStats.tooExpensive },
                        ].map((f) => (
                          <div key={f.label} className="bg-sage rounded-sm px-3 py-2">
                            <p className="text-stone-dark text-[10px] font-mono uppercase tracking-wider">
                              {f.label}
                            </p>
                            <p className="text-green-dark text-base font-semibold tabular-nums">
                              {f.value.toFixed(2)} €
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}

        {stats.length === 0 && (
          <EmptyState
            titel="Noch kein Produkt angelegt."
            text="Ohne Produkt gibt es nichts zu bewerten."
          />
        )}
      </div>
    </PageShell>
  );
}
