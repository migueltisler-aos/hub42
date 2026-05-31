const STEPS = [
  {
    n: "01",
    t: "Hub42 stellt die Infrastruktur",
    d: "Laden, Kasse, Personal, Tracking, Daten – alles läuft über uns. Die Marke bringt das Produkt. Den Rest übernehmen wir.",
  },
  {
    n: "02",
    t: "Die Ware bleibt beim Hersteller",
    d: "Konsignation nach §383 HGB: das Produkt bleibt dein Eigentum, bis es verkauft ist. Kein Abnahmezwang, kein Lagerrisiko, keine Vorauszahlung.",
  },
  {
    n: "03",
    t: "Niemals Marge",
    d: "Hub42 nimmt keine Handelsmarge. Die Marke setzt den Preis. Wir verdienen an der Regalmiete – transparent, kalkulierbar, ohne Interessenkonflikt.",
  },
];

export default function MCLoesung() {
  return (
    <div className="space-y-10">
      {/* Drei Schritte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10">
        {STEPS.map((s) => (
          <div key={s.n} className="bg-green-dark p-6 md:p-8">
            <p className="text-bronze/50 font-mono text-sm mb-4">{s.n}</p>
            <h3
              className="text-cream text-xl md:text-2xl tracking-wide mb-3 leading-tight"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {s.t}
            </h3>
            <p className="text-stone text-sm leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>

      {/* §383 HGB Kernprinzip */}
      <div className="border border-bronze/30 bg-green-mid/30 p-6 md:p-8 max-w-2xl">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
          Das Kernprinzip
        </p>
        <p
          className="text-cream text-2xl md:text-3xl tracking-wide leading-tight mb-4"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Niemals Marge.
          <br />
          <span className="text-bronze">Immer dein Preis.</span>
        </p>
        <p className="text-stone text-sm leading-relaxed">
          Denk an die kleine Zahnbürsten-Manufaktur aus dem Schwarzwald, die ein
          wirklich gutes Produkt macht – aber keinen Werbebudget-Apparat hinter
          sich hat. Die verdient einen fairen Marktzugang. Hub42 ist dieser
          Marktzugang: physisch, kuratiert, ohne Marge.
        </p>
      </div>

      {/* Standort-Kontext */}
      <div className="flex flex-col sm:flex-row gap-6">
        {[
          { label: "Frequenz", value: "41.000", sub: "Besucher täglich · Alexa Berlin" },
          { label: "Standort", value: "Top 5", sub: "Einkaufszentren Deutschlands" },
          { label: "Modell", value: "§383 HGB", sub: "Konsignation · Kein Eigentumsübergang" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-green-dark border border-stone-dark/50 p-5">
            <p className="text-stone text-xs font-mono uppercase tracking-widest mb-1">{s.label}</p>
            <p
              className="text-bronze text-3xl tracking-wide"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {s.value}
            </p>
            <p className="text-stone/60 text-xs font-mono mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
