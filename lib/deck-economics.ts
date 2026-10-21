/* ============================================================
   Hub42 /deck – Kostenmodell (geteilt: Rechner + Vergleich)
   Eine Quelle der Wahrheit, damit Section 4 (interaktiv) und
   Section 3 (statischer Vergleich) garantiert dieselben Zahlen
   verwenden. Alle Werte offengelegt, konservativ gedefaultet.

   Preismodell (Stand: Auslastungsstaffelung + Provisionsmodell):
   - Regalmiete steigt in 3 Tranchen mit der Store-Auslastung
     (nicht mit dem Kalenderdatum) – First Mover behalten ihren
     Einstiegspreis vertraglich für die Erstlaufzeit.
   - Erlös pro Verkauf: 7 % Vermittlungsprovision auf den
     Bruttoverkaufspreis. Ersetzt die frühere Kombination aus
     0,30 €/Artikel Checkout-Fee + 1:1 durchgereichter
     Kartenzahlungsgebühr; Hub42 trägt die Zahlungsabwicklungs-
     kosten jetzt aus der Provision.
   ============================================================ */

/* ── Slot-Preismodell (eine Quelle der Wahrheit) ──────────────
   Drei Regalfronten: S und M fest, L je cm. Zonenzuschlag und Staffel
   kommen auf alle drei (Preiskonzept Mischform, 2026-10-20). */
export const PAKETE = {
  S: { cm: 13, preis: 59 },
  M: { cm: 25, preis: 118 },
  L: { abCm: 50, preisJeCm: 4.64 },
} as const;
export type Paket = keyof typeof PAKETE;

/** Online buchbar bis zu einer Ebene (84 cm); breiter nur auf Anfrage. */
export const MAX_REGAL_CM = 84;

export const ZONE_SURCHARGE_PCT = { basis: 0, augenhoehe: 10, greifhoehe: 20 } as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Auslastungstranchen: Preis steigt mit Store-Auslastung, nicht mit Kalenderdatum.
    First-Mover-Brands behalten ihren Einstiegspreis vertraglich für die Erstlaufzeit
    (Standard: 12 Monate) – auch wenn der Store danach in eine höhere Tranche wechselt. */
export const TRANCHE_SURCHARGE_PCT = { first_mover: 0, aufbau: 10, warteliste: 20 } as const;
export type Tranche = keyof typeof TRANCHE_SURCHARGE_PCT;

export const TRANCHE_INFO: Record<Tranche, { label: string; auslastung: string }> = {
  first_mover: { label: "Unter 60 % Auslastung", auslastung: "Preise wie gelistet" },
  aufbau: { label: "Ab 60 % Auslastung", auslastung: "+10 %" },
  warteliste: { label: "Ab 85 % Auslastung", auslastung: "+20 %" },
};

/** Preis je cm in der Regalfront L, mit Zonen- und Staffelzuschlag, auf Cent. */
function rateFor(zonePct: number, tranchePct: number): number {
  return round2(PAKETE.L.preisJeCm * (1 + zonePct / 100) * (1 + tranchePct / 100));
}

/** €/cm-Monatsraten je Zone × Tranche. */
export const TRANCHE_RATES: Record<Tranche, { basis: number; augenhoehe: number; greifhoehe: number }> = {
  first_mover: {
    basis: rateFor(ZONE_SURCHARGE_PCT.basis, TRANCHE_SURCHARGE_PCT.first_mover),
    augenhoehe: rateFor(ZONE_SURCHARGE_PCT.augenhoehe, TRANCHE_SURCHARGE_PCT.first_mover),
    greifhoehe: rateFor(ZONE_SURCHARGE_PCT.greifhoehe, TRANCHE_SURCHARGE_PCT.first_mover),
  },
  aufbau: {
    basis: rateFor(ZONE_SURCHARGE_PCT.basis, TRANCHE_SURCHARGE_PCT.aufbau),
    augenhoehe: rateFor(ZONE_SURCHARGE_PCT.augenhoehe, TRANCHE_SURCHARGE_PCT.aufbau),
    greifhoehe: rateFor(ZONE_SURCHARGE_PCT.greifhoehe, TRANCHE_SURCHARGE_PCT.aufbau),
  },
  warteliste: {
    basis: rateFor(ZONE_SURCHARGE_PCT.basis, TRANCHE_SURCHARGE_PCT.warteliste),
    augenhoehe: rateFor(ZONE_SURCHARGE_PCT.augenhoehe, TRANCHE_SURCHARGE_PCT.warteliste),
    greifhoehe: rateFor(ZONE_SURCHARGE_PCT.greifhoehe, TRANCHE_SURCHARGE_PCT.warteliste),
  },
};

