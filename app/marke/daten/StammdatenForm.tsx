"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stammdatenSpeichern } from "../actions";

interface Werte {
  firma: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  rechnungs_email: string;
  ansprechpartner: string;
  telefon: string;
  logistik_kontakt: string;
  nachschub_email: string;
  ust_idnr: string;
  steuernummer: string;
  iban: string;
  bic: string;
  kontoinhaber: string;
  gutschrift_zustimmung: boolean;
}

const FORM_ID = "stammdaten";

/**
 * Stammdaten-Formular. Zustimmung und Knöpfe stehen außerhalb des <form>
 * und hängen über das form-Attribut daran.
 */
export default function StammdatenForm({
  werte,
  zustimmungText,
  bereitsEingereicht,
}: {
  werte: Werte;
  zustimmungText: string;
  bereitsEingereicht: boolean;
}) {
  const [status, aktion, laeuft] = useActionState(stammdatenSpeichern, null);
  const f = status?.felder ?? {};
  // Nach einer Action setzt React das Formular zurück: bei Fehlern die
  // eingegebenen Werte als neue Vorgabe nehmen, sonst wären sie weg.
  const w = { ...werte, ...(status?.werte ?? {}) } as Werte;
  const fehlerListe = Object.entries(f);
  const kasten = useRef<HTMLDivElement>(null);

  // Nach einem Fehler: zum Fehlerkasten oben springen und ihn vorlesen lassen.
  const router = useRouter();
  // Nach dem Speichern geht es weiter zu den Artikeln (nächster Schritt im Onboarding)
  useEffect(() => {
    if (status?.ok) router.push("/marke/artikel?von=stammdaten");
  }, [status, router]);

  useEffect(() => {
    if (status && !status.ok && kasten.current) {
      kasten.current.scrollIntoView({ behavior: "smooth", block: "start" });
      kasten.current.focus({ preventScroll: true });
    }
  }, [status]);

  // Bewusst Funktion statt Komponente: eine innere Komponente bekäme bei
  // jedem Render eine neue Identität und würde die Felder neu einhängen.
  const feld = ({ name, label, typ = "text", hilfe, auto }: { name: keyof Werte; label: string; typ?: string; hilfe?: string; auto?: string }) => (
    <label className="mp-feld" key={name}>
      <span>{label}</span>
      <input
        id={`feld-${name}`}
        type={typ}
        name={name}
        defaultValue={String(w[name] ?? "")}
        autoComplete={auto}
        aria-invalid={f[name] ? true : undefined}
        aria-describedby={f[name] ? `${name}-fehler` : undefined}
        form={FORM_ID}
      />
      {hilfe && <small>{hilfe}</small>}
      {f[name] && <small id={`${name}-fehler`} className="mp-fehler">{f[name]}</small>}
    </label>
  );

  return (
    <div className="mp-form">
      {status && !status.ok && (
        <div ref={kasten} tabIndex={-1} role="alert" className="mp-fehlerkasten">
          <strong>{status.meldung}</strong>
          {fehlerListe.length > 0 && (
            <ul>
              {fehlerListe.map(([name, text]) => (
                <li key={name}>
                  <a href={`#feld-${name}`}>{text}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <form id={FORM_ID} action={aktion} className="mp-form">
        <fieldset className="mp-feldgruppe">
          <legend>Firma</legend>
          <div className="mp-felder">
            {feld({ name: "firma", label: "Firma (wie im Handelsregister)", auto: "organization" })}
            {feld({ name: "ansprechpartner", label: "Ansprechperson", auto: "name" })}
            {feld({ name: "strasse", label: "Straße und Hausnummer", auto: "street-address" })}
            {feld({ name: "plz", label: "PLZ", auto: "postal-code" })}
            {feld({ name: "ort", label: "Ort", auto: "address-level2" })}
            {feld({ name: "land", label: "Land", hilfe: "Ländercode, z. B. DE oder AT" })}
            {feld({ name: "rechnungs_email", label: "E-Mail für Abrechnungen", typ: "email", auto: "email" })}
            {feld({ name: "telefon", label: "Telefon", typ: "tel", auto: "tel" })}
          </div>
        </fieldset>

        <fieldset className="mp-feldgruppe">
          <legend>Logistik</legend>
          <div className="mp-felder">
            {feld({ name: "logistik_kontakt", label: "Wer liefert nach?", hilfe: "Name oder Lager, falls nicht du selbst" })}
            {feld({ name: "nachschub_email", label: "E-Mail für Nachschub", typ: "email", hilfe: "Dorthin melden wir, wenn die Ware knapp wird" })}
          </div>
        </fieldset>

        <fieldset className="mp-feldgruppe">
          <legend>Steuer</legend>
          <div className="mp-felder">
            {feld({ name: "ust_idnr", label: "USt-IdNr.", hilfe: "z. B. DE123456789" })}
            {feld({ name: "steuernummer", label: "Steuernummer", hilfe: "Nur nötig ohne USt-IdNr." })}
          </div>
        </fieldset>

        <fieldset className="mp-feldgruppe">
          <legend>Bank</legend>
          <div className="mp-felder">
            {feld({ name: "kontoinhaber", label: "Kontoinhaber" })}
            {feld({ name: "iban", label: "IBAN", auto: "off" })}
            {feld({ name: "bic", label: "BIC", hilfe: "Nur bei Konten außerhalb Deutschlands", auto: "off" })}
          </div>
        </fieldset>
      </form>

      {f.artikel && <p id="feld-artikel" className="mp-fehler">{f.artikel} <a href="/marke/artikel">Zu den Artikeln</a></p>}

      <fieldset className="mp-feldgruppe">
        <legend>Zustimmung</legend>
        <label className="mp-check">
          <input id="feld-gutschrift_zustimmung" type="checkbox" name="gutschrift_zustimmung" defaultChecked={w.gutschrift_zustimmung} form={FORM_ID} aria-invalid={f.gutschrift_zustimmung ? true : undefined} />
          <span>{zustimmungText}</span>
        </label>
        {f.gutschrift_zustimmung && <small className="mp-fehler">{f.gutschrift_zustimmung}</small>}
      </fieldset>

      <div className="mp-aktionen">
        <button className="mp-knopf" type="submit" form={FORM_ID} name="aktion" value="einreichen" disabled={laeuft}>
          {bereitsEingereicht ? "Änderungen einreichen, weiter zu Artikeln" : "Einreichen, weiter zu Artikeln"}
        </button>
        <button className="mp-knopf mp-knopf--zweit" type="submit" form={FORM_ID} name="aktion" value="speichern" disabled={laeuft}>
          Zwischenspeichern, weiter zu Artikeln
        </button>
        {status && (
          <span role="status" className={status.ok ? "mp-hinweis" : "mp-hinweis mp-hinweis--warn"}>
            {status.ok ? status.meldung : `${status.meldung} Die Fehler stehen oben und an den rot markierten Feldern.`}
          </span>
        )}
      </div>
    </div>
  );
}
