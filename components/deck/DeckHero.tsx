/* Section 1 – Hero / Deck-Cover. Server Component (statisch, drucktauglich).
   Eröffnung statisch „Oktober 2026", kein CountdownTimer. */
export default function DeckHero() {
  return (
    <section
      className="deck-section relative min-h-screen bg-green-dark flex flex-col items-center justify-center overflow-hidden py-20"
      aria-label="Hub42 – Pre-Launch Deck"
    >
      <div className="absolute inset-0 markthalle-pattern opacity-50 deck-screen-only" />
      <div
        className="absolute inset-0 pointer-events-none deck-screen-only"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(200,150,74,0.08) 0%, transparent 70%)",
        }}
      />
      {/* Industrie-Ecken */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-bronze/30" />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-bronze/30" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-bronze/30" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-bronze/30" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-bronze/60 text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Pre-Launch Deck · Eröffnung Oktober 2026
        </p>
        <p className="text-bronze text-xs font-mono tracking-[0.2em] uppercase mb-10">
          Alexa Berlin · Alexanderplatz
        </p>

        <h1
          className="text-bronze text-[clamp(4rem,15vw,11rem)] leading-none tracking-wider mb-8"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          HUB42
        </h1>

        <p className="text-cream text-xl md:text-2xl leading-snug max-w-2xl mx-auto mb-10">
          Der kuratierte Entdecker-Store, in dem unabhängige Marken{" "}
          <span className="text-bronze">Regalplätze mieten statt Marge zu verlieren</span> —
          mit voller Preishoheit, echten Abverkaufsdaten und einem Erlebnis, das man nicht
          online bekommt.
        </p>

        {/* Eckdaten */}
        <div className="grid grid-cols-3 gap-px bg-bronze/15 max-w-xl mx-auto">
          {[
            { num: "Okt 2026", label: "Eröffnung" },
            { num: "~700/Tag", label: "Geschenk-Suchende vor deinem Regal" },
            { num: "14 Tage", label: "Entscheidung statt 18 Mt. LEH" },
          ].map((s) => (
            <div key={s.label} className="bg-green-dark px-3 py-5">
              <p className="text-bronze text-2xl leading-none" style={{ fontFamily: "var(--font-bebas)" }}>
                {s.num}
              </p>
              <p className="text-stone text-[10px] font-mono mt-2 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-bronze/60 text-base italic tracking-wide mt-10">
          Logistik statt Handel. Deine UVP. Deine Daten.
        </p>
      </div>
    </section>
  );
}
