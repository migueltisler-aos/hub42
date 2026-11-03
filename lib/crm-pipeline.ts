// Lader für das Pipeline-Dashboard (Trichter, Kundenliste) und die
// allgemeinen Aufgaben ohne Marke. Form in lib/crm-heute-model.ts.
import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  BEREICHE,
  TRICHTER_STUFEN,
  personAus,
  type AllgemeineAufgabe,
  type AufgabenDaten,
  type Bereich,
  type Kunde,
  type PipelineDaten,
  type Segment,
  type Stufe,
} from "@/lib/crm-heute-model";

const BERLIN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });
const tagBerlin = (d: Date | string) => BERLIN.format(typeof d === "string" ? new Date(d) : d);

const fehler = (r: { error: { message: string } | null }) => {
  if (r.error) throw new Error(`CRM Pipeline: ${r.error.message}`);
};

/** Montag der laufenden Woche, JJJJ-MM-TT. */
function wochenbeginn(heute: string) {
  const d = new Date(`${heute}T00:00:00Z`);
  const tag = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - tag * 86_400_000).toISOString().slice(0, 10);
}

export async function ladeAllgemeineAufgaben(): Promise<AufgabenDaten> {
  const db = getSupabaseAdmin();
  const heute = tagBerlin(new Date());
  const seitGestern = new Date(Date.parse(`${heute}T00:00:00Z`) - 86_400_000).toISOString();

  const r = await db
    .from("crm_aufgaben")
    .select("id, titel, faellig_am, wer, erledigt_am, bereich")
    .is("brand_id", null)
    .is("projekt_id", null)
    .or(`erledigt_am.is.null,erledigt_am.gte.${seitGestern}`);
  fehler(r);

  type Zeile = { id: string; titel: string; faellig_am: string | null; wer: string | null; erledigt_am: string | null; bereich: string | null };
  const aufgaben: AllgemeineAufgabe[] = ((r.data ?? []) as Zeile[])
    // Erledigtes bleibt nur bis Tagesende sichtbar.
    .filter((a) => a.erledigt_am === null || tagBerlin(a.erledigt_am) === heute)
    .map((a) => ({
      id: a.id,
      titel: a.titel,
      faellig: a.faellig_am,
      verantwortlich: personAus(a.wer),
      erledigt: a.erledigt_am !== null,
      bereich: (BEREICHE as readonly string[]).includes(a.bereich ?? "") ? (a.bereich as Bereich) : null,
    }));

  return { heute, aufgaben };
}

export async function ladePipeline(): Promise<PipelineDaten> {
  const db = getSupabaseAdmin();
  const heute = tagBerlin(new Date());
  const woche = wochenbeginn(heute);
  const monat = `${heute.slice(0, 8)}01`;

  const [marken, angebote] = await Promise.all([
    db.from("pipeline_brands").select("id, name, stufe, segment, zugewiesen, stufe_seit"),
    db
      .from("pipeline_angebote")
      .select("id, brand_id, angebot_nr, status, start_datum, laufzeit_monate, gemietete_breite_cm, tasting, positionen, angenommen_am, created_at"),
  ]);
  fehler(marken);
  fehler(angebote);

  type Marke = { id: string; name: string; stufe: Stufe; segment: Segment; zugewiesen: string | null; stufe_seit: string | null };
  const alle = (marken.data ?? []) as Marke[];
  const zaehle = (s: Stufe) => alle.filter((b) => b.stufe === s).length;
  const kundenZeilen = alle.filter((b) => b.stufe === "Kunde");
  const kundeSeit = (b: Marke) => (b.stufe_seit ? tagBerlin(b.stufe_seit) : null);

  type Angebot = {
    id: string; brand_id: string | null; angebot_nr: string; status: string; start_datum: string | null;
    laufzeit_monate: number | null; gemietete_breite_cm: number | null; tasting: boolean | null;
    positionen: { label?: string }[] | null; angenommen_am: string | null; created_at: string;
  };
  const angebotListe = (angebote.data ?? []) as Angebot[];

  const trichter = {
    stufen: TRICHTER_STUFEN.map((stufe) => ({ stufe, anzahl: zaehle(stufe) })),
    spaeter: zaehle("Später"),
    verloren: zaehle("Verloren"),
    zusagenWoche: kundenZeilen.filter((b) => (kundeSeit(b) ?? "") >= woche).length,
    zusagenMonat: kundenZeilen.filter((b) => (kundeSeit(b) ?? "") >= monat).length,
    offeneAngebote: angebotListe.filter((a) => a.status === "Versendet" || a.status === "Angefragt").length,
  };

  const ids = kundenZeilen.map((b) => b.id);
  if (ids.length === 0) return { trichter, kunden: [] };

  const [projekte, notizen] = await Promise.all([
    db.from("crm_projekte").select("id, brand_id, crm_meilensteine(id, titel, faellig_am, erledigt_am, reihenfolge)").in("brand_id", ids),
    db
      .from("crm_aktivitaeten")
      .select("id, brand_id, inhalt, titel, wann, wer")
      .eq("typ", "Notiz")
      .in("brand_id", ids)
      .order("wann", { ascending: false }),
  ]);
  fehler(projekte);
  fehler(notizen);

  type Projekt = { id: string; brand_id: string; crm_meilensteine: { id: string; titel: string; faellig_am: string | null; erledigt_am: string | null; reihenfolge: number }[] };
  type Notiz = { id: string; brand_id: string; inhalt: string | null; titel: string; wann: string; wer: string | null };

  const kunden: Kunde[] = kundenZeilen
    .map((b) => {
      const eigene = angebotListe
        .filter((a) => a.brand_id === b.id)
        .sort((x, y) => (y.angenommen_am ?? y.created_at).localeCompare(x.angenommen_am ?? x.created_at));
      // Das angenommene Angebot zählt; ohne es das jüngste, damit die Zusage sichtbar bleibt.
      const a = eigene.find((x) => x.status === "Angenommen") ?? eigene[0];
      const meilensteine = ((projekte.data ?? []) as Projekt[])
        .filter((p) => p.brand_id === b.id)
        .flatMap((p) => [...p.crm_meilensteine].sort((x, y) => x.reihenfolge - y.reihenfolge))
        .map((m) => ({ id: m.id, titel: m.titel, faellig: m.faellig_am, erledigt: m.erledigt_am !== null }));
      const updates = ((notizen.data ?? []) as Notiz[])
        .filter((n) => n.brand_id === b.id)
        .slice(0, 10)
        .map((n) => ({ id: n.id, text: n.inhalt ?? n.titel, wann: n.wann, wer: n.wer }));
      return {
        id: b.id,
        name: b.name,
        segment: b.segment,
        besitzer: personAus(b.zugewiesen),
        kundeSeit: kundeSeit(b),
        angebot: a
          ? {
              nr: a.angebot_nr,
              status: a.status,
              start: a.start_datum,
              laufzeitMonate: a.laufzeit_monate,
              breiteCm: a.gemietete_breite_cm,
              tasting: a.tasting ?? false,
              positionen: (a.positionen ?? []).map((p) => p.label ?? "").filter(Boolean),
            }
          : null,
        meilensteine,
        updates,
      };
    })
    .sort((x, y) => (y.kundeSeit ?? "").localeCompare(x.kundeSeit ?? ""));

  return { trichter, kunden };
}
