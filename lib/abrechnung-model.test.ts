// Ausführen: pnpm test  (node:test über tsx)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  berechneAbrechnung,
  eanGueltig,
  ibanGueltig,
  mieteImMonat,
  monatsGrenzen,
  type Konditionen,
  type VerkaufZeile,
} from "./abrechnung-model";

const K: Konditionen = { provision_pct: 7, provision_basis: "netto", kleinunternehmer: false, miete_netto_ct: 0 };
const v = (menge: number, preis: number, satz: number | null, ean = "4006381333931"): VerkaufZeile => ({
  ean,
  artikel_name: `Artikel ${ean}`,
  menge,
  einzelpreis_brutto: preis,
  mwst_satz: satz,
});

test("7 % netto auf 19 %-Ware", () => {
  // 10 × 11,90 € = 119,00 € brutto → 100,00 € netto → Provision 7,00 €
  const a = berechneAbrechnung([v(10, 11.9, 19)], K);
  assert.equal(a.umsatz_brutto_ct, 11900);
  assert.equal(a.provision_ct, 700);
  assert.equal(a.gs_netto_ct, 9300);
  assert.equal(a.gs_ust_ct, 1767);
  assert.equal(a.gs_brutto_ct, 11067);
  assert.equal(a.auszahlung_ct, 11067);
});

test("gemischte Sätze werden getrennt gerundet", () => {
  // 7 %: 3 × 5,35 = 16,05 brutto → 15,00 netto → Prov 1,05 → GS 13,95 + 0,98 USt
  // 19 %: 1 × 23,80 brutto → 20,00 netto → Prov 1,40 → GS 18,60 + 3,53 USt
  const a = berechneAbrechnung([v(3, 5.35, 7, "A"), v(1, 23.8, 19, "B")], K);
  assert.deepEqual(
    a.saetze.map((s) => [s.satz, s.netto_ct, s.provision_ct, s.gs_netto_ct, s.gs_ust_ct]),
    [
      [7, 1500, 105, 1395, 98],
      [19, 2000, 140, 1860, 353],
    ]
  );
  assert.equal(a.gs_brutto_ct, 1395 + 98 + 1860 + 353);
});

test("Kleinunternehmer: keine USt auf der Gutschrift", () => {
  const a = berechneAbrechnung([v(10, 11.9, 19)], { ...K, kleinunternehmer: true });
  assert.equal(a.gs_ust_ct, 0);
  assert.equal(a.gs_brutto_ct, 9300);
});

test("Basis netto oder brutto: gleiche Auszahlung (93 % vom Brutto), außer Kleinunternehmer", () => {
  const netto = berechneAbrechnung([v(10, 11.9, 19)], K);
  const brutto = berechneAbrechnung([v(10, 11.9, 19)], { ...K, provision_basis: "brutto" });
  // 7 % von 100 € netto = 7,00 + 1,33 USt = 8,33 = 7 % von 119 € brutto
  assert.equal(brutto.gs_brutto_ct, netto.gs_brutto_ct);
  assert.equal(netto.gs_brutto_ct, 11900 - 833);
  // Kleinunternehmer: netto-Basis zahlt 93 €, brutto-Basis 93 € – USt fällt weg, Unterschied entsteht erst bei der Rundung
  const kuN = berechneAbrechnung([v(10, 11.9, 19)], { ...K, kleinunternehmer: true });
  assert.equal(kuN.gs_brutto_ct, 9300);
});

test("Miete wird verrechnet, Rest als Vortrag", () => {
  // GS brutto 110,67 €, Miete 150 € + 28,50 USt = 178,50 → Saldo −67,83
  const a = berechneAbrechnung([v(10, 11.9, 19)], { ...K, miete_netto_ct: 15000 });
  assert.equal(a.rg_brutto_ct, 17850);
  assert.equal(a.auszahlung_ct, 0);
  assert.equal(a.vortrag_neu_ct, 6783);
  // Folgemonat: Vortrag wird abgezogen
  const b = berechneAbrechnung([v(30, 11.9, 19)], { ...K, miete_netto_ct: 15000 }, a.vortrag_neu_ct);
  assert.equal(b.vortrag_alt_ct, 6783);
  assert.equal(b.auszahlung_ct, 33201 - 17850 - 6783);
});

test("ohne Verkäufe: nur Miete, alles Vortrag", () => {
  const a = berechneAbrechnung([], { ...K, miete_netto_ct: 10000 });
  assert.equal(a.gs_brutto_ct, 0);
  assert.equal(a.vortrag_neu_ct, 11900);
});

test("fehlender MwSt-Satz wird gemeldet und mit 7 % vorläufig gerechnet", () => {
  const a = berechneAbrechnung([v(1, 10.7, null, "X")], K);
  assert.deepEqual(a.fehlender_satz, ["Artikel X"]);
  assert.equal(a.saetze[0].satz, 7);
});

test("Positionen werden je Artikel verdichtet", () => {
  const a = berechneAbrechnung([v(1, 2.5, 7, "A"), v(2, 2.5, 7, "A")], K);
  assert.equal(a.positionen.length, 1);
  assert.equal(a.positionen[0].menge, 3);
  assert.equal(a.positionen[0].brutto_ct, 750);
});

test("Miete erst ab Vertragsbeginn", () => {
  assert.equal(mieteImMonat(150, "2026-12-01", "2026-11"), 0);
  assert.equal(mieteImMonat(150, "2026-11-15", "2026-11"), 15000);
  assert.equal(mieteImMonat(150, null, "2026-11"), 15000);
});

test("Monatsgrenzen in Berliner Zeit", () => {
  assert.deepEqual(monatsGrenzen("2026-11"), {
    von: "2026-10-31T23:00:00.000Z",
    bis: "2026-11-30T23:00:00.000Z",
  });
  assert.equal(monatsGrenzen("2026-07").von, "2026-06-30T22:00:00.000Z");
});

test("IBAN-Prüfziffer", () => {
  assert.equal(ibanGueltig("DE89 3704 0044 0532 0130 00"), true);
  assert.equal(ibanGueltig("DE89 3704 0044 0532 0130 01"), false);
  assert.equal(ibanGueltig("DE8937040044"), false);
});

test("EAN-Prüfziffer", () => {
  assert.equal(eanGueltig("4006381333931"), true);
  assert.equal(eanGueltig("4006381333932"), false);
  assert.equal(eanGueltig("96385074"), true);
});

test("Abrechnung erst ab 20.11.2026: Oktober leer, November ab 20., Dezember voll", async () => {
  const { abrechnungsGrenzen, monatsGrenzen } = await import("./abrechnung-model");
  const okt = abrechnungsGrenzen("2026-10");
  assert.equal(okt.von, okt.bis);
  const nov = abrechnungsGrenzen("2026-11");
  assert.equal(nov.von, "2026-11-19T23:00:00.000Z");
  assert.equal(nov.abTag, "2026-11-20");
  assert.deepEqual(abrechnungsGrenzen("2026-12"), { ...monatsGrenzen("2026-12"), abTag: null });
});
