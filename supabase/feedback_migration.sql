-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Datenmodell für die QR-Code-Produktbewertung (BiFi-Termin):
-- feedback_panels   = eine Person/ein Gerät (pseudonym), einmalig Consent+Demografie
-- feedback_products = ein Produkt an einem Regalplatz (QR-Code kodiert die id + Kontext)
-- feedback_ratings  = eine Bewertung, N:1 zu panel UND product → ein Panel kann
--                     mehrere Produkte bewerten (Within-Subject-Design)

create table if not exists feedback_panels (
  id                  uuid primary key default gen_random_uuid(),
  consent_at          timestamptz,
  age_range           text,
  gender              text,
  household_size      text,
  shopping_frequency  text,
  created_at          timestamptz not null default now()
);

create table if not exists feedback_products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  brand           text,
  store           text,
  shelf_code      text,
  batch           text,
  -- semantisches Differential: [{"left":"künstlich wirkend","right":"natürlich wirkend"}, ...]
  attributes      jsonb not null default '[]',
  price_enabled   boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists feedback_ratings (
  id                    uuid primary key default gen_random_uuid(),
  panel_id              uuid not null references feedback_panels(id),
  product_id            uuid not null references feedback_products(id),
  hedonic               smallint not null check (hedonic between 1 and 9),
  -- Werte 1-7 je Attribut-Paar aus feedback_products.attributes, gleiche Reihenfolge
  sem_diff              jsonb not null default '[]',
  price_too_cheap       numeric,
  price_cheap           numeric,
  price_expensive       numeric,
  price_too_expensive   numeric,
  store_context         text,
  shelf_context         text,
  batch_context         text,
  scanned_at            timestamptz not null default now()
);

create index if not exists feedback_ratings_product_idx on feedback_ratings(product_id);
create index if not exists feedback_ratings_panel_idx   on feedback_ratings(panel_id);

-- RLS nach demselben Muster wie pipeline_brands/pipeline_angebote: an/aus über den
-- App-Layer (Passwortschutz auf /feedback/admin, Consent-Flow für Konsumenten),
-- nicht über Row-Policies — der anon-Key braucht vollen Zugriff für Server Actions.
alter table feedback_panels   enable row level security;
alter table feedback_products enable row level security;
alter table feedback_ratings  enable row level security;

create policy anon_full_access on feedback_panels   for all to anon using (true) with check (true);
create policy anon_full_access on feedback_products for all to anon using (true) with check (true);
create policy anon_full_access on feedback_ratings  for all to anon using (true) with check (true);
