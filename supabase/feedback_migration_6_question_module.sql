-- Bereits angewendet über den Supabase-MCP (2026-08-03).
-- Fragen-Modul: statt Freitext-Attributen direkt am Produkt gibt es jetzt
-- wiederverwendbare Fragensets (z.B. "Basis", "Verpackung"), die sich beliebigen
-- Produkten zuordnen lassen. Die 9-Punkt-Hedonic-Skala und die Van-Westendorp-
-- Preisfragen bleiben bewusst außen vor (fest im Scout-Level/Vergleichs-System
-- verdrahtet, siehe feedback_migration_5_settings.sql).

create table if not exists feedback_question_sets (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create table if not exists feedback_questions (
  id               uuid primary key default gen_random_uuid(),
  question_set_id  uuid not null references feedback_question_sets(id) on delete cascade,
  type             text not null check (type in ('semantic_diff','likert','text')),
  position         integer not null default 0,
  prompt           text,        -- Likert-Statement bzw. Freitext-Frage; bei semantic_diff ungenutzt
  label_left       text,        -- semantic_diff + likert: Skalen-Endpunkt links
  label_right      text,        -- semantic_diff + likert: Skalen-Endpunkt rechts
  scale_max        integer,     -- semantic_diff (Standard 7), likert (Standard 5)
  created_at       timestamptz not null default now()
);

create table if not exists feedback_product_question_sets (
  product_id       uuid not null references feedback_products(id) on delete cascade,
  question_set_id  uuid not null references feedback_question_sets(id) on delete cascade,
  primary key (product_id, question_set_id)
);

create table if not exists feedback_answers (
  id             uuid primary key default gen_random_uuid(),
  rating_id      uuid not null references feedback_ratings(id) on delete cascade,
  question_id    uuid not null references feedback_questions(id) on delete cascade,
  value_numeric  numeric,
  value_text     text,
  created_at     timestamptz not null default now(),
  unique (rating_id, question_id)
);

create index if not exists feedback_questions_set_idx on feedback_questions(question_set_id);
create index if not exists feedback_pqs_set_idx on feedback_product_question_sets(question_set_id);
create index if not exists feedback_answers_question_idx on feedback_answers(question_id);
create index if not exists feedback_answers_rating_idx on feedback_answers(rating_id);

alter table feedback_question_sets         enable row level security;
alter table feedback_questions             enable row level security;
alter table feedback_product_question_sets enable row level security;
alter table feedback_answers               enable row level security;

create policy anon_full_access on feedback_question_sets         for all to anon using (true) with check (true);
create policy anon_full_access on feedback_questions             for all to anon using (true) with check (true);
create policy anon_full_access on feedback_product_question_sets for all to anon using (true) with check (true);
create policy anon_full_access on feedback_answers               for all to anon using (true) with check (true);

-- Einmalige Datenmigration: bestehende feedback_products.attributes (Freitext-Paare)
-- werden je Produkt in ein eigenes Fragenset umgewandelt, bestehende
-- feedback_ratings.sem_diff-Werte werden nach feedback_answers zurückgeschrieben.
-- (Nur beim erstmaligen Anwenden relevant — bei einer frischen DB ohne Altdaten
-- läuft die Schleife einfach leer durch.)
DO $$
DECLARE
  prod RECORD;
  attr RECORD;
  rating RECORD;
  new_set_id uuid;
  new_question_id uuid;
  idx integer;
  attr_val numeric;
BEGIN
  FOR prod IN SELECT id, name, attributes FROM feedback_products WHERE attributes != '[]'::jsonb LOOP
    INSERT INTO feedback_question_sets (name, description)
    VALUES (prod.name || ' – Attribute', 'Automatisch migriert aus den ursprünglichen Produkt-Attributen')
    RETURNING id INTO new_set_id;

    INSERT INTO feedback_product_question_sets (product_id, question_set_id)
    VALUES (prod.id, new_set_id);

    idx := 0;
    FOR attr IN SELECT * FROM jsonb_array_elements(prod.attributes) LOOP
      INSERT INTO feedback_questions (question_set_id, type, position, label_left, label_right, scale_max)
      VALUES (new_set_id, 'semantic_diff', idx, attr.value->>'left', attr.value->>'right', 7)
      RETURNING id INTO new_question_id;

      FOR rating IN SELECT id, sem_diff FROM feedback_ratings WHERE product_id = prod.id LOOP
        attr_val := (rating.sem_diff->>idx)::numeric;
        IF attr_val IS NOT NULL THEN
          INSERT INTO feedback_answers (rating_id, question_id, value_numeric)
          VALUES (rating.id, new_question_id, attr_val)
          ON CONFLICT (rating_id, question_id) DO NOTHING;
        END IF;
      END LOOP;

      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- Zwei Beispiel-Sets als Vorlage, keinem Produkt zugeordnet (im Admin frei zuweisbar)
INSERT INTO feedback_question_sets (id, name, description) VALUES
  ('74e33f2a-efa0-4a6b-8ff7-254e6288e172', 'Basis', 'Allgemeine Fragen, für jedes Produkt sinnvoll'),
  ('c1306f50-6430-494c-9723-0e25d5065f3b', 'Verpackung', 'Beispiel-Set für Verpackungsfragen — einem beliebigen Produkt zuordenbar')
ON CONFLICT (id) DO NOTHING;

INSERT INTO feedback_questions (question_set_id, type, position, prompt, label_left, label_right, scale_max) VALUES
  ('74e33f2a-efa0-4a6b-8ff7-254e6288e172', 'semantic_diff', 0, null, 'günstig wirkend', 'hochwertig wirkend', 7),
  ('c1306f50-6430-494c-9723-0e25d5065f3b', 'semantic_diff', 0, null, 'unauffällig', 'auffällig', 7),
  ('c1306f50-6430-494c-9723-0e25d5065f3b', 'likert', 1, 'Die Verpackung wirkt nachhaltig/umweltfreundlich.', 'stimme gar nicht zu', 'stimme voll zu', 5);
