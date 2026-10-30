"use client";

import { motion } from "framer-motion";
import { SLOTS } from "@/lib/slots";

type CellValue = true | false | string;

interface FeatureRow {
  label: string;
  basis: CellValue;
  augenhoehe: CellValue;
  greifhoehe: CellValue;
  schaufenster: CellValue;
}

const FEATURES: FeatureRow[] = [
  {
    label: "Regalfront im Alexa Berlin",
    basis: true, augenhoehe: true, greifhoehe: true, schaufenster: true,
  },
  {
    label: "QR-Code + Traverse-Karte",
    basis: true, augenhoehe: true, greifhoehe: true, schaufenster: true,
  },
  {
    label: "Monatliche Verkaufszahlen",
    basis: true, augenhoehe: true, greifhoehe: true, schaufenster: true,
  },
  {
    label: "Creator Playbook",
    basis: true, augenhoehe: true, greifhoehe: true, schaufenster: true,
  },
  {
    label: "Tasting Bar Integration",
    basis: false, augenhoehe: false, greifhoehe: true, schaufenster: false,
  },
  {
    label: "Promo-Tag (1× pro Quartal)",
    basis: false, augenhoehe: false, greifhoehe: true, schaufenster: false,
  },
  {
    label: "Sonderfläche",
    basis: false, augenhoehe: false, greifhoehe: false, schaufenster: "Ladenfront",
  },
];

const TIERS = [
  { key: "basis",        slotId: "basis",        label: "Basis" },
  { key: "augenhoehe",   slotId: "augenhoehe",   label: "Augenhöhe" },
  { key: "greifhoehe",   slotId: "greifhoehe",   label: "Greifhöhe garantiert" },
  { key: "schaufenster", slotId: "schaufenster", label: "Schaufenster" },
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
            {/* Seit 2026-10-30 ohne Preise im Kopf; hervorgehoben bleibt die
                empfohlene Position (Greifhöhe garantiert). */}
            {TIERS.map((t) => (
              <th
                key={t.key}
                className={`text-center p-4 font-mono text-xs tracking-widest uppercase border-b min-w-[110px] ${
                  SLOTS.find((sl) => sl.id === t.slotId)?.empfohlen ? "text-bronze border-bronze/40" : "text-stone border-stone-dark"
                }`}
              >
                {t.label}
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
              <td className="p-4 text-center"><Cell value={row.augenhoehe} /></td>
              <td className="p-4 text-center"><Cell value={row.greifhoehe} highlight /></td>
              <td className="p-4 text-center"><Cell value={row.schaufenster} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
