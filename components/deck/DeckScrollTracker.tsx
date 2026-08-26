"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics-client";
import { sektionPositionPct } from "@/lib/analytics-types";

/**
 * Misst, wie weit ins Deck gelesen wird.
 *
 * Beobachtet die [data-deck-section]-Blöcke und meldet jede Sektion genau
 * einmal – kein Event-Sturm beim Scrollen, und mehrfaches Hin- und Herscrollen
 * verzerrt die Lesetiefe nicht.
 *
 * Rendert nichts. Die Sektionen selbst bleiben Server Components; dieser
 * Tracker hängt sich nur an das DOM, das sie erzeugen.
 */
export default function DeckScrollTracker() {
  useEffect(() => {
    const gemeldet = new Set<string>();
    const blocks = document.querySelectorAll<HTMLElement>("[data-deck-section]");
    if (blocks.length === 0) return;

    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const eintrag of eintraege) {
          if (!eintrag.isIntersecting) continue;

          const key = eintrag.target.getAttribute("data-deck-section");
          if (!key || gemeldet.has(key)) continue;
          gemeldet.add(key);

          track({
            event_type: "section",
            path: window.location.pathname,
            section: key,
            // Position statt Reihenfolge-Index: so kann die Auswertung die
            // Lesetiefe sortieren, ohne die Sektionsnamen kennen zu müssen.
            scroll_pct: sektionPositionPct(key),
          });
        }
      },
      {
        // 25 % sichtbar zählt als gelesen. Ein reines "hat den Rand berührt"
        // würde beim schnellen Durchscrollen alle Sektionen als gelesen
        // melden und die Zahl wertlos machen.
        threshold: 0.25,
      }
    );

    blocks.forEach((b) => beobachter.observe(b));
    return () => beobachter.disconnect();
  }, []);

  return null;
}
