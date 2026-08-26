-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Macht die zwei Dinge zu Feldern, die bisher nur als Prosa in `notizen`
-- standen und deshalb bei jeder Brand nachrecherchiert werden mussten:
--   1. SCOPE   — wie groß ist die Brand (Vertriebsbreite, nicht Bauchgefühl)
--   2. HALTUNG — wofür steht sie (ein Satz + Tags + belegbare Quelle)
--
-- Warum strukturiert statt Regex über `notizen`: die alte Fit-Bewertung war
-- negations-blind ("nicht in DM/Rossmann" ließ das LEH-Gate anschlagen) und
-- konnte fehlende Daten nicht von Nicht-Passen unterscheiden. Beides fällt
-- weg, sobald die Urteile aus eigenen Spalten kommen.
--
-- Keine Spalte wird gelöscht. Die 8 ungenutzten Outreach-Spalten
-- (perso_satz, prio, ko_flag, outreach_status, …) bleiben; `prio` und
-- `ko_flag` werden künftig aus der Fit-Logik abgeleitet geschrieben
-- (siehe lib/pipeline.ts → deriveOutreachFlags).

-- ---------------------------------------------------------------------------
-- 1. Scope-Leiter (Vertriebsbreite)
-- ---------------------------------------------------------------------------

alter table pipeline_brands
  -- 1 Manufaktur   Hand-/Kleinserie, nur eigener Shop
  -- 2 Klein        eigene Produktion/Lohnfertigung, < 10 Händler
  -- 3 Wachsend     Fachhandel-Distribution, 10–100 Händler
  -- 4 Etabliert    überregional, Retail-Listung oder eigene Filialen
  -- 5 Groß/Konzern LEH-Regal, Konzerntochter, PE/VC-Runden
  add column if not exists groesse         smallint,
  -- 'auto'    = per KI-Backfill gesetzt, ungeprüft (im UI gedimmt + °)
  -- 'geprüft' = ein Mensch hat die Stufe angefasst
  add column if not exists groesse_quelle  text,
  -- Belege daneben, damit die Stufe auditierbar ist statt Bauchgefühl.
  -- follower_ca existiert schon und bleibt Nebensignal.
  add column if not exists haendler_ca     integer,
  add column if not exists retail_listung  boolean,
  add column if not exists eigene_filialen boolean,
  add column if not exists funding         text;

-- ---------------------------------------------------------------------------
-- 2. Haltung
-- ---------------------------------------------------------------------------

alter table pipeline_brands
  -- Ein Satz, max. ~120 Zeichen, möglichst wörtlich von der About-Seite.
  -- Das ist das Feld, das das Nachrecherchieren erspart.
  add column if not exists haltung_satz   text,
  add column if not exists haltung_tags   text[],
  -- URL der Seite, auf der der Satz steht — macht die Aussage überprüfbar
  -- statt KI-behauptet.
  add column if not exists haltung_quelle text,
  add column if not exists haltung_stand  date;

-- ---------------------------------------------------------------------------
-- 3. Sauberkeit
-- ---------------------------------------------------------------------------

alter table pipeline_brands
  -- Beschränkt auf die 6 Werte, die der UI-Filter kennt. `kategorie` bleibt
  -- unverändert und wird zur Subkategorie — die 57 gewachsenen Freitextwerte
  -- bleiben als Detail erhalten, ohne ihren Inhalt zu migrieren.
  add column if not exists kategorie_kanonisch text,
  -- Begründung des Fit-Labels, statt nur des Labels.
  add column if not exists fit_grund           text;

-- ---------------------------------------------------------------------------
-- 4. Constraints (nur auf den neuen Spalten — bestehende bleiben unangetastet)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_groesse_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_groesse_chk
      check (groesse is null or groesse between 1 and 5);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_groesse_quelle_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_groesse_quelle_chk
      check (groesse_quelle is null or groesse_quelle in ('auto', 'geprüft'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_kategorie_kanonisch_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_kategorie_kanonisch_chk
      check (kategorie_kanonisch is null or kategorie_kanonisch in
        ('Food', 'Drinks', 'Beauty', 'Lifestyle', 'Home', 'Sonstiges'));
  end if;

  -- Geschlossene Tag-Liste: verhindert, dass hier dasselbe Freitext-Chaos
  -- entsteht wie bei `kategorie` (57 Werte auf 202 Zeilen).
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_haltung_tags_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_haltung_tags_chk
      check (haltung_tags is null or haltung_tags <@ array[
        'Regional', 'Bio', 'Vegan', 'Direkthandel/Fair', 'Upcycling/Zero-Waste',
        'Handmade/Manufaktur', 'Sozial/Inklusion', 'Frauen-geführt',
        'Transparenz-Herkunft', 'Familienbetrieb'
      ]::text[]);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Datenreparatur: verlorene Dedup-Keys
-- ---------------------------------------------------------------------------
-- upsertBrand setzte website_key bei jedem Teil-Update auf null, auch wenn der
-- Patch gar keine Website enthielt (z. B. beim Mail-Versand). Diese Marken
-- ließen sich danach erneut importieren. Der Code ist gefixt (lib/pipeline.ts),
-- hier werden die betroffenen Zeilen nachgezogen — identisch zu
-- normalizeWebsite(): lowercase, ohne Protokoll und www., ohne Slash am Ende.

update pipeline_brands
set website_key = regexp_replace(
      regexp_replace(lower(btrim(website)), '^https?://(www\.)?', ''),
      '/$', ''
    )
where coalesce(btrim(website), '') <> ''
  and website_key is null;

-- ---------------------------------------------------------------------------
-- 6. Indizes für die neuen Filter in /pipeline
-- ---------------------------------------------------------------------------

create index if not exists pipeline_brands_groesse_idx
  on pipeline_brands (groesse);

create index if not exists pipeline_brands_haltung_tags_idx
  on pipeline_brands using gin (haltung_tags);

create index if not exists pipeline_brands_kategorie_kanonisch_idx
  on pipeline_brands (kategorie_kanonisch);
