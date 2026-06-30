-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Angebots-CRM: Tabelle für Angebote, gekoppelt an pipeline_brands.
-- Gleiche Konvention wie pipeline_brands: Zugriff über anon-key, Realtime aktiv.

create table if not exists pipeline_angebote (
  id              uuid primary key default gen_random_uuid(),
  angebot_nr      text not null unique,            -- z.B. AG-2026-001
  brand_id        uuid references pipeline_brands(id) on delete set null,
  -- Empfänger-Snapshot (falls Brand später geändert/gelöscht wird)
  empfaenger_name text,
  ansprechpartner text,
  titel           text,
  status          text not null default 'Entwurf', -- Entwurf · Versendet · Angenommen · Abgelehnt · Abgelaufen
  laufzeit_monate int  not null default 3,
  start_datum     date,
  gueltig_bis     date,
  -- Fläche, Bestückung & Nachschub
  tasting             boolean not null default false, -- Tasting Bar anbieten?
  tasting_pct         int not null default 10,        -- Tasting-Muster = % der Bestückung
  gemietete_breite_cm int,                            -- Regalbreite in cm
  max_artikel         int,                            -- max. Bestückung in Stück
  nachschub_email     text,                           -- Mail für Nachschub-Bestellung
  positionen      jsonb not null default '[]'::jsonb,  -- [{ typ, label, menge, einheit, einzelpreisMonat, einmalig }]
  deliverables    jsonb not null default '[]'::jsonb,  -- [{ label, status, notiz }]
  notiz           text,
  created_at      timestamptz not null default now(),
  created_by      text,
  updated_at      timestamptz not null default now()
);

-- Idempotent: falls die Tabelle bereits aus einer früheren Migration besteht
alter table pipeline_angebote add column if not exists tasting             boolean not null default false;
alter table pipeline_angebote add column if not exists tasting_pct         int not null default 10;
alter table pipeline_angebote add column if not exists gemietete_breite_cm int;
alter table pipeline_angebote add column if not exists max_artikel         int;
alter table pipeline_angebote add column if not exists nachschub_email     text;

create index if not exists pipeline_angebote_brand_id_idx on pipeline_angebote (brand_id);
create index if not exists pipeline_angebote_status_idx   on pipeline_angebote (status);

-- updated_at automatisch pflegen (search_path fixiert = Linter-konform)
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pipeline_angebote_set_updated_at on pipeline_angebote;
create trigger pipeline_angebote_set_updated_at
  before update on pipeline_angebote
  for each row execute function set_updated_at();

-- RLS + Policy exakt wie pipeline_brands (Zugriff über anon-key)
alter table pipeline_angebote enable row level security;
drop policy if exists anon_full_access on pipeline_angebote;
create policy anon_full_access on pipeline_angebote
  for all to anon using (true) with check (true);

-- Realtime aktivieren (wie pipeline_brands)
alter publication supabase_realtime add table pipeline_angebote;
