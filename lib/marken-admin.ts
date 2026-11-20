// Interne Seite der Marken-Verwaltung: Zugang, Prüfung, Freigabe, Regalfoto.
// Nur hinter dem Team-Passwort (/admin/marken) benutzen.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabase-admin";
import { KASSE_STANDORT } from "./sumup-model";
import { mitBildUrls, type Konditionen } from "./marke";

export interface MarkeUebersicht {
  id: string;
  name: string;
  stufe: string | null;
  nutzer: number;
  status: string | null;
  offeneArtikel: number;
  artikelImRegal: number;
  ohneSatz: number;
}

export async function ladeMarkenUebersicht(): Promise<MarkeUebersicht[]> {
  const db = getSupabaseAdmin();
  const [marken, nutzer, kond, antraege, artikel, zusagen] = await Promise.all([
    db.from("pipeline_brands").select("id, name, stufe").eq("stufe", "Kunde"),
    db.from("brand_nutzer").select("brand_id"),
    db.from("brand_konditionen").select("brand_id, status"),
    db.from("brand_artikel_antrag").select("brand_id, status").eq("status", "eingereicht"),
    db.from("kasse_artikelstamm").select("brand_id, mwst_satz"),
    db.from("crm_zusagen").select("brand_id").in("status", ["gebucht", "live"]),
  ]);
  for (const r of [marken, nutzer, kond, antraege, artikel, zusagen]) if (r.error) throw r.error;

  const ids = new Set<string>([
    ...(marken.data ?? []).map((m) => m.id),
    ...(nutzer.data ?? []).map((n) => n.brand_id),
    ...(kond.data ?? []).map((k) => k.brand_id),
    ...(artikel.data ?? []).filter((a) => a.brand_id).map((a) => a.brand_id as string),
    ...(zusagen.data ?? []).map((z) => z.brand_id),
  ]);
  const { data: namen, error } = await db.from("pipeline_brands").select("id, name, stufe").in("id", [...ids]);
  if (error) throw error;

  const zaehle = <T,>(liste: T[] | null, f: (x: T) => boolean) => (liste ?? []).filter(f).length;
  return (namen ?? [])
    .map((m) => ({
      id: m.id,
      name: m.name,
      stufe: m.stufe,
      nutzer: zaehle(nutzer.data, (n) => n.brand_id === m.id),
      status: (kond.data ?? []).find((k) => k.brand_id === m.id)?.status ?? null,
      offeneArtikel: zaehle(antraege.data, (a) => a.brand_id === m.id),
      artikelImRegal: zaehle(artikel.data, (a) => a.brand_id === m.id),
      ohneSatz: zaehle(artikel.data, (a) => a.brand_id === m.id && a.mwst_satz == null),
    }))
    .sort((a, b) => Number(b.status === "eingereicht") - Number(a.status === "eingereicht") || a.name.localeCompare(b.name, "de"));
}

export async function ladeMarkeIntern(brandId: string) {
  const db = getSupabaseAdmin();
  const [marke, kontakte, nutzer, kond, antraege, artikel, zusagen, fotos] = await Promise.all([
    db.from("pipeline_brands").select("id, name, website, stufe").eq("id", brandId).single(),
    db.from("crm_kontakte").select("id, name, rolle, email, ist_haupt").eq("brand_id", brandId).order("ist_haupt", { ascending: false }),
    db.from("brand_nutzer").select("user_id, email, created_at, letzter_login, eingeladen_von").eq("brand_id", brandId),
    db.from("brand_konditionen").select("*").eq("brand_id", brandId).maybeSingle(),
    db.from("brand_artikel_antrag").select("*").eq("brand_id", brandId).order("created_at"),
    db.from("kasse_artikelstamm").select("id, ean, artikel_name, verkaufspreis, mwst_satz, regal_lage, standort_id, gueltig_ab, sumup_offen, sumup_hinweis").eq("brand_id", brandId).order("artikel_name"),
    db.from("crm_zusagen").select("produkt, klasse, regal_cm, laufzeit_monate, monat_netto, gebucht_am, status").eq("brand_id", brandId).in("status", ["gebucht", "live"]),
    db.from("brand_regalfotos").select("id, pfad, aufgenommen_am, aufgenommen_von").eq("brand_id", brandId).order("aufgenommen_am", { ascending: false }).limit(1),
  ]);
  if (marke.error) throw marke.error;
  for (const r of [kontakte, nutzer, kond, antraege, artikel, zusagen, fotos]) if (r.error) throw r.error;

  let fotoUrl: string | null = null;
  const foto = fotos.data?.[0];
  if (foto) fotoUrl = (await db.storage.from("marken").createSignedUrl(foto.pfad, 600)).data?.signedUrl ?? null;

  return {
    marke: marke.data,
    kontakte: kontakte.data ?? [],
    nutzer: nutzer.data ?? [],
    konditionen: (kond.data ?? null) as Konditionen | null,
    antraege: await mitBildUrls(antraege.data ?? []),
    artikel: artikel.data ?? [],
    zusagen: zusagen.data ?? [],
    foto: foto ? { ...foto, url: fotoUrl } : null,
  };
}

