"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const STORE_LINKS = [
  { href: "/rebranding#marken", label: "Die Marken" },
  { href: "/rebranding#erlebnis", label: "Das Erlebnis" },
  { href: "/rebranding#store", label: "Der Store" },
];

const MARKEN_LINKS = [
  { href: "/rebranding/marken#konditionen", label: "Konditionen" },
  { href: "/rebranding/marken#ablauf", label: "Ablauf" },
  { href: "/rebranding/marken#validierung", label: "Validierung" },
];

export default function FFNavbar({ variant }: { variant: "store" | "marken" }) {
  const [open, setOpen] = useState(false);
  const links = variant === "store" ? STORE_LINKS : MARKEN_LINKS;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/rebranding" className="flex flex-col leading-none" aria-label="Feedback Factory, Startseite">
            <span
              className="text-lg md:text-xl uppercase tracking-tight font-bold"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Feedback Factory
            </span>
            <span className="ff-eyebrow text-[10px] text-black/50 mt-0.5">
              Ein Store der Hub42 UG
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Hauptnavigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="ff-link text-sm tracking-wide">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            {variant === "store" ? (
              <Link
                href="/rebranding/marken"
                className="ff-btn inline-flex items-center px-5 py-2 text-sm font-semibold tracking-wide"
              >
                Für Marken
              </Link>
            ) : (
              <Link
                href="/rebranding"
                className="ff-btn inline-flex items-center px-5 py-2 text-sm font-semibold tracking-wide"
              >
                Zum Store
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-black">
          <nav className="flex flex-col px-4 py-6 gap-1" aria-label="Mobile Navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-3 border-b border-black/10"
              >
                <span className="ff-link text-base">{link.label}</span>
              </Link>
            ))}
            <Link
              href={variant === "store" ? "/rebranding/marken" : "/rebranding"}
              onClick={() => setOpen(false)}
              className="ff-btn mt-4 inline-flex justify-center items-center px-5 py-3 text-sm font-semibold tracking-wide"
            >
              {variant === "store" ? "Für Marken" : "Zum Store"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
