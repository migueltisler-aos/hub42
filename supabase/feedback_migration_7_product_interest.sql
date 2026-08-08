-- Bereits angewendet über den Supabase-MCP (2026-08-03).
-- Pro-Produkt-Kontakt-Opt-in: nach jeder Bewertung wird charmant gefragt "Willst du zu
-- DIESEM Produkt informiert werden?" (E-Mail und/oder WhatsApp) — unabhängig vom
-- Scout-Level-Kontakt-Opt-in (Newsletter/Jury ab Silber/Gold, siehe
-- feedback_migration_2_scout_contact.sql). Ziel: Leadliste je Produkt/Marke aufbauen.
--
-- WICHTIG: E-Mail/WhatsApp sind echte PII. Auf der öffentlichen /feedback/admin/results
-- werden nur Aggregat-Zähler angezeigt, nie die Rohdaten. Die echte Leadliste liegt
-- unter /feedback/leads, geschützt über den bestehenden pipeline_auth-Login
-- (PIPELINE_GESCHUETZT-Array in proxy.ts) — bewusst NICHT das offene /feedback/admin.

create table if not exists feedback_product_interest (
  id           uuid primary key default gen_random_uuid(),
  panel_id     uuid not null references feedback_panels(id) on delete cascade,
  product_id   uuid not null references feedback_products(id) on delete cascade,
  email        text,
  whatsapp     text,
  created_at   timestamptz not null default now(),
  unique (panel_id, product_id),
  constraint feedback_product_interest_contact_check check (email is not null or whatsapp is not null)
);

create index if not exists feedback_product_interest_product_idx on feedback_product_interest(product_id);

alter table feedback_product_interest enable row level security;
create policy anon_full_access on feedback_product_interest for all to anon using (true) with check (true);
