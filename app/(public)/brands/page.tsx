"use client";

import { useState } from "react";
import Link from "next/link";
import BrandCard from "@/components/BrandCard";
import BlindBoxCard from "@/components/BlindBoxCard";
import { BRANDS, KATEGORIEN } from "@/lib/brands";

const BLIND_BOXES = [
  {
    name: "Entdeckerbox S",
    preis: "25 €",
    kategorie: "Überraschung",
    beschreibung: "3 kuratierte Produkte. Nur die Kategorie bekannt.",
  },
  {
    name: "Entdeckerbox M",
    preis: "39 €",
    kategorie: "Überraschung",
    beschreibung: "5 Produkte. Thematisch kuratiert. Nichts aus dem Supermarkt.",
  },
  {
    name: "Berliner Box",
    preis: "45 €",
    kategorie: "Berlin Special",
    beschreibung: "Ausschließlich Berliner Brands. Stadtgefühl inklusive.",
  },
  {
    name: "Saisonbox",
    preis: "49 €",
    kategorie: "Saisonal",
    beschreibung: "Wechselnde Zusammenstellung. Sommer, Winter, Feiertage.",
  },
];

export default function BrandsPage() {
  const [aktiveKategorie, setAktiveKategorie] = useState("alle");

  const gefilterteBrands =
    aktiveKategorie === "alle"
      ? BRANDS
      : BRANDS.filter((b) => b.kategorieSlug === aktiveKategorie);

  return (
    <>
      {/* Hero */}
      <section className="bg-green-dark pt-32 pb-20 border-b border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Partner-Brands
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Brands die du
            <br />
            <span className="text-bronze">noch nicht kennst.</span>
          </h1>
          <p className="text-stone text-sm max-w-lg">
            Kuratiert. Unabhängig. Direkt vom Hersteller. Jede Brand hier hat sich beworben –
            und wir haben ja gesagt.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="bg-green-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Kategorie-Filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {KATEGORIEN.map((k) => (
              <button
                key={k.slug}
                onClick={() => setAktiveKategorie(k.slug)}
                className={`px-4 py-2 rounded-sm text-sm font-mono transition-colors ${
                  aktiveKategorie === k.slug
                    ? "bg-bronze text-green-dark font-semibold"
                    : "border border-stone-dark text-stone hover:border-bronze/40 hover:text-cream"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Brand Grid */}
          {gefilterteBrands.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gefilterteBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-stone text-sm font-mono">
                Keine Brands in dieser Kategorie – noch nicht.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Blind Box Preview */}
      <section className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Blind Box
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-3"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Noch mehr Brands –
              <br />
              <span className="text-bronze">nur in der Blind Box entdeckbar.</span>
            </h2>
            <p className="text-stone text-sm max-w-lg">
              Einige Brands sind exklusiv in unseren Überraschungskisten. Kein Regal.
              Kein Schild. Nur Entdeckerfreude.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BLIND_BOXES.map((box, i) => (
              <BlindBoxCard key={box.name} {...box} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Deine Brand fehlt */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-cream text-[clamp(1.8rem,4vw,3.5rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Deine Brand fehlt hier?
          </h2>
          <p className="text-stone text-sm mb-8 max-w-md mx-auto">
            Wenn dein Produkt gut genug ist, sagen wir ja. Kein Bullshit-Prozess.
            Kein halbes Jahr warten.
          </p>
          <Link
            href="/hersteller"
            className="inline-block px-10 py-4 bg-bronze text-green-dark font-semibold rounded-sm hover:bg-[#9A7548] transition-colors text-sm tracking-wide"
          >
            Regalfläche anfragen →
          </Link>
        </div>
      </section>
    </>
  );
}
