-- Bereits angewendet über den Supabase-MCP (2026-07-28).
-- Ergänzt feedback_panels um einen optionalen Kontakt-Opt-in für Scout-Level-Belohnungen
-- (Newsletter ab Silber, Jury-Sparringspartner-Einladung ab Gold). Bewusst getrennt vom
-- Consent für die Forschungsdaten (consent_at) — Kontaktangabe bleibt freiwillig und on-top.

alter table feedback_panels
  add column if not exists contact_email text,
  add column if not exists contact_opt_in_at timestamptz,
  add column if not exists contact_interests jsonb not null default '[]';
