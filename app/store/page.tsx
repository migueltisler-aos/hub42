import type { Metadata } from "next";
import Link from "next/link";
import FunnelVisual from "@/components/FunnelVisual";

export const metadata: Metadata = {
  title: "Der Store – Alexa Berlin",
  description:
    "Hub42 im Alexa Berlin, Alexanderplatz. Warehouse Boutique mit Regaletagen-System, Tasting Bar, Packtisch und Hub42 Escape Station.",
};

const FEATURES = [
  {
    icon: "🏗️",
    titel: "Regaletagen-System",
    beschreibung: "Schwerlastregale mit Auer Eurokisten. Jede Ebene ein eigenes Sortiment.",
  },
  {
    icon: "📦",
    titel: "Packtisch",
    beschreibung: "Geschenke selbst verpacken – direkt im Store. Mit Materialien die wir stellen.",
  },
  {
    icon: "🍷",
    titel: "Tasting Bar",
    beschreibung: "Probieren bevor du kaufst. Kein anderer Store bietet das so konsequent.",
  },
  {
    icon: "🔍",
    titel: "Hub42 Escape Station",
    beschreibung: "Der Rätsel-Eingang. Karte holen. Spielen. Gewinnen.",
  },
  {
    icon: "📦",
    titel: "Blind Box Counter",
    beschreibung: "Vier Boxen. Vier Kategorien. Alles versiegelt.",
  },
  {
    icon: "⚡",
    titel: "Preis-Auktion Tafel",
    beschreibung: "Die schwarze Tafel. Wochenrekord live angezeigt.",
  },
  {
    icon: "🎤",
    titel: "Launch Events",
    beschreibung: "Freitags neue Brands persönlich. Hersteller vor Ort. Fragen erlaubt.",
  },
];

const OEFFNUNGSZEITEN = [
  { tag: "Montag", zeiten: "10:00 – 20:00" },
  { tag: "Dienstag", zeiten: "10:00 – 20:00" },
  { tag: "Mittwoch", zeiten: "10:00 – 20:00" },
  { tag: "Donnerstag", zeiten: "10:00 – 20:00" },
  { tag: "Freitag", zeiten: "10:00 – 20:00" },
  { tag: "Samstag", zeiten: "10:00 – 20:00" },
  { tag: "Sonntag", zeiten: "Geschlossen" },
];

export default function StorePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-green-dark pt-32 pb-20 border-b border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Der Store
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Alexa Berlin.
            <br />
            <span className="text-bronze">Alexanderplatz.</span>
          </h1>
          <p className="text-stone text-base max-w-lg mb-6">
            15 Mio. Besucher/Jahr. 41.000 täglich. Warehouse Boutique – Industrial trifft
            Premium.
          </p>
          <address className="not-italic text-stone text-sm font-mono">
            Grunerstraße 20 · 10179 Berlin
          </address>
        </div>
      </section>

      {/* Store-Konzept */}
      <section className="bg-green-mid py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Store-Konzept
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Was dich
              <span className="text-bronze"> erwartet</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.titel}
                className="bg-green-dark border border-stone-dark rounded-sm p-6 hover:border-bronze/30 transition-colors"
              >
                <span className="text-3xl block mb-3">{f.icon}</span>
                <h3
                  className="text-cream text-xl tracking-widest mb-2"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {f.titel}
                </h3>
                <p className="text-stone text-sm leading-relaxed">{f.beschreibung}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Öffnungszeiten + Karte */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Öffnungszeiten */}
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                Öffnungszeiten
              </p>
              <h2
                className="text-cream text-4xl tracking-widest mb-6"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Wann wir da sind
              </h2>
              <div className="space-y-2">
                {OEFFNUNGSZEITEN.map((oz) => (
                  <div
                    key={oz.tag}
                    className={`flex justify-between items-center py-3 border-b border-stone-dark ${
                      oz.zeiten === "Geschlossen" ? "opacity-40" : ""
                    }`}
                  >
                    <span className="text-cream text-sm">{oz.tag}</span>
                    <span
                      className={`font-mono text-sm ${
                        oz.zeiten === "Geschlossen" ? "text-stone" : "text-bronze"
                      }`}
                    >
                      {oz.zeiten}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Karte Placeholder */}
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                Lage
              </p>
              <h2
                className="text-cream text-4xl tracking-widest mb-6"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Wie du uns findest
              </h2>
              <div className="aspect-[4/3] bg-green-mid border border-stone-dark rounded-sm flex items-center justify-center relative overflow-hidden">
                <div className="text-center z-10">
                  <p
                    className="text-bronze text-2xl tracking-widest mb-2"
                    style={{ fontFamily: "var(--font-bebas)" }}
                  >
                    Alexa Berlin
                  </p>
                  <p className="text-stone text-sm font-mono">Grunerstraße 20</p>
                  <p className="text-stone text-sm font-mono">10179 Berlin</p>
                  <a
                    href="https://maps.google.com/?q=Alexa+Berlin,+Grunerstra%C3%9Fe+20,+10179+Berlin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-bronze text-xs hover:underline font-mono"
                  >
                    In Google Maps öffnen →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Funnel */}
      <section className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Customer Journey
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-3"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              41.000 Berliner.
              <br />
              <span className="text-bronze">Täglich vorbei.</span>
            </h2>
            <p className="text-stone text-sm">
              Vom Alexa-Eingang bis zum Kauf – so sieht unser Funnel aus.
            </p>
          </div>
          <FunnelVisual />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-dark py-16 border-t border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-cream text-[clamp(1.8rem,4vw,3.5rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Dein Produkt hierher?
          </h2>
          <p className="text-stone text-sm mb-8">
            41.000 Berliner täglich. Slot ab 59 €/Monat. 0% Handelsmarge.
          </p>
          <Link
            href="/hersteller"
            className="inline-block px-10 py-4 bg-bronze text-green-dark font-semibold rounded-sm hover:bg-[#9A7548] transition-colors text-sm"
          >
            Slot anfragen →
          </Link>
        </div>
      </section>
    </>
  );
}
