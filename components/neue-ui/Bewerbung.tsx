"use client";

/* Bewerbung für eine Stufe der Treppe oder das Standardregal. Die Regalwand
   schickt die gewählte Front per Event "hub42:front" hierher (siehe
   Regalwand.tsx), die Treppe den Einstieg per "hub42:einstieg" (Treppe.tsx),
   damit nichts noch einmal abgetippt werden muss. */

import { useEffect, useRef, useState } from "react";
import { submitBewerbung } from "@/app/actions/bewerbung";
import { track } from "@/lib/analytics-client";
import {
  BASE_RATE_BESONDERER_WERT,
  BASE_RATE_PER_CM,
  MIN_SLOT_MIETE,
  MIN_SLOT_MIETE_BESONDERER_WERT,
} from "@/lib/deck-economics";
import {
  FRONT_EVENT,
  pruefeBewerbung,
  type BewerbungFehler,
  type FrontDetail,
  type BewerbungPayload,
} from "@/lib/bewerbung-model";
import { BUNDESLAENDER } from "@/lib/beratung";
import { ORDER, ZONES, eur, type ZoneKey } from "@/lib/neue-ui/regal";
import { SHOW_BAFA } from "@/lib/site-flags";
import { EINSTIEGE, EINSTIEG_EVENT, mitRegalwahl, type EinstiegKey } from "@/lib/treppe";

type Status = "idle" | "sending" | "success" | "error";

const LEER: BewerbungPayload = {
  name: "",
  email: "",
  marke: "",
  produkt: "",
  website: "",
  einstieg: "",
  stationaerGelistet: null,
  onlineHandel: null,
  beratungInteresse: null,
  bundesland: "",
  zone: "",
  cm: null,
  besondererWert: false,
  begruendung: "",
  nachricht: "",
  firma2: "",
};

/** nurRegal: alte Startseite (/old) ohne Treppe. Einstieg steht fest auf
    Standardregal, die Fragen dazu entfallen. */
