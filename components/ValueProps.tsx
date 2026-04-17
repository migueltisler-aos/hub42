"use client";

import { motion } from "framer-motion";

const VALUES = [
  {
    number: "0%",
    label: "Handelsmarge",
    description:
      "Hersteller behalten ihren Verkaufspreis vollständig. Kein Cent geht an einen Händler. Dein Preis, deine Marge.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-bronze">
        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="22" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6" y1="26" x2="26" y2="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    number: "0%",
    label: "Informationsasymmetrie",
    description:
      "Monatliche Verkaufszahlen inklusive – tagesgenau mit Pro Analytics. Daten die kein Supermarkt je herausgibt.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-bronze">
        <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <polyline points="8,22 13,14 18,18 24,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "Try It",
    label: "Günstigster Markttest Berlins",
    description:
      "Ab 55 €/Monat in Berlins größtem Shoppingcenter. 41.000 Besucher täglich. Echter Markt, echter Test.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-bronze">
        <path d="M8 20 C8 20 10 12 16 12 C22 12 24 20 24 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="10" y="20" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16" y1="4" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function ValueProps() {
  return (
    <section className="bg-green-dark py-20 md:py-28" aria-label="Vorteile">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
            Das System
          </p>
          <h2
            className="text-cream text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-widest"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Dein Produkt.
            <span className="text-bronze"> Dein Preis. Deine Kunden.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-dark/30">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.label}
              className="group bg-green-dark p-10 md:p-12 flex flex-col gap-6 hover:bg-green-mid transition-colors duration-300 cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Icon */}
              <div>{v.icon}</div>

              {/* Number */}
              <div>
                <p
                  className="text-bronze text-[clamp(3rem,8vw,5rem)] leading-none"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {v.number}
                </p>
                <p className="text-cream text-lg font-medium mt-2">
                  {v.label}
                </p>
              </div>

              {/* Description */}
              <p className="text-stone text-sm leading-relaxed">
                {v.description}
              </p>

              {/* Bottom accent */}
              <div className="w-8 h-px bg-bronze mt-auto" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
