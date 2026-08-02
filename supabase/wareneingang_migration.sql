-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Ein Wareneingang ist eine Sendung (1 DHL-Paket) mit einer oder mehreren
-- Artikel-Zeilen (Chargen) darin - ein Paket kann mehrere Produkte enthalten.

create table if not exists wareneingang_sendungen (
  id              uuid primary key default gen_random_uuid(),
  standort_id     text not null default 'alexa-berlin',
  brand_id        uuid references pipeline_brands(id),
  dhl_tracking_nr text,
  eingegangen_am  timestamptz not null default now(),
  eingegangen_von text
);

create table if not exists wareneingang_chargen (
  id              uuid primary key default gen_random_uuid(),
  sendung_id      uuid references wareneingang_sendungen(id),
  charge_code     text not null unique,
  ean             text not null,
  artikel_name    text,
  menge           integer not null,
  mhd             date
);

create table if not exists wareneingang_nachbestellungen (
  id              uuid primary key default gen_random_uuid(),
  charge_id       uuid references wareneingang_chargen(id),
  brand_id        uuid references pipeline_brands(id),
  ean             text not null,
  artikel_name    text,
  menge_angefragt integer,
  nachschub_email text,
  status          text not null default 'Angefragt',
  ausgeloest_am   timestamptz not null default now(),
  ausgeloest_von  text
);

alter table wareneingang_sendungen enable row level security;
alter table wareneingang_chargen enable row level security;
alter table wareneingang_nachbestellungen enable row level security;

create policy anon_full_access on wareneingang_sendungen for all to anon using (true) with check (true);
create policy anon_full_access on wareneingang_chargen for all to anon using (true) with check (true);
create policy anon_full_access on wareneingang_nachbestellungen for all to anon using (true) with check (true);
