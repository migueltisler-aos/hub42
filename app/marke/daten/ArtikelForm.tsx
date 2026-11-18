"use client";

import { useActionState, useEffect, useRef } from "react";
import { artikelHinzufuegen } from "../actions";

export default function ArtikelForm() {
  const [status, aktion, laeuft] = useActionState(artikelHinzufuegen, null);
  const ref = useRef<HTMLFormElement>(null);
  const f = status?.felder ?? {};

  useEffect(() => {
    if (status?.ok) ref.current?.reset();
  }, [status]);

  return (
    <form ref={ref} action={aktion} className="mp-form" aria-label="Artikel hinzufügen">
      <div className="mp-felder">
        <label className="mp-feld">
          <span>EAN</span>
          <input type="text" name="ean" inputMode="numeric" aria-invalid={f.ean ? true : undefined} />
          {f.ean && <small className="mp-fehler">{f.ean}</small>}
        </label>
        <label className="mp-feld">
          <span>Artikelname</span>
          <input type="text" name="artikel_name" aria-invalid={f.artikel_name ? true : undefined} />
          {f.artikel_name && <small className="mp-fehler">{f.artikel_name}</small>}
        </label>
        <label className="mp-feld">
          <span>Inhalt</span>
          <input type="text" name="inhalt" placeholder="z. B. 250 g" />
        </label>
        <label className="mp-feld">
          <span>Verkaufspreis brutto (€)</span>
          <input type="text" name="vk_brutto" inputMode="decimal" placeholder="5,99" aria-invalid={f.vk_brutto ? true : undefined} />
          {f.vk_brutto && <small className="mp-fehler">{f.vk_brutto}</small>}
        </label>
        <label className="mp-feld">
          <span>MwSt-Satz</span>
          <select name="mwst_satz" defaultValue="" aria-invalid={f.mwst_satz ? true : undefined}>
            <option value="" disabled>bitte wählen</option>
            <option value="7">7 % (Lebensmittel)</option>
            <option value="19">19 %</option>
            <option value="0">0 %</option>
          </select>
          {f.mwst_satz && <small className="mp-fehler">{f.mwst_satz}</small>}
        </label>
      </div>
      <div className="mp-aktionen">
        <button className="mp-knopf mp-knopf--zweit" type="submit" disabled={laeuft}>Artikel hinzufügen</button>
        {status && <span role="status" className={status.ok ? "" : "mp-fehler"}>{status.meldung}</span>}
      </div>
    </form>
  );
}
