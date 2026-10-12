"use client";

import { useActionState, useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { ActionFn } from "@/lib/action-state";
import { ALTERSGRUPPEN, GESCHLECHTER, type KassenZahlung } from "@/lib/sumup-model";
import { Flash, SubmitButton } from "../_components/ui/form";
import { useAutoRefresh } from "../_components/useAutoRefresh";

const euro = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const uhrzeit = (iso: string) =>
  new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const datum = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" });

function produktText(z: KassenZahlung) {
  if (z.produkte.length === 0) return "ohne Artikel (Betrag frei eingegeben)";
  return z.produkte.map((p) => `${p.menge > 1 ? `${p.menge}× ` : ""}${p.name}`).join(", ");
}

const offen = (z: KassenZahlung) => !z.umfrage && z.status === "SUCCESSFUL";

export default function KasseClient({
  zahlungen,
  syncFehler,
  speichernAction,
}: {
  zahlungen: KassenZahlung[];
  syncFehler: string | null;
  speichernAction: ActionFn;
}) {
  // Kurzes Intervall: nach dem Kassieren in der SumUp-App soll die Zahlung
  // hier auftauchen, ohne dass jemand neu laden muss.
  useAutoRefresh(8_000);

  const [state, formAction] = useActionState(speichernAction, null);
  // Ohne Wahl: automatisch die neueste offene Zahlung. Eine angetippte Zahlung
  // gilt, bis danach erfolgreich gespeichert wurde (abgeleitet über den Stempel,
  // statt per Effect zurückzusetzen) – dann springt es zur nächsten offenen.
  const [wahl, setWahl] = useState<{ id: string; basis: number } | null>(null);
  const stempel = state?.stamp ?? 0;
  const gewaehlt = wahl && (!state?.ok || stempel === wahl.basis) ? wahl.id : null;
  const setGewaehlt = (id: string) => setWahl({ id, basis: stempel });

  const aktivId = gewaehlt ?? zahlungen.find(offen)?.id ?? null;
  const aktiv = zahlungen.find((z) => z.id === aktivId) ?? null;

  return (
    <div className="space-y-5">
      {syncFehler && (
        <p className="flex items-start gap-2 text-amber-300 text-xs border border-amber-400/40 rounded-sm px-3 py-2">
          <TriangleAlert size={14} className="shrink-0 mt-0.5" aria-hidden />
          <span>SumUp gerade nicht abrufbar – zeige den letzten Stand. ({syncFehler})</span>
        </p>
      )}

      <Flash state={state} />

      {aktiv ? (
        <UmfrageFormular
          // Neu mounten bei anderer Zahlung → leere Auswahl. Bewusst nicht am
          // Stempel: nach einem Fehler sollen die Eingaben stehen bleiben.
          key={aktiv.id}
          zahlung={aktiv}
          formAction={formAction}
        />
      ) : (
        <p className="text-stone text-sm border hairline rounded-sm px-4 py-6 text-center">
          Keine offene Zahlung. In der SumUp-App kassieren – sie erscheint hier nach wenigen Sekunden.
        </p>
      )}

      <section>
        <h2 className="text-stone text-[10px] font-mono tracking-[0.3em] uppercase mb-2">Letzte Zahlungen</h2>
        <ul className="space-y-1.5">
          {zahlungen.map((z) => (
            <li key={z.id}>
              <button
                type="button"
                onClick={() => setGewaehlt(z.id)}
                disabled={z.status !== "SUCCESSFUL"}
                aria-pressed={z.id === aktivId}
                className={`w-full text-left rounded-sm border px-3 py-2.5 min-h-11 transition-colors disabled:opacity-50 ${
                  z.id === aktivId
                    ? "border-bronze bg-bronze/10"
                    : "border-stone-dark/60 hover:border-bronze/50"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-cream text-sm font-mono tabular-nums">
                    {uhrzeit(z.zeitstempel)} <span className="text-stone text-xs">{datum(z.zeitstempel)}</span>
                  </span>
                  <span className="text-cream text-sm font-mono tabular-nums">{euro(z.betrag)}</span>
                </div>
                <p className="text-stone text-xs mt-0.5 truncate">{produktText(z)}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {z.status !== "SUCCESSFUL" ? (
                    <Badge ton="grau">{z.status.toLowerCase()}</Badge>
                  ) : z.umfrage ? (
                    <Badge ton="gruen">Umfrage ✓</Badge>
                  ) : (
                    <Badge ton="bronze">Umfrage offen</Badge>
                  )}
                  {z.zahlart === "bar" && <Badge ton="grau">bar</Badge>}
                  {z.erstattet > 0 && <Badge ton="amber">erstattet {euro(z.erstattet)}</Badge>}
                  {z.nicht_zugeordnet.length > 0 && (
                    <Badge ton="amber">nicht im Artikelstamm: {z.nicht_zugeordnet.join(", ")}</Badge>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function UmfrageFormular({
  zahlung,
  formAction,
}: {
  zahlung: KassenZahlung;
  formAction: (fd: FormData) => void;
}) {
  const [geschlecht, setGeschlecht] = useState(zahlung.umfrage?.geschlecht ?? "");
  const [alter, setAlter] = useState(zahlung.umfrage?.alter_gruppe ?? "");

  return (
    <form action={formAction} className="bg-green-mid/25 border hairline rounded-sm px-4 py-4 space-y-4">
      <input type="hidden" name="transaktion_id" value={zahlung.id} />
      <input type="hidden" name="geschlecht" value={geschlecht} />
      <input type="hidden" name="alter_gruppe" value={alter} />

      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-cream text-lg font-mono tabular-nums">
            {uhrzeit(zahlung.zeitstempel)} · {euro(zahlung.betrag)}
          </p>
          <p className="text-stone text-xs truncate">{produktText(zahlung)}</p>
        </div>
        {zahlung.umfrage && <Badge ton="gruen">bearbeiten</Badge>}
      </div>

      <Frage titel="Geschlecht">
        <div className="grid grid-cols-3 gap-2">
          {GESCHLECHTER.map((g) => (
            <Wahl key={g.value} aktiv={geschlecht === g.value} onClick={() => setGeschlecht(geschlecht === g.value ? "" : g.value)}>
              {g.label}
            </Wahl>
          ))}
        </div>
      </Frage>

      <Frage titel="Alter">
        <div className="grid grid-cols-3 gap-2">
          {ALTERSGRUPPEN.map((a) => (
            <Wahl key={a} aktiv={alter === a} onClick={() => setAlter(alter === a ? "" : a)}>
              {a}
            </Wahl>
          ))}
        </div>
      </Frage>

      <p className="text-stone text-xs">Alles freiwillig – leer lassen, was der Kunde nicht sagen möchte.</p>
      <SubmitButton className="w-full">Speichern</SubmitButton>
    </form>
  );
}

function Frage({ titel, fehler, children }: { titel: string; fehler?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-cream text-sm font-medium mb-1.5">{titel}</p>
      {children}
      {fehler && <p className="text-amber-300 text-xs mt-1" role="alert">{fehler}</p>}
    </div>
  );
}

function Wahl({ aktiv, onClick, children }: { aktiv: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktiv}
      className={`rounded-sm border min-h-12 text-sm transition-colors ${
        aktiv ? "border-bronze bg-bronze/20 text-cream" : "border-stone-dark/60 text-stone hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

const TOENE = {
  gruen: "border-emerald-400/40 text-emerald-300",
  bronze: "border-bronze/50 text-bronze",
  amber: "border-amber-400/50 text-amber-300",
  grau: "border-stone-dark/60 text-stone",
};

function Badge({ ton, children }: { ton: keyof typeof TOENE; children: React.ReactNode }) {
  return <span className={`text-[11px] border rounded-sm px-1.5 py-0.5 ${TOENE[ton]}`}>{children}</span>;
}
