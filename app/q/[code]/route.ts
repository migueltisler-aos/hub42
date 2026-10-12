import type { NextRequest } from "next/server";
import { redirectShortCode } from "@/lib/short-code";

// Regaletiketten und A6-Artikelkarten: Shopping-QR. Im Event-Modus die schnelle Kauf-Bewertung.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return redirectShortCode(request, (await params).code, "kauf");
}
