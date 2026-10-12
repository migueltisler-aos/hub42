import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import type { RatingKontext } from "@/lib/feedback";

// Kurz-URL für QR-Codes: /<prefix>/<erste 6 Hex-Zeichen der Produkt-ID> -> /feedback/r/<id>?k=<kontext>.
// Kurz, damit der QR-Code auf 40x30-Thermoetiketten nur 25x25 Module hat und lesbar bleibt.
// Kein eigenes Kurzcode-Feld: gesucht wird über den UUID-Bereich [code000…, code+1 000…).
const PAD = "00-0000-0000-0000-000000000000";

export async function redirectShortCode(
  request: NextRequest,
  rawCode: string,
  kontext: RatingKontext
): Promise<NextResponse> {
  const code = rawCode.toLowerCase();
  const fallback = new URL("/feedback/scan", request.url);
  if (!/^[0-9a-f]{6}$/.test(code) || code === "ffffff") return NextResponse.redirect(fallback);

  const next = (parseInt(code, 16) + 1).toString(16).padStart(6, "0");
  const { data } = await getSupabaseClient()
    .from("feedback_products")
    .select("id")
    .gte("id", code + PAD)
    .lt("id", next + PAD)
    .limit(2);

  // 0 Treffer oder (sehr unwahrscheinlich) mehrdeutig -> Scan-Seite statt falschem Produkt
  if (!data || data.length !== 1) return NextResponse.redirect(fallback);
  return NextResponse.redirect(new URL(`/feedback/r/${data[0].id}?k=${kontext}`, request.url));
}
