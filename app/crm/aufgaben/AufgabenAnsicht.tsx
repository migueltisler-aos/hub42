"use client";

import { useState, useTransition } from "react";
import { BarChart3, Check, ChevronDown, ExternalLink, FileText, Pencil, Plus, RotateCcw, Search, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { AllgemeineAufgabe, AufgabenDaten, Bereich, ErledigteAufgabe, Nachweis, Person, Stimme } from "@/lib/crm-heute-model";
import { aufgabeErledigt, aufgabeStimmen } from "../actions";
import AufgabeFormular from "../_components/AufgabeFormular";
import ErledigtFormular from "../_components/ErledigtFormular";
import DateiKnopf from "./DateiKnopf";
import Projekte from "./Projekte";
import { UmfrageBlock, UmfrageFormular } from "./Umfrage";

const ZEIT = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});
import {
  PERSONEN,
  gruppiere,
  kurzDatum,
  langDatum,
  nachStimmen,
  passtZurSuche,
  punkte,
  tageSeit,
  vorschlagFuer,
  type Wer,
} from "../logik";

const WAHL: Wer[] = [...PERSONEN, "Alle"];

/** Erledigte Aufgaben mit Nachweis, zuletzt Erledigtes zuerst. Eingeklappt bis zum Klick.
    Ein Tipp auf den Titel öffnet die Aufgabe ganz: Link, Dateien, Umfrage, Zurückholen. */
