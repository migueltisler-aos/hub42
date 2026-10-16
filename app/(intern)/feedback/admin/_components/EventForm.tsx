"use client";

/**
 * Event-Modus an/aus. An: Scouts bewerten nur mit Schiebereglern (keine Text-
 * und Preisfelder, keine Einkaufshäufigkeit), und ab der Schwelle bewerteter
 * Produkte gibt es ein Los für die Verlosung statt Aquarium-Spiel und Kontakt-Opt-ins.
 */

import { useActionState, useState } from "react";
import { saveEventSettings } from "../actions";
import type { Settings } from "@/lib/feedback";
import {
  Checkbox,
  Field,
  Flash,
  NumberInput,
  SubmitButton,
  TextInput,
} from "@/app/(intern)/_components/ui/form";

export default function EventForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(saveEventSettings, null);
  const [schwelle, setSchwelle] = useState(String(settings.raffle_threshold));
  const f = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Flash state={state} />
      <Checkbox
        name="event_mode"
        defaultChecked={settings.event_mode}
        label="Event-Modus an"
        hinweis="Nur Schieberegler, keine Textfelder, Verlosung (falls „Los ab“ > 0) statt Spiel-Tickets."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Event-Name"
          htmlFor="ef-name"
          fehler={f.event_name}
          hinweis="Lose gelten pro Event. Neuer Name = neuer Lostopf."
        >
          <TextInput
            id="ef-name"
            name="event_name"
            defaultValue={settings.event_name ?? ""}
            placeholder="z. B. Tasting 2-Tage"
            fehlerhaft={Boolean(f.event_name)}
          />
        </Field>
        <Field
          label="Los ab"
          htmlFor="ef-schwelle"
          fehler={f.raffle_threshold}
          hinweis="Bewertete Produkte pro Scout. 0 = keine Verlosung."
        >
          <NumberInput
            id="ef-schwelle"
            name="raffle_threshold"
            min={0}
            required
            value={schwelle}
            onChange={(e) => setSchwelle(e.target.value)}
            fehlerhaft={Boolean(f.raffle_threshold)}
            className="w-24"
          />
        </Field>
      </div>
      <SubmitButton>Speichern</SubmitButton>
    </form>
  );
}
