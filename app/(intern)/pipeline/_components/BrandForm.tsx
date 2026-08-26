"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/pipeline-model";
import {
  BRAND_TYPEN,
  FIT_CRITERIA,
  GROESSE_STUFEN,
  HALTUNG_TAGS,
  KATEGORIEN_KANONISCH,
  assessFit,
} from "@/lib/pipeline-model";

const GEFUNDEN_VIA = [
  "Perplexity",
  "Gemini",
  "ChatGPT",
  "Messe",
  "Empfehlung",
  "Inbound – haben uns kontaktiert",
  "Sonstiges",
];
const KANALE = ["E-Mail", "Instagram", "LinkedIn", "WhatsApp", "Telefon"];
const STATUSES = ["Neu", "Kontaktiert", "Antwort", "Gespräch", "Angebot", "Onboarded", "Abgelehnt", "Später"];

const FIT_COLORS: Record<string, string> = {
  Top: "text-emerald-400 border-emerald-400/40 bg-emerald-950/30",
  Gut: "text-bronze border-bronze/40 bg-bronze/10",
  "Eher nicht": "text-stone border-stone-dark bg-green-mid/20",
  Unbewertet: "text-amber-300 border-amber-500/40 bg-amber-950/20",
};

/** Tri-State-Auswahl: "" = unbekannt, bewusst nicht dasselbe wie "Nein". */
const JA_NEIN = ["Ja", "Nein"];

