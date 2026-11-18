import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseMarke } from "@/lib/supabase-marke";

export async function POST(request: NextRequest) {
  const sb = await getSupabaseMarke();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/marke/login", request.url), { status: 303 });
}
