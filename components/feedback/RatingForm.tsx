"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HEDONIC_FACES, type QuestionWithSet } from "@/lib/feedback";

function TapButton({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.82 }}
      animate={{
        scale: selected ? 1.12 : 1,
        boxShadow: selected ? "0 0 0 3px rgba(200,150,74,0.35)" : "0 0 0 0 rgba(200,150,74,0)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`flex-1 aspect-square flex items-center justify-center rounded-sm border transition-colors ${
        selected
          ? "bg-bronze border-bronze text-green-dark"
          : "bg-green-mid border-stone-dark text-cream hover:border-bronze/50"
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

type AnswerValue = number | string | null;

export default function RatingForm({
  productId,
  questions,
  priceEnabled,
  productStore,
  productShelf,
  productBatch,
  action,
}: {
  productId: string;
  questions: QuestionWithSet[];
  priceEnabled: boolean;
  productStore: string;
  productShelf: string;
  productBatch: string;
  action: (formData: FormData) => void;
}) {
  const [hedonic, setHedonic] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const requiredQuestions = questions.filter((q) => q.type !== "text");
  const complete =
    hedonic !== null && requiredQuestions.every((q) => answers[q.id] != null && answers[q.id] !== "");

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const showSetHeadingFor = questions.map(
    (q, i) => Boolean(q.set_name) && q.set_name !== questions[i - 1]?.set_name
  );

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="question_ids" value={questions.map((q) => q.id).join(",")} />
      <input type="hidden" name="product_store" value={productStore} />
      <input type="hidden" name="product_shelf" value={productShelf} />
      <input type="hidden" name="product_batch" value={productBatch} />
      <input type="hidden" name="hedonic" value={hedonic ?? ""} />
      {questions.map((q) => (
        <input key={q.id} type="hidden" name={`answer_${q.id}`} value={answers[q.id] ?? ""} />
      ))}

      <fieldset>
        <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
          Wie gefällt dir das Produkt insgesamt?
        </legend>
        <div className="flex justify-between gap-1">
          {HEDONIC_FACES.map((face, i) => {
            const v = i + 1;
            return (
              <TapButton key={v} selected={hedonic === v} onClick={() => setHedonic(v)}>
                <span className="text-xl">{face}</span>
              </TapButton>
            );
          })}
        </div>
        <div className="flex justify-between text-stone text-[10px] mt-1">
          <span>gefällt mir gar nicht</span>
          <span>gefällt mir extrem gut</span>
        </div>
      </fieldset>

      {questions.map((q, i) => {
        const showSetHeading = showSetHeadingFor[i];
        const scaleMax = q.scale_max ?? (q.type === "likert" ? 5 : 7);

        return (
          <div key={q.id}>
            {showSetHeading && (
              <p className="text-bronze/70 text-[10px] font-mono uppercase tracking-widest mb-2">
                {q.set_name}
              </p>
            )}

            {q.type === "semantic_diff" && (
              <fieldset>
                <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
                  {q.label_left} ↔ {q.label_right}
                </legend>
                <div className="flex justify-between gap-1">
                  {Array.from({ length: scaleMax }, (_, i) => i + 1).map((v) => (
                    <TapButton key={v} selected={answers[q.id] === v} onClick={() => setAnswer(q.id, v)}>
                      <span className="text-xs font-mono">{v}</span>
                    </TapButton>
                  ))}
                </div>
                <div className="flex justify-between text-stone text-[10px] mt-1">
                  <span>{q.label_left}</span>
                  <span>{q.label_right}</span>
                </div>
              </fieldset>
            )}

            {q.type === "likert" && (
              <fieldset>
                <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
                  {q.prompt}
                </legend>
                <div className="flex justify-between gap-1">
                  {Array.from({ length: scaleMax }, (_, i) => i + 1).map((v) => (
                    <TapButton key={v} selected={answers[q.id] === v} onClick={() => setAnswer(q.id, v)}>
                      <span className="text-xs font-mono">{v}</span>
                    </TapButton>
                  ))}
                </div>
                <div className="flex justify-between text-stone text-[10px] mt-1">
                  <span>{q.label_left}</span>
                  <span>{q.label_right}</span>
                </div>
              </fieldset>
            )}

            {q.type === "text" && (
              <fieldset>
                <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-2">
                  {q.prompt}{" "}
                  <span className="text-stone-dark normal-case tracking-normal">(optional)</span>
                </legend>
                <textarea
                  rows={2}
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full bg-green-mid border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
                />
              </fieldset>
            )}
          </div>
        );
      })}

      {priceEnabled && (
        <fieldset className="space-y-3">
          <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-1">
            Preiswahrnehmung (in €, optional)
          </legend>
          {[
            { name: "price_too_cheap", label: "Ab welchem Preis wäre es dir zu billig (Qualitätszweifel)?" },
            { name: "price_cheap", label: "Ab welchem Preis findest du es günstig?" },
            { name: "price_expensive", label: "Ab welchem Preis findest du es teuer?" },
            { name: "price_too_expensive", label: "Ab welchem Preis wäre es dir zu teuer?" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-stone text-xs mb-1">{f.label}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name={f.name}
                className="w-full bg-green-mid border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
          ))}
        </fieldset>
      )}

      <motion.button
        type="submit"
        disabled={!complete}
        whileTap={complete ? { scale: 0.97 } : undefined}
        className={`w-full font-semibold py-3 text-sm transition-colors ${
          complete
            ? "bg-bronze text-green-dark hover:bg-bronze-light"
            : "bg-stone-dark text-stone cursor-not-allowed"
        }`}
      >
        {complete ? "Stimme abgeben →" : "Bitte alle Felder ausfüllen"}
      </motion.button>
    </form>
  );
}
