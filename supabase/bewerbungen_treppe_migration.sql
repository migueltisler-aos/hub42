-- Bewerbungen: Einstieg in die Treppe + Ja/Nein-Fragen (Startseite #bewerben)
--
-- Ausführen im Supabase SQL Editor NACH bewerbungen_migration.sql.
-- Bis diese Migration gelaufen ist, speichert app/actions/bewerbung.ts die
-- neuen Angaben als Text in "nachricht" (Fallback bei fehlender Spalte).
--
--   einstieg             Stufe 1 / Stufe 2 / Stufe 3 bis 5 / Standardregal / offen
--   stationaer_gelistet  "Bist du bereits im stationären Handel gelistet?"
--   online_handel        "Hast du einen Onlineshop oder verkaufst du auf Marktplätzen?"
--   beratung_interesse   "Interesse an geförderter Beratung?" (nur mit SHOW_BAFA)
--   bundesland           Sitz der Firma, nur wenn beratung_interesse = true

alter table bewerbungen
  add column if not exists einstieg text
    check (einstieg in ('testen', 'beweisen', 'studie', 'standardregal', 'offen')),
  add column if not exists stationaer_gelistet boolean,
  add column if not exists online_handel boolean,
  add column if not exists beratung_interesse boolean,
  add column if not exists bundesland text;

-- PostgREST-Schema-Cache neu laden, sonst meldet die API die Spalten noch als fehlend.
notify pgrst, 'reload schema';
