// Reine Domänen-Logik der Pipeline: Typen, Konstanten, Fit-Bewertung,
// Normalisierung, Formular-Parsing. Kein Datenzugriff, keine Seiteneffekte.
//
// Bewusst getrennt von lib/pipeline.ts: diese Datei wird auch von Client-
// Components importiert (BrandForm, PipelineClient, SendungForm), und
// lib/pipeline.ts zieht über lib/supabase-admin.ts den Service-Role-Key
// herein, der nie in ein Browser-Bundle darf. Gleiches Muster wie
// lib/deck-economics.ts.
export type BrandStatus =
  | "Neu"
  | "Kontaktiert"
  | "Antwort"
  | "Gespräch"
  | "Angebot"
  | "Onboarded"
  | "Abgelehnt"
  | "Später"
  | "Inaktiv";

/**
 * "Unbewertet" ist bewusst ein eigener Wert und nicht dasselbe wie
 * "Eher nicht": fehlende Daten sind keine Absage. Vorher landeten Brands
 * ohne Preisrange oder ohne das Wort "Gründer" in den Notizen bei
 * "Eher nicht" — was aussah wie ein Urteil, aber eine Datenlücke war, und
 * genau deshalb musste am Ende jede Brand nochmal einzeln geprüft werden.
 */
export type FitLabel = "Top" | "Gut" | "Eher nicht" | "Unbewertet";

/** Geschlossene Liste — verhindert das Freitext-Chaos, das `kategorie` hat. */
export const HALTUNG_TAGS = [
  "Regional",
  "Bio",
  "Vegan",
  "Direkthandel/Fair",
  "Upcycling/Zero-Waste",
  "Handmade/Manufaktur",
  "Sozial/Inklusion",
  "Frauen-geführt",
  "Transparenz-Herkunft",
  "Familienbetrieb",
] as const;
export type HaltungTag = (typeof HALTUNG_TAGS)[number];

/**
 * Trennt Marken-Leads von allem anderen, was zwangsläufig in derselben Tabelle
 * landet (Forschungspartner, später Investoren/Vermieter). Ohne diese Trennung
 * verwässert jeder Nicht-Marken-Datensatz die Zahl „x Brands in der Pipeline" —
 * und die Cold-Outreach-Sequenz zieht aus derselben Tabelle. Bewusst ohne
 * Check-Constraint in der DB, damit ein neuer Typ keine Migration erzwingt.
 */
export const BRAND_TYPEN = ["Brand", "Partner"] as const;
export type BrandTyp = (typeof BRAND_TYPEN)[number];

export const KATEGORIEN_KANONISCH = [
  "Food",
  "Drinks",
  "Beauty",
  "Lifestyle",
  "Home",
  "Sonstiges",
] as const;
export type KategorieKanonisch = (typeof KATEGORIEN_KANONISCH)[number];

/**
 * Scope-Leiter, verankert an Vertriebsbreite statt an Reichweite: eine Marke,
 * die überall im Regal steht, braucht keinen Entdecker-Store — unabhängig
 * davon, wie viele Follower sie hat. Follower bleiben Nebensignal.
 */
export const GROESSE_STUFEN = [
  { stufe: 1, label: "Manufaktur", hint: "Hand-/Kleinserie, nur eigener Shop" },
  { stufe: 2, label: "Klein", hint: "eigene Produktion, < 10 Händler" },
  { stufe: 3, label: "Wachsend", hint: "Fachhandel-Distribution, 10–100 Händler" },
  { stufe: 4, label: "Etabliert", hint: "überregional, Retail-Listung oder Filialen" },
  { stufe: 5, label: "Groß/Konzern", hint: "LEH-Regal, Konzerntochter, PE/VC" },
] as const;

export function groesseLabel(stufe: number | null): string {
  return GROESSE_STUFEN.find((s) => s.stufe === stufe)?.label ?? "—";
}

