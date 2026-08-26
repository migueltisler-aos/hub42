"use client";

/**
 * Fragenset anlegen oder umbenennen — `id` entscheidet, was `saveQuestionSet`
 * daraus macht.
 */

import { useActionState } from "react";
import { saveQuestionSet } from "../actions";
import type { ActionState } from "@/lib/action-state";
import {
  Button,
  Field,
  Flash,
  SubmitButton,
  TextInput,
} from "@/app/(intern)/_components/ui/form";

export default function QuestionSetForm({
  set,
  onFertig,
}: {
  /** Fehlt = neues Set. */
  set?: { id: string; name: string; description: string | null };
  onFertig?: () => void;
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionState | null, formData: FormData) => {
      const ergebnis = await saveQuestionSet(prev, formData);
      if (ergebnis?.ok) onFertig?.();
      return ergebnis;
    },
    null
  );

  const f = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {set && <input type="hidden" name="id" value={set.id} />}
      <Flash state={state} />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" htmlFor="qsf-name" pflicht fehler={f.name}>
          <TextInput
            id="qsf-name"
            name="name"
            required
            defaultValue={set?.name ?? ""}
            fehlerhaft={Boolean(f.name)}
            placeholder="z.B. Verpackung"
          />
        </Field>
        <Field
          label="Beschreibung"
          htmlFor="qsf-desc"
          hinweis="Nur intern sichtbar — hilft beim Zuordnen."
        >
          <TextInput
            id="qsf-desc"
            name="description"
            defaultValue={set?.description ?? ""}
            placeholder="z.B. Wirkung am Regal"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton klein={Boolean(set)}>{set ? "Speichern" : "Set anlegen"}</SubmitButton>
        {onFertig && (
          <Button type="button" variante="quiet" klein={Boolean(set)} onClick={onFertig}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
