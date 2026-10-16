"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
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

/** Daumenbreite in px, muss zu input.fb-range in globals.css passen. */
const DAUMEN = 30;

/**
 * Schieberegler für den Event-Modus. Startet in der Mitte, zählt aber erst als
 * Antwort, wenn er berührt wurde (sonst landet die Mitte ungefragt in den Daten).
 * Schiene und Stopp-Punkte werden selbst gezeichnet (auf dem Handy sonst unsichtbar),
 * das unsichtbare native input liegt darüber und übernimmt Touch und Tastatur.
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
  // Tipp ohne Bewegung (z. B. auf die Mitte, wo der unsichtbare Daumen schon steht) löst kein
  // onChange aus und auf dem Handy oft auch kein pointerup. Darum zählt jeder Klick über seine Position.
  const tipp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (e.detail === 0) return; // Tastatur/Screenreader: keine echte Position, onChange reicht
    const r = e.currentTarget.getBoundingClientRect();
    const anteil = (e.clientX - r.left - DAUMEN / 2) / (r.width - DAUMEN);
    onChange(Math.min(max, Math.max(min, Math.round(min + anteil * (max - min)))));
  };
  // Just-about-right-Skala ("zu wenig … ↔ zu …"): Mitte hervorheben und benennen
  const jar = labelLeft.startsWith("zu ") && labelRight.startsWith("zu ");
  const mitte = (min + max) / 2;
  const stufen = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  // gleiche Abbildung wie der native Daumen: Mittelpunkt läuft von DAUMEN/2 bis Breite − DAUMEN/2
  const pos = (s: number) => `calc(${DAUMEN / 2}px + (100% - ${DAUMEN}px) * ${(s - min) / (max - min)})`;
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-11">
          <div
            aria-hidden
            className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-stone/60"
            style={{ left: DAUMEN / 2, right: DAUMEN / 2 }}
          />
          {stufen.map((s) => (
            <span
              key={s}
              aria-hidden
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                value != null && s === v
                  ? "size-3 bg-bronze"
                  : jar && s === mitte
                    ? "size-3 bg-bronze/70"
                    : "size-2 bg-stone"
              }`}
              style={{ left: pos(s) }}
            />
          ))}
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={v}
            onChange={(e) => set(e.target.value)}
            onPointerUp={(e) => set((e.target as HTMLInputElement).value)}
            onClick={tipp}
            onKeyUp={(e) => set((e.target as HTMLInputElement).value)}
            aria-valuetext={value == null ? "noch nicht gewählt" : String(v)}
            data-leer={value == null ? "" : undefined}
            className="fb-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
          />
        </div>
        <span
          className={`min-w-10 text-center tabular-nums ${value == null ? "text-stone-dark" : "text-bronze"}`}
        >
          {value == null ? "–" : display ? display(v) : v}
        </span>
      </div>
      <div className="flex justify-between text-stone text-[10px] mt-1 pr-13">
        <span>{labelLeft}</span>
        {jar && <span className="text-bronze/80">genau richtig</span>}
        <span>{labelRight}</span>
      </div>
    </div>
  );
}

/** Eine Frage im Formular. Nach einem Absende-Versuch mit Lücken wird sie markiert. */
function Feld({ id, fehlt, children }: { id: string; fehlt: boolean; children: React.ReactNode }) {
  return (
    <div
      id={`feld-${id}`}
      className={`scroll-mt-24 rounded-sm transition-[outline-color] ${
        fehlt ? "outline-2 outline-offset-8 outline-bronze/80" : "outline-0 outline-transparent"
      }`}
    >
      {children}
      {fehlt && (
        <p className="text-bronze text-[10px] font-mono uppercase tracking-widest mt-2">↑ Fehlt noch</p>
      )}
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
  /** Aus dem QR-Code (/t = tasting, /q = angeschaut). Dann entfällt die Auswahl. */
  initialKontext?: RatingKontext | null;
  action: (formData: FormData) => void;
}) {
  const [hedonic, setHedonic] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  // Event-Modus: erst "probiert" oder "angeschaut" wählen, danach passende Regler
  const [kontext, setKontext] = useState<RatingKontext | null>(initialKontext);
  const [preisIdx, setPreisIdx] = useState<number | null>(null);
  // nach dem ersten Absende-Versuch mit Lücken: offene Fragen markieren
  const [versucht, setVersucht] = useState(false);
  const leiter = eventMode && price != null && price > 0 ? priceLadder(price) : [];
  const mitteIdx = leiter.findIndex((p) => Math.round(p * 100) === Math.round((price ?? 0) * 100));

  const visible = questionsFor(questions, eventMode, kontext ?? "tasting");
  const shown = eventMode ? visible.filter((q) => q.type !== "text") : visible;
  const requiredQuestions = shown.filter((q) => q.type !== "text");

  // offene Pflichtfelder in Anzeige-Reihenfolge (Sprungziel = erstes)
  const fehlend: string[] = [];
  if (eventMode && kontext === null) {
    fehlend.push("kontext");
  } else {
    if (hedonic === null) fehlend.push("hedonic");
    for (const q of requiredQuestions) {
      if (answers[q.id] == null || answers[q.id] === "") fehlend.push(q.id);
    }
    if (leiter.length > 0 && preisIdx === null) fehlend.push("preis");
  }
  const complete = fehlend.length === 0;
  const fehlt = (id: string) => versucht && fehlend.includes(id);

  function zurLuecke(e: React.MouseEvent) {
    if (complete) return;
    e.preventDefault();
    setVersucht(true);
    document.getElementById(`feld-${fehlend[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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
        <Feld id="kontext" fehlt={fehlt("kontext")}>
        <fieldset>
          <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
            Was hast du gemacht?
          </legend>
          <div className="flex gap-2">
            {(
              [
                ["tasting", "🍴 Probiert"],
                ["angeschaut", "👀 Angeschaut"],
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
        </Feld>
      )}
      {shown.map((q) => (
        <input key={q.id} type="hidden" name={`answer_${q.id}`} value={answers[q.id] ?? ""} />
      ))}

      {(!eventMode || kontext !== null) && (
      <>
      <Feld id="hedonic" fehlt={fehlt("hedonic")}>
      <fieldset>
        <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
          {eventMode && kontext === "angeschaut"
            ? "Wie spricht dich das Produkt an?"
            : "Wie gefällt dir das Produkt insgesamt?"}
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
      </Feld>

      {shown.map((q, i) => {
        const showSetHeading = showSetHeadingFor[i];
        const scaleMax = q.scale_max ?? (q.type === "likert" ? 5 : 7);

        return (
          <Feld key={q.id} id={q.id} fehlt={fehlt(q.id)}>
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
          </Feld>
        );
      })}

      </>
      )}

      {leiter.length > 0 && kontext !== null && (
        <Feld id="preis" fehlt={fehlt("preis")}>
        <fieldset>
          <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
            Welchen Preis würdest du im Supermarkt erwarten?
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
        </Feld>
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

      <AbsendeButton complete={complete} offen={fehlend.length} onClick={zurLuecke} />
    </form>
  );
}

/**
 * Nicht disabled: ein Tipp bei Lücken springt zur ersten offenen Frage.
 * Während des Speicherns sofort Rückmeldung, sonst wirkt der Knopf tot.
 */
function AbsendeButton({
  complete,
  offen,
  onClick,
}: {
  complete: boolean;
  offen: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      onClick={(e) => (pending ? e.preventDefault() : onClick(e))}
      aria-disabled={!complete || pending}
      whileTap={{ scale: 0.97 }}
      className={`w-full font-semibold py-3 text-sm transition-colors ${
        pending
          ? "bg-bronze/60 text-green-dark animate-pulse"
          : complete
            ? "bg-bronze text-green-dark hover:bg-bronze-light"
            : "bg-stone-dark text-stone"
      }`}
    >
      {pending
        ? "Wird gespeichert …"
        : complete
          ? "Stimme abgeben →"
          : `Noch ${offen} ${offen === 1 ? "Frage" : "Fragen"} offen – hinspringen`}
    </motion.button>
  );
}
