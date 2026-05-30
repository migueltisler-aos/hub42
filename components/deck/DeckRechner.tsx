"use client";

import { useState, useMemo } from "react";
import { DEFAULTS, RATES, MIN_REGAL_CM, compute, type Assumptions } from "@/lib/deck-economics";

const TIERS = [
  { id: "basis",    label: "Basis",    rate: RATES.basis },
  { id: "standard", label: "Standard", rate: RATES.standard },
  { id: "premium",  label: "Premium",  rate: RATES.premium },
] as const;
type TierId = (typeof TIERS)[number]["id"];

/* ── Formatierung (de-DE) ───────────────────────────────── */
function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
const eur = (n: number) => `${fmt(n)} €`;

/* ── Hauptregler: frei eintippbar + Slider ──────────────── */
function Lever({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline gap-3">
        <label className="text-cream/60 text-xs font-mono uppercase tracking-widest">
          {label}
        </label>
        <div className="flex items-baseline gap-1 shrink-0">
          <input
            type="number"
            value={value}
            min={0}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 bg-transparent text-bronze font-mono text-lg font-semibold text-right outline-none border-b border-bronze/30 focus:border-bronze"
            aria-label={label}
          />
          <span className="text-bronze/60 font-mono text-sm">{unit}</span>
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute left-0 right-0 h-px bg-cream/10" />
        <div className="absolute left-0 h-px bg-bronze" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(value, max)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full cursor-pointer"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      <div className="flex justify-between text-cream/20 text-xs font-mono">
        <span>{min}</span>
        <span>{max}+</span>
      </div>
    </div>
  );
}

