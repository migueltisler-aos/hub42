"use client";

import { useState, useTransition } from "react";
import type { Nachweis } from "@/lib/crm-heute-model";

/** Abhaken mit Nachweis: Link zur Lösung (Drive, Doc, Post) und kurze Notiz,
    beides freiwillig, damit andere nachvollziehen können, was getan wurde. */
export default function ErledigtFormular({
  titel,
  abschliessen,
  abbrechen,
}: {
  titel: string;
  abschliessen: (n: Nachweis) => Promise<{ ok: boolean; fehler?: string }>;
  abbrechen: () => void;
}) {
  const [link, setLink] = useState("");
  const [notiz, setNotiz] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function senden(e: React.FormEvent) {
    e.preventDefault();
    starte(async () => {
      const r = await abschliessen({ link, notiz });
      if (!r.ok) setFehler(r.fehler ?? "Speichern ist fehlgeschlagen.");
    });
  }

  return (
    <form className="formular formular--erledigt" onSubmit={senden} aria-label={`${titel} erledigen`}>
      <p className="formular__titel formular__feld--breit">Erledigt: {titel}</p>
      <label className="formular__feld formular__feld--breit">
        <span className="formular__label">Link zur Lösung</span>
        <input
          className="formular__eingabe"
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/…"
          autoFocus
        />
      </label>
      <label className="formular__feld formular__feld--breit">
        <span className="formular__label">Notiz</span>
        <textarea
          className="formular__eingabe formular__eingabe--text"
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Was wurde gemacht? Freiwillig."
        />
      </label>
      {fehler && (
        <p className="formular__fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="formular__knoepfe">
        <button type="submit" className="knopf knopf--voll" disabled={laeuft}>
          {laeuft ? "Speichert…" : "Erledigt"}
        </button>
        <button type="button" className="knopf" onClick={abbrechen} disabled={laeuft}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
