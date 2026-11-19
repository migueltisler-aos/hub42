"use client";

import { useActionState } from "react";
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
 * Stammdaten-Formular. Die Artikel (children) sind eigene Formulare und
 * stehen deshalb AUSSERHALB des <form>; Zustimmung und Knöpfe hängen über
 * das form-Attribut trotzdem an diesem Formular.
 */
export default function StammdatenForm({
  werte,
  zustimmungText,
  bereitsEingereicht,
  children,
}: {
  werte: Werte;
  zustimmungText: string;
  bereitsEingereicht: boolean;
  children: React.ReactNode;
}) {
  const [status, aktion, laeuft] = useActionState(stammdatenSpeichern, null);
  const f = status?.felder ?? {};
  // Nach einer Action setzt React das Formular zurück: bei Fehlern die
  // eingegebenen Werte als neue Vorgabe nehmen, sonst wären sie weg.
  const w = { ...werte, ...(status?.werte ?? {}) } as Werte;

  // Bewusst Funktion statt Komponente: eine innere Komponente bekäme bei
  // jedem Render eine neue Identität und würde die Felder neu einhängen.
  const feld = ({ name, label, typ = "text", hilfe, auto }: { name: keyof Werte; label: string; typ?: string; hilfe?: string; auto?: string }) => (
    <label className="mp-feld" key={name}>
      <span>{label}</span>
      <input
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

      {children}
      {f.artikel && <p className="mp-fehler" role="alert">{f.artikel}</p>}

      <fieldset className="mp-feldgruppe">
        <legend>Zustimmung</legend>
        <label className="mp-check">
          <input type="checkbox" name="gutschrift_zustimmung" defaultChecked={w.gutschrift_zustimmung} form={FORM_ID} aria-invalid={f.gutschrift_zustimmung ? true : undefined} />
          <span>{zustimmungText}</span>
        </label>
        {f.gutschrift_zustimmung && <small className="mp-fehler">{f.gutschrift_zustimmung}</small>}
      </fieldset>

      <div className="mp-aktionen">
        <button className="mp-knopf" type="submit" form={FORM_ID} name="aktion" value="einreichen" disabled={laeuft}>
          {bereitsEingereicht ? "Änderungen einreichen" : "Einreichen"}
        </button>
        <button className="mp-knopf mp-knopf--zweit" type="submit" form={FORM_ID} name="aktion" value="speichern" disabled={laeuft}>
          Zwischenspeichern
        </button>
        {status && (
          <span role="status" className={status.ok ? "" : "mp-fehler"}>{status.meldung}</span>
        )}
      </div>
    </div>
  );
}
