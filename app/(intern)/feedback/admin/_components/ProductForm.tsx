"use client";

/**
 * Ein Formular für Anlegen UND Bearbeiten eines Produkts.
 *
 * Bisher konnte man ein Produkt nur anlegen — Name, Marke, Store, Regalplatz,
 * Charge und die Preisfrage waren danach nur noch per SQL korrigierbar, und die
 * Detailseite konnte ausschließlich Fragensets zuordnen. `saveProduct`
 * unterscheidet über das versteckte `id`-Feld.
 */

import { useActionState } from "react";
import Link from "next/link";
import { saveProduct } from "../actions";
import type { ActionState } from "@/lib/action-state";
import {
  Checkbox,
  Field,
  Flash,
  SubmitButton,
  TextInput,
  Button,
} from "@/app/(intern)/_components/ui/form";

export interface SetOption {
  id: string;
  name: string;
  description: string | null;
  fragen: number;
}

export interface ProduktEntwurf {
  id: string;
  name: string;
  brand: string | null;
  store: string | null;
  shelf_code: string | null;
  batch: string | null;
  price_enabled: boolean;
  setIds: string[];
}

export default function ProductForm({
  produkt,
  questionSets,
  onFertig,
  storeVorschlag,
}: {
  /** Fehlt = Anlegen-Modus. */
  produkt?: ProduktEntwurf;
  questionSets: SetOption[];
  /** Wird nach erfolgreichem Speichern aufgerufen (Panel/Karte zuklappen). */
  onFertig?: () => void;
  /** Häufigster Store der Bestandsprodukte, als Vorbelegung beim Anlegen. */
  storeVorschlag?: string;
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionState | null, formData: FormData) => {
      const ergebnis = await saveProduct(prev, formData);
      if (ergebnis?.ok) onFertig?.();
      return ergebnis;
    },
    null
  );

  const f = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {produkt && <input type="hidden" name="id" value={produkt.id} />}
      <Flash state={state} />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Produktname" htmlFor="pf-name" pflicht fehler={f.name} className="sm:col-span-2">
          <TextInput
            id="pf-name"
            name="name"
            required
            defaultValue={produkt?.name ?? ""}
            fehlerhaft={Boolean(f.name)}
            placeholder="z.B. Ostmann Bio-Chili"
          />
        </Field>

        <Field label="Marke" htmlFor="pf-brand" hinweis="Erscheint klein unter dem Produktnamen.">
          <TextInput id="pf-brand" name="brand" defaultValue={produkt?.brand ?? ""} />
        </Field>

        <Field label="Store / Standort" htmlFor="pf-store">
          <TextInput
            id="pf-store"
            name="store"
            defaultValue={produkt?.store ?? storeVorschlag ?? ""}
            placeholder="z.B. Hub42 Alexa"
          />
        </Field>

        <Field
          label="Regalplatz"
          htmlFor="pf-shelf"
          hinweis="Wird pro Bewertung mitgeschrieben — macht Regalplätze vergleichbar."
        >
          <TextInput
            id="pf-shelf"
            name="shelf_code"
            defaultValue={produkt?.shelf_code ?? ""}
            placeholder="z.B. Regal 4B"
          />
        </Field>

        <Field label="Charge" htmlFor="pf-batch" hinweis="Trennt Rezeptur-Stände in der Auswertung.">
          <TextInput
            id="pf-batch"
            name="batch"
            defaultValue={produkt?.batch ?? ""}
            placeholder="z.B. 2026-07"
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="price_enabled"
            label="Preisfrage stellen (Van Westendorp)"
            hinweis="Vier Preisangaben am Ende der Bewertung. Verlängert den Ablauf merklich."
            defaultChecked={produkt?.price_enabled ?? false}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div>
            <p className="text-cream text-sm font-medium">Fragensets</p>
            <p className="text-stone text-xs mt-0.5">
              Hedonische Skala und Preisfragen sind fest — hier kommt alles dazu, was zusätzlich
              gefragt wird.
            </p>
          </div>
          <Link
            href="/feedback/admin/questions"
            className="text-bronze text-xs hover:text-bronze-light transition-colors whitespace-nowrap"
          >
            verwalten →
          </Link>
        </div>

        {questionSets.length === 0 ? (
          <p className="text-stone text-sm border border-dashed hairline rounded-sm px-4 py-3">
            Noch keine Fragensets angelegt.{" "}
            <Link href="/feedback/admin/questions" className="text-bronze underline">
              Jetzt anlegen
            </Link>
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {questionSets.map((set) => (
              <Checkbox
                key={set.id}
                name="question_sets"
                value={set.id}
                label={set.name}
                hinweis={`${set.fragen} Frage${set.fragen === 1 ? "" : "n"}${
                  set.description ? ` · ${set.description}` : ""
                }`}
                defaultChecked={produkt ? produkt.setIds.includes(set.id) : false}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <SubmitButton>{produkt ? "Änderungen speichern" : "Produkt anlegen"}</SubmitButton>
        {onFertig && (
          <Button type="button" variante="quiet" onClick={onFertig}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
