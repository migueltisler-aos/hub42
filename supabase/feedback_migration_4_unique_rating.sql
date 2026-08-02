-- Bereits angewendet über den Supabase-MCP (2026-07-28).
-- Verhindert, dass ein Panel dasselbe Produkt mehrfach bewertet — wichtig sowohl für
-- die wissenschaftliche Sauberkeit (eine Messung pro Person/Produkt) als auch gegen
-- Missbrauch des Scout-Level-/Spiel-Ticket-Systems (Punkte durch Wiederholung farmen).

alter table feedback_ratings
  add constraint feedback_ratings_panel_product_unique unique (panel_id, product_id);
