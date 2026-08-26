import { google } from "googleapis";

/**
 * Dünner Wrapper um die Gmail-API für die automatisierte Outreach-Sequenz.
 * Sendet immer plain-text/RFC-2822-Rohmails über EIN Postfach (ENV-gesteuert),
 * damit Threading (In-Reply-To/References) und List-Unsubscribe exakt so
 * gesetzt werden, wie es die Deliverability-Guards vorschreiben.
 */

function getOAuthClient() {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN;

  const missing: string[] = [];
  if (!clientId) missing.push("GMAIL_OAUTH_CLIENT_ID");
  if (!clientSecret) missing.push("GMAIL_OAUTH_CLIENT_SECRET");
  if (!refreshToken) missing.push("GMAIL_OAUTH_REFRESH_TOKEN");
  if (missing.length > 0) {
    throw new Error(`Gmail-OAuth-ENV fehlt: ${missing.join(", ")}`);
  }

  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function getGmailClient() {
  return google.gmail({ version: "v1", auth: getOAuthClient() });
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeMimeWord(text: string): string {
  if (/^[\x00-\x7F]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, "utf-8").toString("base64")}?=`;
}

function wrapBase64(b64: string, lineLength = 76): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += lineLength) {
    lines.push(b64.slice(i, i + lineLength));
  }
  return lines.join("\r\n");
}

function buildRawMessage(opts: {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string | null;
  references?: string | null;
  listUnsubscribe?: string | null;
}): string {
  const headers: string[] = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeMimeWord(opts.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
  ];
  if (opts.inReplyTo) headers.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) headers.push(`References: ${opts.references}`);
  if (opts.listUnsubscribe) headers.push(`List-Unsubscribe: ${opts.listUnsubscribe}`);

  const encodedBody = wrapBase64(Buffer.from(opts.body, "utf-8").toString("base64"));
  return `${headers.join("\r\n")}\r\n\r\n${encodedBody}`;
}

export interface SendGmailInput {
  to: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderDisplayName?: string;
  /** Gmail-threadId, falls Follow-up im selben Thread gesendet werden soll. */
  threadId?: string | null;
  /** RFC-Message-Id-Header (inkl. spitzer Klammern) der Mail, auf die geantwortet wird. */
  inReplyToMessageId?: string | null;
  /** Adresse für List-Unsubscribe (mailto), ohne "mailto:"-Präfix. */
  listUnsubscribeMailto?: string | null;
}

export interface SendGmailResult {
  gmailId: string;
  threadId: string;
  /** RFC-Message-Id-Header DIESER gesendeten Mail — für spätere Follow-up-Threads. */
  messageIdHeader: string;
}

export async function sendGmailMessage(input: SendGmailInput): Promise<SendGmailResult> {
  const gmail = getGmailClient();

  const from = input.senderDisplayName
    ? `"${input.senderDisplayName}" <${input.senderEmail}>`
    : input.senderEmail;

  const raw = buildRawMessage({
    from,
    to: input.to,
    subject: input.subject,
    body: input.body,
    inReplyTo: input.inReplyToMessageId,
    references: input.inReplyToMessageId,
    listUnsubscribe: input.listUnsubscribeMailto ? `<mailto:${input.listUnsubscribeMailto}>` : null,
  });

  const { data } = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodeBase64Url(raw),
      threadId: input.threadId ?? undefined,
    },
  });

  if (!data.id || !data.threadId) {
    throw new Error("Gmail-API hat keine id/threadId für die gesendete Mail zurückgegeben");
  }

  const sent = await gmail.users.messages.get({
    userId: "me",
    id: data.id,
    format: "metadata",
    metadataHeaders: ["Message-Id"],
  });

  const messageIdHeader = sent.data.payload?.headers?.find(
    (h) => h.name?.toLowerCase() === "message-id"
  )?.value;

  if (!messageIdHeader) {
    throw new Error("Konnte den Message-Id-Header der gesendeten Mail nicht lesen");
  }

  return { gmailId: data.id, threadId: data.threadId, messageIdHeader };
}
