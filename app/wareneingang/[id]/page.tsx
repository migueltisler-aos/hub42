import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ladeChargeMitSendung,
  ladeNachschubEmail,
  ladeSendungMitChargen,
  nachbestellungAusloesen,
  pruefeNachbestellungGesperrt,
} from "@/lib/wareneingang";

export const dynamic = "force-dynamic";

async function nachbestellungAction(chargeId: string, formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const ausgeloestVon = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const charge = await ladeChargeMitSendung(chargeId);
  if (!charge) return;

  const gesperrt = await pruefeNachbestellungGesperrt(charge.ean, charge.sendung.standort_id);
  if (gesperrt) {
    redirect(`/wareneingang/${charge.sendung_id}?gesperrt=${chargeId}`);
  }

  const brandId = charge.sendung.brand_id;
  const nachschubEmail = brandId ? await ladeNachschubEmail(brandId) : null;

  await nachbestellungAusloesen({
    charge_id: charge.id,
    brand_id: brandId,
    ean: charge.ean,
    artikel_name: charge.artikel_name,
    menge_angefragt: Number(formData.get("menge_angefragt")) || null,
    nachschub_email: nachschubEmail,
    ausgeloest_von: ausgeloestVon,
  });

  redirect(`/wareneingang/${charge.sendung_id}?nachbestellt=${chargeId}`);
}

export default async function SendungDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nachbestellt?: string; gesperrt?: string }>;
}) {
  const { id } = await params;
  const { nachbestellt, gesperrt } = await searchParams;
  const sendung = await ladeSendungMitChargen(id);

  if (!sendung) {
    return (
      <div className="min-h-screen bg-green-dark flex items-center justify-center">
        <p className="text-cream font-mono">Paket nicht gefunden.</p>
      </div>
    );
  }

  const nachschubEmail = sendung.brand_id ? await ladeNachschubEmail(sendung.brand_id) : null;
  const chargenMitQr = await Promise.all(
    sendung.chargen.map(async (c) => ({
      ...c,
      qr: await QRCode.toDataURL(c.charge_code, { margin: 1, width: 180 }),
      bereitsGesperrt: await pruefeNachbestellungGesperrt(c.ean, sendung.standort_id),
    }))
  );

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/wareneingang" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
          ← Wareneingang
        </Link>
        <h1
          className="text-cream text-4xl tracking-widest mt-3 mb-2"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Paket vom {new Date(sendung.eingegangen_am).toLocaleDateString("de-DE")}
        </h1>
        <p className="text-stone text-xs font-mono mb-8">
          {sendung.dhl_tracking_nr ?? "kein DHL-Tracking"} · {sendung.standort_id} · erfasst von{" "}
          {sendung.eingegangen_von ?? "Unbekannt"}
        </p>

        <div className="space-y-6">
          {chargenMitQr.map((c) => (
            <div key={c.id} className="grid sm:grid-cols-[180px_1fr] gap-6 border border-stone-dark p-5">
              <div className="bg-sage-warm p-3 flex flex-col items-center text-center h-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.qr} alt={`QR-Code für Charge ${c.charge_code}`} className="w-full" />
                <p className="text-green-dark text-[11px] font-mono mt-2">{c.charge_code}</p>
                <p className="text-stone-dark text-[9px] font-mono mt-1">Für Pufferlager-Etikett</p>
              </div>

              <div>
                <p className="text-cream text-lg">{c.artikel_name ?? c.ean}</p>
                <div className="space-y-1 text-sm font-mono mt-2">
                  <p className="text-stone">
                    EAN <span className="text-cream ml-2">{c.ean}</span>
                  </p>
                  <p className="text-stone">
                    Menge <span className="text-cream ml-2">{c.menge} Stk</span>
                  </p>
                  {c.mhd && (
                    <p className="text-stone">
                      MHD <span className="text-cream ml-2">{c.mhd}</span>
                    </p>
                  )}
                </div>

                <div className="mt-4 border-t border-stone-dark pt-4">
                  {nachbestellt === c.id && (
                    <p className="text-emerald-400 text-xs font-mono mb-3">
                      Nachbestellung erfasst
                      {nachschubEmail
                        ? ` — bitte aktuell noch manuell an ${nachschubEmail} schreiben (Mailversand ist noch nicht automatisiert).`
                        : " — kein Nachschub-Kontakt hinterlegt, bitte im Angebot/bei der Brand nachtragen."}
                    </p>
                  )}
                  {gesperrt === c.id && (
                    <p className="text-red-400 text-xs font-mono mb-3">
                      Nachbestellung nicht ausgelöst — für diesen Artikel läuft bereits eine Nachbestellung
                      (weder Ware eingegangen noch 3 Werktage vergangen).
                    </p>
                  )}
                  {c.bereitsGesperrt ? (
                    <p className="text-stone/50 text-xs font-mono">
                      Nachbestellung bereits ausgelöst — gesperrt bis Wareneingang oder 3 Werktage vergangen.
                    </p>
                  ) : (
                    <form action={nachbestellungAction.bind(null, c.id)} className="flex items-end gap-3">
                      <div>
                        <label className="block text-stone text-[10px] font-mono uppercase tracking-widest mb-1">
                          Menge anfragen
                        </label>
                        <input
                          name="menge_angefragt"
                          type="number"
                          min={1}
                          defaultValue={c.menge}
                          className="w-24 bg-green-dark border border-stone-dark text-cream px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-bronze"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
                      >
                        Nachbestellung auslösen →
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
