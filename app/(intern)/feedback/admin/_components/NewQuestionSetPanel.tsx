"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/app/(intern)/_components/ui/form";
import { Panel } from "@/app/(intern)/_components/ui/surfaces";
import QuestionSetForm from "./QuestionSetForm";

export default function NewQuestionSetPanel({
  offenBeimStart = false,
}: {
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
        {offen ? "Abbrechen" : "Neues Fragenset"}
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
                title="Neues Fragenset"
                nummer="01"
                hinweis="Erst das Set anlegen, dann darin die Fragen — so bleibt der Baustein wiederverwendbar."
              >
                <QuestionSetForm onFertig={() => setOffen(false)} />
              </Panel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
