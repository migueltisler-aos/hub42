import type { Metadata } from "next";
import { ladeKonditionen, requireMarke } from "@/lib/marke";
import { GUTSCHRIFT_ZUSTIMMUNG_TEXT } from "@/lib/abrechnung-model";
import StammdatenForm from "./StammdatenForm";
import { datum } from "../format";

export const metadata: Metadata = { title: "Stammdaten" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  entwurf: "Noch nicht eingereicht",
  eingereicht: "Eingereicht, wird geprüft",
  freigegeben: "Geprüft und freigegeben",
};

export default async function MarkeDaten() {
  const m = await requireMarke();
  const k = await ladeKonditionen(m.brandId);
  const status = k?.status ?? "entwurf";

  return (
    <>
      <div className="mp-kopfzeile">
        <div>
          <h1 className="mp-h1">Stammdaten</h1>
          <p className="mp-leise">Was wir für Gutschrift, Rechnung und Überweisung brauchen. Deine Produkte trägst du unter <a href="/marke/artikel">Artikel</a> ein.</p>
        </div>
        <span className={status === "freigegeben" ? "mp-marke mp-marke--licht" : "mp-marke"}>
          {STATUS[status]}
          {status === "freigegeben" && k?.freigegeben_am ? ` am ${datum(k.freigegeben_am)}` : ""}
        </span>
      </div>

      {k?.pruef_notiz && status !== "freigegeben" && (
        <p className="mp-hinweis mp-hinweis--warn"><strong>Hinweis von uns:</strong> {k.pruef_notiz}</p>
      )}
      {status === "freigegeben" && (
        <p className="mp-hinweis">
          Änderungen an Bank- oder Steuerdaten prüfen wir vor der nächsten Auszahlung noch einmal.
        </p>
      )}

      <StammdatenForm
        werte={{
          firma: k?.firma ?? "",
          strasse: k?.strasse ?? "",
          plz: k?.plz ?? "",
          ort: k?.ort ?? "",
          land: k?.land ?? "DE",
          rechnungs_email: k?.rechnungs_email ?? m.email,
          ansprechpartner: k?.ansprechpartner ?? "",
          telefon: k?.telefon ?? "",
          logistik_kontakt: k?.logistik_kontakt ?? "",
          nachschub_email: k?.nachschub_email ?? "",
          ust_idnr: k?.ust_idnr ?? "",
          steuernummer: k?.steuernummer ?? "",
          iban: k?.iban ?? "",
          bic: k?.bic ?? "",
          kontoinhaber: k?.kontoinhaber ?? "",
          gutschrift_zustimmung: Boolean(k?.gutschrift_zustimmung_am),
        }}
        zustimmungText={GUTSCHRIFT_ZUSTIMMUNG_TEXT}
        bereitsEingereicht={status !== "entwurf"}
      />
    </>
  );
}
