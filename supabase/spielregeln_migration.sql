-- Spielregeln online annehmen und Fragen fürs Verkaufsteam im Marken-Portal (2026-11-23).
-- Ersetzt die Partnervereinbarung als docx: die Marke liest /marke/spielregeln (druckbar)
-- und stimmt in den Stammdaten zu. Version = SPIELREGELN_VERSION in lib/spielregeln.ts.
alter table brand_konditionen
  add column if not exists spielregeln_angenommen_am timestamptz,
  add column if not exists spielregeln_version       text,
  add column if not exists verkaufsteam              jsonb not null default '{}'::jsonb;
