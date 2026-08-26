import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOutreachStats } from "@/lib/outreach/stats";

export const dynamic = "force-dynamic";

function formatPct(v: number | null): string {
  return v === null ? "–" : `${(v * 100).toFixed(1)} %`;
}

export default async function OutreachAdminPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("pipeline_auth")?.value;
  if (!auth || auth !== process.env.PIPELINE_PASSWORD) {
    redirect("/pipeline/login?from=/admin/outreach");
  }

  const stats = await getOutreachStats();
  const activeLeads = (stats.statusCounts["queued"] ?? 0) + (stats.statusCounts["contacted"] ?? 0);

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">Hub42 Intern</p>
          <h1
            className="text-cream text-5xl tracking-widest"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Outreach
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Heute gesendet" value={`${stats.sentToday} / ${stats.dailyCap || "–"}`} />
          <StatCard label="Bounce-Rate" value={formatPct(stats.bounceRate)} />
          <StatCard label="Reply-Rate" value={formatPct(stats.replyRate)} />
          <StatCard label="Aktive Leads" value={String(activeLeads)} />
        </div>

        <div>
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
            Leads je Outreach-Status
          </p>
          <div className="space-y-1">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div
                key={status}
                className="flex justify-between border-b border-stone-dark/40 py-2 text-sm font-mono text-cream"
              >
                <span>{status}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-bronze/30 bg-green-mid/10 p-4">
      <p className="text-stone text-xs font-mono uppercase tracking-widest mb-1">{label}</p>
      <p className="text-cream text-2xl font-mono">{value}</p>
    </div>
  );
}
