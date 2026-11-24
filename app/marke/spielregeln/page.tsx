import type { Metadata } from "next";
import { aktuelleMarke, ladeArtikelAntraege, ladeKonditionen } from "@/lib/marke";
import { euro, inCent } from "@/lib/abrechnung-model";
import {
  FAIR,
  REGELN,
  RETAILTEST,
  SPIELREGELN_TITEL,
  SPIELREGELN_VERSION,
  VERKAUFSTEAM_FRAGEN,
  VERSPRECHEN,
  type Absatz,
} from "@/lib/spielregeln";
import { datum } from "../format";
import DruckKnopf from "./DruckKnopf";

export const metadata: Metadata = { title: "Spielregeln" };
export const dynamic = "force-dynamic";

const LEER = "________________";

function Absaetze({ text }: { text: Absatz[] }) {
  return (
    <>
      {text.map((a, i) =>
        typeof a === "string" ? (
          <p key={i}>{a}</p>
        ) : (
          <ul key={i} className="sr-liste">
            {a.liste.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )
      )}
    </>
  );
}

/**
 * Die Partnervereinbarung zum Lesen und Drucken. Öffentlich erreichbar, damit wir
 * den Link jeder Marke schicken können; eingeloggt füllt sich die Anlage mit den
 * Daten der Marke, sonst bleibt sie zum Ausfüllen auf Papier leer.
 */
export default async function Spielregeln() {
  const m = await aktuelleMarke();
  const [k, artikel] = m ? await Promise.all([ladeKonditionen(m.brandId), ladeArtikelAntraege(m.brandId)]) : [null, []];
  const vt = k?.verkaufsteam ?? {};
  const wert = (v: string | null | undefined) => (v && v.trim() ? v : LEER);
  const anschrift = k ? [k.strasse, [k.plz, k.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";
  const steuer = k?.ust_idnr ? `USt-ID ${k.ust_idnr}` : k?.steuernummer ? `Steuernummer ${k.steuernummer}` : LEER;

  const anlage: [string, React.ReactNode][] = [
    ["Marke, Firma, Anschrift", m ? <>{m.brandName}<br />{wert(k?.firma)}<br />{wert(anschrift)}</> : LEER],
    ["Ansprechperson, E-Mail, Telefon", k ? <>{wert(k.ansprechpartner)}<br />{wert(k.rechnungs_email)}<br />{wert(k.telefon)}</> : LEER],
    ["USt-ID / Kleinunternehmer", k ? `${steuer}, Kleinunternehmer: ${k.kleinunternehmer ? "ja" : "nein"}` : `${LEER}  Kleinunternehmer ☐ ja ☐ nein`],
    ["Standort Retailtest", RETAILTEST.laden],
    ["Teststart und Testende", RETAILTEST.zeitraum],
    ["Lieferadresse und spätester Liefertermin", <>{RETAILTEST.lieferadresse}<br />spätestens {RETAILTEST.lieferfrist}</>],
    ["Rücksendeadresse für Restware", k?.firma ? `${k.firma}, ${anschrift}` : LEER],
    ["Regalmiete", RETAILTEST.regalmiete],
    ["Provision", k ? `${Number(k.provision_pct).toLocaleString("de-DE")} % auf den Bruttoverkaufspreis` : RETAILTEST.provision],
    ["Abrechnung", k?.gutschrift_zustimmung_am ? `Gutschrift durch uns, zugestimmt am ${datum(k.gutschrift_zustimmung_am)}` : "☐ Rechnung durch die Marke ☐ Gutschrift durch uns"],
    [
      "Produkte mit Verkaufspreis brutto, Liefermenge",
      artikel.length ? (
        <ul className="sr-liste">
          {artikel.map((a) => (
            <li key={a.id}>
              {a.artikel_name}
              {a.vk_brutto ? `, ${euro(inCent(Number(a.vk_brutto)))}` : ""}
              {a.inhalt ? `, ${a.inhalt}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        LEER
      ),
    ],
    ["Bankverbindung für Auszahlungen", k?.iban ? `${k.kontoinhaber ?? ""}, IBAN endet auf ${k.iban.slice(-4)}` : LEER],
  ];

  return (
    <article className="sr">
      <div className="mp-kopfzeile">
        <div>
          <h1 className="mp-h1">{SPIELREGELN_TITEL}</h1>
          <p className="mp-leise mp-mono">
            Fassung {datum(SPIELREGELN_VERSION)}
            {m ? ` · für ${m.brandName}` : ""}
          </p>
        </div>
        <DruckKnopf />
      </div>

      {m && (
        <p className={k?.spielregeln_angenommen_am ? "mp-hinweis" : "mp-hinweis mp-hinweis--warn"}>
          {k?.spielregeln_angenommen_am ? (
            `Angenommen am ${datum(k.spielregeln_angenommen_am)} (Fassung ${datum(k.spielregeln_version ?? SPIELREGELN_VERSION)}).`
          ) : (
            <>
              Noch nicht angenommen. Das geht in den Stammdaten, ganz unten.{" "}
              <a href="/marke/daten" className="mp-druck-aus">Zu den Stammdaten</a>
            </>
          )}
        </p>
      )}

      <section className="mp-karte">
        <h2 className="mp-h2">Teil 1: Unser Versprechen</h2>
        <Absaetze text={VERSPRECHEN} />
      </section>

      <section className="mp-karte">
        <h2 className="mp-h2">Fair verteilt</h2>
        <p>Jede Pflicht hat ein Gegenstück. Das ist der Kern dieser Vereinbarung.</p>
        <div className="mp-tabelle-rahmen">
          <table className="mp-tabelle">
            <thead>
              <tr>
                <th>Thema</th>
                <th>Wir sagen zu</th>
                <th>Du sagst zu</th>
              </tr>
            </thead>
            <tbody>
              {FAIR.map((z) => (
                <tr key={z.thema}>
                  <td><strong>{z.thema}</strong></td>
                  <td>{z.wir}</td>
                  <td>{z.du}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mp-karte">
        <h2 className="mp-h2">Teil 2: Die Spielregeln</h2>
        <p>Diese Regeln sind verbindlich. Wir haben sie so kurz und klar geschrieben, wie es geht.</p>
        <ol className="sr-regeln">
          {REGELN.map((r, i) => (
            <li key={r.titel}>
              <strong>
                {i + 1}. {r.titel}.
              </strong>{" "}
              <Absaetze text={r.text} />
            </li>
          ))}
        </ol>
      </section>

      <section className="mp-karte sr-seitenwechsel">
        <h2 className="mp-h2">Anlage: Dein Paket</h2>
        <p>Die Spielregeln bleiben für alle gleich. Nur diese Anlage ändert sich je Marke und Angebot.</p>
        <div className="mp-tabelle-rahmen">
          <table className="mp-tabelle">
            <tbody>
              {anlage.map(([feld, inhalt]) => (
                <tr key={feld}>
                  <th scope="row">{feld}</th>
                  <td>{inhalt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mp-h2" style={{ fontSize: 18 }}>Für unser Verkaufsteam</h3>
        <p>Du kennst dein Produkt am besten. Erzähl uns, wie wir es verkaufen sollen.</p>
        <div className="mp-tabelle-rahmen">
          <table className="mp-tabelle">
            <tbody>
              <tr>
                <th scope="row">Tasting gewünscht?</th>
                <td>{vt.tasting === true ? "☒ ja ☐ nein" : vt.tasting === false ? "☐ ja ☒ nein" : "☐ ja ☐ nein"}</td>
              </tr>
              {VERKAUFSTEAM_FRAGEN.map((q) => (
                <tr key={q.key}>
                  <th scope="row">
                    {q.frage}
                    {q.hilfe ? <small className="mp-leise"> ({q.hilfe})</small> : null}
                  </th>
                  <td>{wert(typeof vt[q.key] === "string" ? (vt[q.key] as string) : null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mp-karte">
        <h2 className="mp-h2">Unterschriften</h2>
        {k?.spielregeln_angenommen_am ? (
          <p>
            Online angenommen für {m?.brandName} am {datum(k.spielregeln_angenommen_am)} über das Marken-Portal ({m?.email}). Eine
            Unterschrift auf Papier ist nicht nötig.
          </p>
        ) : (
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead>
                <tr>
                  <th />
                  <th>Testkaufhaus (Hub42 UG)</th>
                  <th>Marke</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">Ort, Datum</th><td>{LEER}</td><td>{LEER}</td></tr>
                <tr><th scope="row">Name</th><td>Miguel Tisler</td><td>{LEER}</td></tr>
                <tr><th scope="row">Unterschrift</th><td>{LEER}</td><td>{LEER}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  );
}
