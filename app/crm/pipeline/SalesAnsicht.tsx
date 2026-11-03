"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import {
  SLA_TEXT,
  type Aufgabe,
  type HeuteDaten,
  type MeilensteinFaellig,
  type Person as PersonName,
  type SlaVerstoss,
} from "@/lib/crm-heute-model";
import { aufgabeErledigt } from "../actions";
import AufgabeFormular from "../_components/AufgabeFormular";
import {
  PERSONEN,
  SLA_ROT,
  SLA_WORT,
  kurzDatum,
  lageFuer,
  langDatum,
  tageSeit,
  type Wer,
} from "../logik";

const WAHL: Wer[] = [...PERSONEN, "Alle"];

const tage = (n: number) => (n === 1 ? "Tag" : "Tage");

/* Rule kein-wort-allein: die letzten beiden Wörter hängen zusammen, sobald
   ein Satz drei Wörter oder mehr hat. Der Wortlaut bleibt, nur das
   Leerzeichen wird geschützt. */
const NBSP = String.fromCharCode(0xa0);
const klebe = (s: string) => (s.trim().split(/\s+/).length >= 3 ? s.replace(/ (\S+)$/, `${NBSP}$1`) : s);

/** Pipeline-Dashboard: Trichter (`oben`), Sales-Aufgaben mit SLA, Kundenliste (`unten`). */
export default function SalesAnsicht({
  start,
  ich,
  daten,
  oben,
  unten,
}: {
  start: Wer;
  ich: PersonName;
  daten: HeuteDaten;
  oben?: React.ReactNode;
  unten?: React.ReactNode;
}) {
  const HEUTE = daten.heute;
  const [wer, setWer] = useState<Wer>(start);
  // Höchstens ein Formular offen: neu anlegen oder genau eine Aufgabe ändern.
  const [neu, setNeu] = useState(false);
  const [bearbeite, setBearbeite] = useState<string | null>(null);
  const formular = (aufgabe?: Aufgabe) => (
    <AufgabeFormular
      aufgabe={aufgabe}
      marken={daten.marken}
      heute={HEUTE}
      ich={wer === "Alle" ? ich : wer}
      fertig={() => {
        setNeu(false);
        setBearbeite(null);
      }}
    />
  );
  // Haken wirken sofort; schlägt das Speichern fehl, springt der Haken zurück.
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});
  const [, starte] = useTransition();
  const lage = lageFuer(daten, wer, erledigt);
  const alle = wer === "Alle";

  /** „heute“, „morgen“, „Di 03.11.“ oder „ohne Datum“ */
  const wann = (iso: string | null) => {
    if (iso === null) return "ohne Datum";
    const t = tageSeit(iso, HEUTE);
    if (t === 0) return "heute";
    if (t === -1) return "morgen";
    return kurzDatum(iso);
  };

  const fertig = (a: Aufgabe) => erledigt[a.id] ?? a.erledigt;
  const offen = (liste: Aufgabe[]) => liste.filter((a) => !fertig(a)).length;
  const umschalten = (a: Aufgabe) => {
    const neu = !fertig(a);
    setErledigt((e) => ({ ...e, [a.id]: neu }));
    starte(async () => {
      const { ok } = await aufgabeErledigt(a.id, neu);
      if (!ok) setErledigt((e) => ({ ...e, [a.id]: !neu }));
    });
  };

  function waehlen(w: Wer) {
    setWer(w);
    window.history.replaceState(null, "", `?wer=${encodeURIComponent(w)}`);
  }

  const nOffenUeber = offen(lage.ueberfaellig);
  const nOffenHeute = offen(lage.heute);
  const nichtsFaellig =
    lage.ueberfaellig.length + lage.heute.length + lage.sla.length + lage.meilensteine.length === 0;

  const zeileAufgabe = (a: Aufgabe, rechts: "zeit" | "datum" | "nichts") => {
    const done = fertig(a);
    const t = a.faellig === null ? 0 : tageSeit(a.faellig, HEUTE);
    if (bearbeite === a.id) {
      return (
        <li key={a.id} className="zeile zeile--formular">
          {formular(a)}
        </li>
      );
    }
    return (
      <li key={a.id} className="zeile" data-erledigt={done || undefined}>
        <label className="zeile__griff">
          <input type="checkbox" className="haken" checked={done} onChange={() => umschalten(a)} />
          <span className="haken__bild" aria-hidden="true">
            <Check strokeWidth={3} />
          </span>
          <span className="zeile__text">
            <span className="zeile__titel">{klebe(a.titel)}</span>
            <span className="zeile__meta">
              <Name text={a.brand.name} person={alle ? a.verantwortlich : undefined} />
              {NBSP}<span className="stufe">{a.brand.stufe}</span>
              {rechts === "datum" && <InnenDatum text={wann(a.faellig)} />}
            </span>
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
        {done ? (
          <span className="zeile__status">erledigt</span>
        ) : rechts === "zeit" ? (
          <Zeit n={t} art="voll" text={`seit ${t} ${t === 1 ? "Tag" : "Tagen"} überfällig`} />
        ) : rechts === "datum" ? (
          <span className="zeile__datum zeile__datum--rechts">{wann(a.faellig)}</span>
        ) : null}
      </li>
    );
  };

  const zeileSla = (s: SlaVerstoss) => {
    const rot = SLA_ROT.includes(s.art);
    const wort = SLA_WORT[s.art];
    return (
      <li key={s.id} className="zeile zeile--ohne-haken">
        <span className="zeile__griff">
          <span className="zeile__marke" aria-hidden="true" />
          <span className="zeile__text">
            <span className="zeile__titel">
              <span className="name">{s.brand.name}</span>{" "}
              <span className="stufe">
                {s.brand.stufe}
                {wort && <span className="wort">{NBSP}{wort}</span>}
              </span>
            </span>
            <span className="zeile__meta">
              {alle && <Person name={s.besitzer} />}
              {klebe(SLA_TEXT[s.art])}
            </span>
          </span>
        </span>
        <Zeit
          n={s.seit_tagen}
          art={rot ? "voll" : "umriss"}
          text={`seit ${s.seit_tagen} ${s.seit_tagen === 1 ? "Tag" : "Tagen"}`}
        />
      </li>
    );
  };

  const zeileMeilenstein = (m: MeilensteinFaellig) => (
    <li key={m.id} className="zeile zeile--ohne-haken">
      <span className="zeile__griff">
        <span className="zeile__marke" aria-hidden="true" />
        <span className="zeile__text">
          <span className="zeile__titel">{klebe(m.titel)}</span>
          <span className="zeile__meta">
            <Name text={m.projekt} person={alle ? m.verantwortlich : undefined} />
            <InnenDatum text={wann(m.faellig)} />
          </span>
        </span>
      </span>
      <span className="zeile__datum zeile__datum--rechts">{wann(m.faellig)}</span>
    </li>
  );

  const demnaechst = (
    <Regal id="demnaechst" titel="Demnächst" zahl={lage.demnaechst.length} leise>
      {lage.demnaechst.length ? (
        <ul className="regal__liste">{lage.demnaechst.map((a) => zeileAufgabe(a, "datum"))}</ul>
      ) : (
        <p className="regal__leer">Nichts in den nächsten Tagen.</p>
      )}
    </Regal>
  );

  const naechste = lage.demnaechst[0];

  return (
    <div className="heute">
      <div className="heute__kopf">
        <div>
          <h1 className="satz satz--h1">
            Pipeline
            <sup className="satz__zahl">
              <span className="sr-only">, </span>
              {kurzDatum(HEUTE)}
            </sup>
          </h1>
          <p className="heute__zeile">
            <span className="sr-only">{langDatum(HEUTE)}. </span>
            {nichtsFaellig ? (
              "nichts fällig"
            ) : (
              <>
                {nOffenUeber}&nbsp;überfällig · {nOffenHeute}&nbsp;heute&nbsp;offen · {lage.sla.length}&nbsp;SLA-Verstöße
              </>
            )}
          </p>
        </div>

        <div className="heute__aktionen">
          <div className="wahl" role="group" aria-label="Aufgaben von">
            {WAHL.map((w) => (
              <button
                key={w}
                type="button"
                className="wahl__knopf"
                aria-pressed={wer === w}
                onClick={() => waehlen(w)}
              >
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
            Sales-Aufgabe
          </button>
        </div>
      </div>

      {oben}

      {neu && <section className="regal regal--formular" aria-label="Neue Sales-Aufgabe">{formular()}</section>}

      {nichtsFaellig ? (
        <div className="heute__raster heute__raster--leer">
          <section className="regal regal--leer" aria-labelledby="leer-titel">
            <p id="leer-titel" className="leer__satz">
              {`Für${NBSP}${wer} ist heute nichts${NBSP}fällig.`}
            </p>
            {naechste && (
              <p className="leer__weiter">
                Nächste Aufgabe {wann(naechste.faellig)}: {naechste.titel},{" "}
                <span className="name">{naechste.brand.name}</span>
              </p>
            )}
          </section>
          {demnaechst}
        </div>
      ) : (
        <div className="heute__raster">
          <div className="heute__haupt">
            <Regal id="ueberfaellig" titel="Überfällig" zahl={nOffenUeber}>
              {lage.ueberfaellig.length ? (
                <ul className="regal__liste">{lage.ueberfaellig.map((a) => zeileAufgabe(a, "zeit"))}</ul>
              ) : (
                <p className="regal__leer">Nichts überfällig.</p>
              )}
            </Regal>
            <Regal id="heute" titel="Heute" zahl={nOffenHeute}>
              {lage.heute.length ? (
                <ul className="regal__liste">{lage.heute.map((a) => zeileAufgabe(a, "nichts"))}</ul>
              ) : (
                <p className="regal__leer">Heute ist nichts fällig.</p>
              )}
            </Regal>
          </div>

          <div className="heute__seite">
            <Regal id="sla" titel="SLA-Verstöße" zahl={lage.sla.length}>
              {lage.sla.length ? (
                <ul className="regal__liste">{lage.sla.map(zeileSla)}</ul>
              ) : (
                <p className="regal__leer">Keine SLA-Verstöße.</p>
              )}
            </Regal>
            <Regal id="meilensteine" titel="Meilensteine" zahl={lage.meilensteine.length}>
              {lage.meilensteine.length ? (
                <ul className="regal__liste">{lage.meilensteine.map(zeileMeilenstein)}</ul>
              ) : (
                <p className="regal__leer">Keine Meilensteine fällig.</p>
              )}
            </Regal>
          </div>

          <div className="heute__unten">{demnaechst}</div>
        </div>
      )}

      {unten}
    </div>
  );
}

function Regal({
  id,
  titel,
  zahl,
  leise,
  children,
}: {
  id: string;
  titel: string;
  zahl: number;
  leise?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="regal" data-leise={leise || undefined} aria-labelledby={`${id}-titel`}>
      <h2 id={`${id}-titel`} className="satz satz--h2">
        {titel}
        <sup className="satz__zahl">
          <span className="sr-only">, </span>
          {zahl}
          <span className="sr-only"> offen</span>
        </sup>
      </h2>
      {children}
    </section>
  );
}

/** Datum in der Metazeile: nur schmal sichtbar, dort gibt es keine rechte Spalte
    (CSS schaltet per display, also liest ein Screenreader nur eine Fassung). */
function InnenDatum({ text }: { text: string }) {
  return (
    <span className="zeile__datum zeile__datum--innen">
      {" · "}
      {text}
    </span>
  );
}

/** Besitzer in der Ansicht „Alle“: ein kleines Etikett vorn in der Metazeile. */
function Person({ name }: { name: string }) {
  return (
    <>
      <span className="person">{name}</span>
      <span className="sr-only">: </span>
    </>
  );
}

/** Markenname, in „Alle“ mit Besitzer-Etikett davor. Das Etikett hängt am
    ersten Wort, damit es nie allein in einer Zeile steht. */
function Name({ text, person }: { text: string; person?: string }) {
  if (!person) return <span className="name">{text}</span>;
  const [erstes, ...rest] = text.split(" ");
  return (
    <span className="name name--mit-person">
      <span className="paar">
        <Person name={person} />
        {erstes}
      </span>
      {rest.length > 0 && ` ${rest.join(NBSP)}`}
    </span>
  );
}

/** Zeit-Etikett: die Zahl groß, die Einheit hochgestellt mit Cent-Strich. */
function Zeit({ n, art, text }: { n: number; art: "voll" | "umriss"; text: string }) {
  return (
    <span className="zeit" data-art={art}>
      <span className="sr-only">{text}</span>
      <span className="zeit__n" aria-hidden="true">
        {n}
      </span>
      <span className="zeit__e" aria-hidden="true">
        {tage(n)}
      </span>
    </span>
  );
}
