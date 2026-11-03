"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import type { AllgemeineAufgabe, AufgabenDaten, Person } from "@/lib/crm-heute-model";
import { aufgabeErledigt } from "../actions";
import AufgabeFormular from "../_components/AufgabeFormular";
import { PERSONEN, gruppiere, kurzDatum, langDatum, tageSeit, type Wer } from "../logik";

const WAHL: Wer[] = [...PERSONEN, "Alle"];

/** Allgemeine Aufgaben ohne Marke: Steuer, LinkedIn-Post, Einkauf. */
export default function AufgabenAnsicht({ start, ich, daten }: { start: Wer; ich: Person; daten: AufgabenDaten }) {
  const HEUTE = daten.heute;
  const [wer, setWer] = useState<Wer>(start);
  const [neu, setNeu] = useState(false);
  const [bearbeite, setBearbeite] = useState<string | null>(null);
  // Haken wirken sofort; schlägt das Speichern fehl, springt der Haken zurück.
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});
  const [, starte] = useTransition();
  const lage = gruppiere(daten.aufgaben, HEUTE, wer, erledigt);
  const alle = wer === "Alle";

  const fertig = (a: AllgemeineAufgabe) => erledigt[a.id] ?? a.erledigt;
  const offen = (liste: AllgemeineAufgabe[]) => liste.filter((a) => !fertig(a)).length;
  const umschalten = (a: AllgemeineAufgabe) => {
    const neuWert = !fertig(a);
    setErledigt((e) => ({ ...e, [a.id]: neuWert }));
    starte(async () => {
      const { ok } = await aufgabeErledigt(a.id, neuWert);
      if (!ok) setErledigt((e) => ({ ...e, [a.id]: !neuWert }));
    });
  };

  const wann = (iso: string | null) => {
    if (iso === null) return "ohne Datum";
    const t = tageSeit(iso, HEUTE);
    if (t === 0) return "heute";
    if (t === -1) return "morgen";
    if (t > 0) return `seit ${t} ${t === 1 ? "Tag" : "Tagen"}`;
    return kurzDatum(iso);
  };

  const schliessen = () => {
    setNeu(false);
    setBearbeite(null);
  };
  const formular = (aufgabe?: AllgemeineAufgabe) => (
    <AufgabeFormular aufgabe={aufgabe} heute={HEUTE} ich={wer === "Alle" ? ich : wer} fertig={schliessen} />
  );

  function waehlen(w: Wer) {
    setWer(w);
    window.history.replaceState(null, "", `?wer=${encodeURIComponent(w)}`);
  }

  const zeile = (a: AllgemeineAufgabe, ueberfaellig: boolean) => {
    if (bearbeite === a.id) {
      return (
        <li key={a.id} className="zeile zeile--formular">
          {formular(a)}
        </li>
      );
    }
    const done = fertig(a);
    return (
      <li key={a.id} className="zeile" data-erledigt={done || undefined}>
        <label className="zeile__griff">
          <input type="checkbox" className="haken" checked={done} onChange={() => umschalten(a)} />
          <span className="haken__bild" aria-hidden="true">
            <Check strokeWidth={3} />
          </span>
          <span className="zeile__text">
            <span className="zeile__titel">{a.titel}</span>
            {(alle || a.bereich) && (
              <span className="zeile__meta">
                {alle && <span className="person">{a.verantwortlich}</span>}
                {a.bereich && <span className="stufe">{a.bereich}</span>}
              </span>
            )}
          </span>
        </label>
        <button
          type="button"
          className="zeile__aendern"
          aria-label={`${a.titel} ändern`}
          onClick={() => {
            setNeu(false);
            setBearbeite(a.id);
          }}
        >
          <Pencil aria-hidden="true" />
        </button>
        <span className={`zeile__datum${ueberfaellig && !done ? " zeile__datum--signal" : ""}`}>
          {done ? "erledigt" : wann(a.faellig)}
        </span>
      </li>
    );
  };

  const gruppe = (id: string, titel: string, liste: AllgemeineAufgabe[], leer: string, ueberfaellig = false) => (
    <section className="regal" aria-labelledby={`${id}-titel`}>
      <h2 id={`${id}-titel`} className="satz satz--h2">
        {titel}
        <sup className="satz__zahl">
          <span className="sr-only">, </span>
          {offen(liste)}
          <span className="sr-only"> offen</span>
        </sup>
      </h2>
      {liste.length ? (
        <ul className="regal__liste">{liste.map((a) => zeile(a, ueberfaellig))}</ul>
      ) : (
        <p className="regal__leer">{leer}</p>
      )}
    </section>
  );

  return (
    <div className="heute">
      <div className="heute__kopf">
        <div>
          <h1 className="satz satz--h1">
            Aufgaben
            <sup className="satz__zahl">
              <span className="sr-only">, </span>
              {kurzDatum(HEUTE)}
            </sup>
          </h1>
          <p className="heute__zeile">
            <span className="sr-only">{langDatum(HEUTE)}. </span>
            {offen(lage.ueberfaellig)}&nbsp;überfällig · {offen(lage.heute)}&nbsp;heute&nbsp;offen ·{" "}
            {lage.demnaechst.length}&nbsp;demnächst
          </p>
        </div>
        <div className="heute__aktionen">
          <div className="wahl" role="group" aria-label="Aufgaben von">
            {WAHL.map((w) => (
              <button key={w} type="button" className="wahl__knopf" aria-pressed={wer === w} onClick={() => waehlen(w)}>
                {w}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="knopf knopf--voll"
            aria-expanded={neu}
            onClick={() => {
              setBearbeite(null);
              setNeu(true);
            }}
          >
            <Plus aria-hidden="true" />
            Neue Aufgabe
          </button>
        </div>
      </div>

      {neu && (
        <section className="regal regal--formular" aria-label="Neue Aufgabe">
          {formular()}
        </section>
      )}

      <div className="aufgaben__spalte">
        {gruppe("ueberfaellig", "Überfällig", lage.ueberfaellig, "Nichts überfällig.", true)}
        {gruppe("heute", "Heute", lage.heute, "Heute ist nichts fällig.")}
        {gruppe("demnaechst", "Demnächst", lage.demnaechst, "Nichts geplant. Neue Aufgabe oben anlegen.")}
      </div>
    </div>
  );
}
