// Monatslauf der Kommissionsabrechnung (intern): Entwurf → final → bezahlt.
import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";
import { rechneMonat, type Konditionen } from "./marke";
import { abrechnungsGrenzen, type Abrechnung } from "./abrechnung-model";
import { gutschriftPdf, rechnungPdf } from "./abrechnung-pdf";
import { firmaLuecken, hub42Firma } from "./hub42-firma";

export interface LaufZeile {
  brandId: string;
  name: string;
  abrechnung: Abrechnung;
  konditionen: Konditionen | null;
  gespeichert: { id: string; status: string; gs_nr: string | null; rg_nr: string | null; bezahlt_am: string | null } | null;
  hindernisse: string[];
}

const monatText = (z: string) => {
  const [j, m] = z.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, 15)).toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });
};
const leistungszeitraum = (z: string) => {
  const [j, m] = z.split("-").map(Number);
  const ende = new Date(Date.UTC(j, m, 0)).getUTCDate();
  // Im Startmonat beginnt der Zeitraum erst am ABRECHNUNG_AB
  const start = abrechnungsGrenzen(z).abTag?.slice(8, 10) ?? "01";
  return `${start}.${String(m).padStart(2, "0")}.${j} - ${ende}.${String(m).padStart(2, "0")}.${j}`;
};

export function hindernisse(k: Konditionen | null, a: Abrechnung): string[] {
  const h: string[] = [];
  if (!k) return ["keine Stammdaten"];
  if (k.status !== "freigegeben") h.push("Stammdaten nicht freigegeben");
  if (!k.gutschrift_zustimmung_am) h.push("keine Zustimmung zum Gutschriftverfahren");
  if (!k.ust_idnr && !k.steuernummer) h.push("USt-IdNr./Steuernummer fehlt");
  if (!k.iban && a.auszahlung_ct > 0) h.push("IBAN fehlt");
  if (a.fehlender_satz.length) h.push(`MwSt-Satz fehlt: ${a.fehlender_satz.join(", ")}`);
  h.push(...firmaLuecken(hub42Firma()).map((l) => `Hub42-Daten fehlen: ${l}`));
  return h;
}

/** Alle Marken mit Verkäufen im Monat oder mit Miete. */
export async function ladeLauf(zeitraum: string): Promise<LaufZeile[]> {
  const db = getSupabaseAdmin();
  const { von, bis } = abrechnungsGrenzen(zeitraum);
  const [verk, kond, gesp] = await Promise.all([
    db.from("kasse_verkaeufe").select("brand_id").gte("zeitstempel", von).lt("zeitstempel", bis).not("brand_id", "is", null).limit(20000),
    db.from("brand_konditionen").select("brand_id, miete_netto_monat, status"),
    db.from("abrechnungen").select("id, brand_id, status, gs_nr, rg_nr, bezahlt_am").eq("zeitraum", zeitraum),
  ]);
  for (const r of [verk, kond, gesp]) if (r.error) throw r.error;

  const ids = new Set<string>([
    ...(verk.data ?? []).map((v) => v.brand_id as string),
    ...(kond.data ?? []).filter((k) => Number(k.miete_netto_monat) > 0 && k.status === "freigegeben").map((k) => k.brand_id),
    ...(gesp.data ?? []).map((g) => g.brand_id),
  ]);
  if (ids.size === 0) return [];
  const { data: namen, error } = await db.from("pipeline_brands").select("id, name").in("id", [...ids]);
  if (error) throw error;

  const zeilen = await Promise.all(
    (namen ?? []).map(async (m) => {
      const { abrechnung, konditionen } = await rechneMonat(m.id, zeitraum);
      const g = (gesp.data ?? []).find((x) => x.brand_id === m.id) ?? null;
      return { brandId: m.id, name: m.name, abrechnung, konditionen, gespeichert: g, hindernisse: hindernisse(konditionen, abrechnung) };
    })
  );
  return zeilen.sort((a, b) => a.name.localeCompare(b.name, "de"));
}

function spalten(a: Abrechnung, k: Konditionen | null) {
  return {
    umsatz_brutto_ct: a.umsatz_brutto_ct,
    provision_ct: a.provision_ct,
    gs_netto_ct: a.gs_netto_ct,
    gs_ust_ct: a.gs_ust_ct,
    gs_brutto_ct: a.gs_brutto_ct,
    miete_netto_ct: a.miete_netto_ct,
    rg_ust_ct: a.rg_ust_ct,
    rg_brutto_ct: a.rg_brutto_ct,
    vortrag_alt_ct: a.vortrag_alt_ct,
    auszahlung_ct: a.auszahlung_ct,
    vortrag_neu_ct: a.vortrag_neu_ct,
    details: {
      saetze: a.saetze,
      positionen: a.positionen,
      konditionen: k
        ? { provision_pct: k.provision_pct, provision_basis: k.provision_basis, kleinunternehmer: k.kleinunternehmer, miete_netto_monat: k.miete_netto_monat, firma: k.firma, iban: k.iban, ust_idnr: k.ust_idnr, steuernummer: k.steuernummer }
        : null,
    },
  };
}

