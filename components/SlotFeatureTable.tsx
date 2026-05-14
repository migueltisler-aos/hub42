"use client";

import { motion } from "framer-motion";
import { SLOTS } from "@/lib/slots";

type CellValue = true | false | string;

interface FeatureRow {
  label: string;
  basis: CellValue;
  standard: CellValue;
  premium: CellValue;
  schaufenster: CellValue;
  hero: CellValue;
}

const FEATURES: FeatureRow[] = [
  {
    label: "Regalplatz im Alexa Berlin",
    basis: true, standard: true, premium: true, schaufenster: true, hero: true,
  },
  {
    label: "QR-Code + Traverse-Karte",
    basis: true, standard: true, premium: true, schaufenster: true, hero: true,
  },
  {
    label: "Monatliche Verkaufszahlen",
    basis: true, standard: true, premium: true, schaufenster: true, hero: true,
  },
  {
    label: "Creator Playbook",
    basis: true, standard: true, premium: true, schaufenster: true, hero: true,
  },
  {
    label: "Tasting Bar Integration",
    basis: false, standard: false, premium: true, schaufenster: false, hero: true,
  },
  {
    label: "Promo-Tag (1× pro Quartal)",
    basis: false, standard: false, premium: true, schaufenster: false, hero: true,
  },
  {
    label: "Pro Analytics – 1 Monat gratis",
    basis: false, standard: false, premium: true, schaufenster: false, hero: true,
  },
  {
    label: "Sonderfläche",
    basis: false, standard: false, premium: false, schaufenster: "Schaufenster", hero: "Stirnseite",
  },
];

function slotPreis(id: string): { label: string; sub: string; highlight?: boolean } {
  const slot = SLOTS.find((s) => s.id === id);
  if (!slot) return { label: "—", sub: "" };
  if (slot.ratePerCm != null) {
    return {
      label: `${slot.ratePerCm.toFixed(2).replace(".", ",")} €/cm`,
      sub: "frei wählbar",
      highlight: slot.empfohlen,
    };
  }
  return {
    label: `${slot.kostenMonat} €/Mo`,
    sub: "Fixpreis",
    highlight: false,
  };
}

const TIERS = [
  { key: "basis",        slotId: "basis",        label: "Basis" },
  { key: "standard",     slotId: "standard",     label: "Standard" },
  { key: "premium",      slotId: "premium",      label: "Premium" },
  { key: "schaufenster", slotId: "schaufenster", label: "Schaufenster" },
  { key: "hero",         slotId: "hero-wall",    label: "Hero Wall" },
] as const;

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true)
    return (
      <span className={`font-mono font-semibold text-base ${highlight ? "text-bronze" : "text-green-400"}`}>
        ✓
      </span>
    );
  if (value === false)
    return <span className="text-stone/40 font-mono text-base">—</span>;
  return <span className="text-bronze text-xs font-mono">{value}</span>;
}

export default function SlotFeatureTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="overflow-x-auto"
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 text-stone font-mono text-xs tracking-widest uppercase border-b border-stone-dark min-w-[180px]">
              Feature
            </th>
            {TIERS.map((t) => {
              const p = slotPreis(t.slotId);
              return (
                <th
                  key={t.key}
                  className={`text-center p-4 font-mono text-xs tracking-widest uppercase border-b min-w-[110px] ${
                    p.highlight
                      ? "text-bronze border-bronze/40"
                      : "text-stone border-stone-dark"
                  }`}
                >
                  <span className="block">{t.label}</span>
                  <span className={`block text-sm font-semibold mt-0.5 ${p.highlight ? "text-bronze" : "text-cream"}`}>
                    {p.label}
                  </span>
                  <span className="block text-[10px] font-normal text-stone/50 mt-0.5">{p.sub}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-stone-dark/50 ${i % 2 === 0 ? "" : "bg-green-mid/40"}`}
            >
              <td className="p-4 text-cream font-medium">{row.label}</td>
              <td className="p-4 text-center"><Cell value={row.basis} /></td>
              <td className="p-4 text-center"><Cell value={row.standard} /></td>
              <td className="p-4 text-center"><Cell value={row.premium} highlight /></td>
              <td className="p-4 text-center"><Cell value={row.schaufenster} /></td>
              <td className="p-4 text-center"><Cell value={row.hero} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} className="px-4 py-3 text-stone/40 text-xs font-mono border-t border-stone-dark">
              Beispiel Regalbreite: 10 cm → Basis 72 €/Mo · Standard 90 €/Mo · Premium 108 €/Mo · Schaufenster &amp; Hero Wall: Fixpreis
            </td>
          </tr>
        </tfoot>
      </table>
    </motion.div>
  );
}
