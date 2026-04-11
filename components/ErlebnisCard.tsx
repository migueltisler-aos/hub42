"use client";

import { motion } from "framer-motion";
import type { Erlebnis } from "@/lib/erlebnisse";

interface ErlebnisCardProps {
  erlebnis: Erlebnis;
  index?: number;
}

export default function ErlebnisCard({ erlebnis, index = 0 }: ErlebnisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group bg-green-mid border border-stone-dark hover:border-bronze/40 rounded-sm p-6 flex flex-col gap-3 transition-colors cursor-default"
    >
      {/* Icon */}
      <span className="text-3xl" role="img" aria-hidden="true">
        {erlebnis.icon}
      </span>

      {/* Title */}
      <h3
        className="text-bronze text-2xl tracking-widest group-hover:text-cream transition-colors"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {erlebnis.titel}
      </h3>

      {/* Short desc */}
      <p className="text-stone text-xs tracking-widest font-mono uppercase">
        {erlebnis.kurzBeschreibung}
      </p>

      {/* Full desc */}
      <p className="text-cream text-sm leading-relaxed">
        {erlebnis.vollBeschreibung}
      </p>

      {/* Steps */}
      {erlebnis.schritte && (
        <ol className="mt-1 space-y-1">
          {erlebnis.schritte.map((schritt, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-stone font-mono">
              <span className="text-bronze shrink-0">{String(i + 1).padStart(2, "0")}</span>
              {schritt}
            </li>
          ))}
        </ol>
      )}

      {/* Highlight */}
      {erlebnis.highlight && (
        <p className="mt-auto pt-3 border-t border-stone-dark text-bronze text-xs italic">
          "{erlebnis.highlight}"
        </p>
      )}

      {/* Kosten */}
      {erlebnis.kosten && (
        <p className="text-stone text-xs font-mono">Kosten: {erlebnis.kosten}</p>
      )}
    </motion.div>
  );
}
