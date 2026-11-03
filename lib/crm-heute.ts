// Lader für den CRM-Screen „Heute“: Aufgaben, Regelverstöße und Meilensteine
// aus Supabase, in der Form von lib/crm-heute-model.ts. Die SLA-Regeln stehen
// in docs/crm-plan.md, Abschnitt SLAs.
import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  personAus,
  type Aufgabe,
  type BrandKurz,
  type HeuteDaten,
  type MeilensteinFaellig,
  type SlaVerstoss,
  type Stufe,
} from "@/lib/crm-heute-model";

/** Wie weit „Demnächst“ und die Meilensteine nach vorn schauen. */
const VORSCHAU_TAGE = 7;
/** Stufen, in denen eine Marke eine offene Aufgabe braucht. Recherche und In Sequenz
    treibt die Outreach-Sequenz, dort wäre jede Marke ohne Aufgabe ein Fehlalarm. */
const BRAUCHT_AUFGABE: Stufe[] = ["Antwort", "Interesse", "Gespräch", "Angebot"];

const BERLIN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });
const tagBerlin = (d: Date | string) => BERLIN.format(typeof d === "string" ? new Date(d) : d);

const TAG_MS = 86_400_000;
const utc = (iso: string) => {
  const [j, m, t] = iso.split("-").map(Number);
  return Date.UTC(j, m - 1, t);
};
const tageZwischen = (von: string, bis: string) => Math.round((utc(bis) - utc(von)) / TAG_MS);
const plusTage = (iso: string, n: number) => new Date(utc(iso) + n * TAG_MS).toISOString().slice(0, 10);

/** Werktage nach `von` bis einschließlich `bis`, ohne Samstag und Sonntag. */
function werktageZwischen(von: string, bis: string) {
  let n = 0;
  for (let t = utc(von) + TAG_MS; t <= utc(bis); t += TAG_MS) {
    const tag = new Date(t).getUTCDay();
    if (tag !== 0 && tag !== 6) n++;
  }
  return n;
}

type BrandZeile = {
  id: string;
  name: string;
  stufe: Stufe;
  segment: BrandKurz["segment"];
  zugewiesen: string | null;
  stufe_seit: string | null;
};

type AufgabeZeile = {
  id: string;
  titel: string;
  faellig_am: string | null;
  wer: string | null;
  erledigt_am: string | null;
  created_by: string | null;
  pipeline_brands: BrandKurz | null;
  crm_projekte: { pipeline_brands: BrandKurz | null } | null;
};

type MeilensteinZeile = {
  id: string;
  titel: string;
  faellig_am: string;
  crm_projekte: { titel: string; wer: string | null; status: string } | null;
};

const kurz = (b: BrandKurz): BrandKurz => ({ id: b.id, name: b.name, stufe: b.stufe, segment: b.segment });

function quelleAus(createdBy: string | null): Aufgabe["quelle"] {
  if (createdBy === "migration" || createdBy === "bewerbung" || createdBy === "meilenstein") return createdBy;
  return "hand";
}

export async function ladeHeute(): Promise<HeuteDaten> {
  const db = getSupabaseAdmin();
  const heute = tagBerlin(new Date());
  const bis = plusTage(heute, VORSCHAU_TAGE);
  // Erledigt seit heute 00:00 Berlin; der Puffer von einem Tag fängt die Zeitzone ab,
  // gefiltert wird danach auf den Berliner Tag.
  const seitGestern = new Date(utc(heute) - TAG_MS).toISOString();

  const [offen, erledigt, marken, meilensteine, auswahl] = await Promise.all([
    db
      .from("crm_aufgaben")
      .select(
        "id, titel, faellig_am, wer, erledigt_am, created_by, pipeline_brands(id, name, stufe, segment), crm_projekte(pipeline_brands(id, name, stufe, segment))"
      )
      .is("erledigt_am", null)
      .or(`faellig_am.is.null,faellig_am.lte.${bis}`),
    db
      .from("crm_aufgaben")
      .select(
        "id, titel, faellig_am, wer, erledigt_am, created_by, pipeline_brands(id, name, stufe, segment), crm_projekte(pipeline_brands(id, name, stufe, segment))"
      )
      .gte("erledigt_am", seitGestern),
    db
      .from("pipeline_brands")
      .select("id, name, stufe, segment, zugewiesen, stufe_seit")
      .in("stufe", BRAUCHT_AUFGABE),
    db
      .from("crm_meilensteine")
      .select("id, titel, faellig_am, crm_projekte!inner(titel, wer, status)")
      .is("erledigt_am", null)
      .lte("faellig_am", bis)
      .not("crm_projekte.status", "in", "(Abgeschlossen,Abgebrochen)"),
    db.from("pipeline_brands").select("id, name").neq("stufe", "Gesperrt").order("name"),
  ]);

  for (const r of [offen, erledigt, marken, meilensteine, auswahl]) {
    if (r.error) throw new Error(`CRM Heute: ${r.error.message}`);
  }

  const aufgabeZeilen = [
    ...((offen.data ?? []) as unknown as AufgabeZeile[]),
    ...((erledigt.data ?? []) as unknown as AufgabeZeile[]).filter((a) => a.erledigt_am && tagBerlin(a.erledigt_am) === heute),
  ];

  const aufgaben: Aufgabe[] = aufgabeZeilen.flatMap((a) => {
    const brand = a.pipeline_brands ?? a.crm_projekte?.pipeline_brands;
    if (!brand) return [];
    return [
      {
        id: a.id,
        titel: a.titel,
        faellig: a.faellig_am,
        verantwortlich: personAus(a.wer),
        erledigt: a.erledigt_am !== null,
        brand: kurz(brand),
        quelle: quelleAus(a.created_by),
      },
    ];
  });

  const brandZeilen = (marken.data ?? []) as BrandZeile[];
  const sla = await regelverstoesse(brandZeilen, aufgabeZeilen, heute);

  const meilensteinListe: MeilensteinFaellig[] = ((meilensteine.data ?? []) as unknown as MeilensteinZeile[]).map((m) => ({
    id: m.id,
    projekt: m.crm_projekte?.titel ?? "Projekt",
    titel: m.titel,
    faellig: m.faellig_am,
    verantwortlich: personAus(m.crm_projekte?.wer),
  }));

  return {
    heute,
    aufgaben,
    sla,
    meilensteine: meilensteinListe,
    marken: (auswahl.data ?? []) as { id: string; name: string }[],
  };
}

