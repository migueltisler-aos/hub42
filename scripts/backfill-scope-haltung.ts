import dotenv from "dotenv";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  assessFit,
  deriveKoFlag,
  normalizeKategorie,
  suggestHaltungTags,
  type FitCheckData,
} from "@/lib/pipeline";
import { classifyBrand, type ClassifySource } from "@/lib/outreach/classify";
import {
  CONTACT_PATHS,
  IMPRESSUM_PATHS,
  REQUEST_DELAY_MS,
  extractEmails,
  fetchText,
  pickBestEmail,
  sleep,
  stripTags,
  toOrigin,
} from "@/lib/scrape";

dotenv.config({ path: ".env.local" });

/**
 * Füllt Scope (Größe + Belege) und Haltung (Satz + Tags + Quelle) für die
 * Bestandsdatensätze in pipeline_brands nach — bisher standen beide nur als
 * Prosa in `notizen` und mussten bei jeder Marke einzeln nachrecherchiert
 * werden.
 *
 * Drei Phasen:
 *   1. Kategorie-Normalisierung — rein deterministisch über
 *      normalizeKategorie(), kein API-Call. Räumt die 57 gewachsenen
 *      Freitextwerte auf die 6 auf, die der Filter in /pipeline kennt.
 *   2. Fit-Labels neu rechnen — deterministisch, kein API-Call. Die
 *      gespeicherten Labels stammen noch aus der Regex-Bewertung über
 *      `notizen`; 43 von 202 passten nicht mehr zu ihren eigenen Daten.
 *   3. Klassifikation — liest die markeneigenen Seiten (Startseite, /about,
 *      /ueber-uns …) und lässt sie von lib/outreach/classify.ts auswerten.
 *      Nur diese Phase braucht ANTHROPIC_API_KEY.
 *
 * Alles aus Phase 2 wird mit groesse_quelle='auto' geschrieben und in der
 * Tabelle gedimmt mit ° dargestellt: eine KI-Vermutung darf nicht aussehen
 * wie ein geprüfter Fakt. Sobald ein Mensch die Stufe im Formular anfasst,
 * wird daraus 'geprüft' — und dieses Skript lässt die Zeile danach in Ruhe.
 *
 * Aufruf:
 *   pnpm backfill:scope --dry-run --limit=10   (erst gegenlesen!)
 *   pnpm backfill:scope --limit=10
 *   pnpm backfill:scope
 *   pnpm backfill:scope --only=andenkraft      (eine Marke, Namensteil)
 */

interface BrandRow {
  id: string;
  name: string;
  website: string | null;
  instagram: string | null;
  kategorie: string | null;
  kategorie_kanonisch: string | null;
  produkt: string | null;
  preisrange: string | null;
  standort: string | null;
  notizen: string | null;
  follower_ca: number | null;
  groesse: number | null;
  groesse_quelle: string | null;
  haltung_satz: string | null;
  haltung_tags: string[] | null;
  retail_listung: boolean | null;
  eigene_filialen: boolean | null;
  funding: string | null;
  haendler_ca: number | null;
  website_key: string | null;
  hub42_fit: string | null;
  email: string | null;
}

const SELECT_COLUMNS =
  "id, name, website, website_key, instagram, kategorie, kategorie_kanonisch, produkt, " +
  "preisrange, standort, notizen, follower_ca, groesse, groesse_quelle, haltung_satz, " +
  "haltung_tags, retail_listung, eigene_filialen, funding, haendler_ca, hub42_fit, email";

/** Wie viele Unterseiten pro Marke maximal gelesen werden. */
const MAX_SEITEN = 3;

interface Flags {
  dryRun: boolean;
  limit: number | null;
  only: string | null;
}

