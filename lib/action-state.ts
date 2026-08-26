/**
 * Einheitliche Rückmeldung für Server Actions, die per `useActionState` an ein
 * Formular gebunden sind.
 *
 * Vorher scheiterten die Actions im Feedback-Studio still (`if (!name) return`)
 * — das Formular sah aus, als wäre nichts passiert. Jede Action gibt jetzt
 * entweder `erfolg()` oder `fehler()` zurück; das Formular zeigt Feldfehler am
 * Feld und die Meldung als Flash.
 *
 * Die Datei ist absichtlich neutral (weder "use server" noch "use client"),
 * damit Actions und Client-Komponenten denselben Typ importieren können.
 */

export interface ActionState {
  ok: boolean;
  message?: string;
  /** Feldname → Fehlertext, passend zum `name`-Attribut des Inputs. */
  fieldErrors?: Record<string, string>;
  /** Zähler, damit ein wiederholter identischer Erfolg den Flash neu auslöst. */
  stamp?: number;
}

/**
 * Signatur, die `useActionState` erwartet. Der Vorzustand ist beim ersten
 * Rendern `null` (das ist der initialState der Formulare).
 */
export type ActionFn = (
  prev: ActionState | null,
  formData: FormData
) => Promise<ActionState>;

export function erfolg(message?: string): ActionState {
  return { ok: true, message, stamp: Date.now() };
}

export function fehler(
  message: string,
  fieldErrors?: Record<string, string>
): ActionState {
  return { ok: false, message, fieldErrors, stamp: Date.now() };
}

/** Pflichtfeld-Prüfung: sammelt Feldfehler, bevor irgendwas geschrieben wird. */
export function pflicht(
  formData: FormData,
  felder: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, label] of Object.entries(felder)) {
    const value = formData.get(name);
    if (typeof value !== "string" || value.trim() === "") {
      errors[name] = `${label} fehlt.`;
    }
  }
  return errors;
}

export function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Leerer String → null, damit die DB-Spalte NULL bleibt statt "". */
export function textOderNull(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

export function zahl(formData: FormData, name: string): number | null {
  const rohwert = text(formData, name);
  if (rohwert === "") return null;
  const n = Number(rohwert);
  return Number.isFinite(n) ? n : null;
}
