"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HEDONIC_FACES, type DifferentialPair } from "@/lib/feedback";

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
      animate={{ scale: selected ? 1.12 : 1 }}
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

export default function RatingForm({
  productId,
  attributes,
  priceEnabled,
  productStore,
  productShelf,
  productBatch,
  action,
}: {
  productId: string;
  attributes: DifferentialPair[];
  priceEnabled: boolean;
  productStore: string;
  productShelf: string;
  productBatch: string;
  action: (formData: FormData) => void;
}) {
  const [hedonic, setHedonic] = useState<number | null>(null);
  const [semDiff, setSemDiff] = useState<(number | null)[]>(
    Array(attributes.length).fill(null)
  );

  const complete = hedonic !== null && semDiff.every((v) => v !== null);

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="attribute_count" value={attributes.length} />
      <input type="hidden" name="product_store" value={productStore} />
      <input type="hidden" name="product_shelf" value={productShelf} />
      <input type="hidden" name="product_batch" value={productBatch} />
      <input type="hidden" name="hedonic" value={hedonic ?? ""} />
      {semDiff.map((v, i) => (
        <input key={i} type="hidden" name={`sem_${i}`} value={v ?? ""} />
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

      {attributes.map((pair, i) => (
        <fieldset key={i}>
          <legend className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
            {pair.left} ↔ {pair.right}
          </legend>
          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((v) => (
              <TapButton
                key={v}
                selected={semDiff[i] === v}
                onClick={() =>
                  setSemDiff((prev) => prev.map((val, idx) => (idx === i ? v : val)))
                }
              >
                <span className="text-xs font-mono">{v}</span>
              </TapButton>
            ))}
          </div>
          <div className="flex justify-between text-stone text-[10px] mt-1">
            <span>{pair.left}</span>
            <span>{pair.right}</span>
          </div>
        </fieldset>
      ))}

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
