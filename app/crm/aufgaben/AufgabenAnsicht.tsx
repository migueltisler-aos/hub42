"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Pencil, Plus } from "lucide-react";
import type { AllgemeineAufgabe, AufgabenDaten, ErledigteAufgabe, Nachweis, Person } from "@/lib/crm-heute-model";
import { aufgabeErledigt } from "../actions";
import AufgabeFormular from "../_components/AufgabeFormular";
import ErledigtFormular from "../_components/ErledigtFormular";

const ZEIT = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});
import { PERSONEN, gruppiere, kurzDatum, langDatum, tageSeit, type Wer } from "../logik";

const WAHL: Wer[] = [...PERSONEN, "Alle"];

/** Erledigte Aufgaben mit Nachweis, zuletzt Erledigtes zuerst. Eingeklappt bis zum Klick. */
function Historie({ liste, offen, umschalten }: { liste: ErledigteAufgabe[]; offen: boolean; umschalten: () => void }) {
  const sichtbar = offen ? liste : liste.slice(0, 5);
  return (
    <section className="regal" aria-labelledby="historie-titel">
      <h2 id="historie-titel" className="satz satz--h2">
        Erledigt
        <sup className="satz__zahl">
          <span className="sr-only">, </span>
          {liste.length}
        </sup>
      </h2>
      {liste.length === 0 ? (
        <p className="regal__leer">Noch nichts erledigt.</p>
      ) : (
        <ol className="historie">
          {sichtbar.map((h) => (
            <li key={h.id} className="historie__eintrag">
              <p className="historie__titel">{h.titel}</p>
              <p className="historie__meta">
                {ZEIT.format(new Date(h.erledigtAm))} · {h.erledigtVon ?? h.verantwortlich}
                {h.marke && ` · ${h.marke}`}
                {h.bereich && ` · ${h.bereich}`}
              </p>
              {h.notiz && <p className="historie__notiz">{h.notiz}</p>}
              {h.link && (
                <a className="historie__link" href={h.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" />
                  {linkName(h.link)}
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
      {liste.length > 5 && (
        <p className="historie__mehr">
          <button type="button" className="knopf" onClick={umschalten} aria-expanded={offen}>
            {offen ? "Weniger zeigen" : `Alle ${liste.length} zeigen`}
          </button>
        </p>
      )}
    </section>
  );
}

/** „Google Drive“ statt der langen Adresse, sonst der Host. */
function linkName(href: string) {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    if (host === "drive.google.com") return "Google Drive";
    if (host === "docs.google.com") return "Google Docs";
    return host;
  } catch {
    return "Link";
  }
}

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

  // Abhaken öffnet erst den Nachweis; Zurücknehmen wirkt sofort.
  const [abschluss, setAbschluss] = useState<string | null>(null);
  const [historieOffen, setHistorieOffen] = useState(false);

  const fertig = (a: AllgemeineAufgabe) => erledigt[a.id] ?? a.erledigt;
  const offen = (liste: AllgemeineAufgabe[]) => liste.filter((a) => !fertig(a)).length;
  const umschalten = (a: AllgemeineAufgabe) => {
    if (!fertig(a)) {
      setNeu(false);
      setBearbeite(null);
      setAbschluss(a.id);
      return;
    }
    setErledigt((e) => ({ ...e, [a.id]: false }));
    starte(async () => {
      const { ok } = await aufgabeErledigt(a.id, false);
      if (!ok) setErledigt((e) => ({ ...e, [a.id]: true }));
    });
  };
  const abschliessen = (a: AllgemeineAufgabe) => async (n: Nachweis) => {
    const r = await aufgabeErledigt(a.id, true, n);
    if (r.ok) {
      setErledigt((e) => ({ ...e, [a.id]: true }));
      setAbschluss(null);
    }
    return r;
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
    if (abschluss === a.id) {
      return (
        <li key={a.id} className="zeile zeile--formular">
          <ErledigtFormular titel={a.titel} abschliessen={abschliessen(a)} abbrechen={() => setAbschluss(null)} />
        </li>
      );
    }
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
        <Historie
          liste={daten.historie.filter((h) => wer === "Alle" || h.verantwortlich === wer || h.erledigtVon === wer)}
          offen={historieOffen}
          umschalten={() => setHistorieOffen((o) => !o)}
        />
      </div>
    </div>
  );
}
