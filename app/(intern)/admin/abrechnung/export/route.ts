// Kontroll-CSV und SEPA-Datei für den Zahllauf. Liegt unter /admin, also
// hinter dem Team-Passwort (proxy.ts).
import { NextResponse, type NextRequest } from "next/server";
import { ladeZahllauf } from "@/lib/abrechnung-lauf";
import { hub42Firma } from "@/lib/hub42-firma";
import { kontrollCsv, painXml } from "@/lib/sepa";

export async function GET(request: NextRequest) {
  const monat = request.nextUrl.searchParams.get("monat") ?? "";
  const format = request.nextUrl.searchParams.get("format");
  if (!/^\d{4}-\d{2}$/.test(monat)) return new NextResponse("monat=YYYY-MM fehlt", { status: 400 });

  const posten = await ladeZahllauf(monat);
  if (format === "sepa") {
    const f = hub42Firma();
    if (!f.iban) return new NextResponse("HUB42_IBAN ist nicht gesetzt.", { status: 400 });
    const fehlend = posten.filter((p) => !p.iban);
    if (fehlend.length) return new NextResponse(`IBAN fehlt bei: ${fehlend.map((p) => p.brand_name).join(", ")}`, { status: 400 });
    const heute = new Date().toISOString().slice(0, 10);
    const body = painXml({
      nachrichtId: `HUB42-${monat}-${Date.now()}`,
      auftraggeber: { name: f.kontoinhaber, iban: f.iban, bic: f.bic },
      ausfuehrung: heute,
      posten: posten.map((p) => ({
        empfaenger: p.kontoinhaber || p.brand_name,
        iban: p.iban,
        bic: p.bic,
        betrag_ct: p.auszahlung_ct,
        verwendungszweck: `Gutschrift ${p.gs_nr} Kommission ${monat} Testkaufhaus`,
        referenz: p.gs_nr,
      })),
    });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="sepa-auszahlung-${monat}.xml"`,
      },
    });
  }

  const csv = kontrollCsv(posten.map((p) => ({ ...p, zeitraum: monat })));
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zahlungsdatei-${monat}.csv"`,
    },
  });
}
