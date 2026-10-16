import { getRaffleEntries, getSettings } from "@/lib/feedback";
import {
  EmptyState,
  PageShell,
  Panel,
  SectionHead,
  Stamp,
} from "@/app/(intern)/_components/ui/surfaces";
import DrawForm from "../_components/DrawForm";

export const dynamic = "force-dynamic";

export default async function VerlosungPage() {
  const settings = await getSettings();
  const eventName = settings.event_name || "Event";
  const lose = await getRaffleEntries(eventName);
  const gezogen = lose.filter((l) => l.drawn_at).sort((a, b) => b.drawn_at!.localeCompare(a.drawn_at!));

  return (
    <PageShell
      eyebrow="Register 07"
      title="Verlosung"
      lead={`Lostopf „${eventName}“: ${lose.length} Lose, davon ${lose.length - gezogen.length} noch offen. Gewinner zeigen ihren Code auf dem Handy vor.`}
      back={{ href: "/feedback/admin", label: "Produkte" }}
    >
      {!settings.event_mode ? (
        <p className="text-stone text-sm mb-6">
          Der Event-Modus ist aus – neue Lose entstehen erst, wenn er unter Schwellen eingeschaltet ist.
        </p>
      ) : (
        settings.raffle_threshold === 0 && (
          <p className="text-stone text-sm mb-6">
            Verlosung ist aus („Los ab“ = 0) – es entstehen keine neuen Lose.
          </p>
        )
      )}

      <Panel title="Ziehen" nummer="01">
        <DrawForm eventName={eventName} />
      </Panel>

      <div className="mt-8">
        <SectionHead>Gezogen</SectionHead>
        {gezogen.length === 0 ? (
          <EmptyState titel="Noch nichts gezogen." text="Preis eintragen und „Los ziehen“ drücken." />
        ) : (
          <div className="space-y-3">
            {gezogen.map((l) => (
              <div
                key={l.id}
                className="ticket-perforation bg-sage-warm rounded-sm px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1"
                style={{ ["--perf-bg" as string]: "var(--color-green-dark)" }}
              >
                <span className="text-green-dark font-mono tracking-[0.2em] text-lg">{l.code}</span>
                <Stamp tone="gut">{l.prize}</Stamp>
                <span className="text-stone-dark text-xs font-mono ml-auto">
                  {new Date(l.drawn_at!).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