export interface Brand {
  id: string;
  typ: BrandTyp;
  name: string;
  website: string | null;
  website_key: string | null;
  instagram: string | null;
  email: string | null;
  linkedin: string | null;
  ansprechpartner: string | null;
  kategorie: string | null;
  kategorie_kanonisch: KategorieKanonisch | null;
  produkt: string | null;
  preisrange: string | null;
  standort: string | null;
  gefunden_via: string | null;
  zugewiesen: string | null;
  status: BrandStatus;
  kanal: string | null;
  datum_erstkontakt: string | null;
  datum_letzte_aktion: string | null;
  naechste_aktion: string | null;
  datum_naechste_aktion: string | null;
  feedback: string | null;
  hub42_fit: FitLabel | null;
  fit_grund: string | null;
  hub42_potenzial: string | null;
  notizen: string | null;
  follower_ca: number | null;
  // Scope
  groesse: number | null;
  groesse_quelle: "auto" | "geprüft" | null;
  haendler_ca: number | null;
  retail_listung: boolean | null;
  eigene_filialen: boolean | null;
  funding: string | null;
  // Haltung
  haltung_satz: string | null;
  haltung_tags: string[] | null;
  haltung_quelle: string | null;
  haltung_stand: string | null;
  created_at: string;
  created_by: string | null;
}

export type BrandInput = Omit<Brand, "id" | "created_at">;

export interface AiBrand {
  name: string;
  website?: string;
  instagram?: string;
  kategorie?: string;
  kategorie_kanonisch?: string;
  produkt?: string;
  preisrange?: string;
  standort?: string;
  notizen?: string;
  follower_ca?: number;
  groesse?: number;
  haendler_ca?: number;
  retail_listung?: boolean;
  eigene_filialen?: boolean;
  funding?: string;
  haltung_satz?: string;
  haltung_tags?: string[];
  haltung_quelle?: string;
}

export interface ImportResult {
  imported: number;
  duplicates: Array<{ name: string; existing_by: string | null; reason: "website" | "instagram" | "name" }>;
  errors: string[];
}

export interface FitCheckData {
  website?: string | null;
  instagram?: string | null;
  preisrange?: string | null;
  standort?: string | null;
  notizen?: string | null;
  kategorie?: string | null;
  follower_ca?: number | null;
  groesse?: number | null;
  haendler_ca?: number | null;
  retail_listung?: boolean | null;
  eigene_filialen?: boolean | null;
  funding?: string | null;
  haltung_satz?: string | null;
  haltung_tags?: string[] | null;
}

export interface FitCriterion {
  id: string;
  label: string;
  hint: string;
  /** Hard gate: one failure → always "Eher nicht" */
  gate?: boolean;
  /** Points contributed when passed (scored criteria only) */
  weight?: number;
  check: (b: FitCheckData) => boolean;
}

/**
 * Gates lesen ausschließlich strukturierte Felder — nie den Notizen-Freitext.
 * Der alte Regex-Ansatz war negations-blind: bei allen 7 Brands, deren Notizen
 * den LEH erwähnten, stand er dort als Ausschluss ("nicht in DM/Rossmann"),
 * das Gate schlug trotzdem an und stufte sie auf "Eher nicht".
 */
const GATE_CRITERIA: FitCriterion[] = [
  {
    id: "nicht_zu_gross",
    label: "Nicht schon überall (Scope ≤ Wachsend)",
    hint: "Größe 4–5 oder Breiten-Listung im LEH → braucht Hub42 nicht",
    gate: true,
    check: (b) => {
      if (b.groesse != null && b.groesse >= 4) return false;
      // Eine Retail-Listung sperrt nur, wenn sie Breite hat. „Erster
      // REWE-Markt als Meilenstein" ist das Gegenteil von „schon überall" —
      // vorher hat genau das eine Ein-Personen-Marke ausgeschlossen.
      if (b.retail_listung === true && (b.haendler_ca == null || b.haendler_ca >= 10)) {
        return false;
      }
      return true;
    },
  },
  {
    id: "kein_konzern",
    label: "Kein Konzern / kein PE-VC-Aufbau",
    hint: "Größe 5 oder Funding-Runden → passt nicht zur Curation",
    gate: true,
    check: (b) => {
      if (b.groesse === 5) return false;
      // Regex hier unkritisch: das Feld beschreibt ausschließlich Funding,
      // es gibt keinen Kontext, in dem die Begriffe als Ausschluss stehen.
      const f = (b.funding ?? "").toLowerCase();
      return !/series\s*[a-d]\b|private\s*equity|\bpe\b|venture|\bvc\b|mehrheitsbeteiligung|übernahme|konzern/.test(f);
    },
  },
];

