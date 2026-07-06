"use client";

import Image from "next/image";
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
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className={`group flex flex-col bg-green-mid border border-stone-dark hover:border-bronze/40 rounded-sm overflow-hidden shrink-0 ${
        isCarousel ? "w-56" : "w-full"
      }`}
    >
      {/* Produktbild – Akzent-Verlauf + echtes Foto + Sorten-Pills */}
      <div className="relative aspect-square overflow-hidden">
        {/* lebendiger Farbverlauf */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 25%, ${brand.accentColor}40, ${brand.accentColor}12 55%, transparent 80%)`,
          }}
        />

        {brand.bild ? (
          <Image
            src={brand.bild}
            alt={`${brand.produktName} – ${brand.name}`}
            fill
            sizes={isCarousel ? "224px" : "(max-width: 640px) 50vw, 25vw"}
            className={`transition-transform duration-300 group-hover:scale-[1.06] ${
              brand.bildFit === "cover"
                ? "object-cover"
                : "object-contain p-5 drop-shadow-xl"
            }`}
          />
        ) : (
          <span
            className="absolute inset-0 flex items-center justify-center text-5xl font-bold tracking-widest"
            style={{ color: brand.accentColor, fontFamily: "var(--font-bebas)" }}
          >
            {brand.initials}
          </span>
        )}

        {/* Sorten-Pills */}
        {brand.produkte.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 p-3 bg-linear-to-t from-green-mid via-green-mid/70 to-transparent pt-8">
            {brand.produkte.slice(0, 3).map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-green-dark/80 border border-stone-dark px-2 py-0.5 text-[10px] font-mono text-cream backdrop-blur-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: brand.accentColor }}
                />
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Produkt-Info */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[10px] tracking-widest font-mono text-stone uppercase">
            {brand.kategorie} · {brand.herkunft}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono shrink-0"
            style={{
              color: TIER_LABEL_COLOR[brand.tier] ?? "var(--color-bronze)",
              background: `${TIER_LABEL_COLOR[brand.tier] ?? "var(--color-bronze)"}15`,
            }}
          >
            {brand.tier}
          </span>
        </div>

        <h3
          className="text-cream text-2xl leading-none group-hover:text-bronze transition-colors"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {brand.produktName}
        </h3>

        <p className="text-stone/70 text-[11px] font-mono mt-1 mb-2">
          von <span className="text-stone">{brand.name}</span>
        </p>

        <p className="text-stone text-sm leading-relaxed line-clamp-2 mt-auto">
          {brand.tagline}
        </p>
      </div>
    </motion.div>
  );
}