export async function finalisieren(brandId: string, zeitraum: string, von: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { abrechnung: a, konditionen: k } = await rechneMonat(brandId, zeitraum);
  const h = hindernisse(k, a);
  if (h.length) throw new Error(`Nicht finalisierbar: ${h.join("; ")}`);

  // Entwurf anlegen/aktualisieren (nie eine finale Zeile überschreiben)
  const { data: vorh } = await db.from("abrechnungen").select("id, status").eq("brand_id", brandId).eq("zeitraum", zeitraum).maybeSingle();
  if (vorh && vorh.status !== "entwurf") throw new Error("Bereits finalisiert.");
  const { data: zeile, error } = await db
    .from("abrechnungen")
    .upsert({ brand_id: brandId, zeitraum, status: "entwurf", ...spalten(a, k) }, { onConflict: "brand_id,zeitraum" })
    .select("id")
    .single();
  if (error) throw error;

  const { data: nr, error: e2 } = await db.rpc("abrechnung_nummern_ziehen", { p_id: zeile.id });
  if (e2) throw e2;
  const { gs_nr, rg_nr } = (Array.isArray(nr) ? nr[0] : nr) as { gs_nr: string; rg_nr: string | null };

  const { data: marke } = await db.from("pipeline_brands").select("name").eq("id", brandId).single();
  const belege = {
    firma: hub42Firma(),
    marke: { name: marke?.name ?? "" },
    k: k!,
    a,
    zeitraumText: monatText(zeitraum),
    leistungszeitraum: leistungszeitraum(zeitraum),
    gsNr: gs_nr,
    rgNr: rg_nr,
    ausgestellt: new Date(),
  };
  const gsPfad = `abrechnungen/${brandId}/${zeitraum}-${gs_nr}.pdf`;
  const up1 = await db.storage.from("marken").upload(gsPfad, await gutschriftPdf(belege), { contentType: "application/pdf", upsert: true });
  if (up1.error) throw up1.error;
  let rgPfad: string | null = null;
  if (rg_nr) {
    rgPfad = `abrechnungen/${brandId}/${zeitraum}-${rg_nr}.pdf`;
    const up2 = await db.storage.from("marken").upload(rgPfad, await rechnungPdf(belege), { contentType: "application/pdf", upsert: true });
    if (up2.error) throw up2.error;
  }

  const { error: e3 } = await db
    .from("abrechnungen")
    .update({
      status: "final",
      gs_pdf_pfad: gsPfad,
      rg_pdf_pfad: rgPfad,
      finalisiert_am: new Date().toISOString(),
      finalisiert_von: von,
      // Nullsummen-Monat ohne Auszahlung gilt sofort als erledigt
      ...(a.auszahlung_ct === 0 ? { status: "bezahlt", bezahlt_am: new Date().toISOString() } : {}),
    })
    .eq("id", zeile.id);
  if (e3) throw e3;
}

export async function alsBezahlt(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("abrechnungen")
    .update({ status: "bezahlt", bezahlt_am: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "final");
  if (error) throw error;
}

/** Finale, noch nicht bezahlte Abrechnungen eines Monats mit Auszahlung > 0. */
export async function ladeZahllauf(zeitraum: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("abrechnungen")
    .select("id, brand_id, zeitraum, gs_nr, umsatz_brutto_ct, gs_brutto_ct, rg_brutto_ct, auszahlung_ct, details, pipeline_brands(name)")
    .eq("zeitraum", zeitraum)
    .eq("status", "final")
    .gt("auszahlung_ct", 0);
  if (error) throw error;
  const ids = (data ?? []).map((d) => d.brand_id);
  const { data: kond } = await db.from("brand_konditionen").select("brand_id, iban, bic, kontoinhaber, firma").in("brand_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  return (data ?? []).map((d) => {
    const k = (kond ?? []).find((x) => x.brand_id === d.brand_id);
    const det = d.details as { positionen?: { menge: number }[] };
    return {
      id: d.id,
      brand_name: (d.pipeline_brands as unknown as { name: string } | null)?.name ?? "",
      kontoinhaber: k?.kontoinhaber ?? k?.firma ?? "",
      iban: k?.iban ?? "",
      bic: k?.bic ?? null,
      gs_nr: d.gs_nr ?? "",
      menge: (det.positionen ?? []).reduce((a, p) => a + p.menge, 0),
      brutto_ct: Number(d.umsatz_brutto_ct),
      provision_ct: Number(d.umsatz_brutto_ct) - Number(d.gs_brutto_ct),
      miete_ct: Number(d.rg_brutto_ct),
      auszahlung_ct: Number(d.auszahlung_ct),
    };
  });
}
