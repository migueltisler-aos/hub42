"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/pipeline";
import { FIT_CRITERIA, assessFit } from "@/lib/pipeline";

const KATEGORIEN = ["Food", "Drinks", "Beauty", "Lifestyle", "Home", "Sonstiges"];
const GEFUNDEN_VIA = ["Perplexity", "Gemini", "ChatGPT", "Messe", "Empfehlung", "Sonstiges"];
const KANALE = ["E-Mail", "Instagram", "LinkedIn", "WhatsApp", "Telefon"];
const STATUSES = ["Neu", "Kontaktiert", "Antwort", "Gespräch", "Angebot", "Onboarded", "Abgelehnt", "Später"];

const FIT_COLORS: Record<string, string> = {
  Top: "text-emerald-400 border-emerald-400/40 bg-emerald-950/30",
  Gut: "text-bronze border-bronze/40 bg-bronze/10",
  "Eher nicht": "text-stone border-stone-dark bg-green-mid/20",
};

interface Props {
  brand?: Brand;
  currentUser: string;
  saveAction: (formData: FormData) => Promise<void>;
  deactivateAction?: (formData: FormData) => Promise<void>;
}

function Field({
  label,
  name,
  value,
  type = "text",
  textarea = false,
  options,
  onValueChange,
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  textarea?: boolean;
  options?: string[];
  onValueChange?: (v: string) => void;
}) {
  const baseClass =
    "w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze";

  return (
    <div>
      <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
        {label}
      </label>
      {options ? (
        <select
          name={name}
          defaultValue={value ?? ""}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={baseClass}
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          name={name}
          defaultValue={value ?? ""}
          rows={3}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={value ?? ""}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={baseClass}
        />
      )}
    </div>
  );
}