/** Auth-Nutzer anlegen oder finden, der Marke zuordnen, Login-Link schicken. */
export async function zugangEinladen(opts: {
  brandId: string;
  email: string;
  kontaktId: string | null;
  von: string;
  siteUrl: string;
}): Promise<{ neu: boolean; mailFehler: string | null }> {
  const db = getSupabaseAdmin();
  const email = opts.email.trim().toLowerCase();

  let userId: string | null = null;
  let neu = false;
  const angelegt = await db.auth.admin.createUser({ email, email_confirm: true });
  if (angelegt.data.user) {
    userId = angelegt.data.user.id;
    neu = true;
  } else {
    // Gibt es schon (z. B. Kontakt mehrerer Marken): suchen.
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (data.users.length < 200) break;
    }
    if (!userId) throw angelegt.error ?? new Error("Nutzer konnte nicht angelegt werden.");
  }

  const { error } = await db.from("brand_nutzer").upsert(
    { user_id: userId, brand_id: opts.brandId, email, kontakt_id: opts.kontaktId, eingeladen_von: opts.von },
    { onConflict: "user_id,brand_id" }
  );
  if (error) throw error;

  // Login-Link über Supabase Auth. Funktioniert nur mit der token_hash-Vorlage
  // (siehe app/marke/auth/confirm/route.ts), weil hier kein Browser beteiligt ist.
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" },
  });
  const { error: mailFehler } = await anon.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${opts.siteUrl}/marke/auth/confirm` },
  });
  return { neu, mailFehler: mailFehler?.message ?? null };
}

export async function zugangEntziehen(brandId: string, userId: string) {
  const { error } = await getSupabaseAdmin().from("brand_nutzer").delete().eq("brand_id", brandId).eq("user_id", userId);
  if (error) throw error;
}

export async function konditionenSetzen(brandId: string, k: Partial<Konditionen>) {
  const { error } = await getSupabaseAdmin()
    .from("brand_konditionen")
    .upsert({ brand_id: brandId, ...k, updated_at: new Date().toISOString() }, { onConflict: "brand_id" });
  if (error) throw error;
}

export async function stammdatenEntscheiden(brandId: string, freigeben: boolean, von: string, notiz: string | null) {
  const { error } = await getSupabaseAdmin()
    .from("brand_konditionen")
    .update(
      freigeben
        ? { status: "freigegeben", freigegeben_von: von, freigegeben_am: new Date().toISOString(), pruef_notiz: null }
        : { status: "entwurf", pruef_notiz: notiz }
    )
    .eq("brand_id", brandId);
  if (error) throw error;
}

/**
 * Artikel-Antrag in den Kassen-Artikelstamm übernehmen. kassenName = Name wie in SumUp.
 * Neue Artikel und geänderte Namen/Preise landen auf der SumUp-Liste (sumup_offen),
 * denn in der SumUp-App muss jemand vom Team sie anlegen oder nachziehen.
 */
export async function artikelFreigeben(opts: { antragId: string; brandId: string; kassenName: string; regalLage: string | null }): Promise<{ hinweis: string | null }> {
  const db = getSupabaseAdmin();
  const { data: a, error } = await db
    .from("brand_artikel_antrag")
    .select("*")
    .eq("id", opts.antragId)
    .eq("brand_id", opts.brandId)
    .single();
  if (error) throw error;
  const { data: marke } = await db.from("pipeline_brands").select("name, website").eq("id", opts.brandId).single();

  // Ohne EAN braucht die Kasse trotzdem einen eindeutigen Schlüssel
  const ean: string = a.ean ?? `TK-${String(a.id).slice(0, 8).toUpperCase()}`;
  const zeile = {
    ean,
    standort_id: KASSE_STANDORT,
    artikel_name: opts.kassenName.trim() || a.artikel_name,
    brand_id: opts.brandId,
    brand_name: marke?.name ?? null,
    brand_website: marke?.website ?? null,
    verkaufspreis: a.vk_brutto,
    handling_fee: 0,
    regal_lage: opts.regalLage,
    mwst_satz: a.mwst_satz,
    gueltig_ab: new Date().toISOString().slice(0, 10),
  };
  const { data: vorhanden } = await db
    .from("kasse_artikelstamm")
    .select("id, artikel_name, verkaufspreis, sumup_offen, sumup_hinweis")
    .eq("ean", ean)
    .eq("standort_id", KASSE_STANDORT)
    .maybeSingle();

  const preis = (n: unknown) => Number(n).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const teile: string[] = [];
  if (!vorhanden) teile.push(`Neu anlegen: „${zeile.artikel_name}“, ${preis(zeile.verkaufspreis)}`);
  else {
    if (vorhanden.artikel_name !== zeile.artikel_name) teile.push(`Name „${vorhanden.artikel_name}“ → „${zeile.artikel_name}“`);
    if (Number(vorhanden.verkaufspreis) !== Number(zeile.verkaufspreis)) teile.push(`Preis ${preis(vorhanden.verkaufspreis)} → ${preis(zeile.verkaufspreis)}`);
  }
  // Noch nicht in SumUp angelegt: es bleibt bei "Neu anlegen", mit den aktuellen Werten
  const nochNeu = Boolean(vorhanden?.sumup_offen && vorhanden.sumup_hinweis?.startsWith("Neu anlegen"));
  const hinweis = nochNeu
    ? teile.length ? `Neu anlegen: „${zeile.artikel_name}“, ${preis(zeile.verkaufspreis)}` : null
    : teile.length ? teile.join(", ") : null;
  // Sonst bleibt ein noch offener alter Hinweis erhalten und der neue kommt dazu
  const sumup = hinweis
    ? {
        sumup_offen: true,
        sumup_hinweis: !nochNeu && vorhanden?.sumup_offen && vorhanden.sumup_hinweis ? `${vorhanden.sumup_hinweis}; ${hinweis}` : hinweis,
        sumup_seit: new Date().toISOString(),
      }
    : {};

  const { error: e2 } = vorhanden
    ? await db.from("kasse_artikelstamm").update({ ...zeile, ...sumup }).eq("id", vorhanden.id)
    : await db.from("kasse_artikelstamm").insert({ ...zeile, ...sumup });
  if (e2) throw e2;
  const { error: e3 } = await db
    .from("brand_artikel_antrag")
    .update({ status: "freigegeben", entschieden_am: new Date().toISOString() })
    .eq("id", a.id);
  if (e3) throw e3;
  return { hinweis };
}

export async function artikelAblehnen(antragId: string, brandId: string) {
  const { error } = await getSupabaseAdmin()
    .from("brand_artikel_antrag")
    .update({ status: "abgelehnt", entschieden_am: new Date().toISOString() })
    .eq("id", antragId)
    .eq("brand_id", brandId);
  if (error) throw error;
}

export async function mwstSetzen(artikelId: string, brandId: string, satz: number) {
  const { error } = await getSupabaseAdmin()
    .from("kasse_artikelstamm")
    .update({ mwst_satz: satz })
    .eq("id", artikelId)
    .eq("brand_id", brandId);
  if (error) throw error;
}

export async function regalfotoHochladen(brandId: string, datei: File, von: string) {
  const db = getSupabaseAdmin();
  const endung = (datei.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const pfad = `regalfotos/${brandId}/${Date.now()}.${endung}`;
  const { error } = await db.storage.from("marken").upload(pfad, datei, { contentType: datei.type, upsert: false });
  if (error) throw error;
  const { error: e2 } = await db.from("brand_regalfotos").insert({ brand_id: brandId, pfad, aufgenommen_von: von });
  if (e2) throw e2;
}

// ── SumUp-Liste: was das Team in der SumUp-App anlegen oder ändern muss ─────

export interface SumupAufgabe {
  id: string;
  brand_id: string;
  marke: string;
  artikel_name: string;
  verkaufspreis: number;
  ean: string;
  hinweis: string;
  seit: string | null;
}

export async function ladeSumupAufgaben(brandId?: string): Promise<SumupAufgabe[]> {
  let q = getSupabaseAdmin()
    .from("kasse_artikelstamm")
    .select("id, brand_id, brand_name, artikel_name, verkaufspreis, ean, sumup_hinweis, sumup_seit")
    .eq("sumup_offen", true)
    .order("sumup_seit", { ascending: true });
  if (brandId) q = q.eq("brand_id", brandId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id,
    brand_id: d.brand_id,
    marke: d.brand_name ?? "",
    artikel_name: d.artikel_name,
    verkaufspreis: Number(d.verkaufspreis),
    ean: d.ean,
    hinweis: d.sumup_hinweis ?? "",
    seit: d.sumup_seit,
  }));
}

export async function sumupErledigt(id: string) {
  const { error } = await getSupabaseAdmin()
    .from("kasse_artikelstamm")
    .update({ sumup_offen: false, sumup_hinweis: null, sumup_seit: null })
    .eq("id", id);
  if (error) throw error;
}
