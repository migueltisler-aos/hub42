"use client";

import { useState } from "react";

const TOOLS = ["Perplexity", "Gemini", "ChatGPT", "Messe", "Empfehlung", "Sonstiges"];

interface Props {
  runImport: (formData: FormData) => Promise<void>;
}

export default function ImportBox({ runImport }: Props) {
  const [json, setJson] = useState("");

  function handleCopyClick(e: React.MouseEvent<HTMLButtonElement>) {
    const text = e.currentTarget.dataset.copy ?? "";
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="border border-bronze/30 bg-green-mid/20 p-6">
      <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">JSON einfügen & importieren</p>

      <form action={runImport} className="space-y-4">
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
            KI-Tool
          </label>
          <select
            name="gefunden_via"
            className="bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze"
          >
            {TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
            JSON-Output der KI
          </label>
          <textarea
            name="json"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={10}
            placeholder={'[{ "name": "Brand XYZ", "website": "brandxyz.de", ... }]'}
            className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze resize-none"
          />
          <p className="text-stone/40 text-xs font-mono mt-1">
            {json.trim() ? `${json.split("\n").length} Zeilen eingefügt` : "Leer"}
          </p>
        </div>

        <button
          type="submit"
          disabled={!json.trim()}
          className="px-6 py-3 bg-bronze text-green-dark text-sm font-semibold hover:bg-bronze-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Importieren →
        </button>
      </form>
    </div>
  );
}
