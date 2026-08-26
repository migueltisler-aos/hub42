import { NextRequest, NextResponse } from "next/server";
import type { gmail_v1 } from "googleapis";
import { getGmailClient } from "@/lib/outreach/gmail";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addSuppression } from "@/lib/outreach/suppression";

export const dynamic = "force-dynamic";

/**
 * Push-Endpoint für Gmail Pub/Sub-Benachrichtigungen (History API).
 * Erkennt Replies (Antwort im verfolgten Thread) und Hard-Bounces
 * (Mailer-Daemon/DSN) und stoppt die Sequenz entsprechend. Bounce-Erkennung
 * ist heuristisch (From/Subject-Muster + Empfänger-Abgleich im DSN-Body) —
 * kein vollständiger RFC-3464-Parser, aber ausreichend für die
 * Standard-Bounce-Formate von Google/den üblichen Mailservern.
 */

interface PubSubPushBody {
  message?: { data?: string; messageId?: string; publishTime?: string };
  subscription?: string;
}

interface GmailPushPayload {
  emailAddress: string;
  historyId: string;
}

const BOUNCE_FROM_RE = /mailer-daemon|postmaster/i;
const BOUNCE_SUBJECT_RE =
  /delivery status notification|delivery.*failed|undeliver|returned to sender|nicht zugestellt|unzustellbar/i;

function isNotFoundError(err: unknown): boolean {
  const e = err as { code?: number; response?: { status?: number } } | null;
  return e?.code === 404 || e?.response?.status === 404;
}

function decodeGmailBase64(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractEmail(headerValue: string): string | null {
  const match = headerValue.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractPlainText(message: gmail_v1.Schema$Message): string | null {
  function walk(part: gmail_v1.Schema$MessagePart | undefined): string | null {
    if (!part) return null;
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeGmailBase64(part.body.data);
    }
    for (const child of part.parts ?? []) {
      const found = walk(child);
      if (found) return found;
    }
    return null;
  }
  return walk(message.payload);
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.PUBSUB_VERIFICATION_TOKEN || token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as PubSubPushBody;
  const dataB64 = body.message?.data;
  if (!dataB64) return NextResponse.json({ ok: true });

  const payload = JSON.parse(Buffer.from(dataB64, "base64").toString("utf-8")) as GmailPushPayload;

  try {
    await processHistory(payload.historyId);
  } catch (err) {
    // 200 zurückgeben, damit Pub/Sub nicht endlos redelivert — Fehler ist geloggt,
    // der nächste Webhook-Aufruf holt über die History-API ohnehin alles nach.
    console.error("Gmail-Webhook: Verarbeitung fehlgeschlagen", err);
  }

  return NextResponse.json({ ok: true });
}

async function processHistory(notifiedHistoryId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const gmail = getGmailClient();

  const { data: syncState } = await sb
    .from("outreach_sync_state")
    .select("last_history_id")
    .eq("id", true)
    .single();

  const startHistoryId = syncState?.last_history_id ?? notifiedHistoryId;

  let historyList: gmail_v1.Schema$ListHistoryResponse;
  try {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
    });
    historyList = res.data;
  } catch (err) {
    if (isNotFoundError(err)) {
      // startHistoryId zu alt (Gmail-History-Fenster überschritten) — Sync-Punkt
      // auf den aktuellen Stand setzen, ab jetzt wieder normal weiterlaufen.
      await sb
        .from("outreach_sync_state")
        .update({ last_history_id: notifiedHistoryId, updated_at: new Date().toISOString() })
        .eq("id", true);
      return;
    }
    throw err;
  }

  const messageIds = new Set<string>();
  for (const h of historyList.history ?? []) {
    for (const added of h.messagesAdded ?? []) {
      if (added.message?.id) messageIds.add(added.message.id);
    }
  }

  for (const messageId of messageIds) {
    await handleMessage(gmail, sb, messageId);
  }

  const newHistoryId = historyList.historyId ?? notifiedHistoryId;
  await sb
    .from("outreach_sync_state")
    .update({ last_history_id: newHistoryId, updated_at: new Date().toISOString() })
    .eq("id", true);
}

async function handleMessage(
  gmail: gmail_v1.Gmail,
  sb: ReturnType<typeof getSupabaseAdmin>,
  messageId: string
): Promise<void> {
  const { data: message } = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["From", "Subject", "Message-Id"],
  });

  if ((message.labelIds ?? []).includes("SENT")) return; // eigene gesendete Mail

  const headers = message.payload?.headers ?? [];
  const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
  const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
  const threadId = message.threadId;

  if (BOUNCE_FROM_RE.test(from) || BOUNCE_SUBJECT_RE.test(subject)) {
    await handleBounce(gmail, sb, messageId);
    return;
  }

  if (!threadId) return;

  const { data: lead } = await sb
    .from("pipeline_brands")
    .select("id, email, status")
    .eq("thread_id", threadId)
    .maybeSingle();

  if (!lead) return; // nicht Teil eines von uns verfolgten Outreach-Threads

  const fromEmail = extractEmail(from);
  if (fromEmail && lead.email && fromEmail.toLowerCase() === lead.email.toLowerCase()) {
    await sb.from("email_events").insert({ brand_id: lead.id, type: "reply", raw: { from, subject, messageId } });
    await sb
      .from("pipeline_brands")
      .update({
        outreach_status: "replied",
        status: lead.status === "Neu" || lead.status === "Kontaktiert" ? "Antwort" : lead.status,
      })
      .eq("id", lead.id);
  }
}

async function handleBounce(
  gmail: gmail_v1.Gmail,
  sb: ReturnType<typeof getSupabaseAdmin>,
  messageId: string
): Promise<void> {
  const { data: full } = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
  const bodyText = extractPlainText(full) ?? full.snippet ?? "";

  const { data: activeLeads } = await sb
    .from("pipeline_brands")
    .select("id, email")
    .in("outreach_status", ["queued", "contacted"])
    .not("email", "is", null);

  const match = (activeLeads ?? []).find(
    (l) => l.email && bodyText.toLowerCase().includes(l.email.toLowerCase())
  );

  if (!match || !match.email) {
    console.warn(`Bounce erkannt, aber kein passender Lead gefunden (messageId ${messageId})`);
    return;
  }

  await addSuppression(match.email, "hard_bounce");
  await sb.from("pipeline_brands").update({ outreach_status: "bounced" }).eq("id", match.id);
  await sb.from("email_events").insert({ brand_id: match.id, type: "bounce", raw: { messageId } });
}
