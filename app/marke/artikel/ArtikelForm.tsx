"use client";

import { useActionState, useEffect, useRef } from "react";
import { artikelHinzufuegen } from "../actions";

export interface Vorschlag {
  id: string;
  artikel_name: string;
  vk_brutto: number | null;
  inhalt: string | null;
}

/** Ohne vorschlag: neuer Artikel. Mit vorschlag: von uns vorbereiteter Artikel, die Marke ergänzt und übernimmt. */
export default function ArtikelForm({ vorschlag }: { vorschlag?: Vorschlag }) {
  const [status, aktion, laeuft] = useActionState(artikelHinzufuegen, null);
  const ref = useRef<HTMLFormElement>(null);
  const f = status?.felder ?? {};

  useEffect(() => {
    if (status?.ok && !vorschlag) ref.current?.reset();
    // Bei Fehlern den Cursor ins erste falsche Feld setzen
    if (status && !status.ok) ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [status]);

  return (
    <form ref={ref} action={aktion} className="mp-form" aria-label={vorschlag ? `Vorschlag ${vorschlag.artikel_name} prüfen` : "Artikel hinzufügen"}>
      {vorschlag && <input type="hidden" name="vorschlag_id" value={vorschlag.id} />}
      <div className="mp-felder">
        <label className="mp-feld">
          <span>EAN <small>(falls vorhanden)</small></span>
          <input type="text" name="ean" inputMode="numeric" aria-invalid={f.ean ? true : undefined} />
          {f.ean && <small className="mp-fehler">{f.ean}</small>}
        </label>
        <label className="mp-feld">
          <span>Artikelname</span>
          <input type="text" name="artikel_name" defaultValue={vorschlag?.artikel_name} aria-invalid={f.artikel_name ? true : undefined} />
          {f.artikel_name && <small className="mp-fehler">{f.artikel_name}</small>}
        </label>
        <label className="mp-feld">
          <span>Inhalt <small>(optional)</small></span>
          <input type="text" name="inhalt" placeholder="z. B. 250 g" defaultValue={vorschlag?.inhalt ?? undefined} />
        </label>
        <label className="mp-feld">
          <span>Verkaufspreis brutto (€)</span>
          <input type="text" name="vk_brutto" inputMode="decimal" placeholder="5,99" defaultValue={vorschlag?.vk_brutto != null ? String(vorschlag.vk_brutto).replace(".", ",") : undefined} aria-invalid={f.vk_brutto ? true : undefined} />
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
        <label className="mp-feld">
          <span>Produktbild <small>(optional)</small></span>
          <input type="file" name="bild" accept="image/jpeg,image/png,image/webp" aria-invalid={f.bild ? true : undefined} />
          <small>Freigestellt oder auf hellem Grund, bis 4 MB</small>
          {f.bild && <small className="mp-fehler">{f.bild}</small>}
        </label>
      </div>
      <div className="mp-aktionen">
        <button className={vorschlag ? "mp-knopf" : "mp-knopf mp-knopf--zweit"} type="submit" disabled={laeuft}>{vorschlag ? "Stimmt so, übernehmen" : "Artikel hinzufügen"}</button>
        {status && <span role="status" className={status.ok ? "mp-hinweis" : "mp-hinweis mp-hinweis--warn"}>{status.meldung}</span>}
      </div>
    </form>
  );
}
