"use server";

/**
 * Server Actions des Feedback-Studios.
 *
 * Vorher lagen sie inline in den Seiten und scheiterten bei ungültiger Eingabe
 * still (`if (!name) return`). Jetzt liegen sie gebündelt hier, geben eine
 * `ActionState` zurück und werden von den Client-Formularen per
 * `useActionState` gebunden — Feldfehler landen am Feld, Erfolg als Flash.
 */

import { revalidatePath } from "next/cache";
import {
  archiveProduct,
  createProduct,
  createQuestion,
  createQuestionSet,
  deleteProduct,
  deleteQuestion,
  deleteQuestionSet,
  duplicateQuestionSet,
  findGameToken,
  moveQuestion,
  redeemGameToken,
  restoreProduct,
  setProductQuestionSets,
  updateProduct,
  updateQuestion,
  updateQuestionSet,
  updateSettings,
  type QuestionType,
} from "@/lib/feedback";
import {
  erfolg,
  fehler,
  pflicht,
  text,
  textOderNull,
  zahl,
  type ActionState,
} from "@/lib/action-state";

const STUDIO = "/feedback/admin";

function studioAktualisieren() {
  revalidatePath(STUDIO);
  revalidatePath(`${STUDIO}/questions`);
  revalidatePath(`${STUDIO}/results`);
  revalidatePath(`${STUDIO}/print`);
}

/* ── Produkte ───────────────────────────────────────────────────────────── */

