-- Ausführen im Supabase SQL Editor (nach feedback_migration_9_kauf_preis.sql).
--
-- Tasting = Geschmack. Statt allgemeiner Fragen bekommt jede Produktgruppe ein
-- Geschmacks-Set mit Just-about-right-Reglern (5 Stufen, Mitte = genau richtig).
-- Das zeigt Marken direkt, in welche Richtung sie nachjustieren müssten.
--
-- * feedback_question_sets.kontext: 'tasting' = nur bei „Probiert“, 'kauf' = nur bei
--   „Gekauft“, null = immer. Sets mit Kontext erscheinen nur im Event-Modus.
-- * Event-Set ausgedünnt auf „würde ich kaufen“ und „Marke kannte ich“; Intensität
--   (jetzt je Gruppe), Preis-Leistung (jetzt Preis-Leiter), verschenken, weiterempfehlen raus.
-- * Vanille (Ikani) und Buch bekommen kein Geschmacks-Set.

alter table feedback_question_sets add column if not exists kontext text check (kontext in ('tasting','kauf'));
update feedback_question_sets set kontext = 'tasting' where id = 'e7e1a000-0000-4000-8000-000000000001';
update feedback_question_sets set kontext = 'kauf'    where id = 'e7e1a000-0000-4000-8000-000000000002';

