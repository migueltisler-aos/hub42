"use client";

/**
 * Event-Modus an/aus. An: Scouts bewerten nur mit Schiebereglern (keine Text-
 * und Preisfelder, keine Einkaufshäufigkeit), ohne Aquarium-Spiel und Kontakt-Opt-ins.
 */

import { useActionState } from "react";
import { saveEventSettings } from "../actions";
import type { Settings } from "@/lib/feedback";
import { Checkbox, Flash, SubmitButton } from "@/app/(intern)/_components/ui/form";

export default function EventForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(saveEventSettings, null);

  return (
    <form action={formAction} className="space-y-4">
      <Flash state={state} />
      <Checkbox
        name="event_mode"
        defaultChecked={settings.event_mode}
        label="Event-Modus an"
        hinweis="Nur Schieberegler, keine Textfelder, keine Spiel-Tickets."
      />
      <SubmitButton>Speichern</SubmitButton>
    </form>
  );
}
