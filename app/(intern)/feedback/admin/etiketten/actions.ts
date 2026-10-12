"use server";

/**
 * SumUp-Artikelexport → Etiketten-Daten.
 *
 * Jeder Artikel braucht ein feedback_product, damit sein QR auf eine
 * Bewertungsseite fuehrt. Abgleich ueber Name + Marke (so hat auch das
 * Python-Skript die ersten 43 angelegt); fehlende werden mit dem Fragenset
 * „Basis“ neu angelegt. Ein zweiter Upload desselben Exports legt nichts
 * doppelt an, die QR-Codes bereits geklebter Etiketten bleiben gueltig.
 */

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { createProduct, getProducts, getQuestionSets } from "@/lib/feedback";
import { etikettAusZeile, type Etikett, type EtikettRoh } from "@/lib/etiketten";

const STORE = "Hub42 Alexa";
const BASIS_SET = "Basis";

export type EtikettenErgebnis =
  | { ok: true; etiketten: Etikett[]; ausgelassen: number }
  | { ok: false; message: string };

export async function etikettenAusExport(formData: FormData): Promise<EtikettenErgebnis> {
  const file = formData.get("export");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Bitte den SumUp-Artikelexport (CSV) auswählen." };
  }

  const text = (await file.text()).replace(/^﻿/, "");
  const wb = XLSX.read(text, { type: "string", raw: true });
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]], {
    defval: "",
    raw: false,
  });
  if (!rows.length || !("Item name" in rows[0]) || !("Price" in rows[0])) {
    return {
      ok: false,
      message: "Das ist kein SumUp-Artikelexport (Spalten „Item name“ und „Price“ fehlen).",
    };
  }

  const roh = rows.map(etikettAusZeile).filter((e): e is EtikettRoh => e !== null);

  // archivierte mitnehmen: ein wieder gelisteter Artikel bekommt seinen alten QR zurueck
  const vorhanden = new Map(
    (await getProducts({ includeArchived: true })).map((p) => [`${p.name}\u0000${p.brand ?? ""}`, p.id])
  );
  const basis = (await getQuestionSets()).find((s) => s.name === BASIS_SET);

  const etiketten: Etikett[] = [];
  for (const e of roh) {
    let productId = vorhanden.get(`${e.name}\u0000${e.seller}`);
    let neu = false;
    if (!productId) {
      const p = await createProduct(
        {
          name: e.name,
          brand: e.seller,
          store: STORE,
          shelf_code: null,
          batch: e.sku || null,
          price_enabled: true,
        },
        basis ? [basis.id] : []
      );
      productId = p.id;
      vorhanden.set(`${e.name}\u0000${e.seller}`, p.id);
      neu = true;
    }
    etiketten.push({ ...e, productId, neu });
  }

  if (etiketten.some((e) => e.neu)) revalidatePath("/feedback/admin");
  etiketten.sort((a, b) => a.seller.localeCompare(b.seller, "de") || a.name.localeCompare(b.name, "de"));
  return { ok: true, etiketten, ausgelassen: rows.length - roh.length };
}
