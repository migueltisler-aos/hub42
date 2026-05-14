"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Brand, BrandStatus } from "@/lib/pipeline";

const FIT_BADGE: Record<string, string> = {
  Top: "text-emerald-400 border-emerald-500/40",
  Gut: "text-bronze border-bronze/40",
  "Eher nicht": "text-stone/50 border-stone-dark",
};

const POTENZIAL_BADGE: Record<string, string> = {
  Hoch: "text-yellow-300 border-yellow-500/40",
  Mittel: "text-stone border-stone-dark",
  Niedrig: "text-stone/40 border-stone-dark",
};

const STATUSES: BrandStatus[] = [
  "Neu", "Kontaktiert", "Antwort", "Gespräch", "Angebot", "Onboarded", "Abgelehnt", "Später", "Inaktiv"
];

const STATUS_COLOR: Record<BrandStatus, string> = {
  Neu:          "text-cream/60",
  Kontaktiert:  "text-blue-400",
  Antwort:      "text-yellow-400",
  Gespräch:     "text-orange-400",
  Angebot:      "text-purple-400",
  Onboarded:    "text-green-400",
  Abgelehnt:    "text-stone/40",
  Später:       "text-stone/60",
  Inaktiv:      "text-stone/30",
};

const ROW_COLOR: Record<BrandStatus, string> = {
  Neu:          "",
  Kontaktiert:  "",
  Antwort:      "",
  Gespräch:     "",
  Angebot:      "",
  Onboarded:    "opacity-60",
  Abgelehnt:    "opacity-30",
  Später:       "opacity-50",
  Inaktiv:      "opacity-20",
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

interface Props {
  initialBrands: Brand[];
  currentUser: string;
  updateStatusAction: (id: string, status: BrandStatus) => Promise<void>;
}

export default function PipelineClient({ initialBrands, currentUser, updateStatusAction }: Props) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"alle" | "meine" | "neu" | "überfällig">("alle");
  const [fitFilter, setFitFilter] = useState("");
  const [kategorieFilter, setKategorieFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Supabase Realtime — live updates ohne Refresh
  useEffect(() => {
    const channel = supabase
      .channel("pipeline_brands")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pipeline_brands" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBrands((prev) => [payload.new as Brand, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setBrands((prev) =>
              prev.map((b) => (b.id === payload.new.id ? (payload.new as Brand) : b))
            );
          } else if (payload.eventType === "DELETE") {
            setBrands((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = brands.filter((b) => {
    if (filter === "meine" && b.zugewiesen !== currentUser) return false;
    if (filter === "neu" && b.status !== "Neu") return false;
    if (filter === "überfällig" && !isOverdue(b.datum_naechste_aktion)) return false;
    if (fitFilter && b.hub42_fit !== fitFilter) return false;
    if (kategorieFilter && b.kategorie !== kategorieFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.website ?? "").toLowerCase().includes(q) ||
        (b.produkt ?? "").toLowerCase().includes(q) ||
        (b.standort ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleStatusChange(id: string, status: BrandStatus) {
    setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    startTransition(async () => {
      await updateStatusAction(id, status);
      router.refresh();
    });
  }

  const counts = {
    alle: brands.length,
    meine: brands.filter((b) => b.zugewiesen === currentUser).length,
    neu: brands.filter((b) => b.status === "Neu").length,
    überfällig: brands.filter((b) => isOverdue(b.datum_naechste_aktion) && b.status !== "Abgelehnt" && b.status !== "Onboarded").length,
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {(["alle", "meine", "neu", "überfällig"] as const).map((f) => (
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
            { label: "Fit", value: fitFilter, set: setFitFilter, opts: ["Top", "Gut", "Eher nicht"] },
            { label: "Kategorie", value: kategorieFilter, set: setKategorieFilter, opts: ["Food", "Drinks", "Beauty", "Lifestyle", "Home", "Sonstiges"] },
            { label: "Status", value: statusFilter, set: setStatusFilter, opts: STATUSES },
          ].map(({ label, value, set, opts }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => set(e.target.value)}
              className={`bg-green-dark border text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-bronze transition-colors cursor-pointer ${
                value ? "border-bronze text-bronze" : "border-stone-dark text-stone hover:border-stone"
              }`}
            >
              <option value="">{label}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {(fitFilter || kategorieFilter || statusFilter) && (
            <button
              onClick={() => { setFitFilter(""); setKategorieFilter(""); setStatusFilter(""); }}
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
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Brand</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden md:table-cell">Kategorie</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden lg:table-cell">Zugewiesen</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Status</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden sm:table-cell">Nächste Aktion</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone text-xs font-mono">
                  Keine Brands gefunden.
                </td>
              </tr>
            )}
            {filtered.map((brand) => (
              <tr
                key={brand.id}
                className={`border-b border-stone-dark/50 hover:bg-green-mid/30 transition-colors ${ROW_COLOR[brand.status]}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-cream font-medium">{brand.name}</p>
                    {brand.hub42_fit && (
                      <span className={`text-[10px] font-mono border px-1.5 py-0.5 leading-none ${FIT_BADGE[brand.hub42_fit] ?? "text-stone border-stone-dark"}`}>
                        {brand.hub42_fit}
                      </span>
                    )}
                    {brand.hub42_potenzial && (
                      <span className={`text-[10px] font-mono border px-1.5 py-0.5 leading-none ${POTENZIAL_BADGE[brand.hub42_potenzial] ?? "text-stone border-stone-dark"}`}>
                        ★ {brand.hub42_potenzial}
                      </span>
                    )}
                  </div>
                  {brand.website && (
                    <p className="text-stone/50 text-xs font-mono truncate max-w-[180px]">{brand.website}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-stone text-xs hidden md:table-cell">{brand.kategorie ?? "—"}</td>
                <td className="px-4 py-3 text-stone text-xs hidden lg:table-cell">{brand.zugewiesen ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={brand.status}
                    onChange={(e) => handleStatusChange(brand.id, e.target.value as BrandStatus)}
                    className={`bg-transparent border border-stone-dark text-xs font-mono px-2 py-1 focus:outline-none focus:border-bronze cursor-pointer ${STATUS_COLOR[brand.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-green-dark text-cream">{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
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
                <td className="px-4 py-3 text-right">
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

      <p className="text-stone/40 text-xs font-mono mt-3 text-right">
        {filtered.length} von {brands.length} Brands · Live via Supabase Realtime
      </p>
    </div>
  );
}