function triToString(v: boolean | null | undefined): string {
  return v == null ? "" : v ? "Ja" : "Nein";
}

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
  optionLabels,
  hint,
  onValueChange,
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  textarea?: boolean;
  options?: string[];
  optionLabels?: string[];
  hint?: string;
  onValueChange?: (v: string) => void;
}) {
  const baseClass =
    "w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze";

  // Bestandswerte, die nicht in der Optionsliste stehen (107 Zeilen tragen in
  // gefunden_via z. B. „Markthalle Neun" oder „cold_outreach_import" aus den
  // Import-Skripten), fielen vorher auf "—" zurück — und brandFormToInput hat
  // genau dieses "—" zurückgeschrieben. Ein Speichern hat die Angabe also
  // stillschweigend gelöscht. Der Altwert wird deshalb als eigene Option
  // vorangestellt. Wert und Label laufen als Paar, damit optionLabels nicht
  // um eine Position verrutscht.
  const paare = options?.map((o, i) => ({ wert: o, text: optionLabels?.[i] ?? o }));
  if (paare && value && !options!.includes(value)) {
    paare.unshift({ wert: value, text: value });
  }

  return (
    <div>
      <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
        {label}
      </label>
      {paare ? (
        <select
          name={name}
          defaultValue={value ?? ""}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={baseClass}
        >
          <option value="">—</option>
          {paare.map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.text}
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
      {hint && <p className="text-stone/40 text-[10px] font-mono mt-1">{hint}</p>}
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
    follower_ca: brand?.follower_ca ?? null,
    groesse: brand?.groesse ?? null,
    retail_listung: brand?.retail_listung ?? null,
    eigene_filialen: brand?.eigene_filialen ?? null,
    funding: brand?.funding ?? "",
    haltung_satz: brand?.haltung_satz ?? "",
    haltung_tags: brand?.haltung_tags ?? [],
  });

  const [tags, setTags] = useState<string[]>(brand?.haltung_tags ?? []);

  /**
   * Nur wenn ein Mensch Scope oder Haltung wirklich angefasst hat, wird die
   * Stufe als 'geprüft' markiert. Ein Speichern, bei dem nur der Status
   * geändert wurde, darf eine KI-Vermutung nicht zum Fakt befördern.
   */
  const [scopeTouched, setScopeTouched] = useState(false);

  function set(key: keyof typeof fitData) {
    return (v: string) => setFitData((prev) => ({ ...prev, [key]: v }));
  }

  function setScope<K extends keyof typeof fitData>(key: K, parse: (v: string) => unknown) {
    return (v: string) => {
      setScopeTouched(true);
      setFitData((prev) => ({ ...prev, [key]: parse(v) as typeof prev[K] }));
    };
  }

  function toggleTag(tag: string) {
    setScopeTouched(true);
    setTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      setFitData((f) => ({ ...f, haltung_tags: next }));
      return next;
    });
  }

  const checks = FIT_CRITERIA.map((c) => ({ ...c, passed: c.check(fitData) }));
  const fit = assessFit(fitData);
  const groesseQuelle = scopeTouched ? "geprüft" : (brand?.groesse_quelle ?? "");

  return (
    <>
    <form action={saveAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Brand-Name *" name="name" value={brand?.name} />
        <Field
          label="Typ"
          name="typ"
          value={brand?.typ ?? "Brand"}
          options={[...BRAND_TYPEN]}
          hint="„Partner“ zählt nicht als Brand und wird nie angeschrieben"
        />
        <Field label="Website" name="website" value={brand?.website} onValueChange={set("website")} />
        <Field label="Instagram" name="instagram" value={brand?.instagram} onValueChange={set("instagram")} />
        <Field label="E-Mail" name="email" type="email" value={brand?.email} />
        <Field label="LinkedIn" name="linkedin" value={brand?.linkedin} />
        <Field label="Ansprechpartner" name="ansprechpartner" value={brand?.ansprechpartner} />
        <Field
          label="Kategorie"
          name="kategorie_kanonisch"
          value={brand?.kategorie_kanonisch}
          options={[...KATEGORIEN_KANONISCH]}
        />
        <Field
          label="Subkategorie (frei)"
          name="kategorie"
          value={brand?.kategorie}
          hint="Detail wie „Craft Spirits“ — wird nicht gefiltert"
          onValueChange={set("kategorie")}
        />
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

      {/* Wofür sie stehen */}
      <div className="border border-stone-dark bg-green-mid/10 p-4 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">
            Wofür sie stehen
          </p>
          {brand?.haltung_stand && (
            <span className="text-stone/40 text-[10px] font-mono">
              Quelle gelesen {new Date(brand.haltung_stand).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>

        <Field
          label="Haltungs-Satz"
          name="haltung_satz"
          value={brand?.haltung_satz}
          textarea
          hint="Ein Satz, möglichst wörtlich von ihrer Über-uns-Seite. Haltung, nicht Produktbeschreibung."
          onValueChange={setScope("haltung_satz", (v) => v)}
        />

        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-2">
            Haltungs-Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {HALTUNG_TAGS.map((t) => {
              const an = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`text-xs font-mono px-2 py-1 border transition-colors ${
                    an
                      ? "border-bronze text-bronze bg-bronze/10"
                      : "border-stone-dark text-stone/60 hover:text-cream hover:border-stone"
                  }`}
                >
                  {an ? "✓ " : ""}{t}
                </button>
              );
            })}
          </div>
          {tags.map((t) => (
            <input key={t} type="hidden" name="haltung_tags" value={t} />
          ))}
        </div>

        <Field
          label="Quelle (URL)"
          name="haltung_quelle"
          value={brand?.haltung_quelle}
          hint="Seite, auf der der Satz steht — macht die Aussage überprüfbar"
        />
        {brand?.haltung_quelle && (
          <a
            href={brand.haltung_quelle}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-bronze text-xs font-mono hover:underline"
          >
            Quelle öffnen →
          </a>
        )}
      </div>

      {/* Scope */}
      <div className="border border-stone-dark bg-green-mid/10 p-4 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">
            Scope (Vertriebsbreite)
          </p>
          <span className={`text-[10px] font-mono ${
            groesseQuelle === "geprüft" ? "text-emerald-400/70" : "text-amber-300/70"
          }`}>
            {groesseQuelle === "geprüft"
              ? "geprüft"
              : groesseQuelle === "auto"
                ? "° ungeprüfte KI-Einschätzung"
                : "noch nicht erfasst"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="Größe"
            name="groesse"
            value={brand?.groesse != null ? String(brand.groesse) : ""}
            options={GROESSE_STUFEN.map((s) => String(s.stufe))}
            optionLabels={GROESSE_STUFEN.map((s) => `${s.stufe} · ${s.label} — ${s.hint}`)}
            onValueChange={setScope("groesse", (v) => (v ? Number(v) : null))}
          />
          <Field
            label="Händler (ca.)"
            name="haendler_ca"
            type="number"
            value={brand?.haendler_ca != null ? String(brand.haendler_ca) : ""}
            hint="Anzahl Verkaufsstellen — der Beleg für die Stufe"
          />
          <Field
            label="Im LEH/Drogerie gelistet"
            name="retail_listung"
            value={triToString(brand?.retail_listung)}
            options={JA_NEIN}
            hint="„—“ heißt unbekannt, nicht „Nein“"
            onValueChange={setScope("retail_listung", (v) => (v === "" ? null : v === "Ja"))}
          />
          <Field
            label="Eigene Filialen"
            name="eigene_filialen"
            value={triToString(brand?.eigene_filialen)}
            options={JA_NEIN}
            onValueChange={setScope("eigene_filialen", (v) => (v === "" ? null : v === "Ja"))}
          />
          <Field
            label="Follower (ca.)"
            name="follower_ca"
            type="number"
            value={brand?.follower_ca != null ? String(brand.follower_ca) : ""}
            hint="Nebensignal — entscheidet die Stufe nicht"
          />
          <Field
            label="Funding / Investoren"
            name="funding"
            value={brand?.funding}
            onValueChange={setScope("funding", (v) => v)}
          />
        </div>
        <input type="hidden" name="groesse_quelle" value={groesseQuelle} />
      </div>

      <Field label="Feedback / Einwand" name="feedback" value={brand?.feedback} textarea />
      <Field label="Notizen" name="notizen" value={brand?.notizen} textarea onValueChange={set("notizen")} />

      {/* Fit-Check Panel */}
      <div className="border border-stone-dark bg-green-mid/10 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">
            Hub42-Fit
          </p>
          <div className={`px-3 py-1 border text-xs font-mono font-semibold ${FIT_COLORS[fit.label] ?? ""}`}>
            {fit.label} · {fit.score}/{fit.maxScore} Pkt
          </div>
        </div>

        <p className="text-stone/60 text-xs font-mono">{fit.grund}</p>

        {/* Fehlende Pflichtfelder — der Grund, warum "Unbewertet" existiert */}
        {fit.fehlendeFelder.length > 0 && (
          <div className="border border-amber-500/30 bg-amber-950/10 px-3 py-2">
            <p className="text-amber-300/80 text-xs font-mono">
              Für ein Urteil fehlt noch: {fit.fehlendeFelder.join(", ")}
            </p>
            <p className="text-stone/40 text-[10px] font-mono mt-1">
              Solange die Felder leer sind, bleibt die Brand „Unbewertet“ — sie wird nicht
              als Absage behandelt und nicht angeschrieben.
            </p>
          </div>
        )}

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

        <p className="text-stone/30 text-[10px] font-mono">
          Das Label wird beim Speichern serverseitig aus den Feldern neu berechnet — dieses
          Panel zeigt die Vorschau.
        </p>
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
