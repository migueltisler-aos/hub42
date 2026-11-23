"use client";

import { useState } from "react";
import Link from "next/link";
import { useAutoRefresh } from "@/app/(intern)/_components/useAutoRefresh";
import {
  GROESSE_STUFEN,
  HALTUNG_TAGS,
  KATEGORIEN_KANONISCH,
  groesseLabel,
  type Brand,
} from "@/lib/pipeline-model";
import { STUFEN, type Stufe } from "@/lib/crm-heute-model";

const FIT_BADGE: Record<string, string> = {
  Top: "text-emerald-400 border-emerald-500/40",
  Gut: "text-bronze border-bronze/40",
  "Eher nicht": "text-stone/50 border-stone-dark",
  // Bewusst nicht rot und nicht ausgegraut: eine Datenlücke ist eine offene
  // Aufgabe, keine Absage.
  Unbewertet: "text-amber-300/80 border-amber-500/30",
};

const POTENZIAL_BADGE: Record<string, string> = {
  Hoch: "text-yellow-300 border-yellow-500/40",
  Mittel: "text-stone border-stone-dark",
  Niedrig: "text-stone/40 border-stone-dark",
};

/* Die Stufe ist die einzige Wahrheit. In der Liste wird sie nur angezeigt
   und gefiltert; gesetzt wird sie in der Markenakte, wo Grund und
   Wiedervorlage mit abgefragt werden (die Constraints verlangen sie). */

const STUFE_COLOR: Record<Stufe, string> = {
  Recherche:    "text-cream/60",
  "In Sequenz": "text-blue-400",
  Antwort:      "text-yellow-400",
  Interesse:    "text-amber-400",
  Gespräch:     "text-orange-400",
  Angebot:      "text-purple-400",
  Kunde:        "text-green-400",
  Später:       "text-stone/60",
  Verloren:     "text-stone/40",
  Gesperrt:     "text-stone/30",
};

const ROW_COLOR: Record<Stufe, string> = {
  Recherche:    "",
  "In Sequenz": "",
  Antwort:      "",
  Interesse:    "",
  Gespräch:     "",
  Angebot:      "",
  Kunde:        "opacity-60",
  Später:       "opacity-50",
  Verloren:     "opacity-30",
  Gesperrt:     "opacity-20",
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

/**
 * Fünf Segmente statt einer Zahl: die Riesen fallen im Überflug auf, ohne
 * dass man die Legende im Kopf haben muss. Ungeprüfte (KI-)Stufen sind
 * gedimmt und mit ° markiert — eine Vermutung darf nicht aussehen wie ein
 * geprüfter Fakt.
 */
function ScopeBar({ groesse, quelle }: { groesse: number | null; quelle: string | null }) {
  if (groesse == null) {
    return <span className="text-amber-300/50 text-[10px] font-mono">offen</span>;
  }
  const ungeprueft = quelle !== "geprüft";
  const farbe = groesse >= 4 ? "bg-red-400" : groesse === 3 ? "bg-bronze" : "bg-emerald-400";

  return (
    <div className={`flex items-center gap-1.5 ${ungeprueft ? "opacity-50" : ""}`}>
      <span className="flex gap-[2px]" title={`Stufe ${groesse} — ${groesseLabel(groesse)}`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className={`w-[3px] h-3 ${s <= groesse ? farbe : "bg-stone-dark"}`}
          />
        ))}
      </span>
      <span className="text-stone text-[11px] font-mono whitespace-nowrap">
        {groesseLabel(groesse)}
        {ungeprueft && <span className="text-amber-300/70" title="ungeprüft (KI)">°</span>}
      </span>
    </div>
  );
}

interface Props {
  initialBrands: Brand[];
  currentUser: string;
}

