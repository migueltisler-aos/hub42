"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { pfadWirdGemessen } from "@/lib/analytics-types";

/**
 * Google Analytics 4 – lädt erst NACH Einwilligung (§ 25 TDDDG).
 *
 * Ohne NEXT_PUBLIC_GA_ID passiert gar nichts (lokal, Preview). Die eigene,
 * cookiefreie Reichweitenmessung (components/Analytics.tsx) läuft unabhängig
 * davon weiter und bleibt die vollständige Zahl – GA sieht nur die, die
 * zustimmen.
 *
 * Die Wahl liegt in localStorage. Das Speichern der Einwilligung selbst ist
 * technisch erforderlich und braucht keine eigene Einwilligung.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const KEY = "hub42_consent_ga";
const EVENT = "hub42:consent";

type Wahl = "granted" | "denied" | null;

function lies(): Wahl {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function abonniere(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function setze(wahl: Wahl) {
  try {
    if (wahl) localStorage.setItem(KEY, wahl);
    else localStorage.removeItem(KEY);
  } catch {
    // Speicher blockiert: Wahl gilt dann nur für diesen Seitenaufruf nicht –
    // GA bleibt aus, das ist die sichere Seite.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Widerruf: GA-Cookies löschen und neu laden, damit gtag.js wirklich weg ist. */
function widerrufe() {
  const host = location.hostname.replace(/^www\./, "");
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      for (const domain of ["", `; domain=.${host}`, `; domain=${host}`]) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }
  setze("denied");
  location.reload();
}

/** Für den Footer-Link „Cookie-Einstellungen": öffnet den Banner erneut. */
export function oeffneCookieEinstellungen() {
  setze(null);
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  // Server-Snapshot "ssr": weder Banner noch Script im vorgerenderten HTML,
  // entschieden wird erst im Browser.
  const wahl = useSyncExternalStore<Wahl | "ssr">(abonniere, lies, () => "ssr");

  if (!GA_ID || wahl === "ssr" || !pfadWirdGemessen(pathname)) return null;

  if (wahl === "granted") {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </>
    );
  }

  if (wahl === "denied") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-Einwilligung"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto bg-green-muted border border-stone-dark rounded-lg shadow-2xl p-5 sm:flex sm:items-center sm:gap-6">
        <p className="text-stone text-sm leading-relaxed">
          Wir würden gern <strong className="text-cream">Google Analytics</strong> nutzen, um zu
          verstehen, wie Besucher auf unsere Seite kommen. Dafür setzt Google Cookies und
          verarbeitet Daten ggf. in den USA. Ohne Zustimmung bleibt es bei unserer eigenen,
          cookiefreien Messung.{" "}
          <a href="/datenschutz" className="text-bronze hover:underline">
            Mehr erfahren
          </a>
        </p>
        <div className="mt-4 sm:mt-0 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setze("denied")}
            className="px-4 py-2 text-sm border border-stone text-cream rounded hover:border-bronze transition-colors"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={() => setze("granted")}
            className="px-4 py-2 text-sm bg-bronze text-green-muted font-semibold rounded hover:bg-bronze-light transition-colors"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer-Button: bei erteilter Einwilligung Widerruf, sonst Banner erneut zeigen. */
export function CookieEinstellungenButton({ className }: { className?: string }) {
  const wahl = useSyncExternalStore<Wahl | "ssr">(abonniere, lies, () => "ssr");
  if (!GA_ID) return null;
  return (
    <button
      type="button"
      onClick={() => (wahl === "granted" ? widerrufe() : oeffneCookieEinstellungen())}
      className={className}
    >
      {wahl === "granted" ? "Google Analytics deaktivieren" : "Cookie-Einstellungen"}
    </button>
  );
}