function parseFlags(argv: string[]): Flags {
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const onlyArg = argv.find((a) => a.startsWith("--only="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : null;
  return {
    dryRun: argv.includes("--dry-run"),
    limit: limit != null && Number.isFinite(limit) && limit > 0 ? limit : null,
    only: onlyArg ? onlyArg.split("=")[1] : null,
  };
}

interface GeleseneSeiten {
  /** Für die Haltungs-/Scope-Auswertung — Text ohne Markup. */
  quellen: ClassifySource[];
  /** Aus `mailto:`-Links der Impressum-/Kontaktseiten, sonst null. */
  email: string | null;
}

/**
 * Liest die Seiten einer Marke in einem Durchgang: Startseite und
 * Selbstbeschreibung für die Auswertung, Impressum/Kontakt für die
 * Mailadresse. Sequenziell mit Pause — dieselbe Zurückhaltung wie im Scraper.
 *
 * Die Mailadresse kommt ausschließlich aus echten `mailto:`-Links (siehe
 * extractEmails) — Adressen aus Fließtext werden nicht geraten. Findet eine
 * Marke nur ein Kontaktformular, bleibt das Feld leer.
 */
async function readBrandPages(
  website: string | null,
  emailGesucht: boolean
): Promise<GeleseneSeiten> {
  const origin = toOrigin(website);
  if (!origin) return { quellen: [], email: null };

  const quellen: ClassifySource[] = [];
  let email: string | null = null;

  const home = await fetchText(origin);
  if (home) {
    const text = stripTags(home);
    if (text) quellen.push({ url: origin, text });
    // Viele Shops verlinken die Adresse schon im Footer.
    if (emailGesucht) {
      const treffer = extractEmails(home);
      if (treffer.length > 0) email = pickBestEmail(treffer);
    }
  }

  // Selbstbeschreibung zuerst — Impressum/Kontakt sind für die Haltung nutzlos.
  const selbstbeschreibung = CONTACT_PATHS.filter((p) =>
    /about|ueber-uns/.test(p)
  ).concat(["/ueber", "/story", "/philosophie", "/nachhaltigkeit", "/haendler"]);

  for (const path of selbstbeschreibung) {
    if (quellen.length >= MAX_SEITEN) break;
    await sleep(REQUEST_DELAY_MS);
    const html = await fetchText(`${origin}${path}`);
    if (!html) continue;
    if (emailGesucht && !email) {
      const treffer = extractEmails(html);
      if (treffer.length > 0) email = pickBestEmail(treffer);
    }
    const text = stripTags(html);
    // Kürzere Seiten sind meist 404-Platzhalter mit Navigation.
    if (text.length < 200) continue;
    quellen.push({ url: `${origin}${path}`, text });
  }

  // Erst jetzt Impressum/Kontakt — nur noch für die Adresse, nicht als Quelle
  // für die Haltung.
  if (emailGesucht && !email) {
    for (const path of IMPRESSUM_PATHS) {
      await sleep(REQUEST_DELAY_MS);
      const html = await fetchText(`${origin}${path}`);
      if (!html) continue;
      const treffer = extractEmails(html);
      if (treffer.length > 0) {
        email = pickBestEmail(treffer);
        break;
      }
    }
  }

  return { quellen, email };
}

interface Report {
  kategorie_normalisiert: number;
  fit_neu: number;
  klassifiziert: number;
  emails_gefunden: number;
  ohne_email: string[];
  ohne_website: string[];
  seiten_nicht_lesbar: string[];
  ohne_groesse: string[];
  ohne_haltung: string[];
  fehler: string[];
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const sb = getSupabaseAdmin();
  const heute = new Date().toISOString().split("T")[0];

  const report: Report = {
    kategorie_normalisiert: 0,
    fit_neu: 0,
    klassifiziert: 0,
    emails_gefunden: 0,
    ohne_email: [],
    ohne_website: [],
    seiten_nicht_lesbar: [],
    ohne_groesse: [],
    ohne_haltung: [],
    fehler: [],
  };

  console.log(
    `\nBackfill Scope & Haltung${flags.dryRun ? "  [DRY RUN — kein Schreibzugriff]" : ""}` +
      `${flags.limit ? `  [limit=${flags.limit}]` : ""}` +
      `${flags.only ? `  [only=${flags.only}]` : ""}\n`
  );

  const { data, error } = await sb.from("pipeline_brands").select(SELECT_COLUMNS);
  if (error) throw error;
  const alle = (data ?? []) as unknown as BrandRow[];

  // -------------------------------------------------------------------------
  // Phase 1 — Kategorie normalisieren (deterministisch, kein API-Call)
  // -------------------------------------------------------------------------
  console.log("Phase 1 — Kategorien normalisieren");
  const ohneKanon = alle.filter((b) => !b.kategorie_kanonisch);
  const nichtZuordenbar: string[] = [];

  for (const b of ohneKanon) {
    const kanon = normalizeKategorie(b.kategorie) ?? normalizeKategorie(b.produkt);
    if (!kanon) {
      nichtZuordenbar.push(`${b.name} (${b.kategorie ?? "ohne Kategorie"})`);
      continue;
    }
    if (!flags.dryRun) {
      const { error: updErr } = await sb
        .from("pipeline_brands")
        .update({ kategorie_kanonisch: kanon })
        .eq("id", b.id);
      if (updErr) {
        report.fehler.push(`${b.name}: Kategorie — ${updErr.message}`);
        continue;
      }
    }
    b.kategorie_kanonisch = kanon;
    report.kategorie_normalisiert++;
  }
  console.log(`  ${report.kategorie_normalisiert} von ${ohneKanon.length} zugeordnet`);
  if (nichtZuordenbar.length > 0) {
    // Kein stiller Rückfall auf "Sonstiges" — die Lücke bleibt sichtbar.
    console.log(`  ${nichtZuordenbar.length} nicht zuordenbar (bleiben leer):`);
    for (const n of nichtZuordenbar) console.log(`    · ${n}`);
  }

  // -------------------------------------------------------------------------
  // Phase 2 — Fit-Labels neu rechnen (deterministisch, kein API-Call)
  // -------------------------------------------------------------------------
  // Die gespeicherten Labels kommen noch aus der Regex-Bewertung über
  // `notizen`. Danach gilt: gespeichertes Label == was assessFit aus den
  // Feldern rechnet. Fehlende Daten heißen ab hier "Unbewertet", nicht
  // "Eher nicht" — die Lücke wird sichtbar statt als Absage getarnt.
  console.log("\nPhase 2 — Fit-Labels neu rechnen");
  const verschoben: Record<string, number> = {};

  for (const b of alle) {
    const fit = assessFit(b as FitCheckData);
    if (fit.label === b.hub42_fit) continue;
    const key = `${b.hub42_fit ?? "leer"} → ${fit.label}`;
    verschoben[key] = (verschoben[key] ?? 0) + 1;

    if (flags.dryRun) continue;
    const { error: updErr } = await sb
      .from("pipeline_brands")
      .update({
        hub42_fit: fit.label,
        fit_grund: fit.grund,
        ko_flag: deriveKoFlag(fit),
      })
      .eq("id", b.id);
    if (updErr) report.fehler.push(`${b.name}: Fit — ${updErr.message}`);
    else report.fit_neu++;
  }

  const summe = Object.values(verschoben).reduce((a, c) => a + c, 0);
  console.log(`  ${summe} von ${alle.length} Labels geändert${flags.dryRun ? " (dry run)" : ""}`);
  for (const [k, v] of Object.entries(verschoben).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v.toString().padStart(4)} × ${k}`);
  }

  // -------------------------------------------------------------------------
  // Phase 3 — Scope & Haltung klassifizieren
  // -------------------------------------------------------------------------
  // Nur Zeilen, die noch nichts haben UND nicht von einem Menschen geprüft
  // wurden. Ein 'geprüft'-Wert wird nie von einer KI-Vermutung überschrieben.
  // Auch Zeilen, die nur die Mailadresse vermissen — die Seiten werden für
  // beides in einem Durchgang gelesen, statt zweimal.
  let offen = alle.filter(
    (b) =>
      b.groesse_quelle !== "geprüft" &&
      (b.groesse == null || !b.haltung_satz || !b.email)
  );
  if (flags.only) {
    const q = flags.only.toLowerCase();
    offen = offen.filter((b) => b.name.toLowerCase().includes(q));
  }
  if (flags.limit) offen = offen.slice(0, flags.limit);

  console.log(`\nPhase 3 — Scope & Haltung für ${offen.length} Marken\n`);

  for (const [i, b] of offen.entries()) {
    const prefix = `[${i + 1}/${offen.length}] ${b.name}`;

    if (!toOrigin(b.website)) {
      report.ohne_website.push(b.name);
      console.log(`${prefix}: keine Website — übersprungen`);
      continue;
    }

    let klass;
    let gefundeneEmail: string | null = null;
    try {
      const gelesen = await readBrandPages(b.website, !b.email);
      gefundeneEmail = gelesen.email;
      if (gelesen.quellen.length === 0) {
        report.seiten_nicht_lesbar.push(b.name);
        console.log(`${prefix}: Seiten nicht lesbar — übersprungen`);
        continue;
      }
      klass = await classifyBrand(b, gelesen.quellen);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      report.fehler.push(`${b.name}: ${msg}`);
      console.log(`${prefix}: Fehler — ${msg}`);
      continue;
    }

    if (!klass) {
      report.seiten_nicht_lesbar.push(b.name);
      console.log(`${prefix}: keine Auswertung — übersprungen`);
      continue;
    }

    if (klass.groesse == null) report.ohne_groesse.push(b.name);
    if (!klass.haltung_satz) report.ohne_haltung.push(b.name);

    // Tags: aus der Auswertung, sonst aus dem Haltungs-Satz selbst ableiten
    // (der ist der beste Beleg) und ergänzend aus den Notizen — aber nur,
    // wenn es überhaupt einen belegten Satz gibt.
    const tags = klass.haltung_tags.length > 0
      ? klass.haltung_tags
      : klass.haltung_satz
        ? suggestHaltungTags(`${klass.haltung_satz} ${b.notizen ?? ""}`)
        : [];

    const patch = {
      groesse: klass.groesse ?? b.groesse,
      groesse_quelle: (klass.groesse ?? b.groesse) != null ? "auto" : null,
      haendler_ca: klass.haendler_ca ?? b.haendler_ca,
      retail_listung: klass.retail_listung ?? b.retail_listung,
      eigene_filialen: klass.eigene_filialen ?? b.eigene_filialen,
      funding: klass.funding ?? b.funding,
      haltung_satz: klass.haltung_satz ?? b.haltung_satz,
      haltung_tags: tags.length > 0 ? tags : b.haltung_tags,
      haltung_quelle: klass.haltung_quelle,
      // Lesedatum der Quelle, nicht "von Hand geprüft" — macht später
      // sichtbar, wie alt die Aussage ist.
      haltung_stand: klass.haltung_satz ? heute : null,
      kategorie_kanonisch:
        b.kategorie_kanonisch ?? normalizeKategorie(klass.kategorie_kanonisch),
      // Eine bestehende Adresse wird nie überschrieben.
      email: b.email ?? gefundeneEmail,
    };

    // Fit aus dem zusammengeführten Stand neu bewerten — dieselbe Funktion,
    // die upsertBrand benutzt, damit gespeichertes Label und Daten nicht
    // auseinanderlaufen.
    const fit = assessFit({ ...b, ...patch } as FitCheckData);

    const stufe = patch.groesse ?? "—";
    console.log(
      `${prefix}: Größe ${stufe}${klass.groesse_begruendung ? ` (${klass.groesse_begruendung})` : ""}\n` +
        `    Haltung: ${patch.haltung_satz ?? "— keine erkennbar"}\n` +
        `    Tags: ${tags.join(", ") || "—"}${patch.haltung_quelle ? `  Quelle: ${patch.haltung_quelle}` : ""}\n` +
        `    Fit: ${fit.label} — ${fit.grund}` +
        (b.email
          ? ""
          : gefundeneEmail
            ? `
    E-Mail gefunden: ${gefundeneEmail}`
            : `
    E-Mail: keine im Impressum verlinkt`)
    );

    if (!b.email) {
      if (gefundeneEmail) report.emails_gefunden++;
      else report.ohne_email.push(b.name);
    }

    if (flags.dryRun) continue;

    const { error: updErr } = await sb
      .from("pipeline_brands")
      .update({
        ...patch,
        hub42_fit: fit.label,
        fit_grund: fit.grund,
        ko_flag: deriveKoFlag(fit),
      })
      .eq("id", b.id);

    if (updErr) {
      report.fehler.push(`${b.name}: ${updErr.message}`);
      console.log(`    ✗ nicht gespeichert: ${updErr.message}`);
      continue;
    }
    report.klassifiziert++;
  }

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------
  console.log("\n─────────────────────────────────────────");
  console.log(`Kategorien normalisiert:   ${report.kategorie_normalisiert}`);
  console.log(`Fit-Labels neu gerechnet:  ${report.fit_neu}${flags.dryRun ? " (dry run)" : ""}`);
  console.log(`Scope/Haltung geschrieben: ${report.klassifiziert}${flags.dryRun ? " (dry run)" : ""}`);
  console.log(`Mailadressen gefunden:     ${report.emails_gefunden}`);

  const luecken: Array<[string, string[]]> = [
    ["ohne Website (nicht prüfbar)", report.ohne_website],
    ["Seiten nicht lesbar", report.seiten_nicht_lesbar],
    ["keine Größe ableitbar", report.ohne_groesse],
    ["keine Haltung erkennbar", report.ohne_haltung],
    ["keine Mailadresse im Impressum verlinkt", report.ohne_email],
    ["Fehler", report.fehler],
  ];
  for (const [titel, liste] of luecken) {
    if (liste.length === 0) continue;
    console.log(`\n${titel}: ${liste.length}`);
    for (const n of liste) console.log(`  · ${n}`);
  }

  console.log(
    "\nOffene Punkte bleiben als hub42_fit='Unbewertet' in /pipeline sichtbar —" +
      "\nsie verschwinden nicht als 'Eher nicht'.\n"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
