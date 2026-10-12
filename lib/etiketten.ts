/**
 * Regaletiketten 40x30 mm fuer den Phomemo M110S (Thermodruck, 203 dpi).
 *
 * Portiert aus Austausch/etiketten/build_etiketten.py, inklusive der dort am
 * Drucker getesteten Werte:
 * - QR auf die Kurz-URL /q/<6 Hex> → 25x25 Module, jedes exakt 0,75 mm
 *   (6 Druckpunkte). Die lange /feedback/r/<uuid> mit 0,5-mm-Modulen las das
 *   Handy vom Etikett nicht.
 * - PDF-Seite hochkant 30x40 mm mit um 90° gedrehtem Inhalt. Der Treiber
 *   fuehrt die Rolle so; ein quer angelegtes PDF wird vergroessert und
 *   abgeschnitten. Drucken in Acrobat: „Tatsächliche Größe“ + Querformat.
 *
 * Neutral (weder "use server" noch "use client"): die Server Action nutzt das
 * CSV-Mapping, der Browser baut daraus das PDF.
 */

import {
  PDFDocument,
  StandardFonts,
  concatTransformationMatrix,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";

export interface Etikett {
  sumupId: string;
  productId: string;
  name: string;
  seller: string;
  sku: string;
  price: number;
  grundpreis: string | null;
  /** in diesem Lauf neu als feedback_product angelegt */
  neu: boolean;
}

export type EtikettRoh = Omit<Etikett, "productId" | "neu">;

// ---------- SumUp-Artikelexport → Etikett ----------

/** Kategorie in SumUp = Marke; „Mein Regal“ sammelt Einzelmarken, die am Namen erkannt werden. */
const SELLER: Record<string, string> = {
  AuteniQ: "auteniQ",
  Froyda: "Froyda",
  goodmoodfood: "goodmoodfood",
};
const SELLER_BY_NAME: [string, string][] = [
  ["7Pot", "Crazy Bastard Sauce"],
  ["Ikani", "Ikani"],
  ["TEKOHA", "TEKOHA"],
];
export const AUSGELISTET = "Ausgelistet";

function seller(category: string, name: string): string {
  if (SELLER[category]) return SELLER[category];
  return SELLER_BY_NAME.find(([prefix]) => name.startsWith(prefix))?.[1] ?? category;
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** URLs aus dem Artikelnamen entfernen (z. B. „Ikani Vanille https://ikani.de/“). */
export function cleanName(name: string): string {
  return unescapeHtml(name).replace(/\s*https?:\/\/\S+/g, "").trim();
}

/** „910 g“ / „3 l“ / „4 × 70 g“ → „16,37 €/kg“; ca.- und Spannen-Angaben → null. */
export function grundpreis(name: string, price: number): string | null {
  if (/\bca\.|\d\s*[–-]\s*\d/.test(name)) return null;
  const m = name.match(/(?:(\d+)\s*[×x]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/);
  if (!m) return null;
  const menge = Number(m[1] ?? 1) * Number(m[2].replace(",", "."));
  const [faktor, einheit] = { g: [1000, "kg"], kg: [1, "kg"], ml: [1000, "l"], l: [1, "l"] }[
    m[3] as "g" | "kg" | "ml" | "l"
  ] as [number, string];
  return `${euro((price / menge) * faktor)}/${einheit}`;
}

export function euro(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

/** Eine Zeile des SumUp-„items-export“ (Spaltennamen wie im Export). */
export function etikettAusZeile(row: Record<string, string>): EtikettRoh | null {
  const category = row["Category"] ?? "";
  if (category === AUSGELISTET) return null;
  const name = cleanName(row["Item name"] ?? "");
  const price = Number(String(row["Price"] ?? "").replace(",", "."));
  const sumupId = row["Item id (Do not change)"] ?? "";
  if (!name || !sumupId || !Number.isFinite(price)) return null;
  return {
    sumupId,
    name,
    seller: seller(category, name),
    sku: row["SKU"] ?? "",
    price,
    grundpreis: grundpreis(name, price),
  };
}

export function kurzcode(productId: string): string {
  return productId.slice(0, 6);
}

// ---------- PDF ----------

const MM = 72 / 25.4;
const W = 40 * MM;
const H = 30 * MM;
const MODUL = 0.75 * MM;
/** Fest auf Produktion: die Etiketten kleben am Regal, egal wo sie gedruckt wurden. */
const BASIS_URL = "https://www.tryhub42.de";

/** Woerter fuer den Umbruch; Zahl + Einheit bleiben ein Wort („910 g“). */
function woerter(text: string): string[] {
  const raw = text.split(" ");
  const out: string[] = [];
  for (const w of raw) {
    if (out.length && /^(kg|g|ml|l|Mon\.)$/.test(w) && /\d$/.test(out[out.length - 1])) {
      out[out.length - 1] += ` ${w}`;
    } else out.push(w);
  }
  return out;
}

/** Umbruch mit eigener Breite je Zeile; widths.length = max. Zeilen, Rest mit „…“. */
function umbruch(text: string, font: PDFFont, size: number, widths: number[]): string[] {
  const lines: string[] = [];
  let cur = "";
  const ws = woerter(text);
  for (let i = 0; i < ws.length; i++) {
    const t = cur ? `${cur} ${ws[i]}` : ws[i];
    if (font.widthOfTextAtSize(t, size) <= widths[Math.min(lines.length, widths.length - 1)]) {
      cur = t;
      continue;
    }
    lines.push(cur);
    cur = ws[i];
    if (lines.length === widths.length) {
      let last = lines[lines.length - 1];
      const width = widths[widths.length - 1];
      while (last && font.widthOfTextAtSize(`${last}…`, size) > width) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last.trimEnd()}…`;
      return lines;
    }
  }
  lines.push(cur);
  return lines;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

function zeichneEtikett(page: PDFPage, f: Fonts, e: Etikett, url: string) {
  const schwarz = rgb(0, 0, 0);
  const m = 1.5 * MM;
  const textW = W - 2 * m;

  // QR rechts unten, Module als zusammenhaengende Zeilenlaeufe, leicht
  // ueberlappend → keine Haarlinien
  const qr = QRCode.create(url, { errorCorrectionLevel: "L" }).modules;
  const n = qr.size;
  const qx = W - 1.5 * MM - n * MODUL;
  const qy = 1.5 * MM;
  const eps = 0.05 * MM;
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!qr.get(r, c)) {
        c++;
        continue;
      }
      const start = c;
      while (c < n && qr.get(r, c)) c++;
      page.drawRectangle({
        x: qx + start * MODUL,
        y: qy + (n - 1 - r) * MODUL - eps,
        width: (c - start) * MODUL + eps,
        height: MODUL + 2 * eps,
        color: schwarz,
      });
    }
  }
  const qrTop = qy + n * MODUL;

  page.drawText(`Verkäufer: ${e.seller}`.slice(0, 40), {
    x: m, y: H - m - 5, size: 5.5, font: f.regular, color: schwarz,
  });

  // Name: bis zu 3 Zeilen; Zeilen auf QR-Hoehe nur links vom QR
  const step = 7.5;
  let y = H - m - 5 - step;
  const widths = [0, 1, 2].map((i) =>
    y - i * step - 2 > qrTop + 1 * MM ? textW : qx - m - 1.5 * MM
  );
  for (const line of umbruch(e.name, f.bold, 7, widths)) {
    page.drawText(line, { x: m, y, size: 7, font: f.bold, color: schwarz });
    y -= step;
  }

  // Preis links unten, mit Ruhezone zum QR
  const leftW = qx - m - 1.5 * MM;
  const preis = euro(e.price);
  let size = 15;
  while (f.bold.widthOfTextAtSize(preis, size) > leftW && size > 9) size -= 0.5;
  page.drawText(preis, { x: m, y: m + 14, size, font: f.bold, color: schwarz });
  if (e.grundpreis) {
    page.drawText(e.grundpreis, { x: m, y: m + 6.5, size: 5, font: f.regular, color: schwarz });
  }
  page.drawText("Scannen & bewerten", { x: m, y: m, size: 4.5, font: f.italic, color: schwarz });
}

/** Ein Etikett pro Seite, Seite hochkant 30x40 mm, Inhalt um 90° gedreht. */
export async function etikettenPdf(etiketten: Etikett[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Hub42 Etiketten");
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  for (const e of etiketten) {
    const page = doc.addPage([H, W]);
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(0, 1, -1, 0, H, 0));
    zeichneEtikett(page, fonts, e, `${BASIS_URL}/q/${kurzcode(e.productId)}`);
    page.pushOperators(popGraphicsState());
  }
  return doc.save();
}
