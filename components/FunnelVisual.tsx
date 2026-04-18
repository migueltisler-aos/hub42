"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Scenario = "konservativ" | "optimistisch";

interface Step {
  label: string;
  value: string;
  sub: string;
  width: string;
  conversion?: string;
}

const STEPS_KONSERVATIV: Step[] = [
  { label: "Alexa-Besucher",    value: "41.000", sub: "täglich",    width: "100%" },
  { label: "Store-Eingang",     value: "~820",   sub: "täglich",    width: "40%",  conversion: "2%" },
  { label: "Regalgang",         value: "~330",   sub: "täglich",    width: "16%",  conversion: "40%" },
  { label: "QR-Scan / Tasting", value: "~50",    sub: "täglich",    width: "6%",   conversion: "15%" },
  { label: "Kauf",              value: "~20",    sub: "täglich",    width: "2.5%", conversion: "40%" },
];

const STEPS_OPTIMISTISCH: Step[] = [
  { label: "Alexa-Besucher",    value: "41.000", sub: "täglich",    width: "100%" },
  { label: "Store-Eingang",     value: "~2.050", sub: "täglich",    width: "60%",  conversion: "5%" },
  { label: "Regalgang",         value: "~820",   sub: "täglich",    width: "24%",  conversion: "40%" },
  { label: "QR-Scan / Tasting", value: "~120",   sub: "täglich",    width: "9%",   conversion: "15%" },
  { label: "Kauf",              value: "~50",    sub: "täglich",    width: "3.5%", conversion: "40%" },
];

export default function FunnelVisual() {
  const [active, setActive] = useState<Scenario>("optimistisch");
  const steps = active === "konservativ" ? STEPS_KONSERVATIV : STEPS_OPTIMISTISCH;

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex gap-2 mb-8">
        {(["optimistisch", "konservativ"] as Scenario[]).map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-sm border transition-colors ${
              active === s
                ? "bg-bronze text-green-dark border-bronze font-semibold"
                : "bg-transparent text-stone border-stone-dark hover:border-bronze/50 hover:text-cream"
            }`}
          >
            {s === "optimistisch" ? "Optimistisch" : "Konservativ"}
          </button>
        ))}
      </div>

      {/* Funnel bars */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              {/* Step number */}
              <span className="text-stone text-xs font-mono w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Bar */}
              <div className="flex-1 flex items-center gap-3">
                <motion.div
                  className="h-10 bg-linear-to-r from-bronze to-bronze/60 rounded-sm flex items-center px-3"
                  initial={{ width: 0 }}
                  animate={{ width: step.width }}
                  transition={{ delay: i * 0.1 + 0.15, duration: 0.5, ease: "easeOut" }}
                  style={{ minWidth: "64px" }}
                >
                  <span className="text-green-dark text-sm font-bold font-mono whitespace-nowrap">
                    {step.value}
                  </span>
                </motion.div>
              </div>

              {/* Label + conversion */}
              <div className="w-44 shrink-0">
                <p className="text-cream text-sm">{step.label}</p>
                <p className="text-stone text-xs font-mono">
                  {step.conversion ? `→ ${step.conversion} Conversion` : step.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="text-stone text-xs font-mono mt-6 pt-4 border-t border-stone-dark leading-relaxed">
        Modellrechnung.{" "}
        <span className="text-cream/50">Konservativ</span> = kein aktives Personal, kein Tasting-Einsatz.{" "}
        <span className="text-bronze/70">Optimistisch</span> = Tasting-Bar aktiv besetzt, Schaufenster zieht Laufkundschaft.
        QR/Tasting-Conversion 15% in beiden Szenarien.
      </p>
    </div>
  );
}
