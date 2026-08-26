"use client";

/**
 * Anlege-Formular als aufklappbares Panel.
 *
 * Vorher stand das Formular dauerhaft über der Liste — bei sechs Produkten
 * scrollt man jedes Mal daran vorbei, obwohl man meist nur nachsehen will.
 * Daten zuerst, Werkzeug auf Abruf.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/app/(intern)/_components/ui/form";
import { Panel } from "@/app/(intern)/_components/ui/surfaces";
import ProductForm, { type SetOption } from "./ProductForm";

export default function NewProductPanel({
  questionSets,
  storeVorschlag,
  offenBeimStart = false,
}: {
  questionSets: SetOption[];
  storeVorschlag?: string;
  /** Beim ersten Produkt direkt offen — sonst sieht die Seite leer aus. */
  offenBeimStart?: boolean;
}) {
  const [offen, setOffen] = useState(offenBeimStart);

  return (
    <div className="mb-6">
      <Button
        variante={offen ? "quiet" : "ghost"}
        icon={offen ? X : Plus}
        onClick={() => setOffen((v) => !v)}
      >
        {offen ? "Abbrechen" : "Neues Produkt"}
      </Button>

      <AnimatePresence initial={false}>
        {offen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <Panel
                title="Neues Produkt"
                nummer="01"
                hinweis="Der QR-Code entsteht automatisch und liegt danach in der Liste — zum Herunterladen oder auf dem Etikettenbogen."
              >
                <ProductForm
                  questionSets={questionSets}
                  storeVorschlag={storeVorschlag}
                  onFertig={() => setOffen(false)}
                />
              </Panel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
