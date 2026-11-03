"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { BEREICHE, PERSONEN, type Bereich, type Person } from "@/lib/crm-heute-model";

type Ergebnis = { ok: true } | { ok: false; fehler: string };

const UUID = /^[0-9a-f-]{36}$/i;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** Der Proxy schützt die Seiten; eine Server-Aktion prüft trotzdem selbst. */
async function angemeldet(): Promise<string | null> {
  const cookieStore = await cookies();
  if (cookieStore.get("pipeline_auth")?.value !== process.env.PIPELINE_PASSWORD) return null;
  return cookieStore.get("pipeline_user")?.value ?? "Unbekannt";
}

/** Aufgaben stehen auf zwei Seiten: allgemein unter Aufgaben, mit Marke unter Pipeline. */
function neuLaden() {
  revalidatePath("/crm/aufgaben");
  revalidatePath("/crm/pipeline");
}

/** Mit `brandId` eine Sales-Aufgabe, ohne eine allgemeine Aufgabe mit Bereich. */
export type AufgabeEingabe = {
  titel: string;
  brandId: string | null;
  bereich: Bereich | null;
  faellig: string | null;
  wer: Person;
};

function pruefe(e: AufgabeEingabe): string | null {
  const titel = e.titel?.trim() ?? "";
  if (titel.length === 0) return "Titel fehlt.";
  if (titel.length > 200) return "Titel ist länger als 200 Zeichen.";
  if (e.brandId !== null && !UUID.test(e.brandId)) return "Marke aus der Liste wählen.";
  if (e.bereich !== null && !BEREICHE.includes(e.bereich)) return "Bereich aus der Liste wählen.";
  if (e.faellig !== null && !DATUM.test(e.faellig)) return "Frist ist kein Datum.";
  if (!PERSONEN.includes(e.wer)) return "Person aus der Liste wählen.";
  return null;
}

const zeile = (e: AufgabeEingabe) => ({
  titel: e.titel.trim(),
  brand_id: e.brandId,
  bereich: e.brandId ? "Vertrieb" : e.bereich,
  faellig_am: e.faellig,
  wer: e.wer,
});

export async function aufgabeAnlegen(e: AufgabeEingabe): Promise<Ergebnis> {
  const wer = await angemeldet();
  if (!wer) return { ok: false, fehler: "Nicht angemeldet." };
  const fehler = pruefe(e);
  if (fehler) return { ok: false, fehler };

  const { error } = await getSupabaseAdmin().from("crm_aufgaben").insert({ ...zeile(e), created_by: wer });
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  neuLaden();
  return { ok: true };
}

export async function aufgabeAendern(id: string, e: AufgabeEingabe): Promise<Ergebnis> {
  if (!(await angemeldet())) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(id)) return { ok: false, fehler: "Unbekannte Aufgabe." };
  const fehler = pruefe(e);
  if (fehler) return { ok: false, fehler };

  const { error } = await getSupabaseAdmin().from("crm_aufgaben").update(zeile(e)).eq("id", id);
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  neuLaden();
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

  neuLaden();
  return { ok: true };
}

/** Internes Update zu einem Kunden, steht in seiner Zeitleiste als Notiz. */
export async function updateTeilen(brandId: string, text: string): Promise<Ergebnis> {
  const wer = await angemeldet();
  if (!wer) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(brandId)) return { ok: false, fehler: "Unbekannter Kunde." };
  const inhalt = text?.trim() ?? "";
  if (inhalt.length === 0) return { ok: false, fehler: "Update ist leer." };
  if (inhalt.length > 2000) return { ok: false, fehler: "Update ist länger als 2000 Zeichen." };

  const { error } = await getSupabaseAdmin()
    .from("crm_aktivitaeten")
    .insert({ brand_id: brandId, typ: "Notiz", titel: "Update", inhalt, wer });
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  revalidatePath("/crm/pipeline");
  return { ok: true };
}