delete from feedback_questions where id in (
  'e7e1a000-0000-4000-8000-000000000012',
  'e7e1a000-0000-4000-8000-000000000013',
  'e7e1a000-0000-4000-8000-000000000015',
  'e7e1a000-0000-4000-8000-000000000016'
);
update feedback_questions set position = 1 where id = 'e7e1a000-0000-4000-8000-000000000014';
insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000101', 'Geschmack: Herzhaft', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000101000', 'e7e1a000-0000-4000-8000-000000000101', 'semantic_diff', 0, null, 'zu wenig gewürzt', 'zu stark gewürzt', 5),
  ('e7e1a000-0000-4000-8000-000000101001', 'e7e1a000-0000-4000-8000-000000000101', 'semantic_diff', 1, null, 'zu mild', 'zu scharf', 5),
  ('e7e1a000-0000-4000-8000-000000101002', 'e7e1a000-0000-4000-8000-000000000101', 'semantic_diff', 2, null, 'zu wenig salzig', 'zu salzig', 5),
  ('e7e1a000-0000-4000-8000-000000101003', 'e7e1a000-0000-4000-8000-000000000101', 'semantic_diff', 3, null, 'zu dünn', 'zu dick', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000101' from (values ('ee9de43a-5dff-44f2-b952-ccbffd96b557'::uuid), ('090a67b7-7f36-4e0c-ac9d-ce8eb711ee22'::uuid), ('222b275a-6e4e-4fad-9904-a32031fe32d2'::uuid), ('d2eb1d22-a34e-4eff-9d58-2ba21c347b5f'::uuid), ('c38b8e22-5e08-405a-a431-34c9e9de0b7b'::uuid), ('0a833aaa-673b-4f09-b190-6b9ec8bb2a43'::uuid), ('ec5bd661-cdfd-4dde-8996-cbe7cc1b3ee6'::uuid), ('4265f759-2e61-431b-b7b7-2374342fc030'::uuid), ('6fb1bccc-688e-4f56-9218-7e873c8f4090'::uuid), ('4140b257-2033-47a0-a63a-165fdaf02051'::uuid), ('0e06f0c6-bf29-446a-89d1-5e18b4d5aee9'::uuid), ('4f47fb28-a183-4362-97f5-f6186b01e460'::uuid), ('c4f20508-130a-4698-b71b-b0cf3266877e'::uuid), ('cd9154dd-19a6-4918-8fb0-cfaa5320a54b'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000102', 'Geschmack: Scharfe Sauce', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000102000', 'e7e1a000-0000-4000-8000-000000000102', 'semantic_diff', 0, null, 'zu mild', 'zu scharf', 5),
  ('e7e1a000-0000-4000-8000-000000102001', 'e7e1a000-0000-4000-8000-000000000102', 'semantic_diff', 1, null, 'zu wenig fruchtig', 'zu fruchtig', 5),
  ('e7e1a000-0000-4000-8000-000000102002', 'e7e1a000-0000-4000-8000-000000000102', 'semantic_diff', 2, null, 'zu wenig sauer', 'zu sauer', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000102' from (values ('6d4ad198-a443-4a33-af45-e5e8ca01e2ee'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000103', 'Geschmack: Honig', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000103000', 'e7e1a000-0000-4000-8000-000000000103', 'semantic_diff', 0, null, 'zu wenig süß', 'zu süß', 5),
  ('e7e1a000-0000-4000-8000-000000103001', 'e7e1a000-0000-4000-8000-000000000103', 'semantic_diff', 1, null, 'zu schwaches Aroma', 'zu kräftiges Aroma', 5),
  ('e7e1a000-0000-4000-8000-000000103002', 'e7e1a000-0000-4000-8000-000000000103', 'semantic_diff', 2, null, 'zu flüssig', 'zu fest', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000103' from (values ('665c5172-6fba-4972-bc71-b8c66a838a0a'::uuid), ('b13f92c3-c31f-40d6-9f2e-71041613d336'::uuid), ('2be28ce6-6a78-4d8a-be72-02dbc32b96f4'::uuid), ('d497e186-dc4b-4f3c-a952-91b29e89f5f1'::uuid), ('0fbdcf60-634b-4e62-9daa-8bb0d58657f0'::uuid), ('391e03dc-1096-4e56-89bd-11c469c93c75'::uuid), ('da33a947-5608-4e00-aa5a-32a8fe9f5293'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000104', 'Geschmack: Olivenöl', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000104000', 'e7e1a000-0000-4000-8000-000000000104', 'semantic_diff', 0, null, 'zu wenig fruchtig', 'zu fruchtig', 5),
  ('e7e1a000-0000-4000-8000-000000104001', 'e7e1a000-0000-4000-8000-000000000104', 'semantic_diff', 1, null, 'zu wenig bitter', 'zu bitter', 5),
  ('e7e1a000-0000-4000-8000-000000104002', 'e7e1a000-0000-4000-8000-000000000104', 'semantic_diff', 2, null, 'zu mild im Abgang', 'zu pfeffrig im Abgang', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000104' from (values ('5a5084a7-87ec-44b9-af9e-f59611b4ec19'::uuid), ('4d0a8f35-8783-4f6d-8e71-5682290bc777'::uuid), ('1b0614cf-b55a-4fac-b35e-12e81b9609f7'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000105', 'Geschmack: Würzöl', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000105000', 'e7e1a000-0000-4000-8000-000000000105', 'semantic_diff', 0, null, 'zu schwaches Aroma', 'zu dominantes Aroma', 5),
  ('e7e1a000-0000-4000-8000-000000105001', 'e7e1a000-0000-4000-8000-000000000105', 'semantic_diff', 1, null, 'zu wenig Olivenöl-Note', 'zu viel Olivenöl-Note', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000105' from (values ('918fa9a4-b320-43bd-af84-8989ebb70893'::uuid), ('8c83fde2-e87b-476a-81f1-8dbfddafbcfe'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000106', 'Geschmack: Ibérico', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000106000', 'e7e1a000-0000-4000-8000-000000000106', 'semantic_diff', 0, null, 'zu wenig salzig', 'zu salzig', 5),
  ('e7e1a000-0000-4000-8000-000000106001', 'e7e1a000-0000-4000-8000-000000000106', 'semantic_diff', 1, null, 'zu mager', 'zu fett', 5),
  ('e7e1a000-0000-4000-8000-000000106002', 'e7e1a000-0000-4000-8000-000000000106', 'semantic_diff', 2, null, 'zu weich', 'zu fest', 5),
  ('e7e1a000-0000-4000-8000-000000106003', 'e7e1a000-0000-4000-8000-000000000106', 'semantic_diff', 3, null, 'zu mild', 'zu kräftig', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000106' from (values ('7e7f1bd7-ae47-4a0d-ae59-ecd8d450171b'::uuid), ('d3fedfe9-af5a-4540-8ba9-799df1940f40'::uuid), ('a9eebcc4-7e8a-4887-be06-b63b08925865'::uuid), ('69631d22-754d-46fd-9ae8-8919b1617196'::uuid), ('80aa7318-910e-4acd-bda8-ae160660c6e8'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000107', 'Geschmack: Nüsse', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000107000', 'e7e1a000-0000-4000-8000-000000000107', 'semantic_diff', 0, null, 'zu wenig salzig', 'zu salzig', 5),
  ('e7e1a000-0000-4000-8000-000000107001', 'e7e1a000-0000-4000-8000-000000000107', 'semantic_diff', 1, null, 'zu schwach geröstet', 'zu stark geröstet', 5),
  ('e7e1a000-0000-4000-8000-000000107002', 'e7e1a000-0000-4000-8000-000000000107', 'semantic_diff', 2, null, 'zu weich', 'zu hart', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000107' from (values ('ece6738d-803b-4190-84a7-6be0a0fdb977'::uuid), ('a4468e9e-7e19-45b2-8910-ba6ff94a6623'::uuid), ('62125e45-8581-4721-98da-d43b1ae7f95f'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000108', 'Geschmack: Kakao & Schokolade', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000108000', 'e7e1a000-0000-4000-8000-000000000108', 'semantic_diff', 0, null, 'zu wenig süß', 'zu süß', 5),
  ('e7e1a000-0000-4000-8000-000000108001', 'e7e1a000-0000-4000-8000-000000000108', 'semantic_diff', 1, null, 'zu wenig bitter', 'zu bitter', 5),
  ('e7e1a000-0000-4000-8000-000000108002', 'e7e1a000-0000-4000-8000-000000000108', 'semantic_diff', 2, null, 'zu wenig Kakao', 'zu viel Kakao', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000108' from (values ('22867123-d599-45b1-bac6-667b0d86bb47'::uuid), ('886fe44c-1b0c-4cb5-884b-1340468e924b'::uuid), ('04d68b70-5564-4641-93dc-46a15bc94a9c'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

insert into feedback_question_sets (id, name, description, kontext) values ('e7e1a000-0000-4000-8000-000000000109', 'Geschmack: Heißgetränk', 'Just-about-right: Mitte = genau richtig', 'tasting') on conflict (id) do nothing;
insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000109000', 'e7e1a000-0000-4000-8000-000000000109', 'semantic_diff', 0, null, 'zu dünn', 'zu stark', 5),
  ('e7e1a000-0000-4000-8000-000000109001', 'e7e1a000-0000-4000-8000-000000000109', 'semantic_diff', 1, null, 'zu wenig bitter', 'zu bitter', 5),
  ('e7e1a000-0000-4000-8000-000000109002', 'e7e1a000-0000-4000-8000-000000000109', 'semantic_diff', 2, null, 'zu schwaches Aroma', 'zu kräftiges Aroma', 5)
on conflict (id) do nothing;
insert into feedback_product_question_sets (product_id, question_set_id)
select p.id, 'e7e1a000-0000-4000-8000-000000000109' from (values ('63ea049c-6787-4a82-aad3-009f9d35c3b8'::uuid), ('4b1aae56-cda5-473c-b896-84d120db2c21'::uuid), ('eb9e8c4b-91ad-444c-bd73-1017e5e30cc0'::uuid)) as v(id) join feedback_products p on p.id = v.id
on conflict do nothing;

