"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/pipeline/analytics", label: "Analytics" },
  { href: "/wareneingang", label: "Wareneingang" },
  { href: "/bestand", label: "Bestand" },
  { href: "/feedback/admin", label: "Feedback-Studio" },
];

export default function InternNav() {
  const pathname = usePathname();

  const aktiverHref = LINKS.filter(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`)
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="border-b border-stone-dark bg-green-mid/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
        {LINKS.map((l) => {
          // Genau ein aktiver Tab: der längste passende Treffer gewinnt.
          // Sonst wäre auf /pipeline/analytics auch "Pipeline" markiert, weil
          // dessen Pfad ein Präfix davon ist.
          const aktiv = l.href === aktiverHref;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap px-4 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors ${
                aktiv
                  ? "border-bronze text-bronze"
                  : "border-transparent text-stone hover:text-cream hover:border-stone-dark"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
