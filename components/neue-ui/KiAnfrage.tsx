"use client";

/* Zweiter Weg neben der Schnellanfrage: der Bewerbungs-Assistent mit KI und
   Berechnung, als Popup (wie TerminKalender mode="dialog"). Der Assistent
   bleibt auch geschlossen gemountet, damit er Regalwand- und Treppen-Events
   mitbekommt, die vor dem Öffnen kommen. */

import { useRef } from "react";
import { track } from "@/lib/analytics-client";
import Assistent from "./Assistent";

export default function KiAnfrage() {
  const dlg = useRef<HTMLDialogElement>(null);

  const oeffnen = () => {
    track({ event_type: "interaction", path: window.location.pathname, section: "ki-anfrage" });
    dlg.current?.showModal();
  };

  return (
    <>
      <div className="ki">
        <p className="ki__kicker">KI-Anfrage · 2 Minuten</p>
        <p className="ki__h">Sieh vorher, ab wie vielen Verkäufen sich deine Regalfront selbst bezahlt.</p>
        <ul className="ki__list">
          <li>Menschen im Laden je Monat und was dich deine Regalfront je 1.000 davon kostet</li>
          <li>Geschätzte Verkäufe im Monat, als Spanne statt einer festen Zahl</li>
          <li>Deine Rechnung mit Miete und 7 % Provision, im Monat und am Tag</li>
          <li>Deine Herstellerkarte und Artikelkarte, gebaut aus deiner Website</li>
          <li>Sofort-Check: Passt du zu unseren&nbsp;Regeln?</li>
        </ul>
        <button type="button" className="btn btn--lit" onClick={oeffnen}>
          KI-Anfrage starten
        </button>
      </div>

      <dialog
        ref={dlg}
        className="ki__dlg"
        aria-label="KI-Anfrage mit Berechnung"
        onClick={(e) => {
          if (e.target === e.currentTarget) dlg.current?.close();
        }}
      >
        <div className="ki__bar">
          <span>KI-Anfrage mit Berechnung</span>
          <button type="button" onClick={() => dlg.current?.close()} aria-label="Schließen">
            ✕
          </button>
        </div>
        <div className="ki__body">
          <Assistent />
        </div>
      </dialog>
    </>
  );
}
