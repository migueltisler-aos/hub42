import { createHash, randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  EVENT_TYPES,
  pfadWirdGemessen,
  type EventType,
  type TrackPayload,
} from "@/lib/analytics-types";

export const dynamic = "force-dynamic";

/** Fenster, innerhalb dessen Events desselben Besuchers zur gleichen Session zählen. */
const SESSION_FENSTER_MIN = 30;

/**
 * Bot- und Linkvorschau-Filter.
 *
 * Nicht optional: /deck geht per Outreach-Mail raus, und WhatsApp, LinkedIn,
 * Slack & Co. holen die Seite ab, um eine Vorschaukarte zu bauen. Ohne diesen
 * Filter meldet Hub42 "Brand hat das Deck geöffnet", sobald jemand den Link
 * nur in einen Chat einfügt – und genau die Zahl, auf die Follow-ups gestützt
 * werden, wäre die unzuverlässigste im System.
 */
const BOT_MUSTER =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|slackbot|whatsapp|telegrambot|twitterbot|linkedinbot|discord|embedly|quora|pinterest|vercel-screenshot|headlesschrome|lighthouse|monitoring|curl|wget|python-requests|axios|node-fetch/i;

function istBot(ua: string): boolean {
  if (!ua) return true; // kein User-Agent ist selbst schon ein Signal
  return BOT_MUSTER.test(ua);
}

function geraet(ua: string): string {
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|android.*mobile|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Besucher-Kennung ohne IP-Speicherung.
 *
 * Der Tagesstempel im Hash lässt die Kennung täglich rotieren: damit ist
 * "unique visitor" bewusst nur innerhalb eines Tages definiert und es kann
 * kein Langzeitprofil entstehen. Die IP selbst wird nirgends geschrieben.
 */
function besucherHash(ip: string, ua: string): string {
  const salt = process.env.ANALYTICS_SALT ?? "";
  const tag = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${salt}|${tag}`).digest("hex").slice(0, 20);
}

function istEventType(v: unknown): v is EventType {
  return typeof v === "string" && (EVENT_TYPES as readonly string[]).includes(v);
}

/** Begrenzt und säubert Freitext, damit die Tabelle nicht als Ablage missbraucht wird. */
function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function zahl(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export async function POST(request: NextRequest) {
  // Antwort ist immer 204 – auch bei verworfenen Events. Das Frontend soll aus
  // der Antwort nichts über die Filterlogik lernen können und ein
  // Messfehler darf nie im Browser sichtbar werden.
  const still = new Response(null, { status: 204 });

  const ua = request.headers.get("user-agent") ?? "";
  if (istBot(ua)) return still;

  let payload: TrackPayload;
  try {
    payload = (await request.json()) as TrackPayload;
  } catch {
    return still;
  }

  // ── Whitelist ─────────────────────────────────────────────────────────────
  // Bewusst kein echtes Rate-Limit: In-Memory-Zähler sind auf Serverless
  // wirkungslos (jede Instanz zählt für sich). Bei den realen Volumina ist
  // eine strikte Feld- und Längenprüfung der wirksamere Schutz.
  if (!istEventType(payload?.event_type)) return still;
  const path = text(payload.path, 200);
  if (!path || !path.startsWith("/") || !pfadWirdGemessen(path)) return still;

  const meta = payload.meta && typeof payload.meta === "object" ? payload.meta : null;
  if (meta && JSON.stringify(meta).length > 1024) return still;

  // ── Anreichern ────────────────────────────────────────────────────────────
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const visitor_hash = besucherHash(ip, ua);

  const sb = getSupabaseAdmin();

  // ── Session serverseitig ableiten ─────────────────────────────────────────
  // Kein Client-Zustand nötig und damit kein Zugriff auf den Endgerätespeicher,
  // der nach § 25 TDDDG einwilligungspflichtig wäre.
  const seit = new Date(Date.now() - SESSION_FENSTER_MIN * 60_000).toISOString();
  const { data: letztes } = await sb
    .from("analytics_events")
    .select("session_id")
    .eq("visitor_hash", visitor_hash)
    .gte("ts", seit)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();
  const session_id = letztes?.session_id ?? randomUUID();

  // ── Brand-Token auflösen ──────────────────────────────────────────────────
  const link_token = text(payload.link_token, 32);
  let brand_id: string | null = null;
  if (link_token) {
    const { data: link } = await sb
      .from("analytics_links")
      .select("brand_id")
      .eq("token", link_token)
      .maybeSingle();
    brand_id = link?.brand_id ?? null;
  }

  const { error } = await sb.from("analytics_events").insert({
    event_type: payload.event_type,
    path,
    referrer_host: text(payload.referrer_host, 120),
    utm_source: text(payload.utm_source, 60),
    utm_medium: text(payload.utm_medium, 60),
    utm_campaign: text(payload.utm_campaign, 60),
    link_token,
    brand_id,
    visitor_hash,
    session_id,
    device: geraet(ua),
    country: request.headers.get("x-vercel-ip-country"),
    duration_ms: zahl(payload.duration_ms, 0, 4 * 60 * 60 * 1000),
    scroll_pct: zahl(payload.scroll_pct, 0, 100),
    section: text(payload.section, 40),
    meta,
  });

  if (error) {
    console.error("[track] insert fehlgeschlagen:", error.message);
    return still;
  }

  // ── Telegram bei erster Deck-Öffnung einer Brand ──────────────────────────
  if (brand_id && payload.event_type === "pageview") {
    // Fire-and-forget: ein Telegram-Fehler darf das schon geschriebene Event
    // nicht nachträglich zum Fehlschlag machen.
    void meldeErsteOeffnung(brand_id, session_id).catch((e) =>
      console.error("[track] Telegram-Meldung fehlgeschlagen:", e)
    );
  }

  return still;
}

/**
 * Meldet die erste Deck-Öffnung einer Brand nach Telegram.
 *
 * "Erste" heißt: es gibt vor dieser Session kein Pageview dieser Brand. Damit
 * kommt pro Brand genau eine Meldung, egal wie oft danach gelesen wird – der
 * Sinn ist das Signal zum Follow-up, nicht ein Live-Ticker.
 */
async function meldeErsteOeffnung(brandId: string, sessionId: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const sb = getSupabaseAdmin();

  const { count } = await sb
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .eq("event_type", "pageview")
    .neq("session_id", sessionId);

  if ((count ?? 0) > 0) return; // war nicht die erste

  const { data: brand } = await sb
    .from("pipeline_brands")
    .select("name")
    .eq("id", brandId)
    .maybeSingle();

  const name = brand?.name ?? "Unbekannte Brand";
  // Nicht "text" nennen: verdeckt sonst die Helferfunktion text() oben.
  const nachricht = [
    "<b>🔥 Deck geöffnet</b>",
    "",
    `<b>${name}</b> hat das Pre-Launch-Deck zum ersten Mal geöffnet.`,
    "",
    "Guter Zeitpunkt für ein Follow-up.",
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: nachricht, parse_mode: "HTML" }),
  });
}
