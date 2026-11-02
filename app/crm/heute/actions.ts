"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Hakt eine Aufgabe ab oder nimmt den Haken zurück. */
export async function aufgabeErledigt(id: string, erledigt: boolean): Promise<{ ok: boolean }> {
  // Der Proxy schützt die Seite; eine Server-Aktion prüft trotzdem selbst.
  const cookieStore = await cookies();
  if (cookieStore.get("pipeline_auth")?.value !== process.env.PIPELINE_PASSWORD) return { ok: false };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };

  const { error } = await getSupabaseAdmin()
    .from("crm_aufgaben")
    .update({ erledigt_am: erledigt ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false };

  revalidatePath("/crm/heute");
  return { ok: true };
}
