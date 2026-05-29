/* Slide „Ehrliche Antworten" – FAQ, beantwortet unausgesprochene Risiken.
   Server Component. */
const FAQ = [
  {
    n: "01",
    q: "Mindestlaufzeit?",
    a: "3 Monate. Danach monatlich kündbar. Wir wollen nur Marken, die bleiben wollen.",
  },
  {
    n: "02",
    q: "Was, wenn es nicht läuft?",
    a: "Nach 6 Wochen ein Daten-Review. Stimmen die Zahlen nicht, besprechen wir Slot-Wechsel, Story-Anpassung oder – ehrlich – den Ausstieg. Kein Gesichtsverlust.",
  },
  {
    n: "03",
    q: "Wer haftet für Ware & Schwund?",
    a: "Bis zum Verkauf: dein Eigentum, unsere Sorgfaltspflicht. Schwund- und Haftungsgrenzen sind vertraglich klar geregelt – fair und transparent, kein Kleingedrucktes.",
  },
  {
    n: "04",
    q: "Was passiert mit abgelaufener Ware?",
    a: "MHD-Tracking im System. 4 Wochen vor Ablauf: Reduzierung oder Rückführung – du entscheidest. Keine versteckten Entsorgungskosten.",
  },
];

export default function DeckFAQ() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-cream/10">
      {FAQ.map((f) => (
        <div key={f.n} className="bg-green-dark p-6 md:p-8">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-bronze/50 font-mono text-sm">{f.n}</span>
            <h3
              className="text-cream text-lg md:text-xl tracking-wide leading-tight"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {f.q}
            </h3>
          </div>
          <p className="text-stone text-sm leading-relaxed">{f.a}</p>
        </div>
      ))}
    </div>
  );
}
