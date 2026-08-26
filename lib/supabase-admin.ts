// Supabase-Client mit Service-Role-Key – umgeht RLS, ausschließlich serverseitig.
//
// Hintergrund: der Anon-Key (lib/supabase.ts) ist bei Supabase als
// veröffentlichbarer Client-Key vorgesehen; das Sicherheitsmodell setzt darauf,
// dass RLS die Arbeit macht. Alles, was der Browser nicht sehen darf –
// Pipeline/CRM, Angebote, Mail-Log, Outreach, Wareneingang, Bestand, Analytics –
// läuft deshalb über diesen Client. Die zugehörigen Tabellen haben keine
// anon-Policy mehr (supabase/rls_lockdown_migration.sql).
//
// ── Warum "server-only" ─────────────────────────────────────────────────────
// Ein Import aus einer "use client"-Datei bricht damit den BUILD, statt still
// einen undefined-Key auszuliefern. Das ist nicht theoretisch: genau dieser
// Wächter hat AngebotForm.tsx erwischt, das über lib/angebote nur Konstanten
// wollte und dabei den ganzen Datenzugriff ins Client-Bundle gezogen hätte.
// Konsequenz war die Aufteilung in lib/angebote-model.ts und lib/pipeline-model.ts.
//
// ── Warum die scripts ein Flag brauchen ─────────────────────────────────────
// Das Paket "server-only" löst nur unter der Auflösungsbedingung "react-server"
// zu einem leeren Modul auf – die setzt der Next-Build, tsx aber nicht. Ohne
// sie WIRFT der Import. Die scripts/*.ts erreichen diese Datei transitiv über
// lib/pipeline und lib/outreach/*, deshalb laufen sie in package.json mit
//     tsx --conditions=react-server
// Wer ein Script direkt mit "npx tsx scripts/foo.ts" startet, braucht das Flag
// ebenfalls – sonst kommt die irreführende Meldung "cannot be imported from a
// Client Component module".
import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Laut scheitern statt still mit 401 gegen PostgREST zu laufen: fehlt der
    // Key, fallen sämtliche internen Seiten gleichzeitig aus – das ist als
    // Diagnose deutlich besser als leere Listen ohne Fehlermeldung.
    if (!url || !key) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY oder NEXT_PUBLIC_SUPABASE_URL fehlt. " +
          "In .env.local und in den Vercel-Env-Vars (Projekt tryhub42) setzen."
      );
    }

    _admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
