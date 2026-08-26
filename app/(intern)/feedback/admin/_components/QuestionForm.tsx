"use client";

/**
 * Frage anlegen oder bearbeiten.
 *
 * Das alte Formular zeigte alle sechs Felder für alle drei Typen gleichzeitig
 * und erklärte im Label, welche gerade zählen („nur für Likert und Freitext“).
 * Hier schaltet die Typwahl die Felder um — und darunter steht live, wie die
 * Frage dem Scout im Store erscheint. Man tippt nicht mehr ins Blinde.
 */

import { useActionState, useState } from "react";
import { Eye } from "lucide-react";
import { saveQuestion } from "../actions";
import type { ActionState } from "@/lib/action-state";
import type { QuestionType } from "@/lib/feedback";
import {
  Button,
  Field,
  Flash,
  NumberInput,
  SubmitButton,
  TapChoice,
  TextInput,
} from "@/app/(intern)/_components/ui/form";

export interface FrageEntwurf {
  id: string;
  type: QuestionType;
  prompt: string | null;
  label_left: string | null;
  label_right: string | null;
  scale_max: number | null;
}

const TYP_OPTIONEN: { value: QuestionType; label: string; hinweis: string }[] = [
  {
    value: "semantic_diff",
    label: "Gegensatzpaar",
    hinweis: "Zwei Pole, dazwischen eine Skala — z.B. unauffällig ↔ auffällig",
  },
  {
    value: "likert",
    label: "Zustimmung",
    hinweis: "Ein Statement von stimme nicht zu bis stimme voll zu",
  },
  { value: "text", label: "Freitext", hinweis: "Offene Antwort, immer optional" },
];

const STANDARD_SKALA: Record<QuestionType, number | null> = {
  semantic_diff: 7,
  likert: 5,
  text: null,
};

