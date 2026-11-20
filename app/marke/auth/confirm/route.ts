// Ziel des Login-Links.
//
// Zwei Wege, je nach Mail-Vorlage in Supabase (Auth → Email Templates):
//  - token_hash (empfohlen, geräteübergreifend): Vorlage verlinkt auf
//    {{ .SiteURL }}/marke/auth/confirm?token_hash={{ .TokenHash }}&type=email
//  - code (PKCE, Standardvorlage): klappt nur im selben Browser, in dem der
//    Link angefordert wurde.
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseMarke } from "@/lib/supabase-marke";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const code = url.searchParams.get("code");
  const sb = await getSupabaseMarke();

  let userId: string | null = null;
  if (tokenHash) {
    const { data, error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) userId = data.user?.id ?? null;
  } else if (code) {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user?.id ?? null;
  }

  // Weder token_hash noch code: Standardvorlage mit Tokens im #-Teil.
  // Der Browser nimmt den #-Teil bei der Weiterleitung mit.
  if (!tokenHash && !code) return NextResponse.redirect(new URL("/marke/auth/weiter", request.url));
  if (!userId) return NextResponse.redirect(new URL("/marke/login?fehler=1", request.url));

  await getSupabaseAdmin()
    .from("brand_nutzer")
    .update({ letzter_login: new Date().toISOString() })
    .eq("user_id", userId);
  return NextResponse.redirect(new URL("/marke/start", request.url));
}
