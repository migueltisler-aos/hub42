"use client";

/**
 * Schwellen einstellen.
 *
 * Vorher fünf nackte Zahlenfelder, deren Bedeutung im Label als Satz stand
 * („Silber Scout ab wie vielen Bewertungen (schaltet Newsletter-Opt-in frei)“).
 * Jetzt zwei Gruppen mit kurzem Label und Hilfetext — und darunter die Leiter,
 * die dabei herauskommt, live gerechnet. Man sieht, was man einstellt.
 */

import { useActionState, useState } from "react";
import { Gamepad2, Medal } from "lucide-react";
import { saveSettings } from "../actions";
import type { Settings } from "@/lib/feedback";
import {
  Field,
  Flash,
  NumberInput,
  SubmitButton,
} from "@/app/(intern)/_components/ui/form";
import { Panel } from "@/app/(intern)/_components/ui/surfaces";

type Feld = keyof Settings;

const GRUPPEN: {
  titel: string;
  nummer: string;
  icon: React.ComponentType<{ size?: number }>;
  hinweis: string;
  felder: { name: Feld; label: string; hinweis: string }[];
}[] = [
  {
    titel: "Scout-Level",
    nummer: "01",
    icon: Medal,
    hinweis:
      "Kumulativer Status: einmal erreicht, bleibt er. Silber und Gold schalten zusätzlich ein Opt-in frei.",
    felder: [
      {
        name: "scout_bronze_threshold",
        label: "Bronze ab",
        hinweis: "Erste Stufe, rein als Status.",
      },
      {
        name: "scout_silver_threshold",
        label: "Silber ab",
        hinweis: "Schaltet das Newsletter-Opt-in frei.",
      },
      {
        name: "scout_gold_threshold",
        label: "Gold ab",
        hinweis: "Schaltet das Jury-Opt-in frei.",
      },
    ],
  },
  {
    titel: "Spiel & Vergleich",
    nummer: "02",
    icon: Gamepad2,
    hinweis:
      "Zweite, unabhängige Schiene: Spiel-Tickets wiederholen sich, der große Vergleich erscheint einmal.",
    felder: [
      {
        name: "game_ticket_interval",
        label: "Spiel-Ticket alle",
        hinweis: "Bei 3 also nach der 3., 6., 9. Bewertung.",
      },
      {
        name: "comparison_reveal_threshold",
        label: "Großer Vergleich ab",
        hinweis: "Zeigt die eigenen Bewertungen gegen den Store-Schnitt.",
      },
    ],
  },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(saveSettings, null);
  const [werte, setWerte] = useState<Record<Feld, string>>({
    scout_bronze_threshold: String(settings.scout_bronze_threshold),
    scout_silver_threshold: String(settings.scout_silver_threshold),
    scout_gold_threshold: String(settings.scout_gold_threshold),
    game_ticket_interval: String(settings.game_ticket_interval),
    comparison_reveal_threshold: String(settings.comparison_reveal_threshold),
  });

  const f = state?.fieldErrors ?? {};
  const zahl = (feld: Feld) => Number(werte[feld]) || 0;

  return (
    <form action={formAction} className="space-y-5">
      <Flash state={state} />

      {GRUPPEN.map((gruppe) => {
        const Icon = gruppe.icon;
        return (
          <Panel
            key={gruppe.titel}
            title={gruppe.titel}
            nummer={gruppe.nummer}
            hinweis={gruppe.hinweis}
            actions={<Icon size={16} />}
          >
            <div className="grid sm:grid-cols-3 gap-4">
              {gruppe.felder.map((feld) => (
                <Field
                  key={feld.name}
                  label={feld.label}
                  htmlFor={`sf-${feld.name}`}
                  hinweis={feld.hinweis}
                  fehler={f[feld.name]}
                >
                  <NumberInput
                    id={`sf-${feld.name}`}
                    name={feld.name}
                    min={1}
                    required
                    value={werte[feld.name]}
                    onChange={(e) =>
                      setWerte((prev) => ({ ...prev, [feld.name]: e.target.value }))
                    }
                    fehlerhaft={Boolean(f[feld.name])}
                    className="w-24"
                  />
                </Field>
              ))}
            </div>
          </Panel>
        );
      })}

      <Panel title="Was der Scout erlebt" nummer="03">
        <Leiter
          bronze={zahl("scout_bronze_threshold")}
          silber={zahl("scout_silver_threshold")}
          gold={zahl("scout_gold_threshold")}
          ticket={zahl("game_ticket_interval")}
          vergleich={zahl("comparison_reveal_threshold")}
        />
      </Panel>

      <SubmitButton>Speichern</SubmitButton>
    </form>
  );
}

/**
 * Bewertung 1 … n als Zeitstrahl mit allen Ereignissen, die dabei ausgelöst
 * werden. Zeigt sofort, ob die eingestellte Leiter Sinn ergibt — z.B. wenn
 * Gold vor dem ersten Spiel-Ticket liegt.
 */
function Leiter({
  bronze,
  silber,
  gold,
  ticket,
  vergleich,
}: {
  bronze: number;
  silber: number;
  gold: number;
  ticket: number;
  vergleich: number;
}) {
  const laenge = Math.max(gold, vergleich, ticket * 3, 6) + 1;
  const schritte = Array.from({ length: Math.min(laenge, 24) }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-end gap-1 overflow-x-auto pb-1">
        {schritte.map((n) => {
          const ereignisse = [
            n === bronze && { text: "Bronze", farbe: "text-bronze-dark bg-bronze/20" },
            n === silber && { text: "Silber", farbe: "text-stone bg-stone/20" },
            n === gold && { text: "Gold", farbe: "text-bronze-light bg-bronze-light/20" },
            ticket > 0 && n % ticket === 0 && { text: "Ticket", farbe: "text-emerald-300 bg-emerald-500/15" },
            n === vergleich && { text: "Vergleich", farbe: "text-cream bg-cream/15" },
          ].filter(Boolean) as { text: string; farbe: string }[];

          return (
            <div key={n} className="flex flex-col items-center gap-1 min-w-11">
              <div className="flex flex-col gap-0.5 items-stretch w-full">
                {ereignisse.map((e) => (
                  <span
                    key={e.text}
                    className={`text-[9px] font-mono uppercase tracking-wider text-center rounded-sm px-1 py-0.5 ${e.farbe}`}
                  >
                    {e.text}
                  </span>
                ))}
              </div>
              <div
                className={`w-full h-1 rounded-full ${
                  ereignisse.length > 0 ? "bg-bronze" : "bg-stone-dark/50"
                }`}
              />
              <span className="text-stone-dark text-[10px] font-mono tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
      <p className="text-stone text-xs mt-3 leading-relaxed">
        Waagerecht: die 1., 2., 3. … Bewertung eines Scouts. Ein Scout mit {gold} Bewertungen ist
        Gold-Scout und hat {ticket > 0 ? Math.floor(gold / ticket) : 0} Spiel-Ticket
        {ticket > 0 && Math.floor(gold / ticket) === 1 ? "" : "s"} bekommen.
      </p>
    </div>
  );
}
