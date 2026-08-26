"use client";

/**
 * Eine Aktion an einer Zeile/Karte (archivieren, löschen, verschieben,
 * duplizieren) als eigenes Mini-Formular mit eigener Rückmeldung.
 *
 * Der Grund für die eigene Komponente: die Löschpfade können begründet
 * scheitern (an einer Frage hängen schon Antworten, an einem Produkt hängen
 * Bewertungen). Diese Begründung muss der Nutzer sehen — vorher wären solche
 * Fälle unbemerkt verpufft.
 */

import { useActionState } from "react";
import type { ActionFn } from "@/lib/action-state";
import { ConfirmSubmit, Flash, SubmitButton } from "@/app/(intern)/_components/ui/form";

export default function RowAction({
  action,
  felder,
  children,
  bestaetigung,
  variante = "ghost",
  icon,
  title,
  className = "",
}: {
  action: ActionFn;
  /** Verstecke Felder, z.B. { id, richtung } */
  felder: Record<string, string>;
  children: React.ReactNode;
  /** Gesetzt = fragt vor dem Ausführen einmal nach. */
  bestaetigung?: string;
  variante?: "primary" | "ghost" | "danger" | "quiet";
  icon?: React.ComponentType<{ size?: number }>;
  title?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className={className} title={title}>
      {Object.entries(felder).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {bestaetigung ? (
        <ConfirmSubmit frage={bestaetigung} variante={variante} icon={icon}>
          {children}
        </ConfirmSubmit>
      ) : (
        <SubmitButton variante={variante} klein icon={icon}>
          {children}
        </SubmitButton>
      )}
      {state?.message && (
        <div className="mt-1.5 max-w-xs">
          <Flash state={state} />
        </div>
      )}
    </form>
  );
}
