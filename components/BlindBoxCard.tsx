"use client";

import { motion } from "framer-motion";

interface BlindBoxCardProps {
  name: string;
  preis: string;
  kategorie: string;
  beschreibung: string;
  index?: number;
}

export default function BlindBoxCard({
  name,
  preis,
  kategorie,
  beschreibung,
  index = 0,
}: BlindBoxCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group bg-green-dark border border-stone-dark hover:border-bronze/40 rounded-sm overflow-hidden"
    >
      {/* Box visual */}
      <div className="aspect-square bg-green-mid flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-dark/60 to-green-dark" />
        {/* Sealed X */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-bronze/30 rounded-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-bronze/40 text-3xl font-bold">?</span>
            </div>
          </div>
          <span className="text-bronze/60 text-[10px] font-mono tracking-widest">SEALED</span>
        </div>
        {/* Corner decoration */}
        <div className="absolute top-3 right-3 w-6 h-6 border border-bronze/20 rounded-sm group-hover:border-bronze/50 transition-colors" />
      </div>

      <div className="p-4">
        <p className="text-stone text-xs font-mono uppercase tracking-widest mb-1">
          {kategorie}
        </p>
        <h3
          className="text-cream text-xl mb-1 group-hover:text-bronze transition-colors"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {name}
        </h3>
        <p className="text-stone text-sm mb-3">{beschreibung}</p>
        <p className="text-bronze font-mono font-bold">{preis}</p>
      </div>
    </motion.div>
  );
}
