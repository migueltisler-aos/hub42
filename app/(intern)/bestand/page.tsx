import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  abgangBuchen,
  ladeBestandReichweite,
  ladeNegativeBestaende,
  type AbgangQuelle,
} from "@/lib/bestand";
import { KASSE_STANDORT, STANDORTE, standortName } from "@/lib/sumup-model";

export const dynamic = "force-dynamic";

const STANDORT_STANDARD = KASSE_STANDORT;

async function buchen(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const gebuchtVon = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const ean = formData.get("ean") as string;
  const menge = Number(formData.get("menge"));
  const quelle = formData.get("quelle") as AbgangQuelle;
  const notiz = ((formData.get("notiz") as string) ?? "").trim();
  // Die Marke sieht Tasting und Abschrift im Portal (Warenkonto): ohne Anlass nicht buchen.
  if (!ean || !menge || menge <= 0 || !notiz) return;

  await abgangBuchen({
    ean,
    standort_id: (formData.get("standort_id") as string) || STANDORT_STANDARD,
    menge,
    quelle,
    notiz,
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

  const [bestand, minus] = await Promise.all([
    ladeBestandReichweite(standortId),
    ladeNegativeBestaende(),
  ]);

  // Ueber alle Laeden, nicht nur ueber den gezeigten: das Minus steht im
  // Alexa, die Seite zeigt seit Beeskow standardmaessig den anderen Laden.
  // Gefiltert waere die Warnung genau dann unsichtbar, wenn sie gilt.
  const minusAnderswo = minus.filter((m) => m.standort_id !== standortId);

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
            {standortName(standortId)} · Eingeloggt als: {currentUser}
          </p>
          <div className="flex gap-2 mt-3">
            {STANDORTE.map((s) => (
              <Link
                key={s}
                href={`/bestand?standort=${s}`}
                className={`px-3 py-1 text-xs font-mono border transition-colors ${
                  s === standortId
                    ? "border-bronze text-bronze"
                    : "border-stone-dark text-stone hover:border-bronze/40"
                }`}
              >
                {standortName(s)}
              </Link>
            ))}
          </div>
        </div>

        {minus.length > 0 && (
          <div className="mb-8 border border-red-400/40 bg-red-400/5 px-4 py-3">
            <p className="text-red-400 text-sm font-mono">
              {minus.length} Artikel im Minus
              {minusAnderswo.length > 0 && minusAnderswo.length === minus.length
                ? ` — alle in ${[...new Set(minusAnderswo.map((m) => standortName(m.standort_id)))].join(", ")}`
                : ""}
              .
            </p>
            <p className="text-stone text-xs font-mono mt-1 leading-relaxed">
              Ein negativer Bestand ist nicht wenig Ware, sondern ein fehlender Zugang:
              verkauft wurde, was nie erfasst wurde. Reichweite und Mindestbestand dieser
              Artikel sind damit falsch.{" "}
              <Link href="/wareneingang/new" className="text-bronze hover:underline">
                Paket nachtragen
              </Link>
              .
            </p>
            <ul className="mt-2 space-y-0.5">
              {minus.slice(0, 5).map((m) => (
                <li key={`${m.standort_id}-${m.ean}`} className="text-stone text-xs font-mono">
                  {m.bestand} · {m.artikel_name ?? m.ean} · {m.brand_name ?? "ohne Marke"} ·{" "}
                  {standortName(m.standort_id)}
                </li>
              ))}
              {minus.length > 5 && (
                <li className="text-stone/50 text-xs font-mono">
                  … und {minus.length - 5} weitere
                </li>
              )}
            </ul>
          </div>
        )}

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
                    Für {standortName(standortId)} ist noch kein Wareneingang gebucht —
                    ohne Zugang kennt die Kasse hier keinen Bestand.
                  </td>
                </tr>
              )}
              {bestand.map((b) => (
                <tr key={b.ean} className="border-b border-stone-dark/40">
                  <td className="py-2 pr-4 text-cream">{b.artikel_name ?? b.ean}</td>
                  <td className="py-2 pr-4 text-stone">{b.brand_name ?? "—"}</td>
                  <td
                    className={`py-2 pr-4 text-right ${b.bestand < 0 ? "text-red-400" : "text-cream"}`}
                  >
                    {b.bestand}
                  </td>
                  <td className="py-2 pr-4 text-stone text-right">{b.verkauf_pro_tag}</td>
                  <td className="py-2 pr-4 text-stone text-right">{b.mindestbestand}</td>
                  <td className="py-2 pr-4">
                    {b.bestand < 0 ? (
                      <span className="text-red-400">Minus: Zugang fehlt</span>
                    ) : b.nachbestellung_empfohlen ? (
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
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Anlass *</label>
              <input name="notiz" required placeholder="z.B. Tasting Samstag 29.07. / MHD abgelaufen" className={baseClass} />
              <p className="text-stone text-xs mt-1">Die Marke sieht den Anlass in ihrem Portal. Tasting wird nicht vergütet.</p>
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
