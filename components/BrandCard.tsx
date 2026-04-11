"use client";

import { motion } from "framer-motion";
import type { Brand } from "@/lib/brands";

interface BrandCardProps {
  brand: Brand;
  variant?: "grid" | "carousel";
}

const TIER_LABEL_COLOR: Record<string, string> = {
  Juwel:            "var(--color-bronze)",
  "Platform Brand": "#6B9BD2",
  Anker:            "#7CB87C",
  Ikone:            "#E8A87C",
};

export default function BrandCard({ brand, variant = "grid" }: BrandCardProps) {
  const isCarousel = variant === "carousel";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group bg-green-mid border border-stone-dark hover:border-bronze/40 rounded-sm overflow-hidden shrink-0 ${
        isCarousel ? "w-56" : "w-full"
      }`}
    >
      {/* Logo placeholder – accentColor background with initials */}
      <div
        className="aspect-4/3 flex items-center justify-center relative overflow-hidden"
        style={{ background: `${brand.accentColor}18` }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at 50% 50%, ${brand.accentColor}, transparent 70%)` }}
        />
        <span
          className="relative z-10 text-4xl font-bold tracking-widest group-hover:scale-105 transition-transform duration-300"
          style={{ color: brand.accentColor, fontFamily: "var(--font-bebas)" }}
        >
          {brand.initials}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] tracking-widest font-mono text-stone uppercase">
            {brand.kategorie}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono"
            style={{
              color: TIER_LABEL_COLOR[brand.tier] ?? "var(--color-bronze)",
              background: `${TIER_LABEL_COLOR[brand.tier] ?? "var(--color-bronze)"}15`,
            }}
          >
            {brand.tier}
          </span>
        </div>

        <h3
          className="text-cream text-xl mb-0.5 group-hover:text-bronze transition-colors"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {brand.name}
        </h3>

        <p className="text-stone text-xs font-mono mb-2">{brand.herkunft}</p>

        <p className="text-stone text-sm leading-relaxed line-clamp-2">
          {brand.tagline}
        </p>
      </div>
    </motion.div>
  );
}
