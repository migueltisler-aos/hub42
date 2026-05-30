/* ============================================================
   Hub42 /deck – Kostenmodell (geteilt: Rechner + Vergleich)
   Eine Quelle der Wahrheit, damit Section 4 (interaktiv) und
   Section 3 (statischer Vergleich) garantiert dieselben Zahlen
   verwenden. Alle Werte offengelegt, konservativ gedefaultet.
   ============================================================ */

export const RATES = { basis: 11.80, standard: 13.11, premium: 16.39 } as const;
export const MIN_REGAL_CM = 5;
export const MIN_SLOT_MIETE = 59;

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
  onlinePayPct: number; // Payment % vom VK (Shopify Payments)
  onlinePayFix: number; // Payment Fixbetrag
  shopMonthly: number; // Shopify-Abo (Plattformgebühr, fix/Monat)
  // Hub42
  hubCheckout: number; // Checkout-Fee
  hubPayPct: number; // Payment % vom VK
  hubPayFix: number; // Payment Fixbetrag
  regalCm: number; // Regalfront in cm
  ratePerCm: number; // Slot-Rate €/cm/Monat
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
  onlinePayPct: 3.0,
  onlinePayFix: 0.25,
  shopMonthly: 36, // Shopify Basic ~36 €/Monat
  hubCheckout: 0.3,
  hubPayPct: 0.85,
  hubPayFix: 0.25,
  regalCm: 5, // ein einzelnes F&B-Produkt belegt ~5 cm Front
  ratePerCm: RATES.basis,
};

export interface Result {
  onlinePayment: number;
  onlineVar: number; // Online-Kosten/Sale OHNE Abo-Anteil (rein variabel)
  shopPerSale: number; // Shopify-Abo anteilig
  onlinePerSale: number;
  hubPayment: number;
  hubFixed: number;
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
    a.anlieferung + a.lagerung + a.ausgangsauftrag + a.pick + a.dhl + onlinePayment + a.cac;
  const shopPerSale = a.sales > 0 ? a.shopMonthly / a.sales : Infinity;
  const onlinePerSale = onlineVar + shopPerSale;

  // Hub42 hat keinen Wareneingang/Stück – nur Checkout + Payment + Slot-Anteil
  const hubPayment = a.vk * (a.hubPayPct / 100) + a.hubPayFix;
  const hubFixed = a.hubCheckout + hubPayment;
  const slotMonthly = Math.max(MIN_SLOT_MIETE, a.regalCm * a.ratePerCm);
  const slotPerSale = a.sales > 0 ? slotMonthly / a.sales : Infinity;
  const hubPerSale = hubFixed + slotPerSale;

  const saving = onlinePerSale - hubPerSale;

  // Break-even: kleinste ganze Zahl N mit  hubFixed + slot/N < onlineVar + shop/N
  //  ⇔  (slotMonthly − shopMonthly)/N < onlineVar − hubFixed
  const D = onlineVar - hubFixed; // Per-Sale-Vorteil von Hub42
  const F = slotMonthly - a.shopMonthly; // Fixkosten-Differenz (Hub42 − Online)
  let breakEven: number | null = null;
  if (D > 0) breakEven = F <= 0 ? 1 : Math.max(1, Math.floor(F / D) + 1);

  return {
    onlinePayment,
    onlineVar,
    shopPerSale,
    onlinePerSale,
    hubPayment,
    hubFixed,
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

/** Hub42: Marke behält VK − Fees − anteilige Slot-Miete (volumenabhängig). */
export function netHub(a: Assumptions): number {
  return a.vk - compute(a).hubPerSale;
}
