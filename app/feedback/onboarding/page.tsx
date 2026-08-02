import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPanel, setPanelConsent } from "@/lib/feedback";

export const dynamic = "force-dynamic";

const PANEL_COOKIE = "feedback_panel";

async function submitOnboarding(formData: FormData) {
  "use server";
  const next = (formData.get("next") as string) || "/feedback/scan";
  const consent = formData.get("consent") === "on";
  if (!consent) return;

  const cookieStore = await cookies();
  let panelId = cookieStore.get(PANEL_COOKIE)?.value;
  if (!panelId) {
    const panel = await createPanel();
    panelId = panel.id;
    cookieStore.set(PANEL_COOKIE, panelId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  await setPanelConsent(panelId, {
    ageRange: (formData.get("age_range") as string) ?? "",
    gender: (formData.get("gender") as string) ?? "",
    householdSize: (formData.get("household_size") as string) ?? "",
    shoppingFrequency: (formData.get("shopping_frequency") as string) ?? "",
  });

  redirect(next);
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Hub42 Feedback-Studio
        </p>
        <h1
          className="text-cream text-3xl tracking-widest mb-2"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Bevor es losgeht
        </h1>
        <p className="text-stone text-sm mb-6">
          Einmalig, dauert 20 Sekunden. Danach kannst du beliebig viele Produkte bewerten.
        </p>

        <form action={submitOnboarding} className="space-y-5">
          <input type="hidden" name="next" value={next ?? "/feedback/scan"} />

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Altersgruppe
            </label>
            <select
              name="age_range"
              required
              className="w-full bg-green-mid border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            >
              <option value="">Bitte wählen</option>
              <option value="<18">unter 18</option>
              <option value="18-29">18–29</option>
              <option value="30-44">30–44</option>
              <option value="45-59">45–59</option>
              <option value="60+">60+</option>
            </select>
          </div>

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Geschlecht
            </label>
            <select
              name="gender"
              required
              className="w-full bg-green-mid border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            >
              <option value="">Bitte wählen</option>
              <option value="weiblich">weiblich</option>
              <option value="männlich">männlich</option>
              <option value="divers">divers</option>
              <option value="keine Angabe">keine Angabe</option>
            </select>
          </div>

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Haushaltsgröße
            </label>
            <select
              name="household_size"
              required
              className="w-full bg-green-mid border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            >
              <option value="">Bitte wählen</option>
              <option value="1">1 Person</option>
              <option value="2">2 Personen</option>
              <option value="3-4">3–4 Personen</option>
              <option value="5+">5+ Personen</option>
            </select>
          </div>

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Wie oft kaufst du in diesem Store ein?
            </label>
            <select
              name="shopping_frequency"
              required
              className="w-full bg-green-mid border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            >
              <option value="">Bitte wählen</option>
              <option value="erstes Mal">erstes Mal hier</option>
              <option value="selten">selten</option>
              <option value="monatlich">etwa monatlich</option>
              <option value="wöchentlich">wöchentlich oder öfter</option>
            </select>
          </div>

          <label className="flex items-start gap-2 text-stone text-xs leading-relaxed">
            <input type="checkbox" name="consent" required className="accent-bronze mt-0.5" />
            <span>
              Ich willige ein, dass meine Bewertungen pseudonymisiert für Forschungszwecke
              (Konsumentenforschung, DSGVO Art. 89) gespeichert und ausgewertet werden. Ein
              Rückschluss auf meine Identität erfolgt nicht.
            </span>
          </label>

          <button
            type="submit"
            className="w-full bg-bronze text-green-dark font-semibold py-3 text-sm hover:bg-bronze-light transition-colors"
          >
            Weiter →
          </button>
        </form>
      </div>
    </div>
  );
}
