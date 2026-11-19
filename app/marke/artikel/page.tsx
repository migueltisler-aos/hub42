import type { Metadata } from "next";
import { ladeArtikel, ladeArtikelAntraege, ladeBestand, ladeKonditionen, requireMarke } from "@/lib/marke";
import ArtikelForm from "./ArtikelForm";
import { artikelEntfernen } from "../actions";
import { datumZeit } from "../format";

export const metadata: Metadata = { title: "Artikel" };
export const dynamic = "force-dynamic";

const QUELLE: Record<string, string> = {
  wareneingang: "Lieferung",
  verkauf: "Verkauf",
  muster_entnahme: "Tasting",
  abschrift: "Abschrift",
  korrektur: "Korrektur",
};

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

/** Kassenschlüssel eines freigegebenen Antrags: EAN oder die bei der Freigabe vergebene TK-Nummer. */
const schluessel = (a: { id: string; ean: string | null }) => a.ean ?? `TK-${a.id.slice(0, 8).toUpperCase()}`;

function Bild({ url }: { url: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- signierte Storage-URL
    <img src={url} alt="" width={56} height={56} className="mp-artikelbild" />
  ) : (
    <span className="mp-artikelbild mp-artikelbild--leer" aria-hidden />
  );
}

export default async function MarkeArtikel() {
  const m = await requireMarke();
  const [artikel, antraege, { zeilen, bewegungen }, k] = await Promise.all([
    ladeArtikel(m.brandId),
    ladeArtikelAntraege(m.brandId),
    ladeBestand(m.brandId),
    ladeKonditionen(m.brandId),
  ]);

  const bestand = new Map(zeilen.map((z) => [z.ean, z]));
  const bildJeSchluessel = new Map(
    antraege.filter((a) => a.status === "freigegeben" && a.bild_url).map((a) => [schluessel(a), a.bild_url])
  );
  const offen = antraege.filter((a) => a.status !== "freigegeben");
  const nachschub = zeilen.filter((z) => z.nachbestellung_empfohlen || (z.reichweite_tage !== null && z.reichweite_tage < 7));

  return (
    <>
      <div className="mp-kopfzeile">
        <div>
          <h1 className="mp-h1">Artikel</h1>
          <p className="mp-leise">Deine Produkte im Testkaufhaus, mit Bestand im Laden. Den Preis bestimmst du.</p>
        </div>
        <a href="#neu" className="mp-knopf">Artikel hinzufügen</a>
      </div>

      {nachschub.length > 0 && (
        <section className="mp-hinweis mp-hinweis--warn" aria-labelledby="nachschub-titel">
          <h2 id="nachschub-titel" className="mp-h2" style={{ fontSize: 18 }}>Bitte nachliefern</h2>
          <ul style={{ marginTop: 8, display: "grid", gap: 4 }}>
            {nachschub.map((z) => (
              <li key={z.ean}>
                <strong>{z.artikel_name}</strong>: {z.bestand > 0 ? `noch ${z.bestand} Stück` : "ausverkauft"}
                {z.bestand > 0 && z.reichweite_tage !== null && `, reicht etwa ${z.reichweite_tage} Tage`}
                {z.nachschub_menge > 0 && `. Für zwei Wochen fehlen ${z.nachschub_menge} Stück.`}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            Lieferung bitte innerhalb einer Woche{k?.nachschub_email ? `, Rückfragen an ${k.nachschub_email}` : ""}.
          </p>
        </section>
      )}

      <section aria-labelledby="regal-titel" style={{ display: "grid", gap: 12 }}>
        <h2 id="regal-titel" className="mp-h2">Im Regal</h2>
        {artikel.length === 0 ? (
          <p className="mp-hinweis">Noch nichts im Regal. Sobald wir deine Artikel geprüft haben, stehen sie hier mit Bestand.</p>
        ) : (
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead>
                <tr>
                  <th aria-label="Bild" />
                  <th>Artikel</th>
                  <th className="z">VK</th>
                  <th className="z">MwSt</th>
                  <th className="z">Im Laden</th>
                  <th className="z">Ø / Tag</th>
                  <th className="z">Reicht</th>
                </tr>
              </thead>
              <tbody>
                {artikel.map((a) => {
                  const b = bestand.get(a.ean);
                  const konto = b?.konto;
                  const rechnerisch = konto ? konto.geliefert - konto.verkauft - konto.tasting - konto.abschrift + konto.korrektur : 0;
                  const warn = b ? b.bestand < 0 || rechnerisch !== b.bestand : false;
                  return (
                    <tr key={a.ean} className={warn ? "warn" : undefined}>
                      <td><Bild url={bildJeSchluessel.get(a.ean) ?? null} /></td>
                      <td>
                        <strong>{a.artikel_name}</strong>
                        <div className="mp-mono mp-leise">{a.ean}</div>
                        {konto && (
                          <details className="mp-konto">
                            <summary>Warenkonto</summary>
                            <dl>
                              <dt>Geliefert</dt><dd>{konto.geliefert}</dd>
                              <dt>Verkauft</dt><dd>− {konto.verkauft}</dd>
                              <dt>Tasting</dt><dd>− {konto.tasting}</dd>
                              <dt>Abschrift</dt><dd>− {konto.abschrift}</dd>
                              {konto.korrektur !== 0 && (<><dt>Korrektur</dt><dd>{konto.korrektur > 0 ? `+ ${konto.korrektur}` : `− ${-konto.korrektur}`}</dd></>)}
                              <dt><strong>Im Laden</strong></dt><dd><strong>{b!.bestand}</strong></dd>
                            </dl>
                          </details>
                        )}
                      </td>
                      <td className="z">{eur(Number(a.verkaufspreis))}</td>
                      <td className="z">{a.mwst_satz != null ? `${a.mwst_satz} %` : "–"}</td>
                      <td className="z"><strong>{b?.bestand ?? 0}</strong></td>
                      <td className="z">{b?.verkauf_pro_tag ? b.verkauf_pro_tag.toLocaleString("de-DE", { maximumFractionDigits: 1 }) : "–"}</td>
                      <td className="z">{b?.reichweite_tage != null ? `${b.reichweite_tage} Tage` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mp-leise" style={{ fontSize: 13 }}>
          Warenkonto: geliefert minus verkauft, Tasting und Abschrift ergibt den Bestand im Laden. Tasting-Stücke stellst du als Muster, sie werden nicht vergütet.
        </p>
      </section>

      {offen.length > 0 && (
        <section aria-labelledby="pruefung-titel" style={{ display: "grid", gap: 12 }}>
          <h2 id="pruefung-titel" className="mp-h2">Eingereicht</h2>
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead>
                <tr><th aria-label="Bild" /><th>Artikel</th><th className="z">VK</th><th className="z">MwSt</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {offen.map((a) => (
                  <tr key={a.id}>
                    <td><Bild url={a.bild_url} /></td>
                    <td>
                      <strong>{a.artikel_name}</strong>
                      <div className="mp-mono mp-leise">{a.ean ?? "ohne EAN"}{a.inhalt ? ` · ${a.inhalt}` : ""}</div>
                    </td>
                    <td className="z">{eur(Number(a.vk_brutto))}</td>
                    <td className="z">{a.mwst_satz} %</td>
                    <td>{a.status === "abgelehnt" ? <span className="mp-marke mp-marke--warn">abgelehnt</span> : <span className="mp-marke">wird geprüft</span>}</td>
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
        </section>
      )}

      <section id="neu" className="mp-feldgruppe" aria-labelledby="neu-titel" style={{ scrollMarginTop: 16 }}>
        <h2 id="neu-titel" className="mp-h2">Artikel hinzufügen</h2>
        <p className="mp-leise" style={{ fontSize: 13 }}>Wir prüfen jeden Artikel, bevor er in die Kasse kommt.</p>
        <ArtikelForm />
      </section>

      {bewegungen.length > 0 && (
        <details className="mp-karte">
          <summary className="mp-h2" style={{ cursor: "pointer" }}>Letzte Warenbewegungen</summary>
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead><tr><th>Wann</th><th>Artikel</th><th>Art</th><th className="z">Menge</th><th>Grund</th></tr></thead>
              <tbody>
                {bewegungen.map((b, i) => (
                  <tr key={i}>
                    <td className="mp-mono">{datumZeit(b.erstellt_am)}</td>
                    <td>{b.artikel_name}</td>
                    <td>{QUELLE[b.quelle] ?? b.quelle}</td>
                    <td className="z">{b.menge_delta > 0 ? `+${b.menge_delta}` : b.menge_delta}</td>
                    <td>{b.notiz ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </>
  );
}
