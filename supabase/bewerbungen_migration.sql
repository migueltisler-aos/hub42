-- Bewerbungen um eine Regalfront (Startseite, Abschnitt #bewerben)
--
-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Die Tabelle trägt zwei Dinge:
--   1. die Bewerbung selbst (Marke, Produkt, gewünschte Front, ggf. Antrag
--      auf die 59-€-Kondition für Produkte mit besonderem Wert)
--   2. den Zähler "x von 5 Onboardings diese Woche frei" – jede Bewerbung der
--      laufenden Kalenderwoche (Europe/Berlin) belegt einen Onboarding-Termin,
--      außer sie wurde abgelehnt (status = 'abgelehnt').
--
-- Schreiben und Lesen nur über den Service-Role-Key (lib/supabase-admin.ts).
-- Keine anon-Policy – siehe rls_lockdown_migration.sql.

create table if not exists bewerbungen (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  name              text not null,
  email             text not null,
  marke             text not null,
  produkt           text not null,
  website           text,
  -- gewünschte Front aus dem Regal-Konfigurator (optional)
  zone              text check (zone in ('augenhoehe', 'greifhoehe', 'basis')),
  cm                integer check (cm between 5 and 84),
  -- Antrag auf die reduzierte Mindestmiete (59 € statt 89 €)
  besonderer_wert   boolean not null default false,
  begruendung       text,
  nachricht         text,
  status            text not null default 'neu'
                    check (status in ('neu', 'onboarding', 'angenommen', 'abgelehnt'))
);

create index if not exists bewerbungen_created_at_idx on bewerbungen (created_at desc);

alter table bewerbungen enable row level security;
