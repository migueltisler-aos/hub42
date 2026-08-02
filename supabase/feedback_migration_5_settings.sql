-- Bereits angewendet über den Supabase-MCP (2026-07-29).
-- Singleton-Settings-Tabelle (id ist immer `true`, garantiert per Constraint genau
-- eine Zeile) für die Schwellen, die Miguel ohne Code-Deploy anpassen können soll:
-- Scout-Level-Grenzen, Spiel-Ticket-Intervall, Meilenstein für den Vergleichs-Reveal.

create table if not exists feedback_settings (
  id                          boolean primary key default true check (id),
  scout_bronze_threshold      integer not null default 3,
  scout_silver_threshold      integer not null default 6,
  scout_gold_threshold        integer not null default 10,
  game_ticket_interval        integer not null default 3,
  comparison_reveal_threshold integer not null default 10,
  updated_at                  timestamptz not null default now()
);

insert into feedback_settings (id) values (true) on conflict (id) do nothing;

alter table feedback_settings enable row level security;
create policy anon_full_access on feedback_settings for all to anon using (true) with check (true);
