// Diagramme aus reinem CSS. Bewusst keine Chart-Library: im Repo existiert
// keine, und für Balken, Trichter und eine Tagesreihe braucht es auch keine.
// Server Components – kein "use client", nichts davon ist interaktiv.

/** Waagerechter Balken mit Label und Wert. Für Seiten, Quellen, Geräte, Länder. */
export function BalkenZeile({
  label,
  wert,
  anteilPct,
  zusatz,
  mono = false,
}: {
  label: string;
  wert: string | number;
  anteilPct: number;
  zusatz?: string;
  mono?: boolean;
}) {
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span
          className={`text-cream text-xs truncate ${mono ? "font-mono" : ""}`}
          title={label}
        >
          {label}
        </span>
        <span className="text-stone text-xs font-mono tabular-nums shrink-0">
          {wert}
          {zusatz && <span className="text-stone/50 ml-1.5">{zusatz}</span>}
        </span>
      </div>
      <div className="h-1 bg-stone-dark/40 rounded-sm overflow-hidden">
        <div
          className="h-full bg-bronze/70"
          style={{ width: `${Math.max(anteilPct, wert === 0 ? 0 : 1.5)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Tagesreihe als senkrechte Balken.
 *
 * Tage ohne Besucher bleiben als flacher Strich stehen – eine Lücke im
 * Diagramm würde aussehen wie fehlende Daten, nicht wie fehlende Besucher.
 */
export function TagesBalken({
  tage,
}: {
  tage: Array<{ tag: string; aufrufe: number; besucher: number }>;
}) {
  const max = Math.max(1, ...tage.map((t) => t.aufrufe));

  return (
    <div>
      <div className="flex items-end gap-[2px] h-28">
        {tage.map((t) => {
          const hoehe = t.aufrufe === 0 ? 2 : Math.max(4, (t.aufrufe / max) * 100);
          return (
            <div
              key={t.tag}
              className="flex-1 min-w-0 flex flex-col justify-end h-full group relative"
              title={`${t.tag}: ${t.aufrufe} Aufrufe, ${t.besucher} Besucher`}
            >
              <div
                className={`w-full rounded-t-sm transition-colors ${
                  t.aufrufe === 0 ? "bg-stone-dark/50" : "bg-bronze/60 group-hover:bg-bronze"
                }`}
                style={{ height: `${hoehe}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-stone/50 text-[10px] font-mono">
        <span>{tage[0]?.tag.slice(5)}</span>
        <span>{tage[tage.length - 1]?.tag.slice(5)}</span>
      </div>
    </div>
  );
}

/**
 * Trichter. Zeigt zu jeder Stufe den Anteil an der VORHERIGEN Stufe, nicht an
 * der ersten – der Absprung passiert zwischen zwei Schritten, und genau dort
 * soll man ihn ablesen können.
 */
export function Trichter({
  stufen,
}: {
  stufen: Array<{ label: string; sessions: number; hinweis: string }>;
}) {
  const start = Math.max(1, stufen[0]?.sessions ?? 1);

  return (
    <div className="space-y-2.5">
      {stufen.map((s, i) => {
        const vorher = i > 0 ? stufen[i - 1].sessions : null;
        const anteilVorher =
          vorher && vorher > 0 ? Math.round((s.sessions / vorher) * 100) : null;

        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-cream text-xs">
                {s.label}
                <span className="text-stone/40 ml-2 text-[11px]">{s.hinweis}</span>
              </span>
              <span className="text-stone text-xs font-mono tabular-nums shrink-0">
                {s.sessions}
                {anteilVorher !== null && (
                  <span
                    className={`ml-2 ${anteilVorher < 25 ? "text-red-400/70" : "text-stone/50"}`}
                  >
                    {anteilVorher}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 bg-stone-dark/40 rounded-sm overflow-hidden">
              <div
                className="h-full bg-bronze/70"
                style={{ width: `${Math.max((s.sessions / start) * 100, s.sessions === 0 ? 0 : 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
