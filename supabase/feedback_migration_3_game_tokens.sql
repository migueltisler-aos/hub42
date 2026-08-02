-- Bereits angewendet über den Supabase-MCP (2026-07-28).
-- Spiel-Tickets: alle 3 Bewertungen (3, 6, 9 …) schaltet ein Panel ein physisches
-- Mini-Game im Store frei (z.B. Münze ins Aquarium-Glas, Treffer = 50€-Gutschein).
-- Der Code wird an der Kasse/Station gegen Vorlage eingelöst und hier verbucht,
-- damit ein Code nicht mehrfach genutzt werden kann und Miguel den Gutschein-
-- Auszahlungsstand im Blick behält.

create table if not exists feedback_game_tokens (
  id            uuid primary key default gen_random_uuid(),
  panel_id      uuid not null references feedback_panels(id),
  milestone     integer not null,
  code          text not null unique,
  created_at    timestamptz not null default now(),
  redeemed_at   timestamptz,
  redeemed_by   text,
  outcome       text check (outcome in ('gewonnen','verloren')),
  unique (panel_id, milestone)
);

create index if not exists feedback_game_tokens_panel_idx on feedback_game_tokens(panel_id);

alter table feedback_game_tokens enable row level security;
create policy anon_full_access on feedback_game_tokens for all to anon using (true) with check (true);