export default function Bewerbung({ nurRegal = false }: { nurRegal?: boolean }) {
  const [form, setForm] = useState<BewerbungPayload>(
    nurRegal ? { ...LEER, einstieg: "standardregal" } : LEER,
  );
  const [fehler, setFehler] = useState<BewerbungFehler>({});
  const [status, setStatus] = useState<Status>("idle");
  const begonnen = useRef(false);

  useEffect(() => {
    const uebernehmen = (e: Event) => {
      const { zone, cm } = (e as CustomEvent<FrontDetail>).detail;
      setForm((f) => ({ ...f, zone, cm }));
    };
    const einsteigen = (e: Event) => {
      const einstieg = (e as CustomEvent<EinstiegKey>).detail;
      setForm((f) => ({ ...f, einstieg }));
      setFehler((x) => ({ ...x, einstieg: undefined }));
    };
    window.addEventListener(FRONT_EVENT, uebernehmen);
    window.addEventListener(EINSTIEG_EVENT, einsteigen);
    return () => {
      window.removeEventListener(FRONT_EVENT, uebernehmen);
      window.removeEventListener(EINSTIEG_EVENT, einsteigen);
    };
  }, []);

  /* Trichterstufe "Bewerbung begonnen" – einmal pro Seitenaufruf. */
  function beimErstenFokus() {
    if (begonnen.current) return;
    begonnen.current = true;
    track({ event_type: "interaction", path: window.location.pathname, section: "bewerbung" });
  }

  function setze<K extends keyof BewerbungPayload>(k: K, v: BewerbungPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (fehler[k]) setFehler((e) => ({ ...e, [k]: undefined }));
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    const errs = pruefeBewerbung(form);
    if (Object.keys(errs).length > 0) {
      setFehler(errs);
      return;
    }
    setStatus("sending");
    const res = await submitBewerbung(form);
    setStatus(res.ok ? "success" : "error");
    if (res.ok) {
      // Nur Eckdaten, keine Formularinhalte (wie ContactForm).
      track({
        event_type: "conversion",
        path: window.location.pathname,
        meta: {
          form: "bewerbung",
          einstieg: form.einstieg,
          zone: form.zone || null,
          besonderer_wert: form.besondererWert,
        },
      });
    }
  }

  if (status === "success") {
    return (
      <div className="apply__done" role="status">
        <p className="apply__done-h">Bewerbung ist da.</p>
        <p>
          Wir sehen uns dein Produkt an und melden uns innerhalb von zwei Werktagen mit einem Termin
          fürs Onboarding.
        </p>
      </div>
    );
  }

  const feld = (k: keyof BewerbungPayload) => "apply__field" + (fehler[k] ? " is-bad" : "");
  const regalwahl = mitRegalwahl(form.einstieg);

  /* Ja/Nein als Radiopaar; null heißt: nicht beantwortet. */
  const janein = (
    k: "stationaerGelistet" | "onlineHandel" | "beratungInteresse",
    frage: string,
  ) => (
    <fieldset className="apply__field apply__yn apply__wide">
      <legend>{frage}</legend>
      <div>
        {([true, false] as const).map((v) => (
          <label key={String(v)}>
            <input type="radio" name={k} checked={form[k] === v} onChange={() => setze(k, v)} />
            {v ? "Ja" : "Nein"}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form className="apply" onSubmit={absenden} onFocus={beimErstenFokus} noValidate>
      <div className="apply__grid">
        <label className={feld("marke")}>
          <span>Marke *</span>
          <input
            value={form.marke}
            onChange={(e) => setze("marke", e.target.value)}
            autoComplete="organization"
          />
          {fehler.marke && <em>{fehler.marke}</em>}
        </label>
        <label className={feld("produkt")}>
          <span>Produkt *</span>
          <input
            value={form.produkt}
            onChange={(e) => setze("produkt", e.target.value)}
            placeholder="z. B. Hot Sauce, 150 ml"
          />
          {fehler.produkt && <em>{fehler.produkt}</em>}
        </label>
        <label className={feld("name")}>
          <span>Dein Name *</span>
          <input
            value={form.name}
            onChange={(e) => setze("name", e.target.value)}
            autoComplete="name"
          />
          {fehler.name && <em>{fehler.name}</em>}
        </label>
        <label className={feld("email")}>
          <span>E-Mail *</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setze("email", e.target.value)}
            autoComplete="email"
          />
          {fehler.email && <em>{fehler.email}</em>}
        </label>
        <label className={feld("website") + " apply__wide"}>
          <span>Shop oder Website</span>
          <input
            value={form.website}
            onChange={(e) => setze("website", e.target.value)}
            placeholder="https://"
            inputMode="url"
          />
        </label>

        {!nurRegal && (
          <>
            <label className={feld("einstieg") + " apply__wide"}>
              <span>Einstieg *</span>
              <select
                value={form.einstieg}
                onChange={(e) => setze("einstieg", e.target.value as EinstiegKey | "")}
              >
                <option value="">Bitte wählen</option>
                {(Object.keys(EINSTIEGE) as EinstiegKey[]).map((k) => (
                  <option key={k} value={k}>
                    {EINSTIEGE[k]}
                  </option>
                ))}
              </select>
              {fehler.einstieg && <em>{fehler.einstieg}</em>}
            </label>

            {janein("stationaerGelistet", "Bist du bereits im stationären Handel gelistet?")}
            {janein("onlineHandel", "Hast du einen Onlineshop oder verkaufst du auf Marktplätzen?")}
            {SHOW_BAFA && janein("beratungInteresse", "Interesse an geförderter Beratung?")}
            {SHOW_BAFA && form.beratungInteresse === true && (
              <label className="apply__field apply__wide">
                <span>Sitz deiner Firma (Bundesland)</span>
                <select
                  value={form.bundesland}
                  onChange={(e) => setze("bundesland", e.target.value)}
                >
                  <option value="">Bitte wählen</option>
                  {BUNDESLAENDER.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {regalwahl && (
          <>
            <label className="apply__field">
              <span>Wunschzone</span>
              <select
                value={form.zone}
                onChange={(e) => setze("zone", e.target.value as ZoneKey | "")}
              >
                <option value="">Noch offen</option>
                {ORDER.map((z) => (
                  <option key={z} value={z}>
                    {ZONES[z].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="apply__field">
              <span>Breite in cm</span>
              <input
                type="number"
                min={5}
                max={84}
                value={form.cm ?? ""}
                onChange={(e) => setze("cm", e.target.value ? Number(e.target.value) : null)}
                placeholder="ab 5"
              />
            </label>
          </>
        )}
      </div>

      {regalwahl && (
        <div className={"apply__special" + (form.besondererWert ? " is-on" : "")}>
          <label className="apply__check">
            <input
              type="checkbox"
              checked={form.besondererWert}
              onChange={(e) => setze("besondererWert", e.target.checked)}
            />
            <span>
              <strong>
                Mein Produkt hat einen besonderen Wert. Ich bewerbe mich für{" "}
                {eur(BASE_RATE_BESONDERER_WERT)} statt {eur(BASE_RATE_PER_CM)} je cm (ab{" "}
                {MIN_SLOT_MIETE_BESONDERER_WERT} € statt {MIN_SLOT_MIETE} €).
              </strong>
              <br />
              Für Handwerk, Herkunft oder eine Mission, die man im Supermarkt nicht erzählen kann.
              Wir entscheiden im Onboarding.
            </span>
          </label>
          {form.besondererWert && (
            <label className={feld("begruendung")}>
              <span>Was macht dein Produkt besonders? *</span>
              <textarea
                rows={3}
                value={form.begruendung}
                onChange={(e) => setze("begruendung", e.target.value)}
                placeholder="z. B. von Hand abgefüllt in Neukölln, Zutaten direkt vom Kooperativen-Bauern …"
              />
              {fehler.begruendung && <em>{fehler.begruendung}</em>}
            </label>
          )}
        </div>
      )}

      <label className="apply__field">
        <span>Noch etwas?</span>
        <textarea
          rows={3}
          value={form.nachricht}
          onChange={(e) => setze("nachricht", e.target.value)}
        />
      </label>

      {/* Honeypot: für Menschen unsichtbar, Bots füllen ihn aus. */}
      <input
        className="apply__hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.firma2}
        onChange={(e) => setze("firma2", e.target.value)}
      />

      <div className="apply__foot">
        <button className="btn btn--lit" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Wird gesendet …" : "Jetzt bewerben"}
        </button>
        <p>
          Wir nutzen deine Angaben nur, um deine Bewerbung zu prüfen und dich zu kontaktieren. Mehr
          dazu im <a href="/datenschutz">Datenschutz</a>.
        </p>
      </div>
      {status === "error" && (
        <p className="apply__err" role="alert">
          Das hat nicht geklappt. Schreib uns direkt an{" "}
          <a href="mailto:info@tryhub42.de">info@tryhub42.de</a>.
        </p>
      )}
    </form>
  );
}
