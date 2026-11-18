// SumUp-Abgleich für einen Zeitplan (Vercel Cron im Pro-Tarif oder pg_cron +
// pg_net). Vercel schickt "Authorization: Bearer $CRON_SECRET" mit, sobald die
// Env-Var gesetzt ist. Ohne CRON_SECRET ist die Route gesperrt.
import { NextResponse, type NextRequest } from "next/server";
import { synchronisiereZahlungen } from "@/lib/sumup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Nicht erlaubt", { status: 401 });
  }
  try {
    const r = await synchronisiereZahlungen({ limit: 50 });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, fehler: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
