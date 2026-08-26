-- RLS-Lockdown: anon-Zugriff auf die internen Tabellen entfernen
--
-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WARUM
-- ─────────────────────────────────────────────────────────────────────────────
-- Bis hierhin hatte jede der 23 Tabellen die Policy
--
--   create policy anon_full_access ... for all to anon using (true) with check (true)
--
-- Wer den Anon-Key hatte, konnte damit das komplette CRM (pipeline_brands),
-- alle Outreach-Mailtexte (pipeline_email_log, email_events), Angebote,
-- Wareneingang und Bestand lesen UND schreiben.
--
-- Zur Genauigkeit, weil beides geprüft wurde und beides harmloser ist als
-- zunächst angenommen:
--   * Der Anon-Key lag NICHT im Browser-Bundle. Kein Browser-Chunk
--     referenziert supabase; die Client-Components importieren aus lib/* nur
--     Typen und Konstanten.
--   * Der Key war NICHT in der Git-History. Die zwei hartkodierten Kopien
--     (kassensystem/core/config.py und .claude/settings.json) lagen in
--     untracked Dateien. Beide sind inzwischen bereinigt – config.py, weil
--     kassensystem/ das einzige unversionierte Codeverzeichnis im Repo ist und
--     beim ersten Commit alles Hartkodierte dauerhaft in der History landet.
--
-- Unabhängig davon ist der Anon-Key bei Supabase als client-seitiger,
-- veröffentlichbarer Key vorgesehen – das Sicherheitsmodell setzt darauf, dass
-- RLS die Arbeit macht, nicht die Geheimhaltung des Keys. Genau das stellt
-- diese Migration her. Ein Rotieren des Keys wäre kein Ersatz dafür.
--
-- Nach dieser Migration erreichen diese Tabellen nur noch Zugriffe mit dem
-- Service-Role-Key, der ausschließlich serverseitig verwendet wird
-- (lib/supabase-admin.ts). service_role umgeht RLS ohnehin, braucht also
-- keine Ersatz-Policy.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- REIHENFOLGE – WICHTIG
-- ─────────────────────────────────────────────────────────────────────────────
-- Diese Migration erst anwenden, NACHDEM
--   1. SUPABASE_SERVICE_ROLE_KEY in den Vercel-Env-Vars (Projekt tryhub42) steht
--   2. der Code deployt ist, der lib/supabase-admin.ts benutzt
-- Andernfalls laufen die internen Seiten und der Gmail-Webhook in Produktion
-- ins Leere, bis der Deploy durch ist.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- NICHT TEIL DIESER MIGRATION (bewusst)
-- ─────────────────────────────────────────────────────────────────────────────
--   feedback_*  (12 Tabellen) – der öffentliche In-Store-QR-Flow greift mit dem
--                Anon-Key direkt zu. Braucht eine Verengung pro Operation
--                (INSERT ja, SELECT auf feedback_panels nein: Teilnehmer- und
--                Consent-Daten, personenbezogen). Eigener Durchgang.
--   kasse_*     (3 Tabellen) – das Python-POS (kassensystem/) nutzt den
--                Anon-Key über PostgREST. Braucht einen eigenen Zugang und
--                einen Test am Kassengerät. Eigener Durchgang.
--
-- RLS bleibt überall aktiviert; es fällt nur die Policy weg.
-- Bewusst KEIN "force row level security" – das würde auch den
-- Tabelleneigentümer treffen.

-- ── Pipeline / CRM ───────────────────────────────────────────────────────────
drop policy if exists anon_full_access on pipeline_brands;
drop policy if exists anon_full_access on pipeline_angebote;
drop policy if exists anon_full_access on pipeline_email_log;

-- ── Outreach ─────────────────────────────────────────────────────────────────
-- Diese drei Tabellen existieren in der DB, hatten aber nie eine
-- Migrationsdatei im Repo – gefunden über pg_policy, nicht über supabase/*.sql.
drop policy if exists anon_full_access on email_events;
drop policy if exists anon_full_access on outreach_sync_state;
drop policy if exists anon_full_access on suppression;

-- ── Wareneingang / Bestand ───────────────────────────────────────────────────
drop policy if exists anon_full_access on wareneingang_sendungen;
drop policy if exists anon_full_access on wareneingang_chargen;
drop policy if exists anon_full_access on wareneingang_nachbestellungen;
drop policy if exists anon_full_access on bestand_bewegungen;

-- ── Kontrolle ────────────────────────────────────────────────────────────────
-- Nach dem Run: die zehn Tabellen oben müssen policy = NULL zeigen,
-- feedback_* und kasse_* weiterhin anon_full_access.
--
--   select c.relname, c.relrowsecurity, p.polname
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   left join pg_policy p on p.polrelid = c.oid
--   where n.nspname = 'public' and c.relkind = 'r'
--   order by c.relname;
