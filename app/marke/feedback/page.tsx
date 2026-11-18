import type { Metadata } from "next";
import { ladeFeedback, N_FEEDBACK, requireMarke } from "@/lib/marke";
import { datum } from "../format";

export const metadata: Metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

// Hedonik-Skala 1–9 (lib/feedback.ts HEDONIC_FACES)
const SKALA = ["sehr schlecht", "", "", "", "neutral", "", "", "", "hervorragend"];

export default async function MarkeFeedback() {
  const m = await requireMarke();
  const produkte = await ladeFeedback(m.brandId);

  return (
    <>
      <div className="mp-kopfzeile">
        <h1 className="mp-h1">Feedback</h1>
        <p className="mp-leise mp-mono">Bewertungen aus der Feedback Factory im Laden</p>
      </div>
      <p className="mp-leise" style={{ fontSize: 13 }}>
        Kundinnen bewerten im Laden per QR-Code auf einer Skala von 1 (sehr schlecht) bis 9 (hervorragend). Werte zeigen wir
        ab {N_FEEDBACK} Bewertungen je Produkt, vorher ist eine einzelne Stimme zu laut.
      </p>

      {produkte.length === 0 && (
        <p className="mp-hinweis">Für deine Marke gibt es noch keine Produkte in der Feedback Factory.</p>
      )}

      {produkte.map((p) => {
        const max = Math.max(1, ...p.verteilung);
        return (
          <section key={p.id} className="mp-karte" aria-labelledby={`fb-${p.id}`}>
            <div className="mp-kopfzeile">
              <h2 id={`fb-${p.id}`} className="mp-h2">{p.name}</h2>
              <span className="mp-mono">{p.n} Bewertungen</span>
            </div>
            {p.hedonik_mittel === null ? (
              <p className="mp-leise">
                Noch zu wenig Daten: {p.n} von {N_FEEDBACK} Bewertungen.
              </p>
            ) : (
              <>
                <p>
                  <span className="mp-zahl">{p.hedonik_mittel.toLocaleString("de-DE", { maximumFractionDigits: 1 })}</span>{" "}
                  <span className="mp-leise">von 9 im Mittel</span>
                </p>
                <div style={{ display: "grid", gap: 4 }} aria-label="Verteilung der Bewertungen">
                  {p.verteilung.map((anzahl, i) => (
                    <div key={i} className="mp-balken">
                      <span className="mp-mono">{i + 1}{SKALA[i] ? ` ${SKALA[i]}` : ""}</span>
                      <div className="mp-balken__spur"><div className="mp-balken__wert" style={{ width: `${(anzahl / max) * 100}%` }} /></div>
                      <span className="mp-mono" style={{ textAlign: "right" }}>{anzahl}</span>
                    </div>
                  ))}
                </div>
                {p.kommentare.length > 0 && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <h3 className="mp-mono">Kommentare</h3>
                    <ul style={{ display: "grid", gap: 8 }}>
                      {p.kommentare.map((c, i) => (
                        <li key={i} className="mp-hinweis" style={{ fontSize: 14 }}>
                          „{c.text}“ <span className="mp-mono mp-leise">{datum(c.datum)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
