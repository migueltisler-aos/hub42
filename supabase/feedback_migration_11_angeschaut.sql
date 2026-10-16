-- Ausführen im Supabase SQL Editor (nach feedback_migration_10_geschmack.sql).
--
-- Regal-QR (/q) = „Angeschaut“ statt „Gekauft“. Gescannt wird am Regal vor dem Kauf;
-- den Kauf selbst liefert die SumUp-Kasse (feedback_products.sumup_item_id).
-- * kontext 'angeschaut' für Bewertungen und Fragensets.
-- * 'kauf' bleibt erlaubt: Alt-Bewertungen und Reserve für einen späteren Bon-QR.
-- * Fragenset „Angeschaut“ (nur bei kontext='angeschaut' sichtbar), allen aktiven
--   Produkten zugeordnet. Das Kauf-Set bleibt bestehen, erscheint aber nicht mehr.

alter table feedback_ratings drop constraint if exists feedback_ratings_kontext_check;
alter table feedback_ratings add constraint feedback_ratings_kontext_check
  check (kontext in ('tasting','angeschaut','kauf'));

alter table feedback_question_sets drop constraint if exists feedback_question_sets_kontext_check;
alter table feedback_question_sets add constraint feedback_question_sets_kontext_check
  check (kontext in ('tasting','angeschaut','kauf'));

insert into feedback_question_sets (id, name, description, kontext) values
  ('e7e1a000-0000-4000-8000-000000000003', 'Angeschaut', 'Schnell-Bewertung am Regal, nur Schieberegler', 'angeschaut')
on conflict (id) do nothing;

insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000000031', 'e7e1a000-0000-4000-8000-000000000003', 'likert', 0, 'Ich würde das Produkt kaufen.', 'auf keinen Fall', 'auf jeden Fall', 5),
  ('e7e1a000-0000-4000-8000-000000000032', 'e7e1a000-0000-4000-8000-000000000003', 'semantic_diff', 1, null, 'unauffällig', 'fällt sofort auf', 5),
  ('e7e1a000-0000-4000-8000-000000000033', 'e7e1a000-0000-4000-8000-000000000003', 'likert', 2, 'Die Marke kannte ich schon vorher.', 'gar nicht', 'sehr gut', 5)
on conflict (id) do nothing;

insert into feedback_product_question_sets (product_id, question_set_id)
select id, 'e7e1a000-0000-4000-8000-000000000003' from feedback_products where archived_at is null
on conflict do nothing;
