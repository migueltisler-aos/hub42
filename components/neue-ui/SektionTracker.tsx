"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics-client";

/**
 * Lesetiefe der Startseite: wie DeckScrollTracker, aber für die
 * [data-sektion]-Blöcke von /. Jede Sektion wird pro Aufruf einmal gemeldet,
 * scroll_pct ist ihre Position in der Seitenreihenfolge (0 = oben, 100 = unten),
 * damit die Auswertung den Ausstieg sortieren kann, ohne die Namen zu kennen.
 */
export default function SektionTracker() {
  useEffect(() => {
    const gemeldet = new Set<string>();
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-sektion]"));
    if (blocks.length === 0) return;

    const position = new Map(
      blocks.map((b, i) => [
        b.dataset.sektion ?? "",
        blocks.length > 1 ? Math.round((i / (blocks.length - 1)) * 100) : 0,
      ])
    );

    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const eintrag of eintraege) {
          if (!eintrag.isIntersecting) continue;
          const key = (eintrag.target as HTMLElement).dataset.sektion;
          if (!key || gemeldet.has(key)) continue;
          gemeldet.add(key);
          track({
            event_type: "section",
            path: window.location.pathname,
            section: key,
            scroll_pct: position.get(key) ?? null,
          });
        }
      },
      // 25 % sichtbar zählt als gesehen, wie im Deck.
      { threshold: 0.25 }
    );

    blocks.forEach((b) => beobachter.observe(b));
    return () => beobachter.disconnect();
  }, []);

  return null;
}
