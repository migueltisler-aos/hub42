import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAngebot,
  computeAngebot,
  formatEUR,
  positionMonatlich,
  positionEinmalig,
  ebeneM2,
  flaecheM2,
  gesamtBreiteCm,
  MWST_PCT,
  PREIS_PRO_QM,
  MINDESTMIETE_MONAT,
  KUENDIGUNG_VORLAUF_MONATE,
  REGAL_TIEFE_CM,
} from "@/lib/angebote";
import PrintButton from "./PrintButton";

const GREEN = "#2A4A3C";
const BRONZE = "#C8964A";
const INK = "#2A2A2A";
const MUTED = "#777067";
const LINE = "#E2DDD2";

const fmtM2 = (m2: number) =>
  `${m2.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;

export default async function AngebotPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getAngebot(id);
  if (!a) notFound();

  const sum = computeAngebot(a.positionen, a.laufzeit_monate, a.ebenen ?? []);
  const ebenen = (a.ebenen ?? []).filter((e) => e.cm > 0);
  const laufende = a.positionen.filter((p) => !p.einmalig);
  const einmalige = a.positionen.filter((p) => p.einmalig);
  const totalM2 = flaecheM2(ebenen);
  const breite = gesamtBreiteCm(ebenen);

  const heute = new Date().toLocaleDateString("de-DE");
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "—");

  return (
    <div style={{ background: "#EDE9E0", minHeight: "100vh" }}>
      <style>{`
        @page { size: A4; margin: 18mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .doc { box-shadow: none !important; margin: 0 !important; }
        }
        .doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      {/* Toolbar – nicht gedruckt */}
      <div className="no-print" style={{ maxWidth: 820, margin: "0 auto", padding: "16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href={`/pipeline/angebote/${a.id}`} style={{ color: GREEN, fontSize: 13, fontFamily: "monospace" }}>
          ← zurück
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
          padding: "56px 60px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {/* Kopf-Band */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 12, borderBottom: `2px solid ${BRONZE}` }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 3, color: GREEN }}>HUB42</div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 4, color: BRONZE }}>ANGEBOT</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginTop: 6, letterSpacing: 0.5 }}>
          <span>Retail-as-a-Service · Kuratierter Regalplatz</span>
          <span>Nr. {a.angebot_nr} · {heute}</span>
        </div>

        {/* Empfänger */}
        <div style={{ marginTop: 40, marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: BRONZE, textTransform: "uppercase", marginBottom: 4 }}>Für</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: INK }}>{a.empfaenger_name ?? "—"}</div>
          {a.ansprechpartner && <div style={{ color: MUTED }}>z. Hd. {a.ansprechpartner}</div>}
        </div>

        {a.titel && <div style={{ fontSize: 17, fontWeight: 700, color: GREEN, marginBottom: 6 }}>{a.titel}</div>}
        <p style={{ color: MUTED, marginBottom: 32 }}>
          Unser Angebot für deinen kuratierten Regalplatz – Mindestlaufzeit{" "}
          <strong style={{ color: INK }}>{a.laufzeit_monate} Monate</strong>
          {a.start_datum ? <> ab {fmtDate(a.start_datum)}</> : null}.
        </p>

        {/* Fläche / Ebenen */}
        {ebenen.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Fläche</SectionLabel>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                  <th style={thLeft}>Ebene</th>
                  <th style={thRight}>Breite</th>
                  <th style={thRight}>Tiefe</th>
                  <th style={thRight}>Fläche</th>
                </tr>
              </thead>
              <tbody>
                {ebenen.map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ padding: "8px 8px", color: INK }}>{e.name || `Ebene ${i + 1}`}</td>
                    <td style={{ padding: "8px 8px", textAlign: "right", color: MUTED }}>{e.cm} cm</td>
                    <td style={{ padding: "8px 8px", textAlign: "right", color: MUTED }}>{REGAL_TIEFE_CM} cm</td>
                    <td style={{ padding: "8px 8px", textAlign: "right", color: INK }}>{fmtM2(ebeneM2(e))}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "8px 8px", fontWeight: 700, color: GREEN }}>Gesamt</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, color: GREEN }}>{breite} cm</td>
                  <td />
                  <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, color: GREEN }}>{fmtM2(totalM2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Leistung / Monat */}
        <SectionLabel>Leistung</SectionLabel>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${GREEN}` }}>
              <th style={thLeft}>Position</th>
              <th style={thRight}>pro Monat</th>
            </tr>
          </thead>
          <tbody>
            {sum.flaechenMonat > 0 && (
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                <td style={{ padding: "10px 8px", color: INK }}>
                  Regalfläche{totalM2 > 0 ? ` · ${fmtM2(totalM2)} (${breite} cm)` : ""}
                  <span style={{ color: MUTED, fontSize: 12 }}> — {PREIS_PRO_QM.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €/m²</span>
                </td>
                <td style={{ padding: "10px 8px", textAlign: "right", color: INK, fontWeight: 600, whiteSpace: "nowrap" }}>{formatEUR(sum.flaechenMonat)}</td>
              </tr>
            )}
            {laufende.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                <td style={{ padding: "10px 8px", color: INK }}>{p.label || "—"}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", color: INK, fontWeight: 600, whiteSpace: "nowrap" }}>{formatEUR(positionMonatlich(p))}</td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: "10px 8px", fontWeight: 700, color: GREEN }}>Monatlich netto</td>
              <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, color: GREEN, whiteSpace: "nowrap" }}>{formatEUR(sum.monatlichNetto)}</td>
            </tr>
          </tbody>
        </table>

        {/* Einmalige Positionen */}
        {einmalige.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                <th style={thLeft}>Einmalig</th>
                <th style={thRight}>netto</th>
              </tr>
            </thead>
            <tbody>
              {einmalige.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                  <td style={{ padding: "10px 8px", color: INK }}>{p.label || "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: INK, fontWeight: 600, whiteSpace: "nowrap" }}>{formatEUR(positionEinmalig(p))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Gesamt-Box */}
        <div style={{ marginTop: 28, border: `1.5px solid ${GREEN}`, padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 4 }}>
            <span>Netto über {a.laufzeit_monate} Monate</span>
            <span>{formatEUR(sum.gesamtNetto)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 10 }}>
            <span>zzgl. {MWST_PCT}% MwSt.</span>
            <span>{formatEUR(sum.mwst)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, color: GREEN, textTransform: "uppercase" }}>Gesamt brutto</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>{formatEUR(sum.gesamtBrutto)}</span>
          </div>
        </div>

        {/* Was wir brauchen – schlank, inline */}
        {a.deliverables.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <SectionLabel>Was wir für den Start brauchen</SectionLabel>
            <div style={{ color: INK, fontSize: 13 }}>
              {a.deliverables.map((d) => d.label).filter(Boolean).join(" · ")}
            </div>
          </div>
        )}

        {/* Konditionen */}
        <div style={{ marginTop: 28, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          <SectionLabel>Konditionen</SectionLabel>
          Mindestlaufzeit {a.laufzeit_monate} Monate, danach monatlich kündbar mit {KUENDIGUNG_VORLAUF_MONATE} Monat Vorlauf.
          Flächenpreis {PREIS_PRO_QM.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €/m²/Monat, Mindestmiete {MINDESTMIETE_MONAT} €/Monat,
          Abrechnung monatlich im Voraus. Verkauf in Kommission (Konsignation gem. § 383 HGB) – du behältst Eigentum und Preishoheit.
          Angebot freibleibend{a.gueltig_bis ? ` bis ${fmtDate(a.gueltig_bis)}` : ""}.
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 14, borderTop: `1px solid ${LINE}`, fontSize: 10, color: MUTED, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
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

const thLeft: React.CSSProperties = { textAlign: "left", padding: "8px 8px", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: GREEN, fontWeight: 600 };
const thRight: React.CSSProperties = { ...thLeft, textAlign: "right" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 2, color: BRONZE, textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </div>
  );
}
