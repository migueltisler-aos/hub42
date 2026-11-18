// SEPA-Sammelüberweisung pain.001.001.09 und Kontroll-CSV (kassensystem README 4.4).
// Reine Funktionen, damit testbar.

export interface Ueberweisung {
  empfaenger: string;
  iban: string;
  bic?: string | null;
  betrag_ct: number;
  verwendungszweck: string;
  referenz: string; // EndToEndId, max 35 Zeichen
}

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** SEPA-Zeichensatz: Umlaute umschreiben, Rest auf erlaubte Zeichen. */
export const sepaText = (s: string, max: number) =>
  s
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^A-Za-z0-9/\-?:().,'+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const betrag = (ct: number) => (ct / 100).toFixed(2);

export function painXml(opts: {
  nachrichtId: string;
  auftraggeber: { name: string; iban: string; bic?: string | null };
  ausfuehrung: string; // YYYY-MM-DD
  posten: Ueberweisung[];
  erstellt?: Date;
}): string {
  const p = opts.posten.filter((x) => x.betrag_ct > 0);
  const summe = p.reduce((a, x) => a + x.betrag_ct, 0);
  const jetzt = (opts.erstellt ?? new Date()).toISOString().slice(0, 19);
  const bic = (b?: string | null) =>
    b ? `<FinInstnId><BICFI>${xml(b)}</BICFI></FinInstnId>` : `<FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${xml(sepaText(opts.nachrichtId, 35))}</MsgId>
      <CreDtTm>${jetzt}</CreDtTm>
      <NbOfTxs>${p.length}</NbOfTxs>
      <CtrlSum>${betrag(summe)}</CtrlSum>
      <InitgPty><Nm>${xml(sepaText(opts.auftraggeber.name, 70))}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${xml(sepaText(opts.nachrichtId, 35))}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${p.length}</NbOfTxs>
      <CtrlSum>${betrag(summe)}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt><Dt>${opts.ausfuehrung}</Dt></ReqdExctnDt>
      <Dbtr><Nm>${xml(sepaText(opts.auftraggeber.name, 70))}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${xml(opts.auftraggeber.iban)}</IBAN></Id></DbtrAcct>
      <DbtrAgt>${bic(opts.auftraggeber.bic)}</DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>
${p
  .map(
    (x) => `      <CdtTrfTxInf>
        <PmtId><EndToEndId>${xml(sepaText(x.referenz, 35))}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="EUR">${betrag(x.betrag_ct)}</InstdAmt></Amt>
        ${x.bic ? `<CdtrAgt>${bic(x.bic)}</CdtrAgt>` : ""}
        <Cdtr><Nm>${xml(sepaText(x.empfaenger, 70))}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${xml(x.iban.replace(/\s+/g, ""))}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${xml(sepaText(x.verwendungszweck, 140))}</Ustrd></RmtInf>
      </CdtTrfTxInf>`
  )
  .join("\n")}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`;
}

export function kontrollCsv(
  zeilen: { brand_name: string; iban: string; zeitraum: string; menge: number; brutto_ct: number; provision_ct: number; miete_ct: number; auszahlung_ct: number; gs_nr: string }[]
): string {
  const e = (ct: number) => (ct / 100).toFixed(2).replace(".", ",");
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const kopf = "marke;iban;zeitraum;verkaufte_menge;bruttoerloes;provision_brutto;miete_brutto;auszahlungsbetrag;gutschrift_nr";
  return [kopf, ...zeilen.map((z) => [q(z.brand_name), z.iban, z.zeitraum, z.menge, e(z.brutto_ct), e(z.provision_ct), e(z.miete_ct), e(z.auszahlung_ct), z.gs_nr].join(";"))].join("\r\n") + "\r\n";
}
