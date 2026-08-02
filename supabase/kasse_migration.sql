-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Tabellen fuer den Kassen-Kern (online-first, siehe kassensystem/README.md
-- Abschnitt 1 "Online-first mit Offline-Fallback"). Der Kern spricht diese
-- Tabellen per REST direkt an, haelt aber lokal in SQLite eine Kopie/Outbox
-- fuer den Fall, dass kein Internet da ist.

create table if not exists kasse_artikelstamm (
  id            uuid primary key default gen_random_uuid(),
  ean           text not null,
  standort_id   text not null default 'alexa-berlin',
  artikel_name  text not null,
  brand_id      uuid references pipeline_brands(id),
  brand_name    text not null,
  brand_website text,
  verkaufspreis numeric not null,
  handling_fee  numeric not null default 0,
  regal_lage    text,
  cm_position   numeric,
  gueltig_ab    date,
  unique (ean, standort_id)
);

create table if not exists kasse_verkaeufe (
  id                  uuid primary key default gen_random_uuid(),
  zeilen_uuid         uuid not null unique,
  standort_id         text not null,
  kassen_id           text not null,
  bon_nr              integer not null,
  zeitstempel         timestamptz not null,
  ean                 text not null,
  menge               integer not null,
  einzelpreis         numeric not null,
  brand_id            uuid references pipeline_brands(id),
  zahlart             text,
  tse_signaturzaehler text,
  tse_transaktionsnr  text
);

create table if not exists kasse_beobachtungen (
  id            uuid primary key default gen_random_uuid(),
  zeilen_uuid   uuid not null unique,
  standort_id   text not null,
  bon_nr        integer not null,
  zeitstempel   timestamptz not null,
  sprache       text,
  geschlecht    text,
  alter_gruppe  text
);

alter table kasse_artikelstamm enable row level security;
alter table kasse_verkaeufe enable row level security;
alter table kasse_beobachtungen enable row level security;

create policy anon_full_access on kasse_artikelstamm for all to anon using (true) with check (true);
create policy anon_full_access on kasse_verkaeufe for all to anon using (true) with check (true);
create policy anon_full_access on kasse_beobachtungen for all to anon using (true) with check (true);
