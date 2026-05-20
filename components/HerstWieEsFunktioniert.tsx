"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const SCHRITTE = [
  {
    num: "01",
    titel: "Slot buchen",
    copy: "Regalfläche ab 55 €/Monat. Kein Listingvertrag, keine Vorauszahlung auf Kommission.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-bronze">
        <rect x="4" y="6" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="4" y1="11" x2="24" y2="11" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="3" x2="9" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="3" x2="19" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="15" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    num: "02",
    titel: "Ware liefern",
    copy: "Konsignation nach §383 HGB. Du behältst Preishoheit und Eigentumsrecht bis zum Verkauf.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-bronze">
        <path d="M4 10 L14 4 L24 10 L24 22 L4 22 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <polyline points="4,10 14,16 24,10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="14" y1="16" x2="14" y2="22" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: "03",
    titel: "Wir verkaufen",
    copy: "Zur deiner UVP — kein Aufschlag, kein Cent Handelsmarge. Tasting, Story-Fläche und QR inklusive.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-bronze">
        <circle cx="14" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 6 C14 6 17 9 17 12 C17 15 14 18 14 18 C14 18 11 15 11 12 C11 9 14 6 14 6Z" stroke="currentColor" strokeWidth="1.2" />
        <line x1="8" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.2" />
        <line x1="5" y1="22" x2="23" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "04",
    titel: "Daten & Abrechnung",
    copy: "Monatliche Abrechnung per Überweisung. Scan-Rate, Tasting-to-Buy, Wiederbuchung — alles in deinem Dashboard.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-bronze">
        <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <polyline points="8,18 12,12 16,15 21,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HerstWieEsFunktioniert() {
  return (
    <section className="bg-green-mid py-20 md:py-28 border-t border-stone-dark/50" aria-label="Wie es funktioniert">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
            Für Hersteller & Brands
          </p>
          <h2
            className="text-cream text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-widest"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Vier Schritte.
            <span className="text-bronze"> Volle Kontrolle.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-dark/20">
          {SCHRITTE.map((s, i) => (
            <motion.div
              key={s.num}
              className="bg-green-mid p-8 md:p-10 flex flex-col gap-5 hover:bg-green-dark transition-colors duration-300 group cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex items-start justify-between">
                {s.icon}
                <span
                  className="text-bronze/30 text-4xl leading-none"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {s.num}
                </span>
              </div>

              <div>
                <p
                  className="text-cream text-xl leading-tight mb-3"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {s.titel}
                </p>
                <p className="text-stone text-sm leading-relaxed">
                  {s.copy}
                </p>
              </div>

              <div className="w-6 h-px bg-bronze/40 mt-auto group-hover:w-12 transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/hersteller"
            className="inline-flex items-center justify-center px-8 py-4 bg-bronze text-green-dark font-semibold text-sm tracking-wide hover:bg-bronze-light transition-colors rounded-sm"
          >
            Slot anfragen →
          </Link>
          <Link
            href="/hersteller"
            className="inline-flex items-center gap-2 text-bronze text-sm font-mono hover:text-bronze-light transition-colors self-center"
          >
            Alle Details für Brands →
          </Link>
        </div>
      </div>
    </section>
  );
}
