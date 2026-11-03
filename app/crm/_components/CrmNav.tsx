"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Aufgaben ist neu im Testkaufhaus-Look, die übrigen Werkzeuge liegen noch in
   der alten Oberfläche und tragen dort ihre eigene Navigation. */
const LINKS = [
  { href: "/crm/aufgaben", label: "Aufgaben" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/pipeline/angebote", label: "Angebote" },
  { href: "/wareneingang", label: "Wareneingang" },
  { href: "/bestand", label: "Bestand" },
  { href: "/kasse", label: "Kasse" },
];

export default function CrmNav() {
  const pathname = usePathname();
  if (pathname === "/crm/login") return null;

  return (
    <nav className="crm-nav" aria-label="Werkzeuge">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="crm-nav__link"
          aria-current={pathname === l.href || pathname.startsWith(`${l.href}/`) ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
