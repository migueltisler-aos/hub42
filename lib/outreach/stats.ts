import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { startOfBerlinDay } from "./time";
import { getDailyCap } from "./cap";

export interface OutreachStats {
  sentToday: number;
  dailyCap: number;
  bounceRate: number | null;
  replyRate: number | null;
  statusCounts: Record<string, number>;
}

export async function getOutreachStats(now: Date = new Date()): Promise<OutreachStats> {
  const sb = getSupabaseAdmin();
  const dayStart = startOfBerlinDay(now);

  const [sentTodayRes, totalSentRes, totalBouncedRes, totalRepliedRes, statusRowsRes] = await Promise.all([
    sb
      .from("email_events")
      .select("id", { count: "exact", head: true })
      .eq("type", "sent")
      .gte("created_at", dayStart.toISOString()),
    sb.from("email_events").select("id", { count: "exact", head: true }).eq("type", "sent"),
    sb.from("email_events").select("id", { count: "exact", head: true }).eq("type", "bounce"),
    sb.from("email_events").select("id", { count: "exact", head: true }).eq("type", "reply"),
    sb.from("pipeline_brands").select("outreach_status"),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statusRowsRes.data ?? []) {
    const key = row.outreach_status as string;
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  let dailyCap = 0;
  try {
    dailyCap = getDailyCap();
  } catch {
    dailyCap = 0;
  }

  const totalSent = totalSentRes.count ?? 0;

  return {
    sentToday: sentTodayRes.count ?? 0,
    dailyCap,
    bounceRate: totalSent > 0 ? (totalBouncedRes.count ?? 0) / totalSent : null,
    replyRate: totalSent > 0 ? (totalRepliedRes.count ?? 0) / totalSent : null,
    statusCounts,
  };
}
