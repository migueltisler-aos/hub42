-- Laden-Funnel: das Team zählt am Handy (/zaehler), was die Kasse nicht sieht.
--   besucher  – Person betritt den Laden (ohne Marke)
--   regal     – Person schaut sich das Regal einer Marke an
--   gekostet  – Person probiert ein Produkt der Marke
-- "gekauft" kommt aus kasse_verkaeufe. RLS an, keine Policy: nur der Server liest.

create table if not exists laden_zaehlung (
  id           uuid primary key default gen_random_uuid(),
  standort_id  text not null default 'alexa-berlin',
  brand_id     uuid references pipeline_brands(id) on delete cascade,
  art          text not null check (art in ('besucher', 'regal', 'gekostet')),
  ts           timestamptz not null default now(),
  gezaehlt_von text,
  check ((art = 'besucher') = (brand_id is null))
);
create index if not exists laden_zaehlung_ts_idx on laden_zaehlung(standort_id, ts desc);
create index if not exists laden_zaehlung_brand_idx on laden_zaehlung(brand_id, ts desc);
alter table laden_zaehlung enable row level security;
