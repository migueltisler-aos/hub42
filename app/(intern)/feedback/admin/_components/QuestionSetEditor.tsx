"use client";

/**
 * Ein Fragenset als Ganzes bearbeiten.
 *
 * Vorher: ein globales Formular mit Set-Dropdown zum Anlegen, und an den
 * Fragen selbst gab es nur „entfernen“. Jetzt hängt jede Aktion dort, wo sie
 * hingehört — Frage hinzufügen im Set, bearbeiten/verschieben/löschen an der
 * Frage. Set umbenennen, duplizieren und löschen im Kopf.
 *
 * Das Löschen kann begründet scheitern (an der Frage hängen erhobene
 * Antworten, die CASCADE mitnehmen würde); die Begründung zeigt RowAction.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteQuestionAction,
  deleteQuestionSetAction,
  duplicateQuestionSetAction,
  moveQuestionAction,
} from "../actions";
import type { QuestionType } from "@/lib/feedback";
import { Card, Stamp } from "@/app/(intern)/_components/ui/surfaces";
import { Button } from "@/app/(intern)/_components/ui/form";
import QuestionForm, { type FrageEntwurf } from "./QuestionForm";
import QuestionSetForm from "./QuestionSetForm";
import RowAction from "./RowAction";

export interface FrageZeile extends FrageEntwurf {
  antworten: number;
}

export interface SetBlock {
  id: string;
  name: string;
  description: string | null;
  fragen: FrageZeile[];
  produkte: number;
}

const TYP_KURZ: Record<QuestionType, string> = {
  semantic_diff: "Gegensatzpaar",
  likert: "Zustimmung",
  text: "Freitext",
};

export default function QuestionSetEditor({ set }: { set: SetBlock }) {
  const [neueFrage, setNeueFrage] = useState(false);
  const [bearbeiteteFrage, setBearbeiteteFrage] = useState<string | null>(null);
  const [umbenennen, setUmbenennen] = useState(false);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-green-dark text-lg font-semibold leading-snug">{set.name}</h3>
          {set.description && <p className="text-stone-dark text-sm mt-0.5">{set.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="stamp-flat text-stone-dark border-stone-dark/40">
              {set.fragen.length} Frage{set.fragen.length === 1 ? "" : "n"}
            </span>
            {set.produkte > 0 ? (
              <span className="stamp-flat text-bronze-dark border-bronze-dark/40">
                in {set.produkte} Produkt{set.produkte === 1 ? "" : "en"}
              </span>
            ) : (
              <span className="stamp-flat text-amber-700 border-amber-700/50">
                keinem Produkt zugeordnet
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-1.5">
          <Button
            variante="ghost"
            klein
            icon={umbenennen ? X : Pencil}
            onClick={() => setUmbenennen((v) => !v)}
            className="!text-green-dark !border-green-dark/30 hover:!bg-green-dark/10"
          >
            {umbenennen ? "Schließen" : "Umbenennen"}
          </Button>
          <RowAction
            action={duplicateQuestionSetAction}
            felder={{ id: set.id }}
            variante="ghost"
            icon={Copy}
            title="Set mit allen Fragen kopieren"
            className="[&_button]:!text-green-dark [&_button]:!border-green-dark/30"
          >
            Duplizieren
          </RowAction>
          <RowAction
            action={deleteQuestionSetAction}
            felder={{ id: set.id }}
            bestaetigung="Set löschen?"
            variante="danger"
            icon={Trash2}
          >
            Löschen
          </RowAction>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {umbenennen && (
          <Aufklapp>
            <div className="mt-4 bg-green-dark rounded-sm p-4">
              <QuestionSetForm set={set} onFertig={() => setUmbenennen(false)} />
            </div>
          </Aufklapp>
        )}
      </AnimatePresence>

      {/* ── Fragen ── */}
      <div className="mt-4 pt-4 border-t border-stone-dark/20 space-y-2">
        {set.fragen.length === 0 && (
          <p className="text-stone-dark text-sm">
            Noch keine Frage in diesem Set. Ein Produkt mit diesem Set fragt bisher nur die
            hedonische Skala ab.
          </p>
        )}

        {set.fragen.map((q, i) => {
          const offen = bearbeiteteFrage === q.id;
          return (
            <div key={q.id} className="bg-sage rounded-sm">
              <div className="flex flex-wrap items-start gap-2 px-3 py-2.5">
                <span className="text-stone-dark/60 text-xs font-mono tabular-nums pt-0.5 w-5 shrink-0">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-green-dark text-sm leading-snug">
                    {q.type === "semantic_diff"
                      ? q.prompt
                        ? `${q.prompt}: ${q.label_left} ↔ ${q.label_right}`
                        : `${q.label_left} ↔ ${q.label_right}`
                      : q.prompt}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="stamp-flat text-stone-dark border-stone-dark/35">
                      {TYP_KURZ[q.type]}
                    </span>
                    {q.type !== "text" && q.scale_max != null && (
                      <span className="text-stone-dark/70 text-[10px] font-mono">
                        {q.scale_max} Stufen
                      </span>
                    )}
                    {q.antworten > 0 && (
                      <span className="text-stone-dark/70 text-[10px] font-mono">
                        {q.antworten} Antwort{q.antworten === 1 ? "" : "en"} erhoben
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-1 shrink-0">
                  {i > 0 && (
                    <RowAction
                      action={moveQuestionAction}
                      felder={{ id: q.id, richtung: "hoch" }}
                      variante="quiet"
                      icon={ArrowUp}
                      title="Nach oben"
                      className="[&_button]:!text-stone-dark [&_button]:hover:!text-green-dark"
                    >
                      <span className="sr-only">Nach oben</span>
                    </RowAction>
                  )}
                  {i < set.fragen.length - 1 && (
                    <RowAction
                      action={moveQuestionAction}
                      felder={{ id: q.id, richtung: "runter" }}
                      variante="quiet"
                      icon={ArrowDown}
                      title="Nach unten"
                      className="[&_button]:!text-stone-dark [&_button]:hover:!text-green-dark"
                    >
                      <span className="sr-only">Nach unten</span>
                    </RowAction>
                  )}
                  <Button
                    variante="quiet"
                    klein
                    icon={offen ? X : Pencil}
                    onClick={() => setBearbeiteteFrage(offen ? null : q.id)}
                    className="!text-stone-dark hover:!text-green-dark"
                  >
                    <span className="sr-only">{offen ? "Schließen" : "Bearbeiten"}</span>
                  </Button>
                  <RowAction
                    action={deleteQuestionAction}
                    felder={{ id: q.id }}
                    bestaetigung={q.antworten > 0 ? "Trotzdem versuchen?" : "Frage löschen?"}
                    variante="danger"
                    icon={Trash2}
                  >
                    <span className="sr-only">Löschen</span>
                  </RowAction>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {offen && (
                  <Aufklapp>
                    <div className="bg-green-dark rounded-sm p-4 m-2 mt-0">
                      <QuestionForm
                        questionSetId={set.id}
                        frage={q}
                        onFertig={() => setBearbeiteteFrage(null)}
                      />
                    </div>
                  </Aufklapp>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Frage hinzufügen ── */}
      <div className="mt-3">
        <Button
          variante="ghost"
          klein
          icon={neueFrage ? X : Plus}
          onClick={() => setNeueFrage((v) => !v)}
          className="!text-green-dark !border-green-dark/30 hover:!bg-green-dark/10"
        >
          {neueFrage ? "Abbrechen" : "Frage hinzufügen"}
        </Button>

        <AnimatePresence initial={false}>
          {neueFrage && (
            <Aufklapp>
              <div className="mt-3 bg-green-dark rounded-sm p-4">
                <QuestionForm questionSetId={set.id} onFertig={() => setNeueFrage(false)} />
              </div>
            </Aufklapp>
          )}
        </AnimatePresence>
      </div>

      {set.produkte === 0 && set.fragen.length > 0 && (
        <p className="text-stone-dark text-xs mt-3">
          <Stamp tone="stone" className="!text-amber-700 !border-amber-700/50 mr-1.5">
            Hinweis
          </Stamp>
          Dieses Set wird noch nicht gefragt — es muss einem Produkt zugeordnet werden.
        </p>
      )}
    </Card>
  );
}

/** Einheitliches Aufklappen für alle Inline-Formulare in dieser Karte. */
function Aufklapp({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
