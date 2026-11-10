"use client";

import { useState, useTransition } from "react";
import { Check, Lock, LockOpen } from "lucide-react";
import type { Person, Umfrage } from "@/lib/crm-heute-model";
import { umfrageAnlegen, umfrageSchliessen, umfrageWaehlen } from "../actions";

/** Umfrage an einer Aufgabe: Antworten als Knöpfe, Balken nach Anteil, Namen darunter. */
export function UmfrageBlock({ umfrage, ich, nurLesen = false }: { umfrage: Umfrage; ich: Person; nurLesen?: boolean }) {
  const [laeuft, starte] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const stimmen = umfrage.optionen.reduce((s, o) => s + o.wer.length, 0);
  const personen = new Set(umfrage.optionen.flatMap((o) => o.wer)).size;
  const vorn = Math.max(0, ...umfrage.optionen.map((o) => o.wer.length));

  const ausfuehren = (f: () => Promise<{ ok: boolean; fehler?: string }>) =>
    starte(async () => {
      const r = await f();
      setFehler(r.ok ? null : (r.fehler ?? "Fehlgeschlagen."));
    });

  return (
    <div className="umfrage" aria-busy={laeuft || undefined}>
      <p className="umfrage__frage">
        {umfrage.frage}
        <span className="umfrage__meta">
          {umfrage.mehrfach ? " · mehrere wählbar" : ""} · {personen} {personen === 1 ? "Person" : "Personen"}
          {umfrage.geschlossen && " · geschlossen"}
        </span>
      </p>
      <ul className="umfrage__optionen">
        {umfrage.optionen.map((o) => {
          const meine = o.wer.includes(ich);
          const anteil = stimmen ? Math.round((o.wer.length / stimmen) * 100) : 0;
          const fuehrt = umfrage.geschlossen && o.wer.length > 0 && o.wer.length === vorn;
          return (
            <li key={o.id}>
              <button
                type="button"
                className="umfrage__option"
                aria-pressed={meine}
                data-fuehrt={fuehrt || undefined}
                disabled={nurLesen || umfrage.geschlossen || laeuft}
                onClick={() => ausfuehren(() => umfrageWaehlen(umfrage.id, o.id))}
              >
                <span className="umfrage__balken" style={{ width: `${anteil}%` }} aria-hidden="true" />
                <span className="umfrage__text">
                  {meine && <Check aria-hidden="true" />}
                  {o.text}
                </span>
                <span className="umfrage__zahl">{o.wer.length}</span>
              </button>
              {o.wer.length > 0 && <p className="umfrage__wer">{o.wer.join(", ")}</p>}
            </li>
          );
        })}
      </ul>
      {!nurLesen && (
        <div className="umfrage__fuss">
          <button
            type="button"
            className="knopf knopf--klein"
            disabled={laeuft}
            onClick={() => ausfuehren(() => umfrageSchliessen(umfrage.id, !umfrage.geschlossen))}
          >
            {umfrage.geschlossen ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
            {umfrage.geschlossen ? "Wieder öffnen" : "Schließen"}
          </button>
          {fehler && (
            <span className="formular__fehler" role="alert">
              {fehler}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Neue Umfrage: Frage, zwei bis sechs Antworten, eine Zeile je Antwort. */
export function UmfrageFormular({ aufgabeId, fertig }: { aufgabeId: string; fertig: () => void }) {
  const [frage, setFrage] = useState("");
  const [optionen, setOptionen] = useState(["", ""]);
  const [mehrfach, setMehrfach] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    starte(async () => {
      const r = await umfrageAnlegen(aufgabeId, frage, optionen, mehrfach);
      if (r.ok) fertig();
      else setFehler(r.fehler);
    });
  }

  return (
    <form className="formular umfrage__formular" onSubmit={speichern} aria-label="Neue Umfrage">
      <label className="formular__feld formular__feld--breit">
        <span className="formular__label">Frage</span>
        <input
          className="formular__eingabe"
          value={frage}
          onChange={(e) => setFrage(e.target.value)}
          required
          maxLength={200}
          autoFocus
          placeholder="z. B. Welcher Termin passt?"
        />
      </label>
      {optionen.map((o, i) => (
        <label key={i} className="formular__feld formular__feld--breit">
          <span className="formular__label">Antwort {i + 1}</span>
          <input
            className="formular__eingabe"
            value={o}
            maxLength={100}
            required={i < 2}
            onChange={(e) => setOptionen((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
          />
        </label>
      ))}
      <div className="formular__knoepfe formular__knoepfe--umbruch">
        {optionen.length < 6 && (
          <button type="button" className="knopf knopf--klein" onClick={() => setOptionen((l) => [...l, ""])}>
            Antwort hinzufügen
          </button>
        )}
        <label className="umfrage__mehrfach">
          <input type="checkbox" checked={mehrfach} onChange={(e) => setMehrfach(e.target.checked)} />
          mehrere Antworten erlaubt
        </label>
      </div>
      {fehler && (
        <p className="formular__fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="formular__knoepfe">
        <button type="submit" className="knopf knopf--voll" disabled={laeuft}>
          {laeuft ? "Speichert…" : "Umfrage starten"}
        </button>
        <button type="button" className="knopf" onClick={fertig} disabled={laeuft}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
