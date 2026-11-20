"use client";

// Ein Formular für alle Fälle:
//  - neu:       leerer Artikel
//  - vorschlag: von uns vorbereitet, die Marke ergänzt und übernimmt
//  - antrag:    eingereicht oder abgelehnt, die Marke korrigiert
//  - regal:     schon in der Kasse; Änderung geht als Antrag in die Prüfung
import { useActionState, useEffect, useRef, useState } from "react";
import { artikelHinzufuegen } from "../actions";

export type ArtikelArt = "neu" | "vorschlag" | "antrag" | "regal";

export interface ArtikelDaten {
  antragId?: string;
  ean?: string | null;
  artikel_name?: string;
  vk_brutto?: number | null;
  mwst_satz?: number | null;
  inhalt?: string | null;
  bild_url?: string | null;
}

const KNOPF: Record<ArtikelArt, string> = {
  neu: "Artikel hinzufügen",
  vorschlag: "Stimmt so, übernehmen",
  antrag: "Änderungen speichern",
  regal: "Änderungen speichern",
};

function BildFeld({ vorhanden, fehler }: { vorhanden?: string | null; fehler?: string }) {
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const zeigen = vorschau ?? vorhanden ?? null;
  return (
    <div className="mp-feld mp-bildfeld">
      <span>Produktbild <small>(optional)</small></span>
      <div className="mp-bildfeld__reihe">
        {zeigen ? (
          // eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau oder signierte URL
          <img src={zeigen} alt="" className="mp-bildfeld__vorschau" />
        ) : (
          <span className="mp-bildfeld__vorschau mp-artikelbild--leer" aria-hidden />
        )}
        <label className="mp-knopf mp-knopf--zweit">
          {zeigen ? "Anderes Bild wählen" : "Produktbild hochladen"}
          <input
            type="file"
            name="bild"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-invalid={fehler ? true : undefined}
            onChange={(e) => {
              const datei = e.currentTarget.files?.[0];
              setName(datei?.name ?? null);
              setVorschau(datei ? URL.createObjectURL(datei) : null);
            }}
          />
        </label>
      </div>
      <small>{name ?? "JPG, PNG oder WebP bis 4 MB, am besten freigestellt oder auf hellem Grund"}</small>
      {fehler && <small className="mp-fehler">{fehler}</small>}
    </div>
  );
}

export default function ArtikelForm({
  art = "neu",
  artikel,
  onFertig,
}: {
  art?: ArtikelArt;
  artikel?: ArtikelDaten;
  onFertig?: () => void;
}) {
  const [status, aktion, laeuft] = useActionState(artikelHinzufuegen, null);
  const ref = useRef<HTMLFormElement>(null);
  const f = status?.felder ?? {};
  const a = artikel ?? {};

  useEffect(() => {
    if (status?.ok && art === "neu") ref.current?.reset();
    if (status?.ok) onFertig?.();
    // Bei Fehlern den Cursor ins erste falsche Feld setzen
    if (status && !status.ok) ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [status, art, onFertig]);

  return (
    <form ref={ref} action={aktion} className="mp-form" aria-label={a.artikel_name ? `${a.artikel_name} bearbeiten` : "Artikel hinzufügen"}>
      {a.antragId && <input type="hidden" name="antrag_id" value={a.antragId} />}
      {art === "regal" && <input type="hidden" name="regal_ean" value={a.ean ?? ""} />}
      <div className="mp-felder">
        <label className="mp-feld">
          <span>Artikelname</span>
          <input type="text" name="artikel_name" defaultValue={a.artikel_name} aria-invalid={f.artikel_name ? true : undefined} />
          {f.artikel_name && <small className="mp-fehler">{f.artikel_name}</small>}
        </label>
        {art === "regal" ? (
          <div className="mp-feld">
            <span>EAN / Artikelnummer</span>
            <span className="mp-mono" style={{ padding: "10px 0" }}>{a.ean}</span>
          </div>
        ) : (
          <label className="mp-feld">
            <span>EAN <small>(falls vorhanden)</small></span>
            <input type="text" name="ean" inputMode="numeric" defaultValue={a.ean ?? undefined} aria-invalid={f.ean ? true : undefined} />
            {f.ean && <small className="mp-fehler">{f.ean}</small>}
          </label>
        )}
        <label className="mp-feld">
          <span>Inhalt <small>(optional)</small></span>
          <input type="text" name="inhalt" placeholder="z. B. 250 g" defaultValue={a.inhalt ?? undefined} />
        </label>
        <label className="mp-feld">
          <span>Verkaufspreis brutto (€)</span>
          <input
            type="text"
            name="vk_brutto"
            inputMode="decimal"
            placeholder="5,99"
            defaultValue={a.vk_brutto != null ? Number(a.vk_brutto).toFixed(2).replace(".", ",") : undefined}
            aria-invalid={f.vk_brutto ? true : undefined}
          />
          {f.vk_brutto && <small className="mp-fehler">{f.vk_brutto}</small>}
        </label>
        <label className="mp-feld">
          <span>MwSt-Satz</span>
          <select name="mwst_satz" defaultValue={a.mwst_satz != null ? String(Number(a.mwst_satz)) : ""} aria-invalid={f.mwst_satz ? true : undefined}>
            <option value="" disabled>bitte wählen</option>
            <option value="7">7 % (Lebensmittel)</option>
            <option value="19">19 %</option>
            <option value="0">0 %</option>
          </select>
          {f.mwst_satz && <small className="mp-fehler">{f.mwst_satz}</small>}
        </label>
      </div>
      <BildFeld vorhanden={a.bild_url} fehler={f.bild} />
      {art === "regal" && (
        <p className="mp-leise" style={{ fontSize: 13 }}>
          Die Änderung gilt sofort. Preis und Name ziehen wir zusätzlich in unserer Kasse nach.
        </p>
      )}
      <div className="mp-aktionen">
        <button className={art === "neu" ? "mp-knopf mp-knopf--zweit" : "mp-knopf"} type="submit" disabled={laeuft}>
          {laeuft ? "Wird gespeichert …" : KNOPF[art]}
        </button>
        {status && <span role="status" className={status.ok ? "mp-hinweis" : "mp-hinweis mp-hinweis--warn"}>{status.meldung}</span>}
      </div>
    </form>
  );
}
