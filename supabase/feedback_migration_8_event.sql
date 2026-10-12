-- Ausführen im Supabase SQL Editor (supabase.com → Projekt → SQL Editor → New query → Run).
--
-- Event-Modus (erst einmal für das 2-Tage-Event): Bewerten nur mit Schiebereglern,
-- keine Textfelder, keine Preis-Eingaben, im Onboarding keine Einkaufshäufigkeit.
-- Ab raffle_threshold bewerteten Produkten bekommt das Panel ein Los mit Code. Gezogen wird im Studio unter
-- /feedback/admin/verlosung; der Gewinner zeigt den Code auf dem Handy vor.
-- Bewusst keine Kontaktdaten: das Los hängt nur am pseudonymen Panel.

alter table feedback_settings add column if not exists event_mode boolean not null default false;
alter table feedback_settings add column if not exists event_name text;
alter table feedback_settings add column if not exists raffle_threshold integer not null default 10;

create table if not exists feedback_raffle_entries (
  id          uuid primary key default gen_random_uuid(),
  panel_id    uuid not null references feedback_panels(id) on delete cascade,
  event_name  text not null,
  code        text not null unique,
  created_at  timestamptz not null default now(),
  drawn_at    timestamptz,
  prize       text,
  unique (panel_id, event_name)
);

create index if not exists feedback_raffle_entries_event_idx on feedback_raffle_entries(event_name);

-- wie alle feedback_*-Tabellen (öffentlicher QR-Flow mit anon-Key), siehe rls_lockdown_migration.sql
alter table feedback_raffle_entries enable row level security;
create policy anon_full_access on feedback_raffle_entries for all to anon using (true) with check (true);

-- Fragenset "Event": nur Skalen, wird allen aktiven Produkten zugeordnet.
-- semantic_diff mit 7 Stufen, Mitte = genau richtig bei der Intensität.
insert into feedback_question_sets (id, name, description) values
  ('e7e1a000-0000-4000-8000-000000000001', 'Event', 'Nur Schieberegler, für Tasting-Events')
on conflict (id) do nothing;

insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000000011', 'e7e1a000-0000-4000-8000-000000000001', 'likert', 0, 'Ich würde das Produkt kaufen.', 'auf keinen Fall', 'auf jeden Fall', 5),
  ('e7e1a000-0000-4000-8000-000000000012', 'e7e1a000-0000-4000-8000-000000000001', 'semantic_diff', 1, null, 'zu mild', 'zu intensiv', 7),
  ('e7e1a000-0000-4000-8000-000000000013', 'e7e1a000-0000-4000-8000-000000000001', 'semantic_diff', 2, null, 'Preis-Leistung schwach', 'Preis-Leistung stark', 7),
  ('e7e1a000-0000-4000-8000-000000000014', 'e7e1a000-0000-4000-8000-000000000001', 'likert', 3, 'Die Marke kannte ich schon vorher.', 'gar nicht', 'sehr gut', 5),
  ('e7e1a000-0000-4000-8000-000000000015', 'e7e1a000-0000-4000-8000-000000000001', 'likert', 4, 'Das würde ich verschenken.', 'auf keinen Fall', 'auf jeden Fall', 5),
  ('e7e1a000-0000-4000-8000-000000000016', 'e7e1a000-0000-4000-8000-000000000001', 'likert', 5, 'Das würde ich weiterempfehlen.', 'auf keinen Fall', 'auf jeden Fall', 5)
on conflict (id) do nothing;

insert into feedback_product_question_sets (product_id, question_set_id)
select id, 'e7e1a000-0000-4000-8000-000000000001' from feedback_products where archived_at is null
on conflict do nothing;
