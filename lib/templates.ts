/**
 * Cold-Outreach-Templates für die automatisierte "Feedback Factory"-Sequenz.
 * Texte sind bewusst Platzhalter (TODO_TEXT_STEP_n) — finale Formulierungen
 * kommen separat und werden hier eingesetzt, ohne die Render-Logik anzufassen.
 */

export const OUTREACH_STEPS = [0, 1, 2, 3] as const;
export type OutreachStep = (typeof OUTREACH_STEPS)[number];

/** Tage nach dem vorherigen Schritt, bis der nächste fällig ist. */
export const STEP_DELAY_DAYS: Record<OutreachStep, number> = {
  0: 0,
  1: 4,
  2: 7,
  3: 14,
};

export interface TemplateContext {
  brandName: string;
  /** Roher Ansprechpartner-Wert aus pipeline_brands, z. B. "Anna Muster" oder null. */
  ansprechpartner: string | null;
  /** Erster Satz jeder Mail — kommt 1:1 aus pipeline_brands.perso_satz. */
  personaSatz: string;
  /** Name/Signatur des sendenden Postfachs (z. B. "Oliver"). */
  senderName: string;
  /**
   * Deck-Link mit Brand-Token, z. B. https://tryhub42.de/deck?b=k7m2xq9p
   *
   * Noch von keinem Template benutzt: die Mailtexte unten sind Platzhalter
   * (TODO_TEXT_STEP_*). Sobald sie geschrieben werden, gehört HIER der Link
   * hin und nicht die nackte URL – nur mit dem Token ist später beantwortbar,
   * WER das Deck geöffnet hat (siehe lib/analytics-links.ts).
   *
   * Für Schritt 0 bewusst nicht verwenden: die Erstmail bleibt laut
   * step0Body() reiner Text ohne Link, damit sie nicht in Spam-Filter läuft.
   */
  deckLink: string;
}

export interface RenderedStep {
  step: OutreachStep;
  subject: string;
  body: string;
  /** Follow-ups (Schritt 1-3) sind Replies im selben Thread mit "Re:"-Betreff. */
  isReply: boolean;
}

/**
 * Erster Vorname aus dem Ansprechpartner-Feld. Feld ist Freitext
 * ("Anna Muster", "Frau Dr. Muster", ...) — wir nehmen naiv das erste Wort.
 * Fallback "hallo", wenn kein Ansprechpartner hinterlegt ist.
 */
export function firstName(ansprechpartner: string | null | undefined): string {
  const trimmed = ansprechpartner?.trim();
  if (!trimmed) return "hallo";
  const first = trimmed.split(/\s+/)[0]?.replace(/[.,:]$/, "");
  return first || "hallo";
}

function baseSubject(brandName: string): string {
  return `TODO_SUBJECT_TEMPLATE (${brandName})`;
}

function step0Body(ctx: TemplateContext): string {
  const name = firstName(ctx.ansprechpartner);
  // Bewusst KEIN Link, kein Bild, kein HTML — reiner Text für die Erstmail.
  return `${ctx.personaSatz}

TODO_TEXT_STEP_0 (${name}, ${ctx.brandName})

${ctx.senderName}`;
}

function step1Body(ctx: TemplateContext): string {
  return `${ctx.personaSatz}

TODO_TEXT_STEP_1 (${ctx.brandName})

${ctx.senderName}`;
}

function step2Body(ctx: TemplateContext): string {
  return `${ctx.personaSatz}

TODO_TEXT_STEP_2 (${ctx.brandName})

${ctx.senderName}`;
}

function step3Body(ctx: TemplateContext): string {
  // Breakup-Mail: letzter Versuch, danach status='stopped'.
  return `${ctx.personaSatz}

TODO_TEXT_STEP_3_BREAKUP (${ctx.brandName})

${ctx.senderName}`;
}

const STEP_BODY_RENDERERS: Record<OutreachStep, (ctx: TemplateContext) => string> = {
  0: step0Body,
  1: step1Body,
  2: step2Body,
  3: step3Body,
};

export function renderStep(step: OutreachStep, ctx: TemplateContext): RenderedStep {
  const subject = step === 0 ? baseSubject(ctx.brandName) : `Re: ${baseSubject(ctx.brandName)}`;
  return {
    step,
    subject,
    body: STEP_BODY_RENDERERS[step](ctx),
    isReply: step > 0,
  };
}