export default function PipelineClient({ initialBrands, currentUser }: Props) {
  // Keine optimistische Ueberlagerung mehr: die Liste zeigt die Stufe nur an.
  const brands = initialBrands;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"alle" | "meine" | "neu" | "überfällig" | "partner">("alle");
  const [fitFilter, setFitFilter] = useState("");
  const [kategorieFilter, setKategorieFilter] = useState("");
  const [stufeFilter, setStufeFilter] = useState("");
  const [groesseFilter, setGroesseFilter] = useState("");
  const [haltungFilter, setHaltungFilter] = useState("");
  const [sortByGroesse, setSortByGroesse] = useState(false);

  // Live-Updates: periodisch die Server-Component-Daten neu holen.
  // Ersetzt den früheren Supabase-Realtime-Channel — siehe useAutoRefresh.
  useAutoRefresh();

  // Nicht-Marken (Forschungspartner o. ä.) liegen in derselben Tabelle, dürfen
  // aber in keine Marken-Zahl einfließen — die Zahl „x Brands in der Pipeline"
  // ist ein Pitch-Argument. Sie sind über den eigenen Tab erreichbar.
  const marken = brands.filter((b) => b.typ !== "Partner");
  const partner = brands.filter((b) => b.typ === "Partner");

  const filtered = (filter === "partner" ? partner : marken).filter((b) => {
    if (filter === "meine" && b.zugewiesen !== currentUser) return false;
    if (filter === "neu" && b.stufe !== "Recherche") return false;
    if (filter === "überfällig" && !isOverdue(b.datum_naechste_aktion)) return false;
    if (fitFilter && b.hub42_fit !== fitFilter) return false;
    if (kategorieFilter && b.kategorie_kanonisch !== kategorieFilter) return false;
    if (stufeFilter && b.stufe !== stufeFilter) return false;
    if (groesseFilter === "offen" && b.groesse != null) return false;
    if (groesseFilter && groesseFilter !== "offen" && b.groesse !== Number(groesseFilter)) return false;
    if (haltungFilter && !(b.haltung_tags ?? []).includes(haltungFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.website ?? "").toLowerCase().includes(q) ||
        (b.produkt ?? "").toLowerCase().includes(q) ||
        (b.standort ?? "").toLowerCase().includes(q) ||
        (b.haltung_satz ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Absteigend, damit die Riesen oben clustern — Unbewertete ans Ende.
  const sichtbar = sortByGroesse
    ? [...filtered].sort((a, b) => (b.groesse ?? -1) - (a.groesse ?? -1))
    : filtered;

  const counts = {
    alle: marken.length,
    meine: marken.filter((b) => b.zugewiesen === currentUser).length,
    neu: marken.filter((b) => b.stufe === "Recherche").length,
    überfällig: marken.filter((b) => isOverdue(b.datum_naechste_aktion) && b.stufe !== "Verloren" && b.stufe !== "Kunde").length,
    partner: partner.length,
  };

  // Scope-Verteilung über den GESAMTEN Bestand (nicht die Filtermenge) —
  // die Frage "wie schief ist mein Portfolio" soll unabhängig vom aktuellen
  // Filter beantwortet werden.
  const scopeBuckets = [
    ...GROESSE_STUFEN.map((s) => ({
      key: String(s.stufe),
      label: s.label,
      hint: s.hint,
      count: marken.filter((b) => b.groesse === s.stufe).length,
      stufe: s.stufe as number | null,
    })),
    {
      key: "offen",
      label: "offen",
      hint: "noch keine Scope-Stufe — erscheint als „Unbewertet“",
      count: marken.filter((b) => b.groesse == null).length,
      stufe: null,
    },
  ];

  return (
    <div>
      {/* Scope-Verteilung */}
      <div className="border border-stone-dark mb-6">
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-dark bg-green-mid/50">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Scope-Verteilung</p>
          <button
            onClick={() => setSortByGroesse((v) => !v)}
            className={`text-xs font-mono transition-colors ${
              sortByGroesse ? "text-bronze" : "text-stone/50 hover:text-cream"
            }`}
          >
            {sortByGroesse ? "↓ nach Größe sortiert" : "nach Größe sortieren"}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-stone-dark/50">
          {scopeBuckets.map((b) => {
            const aktiv = groesseFilter === b.key;
            return (
              <button
                key={b.key}
                title={b.hint}
                onClick={() => setGroesseFilter(aktiv ? "" : b.key)}
                className={`px-3 py-3 text-left transition-colors ${
                  aktiv ? "bg-bronze/15" : "hover:bg-green-mid/30"
                }`}
              >
                <p className={`font-mono text-lg leading-none ${
                  b.stufe == null
                    ? "text-amber-300/80"
                    : b.stufe >= 4
                      ? "text-red-400"
                      : "text-cream"
                }`}>
                  {b.count}
                </p>
                <p className="text-stone/60 text-[10px] font-mono uppercase tracking-wider mt-1 truncate">
                  {b.stufe != null && `${b.stufe} · `}{b.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {(["alle", "meine", "neu", "überfällig", "partner"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-mono tracking-widest uppercase border transition-colors ${
                  filter === f
                    ? "bg-bronze text-green-dark border-bronze"
                    : "border-stone-dark text-stone hover:border-bronze/50 hover:text-cream"
                }`}
              >
                {f} <span className="opacity-60">({counts[f]})</span>
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:ml-auto bg-green-mid border border-stone-dark text-cream px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-bronze w-full sm:w-48"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-stone/40 text-xs font-mono">Filter:</span>
          {[
            { label: "Fit", value: fitFilter, set: setFitFilter, opts: ["Top", "Gut", "Eher nicht", "Unbewertet"] },
            { label: "Größe", value: groesseFilter, set: setGroesseFilter,
              opts: [...GROESSE_STUFEN.map((s) => String(s.stufe)), "offen"],
              labels: [...GROESSE_STUFEN.map((s) => `${s.stufe} · ${s.label}`), "offen"] },
            { label: "Haltung", value: haltungFilter, set: setHaltungFilter, opts: [...HALTUNG_TAGS] },
            { label: "Kategorie", value: kategorieFilter, set: setKategorieFilter, opts: [...KATEGORIEN_KANONISCH] },
            { label: "Stufe", value: stufeFilter, set: setStufeFilter, opts: STUFEN },
          ].map(({ label, value, set, opts, labels }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => set(e.target.value)}
              className={`bg-green-dark border text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-bronze transition-colors cursor-pointer ${
                value ? "border-bronze text-bronze" : "border-stone-dark text-stone hover:border-stone"
              }`}
            >
              <option value="">{label}</option>
              {opts.map((o, i) => <option key={o} value={o}>{labels?.[i] ?? o}</option>)}
            </select>
          ))}
          {(fitFilter || kategorieFilter || stufeFilter || groesseFilter || haltungFilter) && (
            <button
              onClick={() => {
                setFitFilter(""); setKategorieFilter(""); setStufeFilter("");
                setGroesseFilter(""); setHaltungFilter("");
              }}
              className="text-stone/50 text-xs font-mono hover:text-cream transition-colors"
            >
              × zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-stone-dark">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-stone-dark bg-green-mid/50">
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Brand &amp; Haltung</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden sm:table-cell">Scope</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden lg:table-cell">Kategorie</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden xl:table-cell">Zugewiesen</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Status</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden md:table-cell">Nächste Aktion</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sichtbar.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone text-xs font-mono">
                  {filter === "partner" ? "Keine Partner erfasst." : "Keine Brands gefunden."}
                </td>
              </tr>
            )}
            {sichtbar.map((brand) => (
              <tr
                key={brand.id}
                className={`border-b border-stone-dark/50 hover:bg-green-mid/30 transition-colors ${ROW_COLOR[brand.stufe]}`}
              >
                <td className="px-4 py-3 max-w-[420px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-cream font-medium">{brand.name}</p>
                    {brand.hub42_fit && (
                      <span
                        title={brand.fit_grund ?? undefined}
                        className={`text-[10px] font-mono border px-1.5 py-0.5 leading-none ${FIT_BADGE[brand.hub42_fit] ?? "text-stone border-stone-dark"}`}
                      >
                        {brand.hub42_fit}
                      </span>
                    )}
                    {brand.hub42_potenzial && (
                      <span className={`text-[10px] font-mono border px-1.5 py-0.5 leading-none ${POTENZIAL_BADGE[brand.hub42_potenzial] ?? "text-stone border-stone-dark"}`}>
                        ★ {brand.hub42_potenzial}
                      </span>
                    )}
                    {brand.website && (
                      <span className="text-stone/40 text-[10px] font-mono truncate max-w-[140px]">
                        {brand.website}
                      </span>
                    )}
                  </div>

                  {/* Wofür sie stehen — direkt lesbar, ohne die Brand zu öffnen */}
                  {brand.haltung_satz ? (
                    <p className="text-cream/70 text-xs mt-1 leading-snug">{brand.haltung_satz}</p>
                  ) : (
                    <p className="text-amber-300/40 text-xs font-mono mt-1">
                      Haltung noch nicht erfasst
                    </p>
                  )}

                  {(brand.haltung_tags?.length ?? 0) > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {brand.haltung_tags!.map((t) => (
                        <button
                          key={t}
                          onClick={() => setHaltungFilter(haltungFilter === t ? "" : t)}
                          className={`text-[10px] font-mono px-1.5 py-0.5 leading-none border transition-colors ${
                            haltungFilter === t
                              ? "border-bronze text-bronze"
                              : "border-stone-dark/70 text-stone/60 hover:text-cream hover:border-stone"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell align-top">
                  <ScopeBar groesse={brand.groesse} quelle={brand.groesse_quelle} />
                </td>
                <td className="px-4 py-3 text-stone text-xs hidden lg:table-cell align-top">
                  {brand.kategorie_kanonisch ?? <span className="text-stone/30">—</span>}
                </td>
                <td className="px-4 py-3 text-stone text-xs hidden xl:table-cell align-top">{brand.zugewiesen ?? "—"}</td>
                <td className="px-4 py-3 align-top">
                  <span className={`text-xs font-mono ${STUFE_COLOR[brand.stufe]}`}>{brand.stufe}</span>
                  {brand.verlust_grund && (
                    <p className="text-stone/40 text-[10px] font-mono mt-0.5">{brand.verlust_grund}</p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell align-top">
                  {brand.naechste_aktion ? (
                    <div>
                      <p className="text-cream/70 text-xs">{brand.naechste_aktion}</p>
                      {brand.datum_naechste_aktion && (
                        <p className={`text-xs font-mono mt-0.5 ${isOverdue(brand.datum_naechste_aktion) ? "text-red-400" : "text-stone/50"}`}>
                          {brand.datum_naechste_aktion}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-stone/30 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <Link
                    href={`/pipeline/${brand.id}`}
                    className="text-bronze text-xs font-mono hover:underline whitespace-nowrap"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center gap-3 mt-3">
        <p className="text-stone/40 text-xs font-mono">
          <span className="text-amber-300/60">°</span> = ungeprüfte KI-Einschätzung
        </p>
        <p className="text-stone/40 text-xs font-mono text-right">
          {sichtbar.length} von {filter === "partner" ? partner.length : marken.length}{" "}
          {filter === "partner" ? "Partnern" : "Brands"} · Live via Supabase Realtime
        </p>
      </div>
    </div>
  );
}
