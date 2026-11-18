import { test } from "node:test";
import assert from "node:assert/strict";
import { kontrollCsv, painXml, sepaText } from "./sepa";

test("SEPA-Text ohne Umlaute und Sonderzeichen", () => {
  assert.equal(sepaText("Grüne Möhre & Söhne GmbH", 70), "Gruene Moehre Soehne GmbH");
  assert.equal(sepaText("x".repeat(50), 35).length, 35);
});

test("pain.001: Summe, Anzahl, Nullbeträge raus", () => {
  const x = painXml({
    nachrichtId: "HUB42-2026-11-1",
    auftraggeber: { name: "Hub42 UG", iban: "DE89370400440532013000" },
    ausfuehrung: "2026-12-05",
    erstellt: new Date("2026-12-05T10:00:00Z"),
    posten: [
      { empfaenger: "Marke A", iban: "DE89 3704 0044 0532 0130 00", betrag_ct: 12345, verwendungszweck: "GS-2026-0001", referenz: "GS-2026-0001" },
      { empfaenger: "Marke B", iban: "DE89370400440532013000", betrag_ct: 0, verwendungszweck: "x", referenz: "y" },
    ],
  });
  assert.match(x, /<NbOfTxs>1<\/NbOfTxs>/);
  assert.match(x, /<CtrlSum>123.45<\/CtrlSum>/);
  assert.match(x, /<IBAN>DE89370400440532013000<\/IBAN>/);
  assert.doesNotMatch(x, /Marke B/);
});

test("Kontroll-CSV mit deutschem Dezimalkomma", () => {
  const c = kontrollCsv([{ brand_name: "A", iban: "DE1", zeitraum: "2026-11", menge: 3, brutto_ct: 1190, provision_ct: 83, miete_ct: 0, auszahlung_ct: 1107, gs_nr: "GS-2026-0001" }]);
  assert.match(c, /"A";DE1;2026-11;3;11,90;0,83;0,00;11,07;GS-2026-0001/);
});
