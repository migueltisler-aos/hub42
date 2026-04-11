"use client";

import { motion } from "framer-motion";
import { COMPARISON_ROWS } from "@/lib/slots";

export default function ComparisonTable() {
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
            <th className="text-left p-4 text-stone font-mono text-xs tracking-widest uppercase border-b border-stone-dark">
              Kriterium
            </th>
            <th className="text-left p-4 text-stone font-mono text-xs tracking-widest uppercase border-b border-stone-dark">
              Rewe / LEH
            </th>
            <th className="text-left p-4 font-mono text-xs tracking-widest uppercase border-b border-bronze/40">
              <span className="text-bronze">Hub42</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-stone-dark/50 ${i % 2 === 0 ? "" : "bg-green-mid/40"}`}
            >
              <td className="p-4">
                <p className="text-cream font-medium">{row.label}</p>
                {row.note && (
                  <p className="text-stone text-xs font-mono mt-0.5">{row.note}</p>
                )}
              </td>
              <td className="p-4">
                {typeof row.rewe === "boolean" ? (
                  <span className="text-red-400/70 font-mono text-base">
                    {row.rewe ? "✓" : "✕"}
                  </span>
                ) : (
                  <span className="text-stone">{row.rewe}</span>
                )}
              </td>
              <td className="p-4">
                {typeof row.hub42 === "boolean" ? (
                  <span
                    className={`font-mono text-base font-semibold ${
                      row.hub42Highlight ? "text-green-400" : "text-cream"
                    }`}
                  >
                    {row.hub42 ? "✓" : "✕"}
                  </span>
                ) : (
                  <span
                    className={`font-semibold ${
                      row.hub42Highlight ? "text-green-400" : "text-cream"
                    }`}
                  >
                    {row.hub42}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
