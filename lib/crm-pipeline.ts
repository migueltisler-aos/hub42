// Lader für das Pipeline-Dashboard (Trichter, Kundenliste) und die
// allgemeinen Aufgaben ohne Marke. Form in lib/crm-heute-model.ts.
import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { driveBereit } from "@/lib/drive";
import {
  BEREICHE,
  TRICHTER_STUFEN,
  personAus,
  type AllgemeineAufgabe,
  type AufgabenDaten,
  type AufgabenProjekt,
  type Umfrage,
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

  const [r, historieZeilen, p, z] = await Promise.all([
    db
      .from("crm_aufgaben")
      .select(
        `id, titel, faellig_am, wer, erledigt_am, bereich, link, aufgaben_projekt_id,
         crm_aufgaben_stimmen(wer, wert),
         crm_aufgaben_dateien(id, name, link, created_at),
         crm_umfragen(id, frage, mehrfach, geschlossen_am, crm_umfrage_optionen(id, text, pos, crm_umfrage_stimmen(wer)))`
      )
      .is("brand_id", null)
      .is("projekt_id", null)
      .or(`erledigt_am.is.null,erledigt_am.gte.${seitGestern}`),
    ladeHistorie(),
    db.from("crm_aufgaben_projekte").select("id, titel, wer, faellig_am, abgeschlossen_am").order("created_at"),
    // Zählung je Projekt über alle Aufgaben, auch die längst erledigten.
    db.from("crm_aufgaben").select("aufgaben_projekt_id, erledigt_am").not("aufgaben_projekt_id", "is", null),
  ]);
  fehler(r);
  fehler(p);
  fehler(z);

  type ProjektZeile = { id: string; titel: string; wer: string | null; faellig_am: string | null; abgeschlossen_am: string | null };
  const zaehlung = new Map<string, { offen: number; erledigt: number }>();
  for (const a of (z.data ?? []) as { aufgaben_projekt_id: string; erledigt_am: string | null }[]) {
    const c = zaehlung.get(a.aufgaben_projekt_id) ?? { offen: 0, erledigt: 0 };
    if (a.erledigt_am) c.erledigt += 1;
    else c.offen += 1;
    zaehlung.set(a.aufgaben_projekt_id, c);
  }
  const projekte: AufgabenProjekt[] = ((p.data ?? []) as ProjektZeile[]).map((x) => ({
    id: x.id,
    titel: x.titel,
    verantwortlich: personAus(x.wer),
    faellig: x.faellig_am,
    abgeschlossen: x.abgeschlossen_am !== null,
    ...(zaehlung.get(x.id) ?? { offen: 0, erledigt: 0 }),
  }));
  const projektName = new Map(projekte.map((x) => [x.id, x.titel]));

  const historie = historieZeilen.map((a) => ({
    id: a.id,
    titel: a.titel,
    verantwortlich: personAus(a.wer),
    erledigtAm: a.erledigt_am,
    erledigtVon: a.erledigt_von,
    notiz: a.erledigt_notiz,
    link: a.erledigt_link,
    marke: a.pipeline_brands?.name ?? null,
    bereich: bereichAus(a.bereich),
    projekt: a.aufgaben_projekt_id ? (projektName.get(a.aufgaben_projekt_id) ?? null) : null,
  }));

  type UmfrageZeile = {
    id: string; frage: string; mehrfach: boolean; geschlossen_am: string | null;
    crm_umfrage_optionen: { id: string; text: string; pos: number; crm_umfrage_stimmen: { wer: string }[] | null }[] | null;
  };
  type Zeile = {
    id: string; titel: string; faellig_am: string | null; wer: string | null; erledigt_am: string | null;
    bereich: string | null; link: string | null; aufgaben_projekt_id: string | null;
    crm_aufgaben_stimmen: { wer: string; wert: number }[] | null;
    crm_aufgaben_dateien: { id: string; name: string; link: string; created_at: string }[] | null;
    // Eins-zu-eins über aufgabe_id unique: PostgREST liefert ein Objekt, ältere Fassungen ein Array.
    crm_umfragen: UmfrageZeile | UmfrageZeile[] | null;
  };
  const umfrageAus = (u: Zeile["crm_umfragen"]): Umfrage | null => {
    const x = Array.isArray(u) ? u[0] : u;
    if (!x) return null;
    return {
      id: x.id,
      frage: x.frage,
      mehrfach: x.mehrfach,
      geschlossen: x.geschlossen_am !== null,
      optionen: [...(x.crm_umfrage_optionen ?? [])]
        .sort((a, b) => a.pos - b.pos)
        .map((o) => ({ id: o.id, text: o.text, wer: (o.crm_umfrage_stimmen ?? []).map((st) => personAus(st.wer)) })),
    };
  };

  const aufgaben: AllgemeineAufgabe[] = ((r.data ?? []) as unknown as Zeile[])
    // Erledigtes bleibt nur bis Tagesende in den Gruppen, danach steht es im Verlauf.
    .filter((a) => a.erledigt_am === null || tagBerlin(a.erledigt_am) === heute)
    .map((a) => ({
      id: a.id,
      titel: a.titel,
      faellig: a.faellig_am,
      verantwortlich: personAus(a.wer),
      erledigt: a.erledigt_am !== null,
      bereich: bereichAus(a.bereich),
      link: a.link,
      stimmen: (a.crm_aufgaben_stimmen ?? []).map((st) => ({ wer: personAus(st.wer), wert: st.wert < 0 ? (-1 as const) : (1 as const) })),
      projektId: a.aufgaben_projekt_id,
      dateien: [...(a.crm_aufgaben_dateien ?? [])]
        .sort((x, y) => x.created_at.localeCompare(y.created_at))
        .map((d) => ({ id: d.id, name: d.name, link: d.link })),
      umfrage: umfrageAus(a.crm_umfragen),
    }));

  return { heute, aufgaben, historie, projekte, drive: driveBereit() };
}

