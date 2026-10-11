"use client";

/* Terminbuchung über Calendly, ohne die Site zu verlassen. Bewusst als
   schlichtes iframe statt widget.js: Calendly wird erst geladen, wenn der
   Besucher auf den Button klickt – vorher geht keine Anfrage an Calendly
   (siehe Datenschutzerklärung, Abschnitt Terminbuchung).

   mode="dialog": Button öffnet den Kalender als Overlay (Startseite).
   mode="inline": Button lädt den Kalender an Ort und Stelle (/termin). */

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics-client";

export const CALENDLY_URL = "https://calendly.com/miguel-tryhub42/30min";

function calendlySrc(): string {
  const p = new URLSearchParams({
    embed_domain: window.location.hostname,
    embed_type: "Inline",
    hide_gdpr_banner: "1",
    hide_event_type_details: "1",
    primary_color: "c8964a",
    text_color: "1e241d",
    background_color: "f6f3eb",
  });
  return `${CALENDLY_URL}?${p}`;
}

/* Calendly meldet eine Buchung per postMessage an die einbettende Seite. */
function useBuchungMelden(aktiv: boolean) {
  useEffect(() => {
    if (!aktiv) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== "https://calendly.com") return;
      if (e.data?.event === "calendly.event_scheduled") {
        track({ event_type: "conversion", path: window.location.pathname, section: "termin" });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [aktiv]);
}

/* Wird nur nach einem Klick gerendert, also nie auf dem Server – window ist da. */
function Kalender({ scrollen = false }: { scrollen?: boolean }) {
  const [src] = useState(calendlySrc);
  return (
    <div
      className="termin__frame"
      ref={scrollen ? (el) => el?.scrollIntoView({ behavior: "smooth", block: "start" }) : undefined}
    >
      <iframe src={src} title="Termin mit Hub42 buchen" />
    </div>
  );
}

const HINWEIS = (
  <p className="termin__hint">
    Der Kalender kommt von Calendly. Erst mit dem Klick werden Daten an Calendly übertragen,{" "}
    <a href="/datenschutz">mehr dazu</a>.
  </p>
);

export default function TerminKalender({
  mode,
  label = "Erst sprechen? 30 Min. Termin buchen",
  className = "btn btn--dark",
}: {
  mode: "dialog" | "inline";
  label?: string;
  className?: string;
}) {
  const [offen, setOffen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  useBuchungMelden(offen);

  const oeffnen = () => {
    setOffen(true);
    track({ event_type: "interaction", path: window.location.pathname, section: "termin" });
    if (mode === "dialog") dlg.current?.showModal();
  };

  if (mode === "inline") {
    return offen ? (
      <Kalender scrollen />
    ) : (
      <div className="termin__start">
        <button type="button" className={className} onClick={oeffnen}>
          {label}
        </button>
        {HINWEIS}
      </div>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={oeffnen}>
        {label}
      </button>
      <dialog
        ref={dlg}
        className="termin__dlg"
        aria-label="Termin buchen"
        onClose={() => setOffen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dlg.current?.close();
        }}
      >
        <div className="termin__bar">
          <span>30 Min. mit Miguel Tisler</span>
          <button type="button" onClick={() => dlg.current?.close()} aria-label="Schließen">
            ✕
          </button>
        </div>
        {offen && <Kalender />}
      </dialog>
    </>
  );
}
