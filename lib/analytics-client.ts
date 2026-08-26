// Browser-Seite der Reichweitenmessung: ein Weg raus, POST /api/track.
//
// Bewusst ohne jeden Zugriff auf den Endgerätespeicher – kein Cookie, kein
// localStorage, kein sessionStorage. § 25 TDDDG greift bei jedem Speichern
// oder Lesen im Endgerät, nicht nur bei Cookies; ohne diesen Zugriff braucht
// die Messung kein Consent-Banner. Die Session bildet der Server (siehe
// app/api/track/route.ts).
import type { TrackPayload } from "./analytics-types";

const ENDPUNKT = "/api/track";

/**
 * Schickt ein Event los. Fehler werden geschluckt: eine fehlgeschlagene
 * Messung darf nie im Browser des Besuchers sichtbar werden.
 *
 * beacon=true für Events beim Verlassen der Seite – normale fetch-Requests
 * werden beim Navigieren abgebrochen, sendBeacon nicht.
 */
export function track(payload: TrackPayload, beacon = false): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify(payload);

    if (beacon && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ENDPUNKT, new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch(ENDPUNKT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      // keepalive, damit das Event auch eine schnelle Navigation direkt
      // danach übersteht.
      keepalive: true,
    }).catch(() => {});
  } catch {
    // absichtlich still
  }
}

/** Referrer auf den Host reduzieren – die volle URL mit Query wird nicht erhoben. */
export function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    // Eigene Navigation ist kein Referrer.
    if (url.host === window.location.host) return null;
    return url.host.replace(/^www\./, "");
  } catch {
    return null;
  }
}