/* ── Aufschlüsselungs-Zeile (Wert oder editierbarer Input) ── */
function BreakRow({
  label,
  sub,
  value,
  editable,
  step = 0.01,
  unit = "€",
  money = true,
  onChange,
  strong,
}: {
  label: string;
  sub?: string;
  value: number;
  editable?: boolean;
  step?: number;
  unit?: string;
  money?: boolean;
  onChange?: (v: number) => void;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center gap-3 py-1.5 ${
        strong ? "border-t border-cream/20 mt-1 pt-2" : "border-b border-cream/5"
      }`}
    >
      <div className="min-w-0">
        <span
          className={`text-sm ${strong ? "text-cream font-semibold" : "text-cream/55"}`}
        >
          {label}
        </span>
        {sub && <span className="block text-[10px] text-cream/35 font-mono mt-0.5">{sub}</span>}
      </div>
      {editable && onChange ? (
        <div className="flex items-baseline gap-1 shrink-0">
          <input
            type="number"
            value={value}
            min={0}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 bg-transparent text-cream font-mono text-sm text-right outline-none border-b border-bronze/30 focus:border-bronze"
            aria-label={label}
          />
          <span className="text-cream/40 text-xs font-mono">{unit}</span>
        </div>
      ) : (
        <span
          className={`font-mono text-sm shrink-0 ${
            strong ? "text-bronze font-semibold" : "text-cream/70"
          }`}
        >
          {money ? eur(value) : `${fmt(value)} ${unit}`}
        </span>
      )}
    </div>
  );
}

export default function DeckRechner() {
  const [a, setA] = useState<Assumptions>({ ...DEFAULTS });
  const [tier, setTier] = useState<TierId>("basis");
  const [showDetail, setShowDetail] = useState(false);
  const set = <K extends keyof Assumptions>(key: K, v: number) =>
    setA((prev) => ({ ...prev, [key]: Number.isFinite(v) ? v : 0 }));
  const selectTier = (id: TierId) => {
    setTier(id);
    set("ratePerCm", TIERS.find((t) => t.id === id)!.rate);
  };

  const c = useMemo(() => compute(a), [a]);
  const cheaper = c.saving > 0;

  // Print-Szenarien: gleiche Annahmen, nur Sales variiert → immer konsistent
  const printScenarios = useMemo(
    () =>
      [
        { label: "Konservativ", sales: 10 },
        { label: "Realistisch", sales: 20 },
        { label: "Optimistisch", sales: 40 },
      ].map((s) => ({ ...s, saving: compute({ ...a, sales: s.sales }).saving })),
    [a],
  );

  return (
    <div>
      {/* ════════ BILDSCHIRM ════════ */}
      <div className="deck-screen-only space-y-8">
        {/* Dynamische Headline */}
        <div className="text-center max-w-2xl mx-auto">
          {c.saving > 0 ? (
            <p
              className="text-cream text-[clamp(1.4rem,3.5vw,2.4rem)] leading-tight tracking-wide"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Bei {a.sales} Verkäufen pro Monat sparst du{" "}
              <span className="text-bronze">{eur(c.saving)} pro Sale</span> gegenüber deinem
              eigenen Online-Shop.
            </p>
          ) : (
            <p
              className="text-cream text-[clamp(1.3rem,3vw,2rem)] leading-tight tracking-wide"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Bei diesen Annahmen ist der eigene Online-Shop günstiger — passe Preis, Menge oder
              Kosten an.
            </p>
          )}
        </div>

        {/* Hauptregler */}
        <div className="bg-cream/5 border border-cream/10 p-6 md:p-8 space-y-8">
          <Lever
            label="Verkaufspreis / Artikel"
            value={a.vk}
            min={3}
            max={150}
            step={0.5}
            unit="€"
            onChange={(v) => set("vk", v)}
          />
          <Lever
            label="Sales / Monat"
            value={a.sales}
            min={1}
            max={200}
            step={1}
            unit="Stk."
            onChange={(v) => set("sales", v)}
          />
          <Lever
            label="Online-Marketing / CAC pro Sale"
            value={a.cac}
            min={0}
            max={60}
            step={1}
            unit="€"
            onChange={(v) => set("cac", v)}
          />

          {/* Ebene-Toggle */}
          <div>
            <p className="text-cream/60 text-xs font-mono uppercase tracking-widest mb-3">
              Regal-Ebene
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTier(t.id)}
                  aria-pressed={tier === t.id}
                  className={`py-3 px-2 text-xs font-mono tracking-wide border transition-colors text-center ${
                    tier === t.id
                      ? "bg-bronze text-green-dark border-bronze font-semibold"
                      : "bg-transparent text-cream/50 border-cream/20 hover:border-bronze/50 hover:text-cream/80"
                  }`}
                >
                  <span className="block text-[11px] font-semibold">{t.label}</span>
                  <span className="block mt-0.5 opacity-80">
                    {t.rate.toFixed(2).replace(".", ",")} €/cm
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Lever
            label="Slot-Breite"
            value={a.regalCm}
            min={MIN_REGAL_CM}
            max={100}
            step={1}
            unit="cm"
            onChange={(v) => set("regalCm", Math.max(MIN_REGAL_CM, v))}
          />

          {/* Detail-Toggle */}
          <div className="pt-2 border-t border-cream/10">
            <button
              type="button"
              onClick={() => setShowDetail((s) => !s)}
              aria-expanded={showDetail}
              className="flex items-center gap-2 text-cream/60 hover:text-bronze text-xs font-mono uppercase tracking-widest transition-colors"
            >
              <span className="inline-block w-4 text-bronze">{showDetail ? "−" : "+"}</span>
              Annahmen &amp; vollständige Aufschlüsselung
            </button>

            {showDetail && (
              <div className="mt-6 space-y-6">
                <p className="text-cream/45 text-xs leading-relaxed">
                  Jede Zeile ist editierbar. Du buchst einen Regalplatz – die Miete rechnet sich
                  aus dem{" "}
                  <span className="text-cream/70">Platzbedarf deines Produkts (Breite cm) × Rate (€/cm)</span>,
                  nicht pauschal.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-cream/10">
                  {/* Online-Shop */}
                  <div className="bg-green-dark p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-stone" />
                      <p className="text-cream/60 text-xs font-mono uppercase tracking-widest">
                        Eigener Online-Shop / Sale
                      </p>
                    </div>
                    <BreakRow label="Wareneingang / Stück" value={a.anlieferung} editable onChange={(v) => set("anlieferung", v)} />
                    <BreakRow label="Lagerung anteilig" value={a.lagerung} editable onChange={(v) => set("lagerung", v)} />
                    <BreakRow label="Ausgangsauftrag" value={a.ausgangsauftrag} editable onChange={(v) => set("ausgangsauftrag", v)} />
                    <BreakRow label="Pick" value={a.pick} editable onChange={(v) => set("pick", v)} />
                    <BreakRow label="DHL Label" value={a.dhl} editable onChange={(v) => set("dhl", v)} />
                    <BreakRow label={`Shopify Payments (${fmt(a.onlinePayPct, 1)} % + ${fmt(a.onlinePayFix)} €)`} value={c.onlinePayment} />
                    <BreakRow label="Shopify-Abo anteilig" sub={`${eur(a.shopMonthly)}/Mo ÷ ${a.sales} Sales`} value={c.shopPerSale} />
                    <BreakRow label="Marketing / CAC" sub="aus Hauptregler" value={a.cac} editable step={1} onChange={(v) => set("cac", v)} />
                    <BreakRow label="Summe / Sale" value={c.onlinePerSale} strong />
                    <div className="mt-4 pt-3 border-t border-cream/10">
                      <BreakRow label="Shopify-Abo / Monat" sub="Starter ~5 · Basic ~36 · Shopify ~105" value={a.shopMonthly} editable step={1} onChange={(v) => set("shopMonthly", v)} />
                    </div>
                  </div>

                  {/* Hub42 */}
                  <div className="bg-green-dark p-5 border border-bronze/15">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-bronze" />
                      <p className="text-bronze/70 text-xs font-mono uppercase tracking-widest">
                        Hub42 / Sale
                      </p>
                    </div>
                    <BreakRow label="Checkout-Fee" value={a.hubCheckout} editable onChange={(v) => set("hubCheckout", v)} />
                    <BreakRow label={`Payment (${fmt(a.hubPayPct, 2)} % + ${fmt(a.hubPayFix)} €)`} value={c.hubPayment} />
                    <BreakRow label="Slot-Miete anteilig" sub={`${eur(c.slotMonthly)}/Mo ÷ ${a.sales} Sales`} value={c.slotPerSale} />
                    <BreakRow label="Summe / Sale" value={c.hubPerSale} strong />
                    <div className="mt-4 pt-3 border-t border-cream/10 space-y-1">
                      <BreakRow label="Platzbedarf (Breite)" sub="F&B-Produkt ≈ 5 cm" value={a.regalCm} editable step={1} unit="cm" money={false} onChange={(v) => set("regalCm", v)} />
                      <BreakRow label="Rate" sub="Basis 11,80 · Standard 13,11 · Premium 16,39" value={a.ratePerCm} editable step={0.01} unit="€/cm" money={false} onChange={(v) => set("ratePerCm", v)} />
                      <BreakRow label="= Slot-Miete / Monat" value={c.slotMonthly} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live-Anzeige: Kosten/Sale */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-cream/10">
          <div className="bg-green-dark p-6 text-center">
            <p className="text-cream/40 text-xs font-mono uppercase tracking-widest mb-2">
              Kosten / Sale online
            </p>
            <p className="text-cream/70 text-4xl" style={{ fontFamily: "var(--font-bebas)" }}>
              {eur(c.onlinePerSale)}
            </p>
            <p className="text-cream/20 text-xs font-mono mt-1">DTC-Fulfillment + CAC</p>
          </div>

          <div className="bg-green-dark p-6 text-center border-x border-bronze/20 relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-bronze" />
            <p className="text-bronze text-xs font-mono uppercase tracking-widest mb-2">
              Kosten / Sale Hub42
            </p>
            <p className="text-bronze text-4xl" style={{ fontFamily: "var(--font-bebas)" }}>
              {eur(c.hubPerSale)}
            </p>
            <p className="text-bronze/40 text-xs font-mono mt-1">
              inkl. {eur(c.slotPerSale)} Slot-Anteil
            </p>
          </div>

          <div className="bg-green-dark p-6 text-center">
            <p className="text-cream/40 text-xs font-mono uppercase tracking-widest mb-2">
              Ersparnis / Sale
            </p>
            <p
              className="text-4xl"
              style={{ fontFamily: "var(--font-bebas)", color: cheaper ? "#6BA888" : "#d98a8a" }}
            >
              {c.saving >= 0 ? "+" : ""}
              {eur(c.saving)}
            </p>
            <p className="text-cream/20 text-xs font-mono mt-1">Hub42 vs. Online-Shop</p>
          </div>
        </div>

        {/* Großer Break-even-Indikator */}
        <div
          role="status"
          aria-live="polite"
          className={`p-6 md:p-8 border text-center ${
            cheaper ? "border-green-light/40 bg-green-mid/20" : "border-stone-dark/50 bg-cream/5"
          }`}
        >
          {c.saving > 0 ? (
            <p className="text-cream text-lg md:text-xl leading-snug">
              Das sind{" "}
              <span className="text-bronze text-3xl align-baseline" style={{ fontFamily: "var(--font-bebas)" }}>
                {eur(c.saving * a.sales)} mehr pro Monat
              </span>{" "}
              in deiner Kasse – allein aus den Vertriebskosten, bei {a.sales} Sales.
            </p>
          ) : (
            <p className="text-cream/70 text-base">
              Bei diesen Annahmen liegt dein eigener Online-Shop vorn — erhöhe Preis/Menge oder
              senke die Online-Kosten.
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-stone text-xs font-mono leading-relaxed border-t border-stone-dark pt-4">
          Discovery-Käufer, die später im Online-Shop wiederkaufen, sind hier{" "}
          <span className="text-cream/60">nicht</span> eingerechnet — das ist zusätzlicher Wert.
          Alle Werte und Formeln sind oben offengelegt; Defaults bewusst konservativ.
        </p>
      </div>

      {/* ════════ DRUCK-FALLBACK (dynamisch aus aktuellen Annahmen) ════════ */}
      <table className="deck-print-only w-full border-collapse text-sm">
        <caption
          className="text-left mb-3 text-base"
          style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.04em" }}
        >
          Kosten pro Sale: eigener Online-Shop vs. Hub42 (VK {eur(a.vk)}, CAC {eur(a.cac)})
        </caption>
        <thead>
          <tr style={{ borderBottom: "1.5pt solid #2A4A3C" }}>
            <th className="text-left py-2 pr-4 font-mono text-xs uppercase tracking-wider">Szenario</th>
            <th className="text-right py-2 px-4 font-mono text-xs uppercase tracking-wider">Sales / Monat</th>
            <th className="text-right py-2 pl-4 font-mono text-xs uppercase tracking-wider">Ersparnis / Sale</th>
          </tr>
        </thead>
        <tbody>
          {printScenarios.map((r) => (
            <tr key={r.label} style={{ borderBottom: "0.4pt solid #d8d4cc" }}>
              <td className="py-2 pr-4">{r.label}</td>
              <td className="py-2 px-4 text-right font-mono">{r.sales}</td>
              <td className="py-2 pl-4 text-right font-mono" style={{ color: "#2A6E4F" }}>
                {r.saving >= 0 ? "+" : ""}
                {eur(r.saving)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="deck-print-only mt-3 text-sm" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
        <strong>Hub42 ist ab dem ersten Sale günstiger als der eigene Online-Shop</strong> – und der Vorteil wächst spürbar mit dem Volumen.
      </p>
      <p className="deck-print-only mt-2 text-xs" style={{ color: "#7A6E62" }}>
        Discovery-Käufer mit späterem Online-Wiederkauf sind nicht eingerechnet — zusätzlicher
        Wert. Konservativ gerechnet.
      </p>
    </div>
  );
}
