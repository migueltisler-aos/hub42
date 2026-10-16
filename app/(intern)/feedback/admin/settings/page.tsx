import { getSettings } from "@/lib/feedback";
import { PageShell, Panel } from "@/app/(intern)/_components/ui/surfaces";
import SettingsForm from "../_components/SettingsForm";
import EventForm from "../_components/EventForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <PageShell
      eyebrow="Register 05"
      title="Schwellen"
      lead="Wann ein Scout aufsteigt, wann ein Spiel-Ticket fällt, wann der große Vergleich erscheint. Gilt sofort für alle Scouts, ohne Deploy."
      back={{ href: "/feedback/admin", label: "Produkte" }}
    >
      <Panel title="Event-Modus" nummer="00">
        <EventForm settings={settings} />
      </Panel>
      <div className="mt-8">
        <SettingsForm settings={settings} />
      </div>
    </PageShell>
  );
}
