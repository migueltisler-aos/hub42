"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { dateiHochladen, driveBereit, ordnerAnlegen } from "@/lib/drive";
import { BEREICHE, PERSONEN, personAus, type Bereich, type Nachweis, type Person } from "@/lib/crm-heute-model";

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
  /** Nur allgemeine Aufgaben haben einen Link; fehlt das Feld, bleibt der alte Wert. */
  link?: string | null;
  /** Projekt der Aufgaben-App; fehlt das Feld, bleibt der alte Wert. */
  projektId?: string | null;
};

const LINK = /^https?:\/\/\S+$/i;

function pruefe(e: AufgabeEingabe): string | null {
  const titel = e.titel?.trim() ?? "";
  if (titel.length === 0) return "Titel fehlt.";
  if (titel.length > 200) return "Titel ist länger als 200 Zeichen.";
  if (e.brandId !== null && !UUID.test(e.brandId)) return "Marke aus der Liste wählen.";
  if (e.bereich !== null && !BEREICHE.includes(e.bereich)) return "Bereich aus der Liste wählen.";
  if (e.faellig !== null && !DATUM.test(e.faellig)) return "Frist ist kein Datum.";
  if (!PERSONEN.includes(e.wer)) return "Person aus der Liste wählen.";
  const link = e.link?.trim();
  if (link && (!LINK.test(link) || link.length > 1000)) return "Link muss mit https:// beginnen.";
  if (e.projektId && !UUID.test(e.projektId)) return "Projekt aus der Liste wählen.";
  return null;
}

