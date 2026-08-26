"use client";

/**
 * Registerreiter des Feedback-Studios.
 *
 * Ersetzt die fünf gleichgewichteten Textlinks, die vorher im Kopf der
 * Produktseite standen (und auf dem Handy umbrachen). Der aktive Reiter
 * unterbricht die Trennlinie, wie ein hochgezogenes Blatt im Ordner —
 * dieselbe Mechanik wie InternNav, nur eine Ebene tiefer.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Mail,
  Package,
  Printer,
  Ticket,
  SlidersHorizontal,
  BarChart3,
} from "lucide-react";

export interface StudioZaehler {
  produkte: number;
  fragensets: number;
  bewertungen: number;
  leads: number;
  offeneTickets: number;
}

export default function StudioNav({ zaehler }: { zaehler: StudioZaehler }) {
  const pathname = usePathname();

  const REITER = [
    { href: "/feedback/admin", label: "Produkte", icon: Package, zahl: zaehler.produkte },
    { href: "/feedback/admin/questions", label: "Fragensets", icon: ClipboardList, zahl: zaehler.fragensets },
    { href: "/feedback/admin/results", label: "Auswertung", icon: BarChart3, zahl: zaehler.bewertungen },
    { href: "/feedback/admin/print", label: "QR-Bogen", icon: Printer, zahl: null },
    { href: "/feedback/admin/settings", label: "Schwellen", icon: SlidersHorizontal, zahl: null },
    { href: "/feedback/admin/redeem", label: "Tickets", icon: Ticket, zahl: zaehler.offeneTickets },
    { href: "/feedback/leads", label: "Leads", icon: Mail, zahl: zaehler.leads },
  ];

  return (
    <div className="relative bg-green-muted/40 punch-holes">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pl-9 sm:pl-11">
        <p className="text-bronze/60 text-[10px] font-mono tracking-[0.3em] uppercase pt-3 pb-2">
          Feedback-Studio
        </p>
        <nav
          aria-label="Feedback-Studio"
          className="flex items-stretch gap-0.5 overflow-x-auto border-b hairline"
        >
          {REITER.map((r) => {
            // Produkte ist die Wurzel: sonst wäre der Reiter auf jeder
            // Unterseite mit-aktiv.
            const aktiv =
              r.href === "/feedback/admin"
                ? pathname === "/feedback/admin" || pathname.startsWith("/feedback/admin/products")
                : pathname === r.href || pathname.startsWith(`${r.href}/`);
            const Icon = r.icon;
            return (
              <Link
                key={r.href}
                href={r.href}
                data-aktiv={aktiv}
                className={`dossier-tab whitespace-nowrap flex items-center gap-1.5 px-3 py-2.5 text-xs transition-colors ${
                  aktiv ? "text-bronze" : "text-stone hover:text-cream"
                }`}
              >
                <Icon size={13} aria-hidden />
                {r.label}
                {r.zahl != null && r.zahl > 0 && (
                  <span
                    className={`font-mono tabular-nums text-[10px] ${
                      aktiv ? "text-bronze/70" : "text-stone/50"
                    }`}
                  >
                    {r.zahl}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