export default function QuestionForm({
  questionSetId,
  frage,
  onFertig,
}: {
  questionSetId: string;
  /** Fehlt = neue Frage. */
  frage?: FrageEntwurf;
  onFertig?: () => void;
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionState | null, formData: FormData) => {
      const ergebnis = await saveQuestion(prev, formData);
      if (ergebnis?.ok) onFertig?.();
      return ergebnis;
    },
    null
  );

  const [type, setType] = useState<QuestionType>(frage?.type ?? "semantic_diff");
  const [prompt, setPrompt] = useState(frage?.prompt ?? "");
  const [links, setLinks] = useState(frage?.label_left ?? "");
  const [rechts, setRechts] = useState(frage?.label_right ?? "");
  const [skala, setSkala] = useState<string>(
    frage?.scale_max != null ? String(frage.scale_max) : String(STANDARD_SKALA[type] ?? "")
  );

  const f = state?.fieldErrors ?? {};

  function typWechseln(neu: QuestionType) {
    setType(neu);
    // Skalenlänge auf den Standard des neuen Typs zurückstellen — 7 Stufen bei
    // einem Zustimmungs-Statement wären ungewohnt, 5 bei einem Gegensatzpaar zu grob.
    setSkala(STANDARD_SKALA[neu] != null ? String(STANDARD_SKALA[neu]) : "");
  }

  const skalaZahl = Number(skala) || STANDARD_SKALA[type] || 5;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="question_set_id" value={questionSetId} />
      {frage && <input type="hidden" name="id" value={frage.id} />}
      <Flash state={state} />

      <Field label="Fragetyp" pflicht fehler={f.type}>
        <TapChoice name="type" value={type} onChange={typWechseln} options={TYP_OPTIONEN} />
      </Field>

      {type !== "semantic_diff" && (
        <Field
          label={type === "likert" ? "Statement" : "Frage"}
          htmlFor="qf-prompt"
          pflicht
          fehler={f.prompt}
          hinweis={
            type === "likert"
              ? "Aussage, der man zustimmen kann — nicht als Frage formulieren."
              : "Offene Frage. Der Scout kann sie überspringen."
          }
        >
          <TextInput
            id="qf-prompt"
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fehlerhaft={Boolean(f.prompt)}
            placeholder={
              type === "likert"
                ? "Die Verpackung wirkt nachhaltig."
                : "Was würdest du am Produkt ändern?"
            }
          />
        </Field>
      )}

      {type === "semantic_diff" && (
        <Field
          label="Frage-Überschrift"
          htmlFor="qf-prompt"
          hinweis="Optional. Ohne Überschrift sieht der Scout nur die beiden Pole."
        >
          <TextInput
            id="qf-prompt"
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="z.B. Verpackung"
          />
        </Field>
      )}

      {type !== "text" && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label={type === "semantic_diff" ? "Pol links" : "Skalen-Ende links"}
              htmlFor="qf-left"
              pflicht={type === "semantic_diff"}
              fehler={f.label_left}
            >
              <TextInput
                id="qf-left"
                name="label_left"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                fehlerhaft={Boolean(f.label_left)}
                placeholder={type === "semantic_diff" ? "unauffällig" : "stimme gar nicht zu"}
              />
            </Field>
            <Field
              label={type === "semantic_diff" ? "Pol rechts" : "Skalen-Ende rechts"}
              htmlFor="qf-right"
              pflicht={type === "semantic_diff"}
              fehler={f.label_right}
            >
              <TextInput
                id="qf-right"
                name="label_right"
                value={rechts}
                onChange={(e) => setRechts(e.target.value)}
                fehlerhaft={Boolean(f.label_right)}
                placeholder={type === "semantic_diff" ? "auffällig" : "stimme voll zu"}
              />
            </Field>
          </div>

          <Field
            label="Stufen"
            htmlFor="qf-scale"
            hinweis={`Zwischen 2 und 10. Üblich: ${STANDARD_SKALA[type]} für diesen Typ.`}
            fehler={f.scale_max}
          >
            <NumberInput
              id="qf-scale"
              name="scale_max"
              min={2}
              max={10}
              value={skala}
              onChange={(e) => setSkala(e.target.value)}
              fehlerhaft={Boolean(f.scale_max)}
              className="w-24"
            />
          </Field>
        </>
      )}

      <div className="border hairline rounded-sm bg-green-muted/50 px-4 py-3">
        <p className="flex items-center gap-1.5 text-bronze/70 text-[10px] font-mono uppercase tracking-[0.2em] mb-2.5">
          <Eye size={12} aria-hidden /> So sieht es der Scout
        </p>
        <Vorschau
          type={type}
          prompt={prompt}
          links={links}
          rechts={rechts}
          stufen={skalaZahl}
        />
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton klein>{frage ? "Frage speichern" : "Frage hinzufügen"}</SubmitButton>
        {onFertig && (
          <Button type="button" variante="quiet" klein onClick={onFertig}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Statische Nachbildung der Scout-Ansicht aus components/feedback/RatingForm.tsx
 * (Tap-Reihe, Legende oben, Pole darunter). Absichtlich nicht interaktiv —
 * hier wird nichts beantwortet, nur gezeigt.
 */
function Vorschau({
  type,
  prompt,
  links,
  rechts,
  stufen,
}: {
  type: QuestionType;
  prompt: string;
  links: string;
  rechts: string;
  stufen: number;
}) {
  if (type === "text") {
    return (
      <div>
        <p className="text-stone text-xs font-mono uppercase tracking-widest mb-2">
          {prompt || "…"}{" "}
          <span className="text-stone-dark normal-case tracking-normal">(optional)</span>
        </p>
        <div className="h-14 bg-green-mid border border-stone-dark rounded-sm" />
      </div>
    );
  }

  const legende =
    type === "semantic_diff"
      ? prompt || `${links || "links"} ↔ ${rechts || "rechts"}`
      : prompt || "…";

  return (
    <div>
      <p className="text-stone text-xs font-mono uppercase tracking-widest mb-2.5">{legende}</p>
      <div className="flex justify-between gap-1">
        {Array.from({ length: Math.min(Math.max(stufen, 2), 10) }, (_, i) => i + 1).map((v) => (
          <div
            key={v}
            className="flex-1 aspect-square flex items-center justify-center rounded-sm border border-stone-dark bg-green-mid text-cream text-xs font-mono max-w-11"
          >
            {v}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-stone text-[10px] mt-1">
        <span>{links || "—"}</span>
        <span>{rechts || "—"}</span>
      </div>
    </div>
  );
}
