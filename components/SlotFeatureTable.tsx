"use client";

import { motion } from "framer-motion";

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

const TIERS = [
  { key: "basis",        label: "Basis",        preis: "55 €" },
  { key: "standard",     label: "Standard",     preis: "89 €" },
  { key: "premium",      label: "Premium",      preis: "149 €", highlight: true },
  { key: "schaufenster", label: "Schaufenster", preis: "149 €" },
  { key: "hero",         label: "Hero Wall",    preis: "490 €" },
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
            {TIERS.map((t) => (
              <th
                key={t.key}
                className={`text-center p-4 font-mono text-xs tracking-widest uppercase border-b min-w-[100px] ${
                  t.highlight
                    ? "text-bronze border-bronze/40"
                    : "text-stone border-stone-dark"
                }`}
              >
                <span className="block">{t.label}</span>
                <span className={`block text-base font-semibold mt-0.5 ${t.highlight ? "text-bronze" : "text-cream"}`}>
                  {t.preis}
                </span>
              </th>
            ))}
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
      </table>
    </motion.div>
  );
}
