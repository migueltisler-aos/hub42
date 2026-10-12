import type { NextRequest } from "next/server";
import { redirectShortCode } from "@/lib/short-code";

// Tasting-QR am Probierstand: im Event-Modus die Geschmacks-Bewertung.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return redirectShortCode(request, (await params).code, "tasting");
}
