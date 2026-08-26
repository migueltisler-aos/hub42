"use client";

/**
 * Produktliste des Studios.
 *
 * Vorher: zentrierte QR-Kacheln ohne Suche, ohne Bewertungszahl, ohne Weg zum
 * Bearbeiten. Jetzt Karteikarte pro Produkt — QR links, Daten rechts, Aktionen
 * unten — mit Suche, Store-Filter und Archiv-Umschalter. Bearbeiten klappt das
 * Formular in der Karte auf, statt auf eine Unterseite zu springen.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  Download,
  ExternalLink,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { archiveProductAction, deleteProductAction, restoreProductAction } from "../actions";
import { Card, EmptyState, Stamp } from "@/app/(intern)/_components/ui/surfaces";
import { Button, TextInput, Select } from "@/app/(intern)/_components/ui/form";
import ProductForm, { type ProduktEntwurf, type SetOption } from "./ProductForm";
import RowAction from "./RowAction";

export interface ProduktZeile extends ProduktEntwurf {
  archiviert: boolean;
  qr: string;
  targetUrl: string;
  setNames: string[];
  bewertungen: number;
  leads: number;
}

export default function ProductList({
  produkte,
  questionSets,
}: {
  produkte: ProduktZeile[];
  questionSets: SetOption[];
}) {
  const [suche, setSuche] = useState("");
  const [store, setStore] = useState("");
  const [zeigeArchiv, setZeigeArchiv] = useState(false);
  const [bearbeitet, setBearbeitet] = useState<string | null>(null);

  const stores = useMemo(
    () => [...new Set(produkte.map((p) => p.store).filter((s): s is string => Boolean(s)))].sort(),
    [produkte]
  );

  const gefiltert = produkte.filter((p) => {
    if (p.archiviert !== zeigeArchiv) return false;
    if (store && p.store !== store) return false;
    if (suche) {
      const heuhaufen = [p.name, p.brand, p.store, p.shelf_code, p.batch, ...p.setNames]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!heuhaufen.includes(suche.toLowerCase())) return false;
    }
    return true;
  });

  const archivAnzahl = produkte.filter((p) => p.archiviert).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/60 pointer-events-none"
            aria-hidden
          />
          <TextInput
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Produkt, Marke, Regalplatz, Charge …"
            aria-label="Produkte durchsuchen"
            className="pl-9"
          />
        </div>

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

        {archivAnzahl > 0 && (
          <Button
            variante={zeigeArchiv ? "primary" : "ghost"}
            icon={Archive}
            onClick={() => setZeigeArchiv((v) => !v)}
          >
            Archiv ({archivAnzahl})
          </Button>
        )}
      </div>

      <p className="text-stone text-xs font-mono mb-3">
        {gefiltert.length} {zeigeArchiv ? "archiviert" : "aktiv"}
        {(suche || store) && ` · gefiltert aus ${produkte.filter((p) => p.archiviert === zeigeArchiv).length}`}
      </p>

      {gefiltert.length === 0 ? (
        <EmptyState
          titel={
            zeigeArchiv
              ? "Nichts im Archiv."
              : suche || store
                ? "Kein Produkt passt zum Filter."
                : "Noch kein Produkt angelegt."
          }
          text={
            suche || store
              ? "Suchbegriff oder Store-Filter zurücksetzen."
              : zeigeArchiv
                ? undefined
                : "Ein Produkt anlegen erzeugt sofort den QR-Code für das Regal."
          }
          action={
            (suche || store) && (
              <Button
                variante="ghost"
                icon={X}
                onClick={() => {
                  setSuche("");
                  setStore("");
                }}
              >
                Filter zurücksetzen
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {gefiltert.map((p, i) => {
            const offen = bearbeitet === p.id;
            const kontext = [p.store, p.shelf_code, p.batch].filter(Boolean).join(" · ");
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.24) }}
              >
                <Card className={`p-4 ${p.archiviert ? "opacity-70" : ""}`}>
                  <div className="flex flex-wrap sm:flex-nowrap gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.qr}
                      alt={`QR-Code für ${p.name}`}
                      className="w-24 h-24 shrink-0 bg-white rounded-sm"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-green-dark font-semibold leading-snug">{p.name}</p>
                          {p.brand && <p className="text-stone-dark text-sm">{p.brand}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-stone-dark text-xs font-mono tabular-nums">
                            n = {p.bewertungen}
                          </span>
                          {p.leads > 0 && (
                            <span className="text-bronze-dark text-xs font-mono tabular-nums">
                              {p.leads} Lead{p.leads === 1 ? "" : "s"}
                            </span>
                          )}
                          {p.archiviert && (
                            <Stamp tone="stone" className="!text-stone-dark">
                              archiviert
                            </Stamp>
                          )}
                        </div>
                      </div>

                      <p className="text-stone-dark text-xs font-mono mt-1.5">
                        {kontext || "kein Kontext hinterlegt"}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {p.setNames.length > 0 ? (
                          p.setNames.map((n) => (
                            <span
                              key={n}
                              className="stamp-flat text-stone-dark border-stone-dark/40"
                            >
                              {n}
                            </span>
                          ))
                        ) : (
                          <span className="stamp-flat text-amber-700 border-amber-700/50">
                            nur Basis-Skala
                          </span>
                        )}
                        {p.price_enabled && (
                          <span className="stamp-flat text-bronze-dark border-bronze-dark/40">
                            Preisfrage
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1 mt-3 pt-3 border-t border-stone-dark/20">
                        <Button
                          variante="ghost"
                          klein
                          icon={offen ? X : Pencil}
                          onClick={() => setBearbeitet(offen ? null : p.id)}
                          className="!text-green-dark !border-green-dark/30 hover:!bg-green-dark/10"
                        >
                          {offen ? "Schließen" : "Bearbeiten"}
                        </Button>

                        <a
                          href={p.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 min-h-8 rounded-sm text-green-dark hover:bg-green-dark/10 transition-colors"
                        >
                          <ExternalLink size={13} /> Testen
                        </a>

                        <a
                          href={p.qr}
                          download={`qr-${dateiname(p.name)}.png`}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 min-h-8 rounded-sm text-green-dark hover:bg-green-dark/10 transition-colors"
                        >
                          <Download size={13} /> QR
                        </a>

                        <Link
                          href={`/feedback/admin/results#${p.id}`}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 min-h-8 rounded-sm text-green-dark hover:bg-green-dark/10 transition-colors"
                        >
                          <BarChart3 size={13} /> Auswertung
                        </Link>

                        <span className="grow" />

                        {p.archiviert ? (
                          <>
                            <RowAction
                              action={restoreProductAction}
                              felder={{ id: p.id }}
                              variante="ghost"
                              icon={ArchiveRestore}
                              className="[&_button]:!text-green-dark [&_button]:!border-green-dark/30"
                            >
                              Reaktivieren
                            </RowAction>
                            <RowAction
                              action={deleteProductAction}
                              felder={{ id: p.id }}
                              bestaetigung="Endgültig löschen?"
                              variante="danger"
                              icon={Trash2}
                            >
                              Löschen
                            </RowAction>
                          </>
                        ) : (
                          <RowAction
                            action={archiveProductAction}
                            felder={{ id: p.id }}
                            bestaetigung="Aus dem Store nehmen?"
                            variante="ghost"
                            icon={Archive}
                            title="Für Scouts nicht mehr sichtbar, Daten bleiben erhalten"
                            className="[&_button]:!text-stone-dark [&_button]:!border-stone-dark/40"
                          >
                            Archivieren
                          </RowAction>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {offen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {/* Dunkle Fläche im hellen Karteikasten: das Formular ist
                            Werkzeug, nicht Karteninhalt. */}
                        <div className="mt-4 bg-green-dark rounded-sm p-4 sm:p-5">
                          <ProductForm
                            produkt={p}
                            questionSets={questionSets}
                            onFertig={() => setBearbeitet(null)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function dateiname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