/** Anlegen und Bearbeiten in einem: `id` im Formular entscheidet. */
export async function saveProduct(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const fieldErrors = pflicht(formData, { name: "Produktname" });
  if (Object.keys(fieldErrors).length > 0) {
    return fehler("Bitte die markierten Felder prüfen.", fieldErrors);
  }

  const input = {
    name: text(formData, "name"),
    brand: textOderNull(formData, "brand"),
    store: textOderNull(formData, "store"),
    shelf_code: textOderNull(formData, "shelf_code"),
    batch: textOderNull(formData, "batch"),
    price_enabled: formData.get("price_enabled") === "on",
  };

  const id = text(formData, "id");
  const questionSetIds = formData.getAll("question_sets").map((v) => String(v));

  try {
    if (id) {
      await updateProduct(id, input);
      await setProductQuestionSets(id, questionSetIds);
      studioAktualisieren();
      return erfolg(`„${input.name}“ gespeichert.`);
    }
    const produkt = await createProduct(input, questionSetIds);
    studioAktualisieren();
    return erfolg(`„${produkt.name}“ angelegt. QR-Code ist unten in der Liste.`);
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function archiveProductAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return fehler("Kein Produkt angegeben.");
  try {
    await archiveProduct(id);
    studioAktualisieren();
    return erfolg("Archiviert — für Scouts nicht mehr sichtbar.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function restoreProductAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return fehler("Kein Produkt angegeben.");
  try {
    await restoreProduct(id);
    studioAktualisieren();
    return erfolg("Wieder im Store aktiv.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function deleteProductAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return fehler("Kein Produkt angegeben.");
  try {
    const { ok, ratings } = await deleteProduct(id);
    if (!ok) {
      return fehler(
        `${ratings} Bewertung${ratings === 1 ? "" : "en"} hängt daran — endgültiges Löschen würde die Daten mitnehmen. Nutze Archivieren.`
      );
    }
    studioAktualisieren();
    return erfolg("Produkt gelöscht.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

/* ── Fragensets ─────────────────────────────────────────────────────────── */

/** Anlegen und Umbenennen in einem: `id` im Formular entscheidet. */
export async function saveQuestionSet(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const fieldErrors = pflicht(formData, { name: "Name" });
  if (Object.keys(fieldErrors).length > 0) {
    return fehler("Bitte die markierten Felder prüfen.", fieldErrors);
  }

  const name = text(formData, "name");
  const description = textOderNull(formData, "description");
  const id = text(formData, "id");

  try {
    if (id) {
      await updateQuestionSet(id, name, description);
      studioAktualisieren();
      return erfolg(`„${name}“ gespeichert.`);
    }
    await createQuestionSet(name, description);
    studioAktualisieren();
    return erfolg(`Set „${name}“ angelegt. Jetzt Fragen hinzufügen.`);
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function duplicateQuestionSetAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return fehler("Kein Set angegeben.");
  try {
    const kopie = await duplicateQuestionSet(id);
    studioAktualisieren();
    return erfolg(`„${kopie.name}“ angelegt.`);
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function deleteQuestionSetAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return fehler("Kein Set angegeben.");
  try {
    const { ok, answers } = await deleteQuestionSet(id);
    if (!ok) {
      return fehler(
        `${answers} erhobene Antwort${answers === 1 ? "" : "en"} hängt an diesem Set — Löschen würde sie mitnehmen. Nimm das Set stattdessen aus den Produkten heraus.`
      );
    }
    studioAktualisieren();
    return erfolg("Set gelöscht.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

/* ── Fragen ─────────────────────────────────────────────────────────────── */

const TYPEN: QuestionType[] = ["semantic_diff", "likert", "text"];

/** Anlegen und Bearbeiten in einem: `id` im Formular entscheidet. */
export async function saveQuestion(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = text(formData, "id");
  const questionSetId = text(formData, "question_set_id");
  const type = text(formData, "type") as QuestionType;

  if (!questionSetId) return fehler("Kein Set angegeben.");
  if (!TYPEN.includes(type)) return fehler("Bitte einen Fragetyp wählen.", { type: "Typ fehlt." });

  // Je Typ zählen andere Felder — genau das war am alten Formular nicht ablesbar.
  const fieldErrors: Record<string, string> =
    type === "semantic_diff"
      ? pflicht(formData, { label_left: "Pol links", label_right: "Pol rechts" })
      : pflicht(formData, { prompt: type === "likert" ? "Statement" : "Frage" });

  const scaleMax = zahl(formData, "scale_max");
  if (type !== "text" && scaleMax != null && (scaleMax < 2 || scaleMax > 10)) {
    fieldErrors.scale_max = "Zwischen 2 und 10.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return fehler("Bitte die markierten Felder prüfen.", fieldErrors);
  }

  const input = {
    type,
    prompt: textOderNull(formData, "prompt"),
    labelLeft: type === "text" ? null : textOderNull(formData, "label_left"),
    labelRight: type === "text" ? null : textOderNull(formData, "label_right"),
    scaleMax: type === "text" ? null : scaleMax,
  };

  try {
    if (id) {
      await updateQuestion(id, input);
      studioAktualisieren();
      return erfolg("Frage gespeichert.");
    }
    await createQuestion({ ...input, questionSetId });
    studioAktualisieren();
    return erfolg("Frage hinzugefügt.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function deleteQuestionAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return fehler("Keine Frage angegeben.");
  try {
    const { ok, answers } = await deleteQuestion(id);
    if (!ok) {
      return fehler(
        `${answers} erhobene Antwort${answers === 1 ? "" : "en"} hängt an dieser Frage — Löschen würde sie mitnehmen. Nimm das Set stattdessen aus den Produkten heraus.`
      );
    }
    studioAktualisieren();
    return erfolg("Frage gelöscht.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

export async function moveQuestionAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const id = text(formData, "id");
  const richtung = text(formData, "richtung");
  if (!id || (richtung !== "hoch" && richtung !== "runter")) {
    return fehler("Keine Richtung angegeben.");
  }
  try {
    await moveQuestion(id, richtung);
    studioAktualisieren();
    return erfolg();
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

/* ── Schwellen ──────────────────────────────────────────────────────────── */

export async function saveSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const FELDER = [
    "scout_bronze_threshold",
    "scout_silver_threshold",
    "scout_gold_threshold",
    "game_ticket_interval",
    "comparison_reveal_threshold",
  ] as const;

  const werte = {} as Record<(typeof FELDER)[number], number>;
  const fieldErrors: Record<string, string> = {};

  for (const feld of FELDER) {
    const n = zahl(formData, feld);
    if (n == null || !Number.isInteger(n) || n < 1) {
      fieldErrors[feld] = "Ganze Zahl ab 1.";
    } else {
      werte[feld] = n;
    }
  }

  // Eine aufsteigende Leiter ist Voraussetzung dafür, dass getScoutStatus
  // überhaupt ein sinnvolles „nächstes Level“ findet.
  if (!fieldErrors.scout_silver_threshold && !fieldErrors.scout_bronze_threshold) {
    if (werte.scout_silver_threshold <= werte.scout_bronze_threshold) {
      fieldErrors.scout_silver_threshold = "Muss über Bronze liegen.";
    }
  }
  if (!fieldErrors.scout_gold_threshold && !fieldErrors.scout_silver_threshold) {
    if (werte.scout_gold_threshold <= werte.scout_silver_threshold) {
      fieldErrors.scout_gold_threshold = "Muss über Silber liegen.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fehler("Bitte die markierten Felder prüfen.", fieldErrors);
  }

  try {
    await updateSettings(werte);
    revalidatePath(`${STUDIO}/settings`);
    return erfolg("Gespeichert — gilt ab sofort für alle Scouts.");
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

/* ── Spiel-Tickets ──────────────────────────────────────────────────────── */

export async function redeemTicket(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const fieldErrors = pflicht(formData, { code: "Code", staff: "Dein Name" });
  const outcome = text(formData, "outcome");
  // Eigener Rückgabepfad statt Sammeln im fieldErrors-Objekt: nur so weiß der
  // Compiler danach, dass outcome einer der beiden Werte ist.
  if (outcome !== "gewonnen" && outcome !== "verloren") {
    return fehler("Bitte die markierten Felder prüfen.", {
      ...fieldErrors,
      outcome: "Ergebnis wählen.",
    });
  }
  if (Object.keys(fieldErrors).length > 0) {
    return fehler("Bitte die markierten Felder prüfen.", fieldErrors);
  }

  const code = text(formData, "code").toUpperCase();

  try {
    const token = await findGameToken(code);
    if (!token) return fehler(`Kein Ticket mit dem Code ${code}.`, { code: "Unbekannter Code." });
    if (token.redeemed_at) {
      return fehler(
        `Bereits eingelöst am ${new Date(token.redeemed_at).toLocaleString("de-DE")} von ${token.redeemed_by ?? "unbekannt"}.`
      );
    }

    const eingeloest = await redeemGameToken(code, text(formData, "staff"), outcome);
    if (!eingeloest) return fehler("Ticket wurde parallel schon eingelöst.");

    revalidatePath(`${STUDIO}/redeem`);
    return erfolg(
      outcome === "gewonnen"
        ? "Treffer — 50-€-Gutschein ausstellen!"
        : "Eingelöst — daneben, kein Gewinn."
    );
  } catch (e) {
    return fehler(fehlertext(e));
  }
}

/* ── Hilfsfunktion ──────────────────────────────────────────────────────── */

function fehlertext(e: unknown): string {
  const detail = e instanceof Error ? e.message : String(e);
  console.error("[feedback-studio]", detail);
  return `Speichern fehlgeschlagen: ${detail}`;
}
