"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PERSONEN, type Person } from "@/lib/crm-heute-model";

type Ergebnis = { ok: true } | { ok: false; fehler: string };

const UUID = /^[0-9a-f-]{36}$/i;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** Der Proxy schützt die Seite; eine Server-Aktion prüft trotzdem selbst. */
async function angemeldet(): Promise<string | null> {
  const cookieStore = await cookies();
  if (cookieStore.get("pipeline_auth")?.value !== process.env.PIPELINE_PASSWORD) return null;
  return cookieStore.get("pipeline_user")?.value ?? "Unbekannt";
}

export type AufgabeEingabe = {
  titel: string;
  brandId: string;
  faellig: string | null;
  wer: Person;
};

function pruefe(e: AufgabeEingabe): string | null {
  const titel = e.titel?.trim() ?? "";
  if (titel.length === 0) return "Titel fehlt.";
  if (titel.length > 200) return "Titel ist länger als 200 Zeichen.";
  if (!UUID.test(e.brandId)) return "Marke aus der Liste wählen.";
  if (e.faellig !== null && !DATUM.test(e.faellig)) return "Frist ist kein Datum.";
  if (!PERSONEN.includes(e.wer)) return "Person aus der Liste wählen.";
  return null;
}

export async function aufgabeAnlegen(e: AufgabeEingabe): Promise<Ergebnis> {
  const wer = await angemeldet();
  if (!wer) return { ok: false, fehler: "Nicht angemeldet." };
  const fehler = pruefe(e);
  if (fehler) return { ok: false, fehler };

  const { error } = await getSupabaseAdmin().from("crm_aufgaben").insert({
    titel: e.titel.trim(),
    brand_id: e.brandId,
    faellig_am: e.faellig,
    wer: e.wer,
    created_by: wer,
  });
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

export async function aufgabeAendern(id: string, e: AufgabeEingabe): Promise<Ergebnis> {
  if (!(await angemeldet())) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(id)) return { ok: false, fehler: "Unbekannte Aufgabe." };
  const fehler = pruefe(e);
  if (fehler) return { ok: false, fehler };

  const { error } = await getSupabaseAdmin()
    .from("crm_aufgaben")
    .update({ titel: e.titel.trim(), brand_id: e.brandId, faellig_am: e.faellig, wer: e.wer })
    .eq("id", id);
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

/** Hakt eine Aufgabe ab oder nimmt den Haken zurück. */
export async function aufgabeErledigt(id: string, erledigt: boolean): Promise<{ ok: boolean }> {
  if (!(await angemeldet())) return { ok: false };
  if (!UUID.test(id)) return { ok: false };

  const { error } = await getSupabaseAdmin()
    .from("crm_aufgaben")
    .update({ erledigt_am: erledigt ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false };

  revalidatePath("/crm/aufgaben");
  return { ok: true };
}
