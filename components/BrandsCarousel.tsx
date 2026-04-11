"use client";

import Link from "next/link";
import BrandCard from "./BrandCard";
import { BRANDS } from "@/lib/brands";

const duplicated = [...BRANDS, ...BRANDS];

export default function BrandsCarousel() {
  return (
    <section className="bg-green-dark py-20 overflow-hidden" aria-label="Partner Brands">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Unsere Brands
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-2"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Kuratiert. Direkt. Echt.
            </h2>
            <p className="text-stone text-sm">
              Jede Brand hat eine Geschichte. Jedes Produkt einen Grund.
            </p>
          </div>
          <Link
            href="/brands"
            className="hidden md:inline-flex items-center text-bronze text-sm font-mono hover:text-bronze-light transition-colors"
          >
            Alle Brands →
          </Link>
        </div>
      </div>

      {/* Marquee track */}
      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-green-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-green-dark to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 px-4 animate-marquee w-max">
          {duplicated.map((brand, i) => (
            <BrandCard
              key={`${brand.id}-${i}`}
              brand={brand}
              variant="carousel"
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:hidden">
        <Link
          href="/brands"
          className="inline-flex items-center text-bronze text-sm font-mono"
        >
          Alle Brands ansehen →
        </Link>
      </div>
    </section>
  );
}
