"use client";

import { useId, useState, useTransition } from "react";
import { BEREICHE, PERSONEN, type Bereich, type Person } from "@/lib/crm-heute-model";
import { aufgabeAendern, aufgabeAnlegen } from "../actions";

/** Was das Formular von einer bestehenden Aufgabe braucht. */
export type Vorlage = {
  id: string;
  titel: string;
  faellig: string | null;
  verantwortlich: Person;
  brand?: { name: string };
  bereich?: Bereich | null;
};

/** Anlegen (ohne `aufgabe`) oder Ändern. `marken` gesetzt: Sales-Aufgabe mit
    Marke; sonst allgemeine Aufgabe mit Bereich. */
export default function AufgabeFormular({
  aufgabe,
  marken,
  heute,
  ich,
  fertig,
}: {
  aufgabe?: Vorlage;
  marken?: { id: string; name: string }[];
  heute: string;
  ich: Person;
  fertig: () => void;
}) {
  const id = useId();
  const mitMarke = marken !== undefined;
  const [titel, setTitel] = useState(aufgabe?.titel ?? "");
  const [marke, setMarke] = useState(aufgabe?.brand?.name ?? "");
  const [bereich, setBereich] = useState<Bereich | "">(aufgabe?.bereich ?? "");
  const [frist, setFrist] = useState(aufgabe ? (aufgabe.faellig ?? "") : heute);
  const [wer, setWer] = useState<Person>(aufgabe?.verantwortlich ?? ich);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    let brandId: string | null = null;
    if (mitMarke) {
      // Die Liste zeigt Namen, gespeichert wird die id der genau passenden Marke.
      const treffer = marken.find((m) => m.name.toLowerCase() === marke.trim().toLowerCase());
      if (!treffer) {
        setFehler("Marke aus der Liste wählen.");
        return;
      }
      brandId = treffer.id;
    }
    const eingabe = { titel, brandId, bereich: mitMarke ? null : bereich || null, faellig: frist || null, wer };
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
          placeholder={mitMarke ? "Was ist zu tun?" : "z. B. Umsatzsteuer abgeben"}
        />
      </label>
      {mitMarke ? (
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
      ) : (
        <label className="formular__feld">
          <span className="formular__label">Bereich</span>
          <select className="formular__eingabe" value={bereich} onChange={(e) => setBereich(e.target.value as Bereich | "")}>
            <option value="">ohne</option>
            {BEREICHE.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      )}
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
