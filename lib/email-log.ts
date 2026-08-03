import { getSupabaseClient } from "./supabase";

export interface EmailLogEntry {
  id: string;
  brand_id: string;
  sender: string;
  subject: string;
  body: string;
  sent_at: string;
}

export async function logSentEmail(input: {
  brandId: string;
  sender: string;
  subject: string;
  body: string;
}): Promise<void> {
  const { error } = await getSupabaseClient().from("pipeline_email_log").insert({
    brand_id: input.brandId,
    sender: input.sender,
    subject: input.subject,
    body: input.body,
  });
  if (error) throw error;
}

export async function getEmailLogForBrand(brandId: string): Promise<EmailLogEntry[]> {
  const { data, error } = await getSupabaseClient()
    .from("pipeline_email_log")
    .select("*")
    .eq("brand_id", brandId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return data as EmailLogEntry[];
}