function Historie({
  liste,
  offen,
  umschalten,
  ich,
}: {
  liste: ErledigteAufgabe[];
  offen: boolean;
  umschalten: () => void;
  ich: Person;
}) {
  const sichtbar = offen ? liste : liste.slice(0, 5);
  const [auf, setAuf] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const zurueckholen = (id: string) =>
    starte(async () => {
      const r = await aufgabeErledigt(id, false);
      setFehler(r.ok ? null : (r.fehler ?? "Zurückholen ist fehlgeschlagen."));
      if (r.ok) setAuf(null);
    });
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
          {sichtbar.map((h) => {
            const an = auf === h.id;
            const extra = [h.aufgabeLink && "Link", h.dateien.length > 0 && `${h.dateien.length} ${h.dateien.length === 1 ? "Datei" : "Dateien"}`, h.umfrage && "Umfrage"].filter(Boolean);
            return (
            <li key={h.id} className="historie__eintrag" data-offen={an || undefined}>
              <button
                type="button"
                className="historie__kopf"
                aria-expanded={an}
                aria-controls={`historie-${h.id}`}
                onClick={() => {
                  setFehler(null);
                  setAuf(an ? null : h.id);
                }}
              >
                <span className="historie__titel">{h.titel}</span>
                {extra.length > 0 && !an && <span className="historie__extra">{extra.join(" · ")}</span>}
                <ChevronDown aria-hidden="true" className="historie__pfeil" />
              </button>
              <p className="historie__meta">
                {ZEIT.format(new Date(h.erledigtAm))} · {h.erledigtVon ?? h.verantwortlich}
                {h.marke && ` · ${h.marke}`}
                {h.projekt && ` · ${h.projekt}`}
                {h.bereich && ` · ${h.bereich}`}
              </p>
              {h.notiz && <p className="historie__notiz">{h.notiz}</p>}
              {h.link && (
                <a className="historie__link" href={h.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" />
                  {linkName(h.link)}
                </a>
              )}
              {an && (
                <div className="historie__details" id={`historie-${h.id}`}>
                  {h.aufgabeLink && h.aufgabeLink !== h.link && (
                    <a className="historie__link" href={h.aufgabeLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden="true" />
                      {linkName(h.aufgabeLink)}
                    </a>
                  )}
                  {h.dateien.map((d) => (
                    <a key={d.id} className="historie__link" href={d.link} target="_blank" rel="noopener noreferrer">
                      <FileText aria-hidden="true" />
                      {d.name}
                    </a>
                  ))}
                  {h.umfrage && <UmfrageBlock umfrage={h.umfrage} ich={ich} nurLesen />}
                  {!h.notiz && !h.link && extra.length === 0 && (
                    <p className="historie__leer">Ohne Notiz, Link oder Datei erledigt.</p>
                  )}
                  <p className="historie__knoepfe">
                    <button type="button" className="knopf knopf--klein" disabled={laeuft} onClick={() => zurueckholen(h.id)}>
                      <RotateCcw aria-hidden="true" />
                      {laeuft ? "Holt zurück…" : "Wieder öffnen"}
                    </button>
                    {fehler && (
                      <span className="formular__fehler" role="alert">
                        {fehler}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </li>
            );
          })}
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
  // Stimmen wirken sofort wie die Haken; schlägt das Speichern fehl, gilt wieder der alte Stand.
  const [stimmen, setStimmen] = useState<Record<string, Stimme[]>>({});
  const [suche, setSuche] = useState("");
  const sucht = suche.trim().length > 0;
  const [projekt, setProjekt] = useState<string | null>(null);
  const [umfrageNeu, setUmfrageNeu] = useState<string | null>(null);
  const projektName = new Map(daten.projekte.map((p) => [p.id, p.titel]));
  const offeneProjekte = daten.projekte.filter((p) => !p.abgeschlossen);

  // Die Suche geht über alle Personen, sonst fände man fremde Aufgaben nicht.
  const mitStimmen = daten.aufgaben.map((a) => ({ ...a, stimmen: stimmen[a.id] ?? a.stimmen }));
  // Suche und Projektfilter gehen über alle Personen, sonst fände man fremde Aufgaben nicht.
  const ueberAlle = sucht || projekt !== null;
  const treffer = mitStimmen.filter(
    (a) =>
      (projekt === null || a.projektId === projekt) &&
      (!sucht ||
        passtZurSuche(
          { ...a, notiz: [a.projektId && projektName.get(a.projektId), a.umfrage?.frage, ...a.dateien.map((d) => d.name)].filter(Boolean).join(" ") },
          suche
        ))
  );
  const roh = gruppiere(treffer, HEUTE, ueberAlle ? "Alle" : wer, erledigt);
  const lage = { ueberfaellig: nachStimmen(roh.ueberfaellig), heute: nachStimmen(roh.heute), demnaechst: nachStimmen(roh.demnaechst) };
  const alle = wer === "Alle" || ueberAlle;
  const projektTitel = projekt ? (projektName.get(projekt) ?? null) : null;
  const historie = daten.historie.filter((h) =>
    projektTitel !== null
      ? h.projekt === projektTitel && (!sucht || passtZurSuche(h, suche))
      : sucht
        ? passtZurSuche(
            {
              ...h,
              notiz: [h.notiz, h.projekt, h.marke, h.aufgabeLink, h.umfrage?.frage, ...h.dateien.map((d) => d.name)]
                .filter(Boolean)
                .join(" "),
            },
            suche
          )
        : wer === "Alle" || h.verantwortlich === wer || h.erledigtVon === wer
  );

  // Vorschlag aus der Historie (wer hat Ähnliches erledigt) und der offenen Last.
  const erfahrung = daten.historie.map((h) => ({
    titel: h.titel,
    bereich: h.bereich,
    wer: (PERSONEN as readonly string[]).includes(h.erledigtVon ?? "") ? (h.erledigtVon as Person) : h.verantwortlich,
  }));
  const offeneAufgaben = daten.aufgaben.filter((a) => !a.erledigt);
  const vorschlag = (titel: string, bereich: Bereich | null) => vorschlagFuer(titel, bereich, erfahrung, offeneAufgaben);

  const stimmeVon = (a: AllgemeineAufgabe) => a.stimmen.find((x) => x.wer === ich)?.wert ?? 0;
  const abstimmen = (a: AllgemeineAufgabe, wert: 1 | -1) => {
    const alt = a.stimmen;
    const neuWert = stimmeVon(a) === wert ? 0 : wert;
    const neu = alt.filter((x) => x.wer !== ich).concat(neuWert === 0 ? [] : [{ wer: ich, wert: neuWert }]);
    setStimmen((s) => ({ ...s, [a.id]: neu }));
    starte(async () => {
      const r = await aufgabeStimmen(a.id, neuWert);
      if (!r.ok) setStimmen((s) => ({ ...s, [a.id]: alt }));
    });
  };

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
    <AufgabeFormular
      aufgabe={aufgabe}
      heute={HEUTE}
      ich={wer === "Alle" ? ich : wer}
      fertig={schliessen}
      vorschlag={vorschlag}
      projekte={offeneProjekte.concat(daten.projekte.filter((p) => p.abgeschlossen && p.id === aufgabe?.projektId))}
      projekt={projekt}
    />
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
    const wartende = a.stimmen.filter((x) => x.wert === 1).map((x) => x.wer);
    const unwichtig = a.stimmen.filter((x) => x.wert === -1).map((x) => x.wer);
    const meine = stimmeVon(a);
    return (
      <li
        key={a.id}
        className="zeile zeile--leiste"
        data-erledigt={done || undefined}
        data-unwichtig={(!done && punkte(a.stimmen) < 0) || undefined}
      >
        <label className="zeile__griff">
          <input type="checkbox" className="haken" checked={done} onChange={() => umschalten(a)} />
          <span className="haken__bild" aria-hidden="true">
            <Check strokeWidth={3} />
          </span>
          <span className="zeile__text">
            <span className="zeile__titel">{a.titel}</span>
            {(alle || a.bereich || (a.projektId && !projekt)) && (
              <span className="zeile__meta">
                {alle && <span className="person">{a.verantwortlich}</span>}
                {a.projektId && !projekt && <span className="zeile__projekt">{projektName.get(a.projektId)}</span>}
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
        <div className="leiste">
          {a.link && (
            <a className="leiste__link" href={a.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              {linkName(a.link)}
            </a>
          )}
          {a.dateien.map((d) => (
            <a key={d.id} className="leiste__link" href={d.link} target="_blank" rel="noopener noreferrer">
              <FileText aria-hidden="true" />
              {d.name}
            </a>
          ))}
          <button
            type="button"
            className="leiste__stimme"
            aria-pressed={meine === 1}
            aria-label={`Ich warte drauf${wartende.length ? `, es warten ${wartende.join(", ")}` : ""}`}
            onClick={() => abstimmen(a, 1)}
            disabled={done}
          >
            <ThumbsUp aria-hidden="true" />
            {wartende.length > 0 && <span>{wartende.length}</span>}
          </button>
          <button
            type="button"
            className="leiste__stimme"
            aria-pressed={meine === -1}
            aria-label={`Unwichtig${unwichtig.length ? `, finden ${unwichtig.join(", ")}` : ""}`}
            onClick={() => abstimmen(a, -1)}
            disabled={done}
          >
            <ThumbsDown aria-hidden="true" />
            {unwichtig.length > 0 && <span>{unwichtig.length}</span>}
          </button>
          {daten.drive && !done && <DateiKnopf aufgabeId={a.id} titel={a.titel} />}
          {!a.umfrage && !done && (
            <button
              type="button"
              className="leiste__stimme"
              aria-label={`Umfrage zu ${a.titel} starten`}
              aria-expanded={umfrageNeu === a.id}
              onClick={() => setUmfrageNeu((u) => (u === a.id ? null : a.id))}
            >
              <BarChart3 aria-hidden="true" />
            </button>
          )}
          {wartende.length > 0 && <span className="leiste__wer">wartet: {wartende.join(", ")}</span>}
        </div>
        {umfrageNeu === a.id && !a.umfrage && (
          <div className="zeile__unten">
            <UmfrageFormular aufgabeId={a.id} fertig={() => setUmfrageNeu(null)} />
          </div>
        )}
        {a.umfrage && (
          <div className="zeile__unten">
            <UmfrageBlock umfrage={a.umfrage} ich={ich} />
          </div>
        )}
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

      <Projekte projekte={daten.projekte} gewaehlt={projekt} waehlen={setProjekt} ich={ich} heute={HEUTE} />

      <div className="suche" role="search">
        <Search className="suche__lupe" aria-hidden="true" />
        <input
          type="search"
          className="suche__eingabe"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suchen: Titel, Link, Person, Bereich"
          aria-label="Aufgaben durchsuchen"
          enterKeyHint="search"
        />
        {sucht && (
          <button type="button" className="suche__leeren" aria-label="Suche leeren" onClick={() => setSuche("")}>
            <X aria-hidden="true" />
          </button>
        )}
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
          liste={historie}
          offen={historieOffen || sucht}
          umschalten={() => setHistorieOffen((o) => !o)}
          ich={ich}
        />
      </div>
    </div>
  );
}
