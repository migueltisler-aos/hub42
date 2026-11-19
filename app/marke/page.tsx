import type { Metadata } from "next";
import Link from "next/link";
import { ladeDashboard, ladeKonditionen, requireMarke } from "@/lib/marke";
import { ladeFunnel } from "@/lib/zaehlung";
import { abrechnungsGrenzen, euro } from "@/lib/abrechnung-model";
import { datumZeit, monatName } from "./format";

export const metadata: Metadata = { title: "Übersicht" };
export const dynamic = "force-dynamic";

export default async function MarkeUebersicht() {
  const m = await requireMarke();
  const [d, k, f] = await Promise.all([ladeDashboard(m.brandId), ladeKonditionen(m.brandId), ladeFunnel(m.brandId)]);
  const v = d.vorschau;

  return (
    <>
      <div className="mp-kopfzeile">
        <div>
          <h1 className="mp-h1">{m.brandName}</h1>
          <p className="mp-leise mp-mono">
            Stand {d.letzterSync ? datumZeit(d.letzterSync) : "unbekannt"} · Verkäufe kommen mit wenigen Minuten Verzug
          </p>
        </div>
      </div>

      {(!k || k.status === "entwurf") && (
        <div className="mp-hinweis mp-hinweis--warn">
          <strong>Onboarding offen.</strong> Für die erste Auszahlung brauchen wir Firma, Steuer- und Bankdaten und deine
          Zustimmung zur Gutschrift. <Link href="/marke/daten">Jetzt ausfüllen</Link>
        </div>
      )}
      {k?.status === "eingereicht" && (
        <div className="mp-hinweis">Deine Stammdaten sind eingereicht, wir prüfen sie gerade.</div>
      )}

      <section className="mp-raster" aria-label="Abverkauf">
        <Kachel titel="Heute" stueck={d.heute.stueck} ct={d.heute.umsatz_ct} />
        <Kachel titel="Letzte 7 Tage" stueck={d.sieben.stueck} ct={d.sieben.umsatz_ct} />
        <Kachel titel={monatName(d.zeitraum)} stueck={d.monat.stueck} ct={d.monat.umsatz_ct} />
        <div className="mp-kachel mp-kachel--licht">
          <span className="mp-mono">Voraussichtliche Auszahlung {monatName(d.zeitraum)}</span>
          <span className="mp-zahl">{euro(v.auszahlung_ct)}</span>
          <span style={{ fontSize: 13 }}>
            {v.vortrag_neu_ct > 0
              ? `Die Regalmiete ist höher als der Erlös, offen bleiben ${euro(v.vortrag_neu_ct)}.`
              : "Überweisung bis zum 10. des Folgemonats"}
          </span>
        </div>
      </section>

      <section className="mp-karte" aria-labelledby="funnel-titel">
        <h2 id="funnel-titel" className="mp-h2">Vom Laden zum Kauf</h2>
        {f.zaehltage === 0 ? (
          <p className="mp-leise">Noch keine Zähltage in den letzten {f.tage} Tagen. Sobald unser Team im Laden zählt, steht hier dein Weg vom Besuch bis zum Kauf.</p>
        ) : (
          <>
            <ol className="mp-funnel">
              {[
                { label: "Im Laden", wert: f.besucher, basis: 0, bezug: "" },
                { label: "Am Regal", wert: f.regal, basis: f.besucher, bezug: "im Laden" },
                { label: "Gekostet", wert: f.gekostet, basis: f.regal, bezug: "am Regal" },
                f.regal
                  ? { label: "Gekauft", wert: f.gekauft, basis: f.regal, bezug: "am Regal" }
                  : { label: "Gekauft", wert: f.gekauft, basis: f.besucher, bezug: "im Laden" },
              ].map((s, i) => (
                <li key={s.label} className="mp-funnel__stufe" style={{ ["--breite" as string]: `${f.besucher ? Math.max(8, (s.wert / f.besucher) * 100) : 100}%` }}>
                  <span className="mp-mono">{i + 1} · {s.label}</span>
                  <span className="mp-zahl" style={{ fontSize: 28 }}>{s.wert}</span>
                  <span className="mp-leise" style={{ fontSize: 13 }}>{i === 0 ? "Besucher gesamt" : s.basis ? `${Math.round((s.wert / s.basis) * 100)} % von ${s.bezug}` : "–"}</span>
                  <div className="mp-funnel__balken" aria-hidden />
                </li>
              ))}
            </ol>
            <p className="mp-leise" style={{ fontSize: 13 }}>
              Letzte {f.tage} Tage, nur die {f.zaehltage} {f.zaehltage === 1 ? "Tag" : "Tage"}, an denen unser Team im Laden gezählt hat. „Im Laden“ sind
              alle Besucher, nicht nur deine. „Gekauft“ sind Einkäufe mit mindestens einem deiner Artikel.
            </p>
          </>
        )}
      </section>

      <section className="mp-karte" aria-labelledby="rechnung-titel">
        <h2 id="rechnung-titel" className="mp-h2">So rechnet sich die Auszahlung</h2>
        <div className="mp-tabelle-rahmen">
          <table className="mp-tabelle">
            <tbody>
              <tr><td>Verkaufserlös brutto</td><td className="z">{euro(v.umsatz_brutto_ct)}</td></tr>
              <tr><td>Provision {Number(k?.provision_pct ?? 7).toLocaleString("de-DE")} % (inkl. USt)</td><td className="z">− {euro(v.umsatz_brutto_ct - v.gs_brutto_ct)}</td></tr>
              <tr><td>Gutschrift an dich (brutto)</td><td className="z">{euro(v.gs_brutto_ct)}</td></tr>
              <tr><td>Regalmiete {monatName(d.zeitraum)} inkl. 19 % USt</td><td className="z">− {euro(v.rg_brutto_ct)}</td></tr>
              {v.vortrag_alt_ct > 0 && (
                <tr><td>Offen aus dem Vormonat</td><td className="z">− {euro(v.vortrag_alt_ct)}</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr><td>Auszahlung</td><td className="z">{euro(v.auszahlung_ct)}</td></tr>
            </tfoot>
          </table>
        </div>
        <p className="mp-leise" style={{ fontSize: 13 }}>
          {abrechnungsGrenzen(d.zeitraum).abTag && "Verkäufe bis einschließlich 19.11.2026 haben wir dir bereits ausbezahlt, hier zählen nur Verkäufe ab dem 20.11. "}
          Vorläufig bis zum Monatsende. Tasting-Stücke und Abschriften sind keine Verkäufe und tauchen hier nicht auf, du
          findest sie unter <Link href="/marke/artikel">Artikel</Link>.
          {v.fehlender_satz.length > 0 && " Für einzelne Artikel fehlt noch der MwSt-Satz, sie sind vorläufig mit 7 % gerechnet."}
        </p>
      </section>

      <section aria-labelledby="artikel-titel" style={{ display: "grid", gap: 12 }}>
        <h2 id="artikel-titel" className="mp-h2">Abverkauf je Artikel</h2>
        {d.jeArtikel.length === 0 ? (
          <p className="mp-hinweis">Noch keine Artikel im Regal. Sobald wir deine Artikel freigegeben haben, stehen sie hier.</p>
        ) : (
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th className="z">Heute</th>
                  <th className="z">7 Tage</th>
                  <th className="z">{monatName(d.zeitraum)}</th>
                  <th className="z">30 Tage</th>
                </tr>
              </thead>
              <tbody>
                {d.jeArtikel.map((a) => (
                  <tr key={a.ean}>
                    <td>{a.name}<div className="mp-mono mp-leise">{a.ean}</div></td>
                    <td className="z">{a.heute}</td>
                    <td className="z">{a.sieben}</td>
                    <td className="z">{a.monat}</td>
                    <td className="z">{a.dreissig}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Kachel({ titel, stueck, ct }: { titel: string; stueck: number; ct: number }) {
  return (
    <div className="mp-kachel">
      <span className="mp-mono">{titel}</span>
      <span className="mp-zahl">{stueck} Stück</span>
      <span>{euro(ct)} Umsatz</span>
    </div>
  );
}