/** RATES = Tranche "first_mover": Preis je cm in der Regalfront L (die auf der Website gezeigte Rate). */
export const RATES = TRANCHE_RATES.first_mover;

export type ZoneId = keyof typeof ZONE_SURCHARGE_PCT;

/** Kleinste Regalfront ist S. */
export const MIN_REGAL_CM = PAKETE.S.cm;

/** Welche Regalfront zu einer Breite gehört. Bis 13 cm S, 14 bis 25 cm M
    (das nächstgrößere Paket), 26 bis 49 cm keiner (Zwischenbreite, offen),
    ab 50 cm L. */
export function paketFuer(cm: number): Paket | null {
  if (cm <= PAKETE.S.cm) return "S";
  if (cm <= PAKETE.M.cm) return "M";
  if (cm < PAKETE.L.abCm) return null;
  return "L";
}

/** Monatsmiete einer Regalfront: S und M Paketpreis × Zone × Staffel auf
    Cent, L Breite × Satz je cm der Tranche. null für Zwischenbreiten. */
export function paketMiete(cm: number, zone: ZoneId, tranche: Tranche = "first_mover"): number | null {
  const p = paketFuer(cm);
  if (!p) return null;
  if (p === "L") return round2(cm * TRANCHE_RATES[tranche][zone]);
  return round2(
    PAKETE[p].preis * (1 + ZONE_SURCHARGE_PCT[zone] / 100) * (1 + TRANCHE_SURCHARGE_PCT[tranche] / 100),
  );
}

/** Die drei buchbaren Breiten als Auswahl: S, M und L ab 50 cm. */
export const PAKET_CM: Record<Paket, number> = { S: PAKETE.S.cm, M: PAKETE.M.cm, L: PAKETE.L.abCm };

/** Fixpreis-Slot Schaufenster / Ladenfront (Außensichtbarkeit) – tranchenunabhängig. */
export const SCHAUFENSTER_MONAT = 140;

/** Vermittlungsprovision auf den Bruttoverkaufspreis (VK) jedes verkauften Artikels. */
export const HUB_MARGIN_PCT = 7;

/* ── Die Treppe (Startseite #treppe, #preise, /hersteller) ────
   Festpreis je Stufe, netto. In jeder Stufe steckt Regal bis
   REGAL_INKLUSIVE_CM, jeder weitere cm kostet RATES[zone] (4,64 € plus
   Zonenzuschlag), ohne Mindestbetrag. Auf alle Stufen kommt HUB_MARGIN_PCT auf
   den Verkauf. */
export const STUFE_PREIS = {
  beweisen: 2500,
  spark: 9800,
  focus: 24500,
  powerhouse: 49000,
} as const;

/** So viel Regalfront steckt in jeder Stufe im Festpreis. */
export const REGAL_INKLUSIVE_CM = 15;

export interface Assumptions {
  vk: number; // Verkaufspreis / Artikel
  sales: number; // Sales / Monat
  cac: number; // Online-Marketing / CAC pro Sale
  // Online-Shop
  anlieferung: number; // Wareneingang pro Stück (nur Online)
  lagerung: number; // Lagerung anteilig
  ausgangsauftrag: number; // Ausgangsauftrag
  pick: number; // Pick
  dhl: number; // DHL Label
  verpackung: number; // Verpackungsmaterial pro Stück
  onlinePayPct: number; // Payment % vom VK (Shopify Payments)
  onlinePayFix: number; // Payment Fixbetrag
  shopMonthly: number; // Shopify-Abo (Plattformgebühr, fix/Monat)
  // Hub42
  hubMarginPct: number; // Vermittlungsprovision in % vom VK (ersetzt Checkout-Fee + Kartengebühr)
  regalCm: number; // Regalfront in cm: 13 (S), 25 (M) oder ab 50 (L)
  zone: ZoneId; // Höhe im Regal (Zonenzuschlag)
  ratePerCm: number; // Satz €/cm/Monat, nur für Regalfront L gelesen
  tranche: Tranche; // Auslastungstranche (Staffelzuschlag)
}

