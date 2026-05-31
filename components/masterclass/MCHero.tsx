export default function MCHero() {
  return (
    <section className="relative overflow-hidden bg-green-dark py-20 md:py-32">
      <div className="absolute inset-0 markthalle-pattern opacity-15" aria-hidden="true" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-6">
          Faltin Entrepreneurship Masterclass · Hub42
        </p>

        <h1
          className="text-cream text-[clamp(2.4rem,7vw,5.5rem)] leading-none tracking-widest mb-6"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Hub42 –
          <br />
          <span className="text-bronze">weil ein gutes Produkt</span>
          <br />
          allein heute kaum
          <br />
          noch reicht.
        </h1>

        <p className="text-stone text-base md:text-lg leading-relaxed max-w-xl mb-10">
          Die UG ist gegründet. Der Standort steht. Jetzt geht es um das Einzige,
          das zählt:{" "}
          <span className="text-cream">die ersten Marken</span>, die das Konzept
          zum Leben bringen.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#empfehlung"
            className="inline-block px-8 py-4 bg-bronze text-green-dark text-sm font-mono font-semibold tracking-widest uppercase hover:bg-bronze-light transition-colors"
          >
            Marke empfehlen →
          </a>
          <a
            href="#rechner"
            className="inline-block px-8 py-4 border border-cream/30 text-cream text-sm font-mono tracking-widest uppercase hover:border-bronze hover:text-bronze transition-colors"
          >
            Zahlen nachrechnen
          </a>
        </div>
      </div>
    </section>
  );
}