const zeile = (e: AufgabeEingabe) => ({
  titel: e.titel.trim(),
  brand_id: e.brandId,
  bereich: e.brandId ? "Vertrieb" : e.bereich,
  faellig_am: e.faellig,
  wer: e.wer,
  ...(e.link !== undefined && { link: e.link?.trim() || null }),
  ...(e.projektId !== undefined && { aufgaben_projekt_id: e.projektId || null }),
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

/** Hakt eine Aufgabe ab, mit optionalem Nachweis (Notiz, Link zur Lösung),
    oder holt sie zurück. Der Nachweis bleibt dabei stehen, damit nichts verloren geht;
    ein neuer Nachweis beim nächsten Abhaken ersetzt ihn, ein leerer lässt ihn stehen. */
export async function aufgabeErledigt(
  id: string,
  erledigt: boolean,
  nachweis?: Nachweis
): Promise<{ ok: boolean; fehler?: string }> {
  const wer = await angemeldet();
  if (!wer) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(id)) return { ok: false, fehler: "Unbekannte Aufgabe." };

  const notiz = nachweis?.notiz?.trim() || null;
  const link = nachweis?.link?.trim() || null;
  if (notiz && notiz.length > 2000) return { ok: false, fehler: "Notiz ist länger als 2000 Zeichen." };
  if (link && (!LINK.test(link) || link.length > 1000)) {
    return { ok: false, fehler: "Link muss mit https:// beginnen." };
  }

  const { error } = await getSupabaseAdmin()
    .from("crm_aufgaben")
    .update(
      erledigt
        ? {
            erledigt_am: new Date().toISOString(),
            erledigt_von: wer,
            ...(notiz !== null && { erledigt_notiz: notiz }),
            ...(link !== null && { erledigt_link: link }),
          }
        : { erledigt_am: null, erledigt_von: null }
    )
    .eq("id", id);
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  neuLaden();
  return { ok: true };
}

/** Stimme der angemeldeten Person: 1 wartet drauf, -1 unwichtig, 0 nimmt sie zurück. */
export async function aufgabeStimmen(id: string, wert: 1 | -1 | 0): Promise<Ergebnis> {
  const name = await angemeldet();
  if (!name) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(id)) return { ok: false, fehler: "Unbekannte Aufgabe." };
  if (wert !== 1 && wert !== -1 && wert !== 0) return { ok: false, fehler: "Unbekannte Stimme." };
  const wer = personAus(name);

  const tabelle = getSupabaseAdmin().from("crm_aufgaben_stimmen");
  const { error } =
    wert === 0
      ? await tabelle.delete().eq("aufgabe_id", id).eq("wer", wer)
      : await tabelle.upsert({ aufgabe_id: id, wer, wert }, { onConflict: "aufgabe_id,wer" });
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

/* ── Projekte ──────────────────────────────────────────────────────────── */

export type ProjektEingabe = { titel: string; wer: Person; faellig: string | null };

export async function projektAnlegen(e: ProjektEingabe): Promise<Ergebnis> {
  const name = await angemeldet();
  if (!name) return { ok: false, fehler: "Nicht angemeldet." };
  const titel = e.titel?.trim() ?? "";
  if (titel.length === 0) return { ok: false, fehler: "Titel fehlt." };
  if (titel.length > 120) return { ok: false, fehler: "Titel ist länger als 120 Zeichen." };
  if (e.faellig !== null && !DATUM.test(e.faellig)) return { ok: false, fehler: "Frist ist kein Datum." };
  if (!PERSONEN.includes(e.wer)) return { ok: false, fehler: "Person aus der Liste wählen." };

  const { error } = await getSupabaseAdmin()
    .from("crm_aufgaben_projekte")
    .insert({ titel, wer: e.wer, faellig_am: e.faellig, created_by: name });
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };

  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

export async function projektAbschliessen(id: string, abgeschlossen: boolean): Promise<Ergebnis> {
  if (!(await angemeldet())) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(id)) return { ok: false, fehler: "Unbekanntes Projekt." };
  const { error } = await getSupabaseAdmin()
    .from("crm_aufgaben_projekte")
    .update({ abgeschlossen_am: abgeschlossen ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };
  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

/* ── Umfragen ──────────────────────────────────────────────────────────── */

export async function umfrageAnlegen(
  aufgabeId: string,
  frage: string,
  optionen: string[],
  mehrfach: boolean
): Promise<Ergebnis> {
  const name = await angemeldet();
  if (!name) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(aufgabeId)) return { ok: false, fehler: "Unbekannte Aufgabe." };
  const f = frage?.trim() ?? "";
  if (f.length === 0 || f.length > 200) return { ok: false, fehler: "Frage fehlt oder ist länger als 200 Zeichen." };
  const liste = [...new Set((optionen ?? []).map((o) => o.trim()).filter(Boolean))];
  if (liste.length < 2 || liste.length > 6) return { ok: false, fehler: "Zwei bis sechs Antworten angeben." };
  if (liste.some((o) => o.length > 100)) return { ok: false, fehler: "Eine Antwort ist länger als 100 Zeichen." };

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("crm_umfragen")
    .insert({ aufgabe_id: aufgabeId, frage: f, mehrfach: !!mehrfach, created_by: name })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, fehler: error?.code === "23505" ? "Die Aufgabe hat schon eine Umfrage." : "Speichern ist fehlgeschlagen." };
  }
  const { error: e2 } = await db
    .from("crm_umfrage_optionen")
    .insert(liste.map((text, pos) => ({ umfrage_id: data.id, text, pos })));
  if (e2) {
    await db.from("crm_umfragen").delete().eq("id", data.id);
    return { ok: false, fehler: "Speichern ist fehlgeschlagen." };
  }
  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

/** Wählt eine Antwort oder nimmt die Wahl zurück. Ohne Mehrfachwahl ersetzt
    die neue Wahl die alte derselben Person. */
export async function umfrageWaehlen(umfrageId: string, optionId: string): Promise<Ergebnis> {
  const name = await angemeldet();
  if (!name) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(umfrageId) || !UUID.test(optionId)) return { ok: false, fehler: "Unbekannte Umfrage." };
  const wer = personAus(name);
  const db = getSupabaseAdmin();

  const { data: u, error: e1 } = await db
    .from("crm_umfragen")
    .select("mehrfach, geschlossen_am, crm_umfrage_optionen(id)")
    .eq("id", umfrageId)
    .single();
  if (e1 || !u) return { ok: false, fehler: "Unbekannte Umfrage." };
  if (u.geschlossen_am) return { ok: false, fehler: "Die Umfrage ist geschlossen." };
  if (!(u.crm_umfrage_optionen as { id: string }[]).some((o) => o.id === optionId)) {
    return { ok: false, fehler: "Unbekannte Antwort." };
  }

  const { data: schon } = await db
    .from("crm_umfrage_stimmen")
    .select("option_id")
    .eq("option_id", optionId)
    .eq("wer", wer)
    .maybeSingle();
  if (schon) {
    const { error } = await db.from("crm_umfrage_stimmen").delete().eq("option_id", optionId).eq("wer", wer);
    if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };
  } else {
    if (!u.mehrfach) await db.from("crm_umfrage_stimmen").delete().eq("umfrage_id", umfrageId).eq("wer", wer);
    const { error } = await db.from("crm_umfrage_stimmen").insert({ option_id: optionId, umfrage_id: umfrageId, wer });
    if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };
  }
  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

