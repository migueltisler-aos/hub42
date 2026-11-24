import { cookies } from "next/headers";
import Link from "next/link";
import { ladeSendungen } from "@/lib/wareneingang";
import { ladeNegativeBestaende } from "@/lib/bestand";
import { standortName } from "@/lib/sumup-model";

export const dynamic = "force-dynamic";

export default async function WareneingangPage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";
  const [sendungen, minus] = await Promise.all([ladeSendungen(), ladeNegativeBestaende()]);

  // Ein negativer Bestand ist kein Engpass, sondern ein fehlender Zugang:
  // verkauft wurde, was nie erfasst wurde. Die Meldung gehoert hierher, weil
  // hier die Handlung liegt, die sie aufloest -- das Paket nachtragen.
  const minusJeLaden = [...new Set(minus.map((m) => m.standort_id))].map((s) => ({
    standort: s,
    eans: minus.filter((m) => m.standort_id === s).length,
    stueck: minus.filter((m) => m.standort_id === s).reduce((n, m) => n + m.bestand, 0),
  }));

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">Hub42 Intern</p>
            <h1 className="text-cream text-5xl tracking-widest" style={{ fontFamily: "var(--font-bebas)" }}>
              Wareneingang
            </h1>
            <p className="text-stone text-xs font-mono mt-1">Eingeloggt als: {currentUser}</p>
          </div>
          <Link
            href="/wareneingang/new"
            className="px-4 py-2 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
          >
            + Paket erfassen
          </Link>
        </div>

        {minusJeLaden.map((l) => (
          <div key={l.standort} className="mb-6 border border-red-400/40 bg-red-400/5 px-4 py-3">
            <p className="text-red-400 text-sm font-mono">
              {standortName(l.standort)}: {l.eans} Artikel im Minus, zusammen {l.stueck} Stück.
            </p>
            <p className="text-stone text-xs font-mono mt-1 leading-relaxed">
              Diese Ware wurde verkauft, ohne je als Zugang erfasst zu sein. Solange der
              Eingang fehlt, sind Reichweite, Mindestbestand und Abverkaufsquote dieser
              Artikel falsch. Das Paket nachtragen setzt den Bestand gerade.
            </p>
          </div>
        ))}

        <div className="space-y-2">
          {sendungen.length === 0 && (
            <p className="text-stone text-sm font-mono">Noch keine Wareneingänge erfasst.</p>
          )}
          {sendungen.map((s) => (
            <Link
              key={s.id}
              href={`/wareneingang/${s.id}`}
              className="block bg-green-mid border border-stone-dark px-4 py-3 hover:border-bronze/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cream text-sm font-mono">{s.brand?.name ?? "Ohne Marke"}</p>
                  <p className="text-stone text-xs font-mono mt-0.5">
                    {s.dhl_tracking_nr ?? "kein Tracking"} · {standortName(s.standort_id)} ·{" "}
                    {new Date(s.eingegangen_am).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <span className="text-bronze text-xs font-mono">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
