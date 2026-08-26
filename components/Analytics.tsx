"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track, referrerHost } from "@/lib/analytics-client";
import { pfadWirdGemessen } from "@/lib/analytics-types";

/**
 * Erfasst Seitenaufrufe und Verweildauer.
 *
 * Liegt im Root-Layout und filtert über pfadWirdGemessen(), statt in jedem
 * Public-Layout einzeln eingebaut zu werden – so wird keine neu angelegte
 * öffentliche Route vergessen.
 *
 * Muss im Layout in <Suspense> stehen: useSearchParams() würde sonst die
 * statisch vorgerenderten Public-Seiten in dynamisches Rendering kippen.
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Startzeitpunkt der aktuellen Seite, für duration_ms beim Verlassen.
  // Bewusst 0 als Startwert: Date.now() im Render-Körper wäre ein unreiner
  // Aufruf. Gesetzt wird der Wert im Effect, bevor er gebraucht wird.
  const seit = useRef<number>(0);
  // Verhindert, dass dieselbe Seite doppelt als "verlassen" gemeldet wird –
  // pagehide und visibilitychange feuern je nach Browser beide.
  const verlassenGemeldet = useRef(false);

  useEffect(() => {
    if (!pfadWirdGemessen(pathname)) return;

    seit.current = Date.now();
    verlassenGemeldet.current = false;

    track({
      event_type: "pageview",
      path: pathname,
      referrer_host: referrerHost(),
      link_token: searchParams.get("b"),
      utm_source: searchParams.get("utm_source"),
      utm_medium: searchParams.get("utm_medium"),
      utm_campaign: searchParams.get("utm_campaign"),
    });

    function meldeVerlassen() {
      if (verlassenGemeldet.current) return;
      verlassenGemeldet.current = true;
      track(
        {
          event_type: "leave",
          path: pathname,
          duration_ms: Date.now() - seit.current,
        },
        // sendBeacon: ein normaler fetch wird beim Verlassen abgebrochen.
        true
      );
    }

    function beiSichtbarkeitswechsel() {
      if (document.visibilityState === "hidden") meldeVerlassen();
    }

    window.addEventListener("pagehide", meldeVerlassen);
    document.addEventListener("visibilitychange", beiSichtbarkeitswechsel);

    return () => {
      window.removeEventListener("pagehide", meldeVerlassen);
      document.removeEventListener("visibilitychange", beiSichtbarkeitswechsel);
      // Auch bei einer Navigation innerhalb der Seite die Dauer festhalten.
      meldeVerlassen();
    };
  }, [pathname, searchParams]);

  return null;
}
