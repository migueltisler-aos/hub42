"use client";

// Zählen im Laden, am Handy. Ein Tipp = eine Person. Zahlen springen sofort
// (optimistisch); scheitert das Speichern, wird zurückgedreht und gemeldet.
import { useState, useTransition } from "react";
import type { HeuteStand, MarkeImRegal, ZaehlArt } from "@/lib/zaehlung";
import { rueckgaengigAktion, zaehlAktion } from "./actions";

export default function Zaehler({ marken, start }: { marken: MarkeImRegal[]; start: HeuteStand }) {
  const [stand, setStand] = useState(start);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [suche, setSuche] = useState("");
  const [, startTransition] = useTransition();

  const aendere = (art: ZaehlArt, brandId: string | null, d: number) =>
    setStand((s) => {
      if (art === "besucher") return { ...s, besucher: Math.max(0, s.besucher + d) };
      const m = s.jeMarke[brandId!] ?? { regal: 0, gekostet: 0 };
      const neu = { ...m, [art]: Math.max(0, m[art as "regal" | "gekostet"] + d) };
      return { ...s, jeMarke: { ...s.jeMarke, [brandId!]: neu } };
    });

  const tippe = (art: ZaehlArt, brandId: string | null, name: string) => {
    aendere(art, brandId, +1);
    setMeldung(`+1 ${art === "besucher" ? "Besucher" : `${name}: ${art === "regal" ? "am Regal" : "gekostet"}`}`);
    if (navigator.vibrate) navigator.vibrate(15);
    startTransition(async () => {
      const r = await zaehlAktion(art, brandId);
      if (!r.ok) {
        aendere(art, brandId, -1);
        setMeldung(`Nicht gespeichert: ${r.meldung}`);
      }
    });
  };

  const zurueck = () =>
    startTransition(async () => {
      const r = await rueckgaengigAktion();
      if (!r) return setMeldung("Nichts zum Zurücknehmen (nur eigene Tipps der letzten 10 Minuten).");
      aendere(r.art, r.brand_id, -1);
      setMeldung("Letzter Tipp zurückgenommen.");
    });

  const liste = marken.filter((m) => m.name.toLowerCase().includes(suche.trim().toLowerCase()));
  const knopf = "min-h-14 px-3 rounded-sm text-sm font-semibold active:scale-[0.97] transition-transform";

  return (
    <div className="min-h-screen bg-green-dark pb-24">
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">Laden zählen · heute</p>

        <button
          type="button"
          onClick={() => tippe("besucher", null, "")}
          className="w-full min-h-24 mt-2 rounded-sm bg-bronze text-green-dark text-2xl font-bold active:scale-[0.98] transition-transform"
        >
          Besucher +1
          <span className="block text-sm font-mono font-normal mt-1">heute {stand.besucher}</span>
        </button>
        <p className="text-stone text-xs mt-2">Jede Person, die den Laden betritt. Gruppen: je Person einmal tippen.</p>

        <div className="mt-6 mb-3">
          <label htmlFor="marke-suche" className="sr-only">Marke suchen</label>
          <input
            id="marke-suche"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Marke suchen …"
            className="w-full min-h-11 bg-green-dark/70 border border-stone-dark text-cream text-sm px-3 py-2 focus:outline-none focus:border-bronze"
          />
        </div>

        <ul className="grid gap-2">
          {liste.map((m) => {
            const s = stand.jeMarke[m.id] ?? { regal: 0, gekostet: 0 };
            return (
              <li key={m.id} className="border border-stone-dark bg-green-mid/30 p-3">
                <div className="text-cream font-semibold mb-2">{m.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => tippe("regal", m.id, m.name)} className={`${knopf} border border-stone text-cream`}>
                    Am Regal +1 <span className="block font-mono font-normal text-xs text-stone">{s.regal}</span>
                  </button>
                  <button type="button" onClick={() => tippe("gekostet", m.id, m.name)} className={`${knopf} bg-cream/90 text-green-dark`}>
                    Gekostet +1 <span className="block font-mono font-normal text-xs">{s.gekostet}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-stone text-xs mt-4">
          „Am Regal“: jemand bleibt stehen und schaut sich die Marke an. „Gekostet“: jemand probiert. Gekauft zählt die Kasse.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-green-dark/95 border-t border-stone-dark">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={zurueck} className="min-h-11 px-4 border border-stone-dark text-cream text-sm">
            Rückgängig
          </button>
          <span role="status" className="text-stone text-sm truncate">{meldung ?? "Tippen zählt sofort."}</span>
        </div>
      </div>
    </div>
  );
}
