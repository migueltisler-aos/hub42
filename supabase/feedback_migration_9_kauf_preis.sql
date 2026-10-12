-- Ausführen im Supabase SQL Editor (nach feedback_migration_8_event.sql).
--
-- Probiert vs. Gekauft + Preis-Leiter.
-- * feedback_ratings.kontext: 'tasting' (probiert, alle Regler) oder 'kauf' (gekauft, schnell).
-- * feedback_ratings.price_wtp: auf der Preis-Leiter gewählter Preis. Die Leiter hat den
--   aktuellen Verkaufspreis in der Mitte und je 5 Stufen auf x,49/x,99 darüber und darunter
--   (lib/price-ladder.ts).
-- * feedback_products.price + sumup_item_id: Verkaufspreis und SumUp-Artikel-ID. Damit
--   lassen sich Bewertungen und Verkäufe (sumup_transaktionen.produkte) verbinden.
--   Befüllt aus dem SumUp-Export vom 12.10.2026 über Austausch/etiketten/ids.json.
-- * Fragenset "Kauf" (fest verdrahtet, nur bei kontext='kauf' sichtbar).

alter table feedback_products add column if not exists price numeric;
alter table feedback_products add column if not exists sumup_item_id text;
create unique index if not exists feedback_products_sumup_item_uidx on feedback_products (sumup_item_id);

alter table feedback_ratings add column if not exists kontext text check (kontext in ('tasting','kauf'));
alter table feedback_ratings add column if not exists price_wtp numeric;

insert into feedback_question_sets (id, name, description) values
  ('e7e1a000-0000-4000-8000-000000000002', 'Kauf', 'Schnell-Bewertung nach dem Kauf, nur Schieberegler')
on conflict (id) do nothing;

insert into feedback_questions (id, question_set_id, type, position, prompt, label_left, label_right, scale_max) values
  ('e7e1a000-0000-4000-8000-000000000021', 'e7e1a000-0000-4000-8000-000000000002', 'likert', 0, 'Das würde ich wieder kaufen.', 'auf keinen Fall', 'auf jeden Fall', 5)
on conflict (id) do nothing;

insert into feedback_product_question_sets (product_id, question_set_id)
select id, 'e7e1a000-0000-4000-8000-000000000002' from feedback_products where archived_at is null
on conflict do nothing;

