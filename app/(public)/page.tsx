import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import FounderStory from "@/components/FounderStory";
import ValueProps from "@/components/ValueProps";
import BrandsCarousel from "@/components/BrandsCarousel";
import ErlebnisCard from "@/components/ErlebnisCard";
import HerstWieEsFunktioniert from "@/components/HerstWieEsFunktioniert";
import ProofSection from "@/components/ProofSection";
import { ERLEBNISSE } from "@/lib/erlebnisse";

export const metadata: Metadata = {
  title: "Hub42 – The Store You Have To Solve.",
  description:
    "Hub42 im Alexa Berlin – kuratierter Store direkt vom Hersteller. 0% Handelsmarge. 41.000 Berliner täglich.",
};

const FEATURED_ERLEBNISSE = ERLEBNISSE.filter((e) =>
  ["tasting-bar", "blind-box", "scouts-club"].includes(e.id)
);

export default function Home() {
  return (
    <>
      <HeroSection />

      {/* Pre-Launch Banner */}
      <section className="bg-bronze/10 border-y border-bronze/20 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-bronze animate-pulse shrink-0" />
              <p className="text-bronze text-xs font-mono tracking-widest uppercase">
                Eröffnung Oktober 2026 · Alexa Berlin · Alexanderplatz
              </p>
            </div>
            <Link
              href="/hersteller"
              className="text-bronze text-xs font-mono tracking-widest hover:text-bronze-light transition-colors whitespace-nowrap"
            >
              Jetzt First-Mover-Platz sichern →
            </Link>
          </div>
        </div>
      </section>

      {/* Das Konzept */}
      <section className="bg-green-mid py-20 border-t border-stone-dark/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-8"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Kein Primark.
            <br />
            Kein H&M.
            <span className="text-bronze"> Kein dm.</span>
          </h2>
          <div className="max-w-2xl space-y-4 text-stone text-base leading-relaxed">
            <p>Du kennst das Gefühl. Du reist in eine neue Stadt und findest überall dasselbe.</p>
            <p>Hub42 ist das Gegenteil davon.</p>
            <p>Hier stehen Brands die du noch nicht kennst.<br />
            Hinter jedem Produkt steckt jemand der es wirklich macht.<br />
            Kein Händler dazwischen. Kein aufgeblähter Preis.</p>
            <p className="text-cream">Einfach probieren. Mitnehmen. Wiederkommen.</p>
          </div>
        </div>
      </section>

      <HerstWieEsFunktioniert />
      <ValueProps />

      {/* Hersteller CTA */}
      <section className="bg-green-dark py-20 md:py-28 relative overflow-hidden border-t border-stone-dark/50" aria-label="Für Hersteller">
        <div className="absolute inset-0 markthalle-pattern opacity-30" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,150,74,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-bronze/60 text-xs font-mono tracking-[0.3em] uppercase mb-6">
            Für Hersteller
          </p>
          <h2
            className="text-cream text-[clamp(2.5rem,7vw,7rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Dein Produkt im
            <br />
            <span className="text-bronze">Alexa Berlin</span>
          </h2>
          <p className="text-cream/50 text-base max-w-lg mx-auto mb-4">
            Der günstigste Weg zu echten Berliner Kunden. Ohne Händler, ohne Risiko, mit allen Daten.
          </p>
          <div className="inline-flex items-center gap-2 mb-10 px-4 py-2 border border-bronze/30 bg-bronze/5">
            <span className="text-bronze text-2xl" style={{ fontFamily: "var(--font-bebas)" }}>
              Ab 55 €
            </span>
            <span className="text-cream/40 text-sm font-mono">/Monat · Konsignation · 0% Marge</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/hersteller"
              className="inline-flex items-center justify-center px-8 py-4 bg-bronze text-green-dark font-semibold text-sm tracking-wide hover:bg-bronze-light transition-colors rounded-sm"
            >
              Wie es funktioniert
            </Link>
            <Link
              href="/hersteller#regalfront-anfragen"
              className="inline-flex items-center justify-center px-8 py-4 border border-bronze/50 text-bronze font-semibold text-sm tracking-wide hover:bg-bronze/10 transition-colors rounded-sm"
            >
              Regalfläche anfragen →
            </Link>
          </div>
        </div>
      </section>

      <ProofSection />
      <FounderStory />
      <BrandsCarousel />

      {/* Erlebnis-System */}
      <section className="bg-green-mid py-20 border-t border-stone-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Das Erlebnis
            </p>
            <h2
              className="text-cream text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Drei Wege
              <br />
              <span className="text-bronze">ein Produkt zu entdecken</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURED_ERLEBNISSE.map((e, i) => (
              <ErlebnisCard key={e.id} erlebnis={e} index={i} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/erlebnis" className="inline-flex items-center gap-2 text-bronze hover:underline text-sm">
              Alle Erlebnisse →
            </Link>
          </div>
        </div>
      </section>

      {/* Store Preview */}
      <section className="bg-green-dark py-20 markthalle-pattern border-t border-stone-dark/50" aria-label="Store Preview">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                Der Store
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4.5rem)] leading-none tracking-widest mb-6"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Mitten in Berlin.
                <br />
                <span className="text-bronze">Offen für alle.</span>
              </h2>
              <div className="text-stone text-base leading-relaxed mb-8 max-w-md space-y-3">
                <p>Zwei Regalwände. Bronze und Olivgrün.</p>
                <p>Jede Regalfront gehört einer anderen Brand.<br />
                Jede Traverse erzählt eine andere Geschichte.</p>
                <p>Kein Supermarkt. Kein Konzern.<br />
                Nur Hersteller die ihr Produkt wirklich machen.</p>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { num: "41.000", label: "Besucher täglich" },
                  { num: "Mo–Sa", label: "10–20 Uhr" },
                  { num: "Alexa", label: "Alexanderplatz" },
                ].map((stat) => (
                  <div key={stat.label} className="border-l-2 border-bronze pl-4">
                    <p
                      className="text-bronze text-2xl leading-none"
                      style={{ fontFamily: "var(--font-bebas)" }}
                    >
                      {stat.num}
                    </p>
                    <p className="text-stone text-xs font-mono mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/store"
                className="inline-flex items-center gap-2 text-bronze text-sm font-mono hover:text-bronze-light transition-colors"
              >
                Store entdecken →
              </Link>
            </div>

            {/* Visual placeholder */}
            <div className="relative">
              <div className="bg-green-mid aspect-4/3 flex flex-col items-center justify-center gap-4 relative overflow-hidden border border-stone-dark/50">
                <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6 opacity-20">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-2 h-10">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-1 border border-bronze/40" />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-bronze text-4xl relative z-10" style={{ fontFamily: "var(--font-bebas)" }}>
                  HUB42
                </p>
                <p className="text-cream/30 text-xs font-mono relative z-10 tracking-widest uppercase">
                  Alexa Berlin
                </p>
                <div className="flex gap-3 mt-2 relative z-10 flex-wrap justify-center">
                  {["Tasting Bar", "Blind Box", "Scouts Club"].map((feat) => (
                    <div key={feat} className="px-3 py-1 border border-bronze/30 text-bronze/60 text-xs font-mono">
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full border-b-2 border-r-2 border-bronze/20 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
