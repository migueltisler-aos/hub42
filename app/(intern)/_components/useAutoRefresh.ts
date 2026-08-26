"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Holt die Server-Component-Daten der aktuellen Route periodisch neu.
 *
 * Ersetzt die früheren Supabase-Realtime-Channels in PipelineClient und
 * AngeboteClient. Grund: Realtime respektiert RLS, und pipeline_brands /
 * pipeline_angebote haben seit dem RLS-Lockdown keine anon-Policy mehr – der
 * Channel hätte still keine Events mehr geliefert (kein Fehler, keine Warnung,
 * die Live-Updates hören einfach auf). Die Alternative wäre Supabase Auth im
 * Browser gewesen, was für ein internes Werkzeug mit drei Nutzern in keinem
 * Verhältnis steht.
 *
 * Bewusster Unterschied im Verhalten: Änderungen anderer Nutzer erscheinen
 * innerhalb von ~30 s statt sofort.
 *
 * Wichtig für aufrufende Komponenten: router.refresh() aktualisiert nur die
 * Props. Wer Server-Daten in lokalen useState kopiert, muss den State den
 * Props folgen lassen – sonst refresht die Seite und die Liste zeigt weiter
 * alte Daten.
 */
export function useAutoRefresh(intervalMs: number = DEFAULT_INTERVAL_MS) {
  const router = useRouter();

  useEffect(() => {
    // Im Hintergrund-Tab nicht pollen – spart Requests und vermeidet, dass ein
    // vergessener Tab dauerhaft die DB anfragt.
    function refreshWennSichtbar() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    const intervall = setInterval(refreshWennSichtbar, intervalMs);
    // Zusätzlich direkt beim Zurückkehren in den Tab: dort ist der Stand am
    // wahrscheinlichsten veraltet.
    document.addEventListener("visibilitychange", refreshWennSichtbar);

    return () => {
      clearInterval(intervall);
      document.removeEventListener("visibilitychange", refreshWennSichtbar);
    };
  }, [router, intervalMs]);
}
