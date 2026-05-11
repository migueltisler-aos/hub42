import type { Metadata } from "next";
import Link from "next/link";
import ErlebnisCard from "@/components/ErlebnisCard";
import { ERLEBNISSE } from "@/lib/erlebnisse";

export const metadata: Metadata = {
  title: "Das Erlebnis – Einkaufen als Spiel",
  description:
    "Hub42 ist der einzige Store in Deutschland wo Einkaufen ein Spiel ist. Escape, Blind Tasting, Auktion, Blind Box, Scouts Club und mehr.",
};

const UGC = [
  { icon: "📸", titel: "Packtisch Foto-Spot", beschreibung: "Für den perfekten Unboxing-Moment." },
  { icon: "🏷️", titel: '"Entdeckt bei Hub42" Sticker', beschreibung: "Auf jede Tüte." },
  { icon: "💛", titel: "5 € Rabatt", beschreibung: "Für Posts mit @hub42berlin und @alexaberlin." },
  { icon: "🗳️", titel: "Brand des Monats Voting", beschreibung: "Die Community entscheidet." },
];

export default function ErlebnisPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-green-dark pt-32 pb-20 border-b border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Das Erlebnis
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Hub42 ist der einzige Store
            <br />
            <span className="text-bronze">in Deutschland</span>
            <br />
            wo Einkaufen ein Spiel ist.
          </h1>
        </div>
      </section>

      {/* 6 Erlebnis-Sektionen */}
      <section className="bg-green-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ERLEBNISSE.map((e, i) => (
              <ErlebnisCard key={e.id} erlebnis={e} index={i} />
            ))}
          </div>
        </div>
      </section>


      {/* UGC System */}
      <section className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Community & UGC
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Teil der
              <span className="text-bronze"> Bewegung werden</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {UGC.map((item) => (
              <div
                key={item.titel}
                className="bg-green-dark border border-stone-dark rounded-sm p-6 hover:border-bronze/30 transition-colors"
              >
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3
                  className="text-cream text-xl tracking-widest mb-2"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {item.titel}
                </h3>
                <p className="text-stone text-sm">{item.beschreibung}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-dark py-16 border-t border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-cream text-[clamp(1.8rem,4vw,3.5rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Überzeug dich selbst.
            <br />
            <span className="text-bronze">Alexa Berlin.</span>
          </h2>
          <p className="text-stone text-sm mb-8">Mo–Sa 10:00–20:00 Uhr · Grunerstraße 20 · 10179 Berlin</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/store"
              className="px-8 py-3 bg-bronze text-green-dark font-semibold rounded-sm hover:bg-[#9A7548] transition-colors text-sm"
            >
              Store entdecken →
            </Link>
            <Link
              href="/brands"
              className="px-8 py-3 border border-stone-dark text-cream hover:border-bronze/40 rounded-sm transition-colors text-sm"
            >
              Unsere Brands
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
