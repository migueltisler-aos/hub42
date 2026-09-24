-- Angebotstool: Preisklasse "besonderer Wert" je Angebot
--
-- Ausführen im Supabase SQL Editor (nach bewerbungen_migration.sql).
-- false = Standard (7,00 €/m², min. 89 €), true = besonderer Wert
-- (4,64 €/m², min. 59 €) – siehe lib/angebote-model.ts, mietKlasse().

alter table pipeline_angebote
  add column if not exists besonderer_wert boolean not null default false;