update feedback_products p
set price = v.price, sumup_item_id = v.sumup_item_id
from (values
  ('6d4ad198-a443-4a33-af45-e5e8ca01e2ee'::uuid, 6.00, '5db22acd-23f8-4545-aca5-13559bd9e381'),
  ('5a5084a7-87ec-44b9-af9e-f59611b4ec19'::uuid, 58.00, 'd8e1309e-a35d-4500-a182-a79eb7029098'),
  ('ece6738d-803b-4190-84a7-6be0a0fdb977'::uuid, 30.90, 'c0877f65-5833-4b5a-9bad-626c112383c4'),
  ('a4468e9e-7e19-45b2-8910-ba6ff94a6623'::uuid, 30.90, '892c6aaa-6bea-4a6d-803d-bd031b7a7fa2'),
  ('665c5172-6fba-4972-bc71-b8c66a838a0a'::uuid, 14.90, '0de8a81c-edf0-446a-b10e-3e65fadf8853'),
  ('ee9de43a-5dff-44f2-b952-ccbffd96b557'::uuid, 5.49, 'e502227f-f6f5-4d99-866e-33eaae5a07d4'),
  ('886fe44c-1b0c-4cb5-884b-1340468e924b'::uuid, 5.55, '01db6f94-fc46-409f-9be5-4f4d022358f1'),
  ('090a67b7-7f36-4e0c-ac9d-ce8eb711ee22'::uuid, 6.99, 'b85312d9-4e9c-47fb-9e7f-57ecd9ff6cd8'),
  ('222b275a-6e4e-4fad-9904-a32031fe32d2'::uuid, 6.99, 'd9096a42-37ce-4e23-9a5b-82b6c6071596'),
  ('7e7f1bd7-ae47-4a0d-ae59-ecd8d450171b'::uuid, 349.50, '37e700e5-519c-4daf-aa32-75c8c144233c'),
  ('d3fedfe9-af5a-4540-8ba9-799df1940f40'::uuid, 67.50, '54a48fa6-5e45-4e2c-b374-4a31eb340dd8'),
  ('a9eebcc4-7e8a-4887-be06-b63b08925865'::uuid, 174.50, '2c6792cf-a122-4b01-b87f-d70de8c56cf2'),
  ('69631d22-754d-46fd-9ae8-8919b1617196'::uuid, 28.00, '4cf1ec18-080c-4bc3-b5c7-c246076ddd94'),
  ('80aa7318-910e-4acd-bda8-ae160660c6e8'::uuid, 67.00, 'efc9c575-1d98-4428-a72a-75c7e077fe70'),
  ('b13f92c3-c31f-40d6-9f2e-71041613d336'::uuid, 20.90, '030ebc6e-e777-441e-b5c8-e84e7e534a8e'),
  ('2be28ce6-6a78-4d8a-be72-02dbc32b96f4'::uuid, 17.90, '94797183-b107-4058-842a-62dc2d1c5c3d'),
  ('d497e186-dc4b-4f3c-a952-91b29e89f5f1'::uuid, 17.90, 'ff4e6d0e-e078-40ef-aa70-de122900db51'),
  ('0fbdcf60-634b-4e62-9daa-8bb0d58657f0'::uuid, 17.90, 'bbb5ffb6-12c3-4913-8063-8c162d10a51a'),
  ('1b0614cf-b55a-4fac-b35e-12e81b9609f7'::uuid, 55.00, 'd8f9dd00-d584-4a6f-922d-a2037d007c96'),
  ('d5721013-9477-4050-a684-3b4c2adcdb61'::uuid, 8.75, 'fef0b286-bd80-4338-9128-229b98e550e1'),
  ('22867123-d599-45b1-bac6-667b0d86bb47'::uuid, 6.59, '8e633755-5180-46c4-8ef5-35d3623c58c7'),
  ('d2eb1d22-a34e-4eff-9d58-2ba21c347b5f'::uuid, 6.99, '35667fa6-6b04-4bd7-93e6-3248a7f9b929'),
  ('391e03dc-1096-4e56-89bd-11c469c93c75'::uuid, 17.90, '404ccbb2-e4ae-4306-9434-1e3ff82c0f5a'),
  ('c38b8e22-5e08-405a-a431-34c9e9de0b7b'::uuid, 6.99, '738b0bb4-2c0e-4b35-8e66-2a176484aab6'),
  ('0a833aaa-673b-4f09-b190-6b9ec8bb2a43'::uuid, 6.99, '94cd70a0-9b73-4af7-bbe3-219ddd00395f'),
  ('ec5bd661-cdfd-4dde-8996-cbe7cc1b3ee6'::uuid, 6.99, 'b0c6c7d7-d321-40ea-b321-930b4f7ffba4'),
  ('4265f759-2e61-431b-b7b7-2374342fc030'::uuid, 5.49, 'ee34ef0c-aa9d-49a2-93c9-5cc407b4972f'),
  ('da33a947-5608-4e00-aa5a-32a8fe9f5293'::uuid, 17.90, 'b697b47b-2a1c-4144-84e7-1ff8ca477576'),
  ('f82cabe6-f3aa-41a5-aeb2-b2ed9984f9aa'::uuid, 15.00, '44febe68-4ee6-458b-be57-ad014e3675fb'),
  ('63ea049c-6787-4a82-aad3-009f9d35c3b8'::uuid, 14.95, 'cc0026db-c4c6-42ca-ab02-d4799ae2bc72'),
  ('6fb1bccc-688e-4f56-9218-7e873c8f4090'::uuid, 6.99, 'cb63daf4-c685-43be-aa43-2f51a6d20f82'),
  ('4140b257-2033-47a0-a63a-165fdaf02051'::uuid, 6.99, '12f7e736-b475-4077-bbbc-0ab25ebd72c0'),
  ('0e06f0c6-bf29-446a-89d1-5e18b4d5aee9'::uuid, 5.49, '44ed6a1a-9f67-4b5d-811d-72de4a3a3ee7'),
  ('4d0a8f35-8783-4f6d-8e71-5682290bc777'::uuid, 53.00, '54daefd8-fc5f-4458-9141-50164b630b2e'),
  ('62125e45-8581-4721-98da-d43b1ae7f95f'::uuid, 34.90, '809062f4-9fab-4165-816d-ba005c791f60'),
  ('4f47fb28-a183-4362-97f5-f6186b01e460'::uuid, 5.49, 'fd579d43-d731-4498-89e7-81c237644fb9'),
  ('c4f20508-130a-4698-b71b-b0cf3266877e'::uuid, 5.49, 'ae9c4f58-dfe6-4860-ae67-67de335174f3'),
  ('4b1aae56-cda5-473c-b896-84d120db2c21'::uuid, 17.98, '4bb1f1d1-f1b5-4a78-83d5-653388edf101'),
  ('eb9e8c4b-91ad-444c-bd73-1017e5e30cc0'::uuid, 8.98, 'ad830807-24e6-42e3-9081-c52f99465aab'),
  ('cd9154dd-19a6-4918-8fb0-cfaa5320a54b'::uuid, 5.49, '1a00641d-ef85-4d17-b84d-5a1bbcd122d4'),
  ('04d68b70-5564-4641-93dc-46a15bc94a9c'::uuid, 6.95, '896d3546-5e0a-4bb9-9b8b-7a51c441cb0f'),
  ('918fa9a4-b320-43bd-af84-8989ebb70893'::uuid, 10.90, '2be40383-1cba-43d9-9ef5-46dd6b828d8d'),
  ('8c83fde2-e87b-476a-81f1-8dbfddafbcfe'::uuid, 10.90, '0d8ec5d0-cf75-4c7a-91dc-b6c88783b8aa')
) as v(id, price, sumup_item_id)
where p.id = v.id;
