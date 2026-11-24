"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/marke", label: "Übersicht" },
  { href: "/marke/artikel", label: "Artikel" },
  { href: "/marke/kaeufer", label: "Käufer" },
  { href: "/marke/abrechnungen", label: "Abrechnungen" },
  { href: "/marke/vertrag", label: "Vertrag & Regal" },
  { href: "/marke/daten", label: "Stammdaten" },
  { href: "/marke/spielregeln", label: "Spielregeln" },
];

export default function MarkeNav() {
  const pfad = usePathname();
  const aktiv = LINKS.filter((l) => pfad === l.href || pfad.startsWith(`${l.href}/`)).sort(
    (a, b) => b.href.length - a.href.length
  )[0]?.href;
  return (
    <nav className="mp-nav" aria-label="Portal">
      <ul className="mp-spiegel">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={l.href === aktiv ? "page" : undefined}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
