import type { Metadata } from "next";
import "./deck-print.css";
import DeckHero from "@/components/deck/DeckHero";
import DeckProblem from "@/components/deck/DeckProblem";
import DeckModell from "@/components/deck/DeckModell";
import DeckRechner from "@/components/deck/DeckRechner";
import DeckStandort from "@/components/deck/DeckStandort";
import DeckErlebnis from "@/components/deck/DeckErlebnis";
import DeckFunnel from "@/components/deck/DeckFunnel";
import DeckBrands from "@/components/deck/DeckBrands";
import DeckRoadmap from "@/components/deck/DeckRoadmap";
import DeckPartner from "@/components/deck/DeckPartner";
import DeckFAQ from "@/components/deck/DeckFAQ";
import DeckKontakt from "@/components/deck/DeckKontakt";

export const metadata: Metadata = {
  title: "Pre-Launch Deck",
  description:
    "Hub42 Pre-Launch Deck – der kuratierte Entdecker-Store am Alexa Berlin. Eröffnung Oktober 2026.",
  robots: { index: false, follow: false },
};

export default function DeckPage() {
  return (
    <>
      {/* Nur im Druck sichtbar – auf jeder Seite wiederholt */}
      <div className="deck-print-header" aria-hidden="true">
        Hub42 · Pre-Launch Deck
      </div>
      <div className="deck-print-footer" aria-hidden="true">
        Hub42 UG · Eröffnung Oktober 2026 · Alexa Berlin · tryhub42.de
      </div>

      <main className="bg-green-dark text-cream">
        {/* ─── Section 1: Hero / Cover ────────────────────── */}
        <DeckHero />

        {/* ─── Section 2: Problem für Marken ──────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
          aria-label="Das Problem für Marken"
        >
          <div className="absolute inset-0 markthalle-pattern opacity-20 deck-screen-only" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Das Problem
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Gute Marken.
                <br />
                <span className="text-bronze">Keine Bühne.</span>
              </h2>
            </div>
            <DeckProblem />
          </div>
        </section>

        {/* ─── Section 3: Lösung / Modell ─────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-mid border-t border-stone-dark/50"
          aria-label="Das Modell: Hub42 im Vergleich"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Das Modell
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Logistik statt Handel.
                <br />
                <span className="text-bronze">Du behältst alles, was zählt.</span>
              </h2>
              <p className="text-stone text-base leading-relaxed mt-5 max-w-xl">
                Hub42 ist kein Händler. Du buchst Regalplätze – bemessen am Platzbedarf
                deines Produkts –, wir verkaufen in deinem Namen, ohne Marge und ohne dein
                Eigentum anzutasten. Drei Wege in den Markt, eine ehrliche Gegenüberstellung.
              </p>
            </div>

            <DeckModell />
          </div>
        </section>

        {/* ─── Section 4: Rechner ─────────────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 border-t border-stone-dark/50"
          aria-label="Rechner: Hub42 vs. eigener Online-Shop"
        >
          <div className="absolute inset-0 markthalle-pattern opacity-20 deck-screen-only" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Rechne selbst nach
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Was kostet ein Verkauf
                <br />
                <span className="text-bronze">wirklich?</span>
              </h2>
              <p className="text-stone text-base leading-relaxed mt-5 max-w-xl">
                Vergleich pro verkauftem Artikel: dein eigener Online-Shop
                (Fulfillment + Marketing) gegen Hub42 (anteilige Slot-Miete +
                variable Kosten). Alle Annahmen sind anpassbar und offengelegt.
              </p>
            </div>

            <DeckRechner />
          </div>
        </section>

        {/* ─── Section 5: Standort Alexa ──────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-dark markthalle-pattern border-t border-stone-dark/50"
          aria-label="Standort Alexa Berlin"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Der Standort
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Mitten in Berlin.
                <br />
                <span className="text-bronze">Wo alle vorbeikommen.</span>
              </h2>
            </div>
            <DeckStandort />
          </div>
        </section>

        {/* ─── Section 6: Brand-Erlebnis ──────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-mid border-t border-stone-dark/50"
          aria-label="Brand-Erlebnis: Fläche, Discovery, Tasting & Events"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Dein Auftritt im Store
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Mehr als ein Regalplatz.
                <br />
                <span className="text-bronze">Eine Bühne für deine Marke.</span>
              </h2>
              <p className="text-stone text-base leading-relaxed mt-5 max-w-xl">
                Du bekommst Fläche, Sichtbarkeit und ein Erlebnis – und Hub42 wird zum
                Akquisitionskanal für deinen eigenen Shop.
              </p>
            </div>

            <DeckErlebnis />
          </div>
        </section>

        {/* ─── Section 7: Daten-Layer / Funnel ────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
          aria-label="Daten-Layer und Conversion-Funnel"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Der Daten-Layer
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Vom Strom
                <br />
                <span className="text-bronze">zum Kauf.</span>
              </h2>
            </div>
            <DeckFunnel />
          </div>
        </section>

        {/* ─── Section 8: Brands an Bord ──────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-mid border-t border-stone-dark/50"
          aria-label="Brands an Bord"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Erste Partner an Bord
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Marken, die schon
                <br />
                <span className="text-bronze">dabei sind.</span>
              </h2>
            </div>
            <DeckBrands />
          </div>
        </section>

        {/* ─── Section 9: Roadmap ─────────────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
          aria-label="Roadmap"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Roadmap
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Erst beweisen.
                <br />
                <span className="text-bronze">Dann skalieren.</span>
              </h2>
            </div>
            <DeckRoadmap />
          </div>
        </section>

        {/* ─── Section 10: Für Partner / FutureFoodCo ─────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-mid border-t border-stone-dark/50"
          aria-label="Was Partner davon haben"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">
                Für Innovations-Partner
              </p>
              <p className="text-stone text-[11px] font-mono tracking-wider mb-3">
                Berater · Agenturen · Acceleratoren
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Wo euer Sprint endet,
                <br />
                <span className="text-bronze">fangen wir an.</span>
              </h2>
            </div>
            <DeckPartner />
          </div>
        </section>

        {/* ─── Slide: Ehrliche Antworten (FAQ) ────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
          aria-label="Ehrliche Antworten"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Ehrliche Antworten
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Was uns immer
                <br />
                <span className="text-bronze">gefragt wird.</span>
              </h2>
              <p className="text-stone text-base mt-5">Vier Antworten, bevor du fragst.</p>
            </div>
            <DeckFAQ />
          </div>
        </section>

        {/* ─── Section 11: Kontakt ────────────────────────── */}
        <section
          className="deck-section relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
          aria-label="Kontakt"
        >
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Kontakt
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Reden wir über
                <br />
                <span className="text-bronze">deine Marken.</span>
              </h2>
            </div>
            <DeckKontakt />
          </div>
        </section>
      </main>
    </>
  );
}
