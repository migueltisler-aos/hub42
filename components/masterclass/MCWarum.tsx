const REASONS = [
  {
    n: "01",
    t: "Einstieg ab 59 €/Monat",
    d: "Statt Werbebudget zu verbrennen, das keiner mehr zurückbekommt. Eine feste, kalkulierbare Kosten – kein Variablenrisiko.",
  },
  {
    n: "02",
    t: "Höhere Wertschöpfung – auch bei kleinen Artikeln",
    d: "Wer seinen Preis selbst setzt und keine Marge abgibt, behält mehr. Das funktioniert auch bei 15-Euro-Produkten – wie der Rechner unten zeigt.",
  },
  {
    n: "03",
    t: "Geringes Risiko auf beiden Seiten",
    d: "Hub42 trägt kein Warenlager, die Marke kein Shop-Risiko. Unsere Fixkosten sind durch die Mieteinnahmen gedeckt. Gewinn entsteht erst beim Verkauf – auf beiden Seiten.",
  },
  {
    n: "04",
    t: "Gebaut für unabhängige Marken",
    d: "Nicht für Konzerne, nicht für Massenprodukte. Für Gründerinnen und Gründer mit einer echten Geschichte und einem Produkt, das Regalfläche verdient.",
  },
];

export default function MCWarum() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-cream/10">
        {REASONS.map((r) => (
          <div key={r.n} className="bg-green-dark p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="text-bronze/40 font-mono text-sm shrink-0 mt-0.5">{r.n}</span>
              <div>
                <h3
                  className="text-cream text-lg md:text-xl tracking-wide mb-2 leading-tight"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {r.t}
                </h3>
                <p className="text-stone text-sm leading-relaxed">{r.d}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-cream/60 text-sm leading-relaxed max-w-2xl pt-2">
        Das Modell ist nicht perfekt. Es ist ein erster, fairer Schritt für
        Marken, die physische Sichtbarkeit wollen – ohne das Casino der
        Performance-Werbung zu spielen.
      </p>
    </div>
  );
}
