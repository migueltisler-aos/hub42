"use client";

// "Bearbeiten"-Knopf je Artikelzeile: klappt das vorbefüllte Formular auf,
// nach erfolgreichem Speichern wieder zu.
import { useCallback, useState } from "react";
import ArtikelForm, { type ArtikelArt, type ArtikelDaten } from "./ArtikelForm";

export default function ArtikelBearbeiten({ art, artikel, offen: anfangsOffen = false }: { art: ArtikelArt; artikel: ArtikelDaten; offen?: boolean }) {
  const [offen, setOffen] = useState(anfangsOffen);
  const fertig = useCallback(() => setOffen(false), []);
  return (
    <div className="mp-bearbeiten">
      <button type="button" className="mp-knopf mp-knopf--zweit mp-knopf--klein" aria-expanded={offen} onClick={() => setOffen((o) => !o)}>
        {offen ? "Schließen" : art === "vorschlag" ? "Prüfen und ergänzen" : "Bearbeiten"}
      </button>
      {offen && (
        <div className="mp-bearbeiten__form">
          <ArtikelForm art={art} artikel={artikel} onFertig={fertig} />
        </div>
      )}
    </div>
  );
}
