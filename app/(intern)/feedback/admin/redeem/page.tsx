import { cookies } from "next/headers";
import { getRecentRedemptions } from "@/lib/feedback";
import {
  EmptyState,
  PageShell,
  Panel,
  SectionHead,
  Stamp,
} from "@/app/(intern)/_components/ui/surfaces";
import RedeemForm from "../_components/RedeemForm";

export const dynamic = "force-dynamic";

export default async function RedeemPage() {
  const cookieStore = await cookies();
  const staffDefault = cookieStore.get("pipeline_user")?.value ?? "";
  const recent = await getRecentRedemptions(15);

  return (
    <PageShell
      eyebrow="Register 06"
      title="Spiel-Tickets"
      lead="Ein Scout zeigt den Code auf seinem Bildschirm, spielt am Automaten, und das Ergebnis wird hier festgehalten."
      back={{ href: "/feedback/admin", label: "Produkte" }}
    >
      <Panel title="Einlösen" nummer="01">
        <RedeemForm staffDefault={staffDefault} />
      </Panel>

      <div className="mt-8">
        <SectionHead>Letzte Einlösungen</SectionHead>
        {recent.length === 0 ? (
          <EmptyState
            titel="Noch kein Ticket eingelöst."
            text="Tickets entstehen automatisch, sobald ein Scout die eingestellte Anzahl Bewertungen erreicht."
          />
        ) : (
          <div className="space-y-3">
            {recent.map((t) => (
              <div
                key={t.id}
                className="ticket-perforation bg-sage-warm rounded-sm px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1"
                style={{ ["--perf-bg" as string]: "var(--color-green-dark)" }}
              >
                <span className="text-green-dark font-mono tracking-[0.2em] text-sm">{t.code}</span>
                <span className="text-stone-dark text-xs">
                  Meilenstein {t.milestone} · {t.redeemed_by ?? "unbekannt"}
                </span>
                <span className="text-stone-dark text-xs font-mono ml-auto">
                  {t.redeemed_at
                    ? new Date(t.redeemed_at).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
                <Stamp
                  tone={t.outcome === "gewonnen" ? "gut" : "stone"}
                  className={t.outcome === "gewonnen" ? "!text-emerald-700" : "!text-stone-dark"}
                >
                  {t.outcome === "gewonnen" ? "Treffer" : "daneben"}
                </Stamp>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