type HistorieZeile = {
  id: string; titel: string; wer: string | null; bereich: string | null; erledigt_am: string;
  erledigt_von: string | null; erledigt_notiz: string | null; erledigt_link: string | null;
  aufgaben_projekt_id: string | null; pipeline_brands: { name: string } | null;
};

/** Der ganze Verlauf: alle erledigten Aufgaben, auch die mit Marke, jüngste zuerst.
    Seitenweise, weil Supabase eine Abfrage bei 1000 Zeilen kappt. */
async function ladeHistorie(): Promise<HistorieZeile[]> {
  const db = getSupabaseAdmin();
  const alle: HistorieZeile[] = [];
  for (let von = 0; ; von += HISTORIE_SEITE) {
    const h = await db
      .from("crm_aufgaben")
      .select("id, titel, wer, bereich, erledigt_am, erledigt_von, erledigt_notiz, erledigt_link, aufgaben_projekt_id, pipeline_brands(name)")
      .not("erledigt_am", "is", null)
      .order("erledigt_am", { ascending: false })
      .order("id")
      .range(von, von + HISTORIE_SEITE - 1);
    fehler(h);
    const seite = (h.data ?? []) as unknown as HistorieZeile[];
    alle.push(...seite);
    if (seite.length < HISTORIE_SEITE) return alle;
  }
}

const HISTORIE_SEITE = 1000;

const bereichAus = (b: string | null): Bereich | null =>
  (BEREICHE as readonly string[]).includes(b ?? "") ? (b as Bereich) : null;

export async function ladePipeline(): Promise<PipelineDaten> {
  const db = getSupabaseAdmin();
  const heute = tagBerlin(new Date());
  const woche = wochenbeginn(heute);
  const monat = `${heute.slice(0, 8)}01`;

  const [marken, angebote, zusagenRoh] = await Promise.all([
    db.from("pipeline_brands").select("id, name, stufe, segment, zugewiesen, stufe_seit"),
    db
      .from("pipeline_angebote")
      .select("id, brand_id, angebot_nr, status, start_datum, laufzeit_monate, gemietete_breite_cm, tasting, positionen, angenommen_am, created_at"),
    db
      .from("crm_zusagen")
      .select("id, brand_id, produkt, klasse, regal_cm, laufzeit_monate, monat_netto, vertragswert_netto, gebucht_am, status")
      .neq("status", "storniert")
      .order("gebucht_am", { ascending: false }),
  ]);
  fehler(marken);
  fehler(angebote);
  fehler(zusagenRoh);

  type ZusageZeile = {
    id: string; brand_id: string; produkt: string; klasse: string | null; regal_cm: number | null;
    laufzeit_monate: number | null; monat_netto: string | number | null; vertragswert_netto: string | number | null;
    gebucht_am: string | null; status: string;
  };
  // numeric kommt aus PostgREST als Zahl oder Text, je nach Größe.
  const zahl = (v: string | number | null) => (v === null ? null : Number(v));
  const zusagenListe = ((zusagenRoh.data ?? []) as ZusageZeile[]).map((z) => ({
    brandId: z.brand_id,
    zusage: {
      id: z.id,
      produkt: z.produkt,
      klasse: z.klasse,
      regalCm: z.regal_cm,
      laufzeitMonate: z.laufzeit_monate,
      monatNetto: zahl(z.monat_netto),
      vertragswert: zahl(z.vertragswert_netto),
      gebuchtAm: z.gebucht_am,
      status: z.status,
    },
  }));
  const summe = (liste: typeof zusagenListe, f: (z: (typeof zusagenListe)[number]["zusage"]) => number | null) =>
    liste.reduce((s, z) => s + (f(z.zusage) ?? 0), 0);
  const seit = (tag: string) => zusagenListe.filter((z) => (z.zusage.gebuchtAm ?? "") >= tag);

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
    zusagen: {
      anzahl: zusagenListe.length,
      vertragswert: summe(zusagenListe, (z) => z.vertragswert),
      monat: summe(zusagenListe, (z) => z.monatNetto),
      regalCm: summe(zusagenListe, (z) => z.regalCm),
    },
    wertWoche: summe(seit(woche), (z) => z.vertragswert),
    wertMonat: summe(seit(monat), (z) => z.vertragswert),
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
        zusagen: zusagenListe.filter((z) => z.brandId === b.id).map((z) => z.zusage),
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
    // Größter Vertragswert zuerst, bei Gleichstand der jüngste Kunde.
    .sort((x, y) => {
      const wert = (k: Kunde) => k.zusagen.reduce((s, z) => s + (z.vertragswert ?? 0), 0);
      return wert(y) - wert(x) || (y.kundeSeit ?? "").localeCompare(x.kundeSeit ?? "");
    });

  return { trichter, kunden };
}
