import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { createProduct, getProducts, type DifferentialPair } from "@/lib/feedback";

export const dynamic = "force-dynamic";

function parseAttributes(raw: string): DifferentialPair[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, right] = line.split("|").map((s) => s.trim());
      return { left: left ?? "", right: right ?? left ?? "" };
    })
    .filter((pair) => pair.left);
}

async function createProductAction(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  await createProduct({
    name,
    brand: (formData.get("brand") as string)?.trim() || null,
    store: (formData.get("store") as string)?.trim() || null,
    shelf_code: (formData.get("shelf_code") as string)?.trim() || null,
    batch: (formData.get("batch") as string)?.trim() || null,
    attributes: parseAttributes((formData.get("attributes") as string) ?? ""),
    price_enabled: formData.get("price_enabled") === "on",
  });

  redirect("/feedback/admin");
}

async function getBaseUrl(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

export default async function FeedbackAdminPage() {
  const [products, baseUrl] = await Promise.all([getProducts(), getBaseUrl()]);

  const productsWithQr = await Promise.all(
    products.map(async (p) => {
      const targetUrl = `${baseUrl}/feedback/r/${p.id}`;
      const qr = await QRCode.toDataURL(targetUrl, { margin: 1, width: 220 });
      return { ...p, targetUrl, qr };
    })
  );

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2">
              Hub42 Intern
            </p>
            <h1
              className="text-cream text-4xl tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Feedback-Studio · Produkte
            </h1>
          </div>
          <div className="flex gap-6">
            <Link
              href="/feedback/admin/settings"
              className="text-bronze text-xs font-mono uppercase tracking-widest hover:text-bronze-light transition-colors"
            >
              Schwellen →
            </Link>
            <Link
              href="/feedback/admin/redeem"
              className="text-bronze text-xs font-mono uppercase tracking-widest hover:text-bronze-light transition-colors"
            >
              Ticket einlösen →
            </Link>
            <Link
              href="/feedback/admin/results"
              className="text-bronze text-xs font-mono uppercase tracking-widest hover:text-bronze-light transition-colors"
            >
              Auswertung →
            </Link>
          </div>
        </div>

        <div className="bg-green-mid border border-stone-dark p-6 mb-10">
          <h2 className="text-cream text-sm font-mono uppercase tracking-widest mb-4">
            Neues Produkt anlegen
          </h2>
          <form action={createProductAction} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Produktname *
              </label>
              <input
                name="name"
                required
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Marke
              </label>
              <input
                name="brand"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Store / Standort
              </label>
              <input
                name="store"
                placeholder="z.B. Hub42 Alexa"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Regalplatz
              </label>
              <input
                name="shelf_code"
                placeholder="z.B. Regal 4B"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Charge
              </label>
              <input
                name="batch"
                placeholder="z.B. 2026-07"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-stone text-xs font-mono uppercase tracking-widest">
                <input type="checkbox" name="price_enabled" className="accent-bronze" />
                Preisfrage (Van Westendorp) aktivieren
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Semantisches Differential — eine Zeile pro Achse, Format: <code>links | rechts</code>
              </label>
              <textarea
                name="attributes"
                rows={3}
                placeholder={"künstlich wirkend | natürlich wirkend\nunauffällig | auffällig\ngünstig wirkend | hochwertig wirkend"}
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
              >
                Produkt anlegen →
              </button>
            </div>
          </form>
        </div>

        <h2 className="text-cream text-sm font-mono uppercase tracking-widest mb-4">
          {productsWithQr.length} Produkt{productsWithQr.length === 1 ? "" : "e"}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productsWithQr.map((p) => (
            <div key={p.id} className="bg-sage-warm p-4 flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.qr} alt={`QR-Code für ${p.name}`} className="w-36 h-36 mb-3" />
              <p className="text-green-dark font-semibold">{p.name}</p>
              {p.brand && <p className="text-stone-dark text-xs">{p.brand}</p>}
              <p className="text-stone-dark text-xs font-mono mt-1">
                {[p.store, p.shelf_code, p.batch].filter(Boolean).join(" · ") || "kein Kontext"}
              </p>
              <div className="flex gap-3 mt-3 text-xs font-mono uppercase tracking-widest">
                <a href={p.targetUrl} target="_blank" rel="noreferrer" className="text-green-dark underline hover:text-bronze-dark">
                  Testen
                </a>
                <Link href={`/feedback/admin/results#${p.id}`} className="text-green-dark underline hover:text-bronze-dark">
                  Auswertung
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
