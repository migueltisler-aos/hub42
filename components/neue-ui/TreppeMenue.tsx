"use client";

/* Die Treppe als Seitenleiste: Die Startseite zeigt vorne nur Regal und
   Preis, die vier Stufen klappen auf Wunsch von rechts herein.

   Eine Leiste, beliebig viele Auslöser: <TreppeKnopf> schickt TREPPE_EVENT,
   die Leiste hört darauf. Auch /#treppe (Links von /hersteller und /termin)
   öffnet sie. "Diese Stufe anfragen" in der Treppe schickt EINSTIEG_EVENT;
   dann schließt die Leiste, damit der Sprung zum Formular sichtbar wird. */

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics-client";
import { EINSTIEG_EVENT } from "@/lib/treppe";

const TREPPE_EVENT = "hub42:treppe";

export function TreppeKnopf({
  children,
  className = "btn btn--quiet",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(TREPPE_EVENT))}
    >
      {children}
    </button>
  );
}

export default function TreppeMenue({ children }: { children: React.ReactNode }) {
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const oeffnen = () => {
      if (dlg.current?.open) return;
      dlg.current?.showModal();
      track({ event_type: "interaction", path: window.location.pathname, section: "treppe" });
    };
    const schliessen = () => dlg.current?.close();
    const perHash = () => {
      if (window.location.hash === "#treppe") oeffnen();
    };

    perHash();
    window.addEventListener(TREPPE_EVENT, oeffnen);
    window.addEventListener(EINSTIEG_EVENT, schliessen);
    window.addEventListener("hashchange", perHash);
    return () => {
      window.removeEventListener(TREPPE_EVENT, oeffnen);
      window.removeEventListener(EINSTIEG_EVENT, schliessen);
      window.removeEventListener("hashchange", perHash);
    };
  }, []);

  return (
    <dialog
      ref={dlg}
      id="treppe"
      className="treppe__dlg"
      aria-label="Die Treppe: vier Stufen vom ersten Beweis bis zum Portfolio"
      onClose={() => {
        // #treppe aus der Adresse nehmen, sonst öffnet ein Reload die Leiste erneut.
        if (window.location.hash === "#treppe") {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dlg.current?.close();
      }}
    >
      <div className="termin__bar">
        <span>Die Treppe · vier Stufen</span>
        <button type="button" onClick={() => dlg.current?.close()} aria-label="Schließen">
          ✕
        </button>
      </div>
      <div className="treppe__body">{children}</div>
    </dialog>
  );
}
