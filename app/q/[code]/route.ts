import type { NextRequest } from "next/server";
import { redirectShortCode } from "@/lib/short-code";

// Regaletiketten und A6-Artikelkarten: Regal-QR. Im Event-Modus die schnelle „Angeschaut“-Bewertung
// (gescannt wird vor dem Kauf; den Kauf selbst liefert die SumUp-Kasse).
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return redirectShortCode(request, (await params).code, "angeschaut");
}
