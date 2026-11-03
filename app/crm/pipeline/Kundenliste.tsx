"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Kunde } from "@/lib/crm-heute-model";
import { updateTeilen } from "../actions";
import { kurzDatum } from "../logik";

const EURO = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const ZEIT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

/** Kunden mit dem, was wir zugesagt haben, Meilensteinen und internen Updates. */
export default function Kundenliste({ kunden, heute }: { kunden: Kunde[]; heute: string }) {
  return (
    <section className="kunden" aria-labelledby="kunden-titel">
      <h2 id="kunden-titel" className="satz satz--h2 kunden__titel">
        Kunden
        <sup className="satz__zahl">
          <span className="sr-only">, </span>
          {kunden.length}
        </sup>
      </h2>
      {kunden.length === 0 ? (
        <p className="regal regal--leer">Noch kein Kunde. Eine Marke wird Kunde, sobald ihr Angebot angenommen ist.</p>
      ) : (
        <div className="kunden__raster">
          {kunden.map((k) => (
            <KundenKarte key={k.id} kunde={k} heute={heute} />
          ))}
        </div>
      )}
    </section>
  );
}

function KundenKarte({ kunde, heute }: { kunde: Kunde; heute: string }) {
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  const a = kunde.angebot;

  function teilen(e: React.FormEvent) {
    e.preventDefault();
    starte(async () => {
      const r = await updateTeilen(kunde.id, text);
      if (r.ok) {
        setText("");
        setFehler(null);
      } else setFehler(r.fehler);
    });
  }

  const eckdaten = a
    ? [
        a.start && `Start ${kurzDatum(a.start)}`,
        a.laufzeitMonate && `${a.laufzeitMonate} Monate`,
        a.breiteCm && `${a.breiteCm} cm Regal`,
        a.tasting && "Tasting",
      ].filter(Boolean)
    : [];

  return (
    <article className="kunde regal" aria-labelledby={`kunde-${kunde.id}`}>
      <header className="kunde__kopf">
        <h3 id={`kunde-${kunde.id}`} className="kunde__name">
          {kunde.name}
        </h3>
        <p className="kunde__meta">
          <span className="person">{kunde.besitzer}</span>
          {kunde.segment ?? "ohne Segment"}
          {kunde.kundeSeit && ` · Kunde seit ${kurzDatum(kunde.kundeSeit)}`}
        </p>
      </header>

      <div className="kunde__block">
        <h4 className="kunde__label">Zugesagt</h4>
        {kunde.zusagen.length > 0 && (
          <ul className="kunde__zusagen">
            {kunde.zusagen.map((z) => (
              <li key={z.id}>
                <p className="kunde__produkt">
                  {z.produkt}
                  {z.klasse && <span className="stufe"> {z.klasse}</span>}
                </p>
                <p className="kunde__fakten">
                  {[
                    z.regalCm !== null && `${z.regalCm} cm`,
                    z.laufzeitMonate !== null && `${z.laufzeitMonate} Monate`,
                    z.monatNetto !== null && `${EURO.format(z.monatNetto)} / Monat`,
                    z.vertragswert !== null && `${EURO.format(z.vertragswert)} gesamt`,
                    z.gebuchtAm && `gebucht ${kurzDatum(z.gebuchtAm)}`,
                    z.status !== "gebucht" && z.status,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
        {a ? (
          <>
            <p className="kunde__angebot">
              Angebot {a.nr} · {a.status}
              {eckdaten.length > 0 && ` · ${eckdaten.join(" · ")}`}
            </p>
            {a.positionen.length > 0 && (
              <ul className="kunde__liste">
                {a.positionen.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          kunde.zusagen.length === 0 && <p className="kunde__leer">Keine Zusage und kein Angebot hinterlegt.</p>
        )}
      </div>

      {kunde.meilensteine.length > 0 && (
        <div className="kunde__block">
          <h4 className="kunde__label">Meilensteine</h4>
          <ul className="kunde__liste kunde__liste--meilensteine">
            {kunde.meilensteine.map((m) => {
              const faellig = !m.erledigt && m.faellig !== null && m.faellig <= heute;
              return (
                <li key={m.id} data-erledigt={m.erledigt || undefined} data-faellig={faellig || undefined}>
                  <span className="kunde__haken" aria-hidden="true">
                    {m.erledigt && <Check strokeWidth={3} />}
                  </span>
                  <span>{m.titel}</span>
                  <span className="kunde__datum">
                    {m.erledigt ? "erledigt" : m.faellig ? kurzDatum(m.faellig) : "ohne Datum"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="kunde__block">
        <h4 className="kunde__label">Updates</h4>
        <form className="kunde__form" onSubmit={teilen}>
          <label className="sr-only" htmlFor={`update-${kunde.id}`}>
            Update zu {kunde.name}
          </label>
          <textarea
            id={`update-${kunde.id}`}
            className="formular__eingabe kunde__eingabe"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Was gibt es Neues? Ware da, Regal live, erste Verkäufe …"
          />
          <button type="submit" className="knopf knopf--voll" disabled={laeuft || text.trim() === ""}>
            {laeuft ? "Teilt…" : "Teilen"}
          </button>
        </form>
        {fehler && (
          <p className="formular__fehler" role="alert">
            {fehler}
          </p>
        )}
        {kunde.updates.length === 0 ? (
          <p className="kunde__leer">Noch kein Update.</p>
        ) : (
          <ol className="kunde__updates">
            {kunde.updates.map((u) => (
              <li key={u.id}>
                <p className="kunde__update-text">{u.text}</p>
                <p className="kunde__update-meta">
                  {u.wer ?? "Unbekannt"} · {ZEIT.format(new Date(u.wann))}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
