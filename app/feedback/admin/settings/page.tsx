import { redirect } from "next/navigation";
import Link from "next/link";
import { getSettings, updateSettings } from "@/lib/feedback";

async function saveSettingsAction(formData: FormData) {
  "use server";
  await updateSettings({
    scout_bronze_threshold: Number(formData.get("scout_bronze_threshold")),
    scout_silver_threshold: Number(formData.get("scout_silver_threshold")),
    scout_gold_threshold: Number(formData.get("scout_gold_threshold")),
    game_ticket_interval: Number(formData.get("game_ticket_interval")),
    comparison_reveal_threshold: Number(formData.get("comparison_reveal_threshold")),
  });
  redirect("/feedback/admin/settings?saved=1");
}

const FIELDS = [
  {
    name: "scout_bronze_threshold",
    label: "Bronze Scout ab wie vielen Bewertungen",
  },
  {
    name: "scout_silver_threshold",
    label: "Silber Scout ab wie vielen Bewertungen (schaltet Newsletter-Opt-in frei)",
  },
  {
    name: "scout_gold_threshold",
    label: "Gold Scout ab wie vielen Bewertungen (schaltet Jury-Opt-in frei)",
  },
  {
    name: "game_ticket_interval",
    label: "Spiel-Ticket alle wie vielen Bewertungen (3, 6, 9 … bei Wert 3)",
  },
  {
    name: "comparison_reveal_threshold",
    label: "Großer Vergleich erscheint nach wie vielen Bewertungen",
  },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/feedback/admin" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
          ← Produkte
        </Link>
        <h1
          className="text-cream text-4xl tracking-widest mt-3 mb-2"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Schwellen einstellen
        </h1>
        <p className="text-stone text-sm mb-8">
          Gilt sofort für alle Scouts, kein Deploy nötig.
        </p>

        {saved && <p className="text-bronze text-sm font-mono mb-4">Gespeichert.</p>}

        <form action={saveSettingsAction} className="bg-green-mid border border-stone-dark p-6 space-y-5">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                {f.label}
              </label>
              <input
                type="number"
                name={f.name}
                min={1}
                required
                defaultValue={settings[f.name]}
                className="w-32 bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
          ))}
          <button
            type="submit"
            className="bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
          >
            Speichern →
          </button>
        </form>
      </div>
    </div>
  );
}
