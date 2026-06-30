"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import {
  computeAngebot,
  formatEUR,
  ANGEBOT_STATUSES,
  type Angebot,
  type AngebotStatus,
} from "@/lib/angebote";

const STATUS_COLOR: Record<AngebotStatus, string> = {
  Entwurf: "text-stone/60",
  Versendet: "text-blue-400",
  Angenommen: "text-green-400",
  Abgelehnt: "text-stone/40",
  Abgelaufen: "text-red-400/70",
};

const ROW_COLOR: Record<AngebotStatus, string> = {
  Entwurf: "",
  Versendet: "",
  Angenommen: "",
  Abgelehnt: "opacity-30",
  Abgelaufen: "opacity-40",
};

function isExpired(a: Angebot): boolean {
  if (!a.gueltig_bis) return false;
  if (a.status === "Angenommen" || a.status === "Abgelehnt") return false;
  return new Date(a.gueltig_bis) < new Date(new Date().toDateString());
}

interface Props {
  initialAngebote: Angebot[];
  updateStatusAction: (id: string, status: AngebotStatus) => Promise<void>;
}

export default function AngeboteClient({ initialAngebote, updateStatusAction }: Props) {
  const [angebote, setAngebote] = useState<Angebot[]>(initialAngebote);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Supabase Realtime – live updates ohne Refresh
  useEffect(() => {
    const channel = getSupabaseClient()
      .channel("pipeline_angebote")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pipeline_angebote" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAngebote((prev) => [payload.new as Angebot, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAngebote((prev) =>
              prev.map((a) => (a.id === payload.new.id ? (payload.new as Angebot) : a))
            );
          } else if (payload.eventType === "DELETE") {
            setAngebote((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, []);

  const filtered = angebote.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.angebot_nr.toLowerCase().includes(q) ||
        (a.empfaenger_name ?? "").toLowerCase().includes(q) ||
        (a.titel ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleStatusChange(id: string, status: AngebotStatus) {
    setAngebote((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    startTransition(async () => {
      await updateStatusAction(id, status);
      router.refresh();
    });
  }

  const summe = filtered.reduce(
    (s, a) => s + computeAngebot(a.positionen, a.laufzeit_monate).gesamtBrutto,
    0
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-stone/40 text-xs font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`bg-green-dark border text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-bronze transition-colors cursor-pointer ${
              statusFilter ? "border-bronze text-bronze" : "border-stone-dark text-stone hover:border-stone"
            }`}
          >
            <option value="">Alle</option>
            {ANGEBOT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="text-stone/50 text-xs font-mono hover:text-cream transition-colors"
            >
              × zurücksetzen
            </button>
          )}
        </div>
        <input
          type="search"
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:ml-auto bg-green-mid border border-stone-dark text-cream px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-bronze w-full sm:w-48"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-stone-dark">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-stone-dark bg-green-mid/50">
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Nr.</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Empfänger</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden md:table-cell">Laufzeit</th>
              <th className="text-right px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden sm:table-cell">Gesamt (brutto)</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest">Status</th>
              <th className="text-left px-4 py-3 text-stone text-xs font-mono uppercase tracking-widest hidden lg:table-cell">Gültig bis</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone text-xs font-mono">
                  Noch keine Angebote.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const sum = computeAngebot(a.positionen, a.laufzeit_monate);
              const expired = isExpired(a);
              return (
                <tr
                  key={a.id}
                  className={`border-b border-stone-dark/50 hover:bg-green-mid/30 transition-colors ${ROW_COLOR[a.status]}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-cream font-mono text-xs">{a.angebot_nr}</p>
                    {a.titel && <p className="text-stone/50 text-xs truncate max-w-[160px]">{a.titel}</p>}
                  </td>
                  <td className="px-4 py-3 text-cream">{a.empfaenger_name ?? "—"}</td>
                  <td className="px-4 py-3 text-stone text-xs hidden md:table-cell">
                    {a.laufzeit_monate} Mon.
                  </td>
                  <td className="px-4 py-3 text-right text-cream font-mono text-xs hidden sm:table-cell">
                    {formatEUR(sum.gesamtBrutto)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value as AngebotStatus)}
                      className={`bg-transparent border border-stone-dark text-xs font-mono px-2 py-1 focus:outline-none focus:border-bronze cursor-pointer ${STATUS_COLOR[a.status]}`}
                    >
                      {ANGEBOT_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-green-dark text-cream">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {a.gueltig_bis ? (
                      <span className={`text-xs font-mono ${expired ? "text-red-400" : "text-stone/60"}`}>
                        {a.gueltig_bis}
                      </span>
                    ) : (
                      <span className="text-stone/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/pipeline/angebote/${a.id}/print`}
                      className="text-stone text-xs font-mono hover:text-cream transition-colors mr-3"
                    >
                      Druck
                    </Link>
                    <Link
                      href={`/pipeline/angebote/${a.id}`}
                      className="text-bronze text-xs font-mono hover:underline"
                    >
                      Öffnen →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-stone/40 text-xs font-mono mt-3 text-right">
        {filtered.length} Angebote · Pipeline-Wert (brutto): {formatEUR(summe)} · Live via Supabase
      </p>
    </div>
  );
}
