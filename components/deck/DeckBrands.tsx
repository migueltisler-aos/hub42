/* Section 8 – Brands an Bord. Server Component, nutzt lib/brands. */
import { BRANDS } from "@/lib/brands";

// Vom Brief bestätigte Partner
const CONFIRMED = ["berlin-oats", "crazy-bastard", "ikani", "auteniq", "green-naturals", "tekoha"];
const PARTNERS = CONFIRMED.map((id) => BRANDS.find((b) => b.id === id)).filter(
  (b): b is NonNullable<typeof b> => Boolean(b),
);

export default function DeckBrands() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-cream/10">
        {PARTNERS.map((b) => (
          <div key={b.id} className="bg-green-dark p-6 flex flex-col items-start">
            <div
              className="w-14 h-14 flex items-center justify-center rounded-sm mb-4"
              style={{ backgroundColor: b.accentColor }}
            >
              <span className="text-cream font-bold text-lg" style={{ fontFamily: "var(--font-bebas)" }}>
                {b.initials}
              </span>
            </div>
            <p className="text-cream text-lg leading-tight" style={{ fontFamily: "var(--font-bebas)" }}>
              {b.name}
            </p>
            <p className="text-bronze/70 text-[10px] font-mono uppercase tracking-wider mt-1">
              {b.kategorie} · {b.herkunft}
            </p>
            <p className="text-stone text-sm leading-relaxed mt-3">{b.tagline}</p>
          </div>
        ))}

        {/* Pipeline-Kachel */}
        <div className="bg-green-mid/30 p-6 flex flex-col items-start justify-center border border-dashed border-bronze/30">
          <p className="text-bronze text-3xl leading-none" style={{ fontFamily: "var(--font-bebas)" }}>
            + mehr
          </p>
          <p className="text-stone text-sm leading-relaxed mt-2">
            Weitere kuratierte Marken in Gesprächen – die erste Regalwand füllt sich.
          </p>
        </div>
      </div>

      <p className="text-stone text-xs font-mono mt-4">
        Bestätigte Erst-Partner. Auswahl kuratiert nach Direktvertrieb, Qualität und
        Story-Fit.
      </p>
    </div>
  );
}
