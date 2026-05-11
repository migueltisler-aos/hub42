-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run

create table if not exists pipeline_brands (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  website         text,
  website_key     text unique,
  instagram       text,
  email           text,
  linkedin        text,
  ansprechpartner text,
  kategorie       text,
  produkt         text,
  preisrange      text,
  standort        text,
  gefunden_via    text,
  zugewiesen      text,
  status          text not null default 'Neu',
  kanal           text,
  datum_erstkontakt     date,
  datum_letzte_aktion   date,
  naechste_aktion       text,
  datum_naechste_aktion date,
  feedback        text,
  hub42_fit       text,
  notizen         text,
  created_at      timestamptz not null default now(),
  created_by      text
);
