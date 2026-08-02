"use client";

import { motion } from "framer-motion";
import TrustBadges from "@/components/TrustBadges";

const BLOCKS = [
  {
    eyebrow: "Standort",
    headline: "41.000",
    headlineSub: "Besucher täglich",
    lines: [
      "Pilot Alexa Berlin – Alexanderplatz",
      "Eröffnung Oktober 2026",
      "Berlins meistbesuchtes Shoppingcenter",
    ],
  },
  {
    eyebrow: "Pipeline",
    headline: "Early Bird",
    headlineSub: "ab 59 €/Monat",
    lines: [
      "LOIs in Verhandlung",
      "First-Mover-Slots verfügbar",
      "Keine Listungsgebühr, kein Mindestabsatz",
    ],
  },
  {
    eyebrow: "KPIs",
    headline: "4",
    headlineSub: "Frühindikatoren",
    lines: [
      "Belegungsrate",
      "QR-Scan-Rate pro Slot",
      "Tasting-to-Buy · Wiederbuchungsrate",
    ],
  },
];

export default function ProofSection() {
  return (
    <section className="bg-green-dark py-20 md:py-28 border-t border-stone-dark/50" aria-label="Proof">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
            Warum jetzt
          </p>
          <h2
            className="text-cream text-[clamp(2rem,5vw,4.5rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Ein Pilot.
            <span className="text-bronze"> Echte Zahlen. Klare KPIs.</span>
          </h2>
          <div className="flex justify-center">
            <TrustBadges />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-dark/20">
          {BLOCKS.map((b, i) => (
            <motion.div
              key={b.eyebrow}
              className="bg-green-dark p-10 md:p-12 flex flex-col gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <p className="text-bronze/60 text-xs font-mono tracking-[0.3em] uppercase">
                {b.eyebrow}
              </p>

              <div>
                <p
                  className="text-bronze text-[clamp(2.5rem,7vw,4.5rem)] leading-none"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {b.headline}
                </p>
                <p className="text-cream/60 text-sm font-mono mt-1">
                  {b.headlineSub}
                </p>
              </div>

              <ul className="space-y-2 mt-auto">
                {b.lines.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-stone text-sm leading-relaxed">
                    <span className="text-bronze/40 mt-1 shrink-0">—</span>
                    {line}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
