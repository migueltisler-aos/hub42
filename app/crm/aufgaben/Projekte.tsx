"use client";

import { useState, useTransition } from "react";
import { FolderPlus } from "lucide-react";
import { PERSONEN, type AufgabenProjekt, type Person } from "@/lib/crm-heute-model";
import { projektAbschliessen, projektAnlegen } from "../actions";
import { kurzDatum } from "../logik";

/** Projektleiste über den Aufgaben: ein Fach je offenes Projekt mit Fortschritt.
    Ein Klick filtert die Aufgaben auf das Projekt, ein zweiter hebt den Filter auf. */
export default function Projekte({
  projekte,
  gewaehlt,
  waehlen,
  ich,
  heute,
}: {
  projekte: AufgabenProjekt[];
  gewaehlt: string | null;
  waehlen: (id: string | null) => void;
  ich: Person;
  heute: string;
}) {
  const [neu, setNeu] = useState(false);
  const [abgeschlossene, setAbgeschlossene] = useState(false);
  const [laeuft, starte] = useTransition();
  const sichtbar = projekte.filter((p) => abgeschlossene || !p.abgeschlossen || p.id === gewaehlt);
  const aktiv = projekte.find((p) => p.id === gewaehlt) ?? null;
  const anzahlZu = projekte.filter((p) => p.abgeschlossen).length;

  return (
    <section className="projekte" aria-labelledby="projekte-titel">
      <div className="projekte__kopf">
        <h2 id="projekte-titel" className="satz satz--h2">
          Projekte
        </h2>
        <button type="button" className="knopf knopf--klein" aria-expanded={neu} onClick={() => setNeu((n) => !n)}>
          <FolderPlus aria-hidden="true" />
          Neues Projekt
        </button>
      </div>

      {neu && <ProjektFormular ich={ich} heute={heute} fertig={() => setNeu(false)} />}

      {sichtbar.length > 0 ? (
        <ul className="projekte__liste">
          {sichtbar.map((p) => {
            const gesamt = p.offen + p.erledigt;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="projekt"
                  aria-pressed={p.id === gewaehlt}
                  data-abgeschlossen={p.abgeschlossen || undefined}
                  onClick={() => waehlen(p.id === gewaehlt ? null : p.id)}
                >
                  <span className="projekt__titel">{p.titel}</span>
                  <span className="projekt__meta">
                    {p.erledigt}/{gesamt} · {p.verantwortlich}
                    {p.faellig && ` · bis ${kurzDatum(p.faellig)}`}
                  </span>
                  <span className="projekt__balken" aria-hidden="true">
                    <span style={{ width: `${gesamt ? Math.round((p.erledigt / gesamt) * 100) : 0}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !neu && <p className="regal__leer">Noch kein Projekt. Ein Projekt bündelt Aufgaben mit eigener Person und Frist.</p>
      )}

      <div className="projekte__fuss">
        {aktiv && (
          <button
            type="button"
            className="knopf knopf--klein"
            disabled={laeuft}
            onClick={() =>
              starte(async () => {
                await projektAbschliessen(aktiv.id, !aktiv.abgeschlossen);
                if (!aktiv.abgeschlossen) waehlen(null);
              })
            }
          >
            {aktiv.abgeschlossen ? "Projekt wieder öffnen" : `„${aktiv.titel}“ abschließen`}
          </button>
        )}
        {anzahlZu > 0 && (
          <button type="button" className="knopf knopf--klein" onClick={() => setAbgeschlossene((a) => !a)}>
            {abgeschlossene ? "Abgeschlossene ausblenden" : `${anzahlZu} abgeschlossene zeigen`}
          </button>
        )}
      </div>
    </section>
  );
}

function ProjektFormular({ ich, heute, fertig }: { ich: Person; heute: string; fertig: () => void }) {
  const [titel, setTitel] = useState("");
  const [frist, setFrist] = useState("");
  const [wer, setWer] = useState<Person>(ich);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    starte(async () => {
      const r = await projektAnlegen({ titel, wer, faellig: frist || null });
      if (r.ok) fertig();
      else setFehler(r.fehler);
    });
  }

  return (
    <form className="formular projekte__formular" onSubmit={speichern} aria-label="Neues Projekt">
      <label className="formular__feld formular__feld--breit">
        <span className="formular__label">Projekt</span>
        <input
          className="formular__eingabe"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          required
          maxLength={120}
          autoFocus
          placeholder="z. B. Messe März"
        />
      </label>
      <label className="formular__feld">
        <span className="formular__label">Frist</span>
        <input className="formular__eingabe" type="date" min={heute} value={frist} onChange={(e) => setFrist(e.target.value)} />
      </label>
      <label className="formular__feld">
        <span className="formular__label">Verantwortlich</span>
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
          {laeuft ? "Speichert…" : "Projekt anlegen"}
        </button>
        <button type="button" className="knopf" onClick={fertig} disabled={laeuft}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