export default function BrandForm({ brand, currentUser, saveAction, deactivateAction }: Props) {
  const router = useRouter();

  const [fitData, setFitData] = useState({
    website: brand?.website ?? "",
    instagram: brand?.instagram ?? "",
    preisrange: brand?.preisrange ?? "",
    standort: brand?.standort ?? "",
    notizen: brand?.notizen ?? "",
    kategorie: brand?.kategorie ?? "",
  });

  function set(key: keyof typeof fitData) {
    return (v: string) => setFitData((prev) => ({ ...prev, [key]: v }));
  }

  const checks = FIT_CRITERIA.map((c) => ({ ...c, passed: c.check(fitData) }));
  const score = checks.filter((c) => !c.gate && c.passed).reduce((sum, c) => sum + (c.weight ?? 1), 0);
  const fitScore = assessFit(fitData);

  return (
    <>
    <form action={saveAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Brand-Name *" name="name" value={brand?.name} />
        <Field label="Website" name="website" value={brand?.website} onValueChange={set("website")} />
        <Field label="Instagram" name="instagram" value={brand?.instagram} onValueChange={set("instagram")} />
        <Field label="E-Mail" name="email" type="email" value={brand?.email} />
        <Field label="LinkedIn" name="linkedin" value={brand?.linkedin} />
        <Field label="Ansprechpartner" name="ansprechpartner" value={brand?.ansprechpartner} />
        <Field label="Kategorie" name="kategorie" value={brand?.kategorie} options={KATEGORIEN} onValueChange={set("kategorie")} />
        <Field label="Preisrange" name="preisrange" value={brand?.preisrange} onValueChange={set("preisrange")} />
        <Field label="Standort" name="standort" value={brand?.standort} onValueChange={set("standort")} />
        <Field label="Gefunden via" name="gefunden_via" value={brand?.gefunden_via} options={GEFUNDEN_VIA} />
        <Field label="Zugewiesen" name="zugewiesen" value={brand?.zugewiesen ?? currentUser} />
        <Field label="Status" name="status" value={brand?.status ?? "Neu"} options={STATUSES} />
        <Field label="Kanal" name="kanal" value={brand?.kanal} options={KANALE} />
        <Field label="Datum Erstkontakt" name="datum_erstkontakt" type="date" value={brand?.datum_erstkontakt} />
        <Field label="Datum Nächste Aktion" name="datum_naechste_aktion" type="date" value={brand?.datum_naechste_aktion} />
      </div>

      <Field label="Produkt (Kurzbeschreibung)" name="produkt" value={brand?.produkt} />
      <Field label="Nächste Aktion" name="naechste_aktion" value={brand?.naechste_aktion} />
      <Field label="Feedback / Einwand" name="feedback" value={brand?.feedback} textarea />
      <Field label="Notizen" name="notizen" value={brand?.notizen} textarea onValueChange={set("notizen")} />

      {/* Fit-Check Panel */}
      <div className="border border-stone-dark bg-green-mid/10 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">
            Hub42-Fit
          </p>
          <div className={`px-3 py-1 border text-xs font-mono font-semibold ${FIT_COLORS[fitScore] ?? ""}`}>
            {fitScore} · {score}/8 Pkt
          </div>
        </div>

        {/* Gates */}
        <div>
          <p className="text-stone/40 text-[10px] font-mono uppercase tracking-widest mb-1.5">Ausschlusskriterien</p>
          <div className="space-y-1.5">
            {checks.filter((c) => c.gate).map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <span className={`mt-0.5 text-xs font-mono leading-none ${c.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {c.passed ? "✓" : "✗"}
                </span>
                <div>
                  <span className={`text-xs font-mono ${c.passed ? "text-cream/70" : "text-red-300"}`}>
                    {c.label}
                  </span>
                  {!c.passed && (
                    <span className="text-red-400/60 text-xs font-mono ml-2">— {c.hint}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scored criteria */}
        <div>
          <p className="text-stone/40 text-[10px] font-mono uppercase tracking-widest mb-1.5">Positive Signale</p>
          <div className="space-y-1.5">
            {checks.filter((c) => !c.gate).map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <span className={`mt-0.5 text-xs font-mono leading-none ${c.passed ? "text-emerald-400" : "text-stone/40"}`}>
                  {c.passed ? "✓" : "✗"}
                </span>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <div>
                    <span className={`text-xs font-mono ${c.passed ? "text-cream" : "text-stone/60"}`}>
                      {c.label}
                    </span>
                    {!c.passed && (
                      <span className="text-stone/40 text-xs font-mono ml-2">— {c.hint}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ${c.passed ? "text-emerald-400/70" : "text-stone/30"}`}>
                    +{c.weight ?? 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <input type="hidden" name="hub42_fit" value={fitScore} />
      </div>

      {/* Manuelles Potenzial */}
      <Field
        label="Hub42 Potenzial (manuell)"
        name="hub42_potenzial"
        value={brand?.hub42_potenzial}
        options={["Hoch", "Mittel", "Niedrig"]}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-6 py-3 bg-bronze text-green-dark text-sm font-semibold hover:bg-bronze-light transition-colors"
        >
          Speichern →
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-stone-dark text-stone text-sm hover:border-bronze/40 hover:text-cream transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>

    {/* Inaktiv schalten — separates Formular, außerhalb des Hauptformulars */}
    {deactivateAction && (
      <details className="mt-8 border-t border-stone-dark pt-6 group">
        <summary className="text-stone/50 text-xs font-mono cursor-pointer hover:text-red-400 transition-colors list-none flex items-center gap-2">
          <span className="group-open:hidden">▸</span>
          <span className="hidden group-open:inline">▾</span>
          Brand inaktiv schalten
        </summary>
        <form action={deactivateAction} className="mt-4 space-y-3">
          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Grund / Kommentar <span className="text-red-400">*</span>
            </label>
            <textarea
              name="kommentar"
              rows={2}
              required
              placeholder="z. B. zu groß, schon bei Zalando, kein Kontakt zustande …"
              className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-500/60 resize-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 border border-red-500/40 text-red-400 text-xs font-mono hover:border-red-400 transition-colors"
          >
            Inaktiv schalten →
          </button>
        </form>
      </details>
    )}
    </>
  );
}
