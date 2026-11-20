import type { Metadata } from "next";
import { ladeArtikel, ladeArtikelAntraege, ladeBestand, ladeKonditionen, requireMarke } from "@/lib/marke";
import ArtikelForm from "./ArtikelForm";
import ArtikelBearbeiten from "./ArtikelBearbeiten";
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

export default async function MarkeArtikel({ searchParams }: { searchParams: Promise<{ von?: string }> }) {
  const { von } = await searchParams;
  const m = await requireMarke();
  const [artikel, antraege, { zeilen, bewegungen }, k] = await Promise.all([
    ladeArtikel(m.brandId),
    ladeArtikelAntraege(m.brandId),
    ladeBestand(m.brandId),
    ladeKonditionen(m.brandId),
  ]);

  const bestand = new Map(zeilen.map((z) => [z.ean, z]));
  // Bild je Kassenschlüssel: jüngster Antrag mit Bild (freigegeben oder offene Änderung)
  const bildJeSchluessel = new Map<string, string>();
  for (const a of antraege) if (a.bild_url && a.status !== "vorschlag") bildJeSchluessel.set(schluessel(a), a.bild_url);
  // Offene Änderungen an Artikeln im Regal
  const aenderung = new Map(antraege.filter((a) => a.status === "eingereicht" && a.ean).map((a) => [a.ean!, a]));
  const regalSchluessel = new Set(artikel.map((a) => a.ean));
  const offen = antraege.filter((a) => (a.status === "eingereicht" || a.status === "abgelehnt") && !(a.ean && regalSchluessel.has(a.ean)));
  const vorschlaege = antraege.filter((a) => a.status === "vorschlag");
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

      {(von === "stammdaten" || vorschlaege.length > 0) && (
        <ol className="mp-schritte" aria-label="Onboarding">
          <li><strong>1 · Stammdaten</strong> {von === "stammdaten" ? "gespeichert ✓" : <a href="/marke/daten">prüfen und ergänzen</a>}</li>
          <li aria-current="step"><strong>2 · Artikel</strong> prüfen, Preise und Bilder ergänzen</li>
        </ol>
      )}

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

      {vorschlaege.length > 0 && (
        <section aria-labelledby="vorschlag-titel" style={{ display: "grid", gap: 12 }}>
          <h2 id="vorschlag-titel" className="mp-h2">Von uns vorbereitet, bitte prüfen</h2>
          <p className="mp-leise" style={{ fontSize: 13 }}>
            Diese Produkte haben wir für dich vorbereitet. Öffne jeden mit „Prüfen und ergänzen“, korrigiere Name und Preis, wähle die MwSt und lade ein Bild hoch. Was nicht ins Regal soll, entferne einfach.
          </p>
          <ul className="mp-artikelliste">
            {vorschlaege.map((a, i) => (
              <li key={a.id} className="mp-artikelkarte">
                <div className="mp-artikelkarte__kopf">
                  <Bild url={a.bild_url} />
                  <div>
                    <strong>{a.artikel_name}</strong>
                    <div className="mp-leise" style={{ fontSize: 13 }}>
                      {a.vk_brutto != null ? eur(Number(a.vk_brutto)) : "Preis fehlt"} · {a.mwst_satz != null ? `${a.mwst_satz} % MwSt` : "MwSt fehlt"}
                    </div>
                  </div>
                  <form action={artikelEntfernen} className="mp-artikelkarte__rechts">
                    <input type="hidden" name="id" value={a.id} />
                    <button className="mp-knopf mp-knopf--zweit mp-knopf--klein" type="submit">Entfernen</button>
                  </form>
                </div>
                <ArtikelBearbeiten
                  art="vorschlag"
                  offen={i === 0}
                  artikel={{ antragId: a.id, ean: a.ean, artikel_name: a.artikel_name, vk_brutto: a.vk_brutto, mwst_satz: a.mwst_satz, inhalt: a.inhalt, bild_url: a.bild_url }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="regal-titel" style={{ display: "grid", gap: 12 }}>
        <h2 id="regal-titel" className="mp-h2">Im Regal</h2>
        {artikel.length === 0 ? (
          <p className="mp-hinweis">Noch nichts im Regal. Sobald wir deine Artikel geprüft haben, stehen sie hier mit Bestand.</p>
        ) : (
          <ul className="mp-artikelliste">
            {artikel.map((a) => {
              const b = bestand.get(a.ean);
              const konto = b?.konto;
              const rechnerisch = konto ? konto.geliefert - konto.verkauft - konto.tasting - konto.abschrift + konto.korrektur : 0;
              const warn = b ? b.bestand < 0 || rechnerisch !== b.bestand : false;
              const offeneAenderung = aenderung.get(a.ean);
              return (
                <li key={a.ean} className={warn ? "mp-artikelkarte mp-artikelkarte--warn" : "mp-artikelkarte"}>
                  <div className="mp-artikelkarte__kopf">
                    <Bild url={bildJeSchluessel.get(a.ean) ?? null} />
                    <div>
                      <strong>{a.artikel_name}</strong>
                      <div className="mp-mono mp-leise">{a.ean}</div>
                      {offeneAenderung && <span className="mp-marke">Änderung wird geprüft</span>}
                    </div>
                    <dl className="mp-artikelkarte__zahlen">
                      <div><dt>VK</dt><dd>{eur(Number(a.verkaufspreis))}</dd></div>
                      <div><dt>MwSt</dt><dd>{a.mwst_satz != null ? `${a.mwst_satz} %` : "–"}</dd></div>
                      <div><dt>Im Laden</dt><dd><strong>{b?.bestand ?? 0}</strong></dd></div>
                      <div><dt>Ø / Tag</dt><dd>{b?.verkauf_pro_tag ? b.verkauf_pro_tag.toLocaleString("de-DE", { maximumFractionDigits: 1 }) : "–"}</dd></div>
                      <div><dt>Reicht</dt><dd>{b?.reichweite_tage != null ? `${b.reichweite_tage} Tage` : "–"}</dd></div>
                    </dl>
                  </div>
                  <div className="mp-artikelkarte__fuss">
                    <ArtikelBearbeiten
                      art={offeneAenderung ? "antrag" : "regal"}
                      artikel={
                        offeneAenderung
                          ? { antragId: offeneAenderung.id, ean: a.ean, artikel_name: offeneAenderung.artikel_name, vk_brutto: offeneAenderung.vk_brutto, mwst_satz: offeneAenderung.mwst_satz, inhalt: offeneAenderung.inhalt, bild_url: offeneAenderung.bild_url ?? bildJeSchluessel.get(a.ean) ?? null }
                          : { ean: a.ean, artikel_name: a.artikel_name, vk_brutto: Number(a.verkaufspreis), mwst_satz: a.mwst_satz, bild_url: bildJeSchluessel.get(a.ean) ?? null }
                      }
                    />
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mp-leise" style={{ fontSize: 13 }}>
          Warenkonto: geliefert minus verkauft, Tasting und Abschrift ergibt den Bestand im Laden. Tasting-Stücke stellst du als Muster, sie werden nicht vergütet.
        </p>
      </section>

      {offen.length > 0 && (
        <section aria-labelledby="pruefung-titel" style={{ display: "grid", gap: 12 }}>
          <h2 id="pruefung-titel" className="mp-h2">Eingereicht</h2>
          <ul className="mp-artikelliste">
            {offen.map((a) => (
              <li key={a.id} className="mp-artikelkarte">
                <div className="mp-artikelkarte__kopf">
                  <Bild url={a.bild_url} />
                  <div>
                    <strong>{a.artikel_name}</strong>
                    <div className="mp-mono mp-leise">
                      {a.ean ?? "ohne EAN"}{a.inhalt ? ` · ${a.inhalt}` : ""} · {a.vk_brutto != null ? eur(Number(a.vk_brutto)) : "–"} · {a.mwst_satz != null ? `${a.mwst_satz} %` : "–"}
                    </div>
                    {a.status === "abgelehnt" ? <span className="mp-marke mp-marke--warn">abgelehnt</span> : <span className="mp-marke">wird geprüft</span>}
                  </div>
                  <form action={artikelEntfernen} className="mp-artikelkarte__rechts">
                    <input type="hidden" name="id" value={a.id} />
                    <button className="mp-knopf mp-knopf--zweit mp-knopf--klein" type="submit">Entfernen</button>
                  </form>
                </div>
                <ArtikelBearbeiten
                  art="antrag"
                  artikel={{ antragId: a.id, ean: a.ean, artikel_name: a.artikel_name, vk_brutto: a.vk_brutto, mwst_satz: a.mwst_satz, inhalt: a.inhalt, bild_url: a.bild_url }}
                />
              </li>
            ))}
          </ul>
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
