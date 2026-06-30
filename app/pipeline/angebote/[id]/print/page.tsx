import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAngebot,
  computeAngebot,
  formatEUR,
  positionMonatlich,
  positionEinmalig,
  MWST_PCT,
  regalflaecheCm2,
  lagerGesamtCm2,
  tastingMenge,
  cm2ToM2,
  LAGER_TIEFE_CM,
  type Position,
} from "@/lib/angebote";
import PrintButton from "./PrintButton";

const GREEN = "#2A4A3C";
const BRONZE = "#C8964A";
const INK = "#2A2A2A";
const MUTED = "#6B6B6B";
const LINE = "#D8D2C6";

export default async function AngebotPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getAngebot(id);
  if (!a) notFound();

  const sum = computeAngebot(a.positionen, a.laufzeit_monate);
  const laufende = a.positionen.filter((p) => !p.einmalig);
  const einmalige = a.positionen.filter((p) => p.einmalig);

  const heute = new Date().toLocaleDateString("de-DE");
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("de-DE") : "—";

  return (
    <div style={{ background: "#EDE9E0", minHeight: "100vh" }}>
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .doc { box-shadow: none !important; margin: 0 !important; }
        }
        .doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      {/* Toolbar – nicht gedruckt */}
      <div
        className="no-print"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "16px 8px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href={`/pipeline/angebote/${a.id}`} style={{ color: GREEN, fontSize: 13, fontFamily: "monospace" }}>
          ← zurück zum Angebot
        </Link>
        <PrintButton />
      </div>

      {/* Dokument */}
      <div
        className="doc"
        style={{
          maxWidth: 820,
          margin: "0 auto 48px",
          background: "#fff",
          color: INK,
          padding: "48px 56px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {/* Kopf */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, color: GREEN }}>HUB42</div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, marginTop: 2 }}>
              Retail-as-a-Service · Kuratierter Regalplatz
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: MUTED }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: INK, letterSpacing: 1 }}>ANGEBOT</div>
            <div style={{ marginTop: 6 }}>Nr. {a.angebot_nr}</div>
            <div>Datum: {heute}</div>
            <div>Gültig bis: {fmtDate(a.gueltig_bis)}</div>
          </div>
        </div>

        {/* Empfänger */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: BRONZE, textTransform: "uppercase", marginBottom: 4 }}>
            Für
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{a.empfaenger_name ?? "—"}</div>
          {a.ansprechpartner && <div style={{ color: MUTED }}>z. Hd. {a.ansprechpartner}</div>}
        </div>

        {a.titel && (
          <div style={{ fontSize: 18, fontWeight: 700, color: GREEN, marginBottom: 8 }}>{a.titel}</div>
        )}
        <p style={{ color: MUTED, marginBottom: 28 }}>
          Vielen Dank für dein Interesse an Hub42. Nachfolgend unser Angebot für deinen kuratierten
          Regalplatz mit einer Laufzeit von <strong style={{ color: INK }}>{a.laufzeit_monate} Monaten</strong>
          {a.start_datum ? <> ab dem {fmtDate(a.start_datum)}</> : null}.
        </p>

        {/* Leistungsumfang / Eckdaten */}
        <div style={{ marginBottom: 28, border: `1px solid ${LINE}` }}>
          <SpecRow label="Laufzeit" value={`${a.laufzeit_monate} Monate${a.start_datum ? ` ab ${fmtDate(a.start_datum)}` : ""}`} highlight />
          {a.gemietete_breite_cm ? (
            <SpecRow
              label="Regalfläche (sichtbar)"
              value={`${a.gemietete_breite_cm} cm Breite × ${LAGER_TIEFE_CM} cm Tiefe = ${regalflaecheCm2(a.gemietete_breite_cm).toLocaleString("de-DE")} cm²`}
            />
          ) : null}
          {a.gemietete_breite_cm ? (
            <SpecRow
              label="Nachschublager (unsichtbar)"
              value={`gleiche Fläche · Lager gesamt ${lagerGesamtCm2(a.gemietete_breite_cm).toLocaleString("de-DE")} cm² (≈ ${cm2ToM2(lagerGesamtCm2(a.gemietete_breite_cm))} m²)`}
            />
          ) : null}
          {a.max_artikel ? (
            <SpecRow label="Max. Bestückung" value={`${a.max_artikel.toLocaleString("de-DE")} Stück`} />
          ) : null}
          <SpecRow
            label="Tasting"
            value={
              a.tasting
                ? `inklusive · ${tastingMenge(a.max_artikel ?? 0, a.tasting_pct)} Stück (${a.tasting_pct}% der Bestückung) als Muster bereitstellen`
                : "nicht enthalten"
            }
          />
          {a.nachschub_email ? (
            <SpecRow label="Nachschub bestellen an" value={a.nachschub_email} last />
          ) : null}
        </div>

        {/* Positionen */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${GREEN}` }}>
              <th style={thLeft}>Leistung</th>
              <th style={thRight}>Menge</th>
              <th style={thRight}>Einzel (netto)</th>
              <th style={thRight}>pro Monat</th>
            </tr>
          </thead>
          <tbody>
            {laufende.map((p, i) => (
              <PosRow key={`l${i}`} p={p} amount={positionMonatlich(p)} />
            ))}
            {laufende.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "10px 8px", color: MUTED }}>—</td></tr>
            )}
          </tbody>
        </table>

        {/* Laufende Summe */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <table style={{ width: 320 }}>
            <tbody>
              <SumRow label="Monatlich netto" value={formatEUR(sum.monatlichNetto)} />
              <SumRow
                label={`Laufzeit ${a.laufzeit_monate} Monate`}
                value={formatEUR(sum.monatlichNetto * a.laufzeit_monate)}
              />
            </tbody>
          </table>
        </div>

        {/* Einmalige Positionen */}
        {einmalige.length > 0 && (
          <>
            <div style={{ fontSize: 10, letterSpacing: 2, color: BRONZE, textTransform: "uppercase", margin: "20px 0 6px" }}>
              Einmalig
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {einmalige.map((p, i) => (
                  <PosRow key={`e${i}`} p={p} amount={positionEinmalig(p)} />
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Gesamtsummen */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <table style={{ width: 320 }}>
            <tbody>
              {einmalige.length > 0 && (
                <SumRow label="Einmalig netto" value={formatEUR(sum.einmaligNetto)} />
              )}
              <SumRow label="Gesamt netto" value={formatEUR(sum.gesamtNetto)} bold />
              <SumRow label={`zzgl. ${MWST_PCT}% MwSt.`} value={formatEUR(sum.mwst)} />
              <tr style={{ borderTop: `2px solid ${GREEN}` }}>
                <td style={{ padding: "8px 8px", fontWeight: 800, color: GREEN }}>Gesamt brutto</td>
                <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 800, color: GREEN, fontSize: 16 }}>
                  {formatEUR(sum.gesamtBrutto)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Was wir von dir brauchen */}
        {a.deliverables.length > 0 && (
          <div style={{ marginTop: 36, padding: 20, background: "#F6F3EC", border: `1px solid ${LINE}` }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: BRONZE, textTransform: "uppercase", marginBottom: 10 }}>
              Was wir für den Start von dir brauchen
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {a.deliverables.map((d, i) => (
                <li key={i} style={{ display: "flex", gap: 10, padding: "4px 0", color: INK }}>
                  <span style={{ color: d.status === "erhalten" ? GREEN : BRONZE, fontWeight: 700 }}>
                    {d.status === "erhalten" ? "✓" : "▢"}
                  </span>
                  <span style={{ textDecoration: d.status === "erhalten" ? "line-through" : "none", color: d.status === "erhalten" ? MUTED : INK }}>
                    {d.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Konditionen */}
        <div style={{ marginTop: 28, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
          <strong style={{ color: INK }}>Konditionen.</strong> Verkauf erfolgt in Kommission
          (Konsignation gem. § 383 HGB) – du bleibst Eigentümer der Ware und behältst die Preishoheit.
          Abrechnung der Slot-Miete monatlich im Voraus. Mindestlaufzeit gem. oben genannter Laufzeit.
          Es gelten unsere AGB. Angebot freibleibend bis zum genannten Gültigkeitsdatum.
        </div>

        {/* Unterschrift */}
        <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 6, fontSize: 12, color: MUTED }}>
              Ort, Datum · Unterschrift {a.empfaenger_name ?? "Kunde"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 6, fontSize: 12, color: MUTED }}>
              Hub42 UG · Miguel Tisler
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: `1px solid ${LINE}`, fontSize: 10, color: MUTED, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            Hub42 UG (haftungsbeschränkt)<br />
            c/o Valuedfriends Innovation GmbH<br />
            Spreeinsel 6 · 15848 Beeskow
          </div>
          <div>
            Geschäftsführer: Miguel Tisler<br />
            Amtsgericht Frankfurt (Oder) · HRB 22313 FF<br />
            Steuernr. 061/281/00774
          </div>
          <div>
            info@tryhub42.de<br />
            tryhub42.de
          </div>
        </div>
      </div>
    </div>
  );
}

const thLeft: React.CSSProperties = { textAlign: "left", padding: "8px 8px", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: GREEN };
const thRight: React.CSSProperties = { ...thLeft, textAlign: "right" };

function PosRow({ p, amount }: { p: Position; amount: number }) {
  return (
    <tr style={{ borderBottom: `1px solid ${LINE}` }}>
      <td style={{ padding: "10px 8px", color: INK }}>{p.label || "—"}</td>
      <td style={{ padding: "10px 8px", textAlign: "right", color: MUTED, whiteSpace: "nowrap" }}>
        {p.menge} {p.einheit}
      </td>
      <td style={{ padding: "10px 8px", textAlign: "right", color: MUTED, whiteSpace: "nowrap" }}>
        {formatEUR(p.einzelpreisMonat)}
      </td>
      <td style={{ padding: "10px 8px", textAlign: "right", color: INK, whiteSpace: "nowrap", fontWeight: 600 }}>
        {formatEUR(amount)}
      </td>
    </tr>
  );
}

function SpecRow({
  label,
  value,
  highlight,
  last,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "10px 14px",
        borderBottom: last ? "none" : `1px solid ${LINE}`,
        background: highlight ? "#F6F3EC" : "#fff",
      }}
    >
      <div style={{ width: 200, flexShrink: 0, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: highlight ? GREEN : MUTED, fontWeight: highlight ? 700 : 400 }}>
        {label}
      </div>
      <div style={{ color: INK, fontWeight: highlight ? 700 : 400 }}>{value}</div>
    </div>
  );
}

function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td style={{ padding: "5px 8px", color: bold ? INK : MUTED, fontWeight: bold ? 700 : 400 }}>{label}</td>
      <td style={{ padding: "5px 8px", textAlign: "right", color: INK, fontWeight: bold ? 700 : 500, whiteSpace: "nowrap" }}>
        {value}
      </td>
    </tr>
  );
}
