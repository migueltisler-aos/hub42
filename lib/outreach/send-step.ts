import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendGmailMessage } from "./gmail";
import { isSuppressed, normalizeEmail } from "./suppression";
import { renderStep, STEP_DELAY_DAYS, type OutreachStep } from "@/lib/templates";
import { buildDeckLink } from "@/lib/analytics-links";
import type { OutreachLead } from "./select-lead";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`ENV ${name} fehlt`);
  return value;
}

export interface SendStepResult {
  skipped: boolean;
  reason?:
    | "already_sent_for_step"
    | "no_email"
    | "no_longer_eligible"
    | "suppressed";
  step?: OutreachStep;
}

/**
 * Sendet (oder loggt bei DRY_RUN) den nächsten fälligen Schritt für einen
 * bereits ausgewählten Lead. Prüft direkt vor dem Versand nochmal
 * Eligibility + Suppression (Race-Schutz zwischen Auswahl und Versand, z. B.
 * wenn zwischenzeitlich eine Reply per Webhook eintrifft) und garantiert über
 * einen Guard + den unique index in email_events, dass pro (brand, step)
 * höchstens einmal 'sent' geschrieben wird.
 */
export async function sendOutreachStep(
  lead: OutreachLead,
  now: Date = new Date()
): Promise<SendStepResult> {
  const sb = getSupabaseAdmin();

  if (!lead.email) return { skipped: true, reason: "no_email" };

  const nextStep = (lead.outreach_status === "queued" ? 0 : lead.last_step + 1) as OutreachStep;

  // Guard 1: pro (brand_id, step) darf es nur ein 'sent'-Event geben.
  const { data: existingEvent, error: existingError } = await sb
    .from("email_events")
    .select("id")
    .eq("brand_id", lead.id)
    .eq("type", "sent")
    .eq("step", nextStep)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingEvent) return { skipped: true, reason: "already_sent_for_step", step: nextStep };

  // Guard 2: Zustand direkt vor dem Versand nochmal frisch lesen (Race
  // zwischen Lead-Auswahl und Versand, z. B. zwischenzeitliche Reply/Bounce).
  const { data: freshLead, error: freshError } = await sb
    .from("pipeline_brands")
    .select("outreach_status, ko_flag")
    .eq("id", lead.id)
    .single();
  if (freshError) throw freshError;
  if (freshLead.ko_flag || !["queued", "contacted"].includes(freshLead.outreach_status)) {
    return { skipped: true, reason: "no_longer_eligible", step: nextStep };
  }

  if (await isSuppressed(lead.email)) {
    return { skipped: true, reason: "suppressed", step: nextStep };
  }

  const senderEmail = requireEnv("SENDER_EMAIL");
  const senderDisplayName = process.env.SENDER_DISPLAY_NAME || undefined;
  const listUnsubscribeMailto = process.env.LIST_UNSUBSCRIBE_MAILTO || senderEmail;

  // Ein Token pro Brand und Outreach-Schritt: idempotent, d. h. ein erneuter
  // Versand desselben Schritts nutzt denselben Token und verteilt die Lesezeit
  // der Brand nicht über mehrere Links.
  const deckLink = await buildDeckLink(lead.id, `outreach-step-${nextStep}`, {
    createdBy: "outreach",
  });

  const rendered = renderStep(nextStep, {
    brandName: lead.name,
    ansprechpartner: lead.ansprechpartner,
    personaSatz: lead.perso_satz ?? "",
    senderName: senderDisplayName ?? "Hub42",
    deckLink,
  });

  const isDryRun = process.env.DRY_RUN === "true";

  let gmailInfo: { threadId?: string; messageIdHeader?: string } = {};

  if (isDryRun) {
    console.log(
      `[DRY_RUN] Würde senden an ${lead.email} (Brand ${lead.name}, Schritt ${nextStep})\nBetreff: ${rendered.subject}\n\n${rendered.body}`
    );
  } else {
    const sendResult = await sendGmailMessage({
      to: lead.email,
      subject: rendered.subject,
      body: rendered.body,
      senderEmail,
      senderDisplayName,
      threadId: rendered.isReply ? lead.thread_id : null,
      inReplyToMessageId: rendered.isReply ? lead.gmail_message_id : null,
      listUnsubscribeMailto,
    });
    gmailInfo = { threadId: sendResult.threadId, messageIdHeader: sendResult.messageIdHeader };
  }

  const { error: insertError } = await sb.from("email_events").insert({
    brand_id: lead.id,
    type: "sent",
    step: nextStep,
    raw: isDryRun ? { dryRun: true } : gmailInfo,
  });
  // 23505 = unique violation -> Race: Event existiert schon, Versand aber
  // bereits passiert (oder parallel passiert) — kein Fehlerfall, nur loggen.
  if (insertError && insertError.code !== "23505") throw insertError;

  await applyStepOutcome(sb, lead, nextStep, now, gmailInfo);

  return { skipped: false, step: nextStep };
}

async function applyStepOutcome(
  sb: ReturnType<typeof getSupabaseAdmin>,
  lead: OutreachLead,
  step: OutreachStep,
  now: Date,
  gmailInfo: { threadId?: string; messageIdHeader?: string }
): Promise<void> {
  const anchorDateStr = lead.datum_erstkontakt ?? now.toISOString().slice(0, 10);
  const anchor = new Date(`${anchorDateStr}T00:00:00.000Z`);

  const nextActionAt =
    step < 3
      ? new Date(anchor.getTime() + STEP_DELAY_DAYS[(step + 1) as OutreachStep] * 24 * 60 * 60 * 1000)
      : null;

  const update: Record<string, unknown> = {
    last_step: step,
    outreach_status: step >= 3 ? "stopped" : "contacted",
    next_action_at: nextActionAt ? nextActionAt.toISOString() : null,
    thread_id: gmailInfo.threadId ?? lead.thread_id,
    gmail_message_id: gmailInfo.messageIdHeader ?? lead.gmail_message_id,
    datum_letzte_aktion: now.toISOString().slice(0, 10),
  };

  if (step === 0) {
    update.datum_erstkontakt = anchorDateStr;
    if (lead.status === "Neu") update.status = "Kontaktiert";
  }

  const { error } = await sb.from("pipeline_brands").update(update).eq("id", lead.id);
  if (error) throw error;
}

export { normalizeEmail };
