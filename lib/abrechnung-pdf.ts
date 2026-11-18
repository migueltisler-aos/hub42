// Gutschrift (§ 14 Abs. 2 S. 2 UStG) und Rechnung (Regalmiete) als PDF.
//
// Pflichtangaben nach § 14 Abs. 4 UStG: Name/Anschrift beider Seiten,
// Steuernummer oder USt-IdNr. des LEISTENDEN (bei der Gutschrift: die Marke),
// Ausstellungsdatum, fortlaufende Nummer, Menge und Art, Leistungszeitraum,
// Entgelt je Steuersatz, Steuersatz und Steuerbetrag, bei der Gutschrift das
// Wort „Gutschrift“. Vor dem ersten echten Lauf vom Steuerberater gegenlesen.
import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { euro, MIETE_UST, type Abrechnung } from "./abrechnung-model";
import type { Firma } from "./hub42-firma";
import type { Konditionen } from "./marke";

const A4: [number, number] = [595.28, 841.89];
const RAND = 56;
const GRAU = rgb(0.35, 0.38, 0.38);

interface Seite {
  page: PDFPage;
  y: number;
  f: PDFFont;
  b: PDFFont;
}

// Helvetica (WinAnsi) kennt kein „“ → gerade Anführungszeichen; Umlaute und € sind drin.
const w = (s: string) => s.replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/[–—]/g, "-").replace(/ | /g, " ");

function text(s: Seite, t: string, x: number, opts: { fett?: boolean; groesse?: number; rechts?: boolean; farbe?: ReturnType<typeof rgb> } = {}) {
  const font = opts.fett ? s.b : s.f;
  const g = opts.groesse ?? 10;
  const tt = w(t);
  const xx = opts.rechts ? x - font.widthOfTextAtSize(tt, g) : x;
  s.page.drawText(tt, { x: xx, y: s.y, size: g, font, color: opts.farbe ?? rgb(0.06, 0.07, 0.07) });
}

function zeile(s: Seite, abstand = 14) {
  s.y -= abstand;
}

function kopf(s: Seite, absender: string[], empfaenger: string[], titel: string, meta: [string, string][]) {
  text(s, absender.join(" · "), RAND, { groesse: 7.5, farbe: GRAU });
  zeile(s, 22);
  for (const l of empfaenger) { text(s, l, RAND); zeile(s); }
  s.y = A4[1] - 110;
  for (const [k, v] of meta) {
    text(s, k, A4[0] - RAND - 210, { groesse: 9, farbe: GRAU });
    text(s, v, A4[0] - RAND, { groesse: 9, rechts: true });
    zeile(s, 13);
  }
  s.y = A4[1] - 250;
  text(s, titel, RAND, { fett: true, groesse: 16 });
  zeile(s, 26);
}

function tabelle(s: Seite, kopfzeile: string[], zeilen: string[][], spalten: number[]) {
  const rechts = (i: number) => i > 0;
  const x = (i: number) => (rechts(i) ? spalten[i] : spalten[i]);
  kopfzeile.forEach((h, i) => text(s, h, x(i), { fett: true, groesse: 8.5, rechts: rechts(i) }));
  zeile(s, 6);
  s.page.drawLine({ start: { x: RAND, y: s.y }, end: { x: A4[0] - RAND, y: s.y }, thickness: 0.6, color: GRAU });
  zeile(s, 13);
  for (const z of zeilen) {
    z.forEach((c, i) => text(s, i === 0 && c.length > 52 ? c.slice(0, 50) + "…" : c, x(i), { groesse: 9, rechts: rechts(i) }));
    zeile(s, 13);
  }
}

function summe(s: Seite, paare: [string, string, boolean?][]) {
  s.page.drawLine({ start: { x: A4[0] - RAND - 230, y: s.y + 11 }, end: { x: A4[0] - RAND, y: s.y + 11 }, thickness: 0.6, color: GRAU });
  zeile(s, 4);
  for (const [k, v, fett] of paare) {
    text(s, k, A4[0] - RAND - 230, { fett, groesse: 9.5 });
    text(s, v, A4[0] - RAND, { fett, groesse: 9.5, rechts: true });
    zeile(s, 14);
  }
}

function fuss(s: Seite, zeilen: string[]) {
  let y = 70;
  for (const l of zeilen) {
    s.page.drawText(w(l), { x: RAND, y, size: 7.5, font: s.f, color: GRAU });
    y -= 10;
  }
}

async function neu(): Promise<{ doc: PDFDocument; s: Seite }> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(A4);
  const s = { page, y: A4[1] - 60, f: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold) };
  return { doc, s };
}

const pct = (n: number) => `${n.toLocaleString("de-DE")} %`;
const datum = (d: Date) => d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });

export interface BelegDaten {
  firma: Firma;
  marke: { name: string };
  k: Konditionen;
  a: Abrechnung;
  zeitraumText: string; // "November 2026"
  leistungszeitraum: string; // "01.11.2026 – 30.11.2026"
  gsNr: string;
  rgNr: string | null;
  ausgestellt: Date;
}

