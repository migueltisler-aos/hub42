"use client";

import { useId, useState, useTransition } from "react";
import { PERSONEN, type Aufgabe, type Person } from "@/lib/crm-heute-model";
import { aufgabeAendern, aufgabeAnlegen } from "./actions";

/** Anlegen (ohne `aufgabe`) oder Ändern einer Aufgabe: Titel, Marke, Frist, Person. */
export default function AufgabeFormular({
  aufgabe,
  marken,
  heute,
  ich,
  fertig,
}: {
  aufgabe?: Aufgabe;
  marken: { id: string; name: string }[];
  heute: string;
  ich: Person;
  fertig: () => void;
}) {
  const id = useId();
  const [titel, setTitel] = useState(aufgabe?.titel ?? "");
  const [marke, setMarke] = useState(aufgabe?.brand.name ?? "");
  const [frist, setFrist] = useState(aufgabe ? (aufgabe.faellig ?? "") : heute);
  const [wer, setWer] = useState<Person>(aufgabe?.verantwortlich ?? ich);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    // Die Liste zeigt Namen, gespeichert wird die id der genau passenden Marke.
    const treffer = marken.find((m) => m.name.toLowerCase() === marke.trim().toLowerCase());
    if (!treffer) {
      setFehler("Marke aus der Liste wählen.");
      return;
    }
    const eingabe = { titel, brandId: treffer.id, faellig: frist || null, wer };
    starte(async () => {
      const r = aufgabe ? await aufgabeAendern(aufgabe.id, eingabe) : await aufgabeAnlegen(eingabe);
      if (r.ok) fertig();
      else setFehler(r.fehler);
    });
  }

  return (
    <form className="formular" onSubmit={speichern} aria-label={aufgabe ? "Aufgabe ändern" : "Neue Aufgabe"}>
      <label className="formular__feld formular__feld--breit">
        <span className="formular__label">Aufgabe</span>
        <input
          className="formular__eingabe"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          required
          maxLength={200}
          autoFocus
          placeholder="Was ist zu tun?"
        />
      </label>
      <label className="formular__feld">
        <span className="formular__label">Marke</span>
        <input
          className="formular__eingabe"
          value={marke}
          onChange={(e) => setMarke(e.target.value)}
          list={`${id}-marken`}
          required
          autoComplete="off"
          placeholder="Name tippen"
        />
        <datalist id={`${id}-marken`}>
          {marken.map((m) => (
            <option key={m.id} value={m.name} />
          ))}
        </datalist>
      </label>
      <label className="formular__feld">
        <span className="formular__label">Frist</span>
        <input className="formular__eingabe" type="date" value={frist} onChange={(e) => setFrist(e.target.value)} />
      </label>
      <label className="formular__feld">
        <span className="formular__label">Wer</span>
        <select className="formular__eingabe" value={wer} onChange={(e) => setWer(e.target.value as Person)}>
          {PERSONEN.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      {fehler && (
        <p className="formular__fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="formular__knoepfe">
        <button type="submit" className="knopf knopf--voll" disabled={laeuft}>
          {laeuft ? "Speichert…" : aufgabe ? "Speichern" : "Anlegen"}
        </button>
        <button type="button" className="knopf" onClick={fertig} disabled={laeuft}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
