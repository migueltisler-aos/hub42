import { cookies } from "next/headers";
import Link from "next/link";
import { ladeSendungen } from "@/lib/wareneingang";

export default async function WareneingangPage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";
  const sendungen = await ladeSendungen();

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
                    {s.dhl_tracking_nr ?? "kein Tracking"} · {s.standort_id} ·{" "}
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
