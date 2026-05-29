/* Section 5 – Standort Alexa. Server Component. */
export default function DeckStandort() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Text */}
      <div>
        <div className="space-y-4 text-stone text-base leading-relaxed mb-8 max-w-md">
          <p>
            Das Alexa am Alexanderplatz ist einer der frequenzstärksten Standorte Berlins –
            Touristen, Pendler und Locals an sieben Tagen.
          </p>
          <p>
            Genau hier funktioniert Entdeckung: Laufkundschaft mit Zeit, Geschenk-Mindset und
            Lust auf Neues. <span className="text-cream">Probieren schlägt scrollen.</span>
          </p>
          <p>
            Food, Drinks, Drogerie und Non-Food sind impuls- und geschenkaffin – ideal für
            kuratierte Marken, die online im Werbe-Rauschen untergehen.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { num: "41.000", label: "Frequenz / Tag" },
            { num: "Mo–Sa", label: "10–20 Uhr" },
            { num: "Alexa", label: "Alexanderplatz" },
          ].map((s) => (
            <div key={s.label} className="border-l-2 border-bronze pl-4">
              <p className="text-bronze text-2xl leading-none" style={{ fontFamily: "var(--font-bebas)" }}>
                {s.num}
              </p>
              <p className="text-stone text-xs font-mono mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warum F&B passt */}
      <div className="bg-green-dark border border-stone-dark/50 p-6 md:p-8">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-5">
          Warum dieser Ort für F&amp;B
        </p>
        <ul className="space-y-4">
          {[
            ["Geschenk-Mindset", "Wer am Alex unterwegs ist, sucht oft etwas Besonderes – Mitbringsel, Probierset, Entdeckung."],
            ["Tasting wirkt", "Food & Drinks lassen sich probieren. Wer probiert, kauft öfter – ein Vorteil, den kein Online-Shop hat."],
            ["Touristen + Locals", "Internationale Laufkundschaft trifft Stammpublikum – breite, ständig neue Zielgruppe."],
            ["Impuls + Frequenz", "Hohe Frequenz × niedrige Einstiegshürde (kleine Preise, kleine Mengen) = viele Erstkäufe."],
          ].map(([t, d]) => (
            <li key={t} className="flex items-start gap-3">
              <span className="text-bronze text-lg leading-none mt-0.5" aria-hidden="true">◆</span>
              <div>
                <p className="text-cream text-sm font-semibold">{t}</p>
                <p className="text-stone text-sm leading-relaxed">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
