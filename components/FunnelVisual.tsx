"use client";

import { motion } from "framer-motion";

const STEPS = [
  { label: "Alexa-Besucher", value: "41.000", sub: "täglich", width: "100%" },
  { label: "Store-Eingang", value: "~2.000", sub: "täglich", width: "60%" },
  { label: "Regalgang", value: "~800", sub: "täglich", width: "40%" },
  { label: "QR-Scan / Tasting", value: "~300", sub: "täglich", width: "25%" },
  { label: "Kauf", value: "~120", sub: "täglich", width: "15%" },
];

export default function FunnelVisual() {
  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.5 }}
          className="flex items-center gap-4"
        >
          {/* Step number */}
          <span className="text-stone text-xs font-mono w-5 shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>

          {/* Bar */}
          <div className="flex-1 flex items-center gap-3">
            <motion.div
              className="h-10 bg-gradient-to-r from-bronze to-bronze/60 rounded-sm flex items-center px-3 relative overflow-hidden"
              initial={{ width: 0 }}
              whileInView={{ width: step.width }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 + 0.2, duration: 0.6, ease: "easeOut" }}
              style={{ minWidth: "80px" }}
            >
              <span className="text-green-dark text-sm font-bold font-mono whitespace-nowrap">
                {step.value}
              </span>
            </motion.div>
          </div>

          {/* Label */}
          <div className="w-40 shrink-0">
            <p className="text-cream text-sm">{step.label}</p>
            <p className="text-stone text-xs font-mono">{step.sub}</p>
          </div>
        </motion.div>
      ))}

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
        className="text-stone text-xs font-mono mt-4 pt-4 border-t border-stone-dark"
      >
        * Schätzwerte basierend auf Alexa Berlin Besucherzahlen 2024
      </motion.p>
    </div>
  );
}