// Weighted positive criteria — max 8 points total
const SCORED_CRITERIA: FitCriterion[] = [
  // Satz und Tags getrennt gewichtet: ein belegter Satz ohne Tag bekam vorher
  // 0 von 3 Punkten und rutschte auf "Eher nicht", obwohl die Haltung
  // dastand — die Tags sind nur der Filter-Index, nicht der Beleg.
  {
    id: "haltung_satz",
    label: "Haltung belegt (Satz vorhanden)",
    hint: "Wofür-sie-stehen-Satz setzen",
    weight: 2,
    check: (b) => !!b.haltung_satz?.trim(),
  },
  {
    id: "haltung_tags",
    label: "Haltung einsortiert (mind. 1 Tag)",
    hint: "Mindestens einen Haltungs-Tag setzen — macht sie filterbar",
    weight: 1,
    check: (b) => (b.haltung_tags?.length ?? 0) > 0,
  },
  {
    id: "fairer_preis",
    label: "Fairer Preis (10–60 €)",
    hint: "Preisrange setzen — Zahlen bis max. 60",
    weight: 2,
    check: (b) => {
      if (!b.preisrange?.trim()) return false;
      const nums = (b.preisrange.match(/\d+/g) ?? []).map(Number);
      return nums.length > 0 && Math.max(...nums) <= 60;
    },
  },
  {
    id: "eigener_kanal",
    label: "Eigene Discovery-Kanäle (Shop + Instagram)",
    hint: "Beide Felder müssen gesetzt sein",
    weight: 2,
    check: (b) => !!b.website?.trim() && !!b.instagram?.trim(),
  },
  {
    id: "entdeckbar",
    label: "DACH-Emerging Brand",
    hint: "Standort (DACH) setzen; unter 500.000 Follower",
    weight: 1,
    check: (b) => {
      const s = (b.standort ?? "").toLowerCase();
      const isDach = /deutschland|berlin|hamburg|münchen|köln|frankfurt|düsseldorf|austria|österreich|schweiz|germany/.test(s);
      return isDach && (b.follower_ca == null || b.follower_ca <= 500_000);
    },
  },
];

export const FIT_CRITERIA: FitCriterion[] = [
  ...GATE_CRITERIA,
  ...SCORED_CRITERIA,
];

export const FIT_MAX_SCORE = SCORED_CRITERIA.reduce((s, c) => s + (c.weight ?? 1), 0);

/**
 * Felder, ohne die es kein belastbares Urteil gibt. Fehlt eines, ist das
 * Ergebnis "Unbewertet" — nicht "Eher nicht".
 */
const PFLICHTFELDER: Array<{ key: string; label: string; missing: (b: FitCheckData) => boolean }> = [
  { key: "groesse", label: "Größe (Scope-Stufe)", missing: (b) => b.groesse == null },
  { key: "haltung_satz", label: "Wofür sie stehen (Satz)", missing: (b) => !b.haltung_satz?.trim() },
];

export interface FitAssessment {
  label: FitLabel;
  score: number;
  maxScore: number;
  /** Warum das Label so lautet — landet in fit_grund. */
  grund: string;
  /** Welche Pflichtfelder fehlen (leer, wenn bewertbar). */
  fehlendeFelder: string[];
}

export function assessFit(brand: FitCheckData): FitAssessment {
  const score = SCORED_CRITERIA.filter((c) => c.check(brand))
    .reduce((sum, c) => sum + (c.weight ?? 1), 0);

  // Gates zuerst: ein gerissenes Gate ist ein echtes Urteil und braucht
  // keine vollständigen Daten mehr.
  const gerissen = GATE_CRITERIA.filter((c) => !c.check(brand));
  if (gerissen.length > 0) {
    return {
      label: "Eher nicht",
      score,
      maxScore: FIT_MAX_SCORE,
      grund: `Ausschluss: ${gerissen.map((c) => c.label).join("; ")}`,
      fehlendeFelder: [],
    };
  }

  const fehlend = PFLICHTFELDER.filter((f) => f.missing(brand)).map((f) => f.label);
  if (fehlend.length > 0) {
    return {
      label: "Unbewertet",
      score,
      maxScore: FIT_MAX_SCORE,
      grund: `Noch nicht bewertbar — fehlt: ${fehlend.join(", ")}`,
      fehlendeFelder: fehlend,
    };
  }

  const bestanden = SCORED_CRITERIA.filter((c) => c.check(brand)).map((c) => c.label);
  const label: FitLabel = score >= 6 ? "Top" : score >= 3 ? "Gut" : "Eher nicht";
  return {
    label,
    score,
    maxScore: FIT_MAX_SCORE,
    grund: `${score}/${FIT_MAX_SCORE} Pkt${bestanden.length ? ` — ${bestanden.join("; ")}` : ""}`,
    fehlendeFelder: [],
  };
}

