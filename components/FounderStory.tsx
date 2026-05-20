export default function FounderStory() {
  return (
    <section className="bg-green-dark py-20 border-t border-stone-dark/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-8">
          Warum Hub42
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 items-start">
          {/* Left: Name + Quote */}
          <div>
            <div className="border-l-2 border-bronze pl-5 mb-6">
              <p
                className="text-cream text-xl leading-snug tracking-wide mb-3"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                „Bei uns entscheidet der Kunde –<br />
                nicht der Category Manager."
              </p>
              <p className="text-stone text-xs font-mono">
                Miguel Tisler · Gründer Hub42
              </p>
            </div>

            <div className="space-y-1 text-stone text-xs font-mono leading-relaxed">
              <p>Gelernter Logistiker</p>
              <p>Faltin Masterclass</p>
              <p>Genug von überall dasselbe</p>
            </div>
          </div>

          {/* Right: Story */}
          <div className="space-y-5 text-stone text-base leading-relaxed">
            <p>
              Ich komme aus der Logistik. 3PL-Lager, Dutzende Brands,
              eine Infrastruktur. Das Prinzip: du mietest Kapazität –
              wir stellen den Rest.
            </p>
            <p>
              Irgendwann habe ich mich gefragt warum das im Retail nicht existiert.
              In der Logistik mietest du Kapazität und behältst die Kontrolle.
              Im Handel gibst du alles ab – bevor du auch nur einen Artikel verkauft hast.
            </p>
            <p>
              Wer ins Regal will zahlt Listungsgebühr, gibt 35–40% Marge ab
              und verliert die Kontrolle über den eigenen Preis.
              Der Category Manager entscheidet was Deutschland kauft.
              Nicht der Kunde. Nicht der Hersteller.
            </p>
            <p className="text-cream">
              Das wollte ich nicht mehr hinnehmen.
            </p>
            <p>
              Hub42 ist meine Antwort. Kein Händler. Keine Marge.
              Kein Category Manager. Nur Hersteller die ihr Produkt
              wirklich machen – und ein Regal das ihnen gehört.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
 