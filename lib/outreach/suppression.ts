import { getSupabaseAdmin } from "@/lib/supabase-admin";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isSuppressed(email: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("suppression")
    .select("email")
    .eq("email", normalizeEmail(email))
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addSuppression(email: string, reason: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("suppression")
    .upsert({ email: normalizeEmail(email), reason }, { onConflict: "email" });
  if (error) throw error;
}
