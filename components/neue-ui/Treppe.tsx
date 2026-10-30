"use client";

/* Die Treppe: vier Stufen, jede klickbar. Der Umschalter "Ich bin …" hebt
   die empfohlene Einstiegsstufe hervor, sperrt aber nichts; für Gründer
   zeigt er statt einer Stufe den Hinweis auf die Regalfront S. "Diese Stufe
   anfragen" belegt im Formular den Einstieg vor (Event EINSTIEG_EVENT). */

import { useState } from "react";
import { SHOW_BAFA } from "@/lib/site-flags";
import {
  ALLE_STUFEN,
  EINSTIEG_EVENT,
  NACH_JEDER_STUFE,
  NUR_NEUPRODUKTE,
  STUFEN,
  ZIELGRUPPEN,
  einstiegFuerStufe,
  type StufeKey,
  type ZielgruppeKey,
} from "@/lib/treppe";

export default function Treppe() {
  const [gruppe, setGruppe] = useState<ZielgruppeKey | null>(null);
  const [aktiv, setAktiv] = useState<StufeKey>("beweisen");

  const einstieg = gruppe ? ZIELGRUPPEN[gruppe].einstieg : null;
  const i = STUFEN.findIndex((s) => s.key === aktiv);
  const s = STUFEN[i];
  const vorher = i > 0 ? STUFEN[i - 1] : null;

  function waehleGruppe(g: ZielgruppeKey) {
    const neu = gruppe === g ? null : g;
    setGruppe(neu);
    const ziel = neu ? ZIELGRUPPEN[neu].einstieg : null;
    if (ziel) setAktiv(ziel);
  }

  function anfragen() {
    window.dispatchEvent(new CustomEvent(EINSTIEG_EVENT, { detail: einstiegFuerStufe(s.key) }));
    document.getElementById("bewerben")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="stair">
      <div className="stair__who" role="group" aria-label="Wer bist du?">
        <span className="stair__who-k">Ich bin</span>
        {(Object.keys(ZIELGRUPPEN) as ZielgruppeKey[]).map((g) => (
          <button
            key={g}
            type="button"
            className="stair__chip"
            aria-pressed={gruppe === g}
            onClick={() => waehleGruppe(g)}
          >
            {ZIELGRUPPEN[g].label}
          </button>
        ))}
      </div>

      {gruppe && ZIELGRUPPEN[gruppe].hinweis && <p className="stair__hinweis">{ZIELGRUPPEN[gruppe].hinweis}</p>}

      <ol className="stair__steps" aria-label="Die vier Stufen">
        {STUFEN.map((st) => {
          const istEinstieg = einstieg === st.key;
          /* Ohne Einstiegsstufe (Gründer) wird keine Stufe hervorgehoben. */
          const passt = !!gruppe && !!einstieg && !istEinstieg && st.zielgruppen.includes(gruppe);
          return (
            <li key={st.key} style={{ "--n": st.nr } as React.CSSProperties}>
              <button
                type="button"
                className="stair__step"
                aria-pressed={aktiv === st.key}
                data-rec={istEinstieg ? "1" : passt ? "2" : undefined}
                onClick={() => setAktiv(st.key)}
              >
                <span className="stair__tread" aria-hidden="true" />
                <span className="stair__txt">
                  <span className="stair__nr">Stufe {st.nr}</span>
                  <span className="stair__name">{st.name}</span>
                  <span className="stair__meta">{st.dauer}</span>
                  {istEinstieg && <span className="stair__rec">Dein Einstieg</span>}
                  {passt && <span className="stair__rec stair__rec--soft">Passt auch</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="stair__detail" aria-live="polite">
        <div className="stair__head">
          <p className="eyebrow">
            Stufe {s.nr} · {s.dauer}
          </p>
          <h3>{s.name}</h3>
          <p className="stair__q">{s.frage}</p>
        </div>

        <div className="rows">
          <div className="row">
            <span className="row__k">Empfohlen für</span>
            <span className="row__v">{s.empfohlenFuer}</span>
          </div>
        </div>


        <div className="stair__lists">
          <div>
            <p className="stair__lk">
              {vorher ? `Kommt gegenüber Stufe ${vorher.nr} dazu` : "Drin in Stufe 1"}
            </p>
            <ul className="stair__ul">
              {s.neu.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="stair__lk">In jeder Stufe</p>
            <ul className="stair__ul stair__ul--base">
              {ALLE_STUFEN.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card__foot">
          <button type="button" className="btn btn--solid" onClick={anfragen}>
            Stufe {s.nr} anfragen
          </button>
          {SHOW_BAFA && s.beratung && (
            <a className="stair__bafa" href="#beratung">
              Beratung dazu kann gefördert werden →
            </a>
          )}
        </div>
      </div>

      <p className="stair__after">{NACH_JEDER_STUFE}</p>
      <p className="fineprint">{NUR_NEUPRODUKTE}</p>
    </div>
  );
}