export async function umfrageSchliessen(umfrageId: string, geschlossen: boolean): Promise<Ergebnis> {
  if (!(await angemeldet())) return { ok: false, fehler: "Nicht angemeldet." };
  if (!UUID.test(umfrageId)) return { ok: false, fehler: "Unbekannte Umfrage." };
  const { error } = await getSupabaseAdmin()
    .from("crm_umfragen")
    .update({ geschlossen_am: geschlossen ? new Date().toISOString() : null })
    .eq("id", umfrageId);
  if (error) return { ok: false, fehler: "Speichern ist fehlgeschlagen." };
  revalidatePath("/crm/aufgaben");
  return { ok: true };
}

/* ── Dateien in Google Drive ───────────────────────────────────────────── */

/** Unter dem Limit der Server-Aktion (next.config, 4 MB) und dem von Vercel (4,5 MB). */
const DATEI_MAX = 3_800_000;

/** Lädt eine Datei in den Drive-Unterordner der Aufgabe; legt ihn beim ersten Mal an. */
export async function dateiAnhaengen(form: FormData): Promise<Ergebnis> {
  const name = await angemeldet();
  if (!name) return { ok: false, fehler: "Nicht angemeldet." };
  if (!driveBereit()) return { ok: false, fehler: "Google Drive ist noch nicht eingerichtet." };
  const aufgabeId = String(form.get("aufgabe") ?? "");
  const datei = form.get("datei");
  if (!UUID.test(aufgabeId)) return { ok: false, fehler: "Unbekannte Aufgabe." };
  if (!(datei instanceof File) || datei.size === 0) return { ok: false, fehler: "Keine Datei gewählt." };
  if (datei.size > DATEI_MAX) {
    return { ok: false, fehler: "Datei ist größer als 3,8 MB. Größeres direkt in den Drive-Ordner legen." };
  }

  const db = getSupabaseAdmin();
  const { data: a, error: e1 } = await db.from("crm_aufgaben").select("titel, drive_ordner_id").eq("id", aufgabeId).single();
  if (e1 || !a) return { ok: false, fehler: "Unbekannte Aufgabe." };

  try {
    let ordnerId = a.drive_ordner_id as string | null;
    if (!ordnerId) {
      const ordnerName = `${String(a.titel).replace(/[\\/]/g, "-").slice(0, 80)} · ${aufgabeId.slice(0, 8)}`;
      ordnerId = await ordnerAnlegen(ordnerName);
      await db.from("crm_aufgaben").update({ drive_ordner_id: ordnerId }).eq("id", aufgabeId);
    }
    const dateiName = datei.name.slice(0, 200) || "Datei";
    const hoch = await dateiHochladen(ordnerId, dateiName, datei.type, Buffer.from(await datei.arrayBuffer()));
    const { error } = await db.from("crm_aufgaben_dateien").insert({
      aufgabe_id: aufgabeId,
      name: dateiName,
      link: hoch.link,
      drive_id: hoch.id,
      groesse: datei.size,
      wer: personAus(name),
    });
    if (error) return { ok: false, fehler: "Hochgeladen, aber nicht gespeichert." };
  } catch (err) {
    console.error("Drive-Upload", err);
    return { ok: false, fehler: "Upload zu Google Drive ist fehlgeschlagen." };
  }
  revalidatePath("/crm/aufgaben");
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
