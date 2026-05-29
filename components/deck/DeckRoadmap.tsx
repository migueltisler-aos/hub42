/* Section 9 – Roadmap. Server Component. */
const PHASES = [
  {
    when: "Q4 2026",
    title: "Launch Store 1 · Alexa Berlin",
    points: ["4 Kategorie-Regale + Hero Wall & Tasting Bar live", "Erste Brand-Partner im Regal", "Daten-Layer ab Tag 1 aktiv"],
    active: true,
  },
  {
    when: "H1 2027",
    title: "Beweisen & optimieren",
    points: ["Sortiments-Rotation nach Abverkaufsdaten", "Pro-Analytics & Brand-Reports ausrollen", "Auslastung & Wirtschaftlichkeit am Standort belegen"],
  },
  {
    when: "ab H2 2027",
    title: "Skalieren",
    points: ["Store 2 in weiterer A-Lage", "Playbook & Daten-Layer als Blaupause", "Mehr-Standort-Netzwerk für Marken"],
  },
];

export default function DeckRoadmap() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10">
      {PHASES.map((p) => (
        <div
          key={p.when}
          className={`p-6 md:p-8 ${p.active ? "bg-green-mid/40 border border-bronze/30" : "bg-green-dark"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2 h-2 rounded-full ${p.active ? "bg-bronze" : "bg-stone-dark"}`} />
            <p className={`text-xs font-mono tracking-widest uppercase ${p.active ? "text-bronze" : "text-stone"}`}>
              {p.when}
            </p>
          </div>
          <h3
            className="text-cream text-xl md:text-2xl tracking-wide leading-tight mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            {p.title}
          </h3>
          <ul className="space-y-2">
            {p.points.map((pt) => (
              <li key={pt} className="flex items-start gap-2 text-stone text-sm leading-relaxed">
                <span className="text-bronze leading-none mt-1" aria-hidden="true">·</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
