"use client";

import { useActionState } from "react";
import { drawRaffle } from "../actions";
import { Field, Flash, SubmitButton, TextInput } from "@/app/(intern)/_components/ui/form";

/** Zieht ein zufälliges offenes Los; der Preis wird beim Los vermerkt. */
export default function DrawForm({ eventName }: { eventName: string }) {
  const [state, formAction] = useActionState(drawRaffle, null);
  const f = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Flash state={state} />
      <input type="hidden" name="event_name" value={eventName} />
      <Field label="Preis" htmlFor="df-prize" pflicht fehler={f.prize}>
        <TextInput
          id="df-prize"
          name="prize"
          list="df-preise"
          placeholder="z. B. 3 Monate Regalplatz"
          fehlerhaft={Boolean(f.prize)}
        />
        <datalist id="df-preise">
          <option value="3 Monate Regalplatz" />
          <option value="Produktpaket" />
        </datalist>
      </Field>
      <SubmitButton>Los ziehen</SubmitButton>
    </form>
  );
}
