import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  HEDONIC_FACES,
  ensureGameTokenForMilestone,
  getComparisonData,
  getGameTokensForPanel,
  getPanelProgress,
  getProduct,
  getProductsWithPanelStatus,
  getScoutStatus,
  getSettings,
  submitContactOptIn,
} from "@/lib/feedback";
import Celebration from "@/components/feedback/Celebration";

export const dynamic = "force-dynamic";

const PANEL_COOKIE = "feedback_panel";

async function submitContactOptInAction(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const panelId = cookieStore.get(PANEL_COOKIE)?.value;
  const email = (formData.get("email") as string)?.trim();
  const back = (formData.get("back") as string) || "/feedback/scan";
  if (!panelId || !email) redirect(back);

  const interests = formData.getAll("interests").map((v) => v as string);
  await submitContactOptIn(panelId, email, interests);
  redirect(back);
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; hedonic?: string }>;
}) {
  const { product: productId, hedonic: hedonicParam } = await searchParams;
  const cookieStore = await cookies();
  const panelId = cookieStore.get(PANEL_COOKIE)?.value;
  const backHref = `/feedback/thanks?product=${productId ?? ""}&hedonic=${hedonicParam ?? ""}`;

  const [product, progress, productsWithStatus, settings] = await Promise.all([
    productId ? getProduct(productId) : null,
    panelId ? getPanelProgress(panelId) : { count: 0, productNames: [] },
    panelId ? getProductsWithPanelStatus(panelId) : [],
    getSettings(),
  ]);

  const scout = getScoutStatus(progress.count, settings);

  let newToken = null;
  if (panelId && progress.count > 0 && progress.count % settings.game_ticket_interval === 0) {
    newToken = await ensureGameTokenForMilestone(panelId, progress.count);
  }
  const allTokens = panelId ? await getGameTokensForPanel(panelId) : [];
  const pendingTokens = allTokens.filter((t) => !t.redeemed_at);

  const showComparison = progress.count === settings.comparison_reveal_threshold;
  const comparison = panelId && showComparison ? await getComparisonData(panelId) : [];

  const celebrate = Boolean(scout.justReached) || Boolean(newToken) || showComparison;

  return (
    <div className="min-h-screen bg-green-dark px-4 py-10">
      <div className="relative max-w-md mx-auto text-center">
        {celebrate && <Celebration />}

        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Stimme gezählt
        </p>
        <h1
          className="text-cream text-3xl tracking-widest mb-6"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {product ? `Danke für ${product.name}!` : "Danke für deine Stimme!"}
        </h1>

        {/* Meilenstein-Vergleich — bewusst erst gebündelt nach comparison_reveal_threshold
            Bewertungen, nicht sofort pro Produkt: ein Sofort-Vergleich würde spätere
            Bewertungen unbewusst Richtung Store-Durchschnitt ziehen (Anchoring). */}
        {showComparison && comparison.length > 0 && (
          <div className="bg-sage-warm p-4 mb-6 text-left">
            <p className="text-green-dark text-sm font-semibold mb-3 text-center">
              🔍 Dein großer Vergleich ist da! Du vs. alle anderen Scouts:
            </p>
            <div className="space-y-2">
              {comparison.map((row) => {
                const diff = row.myHedonic - row.storeMean;
                return (
                  <div key={row.product.id} className="flex items-center justify-between text-sm">
                    <span className="text-green-dark truncate mr-2">{row.product.name}</span>
                    <span className="text-stone-dark font-mono text-xs whitespace-nowrap">
                      {HEDONIC_FACES[row.myHedonic - 1]} {row.myHedonic} · Ø {row.storeMean.toFixed(1)}{" "}
                      <span className={diff > 0.5 ? "text-bronze-dark" : diff < -0.5 ? "text-stone-dark" : ""}>
                        ({diff > 0 ? "+" : ""}
                        {diff.toFixed(1)})
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scout-Level */}
        <div className="bg-green-mid border border-stone-dark p-4 mb-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <p className="text-stone text-xs font-mono uppercase tracking-widest">
              {scout.current ? scout.current.label : "Scout in Ausbildung"}
            </p>
            <p className="text-bronze text-xs font-mono">{scout.count} Bewertungen</p>
          </div>
          {scout.next && (
            <div className="h-1.5 bg-green-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-bronze"
                style={{
                  width: `${Math.min(100, (scout.count / scout.next.threshold) * 100)}%`,
                }}
              />
            </div>
          )}
          {scout.next ? (
            <p className="text-stone-dark text-[10px] font-mono mt-1">
              noch {scout.next.threshold - scout.count} bis {scout.next.label}
            </p>
          ) : (
            <p className="text-stone-dark text-[10px] font-mono mt-1">Höchstes Level erreicht</p>
          )}

          {scout.justReached && (
            <p className="text-bronze text-sm mt-3">
              🏅 Herzlichen Glückwunsch — du bist jetzt <strong>{scout.justReached.label}</strong>!
            </p>
          )}
        </div>

        {/* Contact opt-in bei Silber/Gold */}
        {scout.justReached?.reward && (
          <form
            action={submitContactOptInAction}
            className="bg-sage-warm p-4 mb-6 text-left space-y-3"
          >
            <input type="hidden" name="back" value={backHref} />
            <p className="text-green-dark text-sm font-semibold">
              {scout.justReached.reward === "newsletter"
                ? "🎉 Ab jetzt: Newsletter über neue Marken (optional)"
                : "🎉 Ab jetzt: Chance auf Jury-Sparringspartner beim nächsten Pitch-Event (optional)"}
            </p>
            <p className="text-stone-dark text-xs">
              Freiwillig — deine Bewertungen bleiben trotzdem pseudonym. Nur wenn du willst,
              hinterlässt du eine E-Mail für Newsletter und/oder Jury-Einladung.
            </p>
            <input
              type="email"
              name="email"
              placeholder="deine@email.de"
              className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            />
            <div className="flex gap-4 text-xs text-stone-dark">
              <label className="flex items-center gap-1">
                <input type="checkbox" name="interests" value="newsletter" className="accent-bronze" />
                Newsletter
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" name="interests" value="jury" className="accent-bronze" />
                Jury-Einladung
              </label>
            </div>
            <button
              type="submit"
              className="bg-bronze text-green-dark font-semibold px-4 py-2 text-xs hover:bg-bronze-light transition-colors"
            >
              Eintragen →
            </button>
          </form>
        )}

        {/* Spiel-Ticket */}
        {newToken && (
          <div className="bg-bronze/10 border border-bronze p-4 mb-6 text-left">
            <p className="text-bronze text-sm font-semibold mb-1">🎟 Spiel freigeschaltet!</p>
            <p className="text-stone text-xs mb-3">
              Zeig diesen Code an der Station — Münze ins Glas im Aquarium, bei Treffer
              gewinnst du einen 50 €-Gutschein.
            </p>
            <p className="text-cream text-2xl font-mono tracking-[0.3em] text-center bg-green-dark py-3">
              {newToken.code}
            </p>
            <p className="text-stone-dark text-[10px] mt-2">
              Kostenlose Teilnahme, kein Kaufzwang. Ein Ticket pro Code, nicht übertragbar.
            </p>
          </div>
        )}
        {!newToken &&
          pendingTokens.map((t) => (
            <div key={t.id} className="bg-green-mid border border-stone-dark p-3 mb-4 text-left">
              <p className="text-stone text-xs mb-1">🎟 Noch offen: dein Spiel von Runde {t.milestone}</p>
              <p className="text-cream text-lg font-mono tracking-[0.3em] text-center bg-green-dark py-2">
                {t.code}
              </p>
            </div>
          ))}

        {/* Scout-Pass Grid */}
        {productsWithStatus.length > 0 && (
          <div className="mb-8 text-left">
            <p className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
              Dein Scout-Pass
            </p>
            <div className="grid grid-cols-3 gap-2">
              {productsWithStatus.map(({ product: p, rated, hedonic }) => (
                <Link
                  key={p.id}
                  href={rated ? backHref : `/feedback/r/${p.id}`}
                  className={`aspect-square flex flex-col items-center justify-center p-2 text-center rounded-sm border ${
                    rated
                      ? "bg-sage-warm border-bronze/40"
                      : "bg-green-mid border-dashed border-stone-dark hover:border-bronze/50"
                  }`}
                >
                  {rated ? (
                    <span className="text-2xl mb-1">{HEDONIC_FACES[(hedonic ?? 1) - 1]}</span>
                  ) : (
                    <span className="text-bronze/50 text-2xl mb-1">?</span>
                  )}
                  <span className={`text-[9px] leading-tight ${rated ? "text-green-dark" : "text-stone"}`}>
                    {p.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/feedback/scan"
          className="inline-block bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
        >
          Weiteres Produkt scannen →
        </Link>

        <p className="text-stone-dark text-[10px] font-mono mt-8">
          {scout.tiers.map((t) => t.label).join(" · ")}
        </p>
      </div>
    </div>
  );
}
