"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/hersteller", label: "Für Hersteller" },
  { href: "/brands", label: "Unsere Brands" },
  { href: "/erlebnis", label: "Das Erlebnis" },
  { href: "/store", label: "Der Store" },
  { href: "/about", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const solid = !isHome || scrolled || open;

  const isHersteller = pathname === "/hersteller";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid ? "bg-green-dark border-b border-stone-dark/50" : "bg-transparent"
      }`}
      role="banner"
    >
      {/* Routing bar – only shown outside /hersteller */}
      {!isHersteller && (
        <div className="bg-bronze/10 border-b border-bronze/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end h-8">
              <Link
                href="/hersteller"
                className="text-bronze text-[11px] font-mono tracking-widest hover:text-bronze-light transition-colors"
              >
                Du bist Hersteller? → Hier entlang
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" aria-label="Hub42 – Startseite" className="flex flex-col leading-none">
            <span
              className="text-bronze text-2xl md:text-3xl tracking-widest hover:text-bronze-light transition-colors"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              HUB42
            </span>
            <span className="text-stone text-[10px] tracking-widest font-mono hidden sm:block">
              tryhub42.de
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Hauptnavigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide transition-colors ${
                  pathname === link.href
                    ? "text-bronze"
                    : "text-cream/70 hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA – Desktop */}
          <div className="hidden md:block">
            <Link
              href="/hersteller#slot-anfragen"
              className="inline-flex items-center px-5 py-2 bg-bronze text-green-dark text-sm font-semibold tracking-wide rounded-sm hover:bg-bronze-light transition-colors"
            >
              Slot anfragen
            </Link>
          </div>

          {/* Hamburger – Mobile */}
          <button
            className="md:hidden text-cream p-2 -mr-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-green-dark border-t border-stone-dark/50">
          <nav className="flex flex-col px-4 py-6 gap-1" aria-label="Mobile Navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-3 text-base border-b border-cream/5 transition-colors ${
                  pathname === link.href
                    ? "text-bronze"
                    : "text-cream/80 hover:text-cream"
                }`}
                style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: "1.4rem" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/hersteller#slot-anfragen"
              className="mt-4 inline-flex justify-center items-center px-5 py-3 bg-bronze text-green-dark text-sm font-semibold tracking-wide rounded-sm"
            >
              Slot anfragen
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
