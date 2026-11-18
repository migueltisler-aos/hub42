// Beleg-Download: nur eigene, finale Abrechnung; kurzlebige signierte URL.
import { NextResponse, type NextRequest } from "next/server";
import { aktuelleMarke } from "@/lib/marke";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; beleg: string }> }) {
  const m = await aktuelleMarke();
  if (!m) return NextResponse.redirect(new URL("/marke/login", request.url));
  const { id, beleg } = await params;
  if (beleg !== "gutschrift" && beleg !== "rechnung") return new NextResponse("Nicht gefunden", { status: 404 });

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("abrechnungen")
    .select("gs_pdf_pfad, rg_pdf_pfad")
    .eq("id", id)
    .eq("brand_id", m.brandId)
    .in("status", ["final", "bezahlt"])
    .maybeSingle();
  const pfad = beleg === "gutschrift" ? data?.gs_pdf_pfad : data?.rg_pdf_pfad;
  if (!pfad) return new NextResponse("Nicht gefunden", { status: 404 });

  const { data: link } = await db.storage.from("marken").createSignedUrl(pfad, 60, { download: true });
  if (!link?.signedUrl) return new NextResponse("Nicht gefunden", { status: 404 });
  return NextResponse.redirect(link.signedUrl);
}
