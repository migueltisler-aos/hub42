"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { SlotTier } from "@/lib/slots";

interface SlotCardProps {
  slot: SlotTier;
  index?: number;
}

/* Seit 2026-10-30 ohne Preisblock: Preise und Pakete stehen nur auf
   testkaufhaus.de (Verweis auf /hersteller). */
export default function SlotCard({ slot, index = 0 }: SlotCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`@container relative flex flex-col border rounded-sm p-6 ${
        slot.empfohlen
          ? "border-bronze bg-green-mid"
          : "border-stone-dark bg-green-mid"
      }`}
    >
      {/* Badges */}
      <div className="flex items-center gap-2 mb-4">
        {slot.empfohlen && (
          <span className="text-[10px] tracking-widest font-mono px-2 py-0.5 bg-bronze text-green-dark rounded-sm">
            EMPFOHLEN
          </span>
        )}
      </div>

      {/* Name */}
      <h3
        className="text-cream text-[min(1.875rem,10cqi)] whitespace-nowrap tracking-wider mb-5"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {slot.name}
      </h3>

      {/* Divider */}
      <div className="w-full h-px bg-stone-dark mb-6" />

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-6">
        {slot.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-sm text-cream">
            <span className="text-bronze mt-0.5 shrink-0">✓</span>
            {h}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/kontakt"
        className={`block text-center py-3 rounded-sm text-sm font-semibold transition-colors ${
          slot.empfohlen
            ? "bg-bronze text-green-dark hover:bg-bronze-light"
            : "border border-bronze/40 text-bronze hover:border-bronze"
        }`}
      >
        Regalfläche anfragen →
      </Link>
    </motion.div>
  );
}
