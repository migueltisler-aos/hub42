/* "Sagen ist nicht Tun": warum wir an der Kasse messen, und auf welchen
   fünf Ebenen. Partnerzeile und Pilotzahlen nur mit SHOW_PARTNER. */

import { CookingPot, MessagesSquare, QrCode, ShoppingBasket, Users } from "lucide-react";
import { SHOW_PARTNER } from "@/lib/site-flags";

const EBENEN = [
  { Icon: QrCode, t: "QR-Feedback am Regal" },
  { Icon: CookingPot, t: "Tasting und Verprobung" },
  { Icon: Users, t: "Demografisches Profil" },
  { Icon: MessagesSquare, t: "Interview am PoS" },
  { Icon: ShoppingBasket, t: "Abverkauf und Warenkorb" },
];

/* Pilot "Kaufhaus des Testens" / Feedback Factory, Zahlen von BIFI. */
const PILOT = [
  { v: "217", k: "Produkte in sechs Monaten, 2018" },
  { v: "15.600", k: "verkaufte Positionen, rund" },
  { v: "91", k: "Presseberichte" },
  { v: "2019", k: "Europäischer Innovationspreis Handel" },
];

export default function SagenTun() {
  return (
    <section className="sect sect--rule">
      <div className="wrap">
        <p className="eyebrow">Warum eine echte Kasse</p>
        <h2>Sagen ist nicht Tun.</h2>
        <p className="lede" style={{ marginTop: 20, maxWidth: "54ch" }}>
          Was Menschen in Umfragen sagen und was sie an der Kasse tun, liegt auseinander.
          Hypothetische Zahlungsbereitschaft liegt im Mittel gut 20 % über der tatsächlich
          bezahlten. Wir messen beides am selben Produkt.
        </p>

        <ul className="levels" aria-label="Die fünf Erhebungsebenen">
          {EBENEN.map(({ Icon, t }, i) => (
            <li key={t} className="level">
              <Icon className="level__ic" size={26} strokeWidth={1.5} aria-hidden="true" />
              <span className="level__n">0{i + 1}</span>
              <span className="level__t">{t}</span>
            </li>
          ))}
        </ul>

        <p className="fineprint">
          Quelle: Schmidt, J. und Bijmolt, T. H. A. (2020): Accurately measuring willingness to pay
          for consumer goods. A meta-analysis of the hypothetical bias. Journal of the Academy of
          Marketing Science 48, Heft 3. Metaanalyse über 77 Studien, im Mittel 21 %.
        </p>

        {SHOW_PARTNER && (
          <>
            <p className="partner">
              Hub42 betreibt den Laden, das Berliner Institut für Innovationsforschung (BIFI)
              verantwortet die wissenschaftliche Methodik.
            </p>
            <div className="factbar factbar--pilot">
              {PILOT.map((f) => (
                <div className="fact" key={f.k}>
                  <p className="fact__v">{f.v}</p>
                  <p className="fact__k">{f.k}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
