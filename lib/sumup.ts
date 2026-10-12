// SumUp-Kasse: Zahlungen aus der SumUp-App abholen, als Verkauf buchen,
// Umfrage (Alter/Geschlecht) an die Zahlung hängen.
//
// Der Secret Key gibt Vollzugriff auf das SumUp-Konto – deshalb "server-only"
// und nur aus Env-Vars (SUMUP_API_KEY / SUMUP_MERCHANT_CODE), nie im Browser.
import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-admin";
import {
  ausApiDetail,
  istBuchbar,
  KASSE_ID_SUMUP,
  KASSE_STANDORT,
  ordneZu,
  type Altersgruppe,
  type ArtikelRef,
  type GespeicherteZahlung,
  type Geschlecht,
  type KassenZahlung,
} from "./sumup-model";

const API = "https://api.sumup.com";

function zugang() {
  const key = process.env.SUMUP_API_KEY;
  const merchant = process.env.SUMUP_MERCHANT_CODE;
  if (!key || !merchant) {
    throw new Error(
      "SUMUP_API_KEY oder SUMUP_MERCHANT_CODE fehlt. In .env.local und in den " +
        "Vercel-Env-Vars (Projekt tryhub42) setzen."
    );
  }
  return { key, merchant };
}

async function sumupGet<T>(pfad: string): Promise<T> {
  const { key } = zugang();
  const res = await fetch(API + pfad, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`SumUp ${res.status} bei ${pfad.split("?")[0]}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/** Stabile UUID aus einem Schlüssel – macht wiederholtes Buchen idempotent. */
function stabileUuid(schluessel: string): string {
  const h = createHash("sha256").update(schluessel).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

interface HistoryItem {
  id: string;
  status: string;
  refunded_amount?: number;
  type?: string;
}

/**
 * Holt die letzten Zahlungen von SumUp, speichert neue/geänderte und bucht
 * buchbare als Verkauf. Wird bei jedem Laden von /kasse aufgerufen – kostet
 * einen Listen-Aufruf plus je einen Detail-Aufruf nur für Neues.
 */
export async function synchronisiereZahlungen({ limit = 20, seit }: { limit?: number; seit?: Date } = {}) {
  const { merchant } = zugang();
  const db = getSupabaseAdmin();

  const params = new URLSearchParams({ order: "descending", limit: String(limit) });
  params.append("types[]", "PAYMENT");
  if (seit) params.set("oldest_time", seit.toISOString());
  const { items = [] } = await sumupGet<{ items?: HistoryItem[] }>(
    `/v2.1/merchants/${merchant}/transactions/history?${params}`
  );
  if (items.length === 0) return { neu: 0, gebucht: 0 };

  const { data: bekannt, error } = await db
    .from("sumup_transaktionen")
    .select("id, status, erstattet, verkaeufe_gebucht")
    .in("id", items.map((i) => i.id));
  if (error) throw error;
  const bekanntNachId = new Map((bekannt ?? []).map((b) => [b.id, b]));

  let neu = 0;
  const zuBuchen: string[] = [];
  for (const item of items) {
    const b = bekanntNachId.get(item.id);
    const geaendert =
      !b || b.status !== item.status || Number(b.erstattet) !== Number(item.refunded_amount ?? 0);
    if (geaendert) {
      const detail = await sumupGet<Record<string, unknown>>(
        `/v2.1/merchants/${merchant}/transactions?id=${encodeURIComponent(item.id)}`
      );
      const z = ausApiDetail({ refunded_amount: item.refunded_amount, ...detail });
      const { error: e } = await db.from("sumup_transaktionen").upsert(
        {
          ...z,
          standort_id: KASSE_STANDORT,
          aktualisiert_am: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (e) throw e;
      if (!b) neu++;
      if (istBuchbar(z)) zuBuchen.push(z.id);
    } else if (!b.verkaeufe_gebucht && item.status === "SUCCESSFUL") {
      // Früher nicht (vollständig) zuordenbar – Artikelstamm evtl. inzwischen ergänzt.
      zuBuchen.push(item.id);
    }
  }

  let gebucht = 0;
  for (const id of zuBuchen) {
    if (await bucheVerkaeufe(id)) gebucht++;
  }
  return { neu, gebucht };
}

async function ladeArtikel(): Promise<ArtikelRef[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("kasse_artikelstamm")
    .select("ean, artikel_name, brand_id")
    .eq("standort_id", KASSE_STANDORT);
  if (error) throw error;
  return data ?? [];
}

/**
 * Schreibt die zugeordneten Positionen als kasse_verkaeufe. Idempotent über
 * zeilen_uuid (= Transaktion + Positionsnummer) und ignoreDuplicates – ein
 * zweiter Lauf erzeugt keine doppelte Bestandsbuchung, weil der Bestands-
 * Trigger nur bei echtem INSERT feuert. Nicht zuordenbare Positionen werden
 * gemerkt statt geraten.
 */
export async function bucheVerkaeufe(transaktionId: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data: z, error } = await db
    .from("sumup_transaktionen")
    .select("*")
    .eq("id", transaktionId)
    .single<GespeicherteZahlung>();
  if (error) throw error;
  if (!istBuchbar(z)) return false;

  const zuordnung = ordneZu(z.produkte, await ladeArtikel());
  const zeilen = zuordnung
    .filter((p) => p.artikel)
    .map((p) => ({
      zeilen_uuid: stabileUuid(`sumup:${z.id}:${p.index}`),
      standort_id: KASSE_STANDORT,
      kassen_id: KASSE_ID_SUMUP,
      bon_nr: null,
      zeitstempel: z.zeitstempel,
      ean: p.artikel!.ean,
      menge: p.produkt.menge,
      einzelpreis: p.produkt.einzelpreis_brutto,
      brand_id: p.artikel!.brand_id,
      zahlart: z.zahlart,
      sumup_transaktion_id: z.id,
    }));

  if (zeilen.length) {
    const { error: e } = await db
      .from("kasse_verkaeufe")
      .upsert(zeilen, { onConflict: "zeilen_uuid", ignoreDuplicates: true });
    if (e) throw e;
  }

  const nichtZugeordnet = zuordnung.filter((p) => !p.artikel).map((p) => p.produkt.name);
  const { error: e2 } = await db
    .from("sumup_transaktionen")
    .update({
      nicht_zugeordnet: nichtZugeordnet,
      verkaeufe_gebucht: nichtZugeordnet.length === 0,
      aktualisiert_am: new Date().toISOString(),
    })
    .eq("id", z.id);
  if (e2) throw e2;
  return zeilen.length > 0;
}

export async function ladeLetzteZahlungen(anzahl = 15): Promise<KassenZahlung[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("sumup_transaktionen")
    .select("*")
    .eq("standort_id", KASSE_STANDORT)
    .order("zeitstempel", { ascending: false })
    .limit(anzahl);
  if (error) throw error;
  const zahlungen = (data ?? []) as GespeicherteZahlung[];
  if (zahlungen.length === 0) return [];

  const { data: umfragen, error: e } = await db
    .from("kasse_beobachtungen")
    .select("sumup_transaktion_id, geschlecht, alter_gruppe")
    .in("sumup_transaktion_id", zahlungen.map((z) => z.id));
  if (e) throw e;
  const nachId = new Map((umfragen ?? []).map((u) => [u.sumup_transaktion_id, u]));
  return zahlungen.map((z) => {
    const u = nachId.get(z.id);
    return { ...z, umfrage: u ? { geschlecht: u.geschlecht, alter_gruppe: u.alter_gruppe } : null };
  });
}

export async function speichereUmfrage(
  transaktionId: string,
  werte: { geschlecht: Geschlecht | null; alter_gruppe: Altersgruppe | null }
) {
  const db = getSupabaseAdmin();
  const { data: z, error } = await db
    .from("sumup_transaktionen")
    .select("id, zeitstempel, standort_id")
    .eq("id", transaktionId)
    .single();
  if (error) throw error;

  const { error: e } = await db.from("kasse_beobachtungen").upsert(
    {
      zeilen_uuid: stabileUuid(`sumup-umfrage:${z.id}`),
      standort_id: z.standort_id,
      bon_nr: null,
      zeitstempel: z.zeitstempel,
      sumup_transaktion_id: z.id,
      ...werte,
    },
    { onConflict: "sumup_transaktion_id" }
  );
  if (e) throw e;
}
