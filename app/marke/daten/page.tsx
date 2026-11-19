import type { Metadata } from "next";
import { ladeArtikel, ladeArtikelAntraege, ladeKonditionen, requireMarke } from "@/lib/marke";
import { GUTSCHRIFT_ZUSTIMMUNG_TEXT } from "@/lib/abrechnung-model";
import StammdatenForm from "./StammdatenForm";
import ArtikelForm from "./ArtikelForm";
import { artikelEntfernen } from "../actions";
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
  const [k, antraege, artikel] = await Promise.all([
    ladeKonditionen(m.brandId),
    ladeArtikelAntraege(m.brandId),
    ladeArtikel(m.brandId),
  ]);
  const status = k?.status ?? "entwurf";

  return (
    <>
      <div className="mp-kopfzeile">
        <div>
          <h1 className="mp-h1">Stammdaten</h1>
          <p className="mp-leise">Was wir für Gutschrift, Rechnung und Überweisung brauchen.</p>
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
      >
        <fieldset className="mp-feldgruppe" id="artikel">
          <legend>Artikel</legend>
          <p className="mp-leise" style={{ fontSize: 13 }}>
            Jeder Artikel, der ins Regal soll, mit EAN, Verkaufspreis und MwSt-Satz. Den Preis bestimmst du.
          </p>
          {artikel.length > 0 && (
            <div className="mp-tabelle-rahmen">
              <table className="mp-tabelle">
                <thead><tr><th>Im Regal</th><th>EAN</th><th className="z">VK</th><th className="z">MwSt</th></tr></thead>
                <tbody>
                  {artikel.map((a) => (
                    <tr key={a.ean}>
                      <td>{a.artikel_name}</td>
                      <td className="mp-mono">{a.ean}</td>
                      <td className="z">{Number(a.verkaufspreis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                      <td className="z">{a.mwst_satz != null ? `${a.mwst_satz} %` : "fehlt"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {antraege.filter((a) => a.status !== "freigegeben").length > 0 && (
            <div className="mp-tabelle-rahmen">
              <table className="mp-tabelle">
                <thead><tr><th>Bild</th><th>Eingereicht</th><th>EAN</th><th className="z">VK</th><th className="z">MwSt</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {antraege
                    .filter((a) => a.status !== "freigegeben")
                    .map((a) => (
                      <tr key={a.id}>
                        <td>
                          {a.bild_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- signierte Storage-URL
                            <img src={a.bild_url} alt="" width={48} height={48} style={{ objectFit: "cover", display: "block" }} />
                          ) : (
                            <span className="mp-leise">–</span>
                          )}
                        </td>
                        <td>{a.artikel_name}{a.inhalt ? <div className="mp-leise">{a.inhalt}</div> : null}</td>
                        <td className="mp-mono">{a.ean ?? "–"}</td>
                        <td className="z">{Number(a.vk_brutto).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                        <td className="z">{a.mwst_satz} %</td>
                        <td>{a.status === "abgelehnt" ? "abgelehnt" : "wird geprüft"}</td>
                        <td>
                          <form action={artikelEntfernen}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="mp-knopf mp-knopf--zweit mp-knopf--klein" type="submit">Entfernen</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          <ArtikelForm />
        </fieldset>
      </StammdatenForm>
    </>
  );
}
