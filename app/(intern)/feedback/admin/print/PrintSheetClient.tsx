"use client";

/**
 * Etikettenbogen mit Store-Filter, Größenwahl und Druckauslösung.
 *
 * Der Bogen selbst ist bewusst weiß/schwarz statt im Dossier-Dunkel: er wird
 * gedruckt, und dunkle Flächen kosten Toner und Lesbarkeit. Die Bedienleiste
 * darüber bleibt im Studio-Look und verschwindet im Druck (.print-hide).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { Button, Select } from "@/app/(intern)/_components/ui/form";
import { Eyebrow, Title } from "@/app/(intern)/_components/ui/surfaces";

export interface Etikett {
  id: string;
  name: string;
  brand: string | null;
  store: string | null;
  shelf: string | null;
  batch: string | null;
  qr: string;
}

const GROESSEN = {
  gross: { label: "Groß — 2 pro Reihe", spalten: "sm:grid-cols-2", qr: "w-40 h-40" },
  mittel: { label: "Mittel — 3 pro Reihe", spalten: "sm:grid-cols-3", qr: "w-28 h-28" },
  klein: { label: "Klein — 4 pro Reihe", spalten: "sm:grid-cols-4", qr: "w-24 h-24" },
} as const;

export default function PrintSheetClient({ etiketten }: { etiketten: Etikett[] }) {
  const [store, setStore] = useState("");
  const [groesse, setGroesse] = useState<keyof typeof GROESSEN>("mittel");

  const stores = useMemo(
    () => [...new Set(etiketten.map((e) => e.store).filter((s): s is string => Boolean(s)))].sort(),
    [etiketten]
  );

  const gefiltert = store ? etiketten.filter((e) => e.store === store) : etiketten;
  const g = GROESSEN[groesse];

  return (
    <div className="min-h-screen bg-green-dark print-sheet">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="print-hide mb-8">
          <Link
            href="/feedback/admin"
            className="text-stone text-xs hover:text-bronze transition-colors"
          >
            ← Produkte
          </Link>
          <div className="mt-3 mb-4">
            <Eyebrow>Register 04</Eyebrow>
            <Title>Etikettenbogen</Title>
            <p className="text-stone text-sm mt-2 max-w-2xl leading-relaxed">
              QR-Codes zum Ausschneiden und ans Regal kleben. Gestrichelte Linien sind
              Schnittkanten und werden mitgedruckt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button icon={Printer} onClick={() => window.print()}>
              Drucken / als PDF speichern
            </Button>

            {stores.length > 1 && (
              <Select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                aria-label="Nach Store filtern"
                className="w-auto min-w-40"
              >
                <option value="">Alle Stores</option>
                {stores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}

            <Select
              value={groesse}
              onChange={(e) => setGroesse(e.target.value as keyof typeof GROESSEN)}
              aria-label="Etikettengröße"
              className="w-auto min-w-48"
            >
              {Object.entries(GROESSEN).map(([key, wert]) => (
                <option key={key} value={key}>
                  {wert.label}
                </option>
              ))}
            </Select>

            <span className="text-stone text-xs font-mono ml-1">
              {gefiltert.length} Etikett{gefiltert.length === 1 ? "" : "en"}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${g.spalten} gap-3`}>
          {gefiltert.map((e) => (
            <div
              key={e.id}
              className="print-label border border-dashed border-stone-dark/50 rounded-sm bg-sage-warm p-4 flex flex-col items-center text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.qr}
                alt={`QR-Code für ${e.name}`}
                className={`${g.qr} bg-white rounded-sm`}
              />
              <p className="text-green-dark font-semibold text-sm leading-snug mt-2.5">{e.name}</p>
              {e.brand && <p className="text-stone-dark text-xs">{e.brand}</p>}
              {(e.shelf || e.batch) && (
                <p className="text-stone-dark text-[10px] font-mono mt-1">
                  {[e.shelf, e.batch].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="text-bronze-dark text-[10px] font-mono uppercase tracking-[0.16em] mt-2 pt-2 border-t border-stone-dark/25 w-full">
                Scannen &amp; bewerten
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
