"use client";

/**
 * Einlöse-Station für Spiel-Tickets.
 *
 * Das wird an der Kasse im Store bedient, meist am Handy und unter Zeitdruck:
 * Code-Feld als Hero mit Autofokus, Ergebnis als zwei große Tap-Kacheln statt
 * <select>, und nach dem Einlösen springt der Fokus zurück ins Code-Feld, damit
 * das nächste Ticket direkt getippt werden kann.
 */

import { useActionState, useEffect, useRef, useState } from "react";
import { Ticket } from "lucide-react";
import { redeemTicket } from "../actions";
import { Field, Flash, SubmitButton, TapChoice, TextInput } from "@/app/(intern)/_components/ui/form";

export default function RedeemForm({ staffDefault }: { staffDefault: string }) {
  const [state, formAction] = useActionState(redeemTicket, null);
  const [outcome, setOutcome] = useState<"gewonnen" | "verloren" | "">("");
  const [code, setCode] = useState("");
  const [erledigterStamp, setErledigterStamp] = useState<number | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Nach erfolgreichem Einlösen die Felder leeren, damit direkt das nächste
  // Ticket getippt werden kann. Angleichen während des Renderns statt im
  // Effekt — das ist der Pfad, den React für „State an Props anpassen" vorsieht.
  if (state?.ok && state.stamp !== erledigterStamp) {
    setErledigterStamp(state.stamp ?? null);
    setCode("");
    setOutcome("");
  }

  useEffect(() => {
    if (state?.ok) codeRef.current?.focus();
  }, [state?.ok, state?.stamp]);

  const f = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <Flash state={state} />

      <Field
        label="Code vom Kundenbildschirm"
        htmlFor="rf-code"
        pflicht
        fehler={f.code}
        hinweis="Sechs Zeichen, ohne 0/O und 1/I — die kommen im Code nicht vor."
      >
        <input
          id="rf-code"
          ref={codeRef}
          name="code"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className={`w-full bg-green-dark/70 border rounded-sm text-cream text-2xl sm:text-3xl font-mono tracking-[0.35em] uppercase text-center px-3 py-4 outline-none transition-colors placeholder:text-stone/25 focus-visible:border-bronze focus-visible:ring-2 focus-visible:ring-bronze/35 ${
            f.code ? "border-amber-400/70" : "border-stone-dark/70"
          }`}
          placeholder="XXXXXX"
        />
      </Field>

      <Field label="Ergebnis am Spiel" pflicht fehler={f.outcome}>
        <TapChoice
          name="outcome"
          value={outcome}
          onChange={setOutcome}
          options={[
            { value: "gewonnen", label: "Treffer", hinweis: "50-€-Gutschein ausstellen" },
            { value: "verloren", label: "Daneben", hinweis: "kein Gewinn" },
          ]}
        />
      </Field>

      <Field label="Dein Name" htmlFor="rf-staff" pflicht fehler={f.staff}>
        <TextInput
          id="rf-staff"
          name="staff"
          required
          defaultValue={staffDefault}
          fehlerhaft={Boolean(f.staff)}
          placeholder="wer einlöst"
        />
      </Field>

      <SubmitButton icon={Ticket}>Ticket einlösen</SubmitButton>
    </form>
  );
}
