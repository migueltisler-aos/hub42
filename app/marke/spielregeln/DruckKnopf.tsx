"use client";

/** Öffnet den Druckdialog des Browsers; dort geht auch „Als PDF speichern“. */
export default function DruckKnopf() {
  return (
    <button type="button" className="mp-knopf mp-druck-aus" onClick={() => window.print()}>
      Drucken oder als PDF speichern
    </button>
  );
}