/** Je Marke höchstens ein Verstoß, der dringendste zuerst geprüft. */
async function regelverstoesse(marken: BrandZeile[], aufgaben: AufgabeZeile[], heute: string): Promise<SlaVerstoss[]> {
  if (marken.length === 0) return [];
  const db = getSupabaseAdmin();

  const interesse = marken.filter((b) => b.stufe === "Interesse").map((b) => b.id);
  const angebot = marken.filter((b) => b.stufe === "Angebot").map((b) => b.id);

  const [termine, verlauf] = await Promise.all([
    interesse.length
      ? db.from("crm_aktivitaeten").select("brand_id, wann").eq("typ", "Termin").in("brand_id", interesse)
      : Promise.resolve({ data: [], error: null }),
    angebot.length
      ? db.from("crm_zeitleiste").select("brand_id, wann").in("brand_id", angebot)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (termine.error) throw new Error(`CRM Heute: ${termine.error.message}`);
  if (verlauf.error) throw new Error(`CRM Heute: ${verlauf.error.message}`);

  const letzteAktivitaet = new Map<string, string>();
  for (const z of (verlauf.data ?? []) as { brand_id: string; wann: string }[]) {
    const bisher = letzteAktivitaet.get(z.brand_id);
    if (!bisher || z.wann > bisher) letzteAktivitaet.set(z.brand_id, z.wann);
  }

  const mitOffenerAufgabe = new Set(
    aufgaben.filter((a) => a.erledigt_am === null).map((a) => a.pipeline_brands?.id).filter(Boolean)
  );

  const liste: SlaVerstoss[] = [];
  for (const b of marken) {
    const seit = tagBerlin(b.stufe_seit ?? new Date());
    const tage = tageZwischen(seit, heute);
    const basis = { id: b.id, besitzer: personAus(b.zugewiesen), brand: kurz(b) };

    if (b.stufe === "Antwort" && werktageZwischen(seit, heute) > 1) {
      liste.push({ ...basis, art: "antwort_ungeordnet", seit_tagen: tage });
    } else if (
      b.stufe === "Interesse" &&
      tage >= 1 &&
      !((termine.data ?? []) as { brand_id: string; wann: string }[]).some(
        (t) => t.brand_id === b.id && b.stufe_seit !== null && t.wann >= b.stufe_seit
      )
    ) {
      liste.push({ ...basis, art: "interesse_ohne_termin", seit_tagen: tage });
    } else if (b.stufe === "Angebot") {
      const letzte = tagBerlin(letzteAktivitaet.get(b.id) ?? b.stufe_seit ?? new Date());
      const still = tageZwischen(letzte, heute);
      if (still >= 14) liste.push({ ...basis, art: "angebot_stockt", seit_tagen: still });
      else if (!mitOffenerAufgabe.has(b.id)) liste.push({ ...basis, art: "haengt", seit_tagen: tage });
    } else if (b.stufe !== "Antwort" && !mitOffenerAufgabe.has(b.id)) {
      // Eine frische Antwort braucht Einordnen, keine Aufgabe.
      liste.push({ ...basis, art: "haengt", seit_tagen: tage });
    }
  }
  return liste;
}