export const DEFAULTS: Assumptions = {
  vk: 15.0,
  sales: 20,
  cac: 4.0, // typischer DTC-F&B-Wert (ehrlicher Default)
  anlieferung: 0.3,
  lagerung: 0.08,
  ausgangsauftrag: 1.2,
  pick: 0.2,
  dhl: 3.25,
  verpackung: 0.19,
  onlinePayPct: 3.0,
  onlinePayFix: 0.25,
  shopMonthly: 36, // Shopify Basic ~36 €/Monat
  hubMarginPct: HUB_MARGIN_PCT,
  regalCm: 13, // Regalfront S, Platz für rund zwei Gläser
  zone: "basis",
  ratePerCm: RATES.basis,
  tranche: "first_mover",
};

export interface Result {
  onlinePayment: number;
  onlineVar: number; // Online-Kosten/Sale OHNE Abo-Anteil (rein variabel)
  shopPerSale: number; // Shopify-Abo anteilig
  onlinePerSale: number;
  hubMargin: number; // Vermittlungsprovision / Sale
  slotMonthly: number;
  slotPerSale: number;
  hubPerSale: number;
  saving: number;
  breakEven: number | null;
}

export function compute(a: Assumptions): Result {
  const onlinePayment = a.vk * (a.onlinePayPct / 100) + a.onlinePayFix;
  // variabel je Sale (ohne fixes Shopify-Abo)
  const onlineVar =
    a.anlieferung + a.lagerung + a.ausgangsauftrag + a.pick + a.dhl + a.verpackung + onlinePayment + a.cac;
  const shopPerSale = a.sales > 0 ? a.shopMonthly / a.sales : Infinity;
  const onlinePerSale = onlineVar + shopPerSale;

  // Hub42 hat keinen Wareneingang/Stück – nur Vermittlungsprovision + Slot-Anteil
  const hubMargin = a.vk * (a.hubMarginPct / 100);
  // S und M: Paketpreis; L: Breite × Satz je cm (editierbar über ratePerCm)
  const paket = paketFuer(a.regalCm);
  const slotMonthly =
    paket === "L"
      ? round2(a.regalCm * a.ratePerCm)
      : (paketMiete(a.regalCm, a.zone, a.tranche) ?? round2(a.regalCm * a.ratePerCm));
  const slotPerSale = a.sales > 0 ? slotMonthly / a.sales : Infinity;
  const hubPerSale = hubMargin + slotPerSale;

  const saving = onlinePerSale - hubPerSale;

  // Break-even: kleinste ganze Zahl N mit  hubMargin + slot/N < onlineVar + shop/N
  //  ⇔  (slotMonthly − shopMonthly)/N < onlineVar − hubMargin
  const D = onlineVar - hubMargin; // Per-Sale-Vorteil von Hub42
  const F = slotMonthly - a.shopMonthly; // Fixkosten-Differenz (Hub42 − Online)
  let breakEven: number | null = null;
  if (D > 0) breakEven = F <= 0 ? 1 : Math.max(1, Math.floor(F / D) + 1);

  return {
    onlinePayment,
    onlineVar,
    shopPerSale,
    onlinePerSale,
    hubMargin,
    slotMonthly,
    slotPerSale,
    hubPerSale,
    saving,
    breakEven,
  };
}

/* ── Netto-Erlös pro verkauftem Artikel (was bleibt der Marke?) ──
   Volumen-Hinweis: Hub42 ist volumenabhängig (fixe Slot-Miete),
   LEH und Online sind es nicht. Vergleich daher immer bei einem
   genannten Sales-Volumen darstellen. */

export const LEH_DEFAULTS = {
  margePct: 40, // Handelsmarge LEH (konservativ; real 30–50 %)
  listung: 0, // Listungsgebühr/Stk. (bewusst 0 = großzügig zum LEH)
};

/** LEH: Marke verkauft zum Großhandelspreis = VK − Handelsmarge − Listung. */
export function netLEH(
  vk: number,
  margePct: number = LEH_DEFAULTS.margePct,
  listung: number = LEH_DEFAULTS.listung,
): number {
  return vk * (1 - margePct / 100) - listung;
}

/** Online-Shop: Marke behält VK, trägt aber alle Fulfillment- + CAC-Kosten. */
export function netOnline(a: Assumptions): number {
  return a.vk - compute(a).onlinePerSale;
}

/** Hub42: Marke behält VK − Provision − anteilige Slot-Miete (volumenabhängig). */
export function netHub(a: Assumptions): number {
  return a.vk - compute(a).hubPerSale;
}
