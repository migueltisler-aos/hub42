/* Section 2 – Das Problem für Marken. Server Component. */
const PROBLEMS = [
  {
    n: "01",
    t: "Regal-Zugang ist verschlossen",
    d: "In den LEH zu kommen heißt: Gatekeeper, Jahresgespräche, 6–18 Monate Vorlauf – und am Ende oft ein Nein. Stationäre Sichtbarkeit ist für unabhängige Marken praktisch unerreichbar.",
  },
  {
    n: "02",
    t: "Listung kostet Marge & Cash",
    d: "Wer es schafft, zahlt: 30–50 % Handelsmarge, Listungsgebühren, Werbekostenzuschüsse, Vollpaletten-Risiko. Vom eigenen Preis bleibt wenig – die Kontrolle gibt man komplett ab.",
  },
  {
    n: "03",
    t: "Verkauf ohne Feedback",
    d: "Im Regal verkauft man blind: keine Abverkaufsdaten, kein Kontakt zur Käuferin, kein Lernen. Online gibt's Daten – aber jeder Erstkontakt wird über teure Ads erkauft.",
  },
];

export default function DeckProblem() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10">
        {PROBLEMS.map((p) => (
          <div key={p.n} className="bg-green-dark p-6 md:p-8">
            <p className="text-bronze/50 font-mono text-sm mb-4">{p.n}</p>
            <h3
              className="text-cream text-xl md:text-2xl tracking-wide mb-3 leading-tight"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {p.t}
            </h3>
            <p className="text-stone text-sm leading-relaxed">{p.d}</p>
          </div>
        ))}
      </div>

      <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl mt-8">
        Marken stehen vor einer Wahl, die keine ist:{" "}
        <span className="text-cream">Marge verlieren im Handel</span> oder{" "}
        <span className="text-cream">Cash verbrennen im eigenen Shop</span> – und in beiden
        Fällen kaum lernen. <span className="text-bronze">Hub42 ist der dritte Weg.</span>
      </p>
    </div>
  );
}
