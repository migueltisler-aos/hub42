"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { SlotTier } from "@/lib/slots";

interface SlotCardProps {
  slot: SlotTier;
  index?: number;
}

export default function SlotCard({ slot, index = 0 }: SlotCardProps) {
  const isHero = slot.name === "Hero Wall";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative flex flex-col border rounded-sm p-6 ${
        slot.empfohlen
          ? "border-bronze bg-green-mid"
          : isHero
          ? "border-bronze/60 bg-green-mid"
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
        {isHero && (
          <span className="text-[10px] tracking-widest font-mono px-2 py-0.5 border border-bronze/40 text-bronze rounded-sm">
            TOP
          </span>
        )}
      </div>

      {/* Name */}
      <h3
        className="text-cream text-3xl tracking-widest mb-1"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {slot.name}
      </h3>

      {/* Price */}
      <div className="mb-1">
        <span className="text-bronze text-4xl font-bold font-mono">
          {slot.kostenMonat} €
        </span>
        <span className="text-stone text-sm ml-1">/Monat</span>
      </div>
      <p className="text-stone text-xs font-mono mb-1">
        = {slot.kostenTag.toFixed(2).replace(".", ",")} €/Tag
      </p>
      <p className="text-stone text-xs font-mono mb-6">
        {slot.anzahlSlots} Slots verfügbar
      </p>

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
          slot.empfohlen || isHero
            ? "bg-bronze text-green-dark hover:bg-bronze-light"
            : "border border-bronze/40 text-bronze hover:border-bronze"
        }`}
      >
        Slot anfragen →
      </Link>
    </motion.div>
  );
}
