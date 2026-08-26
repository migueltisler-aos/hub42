import { readFileSync } from "node:fs";
import { resolveMx } from "node:dns/promises";
import * as XLSX from "xlsx";
import dotenv from "dotenv";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeBrandName } from "@/lib/pipeline";
import { generatePersoSatz } from "@/lib/outreach/personalize";

dotenv.config({ path: ".env.local" });

/**
 * Import der Lead-Liste (xlsx) für die automatisierte Kaltakquise-Sequenz.
 * Schreibt direkt in pipeline_brands (kein separates leads-Schema) — matcht
 * bestehende Marken zuerst per E-Mail, dann per normalisiertem Namen, um
 * bestehende Kasse/Wareneingang/Angebote-Verknüpfungen (brand_id) nicht zu
 * verdoppeln.
 *
 * Personalisierungs-Satz: wenn die xlsx-Spalte leer ist, wird er automatisch
 * per Claude Haiku aus den bereits in pipeline_brands hinterlegten
 * Marken-Daten (Website, Instagram, Kategorie, Produkt, Notizen) generiert —
 * kein Copy-Paste aus einem Chat-Fenster nötig.
 *
 * Nur Zeilen mit gültiger Syntax+MX, nicht in suppression, prio in
 * ('hoch','mittel'), ko_flag=false UND einem (vorhandenen oder generierten)
 * Personalisierungs-Satz werden auf outreach_status='queued' gesetzt. Alle
 * anderen Zeilen werden trotzdem importiert/aktualisiert, aber NICHT
 * gequeued — Grund landet im Report am Ende.
 *
 * Aufruf: pnpm import:leads <pfad-zur-xlsx>
 */

interface XlsxRow {
  Marke?: string;
  "E-Mail"?: string;
  Ansprechpartner?: string;
  "Personalisierungs-Satz"?: string;
  Prio?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PRIOS = new Set(["hoch", "mittel", "pruefen", "niedrig"]);
const QUEUE_ELIGIBLE_PRIOS = new Set(["hoch", "mittel"]);

interface RowResult {
  marke: string;
  email: string;
  action: "inserted" | "updated";
  queued: boolean;
  skipReason?: string;
}

async function hasMx(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Nutzung: pnpm import:leads <pfad-zur-xlsx>");
    process.exit(1);
  }

  const workbook = XLSX.read(readFileSync(path));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<XlsxRow>(sheet, { defval: "" });

  const sb = getSupabaseAdmin();

  const { data: existingBrands, error: existingError } = await sb
    .from("pipeline_brands")
    .select(
      "id, name, email, ko_flag, website, instagram, kategorie, produkt, preisrange, standort, notizen"
    );
  if (existingError) throw existingError;

  type ExistingBrand = NonNullable<typeof existingBrands>[number];
  const byEmail = new Map<string, ExistingBrand>();
  const byName = new Map<string, ExistingBrand>();
  for (const b of existingBrands ?? []) {
    if (b.email) byEmail.set(b.email.toLowerCase().trim(), b);
    byName.set(normalizeBrandName(b.name), b);
  }

  const { data: suppressed, error: suppError } = await sb.from("suppression").select("email");
  if (suppError) throw suppError;
  const suppressedSet = new Set((suppressed ?? []).map((s) => s.email));

  const results: RowResult[] = [];

  for (const row of rows) {
    const marke = (row["Marke"] ?? "").toString().trim();
    const emailRaw = (row["E-Mail"] ?? "").toString().trim();
    const ansprechpartner = (row["Ansprechpartner"] ?? "").toString().trim() || null;
    let personaSatz = (row["Personalisierungs-Satz"] ?? "").toString().trim() || null;
    const prioRaw = (row["Prio"] ?? "").toString().trim().toLowerCase();

    if (!marke) {
      console.warn("Zeile ohne Marke übersprungen:", row);
      continue;
    }

    const email = emailRaw.toLowerCase();
    const prio = VALID_PRIOS.has(prioRaw) ? prioRaw : null;

    const existing = byEmail.get(email) ?? byName.get(normalizeBrandName(marke));

    if (!personaSatz) {
      try {
        personaSatz = await generatePersoSatz({
          name: marke,
          website: existing?.website ?? null,
          instagram: existing?.instagram ?? null,
          kategorie: existing?.kategorie ?? null,
          produkt: existing?.produkt ?? null,
          preisrange: existing?.preisrange ?? null,
          standort: existing?.standort ?? null,
          notizen: existing?.notizen ?? null,
        });
        if (personaSatz) console.log(`  KI-Satz für ${marke}: "${personaSatz}"`);
      } catch (err) {
        console.warn(`  KI-Generierung für ${marke} fehlgeschlagen:`, err);
      }
    }

    let skipReason: string | undefined;

    if (!email || !EMAIL_RE.test(email)) {
      skipReason = "invalid_email_syntax";
    } else {
      const domain = email.split("@")[1];
      if (!(await hasMx(domain))) skipReason = "no_mx_record";
    }
    if (!skipReason && suppressedSet.has(email)) skipReason = "suppressed";
    if (!skipReason && !prio) skipReason = "invalid_prio";
    if (!skipReason && prio && !QUEUE_ELIGIBLE_PRIOS.has(prio)) skipReason = `prio_${prio}_not_queued`;
    if (!skipReason && !personaSatz) skipReason = "no_perso_satz";
    if (!skipReason && existing?.ko_flag) skipReason = "ko_flag_set";

    const shouldQueue = !skipReason;

    const payload: Record<string, unknown> = {
      name: marke,
      email: emailRaw || existing?.email || null,
      ansprechpartner,
      perso_satz: personaSatz,
      prio,
    };
    if (shouldQueue) payload.outreach_status = "queued";

    if (existing) {
      const { error } = await sb.from("pipeline_brands").update(payload).eq("id", existing.id);
      if (error) throw error;
      results.push({ marke, email, action: "updated", queued: shouldQueue, skipReason });
    } else {
      const { error } = await sb.from("pipeline_brands").insert({
        ...payload,
        status: "Neu",
        ko_flag: false,
        gefunden_via: "cold_outreach_import",
      });
      if (error) throw error;
      results.push({ marke, email, action: "inserted", queued: shouldQueue, skipReason });
    }
  }

  const queuedCount = results.filter((r) => r.queued).length;
  const skipped = results.filter((r) => !r.queued);

  console.log(`\nImport abgeschlossen: ${results.length} Zeilen verarbeitet, ${queuedCount} auf 'queued' gesetzt.`);
  if (skipped.length > 0) {
    console.log(`\n${skipped.length} nicht gequeued:`);
    for (const s of skipped) {
      console.log(`  - ${s.marke} (${s.email || "keine E-Mail"}): ${s.skipReason}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
