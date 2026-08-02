import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findGameToken, getRecentRedemptions, redeemGameToken } from "@/lib/feedback";

export const dynamic = "force-dynamic";

async function redeemAction(formData: FormData) {
  "use server";
  const code = (formData.get("code") as string)?.trim();
  const staff = (formData.get("staff") as string)?.trim();
  const outcome = formData.get("outcome") as "gewonnen" | "verloren";
  if (!code || !staff || !outcome) redirect("/feedback/admin/redeem?status=missing");

  const token = await findGameToken(code);
  if (!token) redirect("/feedback/admin/redeem?status=notfound");
  if (token.redeemed_at) redirect("/feedback/admin/redeem?status=already");

  await redeemGameToken(code, staff, outcome);
  redirect(`/feedback/admin/redeem?status=ok&outcome=${outcome}`);
}

const STATUS_MESSAGES: Record<string, { text: string; tone: string }> = {
  ok: { text: "Ticket eingelöst.", tone: "text-bronze" },
  notfound: { text: "Kein Ticket mit diesem Code gefunden.", tone: "text-red-400" },
  already: { text: "Dieses Ticket wurde bereits eingelöst.", tone: "text-red-400" },
  missing: { text: "Bitte alle Felder ausfüllen.", tone: "text-red-400" },
};

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; outcome?: string }>;
}) {
  const { status, outcome } = await searchParams;
  const cookieStore = await cookies();
  const staffDefault = cookieStore.get("pipeline_user")?.value ?? "";
  const recent = await getRecentRedemptions(15);

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/feedback/admin" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
          ← Produkte
        </Link>
        <h1
          className="text-cream text-4xl tracking-widest mt-3 mb-8"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Spiel-Ticket einlösen
        </h1>

        {status && STATUS_MESSAGES[status] && (
          <p className={`text-sm font-mono mb-4 ${STATUS_MESSAGES[status].tone}`}>
            {STATUS_MESSAGES[status].text}
            {status === "ok" && outcome === "gewonnen" && " 🎉 50€-Gutschein ausstellen!"}
          </p>
        )}

        <form action={redeemAction} className="bg-green-mid border border-stone-dark p-6 mb-10 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Code (vom Kunden-Bildschirm)
            </label>
            <input
              name="code"
              required
              autoCapitalize="characters"
              className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-3 text-lg font-mono tracking-[0.3em] uppercase focus:outline-none focus:border-bronze"
            />
          </div>
          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Dein Name
            </label>
            <input
              name="staff"
              required
              defaultValue={staffDefault}
              className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            />
          </div>
          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Ergebnis
            </label>
            <select
              name="outcome"
              required
              className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            >
              <option value="">Bitte wählen</option>
              <option value="gewonnen">🎯 Treffer — gewonnen</option>
              <option value="verloren">Daneben — verloren</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
            >
              Einlösen →
            </button>
          </div>
        </form>

        <h2 className="text-cream text-sm font-mono uppercase tracking-widest mb-4">
          Letzte Einlösungen
        </h2>
        <div className="space-y-2">
          {recent.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-sage-warm px-4 py-2 text-sm"
            >
              <span className="font-mono text-green-dark">{t.code}</span>
              <span className="text-stone-dark text-xs">{t.redeemed_by}</span>
              <span className={t.outcome === "gewonnen" ? "text-bronze-dark font-semibold" : "text-stone-dark"}>
                {t.outcome === "gewonnen" ? "🎯 gewonnen" : "verloren"}
              </span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-stone text-sm">Noch keine Einlösungen.</p>}
        </div>
      </div>
    </div>
  );
}
