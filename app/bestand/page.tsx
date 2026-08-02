import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { abgangBuchen, ladeBestandReichweite, type AbgangQuelle } from "@/lib/bestand";

const STANDORT_STANDARD = "alexa-berlin";

async function buchen(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const gebuchtVon = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const ean = formData.get("ean") as string;
  const menge = Number(formData.get("menge"));
  const quelle = formData.get("quelle") as AbgangQuelle;
  if (!ean || !menge || menge <= 0) return;

  await abgangBuchen({
    ean,
    standort_id: (formData.get("standort_id") as string) || STANDORT_STANDARD,
    menge,
    quelle,
    notiz: (formData.get("notiz") as string) || null,
    gebucht_von: gebuchtVon,
  });

  redirect("/bestand");
}

export default async function BestandPage({
  searchParams,
}: {
  searchParams: Promise<{ standort?: string }>;
}) {
  const { standort } = await searchParams;
  const standortId = standort || STANDORT_STANDARD;
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const bestand = await ladeBestandReichweite(standortId);

  const baseClass =
    "w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze";

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">Hub42 Intern</p>
          <h1 className="text-cream text-5xl tracking-widest" style={{ fontFamily: "var(--font-bebas)" }}>
            Bestand
          </h1>
          <p className="text-stone text-xs font-mono mt-1">
            {standortId} · Eingeloggt als: {currentUser}
          </p>
        </div>

        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-stone text-xs uppercase tracking-widest text-left border-b border-stone-dark">
                <th className="py-2 pr-4">Artikel</th>
                <th className="py-2 pr-4">Marke</th>
                <th className="py-2 pr-4 text-right">Bestand</th>
                <th className="py-2 pr-4 text-right">Ø/Tag (14T)</th>
                <th className="py-2 pr-4 text-right">Mindestbestand</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bestand.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-stone">
                    Kein Bestand erfasst.
                  </td>
                </tr>
              )}
              {bestand.map((b) => (
                <tr key={b.ean} className="border-b border-stone-dark/40">
                  <td className="py-2 pr-4 text-cream">{b.artikel_name ?? b.ean}</td>
                  <td className="py-2 pr-4 text-stone">{b.brand_name ?? "—"}</td>
                  <td className="py-2 pr-4 text-cream text-right">{b.bestand}</td>
                  <td className="py-2 pr-4 text-stone text-right">{b.verkauf_pro_tag}</td>
                  <td className="py-2 pr-4 text-stone text-right">{b.mindestbestand}</td>
                  <td className="py-2 pr-4">
                    {b.nachbestellung_empfohlen ? (
                      <span className="text-red-400">Nachbestellung empfohlen</span>
                    ) : b.nachbestellung_gesperrt ? (
                      <span className="text-stone/50">Nachbestellung läuft bereits</span>
                    ) : (
                      <span className="text-emerald-400/70">ok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-stone-dark pt-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Muster-Entnahme (Tasting) / Abschrift buchen
          </p>
          <form action={buchen} className="grid sm:grid-cols-2 gap-4">
            <input type="hidden" name="standort_id" value={standortId} />
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">EAN *</label>
              <select name="ean" required className={baseClass}>
                <option value="">—</option>
                {bestand.map((b) => (
                  <option key={b.ean} value={b.ean}>
                    {b.artikel_name ?? b.ean} ({b.ean})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Menge *</label>
              <input name="menge" type="number" min={1} required className={baseClass} />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Grund *</label>
              <select name="quelle" required className={baseClass}>
                <option value="muster_entnahme">Muster-Entnahme (Tasting)</option>
                <option value="abschrift">Abschrift (Bruch/MHD abgelaufen/Verlust)</option>
              </select>
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Notiz</label>
              <input name="notiz" placeholder="z.B. Tasting-Event 29.07." className={baseClass} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="px-6 py-3 bg-bronze text-green-dark text-sm font-semibold hover:bg-bronze-light transition-colors"
              >
                Buchen →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
