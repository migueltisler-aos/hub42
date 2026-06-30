"use client";

import { useState, useMemo } from "react";
import { RATES, SCHAUFENSTER_MONAT } from "@/lib/deck-economics";

const POSITIONEN = [
  { id: "basis",        label: "Basis",                ratePerCm: RATES.basis,      fixedMonat: null               },
  { id: "augenhoehe",   label: "Augenhöhe",            ratePerCm: RATES.augenhoehe, fixedMonat: null               },
  { id: "greifhoehe",   label: "Greifhöhe garantiert", ratePerCm: RATES.greifhoehe, fixedMonat: null               },
  { id: "schaufenster", label: "Schaufenster",         ratePerCm: null,             fixedMonat: SCHAUFENSTER_MONAT  },
] as const;

type PositionId = (typeof POSITIONEN)[number]["id"];

function fmt(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <label className="text-cream/60 text-xs font-mono uppercase tracking-widest">
          {label}
        </label>
        <span className="text-bronze font-mono text-lg font-semibold">{display}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute left-0 right-0 h-px bg-cream/10" />
        <div className="absolute left-0 h-px bg-bronze" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full cursor-pointer"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
      <div className="flex justify-between text-cream/20 text-xs font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function HerstellerRechner() {
  const [uvp,      setUvp]      = useState(39);
  const [marge,    setMarge]    = useState(38);
  const [listung,  setListung]  = useState(2);
  const [sales,    setSales]    = useState(50);
  const [cm,       setCm]       = useState(20);
  const [activePos, setActivePos] = useState<PositionId>("augenhoehe");

  const calc = useMemo(() => {
    const pos          = POSITIONEN.find((p) => p.id === activePos)!;
    const reweMargeEur = uvp * (marge / 100);
    const reweUnit     = uvp - reweMargeEur - listung;
    const reweMonthly  = reweUnit * sales;
    const checkoutFee  = 0.40;
    const regalkosten  = pos.fixedMonat != null ? pos.fixedMonat : cm * (pos.ratePerCm ?? 0);
    const regalkostenPerUnit = regalkosten / sales;
    const hubUnit      = uvp - regalkostenPerUnit - checkoutFee;
    const hubMonthly   = hubUnit * sales;
    const diff         = hubMonthly - reweMonthly;
    return { reweMargeEur, reweUnit, reweMonthly, regalkostenPerUnit, hubUnit, hubMonthly, diff, regalkosten, checkoutFee };
  }, [uvp, marge, listung, sales, cm, activePos]);

  const winner: "hub" | "rewe" | "equal" =
    calc.diff > 0.01 ? "hub" : calc.diff < -0.01 ? "rewe" : "equal";

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="bg-cream/5 border border-cream/10 p-6 md:p-8 space-y-8">
        <Slider label="Endkundenpreis (UVP)" value={uvp} min={5} max={150} step={1}
          display={`${fmt(uvp)} €`} onChange={setUvp} />
        <Slider label="Handelsmarge LEH" value={marge} min={20} max={60} step={1}
          display={`${marge} %`} onChange={setMarge} />
        <Slider label="Listungsgebühr LEH (pro Stück)" value={listung} min={0} max={20} step={0.5}
          display={`${fmt(listung)} €`} onChange={setListung} />
        <Slider label="Verkäufe / Monat bei Hub42" value={sales} min={5} max={200} step={1}
          display={`${sales} Stk.`} onChange={setSales} />

        {/* Position selector */}
        <div>
          <p className="text-cream/60 text-xs font-mono uppercase tracking-widest mb-3">Regalposition</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POSITIONEN.map((pos) => (
              <button
                key={pos.id}
                onClick={() => setActivePos(pos.id)}
                aria-pressed={activePos === pos.id}
                className={`py-3 px-3 text-xs font-mono tracking-wide border transition-colors text-center ${
                  activePos === pos.id
                    ? "bg-bronze text-green-dark border-bronze font-semibold"
                    : "bg-transparent text-cream/50 border-cream/20 hover:border-bronze/50 hover:text-cream/80"
                }`}
              >
                <span className="block text-[11px] font-semibold">{pos.label}</span>
                <span className="block mt-0.5 opacity-70">
                  {pos.ratePerCm != null
                    ? `${pos.ratePerCm.toFixed(2).replace(".", ",")} €/cm`
                    : `${pos.fixedMonat} €/Mo fix`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* cm slider only for per-cm positions */}
        {POSITIONEN.find((p) => p.id === activePos)?.ratePerCm != null && (
          <Slider label="Regalfront (cm)" value={cm} min={5} max={270} step={1}
            display={`${cm} cm`} onChange={setCm} />
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-cream/10">
        <div className="bg-green-dark p-6 text-center">
          <p className="text-cream/40 text-xs font-mono uppercase tracking-widest mb-2">Erlös bei Rewe</p>
          <p className="text-cream/60 text-4xl font-mono" style={{ fontFamily: "var(--font-bebas)" }}>
            {fmt(calc.reweMonthly)} €
          </p>
          <p className="text-cream/20 text-xs font-mono mt-1">pro Monat</p>
        </div>

        <div className="bg-green-dark p-6 text-center border-x border-bronze/20 relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-bronze" />
          <p className="text-bronze text-xs font-mono uppercase tracking-widest mb-2">Erlös bei Hub42</p>
          <p className="text-bronze text-4xl font-mono" style={{ fontFamily: "var(--font-bebas)" }}>
            {fmt(calc.hubMonthly)} €
          </p>
          <p className="text-bronze/40 text-xs font-mono mt-1">pro Monat</p>
        </div>

        <div className="bg-green-dark p-6 text-center">
          <p className="text-cream/40 text-xs font-mono uppercase tracking-widest mb-2">Monatlicher Vorteil</p>
          <p
            className="text-4xl font-mono"
            style={{
              fontFamily: "var(--font-bebas)",
              color: winner === "hub" ? "#4ade80" : winner === "rewe" ? "#f87171" : "var(--color-cream)",
            }}
          >
            {calc.diff >= 0 ? "+" : ""}{fmt(calc.diff)} €
          </p>
          <p className="text-cream/20 text-xs font-mono mt-1">Hub42 vs. Rewe</p>
        </div>
      </div>

      {/* Detail comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-cream/10">
        {/* Rewe */}
        <div className="bg-green-dark p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-red-400/60" />
            <p className="text-cream/50 text-xs font-mono uppercase tracking-widest">Rewe / LEH</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Endkundenpreis",            value: `${fmt(uvp)} €` },
              { label: `Handelsmarge (${marge}%)`,   value: `– ${fmt(calc.reweMargeEur)} €` },
              { label: "Listungsgebühr/Stk.",         value: `– ${fmt(listung)} €` },
              { label: "Erlös / Einheit",             value: `${fmt(calc.reweUnit)} €`, highlight: true },
              { label: "Kundendaten",                 value: "Keine" },
              { label: "Preishoheit",                 value: "Nein" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-cream/5 text-sm font-mono">
                <span className="text-cream/40">{row.label}</span>
                <span className={
                  row.highlight ? "text-red-300 font-semibold" :
                  row.value === "Keine" || row.value === "Nein" ? "text-red-400/60" :
                  "text-cream/50"
                }>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hub42 */}
        <div className="bg-green-dark p-6 md:p-8 border border-bronze/10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-bronze" />
            <p className="text-bronze/70 text-xs font-mono uppercase tracking-widest">Hub42</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Endkundenpreis",      value: `${fmt(uvp)} €` },
              { label: "Handelsmarge",         value: "– 0,00 €" },
              { label: "Slot-Kosten/Stk.", value: `– ${fmt(calc.regalkostenPerUnit)} €` },
              { label: "Checkout-Fee/Artikel", value: `– ${fmt(calc.checkoutFee)} €` },
              { label: "Erlös / Einheit",      value: `${fmt(calc.hubUnit)} €`, highlight: true },
              { label: "Kundendaten",          value: "Monatlich inkl." },
              { label: "Preishoheit",          value: "Vollständig" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-cream/5 text-sm font-mono">
                <span className="text-cream/40">{row.label}</span>
                <span className={
                  row.highlight ? "text-bronze font-semibold" :
                  row.value === "Täglich vollständig" || row.value === "Vollständig" ? "text-green-400" :
                  "text-cream/60"
                }>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Winner box */}
      <div
        role="status"
        aria-live="polite"
        className={`p-6 md:p-8 border ${
          winner === "hub"  ? "border-green-500/30 bg-green-950/30" :
          winner === "rewe" ? "border-red-500/30 bg-red-950/30"     :
                              "border-cream/10 bg-cream/5"
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5" aria-hidden="true">
            {winner === "hub" ? "▲" : winner === "rewe" ? "▼" : "▬"}
          </span>
          <p className="text-sm leading-relaxed">
            {winner === "hub" && (
              <>
                <span className="text-green-400 font-semibold">
                  Hub42 bringt dir +{fmt(calc.diff)} € mehr pro Monat als der LEH
                </span>
                {" "}– bei vollem Preis und täglichen Kundendaten.
              </>
            )}
            {winner === "rewe" && (
              <>
                <span className="text-red-400 font-semibold">
                  Bei diesem Preis und dieser Verkaufsmenge liegt Rewe vorne.
                </span>
                {" "}Erhöhe den Preis oder die Verkaufszahl – dann dreht sich das Bild.
              </>
            )}
            {winner === "equal" && (
              <>
                <span className="text-cream/70 font-semibold">Gleichstand.</span>
                {" "}Jede weitere Einheit geht zu Hub42s Gunsten – plus täglich Kundendaten.
              </>
            )}
          </p>
        </div>
      </div>

      <p className="text-stone text-xs font-mono mt-4 text-center">
        Beispielwerte. Tatsächliche Verkaufszahlen hängen von Produkt, Preis und Saison ab.
      </p>
    </div>
  );
}
