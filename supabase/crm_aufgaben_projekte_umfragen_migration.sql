-- Aufgaben-App, Stufe 2: Projekte mit Aufgaben, Umfragen an Aufgaben, Dateien in Google Drive.
-- Idempotent. Vor dem Deploy ausführen, der Lader liest alle neuen Tabellen.
-- Setzt crm_aufgaben_pwa_migration.sql voraus.

-- ── Projekte ────────────────────────────────────────────────────────────────
-- Eigene Tabelle, nicht crm_projekte: die gehören zu einer Marke (Sales).
create table if not exists crm_aufgaben_projekte (
  id               uuid primary key default gen_random_uuid(),
  titel            text not null check (char_length(titel) between 1 and 120),
  wer              text,
  faellig_am       date,
  abgeschlossen_am timestamptz,
  created_at       timestamptz not null default now(),
  created_by       text
);
alter table crm_aufgaben_projekte enable row level security;

alter table crm_aufgaben add column if not exists aufgaben_projekt_id uuid
  references crm_aufgaben_projekte(id) on delete set null;
create index if not exists crm_aufgaben_aufgaben_projekt_idx on crm_aufgaben (aufgaben_projekt_id);

-- ── Umfragen: eine je Aufgabe, 2 bis 6 Optionen ─────────────────────────────
create table if not exists crm_umfragen (
  id             uuid primary key default gen_random_uuid(),
  aufgabe_id     uuid not null unique references crm_aufgaben(id) on delete cascade,
  frage          text not null check (char_length(frage) between 1 and 200),
  mehrfach       boolean not null default false,
  geschlossen_am timestamptz,
  created_at     timestamptz not null default now(),
  created_by     text
);
create table if not exists crm_umfrage_optionen (
  id         uuid primary key default gen_random_uuid(),
  umfrage_id uuid not null references crm_umfragen(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 100),
  pos        smallint not null default 0
);
create index if not exists crm_umfrage_optionen_umfrage_idx on crm_umfrage_optionen (umfrage_id);
create table if not exists crm_umfrage_stimmen (
  option_id  uuid not null references crm_umfrage_optionen(id) on delete cascade,
  umfrage_id uuid not null references crm_umfragen(id) on delete cascade,
  wer        text not null,
  created_at timestamptz not null default now(),
  primary key (option_id, wer)
);
create index if not exists crm_umfrage_stimmen_umfrage_idx on crm_umfrage_stimmen (umfrage_id, wer);
alter table crm_umfragen         enable row level security;
alter table crm_umfrage_optionen enable row level security;
alter table crm_umfrage_stimmen  enable row level security;

-- ── Dateien in Google Drive: Unterordner je Aufgabe im freigegebenen Ordner ──
alter table crm_aufgaben add column if not exists drive_ordner_id text;
create table if not exists crm_aufgaben_dateien (
  id         uuid primary key default gen_random_uuid(),
  aufgabe_id uuid not null references crm_aufgaben(id) on delete cascade,
  name       text not null,
  link       text not null check (link ~* '^https?://'),
  drive_id   text not null,
  groesse    integer,
  wer        text,
  created_at timestamptz not null default now()
);
create index if not exists crm_aufgaben_dateien_aufgabe_idx on crm_aufgaben_dateien (aufgabe_id);
alter table crm_aufgaben_dateien enable row level security;