/**
 * Setzt das Sperr-Flag der Cold-Outreach-Sequenz aus derselben Bewertung
 * (lib/outreach/select-lead.ts und scripts/import-outreach-leads.ts prüfen
 * ko_flag), statt es separat pflegen zu müssen.
 *
 * Der Fit kann damit nur SPERREN, nie freigeben: `prio` bleibt bewusst der
 * manuelle Kanal aus der Lead-xlsx. Sonst hätte ein automatisch als "Top"
 * bewerteter Datensatz sich selbst die Freigabe zum Anschreiben erteilt —
 * und `import:leads` überschreibt `prio` ohnehin mit dem xlsx-Wert, zwei
 * Mechanismen auf einer Spalte.
 */
export function deriveKoFlag(fit: FitAssessment): boolean {
  return fit.label === "Eher nicht";
}

/**
 * Bildet die gewachsenen Freitext-Kategorien (57 verschiedene Werte auf 202
 * Zeilen) auf die 6 ab, die der Filter in /pipeline kennt. Bewusst
 * schlüsselwortbasiert statt als 57-Zeilen-Tabelle, damit auch der 58. Wert
 * greift. Gibt null zurück, wenn keine Regel passt — dann bleibt die Lücke
 * sichtbar, statt in "Sonstiges" zu verschwinden.
 */
const KATEGORIE_REGELN: Array<[RegExp, KategorieKanonisch]> = [
  [/getränk|drink|spirit|gin|bier|brand(y|wein)|wein|matcha|tee\b|kaffee|coffee|limo|saft|kombucha/, "Drinks"],
  [/kosmetik|beauty|skincare|pflege|bodycare|seife|deo|parfum|hygiene|wellness/, "Beauty"],
  [/food|snack|süß|schoko|gewürz|würz|brühe|brot|cerealien|aufstrich|konserve|fertiggericht|feinkost|öl|sauce|nahrung|backmischung|zutat|riegel|pasta|honig|salz|müsli|functional|free from|energy|protein|bites|curry|suppe|pilz|microgreen/, "Food"],
  [/home|haushalt|küche|kerze|duft|interior|wohn|zero.?waste/, "Home"],
  // Vor Lifestyle, sonst gewinnt "Accessoires" in "Tierbedarf / Accessoires".
  [/tier|pet\b|hund|katze/, "Sonstiges"],
  [/fashion|mode|textil|schmuck|accessoire|papeterie|print|design|spiel|geschenk|lifestyle|kinder|tasche/, "Lifestyle"],
];

export function normalizeKategorie(raw: string | null | undefined): KategorieKanonisch | null {
  if (!raw?.trim()) return null;
  // Datenbestand enthält typografische Bindestriche (U+2011/U+2013) —
  // vereinheitlichen, sonst greifen die Regeln bei "Zero‑Waste" nicht.
  const s = raw.toLowerCase().replace(/[‐-―]/g, "-");
  const exact = KATEGORIEN_KANONISCH.find((k) => k.toLowerCase() === s);
  if (exact) return exact;
  for (const [re, kat] of KATEGORIE_REGELN) {
    if (re.test(s)) return kat;
  }
  return null;
}

/**
 * Der frühere Regex-Scan über `notizen` — degradiert von "bewertet" zu
 * "schlägt vor". Er setzt nur Haltungs-Tags vor, nie `groesse` und nie
 * `haltung_satz`: eine Größenstufe aus Prosa zu raten war genau der Fehler,
 * und ein Haltungs-Satz braucht eine belegbare Quelle.
 */
