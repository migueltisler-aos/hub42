const CHANNELS = [
  {
    n: "01",
    t: "Online-Shop",
    d: "Ein Neukunde kostet 70 € und mehr – und amortisiert sich erst nach dem 2. oder 3. Kauf. Dazu kommen Porto, Shopgebühr und Zahlungsabwicklung: rund 5–6 € pro Bestellung, bevor die Marge überhaupt beginnt.",
    tag: "Teuer. Langsam. Datenreich.",
  },
  {
    n: "02",
    t: "Retail – Rewe, Edeka, Aldi & Co.",
    d: "Der Handel diktiert Platzierung, Preis und Lieferkonditionen. Dazu eine Listungsgebühr, 30–50 % Handelsmarge und Vorlaufzeiten von 6–18 Monaten. Wer es hineinschafft, gibt fast alles ab.",
    tag: "Teuer. Kontrollverlust. Massig.",
  },
  {
    n: "03",
    t: "Amazon",
    d: "Schneller Absatz – aber keine eigenen Kundendaten, keine Markenhoheit, jederzeit sperrbar. Die Gebühren steigen kontinuierlich, der Algorithmus nicht.",
    tag: "Schnell. Abhängig. Blind.",
  },
];

export default function MCProblem() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10">
        {CHANNELS.map((c) => (
          <div key={c.n} className="bg-green-dark p-6 md:p-8">
            <p className="text-bronze/50 font-mono text-sm mb-4">{c.n}</p>
            <h3
              className="text-cream text-xl md:text-2xl tracking-wide mb-3 leading-tight"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {c.t}
            </h3>
            <p className="text-stone text-sm leading-relaxed mb-4">{c.d}</p>
            <p className="text-bronze/60 text-xs font-mono tracking-widest uppercase">
              {c.tag}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 border-l-2 border-bronze pl-5 py-1 max-w-2xl">
        <p className="text-bronze/60 text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Gemeinsamer Nenner
        </p>
        <p className="text-cream/80 text-base leading-relaxed">
          Die Wertschöpfung der großen Player kommt aus{" "}
          <span className="text-cream">Werbung</span>, nicht aus dem besten
          Produkt zum besten Preis. Wer kein Werbebudget hat, hat kein Regal –
          egal wie gut das Produkt ist.
        </p>
      </div>
    </div>
  );
}
