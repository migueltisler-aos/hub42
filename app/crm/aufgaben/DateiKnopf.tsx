"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip } from "lucide-react";
import { dateiAnhaengen } from "../actions";

/** Datei an eine Aufgabe hängen: landet im Drive-Unterordner der Aufgabe. */
export default function DateiKnopf({ aufgabeId, titel }: { aufgabeId: string; titel: string }) {
  const feld = useRef<HTMLInputElement>(null);
  const [laeuft, starte] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  function gewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    const form = new FormData();
    form.set("aufgabe", aufgabeId);
    form.set("datei", datei);
    starte(async () => {
      const r = await dateiAnhaengen(form);
      setFehler(r.ok ? null : r.fehler);
    });
  }

  return (
    <>
      <input ref={feld} type="file" hidden onChange={gewaehlt} />
      <button
        type="button"
        className="leiste__stimme"
        aria-label={`Datei an ${titel} hängen`}
        onClick={() => feld.current?.click()}
        disabled={laeuft}
      >
        <Paperclip aria-hidden="true" />
        {laeuft && <span>lädt…</span>}
      </button>
      {fehler && (
        <span className="leiste__fehler" role="alert">
          {fehler}
        </span>
      )}
    </>
  );
}
