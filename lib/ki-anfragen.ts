import "server-only";

/**
 * Protokoll der KI-Anfragen aus dem Bewerbungs-Assistenten (Tabelle
 * ki_anfragen, supabase/ki_anfragen_migration.sql). Ohne Personendaten.
 *
 * Fehler hier dürfen den Assistenten nie aufhalten: Fehlt die Tabelle
 * (Migration noch nicht gelaufen) oder hakt Supabase, wird nur geloggt.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ZIELE, type ZielKey } from "@/lib/assistent-model";
import { nurEntwurf, type KarteEntwurf, type KarteProdukt } from "@/lib/karte-model";
import { upsertBrand } from "@/lib/pipeline";
import { normalizeWebsite, type Brand } from "@/lib/pipeline-model";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Neue Anfrage nach erfolgreichem Lesen der Website; gibt die ID zurück. */
export async function anfrageAnlegen(website: string, karte: KarteEntwurf): Promise<string | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("ki_anfragen")
      .insert({
        website: website.slice(0, 300),
        marke: karte.marke,
        // Plus öffentliche Angaben für die Übernahme in die Pipeline.
        karte: { ...nurEntwurf(karte), instagram: karte.instagram, kategorie: karte.kategorie, vertrieb: karte.vertrieb, haltung: karte.haltung },
        produkte: karte.produkte.map(({ titel, preis }) => ({ titel, preis })),
        schritt: "website",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (e) {
    console.error("ki_anfragen anlegen:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Fortschritt nachtragen: Schritt, gewählte Produkte, Antworten. */
export async function anfrageFortschreiben(
  id: string,
  stand: { schritt: string; produkte?: KarteProdukt[]; antworten?: unknown },
): Promise<void> {
  if (!UUID_RE.test(id)) return;
  try {
    const { error } = await getSupabaseAdmin()
      .from("ki_anfragen")
      .update({
        schritt: stand.schritt.slice(0, 30),
        ...(stand.produkte
          ? {
              produkte: stand.produkte.slice(0, 5).map((p) => ({
                titel: String(p.titel).slice(0, 120),
                preis: typeof p.preis === "number" ? p.preis : null,
                bild: typeof p.bild === "string" ? p.bild.slice(0, 600) : null,
              })),
            }
          : {}),
        ...(stand.antworten !== undefined ? { antworten: stand.antworten } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("abgeschickt", false);
    if (error) throw error;
  } catch (e) {
    console.error("ki_anfragen fortschreiben:", e instanceof Error ? e.message : e);
  }
}

/** Aus der Anfrage ist eine Bewerbung geworden. */
export async function anfrageAbgeschickt(id: string, bewerbungId: string | null): Promise<void> {
  if (!UUID_RE.test(id)) return;
  try {
    const { error } = await getSupabaseAdmin()
      .from("ki_anfragen")
      .update({ abgeschickt: true, schritt: "abgeschickt", bewerbung_id: bewerbungId, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    console.error("ki_anfragen abgeschickt:", e instanceof Error ? e.message : e);
  }
}

/* ── Liste für /pipeline/ki-anfragen ─────────────────────────── */

export interface KiAnfrage {
  id: string;
  created_at: string;
  updated_at: string;
  website: string;
  marke: string | null;
  karte: (Record<string, unknown> & { claim?: string; instagram?: string; kategorie?: string; haltung?: string[] }) | null;
  produkte: { titel: string; preis: number | null; bild?: string | null }[] | null;
  antworten: { ziele?: string[]; start?: string; handelsreife?: string[]; cm?: number; zone?: string; schaetzungMonat?: number | null } | null;
  schritt: string | null;
  abgeschickt: boolean;
  pipeline_id: string | null;
}

export async function getKiAnfragen(nurAbbrecher: boolean): Promise<KiAnfrage[]> {
  let q = getSupabaseAdmin().from("ki_anfragen").select("*").order("created_at", { ascending: false }).limit(200);
  if (nurAbbrecher) q = q.eq("abgeschickt", false);
  const { data, error } = await q;
  if (error) {
    console.error("ki_anfragen lesen:", error.message);
    return [];
  }
  return (data ?? []) as KiAnfrage[];
}

/**
 * Macht aus einer KI-Anfrage einen Lead in pipeline_brands. Gibt es die
 * Website dort schon, wird nur verknüpft statt doppelt angelegt.
 */
export async function anfrageInPipeline(id: string, user: string): Promise<{ ok: boolean; neu: boolean }> {
  if (!UUID_RE.test(id)) return { ok: false, neu: false };
  const sb = getSupabaseAdmin();
  const { data: a, error } = await sb.from("ki_anfragen").select("*").eq("id", id).single();
  if (error || !a) return { ok: false, neu: false };
  const anfrage = a as KiAnfrage;

  const key = normalizeWebsite(anfrage.website);
  const { data: vorhanden } = await sb.from("pipeline_brands").select("id").eq("website_key", key).limit(1);
  let brandId = vorhanden?.[0]?.id as string | undefined;
  const neu = !brandId;

  if (!brandId) {
    const k = anfrage.karte ?? {};
    const preise = (anfrage.produkte ?? []).map((p) => p.preis).filter((p): p is number => typeof p === "number");
    const ziele = (anfrage.antworten?.ziele ?? []).map((z) => ZIELE[z as ZielKey]?.label ?? z);
    const brand = await upsertBrand(null, {
      typ: "Brand",
      name: anfrage.marke || key,
      website: anfrage.website,
      instagram: typeof k.instagram === "string" && k.instagram ? k.instagram : null,
      kategorie_kanonisch: (typeof k.kategorie === "string" && k.kategorie ? k.kategorie : null) as Brand["kategorie_kanonisch"],
      produkt: (anfrage.produkte ?? []).map((p) => p.titel).join(" · ").slice(0, 300) || null,
      preisrange: preise.length ? `${Math.min(...preise).toFixed(2)}–${Math.max(...preise).toFixed(2)} €` : null,
      standort: typeof k.ort === "string" && k.ort ? k.ort : null,
      haltung_tags: Array.isArray(k.haltung) ? (k.haltung as string[]) : null,
      haltung_satz: typeof k.claim === "string" ? k.claim : null,
      haltung_quelle: anfrage.website,
      gefunden_via: "KI-Anfrage (Website-Assistent)",
      zugewiesen: user,
      status: "Neu",
      notizen: [
        `KI-Anfrage vom ${new Date(anfrage.created_at).toLocaleDateString("de-DE")}, ausgestiegen bei: ${anfrage.schritt ?? "–"}.`,
        ziele.length ? `Ziel: ${ziele.join(", ")}.` : "",
        anfrage.antworten?.schaetzungMonat ? `Unsere Schätzung: ${anfrage.antworten.schaetzungMonat} Verkäufe/Monat.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
    brandId = brand.id;
  }

  await sb.from("ki_anfragen").update({ pipeline_id: brandId }).eq("id", id);
  return { ok: true, neu };
}
