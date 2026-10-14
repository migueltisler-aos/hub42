-- KI-Anfragen aus dem Bewerbungs-Assistenten (Startseite #bewerben, Popup)
--
-- Ausführen im Supabase SQL Editor.
--
-- Jede KI-Anfrage landet hier, auch wenn die Marke nicht abschickt – so sieht
-- das Outreach-Team, welche Marken sich interessiert haben und wo sie
-- ausgestiegen sind. Bewusst OHNE Personendaten: kein Name, keine E-Mail,
-- keine IP. Nur, was die Marke selbst öffentlich auf ihrer Website zeigt,
-- plus ihre Antworten im Assistenten.
--
--   website      eingegebene Adresse
--   marke        von der KI erkannter Markenname
--   karte        Entwurf der Herstellerkarte (lib/karte-model.ts, nurEntwurf)
--   produkte     gewählte Produkte (Titel, Preis, Bild-URL)
--   antworten    Ziele, Start, Handelsreife, Regal, Schätzung
--   schritt      weitester erreichter Schritt im Assistenten
--   abgeschickt  true, sobald daraus eine Bewerbung wurde
--   bewerbung_id die Bewerbung dazu (falls abgeschickt)
--   pipeline_id  Lead in pipeline_brands, wenn ins Outreach übernommen
--
-- Schreiben und Lesen nur über den Service-Role-Key (lib/supabase-admin.ts).
-- Keine anon-Policy – siehe rls_lockdown_migration.sql.

create table if not exists ki_anfragen (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  website       text not null,
  marke         text,
  karte         jsonb,
  produkte      jsonb,
  antworten     jsonb,
  schritt       text,
  abgeschickt   boolean not null default false,
  bewerbung_id  uuid references bewerbungen (id) on delete set null,
  pipeline_id   uuid references pipeline_brands (id) on delete set null
);

create index if not exists ki_anfragen_created_at_idx on ki_anfragen (created_at desc);

alter table ki_anfragen enable row level security;

notify pgrst, 'reload schema';
