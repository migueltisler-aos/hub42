-- Bewerbungen: Regalkarte aus der Website der Marke (Startseite #bewerben)
--
-- Ausführen im Supabase SQL Editor NACH bewerbungen_treppe_migration.sql.
-- Bis diese Migration gelaufen ist, schreibt app/actions/bewerbung.ts Produkt
-- und Bildrechte als Text in "nachricht" (Fallback bei fehlender Spalte).
--
--   bildrechte  Freigabe: Logo, Produktbilder und Texte der Website dürfen
--               für Regalkarte und Regalplatz genutzt werden
--   karte       Entwurf der Karte samt gewähltem Produkt (lib/karte-model.ts,
--               Typ KarteAuswahl); Texte von Claude aus der Website, vor dem
--               Druck im Onboarding mit der Marke prüfen
--   assistent   Antworten aus dem Bewerbungs-Assistenten (Kategorie, Vertrieb,
--               Eigentum, Haltung, Faktor) plus Abverkaufsschätzung und Regel-Ergebnis

alter table bewerbungen
  add column if not exists bildrechte boolean not null default false,
  add column if not exists karte jsonb,
  add column if not exists assistent jsonb;

-- PostgREST-Schema-Cache neu laden, sonst meldet die API die Spalten noch als fehlend.
notify pgrst, 'reload schema';
