"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HEDONIC_FACES, questionsFor, type QuestionWithSet, type RatingKontext } from "@/lib/feedback";
import { formatEuro, priceLadder } from "@/lib/price-ladder";

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

/**
 * Schieberegler für den Event-Modus. Startet in der Mitte, zählt aber erst als
 * Antwort, wenn er berührt wurde (sonst landet die Mitte ungefragt in den Daten).
 */
function Slider({
  min,
  max,
  value,
  onChange,
  labelLeft,
  labelRight,
  display,
  start,
}: {
  /** Startposition, bevor berührt wurde (Standard: Mitte). */
  start?: number;
  min: number;
  max: number;
  value: number | null;
  onChange: (v: number) => void;
  labelLeft: string;
  labelRight: string;
  display?: (v: number) => React.ReactNode;
}) {
  const v = value ?? start ?? Math.round((min + max) / 2);
  const set = (raw: string) => onChange(Number(raw));
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={v}
          onChange={(e) => set(e.target.value)}
          onPointerUp={(e) => set((e.target as HTMLInputElement).value)}
          onKeyUp={(e) => set((e.target as HTMLInputElement).value)}
          aria-valuetext={value == null ? "noch nicht gewählt" : String(v)}
          className={`flex-1 h-10 accent-bronze ${value == null ? "opacity-50" : ""}`}
        />
        <span
          className={`min-w-10 text-center tabular-nums ${value == null ? "text-stone-dark" : "text-bronze"}`}
        >
          {value == null ? "–" : display ? display(v) : v}
        </span>
      </div>
      <div className="flex justify-between text-stone text-[10px] mt-1 pr-13">
        <span>{labelLeft}</span>
        {/* Just-about-right-Skala ("zu wenig … ↔ zu …"): Mitte benennen */}
        {labelLeft.startsWith("zu ") && labelRight.startsWith("zu ") && (
          <span className="text-bronze/80">genau richtig</span>
        )}
        <span>{labelRight}</span>
      </div>
    </div>
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
  eventMode = false,
  price = null,
  initialKontext = null,
  action,
}: {
  productId: string;
  questions: QuestionWithSet[];
  priceEnabled: boolean;
  productStore: string;
  productShelf: string;
  productBatch: string;
  /** Nur Schieberegler, keine Text- und Preisfelder. */
  eventMode?: boolean;
  /** Aktueller Verkaufspreis: im Event-Modus Basis der Preis-Leiter. */
  price?: number | null;
  /** Aus dem QR-Code (/t = tasting, /q = kauf). Dann entfällt die Auswahl. */
  initialKontext?: RatingKontext | null;
  action: (formData: FormData) => void;
}) {
  const [hedonic, setHedonic] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  // Event-Modus: erst "probiert" oder "gekauft" wählen, danach passende Regler
  const [kontext, setKontext] = useState<RatingKontext | null>(initialKontext);
  const [preisIdx, setPreisIdx] = useState<number | null>(null);
  const leiter = eventMode && price != null && price > 0 ? priceLadder(price) : [];
  const mitteIdx = leiter.findIndex((p) => Math.round(p * 100) === Math.round((price ?? 0) * 100));

  const visible = questionsFor(questions, eventMode, kontext ?? "tasting");
  const shown = eventMode ? visible.filter((q) => q.type !== "text") : visible;
  const requiredQuestions = shown.filter((q) => q.type !== "text");
  const complete =
    hedonic !== null &&
    (!eventMode || kontext !== null) &&
    (leiter.length === 0 || preisIdx !== null) &&
    requiredQuestions.every((q) => answers[q.id] != null && answers[q.id] !== "");

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const showSetHeadingFor = shown.map(
    (q, i) => Boolean(q.set_name) && q.set_name !== shown[i - 1]?.set_name
  );

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="question_ids" value={shown.map((q) => q.id).join(",")} />
      <input type="hidden" name="product_store" value={productStore} />
      <input type="hidden" name="product_shelf" value={productShelf} />
      <input type="hidden" name="product_batch" value={productBatch} />
      <input type="hidden" name="hedonic" value={hedonic ?? ""} />
      <input type="hidden" name="kontext" value={kontext ?? ""} />
      <input type="hidden" name="price_wtp" value={preisIdx != null ? leiter[preisIdx] : ""} />

      {eventMode && !initialKontext && (
        <fieldset>
          <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
            Was hast du gemacht?
          </legend>
          <div className="flex gap-2">
            {(
              [
                ["tasting", "🍴 Probiert"],
                ["kauf", "🛍 Gekauft"],
              ] as const
            ).map(([wert, label]) => (
              <TapButton
                key={wert}
                selected={kontext === wert}
                onClick={() => setKontext(wert)}
                className="aspect-auto! py-3"
              >
                <span className="text-sm font-semibold">{label}</span>
              </TapButton>
            ))}
          </div>
        </fieldset>
      )}
      {shown.map((q) => (
        <input key={q.id} type="hidden" name={`answer_${q.id}`} value={answers[q.id] ?? ""} />
      ))}

      {(!eventMode || kontext !== null) && (
      <>
      <fieldset>
        <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
          Wie gefällt dir das Produkt insgesamt?
        </legend>
        {eventMode ? (
          <Slider
            min={1}
            max={9}
            value={hedonic}
            onChange={setHedonic}
            labelLeft="gar nicht"
            labelRight="extrem gut"
            display={(v) => <span className="text-2xl">{HEDONIC_FACES[v - 1]}</span>}
          />
        ) : (
        <>
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
        </>
        )}
      </fieldset>

      {shown.map((q, i) => {
        const showSetHeading = showSetHeadingFor[i];
        const scaleMax = q.scale_max ?? (q.type === "likert" ? 5 : 7);

        return (
          <div key={q.id}>
            {showSetHeading && (
              <p className="text-bronze/70 text-[10px] font-mono uppercase tracking-widest mb-2">
                {q.set_name}
              </p>
            )}

            {eventMode && q.type !== "text" && (
              <fieldset>
                <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
                  {q.type === "likert" ? q.prompt : `${q.label_left} ↔ ${q.label_right}`}
                </legend>
                <Slider
                  min={1}
                  max={scaleMax}
                  value={(answers[q.id] as number | null) ?? null}
                  onChange={(v) => setAnswer(q.id, v)}
                  labelLeft={q.label_left ?? ""}
                  labelRight={q.label_right ?? ""}
                />
              </fieldset>
            )}

            {!eventMode && q.type === "semantic_diff" && (
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

            {!eventMode && q.type === "likert" && (
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

      </>
      )}

      {leiter.length > 0 && kontext !== null && (
        <fieldset>
          <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
            Welcher Preis wäre für dich fair?
          </legend>
          <Slider
            min={0}
            max={leiter.length - 1}
            value={preisIdx}
            onChange={setPreisIdx}
            start={mitteIdx}
            labelLeft={formatEuro(leiter[0])}
            labelRight={formatEuro(leiter[leiter.length - 1])}
            display={(i) => (
              <span className={`text-xs whitespace-nowrap ${i === mitteIdx ? "text-cream" : ""}`}>
                {formatEuro(leiter[i])}
              </span>
            )}
          />
          <p className="text-stone-dark text-[10px] mt-1">Aktuell im Regal: {formatEuro(price!)}</p>
        </fieldset>
      )}

      {priceEnabled && !eventMode && (
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
        {complete
          ? "Stimme abgeben →"
          : eventMode
            ? "Bitte jeden Regler einmal bewegen"
            : "Bitte alle Felder ausfüllen"}
      </motion.button>
    </form>
  );
}
