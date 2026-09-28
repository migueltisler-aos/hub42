/* #beratung: 1:1-Beratung auf dem Weg in den Handel, BAFA-förderfähig.
   Wird nur gerendert, wenn SHOW_BAFA an ist (Aufrufer prüft). */

import {
  BAFA_BEMESSUNG_NETTO,
  BAFA_ZUSCHUSS_PCT,
  BERATUNG_HINWEISE,
  BERATUNG_THEMEN,
  eigenanteil,
} from "@/lib/beratung";
import { eur0 } from "@/lib/treppe";

export default function BeratungSektion() {
  return (
    <section className="sect sect--rule sect--deep" id="beratung">
      <div className="wrap">
        <p className="eyebrow">Beratung auf dem Weg in den Handel</p>
        <h2>Beratung, die bis zu {BAFA_ZUSCHUSS_PCT.neu} % gefördert werden kann.</h2>
        <p className="lede" style={{ marginTop: 20, maxWidth: "54ch" }}>
          Neben der Treppe gibt es eine 1:1-Beratung. Durchgeführt von Miguel Tisler, 20 Jahre
          Erfahrung in Handel und Supply Chain.
        </p>

        <div className="advice">
          <ul className="advice__topics">
            {BERATUNG_THEMEN.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <div>
            <p className="advice__txt">
              Über das BAFA-Programm „Förderung von Unternehmensberatungen für KMU“ kann die
              Beratung bezuschusst werden. Bemessungsgrundlage bis {eur0(BAFA_BEMESSUNG_NETTO)}{" "}
              netto pro Beratung. Der Zuschuss richtet sich nach dem Sitz deiner Firma: bis zu{" "}
              {BAFA_ZUSCHUSS_PCT.neu} % in den neuen Bundesländern, bis zu {BAFA_ZUSCHUSS_PCT.alt} %
              in den alten Bundesländern und Berlin.
            </p>

            <table className="rate rate--stack rate--small">
              <thead>
                <tr>
                  <th scope="col">Beispiel</th>
                  <th scope="col">Beratung netto</th>
                  <th scope="col">Zuschuss bis zu</th>
                  <th scope="col">Eigenanteil</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Sitz in Brandenburg</th>
                  <td data-label="Beratung netto">{eur0(BAFA_BEMESSUNG_NETTO)}</td>
                  <td data-label="Zuschuss bis zu">{BAFA_ZUSCHUSS_PCT.neu} %</td>
                  <td data-label="Eigenanteil">{eur0(eigenanteil(BAFA_ZUSCHUSS_PCT.neu))}</td>
                </tr>
                <tr>
                  <th scope="row">Sitz in Berlin</th>
                  <td data-label="Beratung netto">{eur0(BAFA_BEMESSUNG_NETTO)}</td>
                  <td data-label="Zuschuss bis zu">{BAFA_ZUSCHUSS_PCT.alt} %</td>
                  <td data-label="Eigenanteil">{eur0(eigenanteil(BAFA_ZUSCHUSS_PCT.alt))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="fineprint">
          {BERATUNG_HINWEISE.map((h, i) => (
            <span key={h}>
              {i > 0 && <br />}
              {h}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
