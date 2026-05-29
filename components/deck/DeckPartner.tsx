/* Section 10 – Was Partner wie FutureFoodCo davon haben. Server Component.
   Visueller Handoff-Funnel (euer Teil → unser Teil) + kompakte Value-Kacheln. */
const VALUE = [
  {
    t: "Aus Konzept wird Regal",
    d: "Nach eurem 6-Wochen-Sprint braucht eine Marke einen realen Ort zum Testen. Hub42 liefert ihn – in Wochen, nicht über Jahre LEH-Listung.",
  },
  {
    t: "In-vivo statt nur in vitro",
    d: "Neben euren KI- und Workshop-Scores: echte Abverkaufs- und Funnel-Daten am POS. Validierung, die niemand simulieren kann.",
  },
  {
    t: "Risikoarm & schnell",
    d: "Konsignation, ab 59 €/Monat, Entscheidung in 1–2 Wochen. Testen ohne Marge, Cash oder Monate zu riskieren.",
  },
  {
    t: "Gemeinsamer Mehrwert",
    d: "Ihr bringt validierte Marken, wir Ort und Daten. Co-Branding, Referenz-Cases und ein Kanal, der eure Sprints messbar macht.",
  },
];

function Step({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div
      className={`px-3 py-2 text-xs font-mono tracking-wide whitespace-nowrap border ${
        accent
          ? "border-bronze/50 bg-bronze/10 text-bronze"
          : "border-stone-dark/60 bg-green-dark text-stone"
      }`}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return <span className="text-stone/50 text-sm shrink-0">→</span>;
}

export default function DeckPartner() {
  return (
    <div>
      {/* ── Handoff-Funnel ────────────────────────────────── */}
      <div className="border border-stone-dark/50 bg-green-dark/60 p-5 md:p-6 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          {/* Euer Teil */}
          <div className="flex-1">
            <p className="text-stone text-[10px] font-mono uppercase tracking-widest mb-3">
              Euer Teil · FutureFoodCo
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Step label="Konzept" />
              <Arrow />
              <Step label="Sprint" />
              <Arrow />
              <Step label="Prototyp" />
            </div>
          </div>

          {/* Übergabe */}
          <div className="flex lg:flex-col items-center gap-2 lg:px-2">
            <div className="hidden lg:block w-px h-10 bg-bronze/40" />
            <span className="text-bronze text-[10px] font-mono uppercase tracking-widest">
              Übergabe
            </span>
            <div className="hidden lg:block w-px h-10 bg-bronze/40" />
          </div>

          {/* Unser Teil */}
          <div className="flex-1">
            <p className="text-bronze/70 text-[10px] font-mono uppercase tracking-widest mb-3">
              Unser Teil · Hub42
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Step label="Regal" accent />
              <Arrow />
              <Step label="In-vivo-Daten" accent />
              <Arrow />
              <Step label="Insights" accent />
            </div>
          </div>
        </div>
      </div>

      {/* ── Value-Kacheln (kompakt) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-cream/10">
        {VALUE.map((v, i) => (
          <div key={v.t} className="bg-green-dark p-5">
            <p className="text-bronze/50 font-mono text-xs mb-2">{String(i + 1).padStart(2, "0")}</p>
            <h3
              className="text-cream text-lg tracking-wide leading-tight mb-2"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {v.t}
            </h3>
            <p className="text-stone text-sm leading-relaxed">{v.d}</p>
          </div>
        ))}
      </div>

      <div className="border-l-2 border-bronze pl-5 py-1 mt-8 max-w-2xl">
        <p className="text-cream/80 text-base leading-relaxed">
          Nicht zu verwechseln mit einem Pop-up-Flächenvermieter wie Bikini Berlin: Hub42 ist{" "}
          <span className="text-cream">kuratiert, datengetrieben und auf Konsignation gebaut</span>{" "}
          – kein Quadratmeter-Verleih, sondern ein Vertriebs- und Validierungs-Layer.
        </p>
      </div>
    </div>
  );
}
