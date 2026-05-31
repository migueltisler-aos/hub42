import type { Metadata } from "next";
import MCHero from "@/components/masterclass/MCHero";
import MCProblem from "@/components/masterclass/MCProblem";
import MCLoesung from "@/components/masterclass/MCLoesung";
import MCWarum from "@/components/masterclass/MCWarum";
import DeckRechner from "@/components/deck/DeckRechner";
import MCEmpfehlung from "@/components/masterclass/MCEmpfehlung";

export const metadata: Metadata = {
  title: "Hub42 · Faltin Masterclass",
  description:
    "Hub42 – ein Entdecker-Store im Alexa Berlin für unabhängige Marken. Konsignation, keine Marge, ab 59 €/Monat.",
  robots: { index: false, follow: false },
};

export default function MasterclassPage() {
  return (
    <main className="bg-green-dark text-cream">
      {/* ─── Section 1: Hero ────────────────────────────── */}
      <MCHero />

      {/* ─── Section 2: Das Problem ─────────────────────── */}
      <section
        className="relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
        aria-label="Die drei Vertriebswege und ihre Kosten"
      >
        <div className="absolute inset-0 markthalle-pattern opacity-15" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Das Problem
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Drei Wege in den Markt.
              <br />
              <span className="text-bronze">Alle teuer für Neueinsteiger.</span>
            </h2>
          </div>
          <MCProblem />
        </div>
      </section>

      {/* ─── Section 3: Die Lösung ──────────────────────── */}
      <section
        className="relative overflow-hidden py-16 md:py-24 bg-green-mid border-t border-stone-dark/50"
        aria-label="Die Lösung: Hub42"
      >
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Die Lösung
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Ein Laden als Bühne.
              <br />
              <span className="text-bronze">Infrastruktur statt Handel.</span>
            </h2>
            <p className="text-stone text-base leading-relaxed mt-5 max-w-xl">
              Hub42 ist kein Händler. Wir stellen Regalplatz, Kasse, Personal und Daten.
              Die Marke bleibt Eigentümerin – bis zum Verkauf. Kein Abnahmezwang,
              keine Marge, keine Preishoheit, die wir übernehmen.
            </p>
          </div>
          <MCLoesung />
        </div>
      </section>

      {/* ─── Section 4: Warum es trägt ──────────────────── */}
      <section
        className="relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
        aria-label="Warum das Modell trägt"
      >
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Warum es trägt
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Fairer Zugang.
              <br />
              <span className="text-bronze">Kalkulierbares Risiko.</span>
            </h2>
          </div>
          <MCWarum />
        </div>
      </section>

      {/* ─── Section 5: Rechner ─────────────────────────── */}
      <section
        id="rechner"
        className="relative overflow-hidden py-16 md:py-24 bg-green-mid border-t border-stone-dark/50"
        aria-label="Kostenvergleich Hub42 vs. eigener Online-Shop"
      >
        <div className="absolute inset-0 markthalle-pattern opacity-10" aria-hidden="true" />
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
              Eigener Online-Shop (Fulfillment + Verpackung + Marketing) gegen Hub42
              (anteilige Slot-Miete + variable Kosten). Alle Annahmen sind anpassbar –
              auch Preis und CAC.
            </p>
          </div>
          <DeckRechner />
        </div>
      </section>

      {/* ─── Section 6: Empfehlung / CTA ────────────────── */}
      <section
        id="empfehlung"
        className="relative overflow-hidden py-16 md:py-24 bg-green-dark border-t border-stone-dark/50"
        aria-label="Marken-Empfehlung"
      >
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Eine Bitte
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Kennst du eine Marke,
              <br />
              <span className="text-bronze">die das verdient?</span>
            </h2>
          </div>
          <MCEmpfehlung />
        </div>
      </section>
    </main>
  );
}