export async function gutschriftPdf(d: BelegDaten): Promise<Uint8Array> {
  const { doc, s } = await neu();
  const k = d.k;
  kopf(
    s,
    [d.firma.name, d.firma.strasse, d.firma.ort],
    [k.firma ?? d.marke.name, k.strasse ?? "", [k.plz, k.ort].filter(Boolean).join(" "), k.land && k.land !== "DE" ? k.land : ""].filter(Boolean),
    `Gutschrift ${d.gsNr}`,
    [
      ["Gutschrift-Nr.", d.gsNr],
      ["Datum", datum(d.ausgestellt)],
      ["Leistungszeitraum", d.leistungszeitraum],
      [k.ust_idnr ? "Ihre USt-IdNr." : "Ihre Steuernummer", k.ust_idnr ?? k.steuernummer ?? "-"],
      [d.firma.ustIdNr ? "Unsere USt-IdNr." : "Unsere Steuernr.", d.firma.ustIdNr ?? d.firma.steuernummer ?? "-"],
    ]
  );
  text(s, `Abrechnung über die im ${d.zeitraumText} in Kommission verkaufte Ware (§ 383 HGB) im Gutschriftverfahren.`, RAND, { groesse: 9.5 });
  zeile(s, 22);

  tabelle(
    s,
    ["Artikel", "Menge", "USt", "Verkauf brutto"],
    d.a.positionen.map((p) => [p.artikel_name, String(p.menge), pct(p.satz), euro(p.brutto_ct)]),
    [RAND, 370, 430, A4[0] - RAND]
  );
  zeile(s, 8);

  const paare: [string, string, boolean?][] = [];
  for (const st of d.a.saetze) {
    paare.push([`Verkaufserlös netto ${pct(st.satz)}`, euro(st.netto_ct)]);
    paare.push([`abzgl. Provision ${pct(Number(k.provision_pct))}`, `- ${euro(st.provision_ct)}`]);
    paare.push([`Entgelt ${pct(st.satz)}`, euro(st.gs_netto_ct), true]);
    if (!k.kleinunternehmer) paare.push([`zzgl. USt ${pct(st.satz)}`, euro(st.gs_ust_ct)]);
  }
  paare.push(["Gutschriftbetrag", euro(d.a.gs_brutto_ct), true]);
  summe(s, paare);
  zeile(s, 10);

  const hinweise = [
    k.kleinunternehmer ? "Kein Ausweis der Umsatzsteuer, Lieferant ist Kleinunternehmer nach § 19 UStG." : null,
    d.a.rg_brutto_ct > 0 && d.rgNr
      ? `Verrechnet mit unserer Rechnung ${d.rgNr} über ${euro(d.a.rg_brutto_ct)} (Regalmiete).`
      : null,
    d.a.vortrag_alt_ct > 0 ? `Verrechnet mit offenem Betrag aus dem Vormonat: ${euro(d.a.vortrag_alt_ct)}.` : null,
    d.a.auszahlung_ct > 0
      ? `Auszahlung ${euro(d.a.auszahlung_ct)} an ${k.kontoinhaber ?? ""}, IBAN ${k.iban ?? ""}, bis zum 10. des Folgemonats.`
      : `Keine Auszahlung in diesem Monat. Offen zu unseren Gunsten: ${euro(d.a.vortrag_neu_ct)}, wird mit der nächsten Gutschrift verrechnet.`,
    "Tasting-Muster und Abschriften sind nicht Teil dieser Abrechnung.",
    "Diese Gutschrift gilt als Rechnung des Lieferanten (§ 14 Abs. 2 S. 2 UStG). Widerspruch bitte innerhalb von 14 Tagen.",
  ].filter(Boolean) as string[];
  for (const h of hinweise) { text(s, h, RAND, { groesse: 9 }); zeile(s, 13); }

  fuss(s, [`${d.firma.name} · ${d.firma.strasse} · ${d.firma.ort}${d.firma.email ? ` · ${d.firma.email}` : ""}`]);
  return doc.save();
}

export async function rechnungPdf(d: BelegDaten): Promise<Uint8Array> {
  if (!d.rgNr) throw new Error("Keine Rechnungsnummer");
  const { doc, s } = await neu();
  const k = d.k;
  kopf(
    s,
    [d.firma.name, d.firma.strasse, d.firma.ort],
    [k.firma ?? d.marke.name, k.strasse ?? "", [k.plz, k.ort].filter(Boolean).join(" ")].filter(Boolean),
    `Rechnung ${d.rgNr}`,
    [
      ["Rechnungs-Nr.", d.rgNr],
      ["Datum", datum(d.ausgestellt)],
      ["Leistungszeitraum", d.leistungszeitraum],
      [d.firma.ustIdNr ? "USt-IdNr." : "Steuernummer", d.firma.ustIdNr ?? d.firma.steuernummer ?? "-"],
    ]
  );
  tabelle(
    s,
    ["Leistung", "Menge", "USt", "Netto"],
    [[`Regalmiete ${d.zeitraumText}${k.regal_cm ? `, ${k.regal_cm} cm` : ""}${k.regal_lage ? `, ${k.regal_lage}` : ""}`, "1", pct(MIETE_UST), euro(d.a.miete_netto_ct)]],
    [RAND, 370, 430, A4[0] - RAND]
  );
  zeile(s, 8);
  summe(s, [
    ["Netto", euro(d.a.miete_netto_ct)],
    [`zzgl. USt ${pct(MIETE_UST)}`, euro(d.a.rg_ust_ct)],
    ["Rechnungsbetrag", euro(d.a.rg_brutto_ct), true],
  ]);
  zeile(s, 10);
  text(s, `Bitte nicht überweisen: verrechnet mit unserer Gutschrift ${d.gsNr}.`, RAND, { groesse: 9 });
  zeile(s, 13);
  fuss(s, [`${d.firma.name} · ${d.firma.strasse} · ${d.firma.ort}${d.firma.email ? ` · ${d.firma.email}` : ""}`]);
  return doc.save();
}
