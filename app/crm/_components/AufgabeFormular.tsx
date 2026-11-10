"use client";

import { useDeferredValue, useEffect, useId, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Mic, Sparkles } from "lucide-react";
import { BEREICHE, PERSONEN, type Bereich, type Person } from "@/lib/crm-heute-model";
import { aufgabeAendern, aufgabeAnlegen } from "../actions";
import type { Vorschlag } from "../logik";

/* Diktat über die Web Speech API (Chrome, Safari). Fehlt sie, bleibt das
   Mikrofon der Handy-Tastatur. Eigene Typen, TypeScript kennt die API nicht. */
type Erkennung = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type ErkennungKlasse = new () => Erkennung;
const keinAbo = () => () => {};
function erkennungKlasse(): ErkennungKlasse | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: ErkennungKlasse; webkitSpeechRecognition?: ErkennungKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Was das Formular von einer bestehenden Aufgabe braucht. */
export type Vorlage = {
  id: string;
  titel: string;
  faellig: string | null;
  verantwortlich: Person;
  brand?: { name: string };
  bereich?: Bereich | null;
  link?: string | null;
  projektId?: string | null;
};

/** Anlegen (ohne `aufgabe`) oder Ändern. `marken` gesetzt: Sales-Aufgabe mit
    Marke; sonst allgemeine Aufgabe mit Bereich. */
export default function AufgabeFormular({
  aufgabe,
  marken,
  heute,
  ich,
  fertig,
  vorschlag,
  projekte,
  projekt,
}: {
  aufgabe?: Vorlage;
  marken?: { id: string; name: string }[];
  heute: string;
  ich: Person;
  fertig: () => void;
  /** Nur beim Anlegen: schlägt vor, wer übernimmt. */
  vorschlag?: (titel: string, bereich: Bereich | null) => Vorschlag | null;
  /** Offene Projekte zur Auswahl; nur allgemeine Aufgaben. */
  projekte?: { id: string; titel: string }[];
  /** Vorauswahl beim Anlegen, wenn die Liste auf ein Projekt gefiltert ist. */
  projekt?: string | null;
}) {
  const id = useId();
  const mitMarke = marken !== undefined;
  const [titel, setTitel] = useState(aufgabe?.titel ?? "");
  const [marke, setMarke] = useState(aufgabe?.brand?.name ?? "");
  const [bereich, setBereich] = useState<Bereich | "">(aufgabe?.bereich ?? "");
  const [frist, setFrist] = useState(aufgabe ? (aufgabe.faellig ?? "") : heute);
  const [wer, setWer] = useState<Person>(aufgabe?.verantwortlich ?? ich);
  const [link, setLink] = useState(aufgabe?.link ?? "");
  const [projektId, setProjektId] = useState(aufgabe ? (aufgabe.projektId ?? "") : (projekt ?? ""));
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  // Vorschlag rechnet auf dem verzögerten Titel, damit das Tippen flüssig bleibt.
  const titelRuhig = useDeferredValue(titel);
  const tipp = !aufgabe && vorschlag ? vorschlag(titelRuhig, bereich || null) : null;

  // Diktat: auf dem Server immer aus, im Browser je nach API, ohne Abweichung beim Hydrieren.
  const kannDiktat = useSyncExternalStore(
    keinAbo,
    () => erkennungKlasse() !== null,
    () => false
  );
  const [hoert, setHoert] = useState(false);
  const erkennung = useRef<Erkennung | null>(null);
  useEffect(() => () => erkennung.current?.stop(), []);
  function diktieren() {
    if (hoert) {
      erkennung.current?.stop();
      return;
    }
    const Klasse = erkennungKlasse();
    if (!Klasse) return;
    const e = new Klasse();
    e.lang = "de-DE";
    e.interimResults = false;
    e.onresult = (ev) => {
      const text = Array.from(ev.results, (r) => r[0]?.transcript ?? "").join(" ").trim();
      if (text) setTitel((t) => (t.trim() ? `${t.trim()} ${text}` : text).slice(0, 200));
    };
    e.onend = () => setHoert(false);
    e.onerror = () => setHoert(false);
    erkennung.current = e;
    setHoert(true);
    e.start();
  }

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
    const eingabe = {
      titel,
      brandId,
      bereich: mitMarke ? null : bereich || null,
      faellig: frist || null,
      wer,
      // Sales-Aufgaben zeigen kein Linkfeld, ihr Link bleibt unberührt.
      ...(!mitMarke && { link: link.trim() || null }),
      ...(!mitMarke && projekte && { projektId: projektId || null }),
    };
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
        <span className="formular__zeile">
          <input
            className="formular__eingabe"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            required
            maxLength={200}
            autoFocus
            enterKeyHint="done"
            placeholder={mitMarke ? "Was ist zu tun?" : "z. B. Umsatzsteuer abgeben"}
          />
          {kannDiktat && (
            <button
              type="button"
              className="formular__mikro"
              aria-pressed={hoert}
              aria-label={hoert ? "Diktat beenden" : "Aufgabe diktieren"}
              onClick={diktieren}
            >
              <Mic aria-hidden="true" />
            </button>
          )}
        </span>
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
      {!mitMarke && (
        <label className="formular__feld formular__feld--breit">
          <span className="formular__label">Link</span>
          <input
            className="formular__eingabe"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            maxLength={1000}
            autoComplete="off"
            placeholder="https:// (Drive, Mail, Seite), optional"
          />
        </label>
      )}
      {!mitMarke && projekte && projekte.length > 0 && (
        <label className="formular__feld">
          <span className="formular__label">Projekt</span>
          <select className="formular__eingabe" value={projektId} onChange={(e) => setProjektId(e.target.value)}>
            <option value="">ohne</option>
            {projekte.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titel}
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
      {tipp && tipp.wer !== wer && (
        <p className="formular__tipp">
          <Sparkles aria-hidden="true" />
          <span>
            Vorschlag: <strong>{tipp.wer}</strong> <span className="formular__grund">({tipp.grund})</span>
          </span>
          <button type="button" className="knopf knopf--klein" onClick={() => setWer(tipp.wer)}>
            Übernehmen
          </button>
        </p>
      )}
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