export function suggestHaltungTags(text: string | null | undefined): HaltungTag[] {
  if (!text?.trim()) return [];
  const t = text.toLowerCase().replace(/[‐-―]/g, "-");
  const tags: HaltungTag[] = [];
  const add = (tag: HaltungTag) => { if (!tags.includes(tag)) tags.push(tag); };

  if (/\bbio\b|biologisch|öko|organic/.test(t)) add("Bio");
  if (/\bvegan/.test(t)) add("Vegan");
  if (/regional|aus der region|heimisch|lokale/.test(t)) add("Regional");
  if (/fair.?trade|fairer handel|direktbezug|direkthandel|direct trade|kooperative|kleinbauern/.test(t)) add("Direkthandel/Fair");
  if (/upcycl|zero.?waste|plastikfrei|gerettet|rest(e|verwertung)|nachfüll/.test(t)) add("Upcycling/Zero-Waste");
  if (/handgemacht|handgenäht|handgegossen|handwerk|manufaktur|kleine chargen|eigene röstung/.test(t)) add("Handmade/Manufaktur");
  if (/inklusion|menschen mit behinderung|sozial|gemeinnützig|non.?profit|spende/.test(t)) add("Sozial/Inklusion");
  if (/gründerin|inhaberin|frauen.?geführt|founderin/.test(t)) add("Frauen-geführt");
  if (/transparen|herkunft|nachverfolg|tree.?to.?bar|rückverfolg/.test(t)) add("Transparenz-Herkunft");
  if (/familien(betrieb|unternehmen)|generation|familienhaus|eltern/.test(t)) add("Familienbetrieb");

  return tags;
}

/**
 * Liest das BrandForm aus. Liegt hier und nicht in den beiden Server-Actions
 * (/pipeline/new und /pipeline/[id]), damit ein neues Feld nicht in einer der
 * beiden vergessen wird. `hub42_fit` steht bewusst NICHT drin — das Label
 * rechnet upsertBrand serverseitig aus den Feldern.
 */
export function brandFormToInput(formData: FormData): Partial<BrandInput> {
  const text = (key: string): string | null => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const zahl = (key: string): number | null => {
    const v = text(key);
    if (v == null) return null;
    const n = Number.parseInt(v.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };
  // "" bleibt null: unbekannt ist nicht dasselbe wie "Nein".
  const jaNein = (key: string): boolean | null => {
    const v = text(key);
    return v == null ? null : v === "Ja";
  };

  const tags = formData
    .getAll("haltung_tags")
    .filter((t): t is string => typeof t === "string")
    .filter((t) => (HALTUNG_TAGS as readonly string[]).includes(t));

  const groesse = zahl("groesse");
  const quelle = text("groesse_quelle");

  return {
    // Spalte ist not null — ein leeres Feld darf nicht als null durchlaufen.
    typ: ((text("typ") ?? "Brand") as BrandTyp),
    name: (formData.get("name") as string) ?? "",
    website: text("website"),
    instagram: text("instagram"),
    email: text("email"),
    linkedin: text("linkedin"),
    ansprechpartner: text("ansprechpartner"),
    kategorie: text("kategorie"),
    kategorie_kanonisch: normalizeKategorie(text("kategorie_kanonisch")),
    produkt: text("produkt"),
    preisrange: text("preisrange"),
    standort: text("standort"),
    gefunden_via: text("gefunden_via"),
    zugewiesen: text("zugewiesen"),
    status: ((text("status") ?? "Neu") as BrandStatus),
    kanal: text("kanal"),
    hub42_potenzial: text("hub42_potenzial"),
    datum_erstkontakt: text("datum_erstkontakt"),
    naechste_aktion: text("naechste_aktion"),
    datum_naechste_aktion: text("datum_naechste_aktion"),
    feedback: text("feedback"),
    notizen: text("notizen"),
    follower_ca: zahl("follower_ca"),
    // Scope
    groesse,
    groesse_quelle:
      groesse == null ? null : quelle === "geprüft" || quelle === "auto" ? quelle : null,
    haendler_ca: zahl("haendler_ca"),
    retail_listung: jaNein("retail_listung"),
    eigene_filialen: jaNein("eigene_filialen"),
    funding: text("funding"),
    // Haltung
    haltung_satz: text("haltung_satz"),
    haltung_tags: tags.length > 0 ? tags : null,
    haltung_quelle: text("haltung_quelle"),
  };
}

export function normalizeWebsite(url: string): string {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "");
}

export function normalizeInstagram(handle: string): string {
  return handle
    .toLowerCase()
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "")
    .split("?")[0]; // strip query params
}

export function normalizeBrandName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+(gmbh|ug|ag|gbr|e\.k\.|& co\. kg|kg|ohg|e\.v\.)\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
